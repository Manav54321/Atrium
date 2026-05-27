"""Atrium — LiveKit voice agent (Patient persona, real-time).

Runs as a separate process from the FastAPI server. Joins every LiveKit
room created by the frontend and roleplays the patient over WebRTC:

    Browser mic → LiveKit WebRTC
                → Deepgram STT (streaming transcription)
                → Groq LLM (patient persona reasoning, llama-3.3-70b-versatile)
                → Cartesia TTS (low-latency synthesis)
                → LiveKit WebRTC → Browser audio playback

The persona prompt and voice ID come from room metadata (set by the
backend `/voice/token` endpoint when the room is created), so this
worker has zero patient-specific knowledge — the server owns that.

Run:
    backend/.venv-voice/bin/python backend/voice_agent.py dev
"""

from __future__ import annotations

import asyncio
import json
import logging
import os
import re
import time
from pathlib import Path
from typing import Any

from dotenv import load_dotenv
from livekit import agents, rtc
from livekit.agents import Agent, AgentSession, RoomInputOptions, WorkerOptions, cli
from livekit.plugins import cartesia, deepgram, openai, silero


def _load_env_local() -> None:
    """Minimal .env.local loader."""
    env_path = Path(__file__).resolve().parent / ".env.local"
    if not env_path.exists():
        return
    for raw in env_path.read_text(encoding="utf-8").splitlines():
        line = raw.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, value = line.partition("=")
        key = key.strip()
        value = value.strip().strip('"').strip("'")
        if key:
            os.environ[key] = value


# Load .env.local first (project convention), .env as fallback.
_BACKEND = Path(__file__).resolve().parent
_load_env_local()
load_dotenv(_BACKEND / ".env.local")
load_dotenv(_BACKEND / ".env")

logger = logging.getLogger("atrium.voice-agent")
logger.setLevel(logging.DEBUG)


# ---------------------------------------------------------------------------
# Cartesia voice UUIDs — age-group + gender bucketed pools.
# ---------------------------------------------------------------------------
CARTESIA_VOICE_POOLS: dict[str, list[str]] = {
    "young_M":  ["95856005-0332-41b0-935f-352e296aa0df"],
    "middle_M": ["6f84f4b2-23f3-4b2e-8892-3f3a0a83b8f9"],
    "elder_M":  ["6f84f4b2-23f3-4b2e-8892-3f3a0a83b8f9"],
    "young_F":  ["248be419-c632-4f23-adf1-5324ed7dbf1d"],
    "middle_F": ["248be419-c632-4f23-adf1-5324ed7dbf1d"],
    "elder_F":  ["573e3144-a684-4e72-ac2b-9b2063a50b53"],
}

DEFAULT_VOICE_ID = CARTESIA_VOICE_POOLS["middle_M"][0]


# ── Persona guard prefix ──────────────────────────────────────────────────
PERSONA_GUARD_PREFIX = """\
═══ ABSOLUTE IDENTITY LOCK — READ THIS FIRST ═══
You are a PATIENT (or parent, for pediatric cases) in a real medical encounter.
You are NOT an AI assistant. You are NOT a doctor. You are NOT a medical educator.
You do NOT diagnose. You do NOT suggest treatments. You do NOT list symptoms.
You speak ONLY as the sick person sitting in front of the doctor.
Every single reply must be 1–2 short spoken sentences. Never exceed 40 words.
No bullet points. No asterisks. No stage directions. No "As an AI".
No medical jargon. ONLY natural spoken words.

If the doctor asks something completely unrelated to medicine or your visit,
deflect in-character: "I'm sorry doctor, I really just want to talk about how I'm feeling."

NEVER break character. NEVER explain yourself. NEVER start a reply with "Sure" or "Certainly".

"""

DEFAULT_INSTRUCTIONS = (
    PERSONA_GUARD_PREFIX +
    "You are a patient speaking to a doctor. Keep replies to 1-2 short spoken "
    "sentences. Output spoken dialogue only — no stage directions, no asterisks."
)
DEFAULT_INITIAL = "Hi doc."

