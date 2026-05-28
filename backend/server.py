"""
FastAPI backend for the Atrium simulator.

Hosts the attending grading proxy and the OpenAI Realtime client-secret
mint endpoint (`/voice/realtime-secret`). Real-time patient voice runs
directly between the browser and OpenAI Realtime over WebRTC.

GET  /health         → backend + agent status report
POST /agent/...      → OpenAI Assistants proxy (atrium-attending)
POST /voice/realtime-secret → mint a short-lived OpenAI Realtime secret
"""

from __future__ import annotations

import os
import threading
from pathlib import Path
from typing import Optional


def _load_env_local() -> None:
    """Minimal .env.local loader — no python-dotenv dependency.

    Reads `backend/.env.local` (next to this file) and sets any KEY=VALUE
    pair into ``os.environ``. Unconditionally overwrites values
    already set to prioritize local config over parent environment.
    Silently no-ops if the file is missing."""
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


_load_env_local()


def _validate_env() -> None:
    import sys

    openai_key = os.environ.get("OPENAI_API_KEY")
    if not openai_key:
        print(
            "WARNING: OPENAI_API_KEY is not set. Realtime voice, triage, and grading features will not work.",
            file=sys.stderr,
        )


_validate_env()

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from slowapi.util import get_remote_address

# Shared secret protects /agent/* and /voice/* against direct curl abuse.
# Vercel Edge Middleware injects this header for browser traffic; a
# missing/wrong value returns 401 before we burn any OpenAI
# credits. Localhost origins bypass for `npm run dev`.
SHARED_SECRET = os.environ.get("BACKEND_SHARED_SECRET", "")
ALLOWED_ORIGINS = ["https://atrium.vercel.app"]
for port in range(5173, 5185):
    ALLOWED_ORIGINS.append(f"http://localhost:{port}")
    ALLOWED_ORIGINS.append(f"http://127.0.0.1:{port}")

DEV_ORIGINS = {
    addr for addr in ALLOWED_ORIGINS if "localhost" in addr or "127.0.0.1" in addr
}

# Per-IP rate limit caps even authenticated abuse. SSE streams count as one
# request, so 120/min leaves plenty of headroom for legitimate use.
limiter = Limiter(key_func=get_remote_address, default_limits=["120/minute"])

app = FastAPI(title="Atrium Backend", version="0.2.0")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)


# Middleware ORDER (inside-out — last added runs first on inbound):
#   1. Auth          (innermost, added first)
#   2. SlowAPI       (rate limit)
#   3. CORS          (outermost, handles OPTIONS preflight before auth)
@app.middleware("http")
async def require_shared_secret(request: Request, call_next):
    path = request.url.path
    # /health is public for monitoring; CORS preflight runs above this anyway
    # but bypass OPTIONS defensively.
    if path == "/health" or request.method == "OPTIONS":
        return await call_next(request)
    origin = request.headers.get("origin", "")
    referer = request.headers.get("referer", "")
    
    from urllib.parse import urlparse
    def is_local(url: str) -> bool:
        if not url:
            return False
        try:
            netloc = urlparse(url).netloc
            # Remove port if present
            hostname = netloc.split(":")[0]
            return hostname in ("localhost", "127.0.0.1")
        except Exception:
            return False

    if origin in DEV_ORIGINS or is_local(origin):
        return await call_next(request)
    
    # Same-origin GETs (incl. EventSource) don't send Origin per the Fetch
    # spec, but they DO send Referer. Trust dev-origin Referer in lieu of
    # Origin so SSE streams from localhost work without an explicit secret.
    if any(referer.startswith(o + "/") for o in DEV_ORIGINS) or is_local(referer):
        return await call_next(request)
    if SHARED_SECRET and request.headers.get("x-atrium-auth") == SHARED_SECRET:
        return await call_next(request)
    print(f"DEBUG: 401 Unauthorized. path={path}, method={request.method}, origin={origin!r}, referer={referer!r}, DEV_ORIGINS={DEV_ORIGINS}, headers={dict(request.headers)}", flush=True)
    return JSONResponse({"detail": "unauthorized"}, status_code=401)