# Maximum conversation turns to keep in context.
# Beyond this, oldest turns are pruned to prevent persona drift.
MAX_CONTEXT_TURNS = 16

# Drift correction system turn — injected when drift is detected.
DRIFT_CORRECTION_TURN = (
    "CORRECTION: Your last response broke character. "
    "You are a patient, NOT an AI, NOT a doctor. "
    "Respond ONLY as the patient. No medical terms, no AI disclosure, no lists. "
    "1-2 short spoken sentences. Pure dialogue only."
)

# Mid-conversation reinforcement — injected every N turns to prevent drift.
REINFORCEMENT_INTERVAL = 8

# Temperature schedule — progressively reduces creativity to anchor persona.
TEMP_SCHEDULE = [
    (10, 0.4),   # turns 0-10: 0.4
    (20, 0.3),   # turns 10-20: 0.3
    (999, 0.25), # turns 20+: 0.25
]


def _hash_str(s: str) -> int:
    """FNV-1a hash — mirrors src/voice/patientPersona.ts."""
    h = 0x811C9DC5
    for ch in s:
        h ^= ord(ch)
        h = (h * 0x01000193) & 0xFFFFFFFF
    return h


def pick_voice(case_id: str, gender: str, age: int = 35) -> str:
    """Return a deterministic Cartesia voice UUID."""
    g = gender.upper() if gender.upper() in ("M", "F") else "M"
    bucket = (
        f"young_{g}"  if age < 36 else
        f"middle_{g}" if age < 60 else
        f"elder_{g}"
    )
    pool = CARTESIA_VOICE_POOLS.get(bucket) or CARTESIA_VOICE_POOLS[f"middle_{g}"]
    chosen = pool[_hash_str(case_id) % len(pool)]
    logger.debug(
        "[VoicePicker] case=%s gender=%s age=%d bucket=%s → voice=%s",
        case_id, gender, age, bucket, chosen,
    )
    return chosen


def inject_persona_guard(system_prompt: str) -> str:
    """Prepend the persona guard prefix if not already present."""
    if system_prompt.startswith("═══ ABSOLUTE IDENTITY LOCK"):
        return system_prompt
    return PERSONA_GUARD_PREFIX + system_prompt


def build_opening_instruction(initial_line: str, severity: str) -> str:
    """Construct an emotionally-tuned opening-line instruction."""
    delivery = (
        "Speak with urgency and fear — short, fragmented sentences like you are struggling."
        if severity == "critical" else
        "Sound visibly distressed and anxious — brief, uncomfortable."
        if severity == "urgent" else
        "Sound worried but composed. Natural, conversational pacing."
    )
    return (
        f"Stay strictly in character as the patient (or parent for pediatric cases). "
        f"You are NOT an AI. You are a real person experiencing symptoms. "
        f"{delivery} "
        f'Speak this opening line naturally as you arrive: "{initial_line}". '
        f"One or two short sentences only. Pure spoken words — no stage directions."
    )


def build_reinforcement(patient_name: str) -> str:
    """Build a mid-conversation identity reinforcement message."""
    return (
        f"REMINDER: You are still {patient_name}. Stay in character. "
        f"1-2 sentences only. No medical jargon. No bullet points. "
        f"No AI disclosure. Only speak as a patient would."
    )


# ---------------------------------------------------------------------------
# Language detection
# ---------------------------------------------------------------------------
HINDI_ROMAN_WORDS = {
    "haan", "nahi", "nahin", "thoda", "thodi", "raha", "rahi", "rahe", "hai", "hain",
    "kal", "aaj", "parso", "parson", "kyun", "kyon", "aap", "tum", "mera", "meri", "mere",
    "mujhe", "bhi", "aur", "ka", "ki", "ke", "se", "ko", "tha", "thi", "the", "hoga",
    "hogi", "kuch", "kuchh", "ab", "ji", "dard", "pet", "sar", "sir", "dono", "sab", "toh",
    "sath", "saath", "baad", "pehle", "kya", "kyu", "kaise", "kab", "kaha", "kahan",
    "kaun", "hum", "main", "mein", "yeh", "woh", "voh", "ne", "gaya", "gayi", "gaye",
    "kar", "karna", "kiya", "diya", "liya", "aaya", "aayi", "lag", "rha", "rhi", "rhe",
    "achha", "accha", "bahut", "bohot", "theek", "thik",
}


def detect_language(text: str) -> str:
    """Detect Hindi (including Hinglish) vs English."""
    if not text:
        return "English"
    if re.search(r"[\u0900-\u097f]", text):
        return "Hindi"
    words = re.findall(r"[a-zA-Z']+", text.lower())
    if not words:
        return "English"
    hindi_word_count = sum(1 for w in words if w in HINDI_ROMAN_WORDS)
    if len(words) <= 3 and hindi_word_count >= 1:
        return "Hindi"
    elif len(words) > 3 and (hindi_word_count / len(words)) >= 0.15:
        return "Hindi"
    return "English"


# ---------------------------------------------------------------------------
# Persona drift detection
# ---------------------------------------------------------------------------
DRIFT_PATTERNS = [
    r"\bas an ai\b",
    r"\bi am an ai\b",
    r"\blanguage model\b",
    r"\bi cannot assist\b",
    r"\bhere are (the|some|your) (symptoms|findings|results|steps)\b",
    r"\b(differential|diagnosis|diagnose|diagnoses|diagnostic)\b",
    r"\b(recommend|prescribe|treatment plan|management plan)\b",
    r"\bsure[,!]?\s+(here|i can|let me)\b",
    r"\bcertainly[,!]?\s",
    r"\bof course[,!]?\s",
    r"\bglad to help\b",
    r"\bhope that helps\b",
    r"\*[^*]+\*",  # asterisk actions like *winces*
]
_DRIFT_RE = re.compile("|".join(DRIFT_PATTERNS), re.IGNORECASE)


def check_drift(text: str, case_id: str) -> bool:
    """Returns True if a drift pattern is detected. Logs a WARNING."""
    if _DRIFT_RE.search(text):
        logger.warning(
            "[DRIFT DETECTED] case=%s text=%r matched drift pattern",
            case_id, text[:200],
        )
        return True
    return False


def parse_metadata(raw: str | None) -> dict:
    if not raw:
        return {}
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        logger.warning("room metadata is not valid JSON: %r", raw[:120])
        return {}


# ---------------------------------------------------------------------------
# Event-driven watchdog (replaces polling-based watchdog)
# ---------------------------------------------------------------------------