app.add_middleware(SlowAPIMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    """Frontend polls this before showing the attending dock so a missing
    API key or unbootstrapped agent surfaces a clearer error than a blank
    SSE failure."""
    has_key = bool(os.environ.get("OPENAI_API_KEY"))
    agent_id = os.environ.get("ATRIUM_AGENT_ID") or "atrium-attending-openai"
    bootstrapped = True
    return {
        "ok": True,
        "voice": {
            "transport": "openai-realtime-webrtc",
            "model": get_best_realtime_model(),
            "api_key_configured": has_key,
        },
        "agent": {
            "openai_sdk_installed": _HAS_OPENAI,
            "api_key_configured": has_key,
            "bootstrapped": bootstrapped,
            "agent_id": agent_id,
            "model": AGENT_MODEL if _HAS_OPENAI else None,
        },
    }


# ───────────────────────────────────────────────────────────────────────────
# Attending Grader Session Manager (OpenAI direct inference)
# ───────────────────────────────────────────────────────────────────────────
#
# The browser talks to this server to manage sessions and stream evaluation
# results.
#
# Per-env vars:
#   OPENAI_API_KEY  — required. Server-side only; never exposed to the browser.
#   ATRIUM_AGENT_ID — persisted agent ID (uses cached ID to skip re-creating).
#
# Endpoints:
#   POST /agent/bootstrap                      — idempotent; returns the
#                                                assistant if ATRIUM_AGENT_ID
#                                                is unset, else returns the
#                                                cached ID.
#   POST /agent/sessions                       — create a new thread for the
#                                                current bootstrapped assistant.
#   GET  /agent/sessions/{sid}/stream          — SSE: run the assistant on the
#                                                thread and stream events.
#   GET  /agent/sessions/{sid}/events          — list thread messages (history).
#   POST /agent/sessions/{sid}/events          — add a user message.
#   POST /agent/vault/ehr/lookup               — credential-vault demo.
#   POST /agent/triage/classify                — one-shot gpt-5.5-instant ESI
#                                                classifier for ER arrivals.

import asyncio
import json
import logging

from fastapi import Request
from fastapi.responses import StreamingResponse

try:
    from openai import OpenAI, AsyncOpenAI  # type: ignore
    _HAS_OPENAI = True
except ImportError:  # pragma: no cover
    _HAS_OPENAI = False

# Structured logger for the Assistants proxy.
_agent_log = logging.getLogger("atrium.agent")
_agent_log.setLevel(logging.INFO)
if not _agent_log.handlers:
    _h = logging.StreamHandler()
    _h.setFormatter(logging.Formatter("[atrium.agent] %(levelname)s %(message)s"))
    _agent_log.addHandler(_h)

# Guards against two concurrent /agent/bootstrap calls.
_bootstrap_lock = threading.Lock()

# SSE keepalive interval (seconds).
SSE_KEEPALIVE_SEC = 15.0

PRIMARY_MODEL = os.environ.get("OPENAI_AGENT_MODEL", "gpt-5.5")
AGENT_MODEL = PRIMARY_MODEL          # attending grader
AGENT_NAME = "atrium-attending"

# Direct-inference model for the triage-reasoning endpoint.
TRIAGE_MODEL = os.environ.get("OPENAI_TRIAGE_MODEL", "gpt-5.5-instant")
TRIAGE_MAX_TOKENS = 512

ATRIUM_ATTENDING_SYSTEM_PROMPT = (
    "You are the attending physician supervising a trainee in a clinical "
    "training simulator. Your role is to OBSERVE their decisions and "
    "GRADE the encounter. You are NOT an assistant, a guide, or a "
    "coach. Silence is acceptable and often correct.\n\n"

    "The simulator runs in one of two modes at a time; the event stream "
    "makes it explicit:\n"
    "  • EMERGENCY ROOM (ER) — triaged by severity, 4 beds in "
    "red/yellow/green zones. Events: [ER arrival], [test ordered], "
    "[treatment given], [diagnosis submitted], [disposition].\n"
    "  • POLYCLINIC (outpatient) — no triage zones, no beds, one "
    "patient at a time, tests resolve instantly. Events: "
    "[polyclinic arrival], [poly test], [poly diagnosis], [poly rx], "
    "[disposition].\n\n"

    "Custom-tool usage by mode:\n"
    "  • ER mode only: render_triage_badge (red/yellow/green + one-line "
    "rationale), render_bed_map.\n"
    "  • Both modes: render_vitals_chart, render_patient_timeline, "
    "render_case_evaluation, flag_critical_finding, lookup_ehr_history.\n"
    "  • DO NOT emit render_triage_badge or render_bed_map during "
    "polyclinic events — triage zones and beds are ER concepts and "
    "emitting them confuses the UI.\n\n"

    "Permission policy — custom tools:\n"
    "  • All render_* tools are auto-allowed; the trainee's UI renders "
    "them immediately and acks back to you. Use them freely.\n"
    "  • flag_critical_finding is a confirm-gated write. The trainee "
    "sees an approve/decline dialog before the banner fires; the "
    "tool_result is delayed until they choose. Reserve it for peri-"
    "arrest vitals, closing stroke window, airway compromise, or "
    "anaphylaxis. Never flag stable patients, and emit at most one "
    "flag per encounter.\n"
    "  • lookup_ehr_history is auto-allowed; it routes through the "
    "credential vault so the EHR auth token never enters your context. "
    "Call it once per patient when prior history or medication list "
    "would change your assessment (e.g., unclear cardiac history, "
    "possible drug interaction). Do not call it for every arrival.\n\n"

    "What you DO:\n"
    "  • On [ER arrival]: optionally emit one render_triage_badge with a "
    "rationale citing specific vitals or chief-complaint evidence. If "
    "the vitals are unremarkable and the presentation doesn't warrant "
    "a zone call, stay silent.\n"
    "  • On [polyclinic arrival]: stay silent. Do not greet the patient "
    "or ask the trainee what they want to do.\n"
    "  • At debrief time (see DEBRIEF MODE below): emit exactly one "
    "render_case_evaluation. Never emit it before the trainee has "
    "submitted a diagnosis.\n"
    "  • Any text you do emit: at most one sentence, observational tone, "
    "no questions.\n\n"

    "What you DO NOT do:\n"
    "  • Do not ask the trainee questions ('what would you like to do "
    "first?'). Never.\n"
    "  • Do not narrate the scene ('Mr. Williams is roomed and ready.').\n"
    "  • Do not suggest next steps before the trainee has acted.\n"
    "  • Do not repeat what the trainee can already see in the UI.\n"
    "  • Do not reveal the correct diagnosis before disposition.\n\n"

    "DEBRIEF MODE — end-of-encounter grading.\n\n"

    "When you receive a [debrief request] message, the trainee has ended "
    "the encounter. The message body contains, as JSON:\n"
    "  • case_id and the case's correctDiagnosisId (gold standard).\n"
    "  • rubric — a CaseRubric with three domains "
    "(data_gathering, clinical_management, interpersonal) plus optional "
    "safety_netting. Each criterion has a label, weight, and an "
    "`evidence` string telling you exactly what counts as 'met'.\n"
    "  • registry_slice — the subset of guidelines/recommendations cited "
    "by the rubric. Use ONLY recIds that appear here. Do not invent.\n"
    "  • encounter_log — chronological list of: history questions asked "
    "(with answers shown to the trainee), tests ordered with timestamps, "
    "treatments/prescriptions given, the submitted diagnosis, and any "
    "free-text counselling captured. Plus the voice transcript if "
    "available.\n\n"

    "Process:\n"
    "  1. For every criterion in rubric.data_gathering, "
    "rubric.clinical_management, and rubric.interpersonal, decide one of "
    "{met, partially-met, missed} using the criterion's `evidence` field "
    "as your match key. Quote the trainee directly or name the action "
    "in the `evidence` field of your output (not the rubric's evidence "
    "string — your own observation).\n"
    "  2. Compute domain_scores: raw = sum of weights for met (1.0×) + "
    "partially-met (0.5×); max = sum of all weights in that domain. "
    "Verdict bands: ≥0.85 excellent, ≥0.70 good, ≥0.55 satisfactory, "
    "≥0.40 borderline, otherwise clear-fail.\n"
    "  3. Set global_rating with the same bands applied to the total "
    "across all three domains.\n"
    "  4. If the trainee did anything dangerous — contraindicated drug, "
    "missed a red-flag escalation that the rubric flagged, no safety-"
    "netting on a high-risk diagnosis — set safety_breach with `what` "
    "and a guideline_ref if one applies. The narrative MUST lead with "
    "this regardless of the score.\n"
    "  5. Pick 1–3 highlights (specific strengths the trainee actually "
    "demonstrated) and 1–3 improvements (priority gaps). Do not list "
    "everything; the trainee tunes out.\n"
    "  6. Write narrative last, 1–2 paragraphs, voice of a senior "
    "clinician giving a teaching debrief immediately after the case. "
    "No praise sandwiches, no sycophancy, no generic encouragement.\n"
    "  7. Emit ONE render_case_evaluation tool use with the full payload. "
    "Then stop.\n\n"

    "Hard rules — non-negotiable:\n"
    "  • Cite, don't invent. Every clinical_management criterion's "
    "guideline_ref MUST appear in the registry_slice. If the rubric "
    "criterion has no guideline_ref AND no rec applies, drop the "
    "criterion from your output rather than fabricating one.\n"
    "  • Specific evidence. 'You missed ICE' is not enough. 'You closed "
    "without asking what the patient was worried about — they hinted at "
    "fear of stroke when they mentioned their father; that was a chance "
    "to address concerns and tailor the explanation.' is the bar.\n"
    "  • No medical advice for real patients. This is a training "
    "simulator. Do not frame any output as guidance for actual care.\n"
    "  • Cases are synthetic and doses simplified — do not hold the "
    "trainee to a recommendation that is not in the registry_slice.\n\n"

    "Scope: the cases are synthetic, the medication doses are simplified, "
    "and the trainee is not a licensed clinician. Do not offer medical "
    "advice outside the simulator."
)

# Custom tool definitions — must match Zod schemas in src/agents/customTools.ts.
ATRIUM_CUSTOM_TOOLS: list[dict] = [
    {
        "type": "function",
        "function": {
            "name": "render_vitals_chart",
            "description": (
                "Display the patient's vitals (HR, BP, SpO2, temp, RR) as a "
                "line chart over the course of the encounter."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "patient_id": {"type": "string"},
                },
                "required": ["patient_id"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "render_bed_map",
            "description": "Display the current bed occupancy map across the four ER beds.",
            "parameters": {"type": "object", "properties": {}},
        },
    },
    {
        "type": "function",
        "function": {
            "name": "render_triage_badge",
            "description": "Display a triage-priority badge with a one-line rationale.",
            "parameters": {
                "type": "object",
                "properties": {
                    "zone": {"type": "string", "enum": ["red", "yellow", "green"]},
                    "reason": {"type": "string"},
                },
                "required": ["zone", "reason"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "render_patient_timeline",
            "description": (
                "Display the tests ordered and treatments given for a patient "
                "in chronological order."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "patient_id": {"type": "string"},
                },
                "required": ["patient_id"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "render_case_evaluation",
            "description": (
                "End-of-encounter PLAB2-style debrief. Emit exactly once after "
                "the trainee submits their diagnosis. Score three domains against the case rubric."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "case_id": {"type": "string"},
                    "global_rating": {
                        "type": "string",
                        "enum": ["clear-fail", "borderline", "satisfactory", "good", "excellent"],
                    },
                    "domain_scores": {
                        "type": "object",
                        "properties": {
                            "data_gathering": {
                                "type": "object",
                                "properties": {
                                    "raw": {"type": "number"},
                                    "max": {"type": "number"},
                                    "verdict": {"type": "string"},
                                },
                                "required": ["raw", "max", "verdict"],
                            },
                            "clinical_management": {
                                "type": "object",
                                "properties": {
                                    "raw": {"type": "number"},
                                    "max": {"type": "number"},
                                    "verdict": {"type": "string"},
                                },
                                "required": ["raw", "max", "verdict"],
                            },
                            "interpersonal": {
                                "type": "object",
                                "properties": {
                                    "raw": {"type": "number"},
                                    "max": {"type": "number"},
                                    "verdict": {"type": "string"},
                                },
                                "required": ["raw", "max", "verdict"],
                            },
                        },
                        "required": ["data_gathering", "clinical_management", "interpersonal"],
                    },
                    "criteria": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "properties": {
                                "criterion_id": {"type": "string"},
                                "domain": {"type": "string"},
                                "verdict": {"type": "string"},
                                "evidence": {"type": "string"},
                                "guideline_ref": {"type": ["string", "null"]},
                            },
                            "required": ["criterion_id", "domain", "verdict", "evidence"],
                        },
                    },
                    "safety_breach": {
                        "type": ["object", "null"],
                        "properties": {
                            "what": {"type": "string"},
                            "guideline_ref": {"type": ["string", "null"]},
                        },
                    },
                    "highlights": {"type": "array", "items": {"type": "string"}},
                    "improvements": {"type": "array", "items": {"type": "string"}},
                    "narrative": {"type": "string"},
                },
                "required": [
                    "case_id", "global_rating", "domain_scores",
                    "criteria", "highlights", "improvements", "narrative",
                ],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "flag_critical_finding",
            "description": (
                "Raise a disruptive critical-finding banner on the trainee's "
                "screen. Use ONLY when the patient is in imminent risk."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "patient_id": {"type": "string"},
                    "severity": {"type": "string", "enum": ["critical", "urgent"]},
                    "reason": {"type": "string"},
                },
                "required": ["patient_id", "severity", "reason"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "lookup_ehr_history",
            "description": (
                "Retrieve the patient's prior EHR encounters and medication "
                "list from the hospital EHR system via the credential vault."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "patient_id": {"type": "string"},
                },
                "required": ["patient_id"],
            },
        },
    },
]

_openai_client: Optional["OpenAI"] = None
_async_openai_client: Optional["AsyncOpenAI"] = None

# In-memory session manager to replace OpenAI Assistants threads
SESSIONS: dict[str, list[dict]] = {}


def _ensure_openai_available() -> None:
    if not _HAS_OPENAI:
        raise HTTPException(
            status_code=500,
            detail=(
                "openai package not installed. Run `pip install "
                "'openai>=1.78.0'` in the backend venv."
            ),
        )


def _require_openai_api_key() -> str:
    key = os.environ.get("OPENAI_API_KEY")
    if not key:
        raise HTTPException(
            status_code=500,
            detail="OPENAI_API_KEY is not set server-side.",
        )
    return key


def get_openai_client() -> "OpenAI":
    global _openai_client
    _ensure_openai_available()
    if _openai_client is None:
        _openai_client = OpenAI(api_key=_require_openai_api_key())
    return _openai_client


def get_async_openai_client() -> "AsyncOpenAI":
    global _async_openai_client
    _ensure_openai_available()
    if _async_openai_client is None:
        _async_openai_client = AsyncOpenAI(api_key=_require_openai_api_key())
    return _async_openai_client


_cached_realtime_model: Optional[str] = None
_cached_transcribe_model: Optional[str] = None

def get_best_realtime_model() -> str:
    global _cached_realtime_model
    if _cached_realtime_model is not None:
        return _cached_realtime_model

    env_model = os.environ.get("OPENAI_REALTIME_MODEL")

    # Try listing models to see what is supported
    try:
        client = get_openai_client()
        models = client.models.list()
        supported = {m.id for m in models.data}
        
        # Only use the env override if it is supported
        if env_model and env_model in supported:
            _cached_realtime_model = env_model
            return env_model
        
        candidates = [
            "gpt-realtime-2",
        ]
        for candidate in candidates:
            if candidate in supported:
                _cached_realtime_model = candidate
                _agent_log.info("[Realtime] Detected available realtime model: %s", candidate)
                return candidate
    except Exception as e:
        _agent_log.warning("[Realtime] Failed to list available models: %s", e)

    # Fallback to env override or default
    fallback = env_model or "gpt-realtime-2"
    _cached_realtime_model = fallback
    return fallback


def get_best_transcribe_model() -> str:
    global _cached_transcribe_model
    if _cached_transcribe_model is not None:
        return _cached_transcribe_model

    try:
        client = get_openai_client()
        models = client.models.list()
        supported = {m.id for m in models.data}
        
        candidates = [
            "gpt-realtime-whisper",
            "whisper-1",
        ]
        for candidate in candidates:
            if candidate in supported:
                _cached_transcribe_model = candidate
                _agent_log.info("[Realtime] Detected available transcribe model: %s", candidate)
                return candidate
    except Exception as e:
        _agent_log.warning("[Realtime] Failed to list available transcribe models: %s", e)

    fallback = "gpt-realtime-whisper"
    _cached_transcribe_model = fallback
    return fallback


def get_session_messages(session_id: str) -> list[dict]:
    if session_id not in SESSIONS:
        SESSIONS[session_id] = []
    return SESSIONS[session_id]


class BootstrapResponse(BaseModel):
    agent_id: str
    created: bool  # True if we created the assistant this call, False if cached


@app.post("/agent/bootstrap", response_model=BootstrapResponse)
def bootstrap_agent():
    """Mock bootstrap for the direct OpenAI architecture."""
    agent_id = os.environ.get("ATRIUM_AGENT_ID") or "atrium-attending-openai"
    os.environ["ATRIUM_AGENT_ID"] = agent_id
    _agent_log.info("bootstrap: cached agent_id=%s (OpenAI mode)", agent_id)
    return BootstrapResponse(agent_id=agent_id, created=False)


class RefreshAgentResponse(BaseModel):
    agent_id: str


@app.post("/agent/refresh", response_model=RefreshAgentResponse)
def refresh_agent():
    """No-op refresh for direct OpenAI mode."""
    agent_id = os.environ.get("ATRIUM_AGENT_ID") or "atrium-attending-openai"
    _agent_log.info("refresh: agent_id=%s (OpenAI mode)", agent_id)
    return RefreshAgentResponse(agent_id=agent_id)


class CreateSessionRequest(BaseModel):
    title: Optional[str] = None


class CreateSessionResponse(BaseModel):
    session_id: str  # Maps to OpenAI thread ID


@app.post("/agent/sessions", response_model=CreateSessionResponse)
def create_session(req: CreateSessionRequest):
    """Create a new local session thread."""
    import uuid
    session_id = f"thread_{uuid.uuid4().hex[:12]}"
    SESSIONS[session_id] = []
    _agent_log.info("create_session: thread %s (OpenAI mode)", session_id)
    return CreateSessionResponse(session_id=session_id)


@app.post("/agent/sessions/{session_id}/events")
async def send_events(session_id: str, request: Request):
    """Add user messages or tool results to the session history."""
    import uuid
    import time
    try:
        body = await request.json()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"invalid JSON body: {e}")
    events = body.get("events") if isinstance(body, dict) else None
    if not isinstance(events, list) or not events:
        raise HTTPException(status_code=400, detail="events must be a non-empty list")

    msgs = get_session_messages(session_id)

    for event in events:
        etype = event.get("type", "")
        if etype == "user.message":
            content = event.get("content", [])
            text = " ".join(
                c.get("text", "") for c in content if isinstance(c, dict) and c.get("type") == "text"
            )
            if text.strip():
                msgs.append({
                    "id": f"msg_{uuid.uuid4().hex[:8]}",
                    "role": "user",
                    "content": text,
                    "created_at": int(time.time()),
                })
                _agent_log.info("send_events: user message thread=%s content=%r", session_id, text)
        elif etype == "user.custom_tool_result":
            tool_result_content = " ".join(
                c.get("text", "") for c in event.get("content", [])
                if isinstance(c, dict)
            )
            tool_use_id = event.get("custom_tool_use_id") or "unknown"
            text = f"[tool result for {tool_use_id}]: {tool_result_content}"
            msgs.append({
                "id": f"msg_{uuid.uuid4().hex[:8]}",
                "role": "user",
                "content": text,
                "created_at": int(time.time()),
            })
            _agent_log.info("send_events: custom tool result thread=%s content=%r", session_id, text)
        elif etype == "user.interrupt":
            text = "[user interrupt]"
            msgs.append({
                "id": f"msg_{uuid.uuid4().hex[:8]}",
                "role": "user",
                "content": text,
                "created_at": int(time.time()),
            })
            _agent_log.info("send_events: user interrupt thread=%s", session_id)
            
    return {"ok": True}


@app.get("/agent/sessions/{session_id}/events")
async def list_events(session_id: str, limit: int = 1000):
    """List messages in the session history."""
    import time
    msgs = get_session_messages(session_id)
    data = []
    for msg in msgs:
        if msg.get("role") in ("user", "assistant"):
            content = msg.get("content", "")
            if not isinstance(content, str):
                content = str(content) if content else ""
            data.append({
                "id": msg["id"],
                "type": "agent.message" if msg["role"] == "assistant" else "user.message",
                "content": content,
                "created_at": msg.get("created_at") or int(time.time()),
            })
    return {"data": data}


@app.get("/agent/sessions/{session_id}/stream")
async def stream_events(session_id: str, request: Request):
    """SSE: run OpenAI LLM on the thread and stream output as SSE events."""
    import uuid
    import time

    client = get_async_openai_client()
    msgs = get_session_messages(session_id)

    async def generator():
        yield ": connected\n\n"
        yield f"event: session.status_running\ndata: {json.dumps({'id': session_id, 'type': 'session.status_running'})}\n\n"

        try:
            # Build messages history for OpenAI Chat Completions.
            openai_messages = [{"role": "system", "content": ATRIUM_ATTENDING_SYSTEM_PROMPT}]
            for m in msgs:
                openai_msg = {
                    "role": m["role"],
                    "content": m.get("content") or ""
                }
                if "tool_calls" in m:
                    openai_msg["tool_calls"] = m["tool_calls"]
                    if not openai_msg["content"]:
                        openai_msg["content"] = None
                if m["role"] == "tool":
                    openai_msg["tool_call_id"] = m["tool_call_id"]
                openai_messages.append(openai_msg)

            # Debug log prompt payload
            _agent_log.debug("OpenAI prompt payload: %r", openai_messages)

            response_stream = await client.chat.completions.create(
                model=PRIMARY_MODEL,
                messages=openai_messages,
                tools=ATRIUM_CUSTOM_TOOLS,
                stream=True
            )

            accumulated_text = ""
            tool_calls_temp = {}

            async for chunk in response_stream:
                if await request.is_disconnected():
                    break

                delta = chunk.choices[0].delta if chunk.choices else None
                if not delta:
                    continue

                # Text response
                if delta.content:
                    accumulated_text += delta.content
                    payload = json.dumps({
                        "id": f"msg_{chunk.id}",
                        "type": "agent.message",
                        "delta": delta.content,
                        "content": accumulated_text,
                    })
                    yield f"event: agent.message\ndata: {payload}\n\n"

                # Tool calls
                if delta.tool_calls:
                    for tc in delta.tool_calls:
                        idx = tc.index
                        if idx not in tool_calls_temp:
                            tool_calls_temp[idx] = {
                                "id": tc.id or f"call_{uuid.uuid4().hex[:12]}",
                                "name": "",
                                "arguments": ""
                            }
                        if tc.function:
                            if tc.function.name:
                                tool_calls_temp[idx]["name"] += tc.function.name
                            if tc.function.arguments:
                                tool_calls_temp[idx]["arguments"] += tc.function.arguments

            # Finalize tool calls
            if tool_calls_temp:
                tool_calls_list = []
                for idx, tc_info in sorted(tool_calls_temp.items()):
                    name = tc_info["name"]
                    args_str = tc_info["arguments"]
                    try:
                        args = json.loads(args_str) if args_str else {}
                    except Exception:
                        args = {}
                    
                    tool_calls_list.append({
                        "id": tc_info["id"],
                        "type": "function",
                        "function": {
                            "name": name,
                            "arguments": json.dumps(args)
                        }
                    })

                    # Emit custom tool use event
                    payload = json.dumps({
                        "id": tc_info["id"],
                        "type": "agent.custom_tool_use",
                        "name": name,
                        "input": args,
                        "run_id": f"run_{uuid.uuid4().hex[:8]}",
                    })
                    _agent_log.info("stream_events: emitting custom tool use: %s inputs=%r", name, args)
                    yield f"event: agent.custom_tool_use\ndata: {payload}\n\n"

                # Save assistant message with tool calls to session
                assistant_msg_id = f"msg_{uuid.uuid4().hex[:8]}"
                msgs.append({
                    "id": assistant_msg_id,
                    "role": "assistant",
                    "content": accumulated_text or None,
                    "tool_calls": tool_calls_list,
                    "created_at": int(time.time())
                })

                # Satisfy tool results immediately
                for tc in tool_calls_list:
                    msgs.append({
                        "id": f"msg_{uuid.uuid4().hex[:8]}",
                        "role": "tool",
                        "tool_call_id": tc["id"],
                        "content": "rendered",
                        "created_at": int(time.time())
                    })

            elif accumulated_text:
                # Just text response
                msgs.append({
                    "id": f"msg_{uuid.uuid4().hex[:8]}",
                    "role": "assistant",
                    "content": accumulated_text,
                    "created_at": int(time.time())
                })

            # Signal turn ended/idle
            payload = json.dumps({
                "id": session_id,
                "type": "session.status_idle",
                "stop_reason": {"type": "end_turn"},
            })
            yield f"event: session.status_idle\ndata: {payload}\n\n"

        except asyncio.CancelledError:
            raise
        except Exception as e:
            _agent_log.exception("Proxy SSE stream failed thread=%s", session_id)
            err = json.dumps({"type": "proxy_error", "message": str(e)})
            yield f"event: proxy_error\ndata: {err}\n\n"

    return StreamingResponse(
        generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache, no-transform",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


# ───────────────────────────────────────────────────────────────────────────
# Credential vault — hospital EHR stub
# ───────────────────────────────────────────────────────────────────────────
#
# Demo of the "credential vault" pattern: a third-party system
# (fake hospital EHR) needs an auth token to query patient history. The
# token lives ONLY on the backend (EHR_API_TOKEN env var). The agent's
# context window never sees it, the browser never sees it, and it never
# appears in any log line.

FAKE_EHR_RECORDS: dict[str, dict] = {
    "poly-001": {
        "patient_id": "poly-001",
        "name": "Mehmet Demir",
        "prior_encounters": [
            {"date": "2025-11-14", "reason": "hypertension follow-up", "bp": "148/92"},
            {"date": "2025-07-02", "reason": "annual physical", "bp": "140/88"},
        ],
        "active_medications": [
            {"name": "lisinopril", "dose": "10 mg", "frequency": "daily"},
            {"name": "atorvastatin", "dose": "20 mg", "frequency": "nightly"},
        ],
        "allergies": ["penicillin — hives"],
    },
    "poly-002": {
        "patient_id": "poly-002",
        "name": "Ayşe Kaya",
        "prior_encounters": [
            {"date": "2026-01-22", "reason": "asthma exacerbation", "peak_flow": 320},
        ],
        "active_medications": [
            {"name": "albuterol", "dose": "90 mcg", "frequency": "PRN"},
            {"name": "fluticasone", "dose": "110 mcg", "frequency": "BID"},
        ],
        "allergies": [],
    },
    "er-101": {
        "patient_id": "er-101",
        "name": "John Williams",
        "prior_encounters": [
            {"date": "2024-12-03", "reason": "STEMI, PCI to LAD"},
        ],
        "active_medications": [
            {"name": "aspirin", "dose": "81 mg", "frequency": "daily"},
            {"name": "clopidogrel", "dose": "75 mg", "frequency": "daily"},
            {"name": "metoprolol", "dose": "25 mg", "frequency": "BID"},
        ],
        "allergies": [],
    },
}


class EhrLookupRequest(BaseModel):
    patient_id: str


class EhrLookupResponse(BaseModel):
    patient_id: str
    record: dict
    fetched_via: str  # always "credential-vault"; demo label


def _vault_token_configured() -> bool:
    return bool(os.environ.get("EHR_API_TOKEN"))


@app.post("/agent/vault/ehr/lookup", response_model=EhrLookupResponse)
def vault_ehr_lookup(req: EhrLookupRequest):
    """Look up a patient's EHR record through the credential vault."""
    patient_id = req.patient_id.strip()
    if not patient_id:
        raise HTTPException(status_code=400, detail="patient_id is required")
    if not _vault_token_configured():
        raise HTTPException(
            status_code=503,
            detail=(
                "EHR_API_TOKEN is not configured server-side. Set it in "
                "backend/.env.local to enable the vault."
            ),
        )
    record = FAKE_EHR_RECORDS.get(patient_id)
    if record is None:
        raise HTTPException(status_code=404, detail=f"patient_id not found: {patient_id}")
    _agent_log.info("vault: ehr lookup patient=%s", patient_id)
    return EhrLookupResponse(
        patient_id=patient_id,
        record=record,
        fetched_via="credential-vault",
    )


# ───────────────────────────────────────────────────────────────────────────
# Triage-reasoning endpoint (direct gpt-5.5-instant inference)
# ───────────────────────────────────────────────────────────────────────────
#
# One-shot ESI classification called at ER arrival. Separate from the
# atrium-attending Assistants thread — this is stateless direct inference.

ESI_TRIAGE_SYSTEM_PROMPT = (
    "You classify ER arrivals on a simplified 3-level ESI scale: "
    "'critical' (ESI 1-2), 'urgent' (ESI 3), or 'stable' (ESI 4-5).\n\n"

    "Rules you apply, in priority order:\n"
    "1. RED FLAGS force 'critical' regardless of current vitals: "
    "ST elevation / new LBBB / troponin elevation; sudden focal neuro "
    "deficit within the tPA window; sustained VT / VF / torsades; "
    "anaphylaxis with airway involvement; ectopic with hemodynamic "
    "compromise; intracranial hemorrhage; qSOFA ≥ 2 of (RR≥22, altered "
    "mental status, SBP≤100).\n"
    "2. 'critical' also applies if the patient needs life-saving "
    "intervention NOW (airway, hemodynamic support, time-critical "
    "reperfusion).\n"
    "3. 'urgent' for conditions with significant morbidity but no "
    "imminent threat — appendicitis, new AFib w/ RVR, moderate asthma "
    "exacerbation, chest pain without red-flag features.\n"
    "4. 'stable' only when BOTH red flags and urgent criteria are "
    "absent AND vitals are compensated AND chief complaint is low-"
    "acuity (ankle sprain, viral URI, chronic-stable presentations).\n"
    "5. If uncertain between two levels, choose the higher severity.\n\n"

    "Respond with STRICT JSON ONLY, no prose, matching:\n"
    '{"esi_level": "critical"|"urgent"|"stable", '
    '"rationale": "<one sentence citing specific vitals or red flags>", '
    '"red_flags": [<zero or more of the rule-1 phrases that apply>]}\n'
)


class VitalsSnapshot(BaseModel):
    hr: Optional[int] = None
    bp_systolic: Optional[int] = None
    bp_diastolic: Optional[int] = None
    spo2: Optional[int] = None
    rr: Optional[int] = None
    temp_c: Optional[float] = None


class TriageClassifyRequest(BaseModel):
    patient_id: str
    chief_complaint: str
    vitals: VitalsSnapshot
    ecg_findings: Optional[str] = None
    notes: Optional[str] = None


class TriageClassifyResponse(BaseModel):
    patient_id: str
    esi_level: str  # 'critical' | 'urgent' | 'stable'
    rationale: str
    red_flags: list[str]
    model: str


ALLOWED_ESI_LEVELS = {"critical", "urgent", "stable"}


def _format_triage_user_message(req: TriageClassifyRequest) -> str:
    v = req.vitals
    parts = [f"Patient {req.patient_id} — {req.chief_complaint}."]
    vitals_bits: list[str] = []
    if v.hr is not None:
        vitals_bits.append(f"HR {v.hr}")
    if v.bp_systolic is not None and v.bp_diastolic is not None:
        vitals_bits.append(f"BP {v.bp_systolic}/{v.bp_diastolic}")
    if v.spo2 is not None:
        vitals_bits.append(f"SpO2 {v.spo2}")
    if v.rr is not None:
        vitals_bits.append(f"RR {v.rr}")
    if v.temp_c is not None:
        vitals_bits.append(f"temp {v.temp_c}°C")
    if vitals_bits:
        parts.append("Vitals: " + ", ".join(vitals_bits) + ".")
    if req.ecg_findings:
        parts.append(f"ECG: {req.ecg_findings}.")
    if req.notes:
        parts.append(f"Notes: {req.notes}.")
    parts.append("Classify on the simplified ESI 3-level scale.")
    return " ".join(parts)


def run_triage_reasoning(
    client: "OpenAI",
    req: TriageClassifyRequest,
) -> TriageClassifyResponse:
    """Invoke gpt-5.5-instant to classify an ER arrival. Pure function modulo
    the client handle — unit tests pass a mock client."""
    response = client.chat.completions.create(
        model=TRIAGE_MODEL,
        max_tokens=TRIAGE_MAX_TOKENS,
        response_format={"type": "json_object"},
        messages=[
            {"role": "system", "content": ESI_TRIAGE_SYSTEM_PROMPT},
            {"role": "user", "content": _format_triage_user_message(req)},
        ],
    )
    raw = (response.choices[0].message.content or "").strip()
    if not raw:
        raise HTTPException(
            status_code=502,
            detail="triage model returned empty response",
        )
    # Strip an accidental ```json fence.
    if raw.startswith("```"):
        raw = raw.strip("`")
        if raw.lower().startswith("json"):
            raw = raw[4:]
        raw = raw.strip()
    try:
        parsed = json.loads(raw)
    except ValueError as e:
        _agent_log.warning("triage: malformed JSON from model: %s", raw[:200])
        raise HTTPException(
            status_code=502,
            detail=f"triage model returned malformed JSON: {e}",
        )
    esi = str(parsed.get("esi_level", "")).strip()
    if esi not in ALLOWED_ESI_LEVELS:
        raise HTTPException(
            status_code=502,
            detail=f"triage model returned invalid esi_level: {esi!r}",
        )
    rationale = str(parsed.get("rationale", "")).strip()
    red_flags_raw = parsed.get("red_flags", [])
    red_flags = [str(x) for x in red_flags_raw] if isinstance(red_flags_raw, list) else []
    _agent_log.info(
        "triage: patient=%s esi=%s flags=%d",
        req.patient_id, esi, len(red_flags),
    )
    return TriageClassifyResponse(
        patient_id=req.patient_id,
        esi_level=esi,
        rationale=rationale,
        red_flags=red_flags,
        model=TRIAGE_MODEL,
    )


@app.post("/agent/triage/classify", response_model=TriageClassifyResponse)
def triage_classify(req: TriageClassifyRequest):
    """OpenAI one-shot ESI classification for ER arrivals. Stateless
    direct inference endpoint, separate from the Assistants thread."""
    client = get_openai_client()
    return run_triage_reasoning(client, req)


# ───────────────────────────────────────────────────────────────────────────
# Real-time voice — OpenAI Realtime client secrets
# ───────────────────────────────────────────────────────────────────────────

import httpx


# Note: realtime model is resolved dynamically by get_best_realtime_model().
# Voice is resolved per-request by _realtime_voice_for() using
# OPENAI_REALTIME_MALE_VOICE / OPENAI_REALTIME_FEMALE_VOICE env vars.


class RealtimeSecretRequest(BaseModel):
    caseId: str
    systemPrompt: str
    initialLine: str
    gender: str  # 'M' | 'F' — speaker gender (parent for pediatric)
    voice: Optional[str] = None
    age: Optional[int] = 35
    severity: Optional[str] = 'stable'  # 'stable' | 'urgent' | 'critical'


class RealtimeSecretResponse(BaseModel):
    value: str
    model: str
    voice: str
    expires_at: Optional[int] = None


def _realtime_voice_for(req: RealtimeSecretRequest) -> str:
    if req.voice:
        return req.voice
    
    gender = (req.gender or "F").upper()
    if gender == "M":
        return os.environ.get("OPENAI_REALTIME_MALE_VOICE") or "ballad"
    else:
        return os.environ.get("OPENAI_REALTIME_FEMALE_VOICE") or "shimmer"


@app.post("/voice/realtime-secret", response_model=RealtimeSecretResponse)
async def realtime_secret(req: RealtimeSecretRequest):
    api_key = _require_openai_api_key()
    voice = _realtime_voice_for(req)
    selected_model = get_best_realtime_model()
    selected_transcribe_model = get_best_transcribe_model()
    
    _agent_log.info(
        "[Realtime] minting client secret caseId=%s model=%s voice=%s severity=%s",
        req.caseId,
        selected_model,
        voice,
        req.severity,
    )

    session_instructions = (
        req.systemPrompt
        + "\n\nDELIVERY GUIDELINES:\n"
        + "- Speak naturally in first person. Stop speaking immediately if the doctor interrupts.\n"
        + "- Keep responses short (1-2 sentences) and conversational. Never use lists, bullet points, or stage directions.\n"
        + "- Stay fully in-character, matching the patient's emotional state, concerns, and background."
    )
    payload = {
        "expires_after": {"anchor": "created_at", "seconds": 600},
        "session": {
            "type": "realtime",
            "model": selected_model,
            "instructions": session_instructions,
            "output_modalities": ["audio"],
            "audio": {
                "input": {
                    "turn_detection": {
                        "type": "semantic_vad",
                        "eagerness": "high",
                        "interrupt_response": True,
                        "create_response": True,
                    },
                    "transcription": {
                        "model": selected_transcribe_model,
                        "language": "en",
                    },
                },
                "output": {
                    "voice": voice,
                    "speed": 1.0,
                },
            },
            "include": ["item.input_audio_transcription.logprobs"],
        },
    }

    async with httpx.AsyncClient(timeout=15.0) as client:
        r = await client.post(
            "https://api.openai.com/v1/realtime/client_secrets",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            json=payload,
        )
    if r.status_code >= 400:
        _agent_log.error("[Realtime] client secret mint failed: %s %s", r.status_code, r.text[:500])
        raise HTTPException(status_code=502, detail=f"OpenAI Realtime secret mint failed: {r.text}")
    data = r.json()
    value = data.get("value")
    if not value:
        raise HTTPException(status_code=502, detail="OpenAI Realtime secret response did not include a value.")
    return RealtimeSecretResponse(
        value=value,
        model=data.get("session", {}).get("model") or selected_model,
        voice=voice,
        expires_at=data.get("expires_at"),
    )


class FrontendLogRequest(BaseModel):
    level: str
    message: str


@app.post("/log/frontend")
def log_frontend(req: FrontendLogRequest):
    """Log messages sent from the frontend browser console for debugging."""
    level = req.level.upper()
    _agent_log.info(f"[FRONTEND {level}] {req.message}")
    return {"ok": True}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="127.0.0.1", port=8787, log_level="info")