class SessionWatchdog:
    """Monitors AgentSession state transitions using event-driven callbacks.
    
    Unlike the old polling watchdog, this listens for state_changed events
    and only intervenes when a state has exceeded its timeout. Uses ONLY
    public AgentSession APIs — no private method access.
    """
    
    THINKING_TIMEOUT = 10.0
    SPEAKING_TIMEOUT = 30.0
    
    def __init__(self, session: AgentSession, severity: str, case_id: str):
        self.session = session
        self.severity = severity
        self.case_id = case_id
        self.last_state = "listening"
        self.state_changed_at = time.monotonic()
        self.user_lang = "English"
        self._task: asyncio.Task | None = None
        self._stop = asyncio.Event()
    
    def start(self):
        """Start the watchdog monitor."""
        self._stop.clear()
        self._task = asyncio.create_task(self._run())
        
        # Listen for user language
        @self.session.on("user_input_transcribed")
        def _on_user_transcribed(ev):
            text = ev.transcript.strip()
            if text:
                self.user_lang = detect_language(text)
        
        logger.info("[Watchdog] Started event-driven session monitor for case=%s", self.case_id)
    
    def stop(self):
        """Stop the watchdog monitor."""
        self._stop.set()
        if self._task and not self._task.done():
            self._task.cancel()
    
    async def _run(self):
        """Check state durations at a gentle interval — but only intervene
        when a state exceeds its timeout threshold."""
        try:
            while not self._stop.is_set():
                await asyncio.sleep(1.0)
                
                current_state = self.session.agent_state
                now = time.monotonic()
                
                if current_state != self.last_state:
                    logger.debug("[Watchdog] State: %s → %s", self.last_state, current_state)
                    self.last_state = current_state
                    self.state_changed_at = now
                    continue
                
                duration = now - self.state_changed_at
                
                if current_state == "thinking" and duration > self.THINKING_TIMEOUT:
                    logger.error(
                        "[Watchdog] STALL: Agent stuck in THINKING for %.1fs. Recovering...",
                        duration,
                    )
                    await self._recover("thinking")
                    self.state_changed_at = time.monotonic()
                    
                elif current_state == "speaking" and duration > self.SPEAKING_TIMEOUT:
                    logger.error(
                        "[Watchdog] STALL: Agent stuck in SPEAKING for %.1fs. Recovering...",
                        duration,
                    )
                    await self._recover("speaking")
                    self.state_changed_at = time.monotonic()
                    
        except asyncio.CancelledError:
            logger.info("[Watchdog] Monitor stopped (cancelled).")
        except Exception as e:
            logger.exception("[Watchdog] Monitor error: %s", e)
    
    async def _recover(self, stuck_state: str):
        """Recover from a stuck state using ONLY public APIs."""
        # Step 1: Force interrupt current speech/generation
        try:
            interrupt_fut = self.session.interrupt(force=True)
            await asyncio.wait_for(interrupt_fut, timeout=3.0)
            logger.info("[Watchdog] Interrupted session from %s state.", stuck_state)
        except asyncio.TimeoutError:
            logger.warning("[Watchdog] Interrupt timed out — session may auto-recover.")
        except Exception as e:
            logger.warning("[Watchdog] Interrupt failed: %s", e)
        
        # Step 2: Speak an in-character recovery line
        recovery_line = self._pick_recovery_line()
        logger.info("[Watchdog] Speaking recovery line: %r", recovery_line)
        try:
            self.session.say(recovery_line, allow_interruptions=True, add_to_chat_ctx=True)
        except Exception as e:
            logger.exception("[Watchdog] Recovery line failed: %s", e)
    
    def _pick_recovery_line(self) -> str:
        """Select an in-character recovery line based on severity and language."""
        if self.user_lang == "Hindi":
            if self.severity == "stable":
                return "Mujhe samajh nahi aaya, please fir se boliye."
            return "Dard ki wajah se main theek se sun nahi payi. Kya aap fir se bolenge?"
        
        if self.severity == "critical":
            return "I'm sorry... I'm struggling to hear... could you say that again?"
        elif self.severity == "urgent":
            return "I'm sorry doc, I'm feeling really dizzy. What did you say?"
        return "Sorry, I didn't quite catch that. Could you repeat it?"


# ---------------------------------------------------------------------------
# Entrypoint
# ---------------------------------------------------------------------------

async def entrypoint(ctx: agents.JobContext):
    logger.info("[Lifecycle] Backend worker session starting for room %s", ctx.room.name)
    await ctx.connect()
    logger.info("[Lifecycle] Room connected: room=%s", ctx.room.name)

    # ── Room event listeners ────────────────────────────────────────────────
    @ctx.room.on("participant_connected")
    def _on_participant_connected(participant):
        logger.info("Participant connected: %s", participant.identity)

    @ctx.room.on("participant_disconnected")
    def _on_participant_disconnected(participant):
        logger.info("Participant disconnected: %s", participant.identity)

    @ctx.room.on("track_subscribed")
    def _on_track_subscribed(track, publication, participant):
        logger.info(
            "Track subscribed: %s (%s) from participant %s",
            track.sid, track.kind, participant.identity,
        )

    # ── Parse room metadata ─────────────────────────────────────────────────
    meta = parse_metadata(ctx.room.metadata)
    case_id         = meta.get("caseId") or meta.get("case_id") or "unknown"
    speaker_gender  = (meta.get("voiceGender") or meta.get("gender") or "M").upper()
    raw_prompt      = meta.get("systemPrompt") or DEFAULT_INSTRUCTIONS
    initial_line    = meta.get("initialLine") or DEFAULT_INITIAL
    patient_age     = int(meta.get("age", 35))
    severity        = (meta.get("severity") or "stable").lower()

    system_prompt = inject_persona_guard(raw_prompt)
    cartesia_voice_id = meta.get("voiceId") or pick_voice(case_id, speaker_gender, patient_age)

    logger.info(
        "joining room=%s case=%s gender=%s age=%d severity=%s voice=%s",
        ctx.room.name, case_id, speaker_gender, patient_age, severity, cartesia_voice_id,
    )
    logger.debug(
        "[SystemPrompt] length=%d chars. First 200: %r",
        len(system_prompt), system_prompt[:200],
    )

    # ── Validate required env vars ──────────────────────────────────────────
    groq_api_key = os.environ.get("GROQ_API_KEY")
    deepgram_api_key = os.environ.get("DEEPGRAM_API_KEY")
    cartesia_api_key = os.environ.get("CARTESIA_API_KEY")

    if not groq_api_key:
        raise RuntimeError("GROQ_API_KEY is not set — cannot start voice agent.")
    if not deepgram_api_key:
        raise RuntimeError("DEEPGRAM_API_KEY is not set — cannot start voice agent.")
    if not cartesia_api_key:
        raise RuntimeError("CARTESIA_API_KEY is not set — cannot start voice agent.")

    logger.debug("All required API keys present (GROQ, DEEPGRAM, CARTESIA). ✓")

    # ── Build pipeline components ───────────────────────────────────────────
    stt = deepgram.STT(
        model="nova-3",
        language="multi",
        api_key=deepgram_api_key,
    )
    logger.info("[STT] Deepgram nova-3 (multilingual) initialized. ✓")

    vad = silero.VAD.load()
    logger.info("[VAD] Silero loaded. ✓")

    llm = openai.LLM(
        model="llama-3.3-70b-versatile",
        base_url="https://api.groq.com/openai/v1",
        api_key=groq_api_key,
        temperature=0.4,
    )
    logger.info("[LLM] Groq llama-3.3-70b-versatile initialized (temp=0.4). ✓")

    tts = cartesia.TTS(
        model="sonic-2",
        voice=cartesia_voice_id,
        language="en",
        api_key=cartesia_api_key,
    )
    logger.info("[TTS] Cartesia sonic-2 (voice=%s) initialized. ✓", cartesia_voice_id)

    # ── Build AgentSession ──────────────────────────────────────────────────
    session = AgentSession(
        stt=stt,
        vad=vad,
        llm=llm,
        tts=tts,
        allow_interruptions=True,
    )

    agent = Agent(
        instructions=system_prompt,
    )

    # ── Turn counter and drift monitoring ──────────────────────────────────
    turn_count: int = 0
    drift_count: int = 0
    user_last_lang: str | None = None
    patient_last_lang: str | None = None

    # Extract patient name from the system prompt for reinforcement
    patient_name = "the patient"
    name_match = re.search(r"You are (\w+ \w+),", system_prompt)
    if name_match:
        patient_name = name_match.group(1)

    @session.on("user_input_transcribed")
    def _on_user_input_transcribed(ev: agents.voice.UserInputTranscribedEvent):
        nonlocal user_last_lang
        transcript = ev.transcript.strip()
        if not transcript:
            return
        user_lang = detect_language(transcript)
        logger.info(
            "[Language] User: %s | Text: %r", user_lang, transcript
        )
        if user_last_lang is not None and user_last_lang != user_lang:
            logger.info(
                "[Language] User switched %s → %s",
                user_last_lang, user_lang,
            )
        user_last_lang = user_lang

    @session.on("conversation_item_added")
    def _on_conversation_item_added(ev: agents.voice.ConversationItemAddedEvent):
        nonlocal patient_last_lang, drift_count, turn_count
        from livekit.agents import llm as agents_llm
        if isinstance(ev.item, agents_llm.ChatMessage) and ev.item.role == "assistant":
            text = ev.item.text_content
            if not text:
                return

            turn_count += 1

            # ── Temperature schedule (progressive reduction) ────────
            try:
                if turn_count >= 20:
                    llm._opts.temperature = 0.25
                elif turn_count >= 10:
                    llm._opts.temperature = 0.30
                else:
                    llm._opts.temperature = 0.40
                logger.debug(
                    "[LLM] Temperature adjusted to %s for turn %d",
                    llm._opts.temperature, turn_count,
                )
            except Exception as temp_err:
                logger.warning("[LLM] Failed to adjust temperature: %s", temp_err)

            # ── Drift detection with active correction ───────────────
            if check_drift(text, case_id):
                drift_count += 1
                logger.error(
                    "[DRIFT] case=%s drift_count=%d. Injecting correction turn.",
                    case_id, drift_count,
                )
                # Inject a corrective system turn so the NEXT response
                # is properly anchored. We don't regenerate the current
                # response (that would add latency) — we accept the one
                # bad line but prevent it from cascading.
                try:
                    from livekit.agents import llm as _llm
                    correction_msg = _llm.ChatMessage(
                        role="system",
                        content=DRIFT_CORRECTION_TURN,
                    )
                    session.chat_ctx.messages.append(correction_msg)
                    logger.info("[DRIFT] Corrective system turn injected.")
                except Exception as e:
                    logger.warning("[DRIFT] Failed to inject correction: %s", e)

            # ── Mid-conversation reinforcement ───────────────────────
            if turn_count > 0 and turn_count % REINFORCEMENT_INTERVAL == 0:
                try:
                    from livekit.agents import llm as _llm
                    reinforcement = _llm.ChatMessage(
                        role="system",
                        content=build_reinforcement(patient_name),
                    )
                    session.chat_ctx.messages.append(reinforcement)
                    logger.info(
                        "[Reinforcement] Identity reinforcement injected at turn %d.",
                        turn_count,
                    )
                except Exception as e:
                    logger.warning("[Reinforcement] Failed to inject: %s", e)

            # ── Context window pruning ───────────────────────────────
            # Keep system prompt + first user turn + last MAX_CONTEXT_TURNS
            try:
                msgs = session.chat_ctx.messages
                # Find non-system messages
                non_system = [(i, m) for i, m in enumerate(msgs) if m.role != "system"]
                if len(non_system) > MAX_CONTEXT_TURNS + 1:
                    # Keep the first non-system message (doctor's opening approach)
                    # and the last MAX_CONTEXT_TURNS messages
                    first_idx = non_system[0][0]
                    cutoff_idx = non_system[-(MAX_CONTEXT_TURNS)][0]
                    
                    if cutoff_idx > first_idx + 1:
                        # Prune messages between first non-system and cutoff
                        pruned = [m for i, m in enumerate(msgs) 
                                  if m.role == "system" or i == first_idx or i >= cutoff_idx]
                        pruned_count = len(msgs) - len(pruned)
                        if pruned_count > 0:
                            session.chat_ctx.messages[:] = pruned
                            logger.info(
                                "[ContextPrune] Pruned %d turns. Context: %d messages.",
                                pruned_count, len(pruned),
                            )
            except Exception as e:
                logger.warning("[ContextPrune] Failed: %s", e)

            # Language tracking
            patient_lang = detect_language(text)
            logger.info("[Language] Patient: %s | Text: %r", patient_lang, text)
            if patient_last_lang is not None and patient_last_lang != patient_lang:
                logger.info(
                    "[Language] Patient switched %s → %s",
                    patient_last_lang, patient_lang,
                )
            patient_last_lang = patient_lang

    @session.on("agent_speech_committed")
    def _on_agent_speech_committed(ev):
        logger.debug("[TTS] Agent speech committed.")

    @session.on("agent_speech_interrupted")
    def _on_agent_speech_interrupted(ev):
        logger.info("[TTS] Agent speech interrupted by user.")

    # ── Start session ───────────────────────────────────────────────────────
    logger.info("Starting AgentSession on room %s...", ctx.room.name)
    await session.start(
        agent=agent,
        room=ctx.room,
        room_input_options=RoomInputOptions(),
    )
    logger.info("AgentSession started successfully on room %s.", ctx.room.name)

    # Start the event-driven watchdog
    watchdog = SessionWatchdog(session, severity, case_id)
    watchdog.start()

    # ── Farewell RPC ────────────────────────────────────────────────────────
    FAREWELLS = [
        "Thank you, doctor. Take care.",
        "Okay, thanks doc. Goodbye.",
        "Thanks for your help. Bye.",
        "Alright, take care. Goodbye.",
    ]
    farewell_pick = FAREWELLS[_hash_str(case_id) % len(FAREWELLS)]

    @ctx.room.local_participant.register_rpc_method("farewell")
    async def _on_farewell(data: rtc.RpcInvocationData) -> str:
        logger.info("rpc farewell invoked by %s", data.caller_identity)
        try:
            await session.generate_reply(
                instructions=(
                    f"You are saying goodbye to the doctor who just finished your consultation. "
                    f"Stay in character as the patient. Speak only these words, nothing else: "
                    f"'{farewell_pick}'"
                )
            )
            logger.info("[Farewell] Speaking: %r", farewell_pick)
        except Exception as e:
            logger.exception("session.generate_reply (farewell) failed: %s", e)
            # Fallback: direct TTS
            try:
                session.say(farewell_pick, allow_interruptions=False, add_to_chat_ctx=True)
                logger.info("[Farewell] Fallback direct TTS: %r", farewell_pick)
            except Exception as say_err:
                logger.exception("[Farewell] Fallback TTS also failed: %s", say_err)
            return "error"
        return "ok"

    # ── Opening line ────────────────────────────────────────────────────────
    opening_instruction = build_opening_instruction(initial_line, severity)
    logger.debug("[Opening] Generating (severity=%s): %r", severity, initial_line)
    try:
        await session.generate_reply(instructions=opening_instruction)
        logger.info("[Opening] Opening line delivered (severity=%s).", severity)
    except Exception as e:
        logger.error("[Opening] Failed: %s. Attempting fallback...", e)
        try:
            session.say(initial_line, allow_interruptions=True, add_to_chat_ctx=True)
            logger.info("[Opening] Fallback direct TTS: %r", initial_line)
        except Exception as say_err:
            logger.exception("[Opening] Fallback TTS failed: %s", say_err)

    # ── Keep alive — event-driven, not polling ──────────────────────────────
    # Wait for room disconnection via event, not a busy-wait loop.
    disconnected = asyncio.Event()

    @ctx.room.on("disconnected")
    def _on_room_disconnected():
        logger.info("[Lifecycle] Room disconnected event received.")
        disconnected.set()

    try:
        # Also check periodically in case the event was missed
        while not disconnected.is_set():
            if not ctx.room.isconnected():
                logger.info("[Lifecycle] Room no longer connected (detected via poll).")
                break
            try:
                await asyncio.wait_for(disconnected.wait(), timeout=2.0)
            except asyncio.TimeoutError:
                continue
    except asyncio.CancelledError:
        logger.info("[Lifecycle] Backend worker task cancelled for room %s", ctx.room.name)
    finally:
        logger.info("[Lifecycle] Backend worker teardown started for room %s", ctx.room.name)
        
        # Stop watchdog
        watchdog.stop()

        # Close session and providers
        for name, resource in [
            ("session", session),
            ("stt", stt),
            ("llm", llm),
            ("tts", tts),
        ]:
            try:
                await resource.aclose()
                logger.info("[Lifecycle] %s closed for room %s", name, ctx.room.name)
            except Exception as e:
                logger.warning("Error closing %s: %s", name, e)

        logger.info("[Lifecycle] Backend worker session destruction complete for room %s", ctx.room.name)



# ---------------------------------------------------------------------------
# Entry
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    cli.run_app(
        WorkerOptions(entrypoint_fnc=entrypoint, agent_name="atrium-voice")
    )
