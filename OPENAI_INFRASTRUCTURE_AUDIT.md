# Atrium OpenAI Infrastructure Audit

> **Audit Date**: 2026-05-28  
> **Scope**: Full repository — `backend/`, `src/`, root config, scripts, tests, docs  
> **Auditor**: Antigravity Static Analysis  
> **Status**: Read-only — no code was modified

---

## 1. Executive Summary

Atrium is **partially OpenAI-native**. The active inference path (chat completions for the grader, realtime WebRTC for the patient voice, and token minting) is correctly routed through OpenAI APIs only. However, the codebase carries significant residue from a **prior multi-provider architecture** that was never fully cleaned out.

### Current Architecture Status

| Layer | Provider | Status |
|---|---|---|
| Attending grader (chat) | OpenAI (`gpt-4o`) | Active & correct |
| Triage classifier | OpenAI (`gpt-4o-mini`) | Active & correct |
| Patient voice (realtime) | OpenAI Realtime WebRTC | Active & correct |
| Token minting | OpenAI `/v1/realtime/client_secrets` | Active & correct |
| Transcription | OpenAI (model auto-detected) | Active — has unvalidated model names |
| LiveKit voice agent | None (deleted) | Config keys still present |
| Groq inference | None (unused) | API key still in `.env.local` |
| Deepgram STT | None (unused) | API key still in `.env.local` |
| Cartesia TTS | None (unused) | API key still in `.env.local` |

### Major Risks

1. **Three live third-party API keys** (Groq, Deepgram, Cartesia) stored in `.env.local` with no corresponding usage — security liabilities.
2. **Three LiveKit secrets** (URL, API key, API secret) similarly orphaned.
3. **Two unvalidated model names** in the transcription fallback candidate list (`gpt-4o-mini-transcribe-2025-12-15`, `gpt-realtime-whisper`) — these do not appear to be real OpenAI model IDs.
4. **Two hallucinated model IDs** in the realtime model candidate list: `gpt-realtime-mini` and `gpt-realtime` — not valid OpenAI model names.
5. **Stale comment** in `vite.config.ts` says "Claude Managed Agents proxy" — a misleading provider label from a prior architecture.
6. **Stale comment** in `vite.config.ts` says "backend mints LiveKit tokens" — factually wrong.
7. **Dead `Procfile` entry** references `voice_agent.py` which does not exist in the repository.
8. **Comment in `.env.local`** refers to `voice_agent.py to register as a worker` — that worker was deleted.
9. **`OPENAI_REALTIME_MODEL`** is declared twice in `server.py` at the module level (line 1183) and via `get_best_realtime_model()`, creating confusion about which value is authoritative.
10. **`OPENAI_AGENT_MODEL` and `OPENAI_TRIAGE_MODEL`** are read from env but never defined in `.env.local` or `.env.example` — undocumented override knobs.

---

## 2. Active Providers Found

### 2.1 OpenAI (Active — Correct)

| Usage Point | File | Line(s) | What It Does |
|---|---|---|---|
| Chat completions (grader) | `backend/server.py` | 801 | `client.chat.completions.create(model=PRIMARY_MODEL, ...)` |
| Chat completions (triage) | `backend/server.py` | 1117 | `client.chat.completions.create(model=TRIAGE_MODEL, ...)` |
| Realtime secret mint | `backend/server.py` | 1268-1276 | `POST https://api.openai.com/v1/realtime/client_secrets` |
| Realtime SDP exchange | `src/voice/conversation.ts` | 13, 283-294 | `POST https://api.openai.com/v1/realtime/calls` |
| Model list probe | `backend/server.py` | 584, 619 | `client.models.list()` |
| SDK import | `backend/server.py` | 198 | `from openai import OpenAI, AsyncOpenAI` |

### 2.2 Groq (Inactive — Dead Key Only)

| File | Line | Content | Active? |
|---|---|---|---|
| `backend/.env.local` | 10-11 | `GROQ_API_KEY=gsk_…` (section: "Hybrid Provider API Keys") | No — key stored, never read |

`GROQ_API_KEY` is present in `.env.local` but is **never referenced** anywhere in `server.py`, `src/`, or any script. Safe to remove.

### 2.3 Deepgram (Inactive — Dead Key Only)

| File | Line | Content | Active? |
|---|---|---|---|
| `backend/.env.local` | 12 | `DEEPGRAM_API_KEY=cdb27…` | No — key stored, never read |

`DEEPGRAM_API_KEY` is **never imported or read** in any Python or TypeScript file. Safe to remove.

### 2.4 Cartesia (Inactive — Dead Key Only)

| File | Line | Content | Active? |
|---|---|---|---|
| `backend/.env.local` | 13 | `CARTESIA_API_KEY=sk_car_…` | No — key stored, never read |

`CARTESIA_API_KEY` is **never imported or read** anywhere. Safe to remove.

### 2.5 LiveKit (Inactive — All References Dead)

| File | Line | Content | Active? |
|---|---|---|---|
| `backend/.env.local` | 15-19 | `LIVEKIT_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET` | No — all orphaned |
| `backend/Procfile` | 2 | `worker: python voice_agent.py start` | No — file doesn't exist |
| `backend/.env.local` | 15-16 | Comment referencing `voice_agent.py` as LiveKit worker | Dead comment |
| `vite.config.ts` | 19-20 | Comment: "Real-time voice — backend mints LiveKit tokens." | Factually wrong |
| `src/voice/patientPersona.ts` | 122 | Comment: `// Opening Line Instruction (for voice_agent.py)` | Dead reference |

LiveKit was the prior voice transport. It was fully replaced by OpenAI Realtime WebRTC. No `voice_agent.py` file exists. No `livekit-server-sdk` in `requirements.txt`. All LiveKit keys safe to remove.

### 2.6 Ollama (Inactive — Dead Proxy Route Only)

| File | Line | Content | Active? |
|---|---|---|---|
| `vite.config.ts` | 5-9 | `/ollama` proxy route to `http://localhost:11434` | No — no code calls this route |

The Ollama proxy block exists in `vite.config.ts` but nothing in `src/` calls `/ollama/*`. Safe to remove.

---

## 3. Hidden / Legacy Provider References

### 3.1 Misleading Comment — `vite.config.ts` Line 10

```
// Claude Managed Agents proxy — keeps the API key server-side.
```

File: `vite.config.ts` lines 10-14.  
Issue: The `/agent/` proxy route is explicitly described as a "Claude Managed Agents proxy." This is **factually incorrect** — the backend is a pure OpenAI FastAPI server. A fossil from a prior architecture iteration.  
Runtime-critical: **No**. Comment only.

### 3.2 Misleading Comment — `vite.config.ts` Line 19

```
// Real-time voice — backend mints LiveKit tokens.
```

File: `vite.config.ts` lines 19-23.  
Issue: The `/voice/` route forwards to the backend, which now mints **OpenAI Realtime client secrets** via `/voice/realtime-secret`, not LiveKit JWTs.  
Runtime-critical: **No**. Comment only.

### 3.3 Dead Worker Reference — `Procfile` Line 2

```
worker: python voice_agent.py start
```

File: `backend/Procfile` line 2.  
Issue: `voice_agent.py` does not exist in the repository. If this Procfile is deployed on Render/Heroku, the `worker` dyno will crash on start.  
Runtime-critical: **Yes** — the `worker` process will crash on deployment. The `web` process is unaffected.

### 3.4 Dead Comment — `backend/.env.local` Lines 15-16

```
# LiveKit Cloud — https://cloud.livekit.io. Used by the FastAPI server
# to mint room JWTs and by voice_agent.py to register as a worker.
```

File: `backend/.env.local` lines 15-16.  
Issue: The FastAPI server does not import or use LiveKit. `voice_agent.py` does not exist.  
Runtime-critical: **No**. Comment only.

### 3.5 Dead Comment — `src/voice/patientPersona.ts` Line 122

```
// Opening Line Instruction (for voice_agent.py)
```

File: `src/voice/patientPersona.ts` line 122.  
Issue: `buildOpeningLineInstruction()` is defined but its docstring says it is for `voice_agent.py`, which no longer exists. The function itself may be dead code — it is not referenced anywhere in the current codebase.  
Runtime-critical: **No**. Dead comment + possibly dead code.

### 3.6 Section Header in `.env.local` — "Hybrid Provider API Keys"

```
# Hybrid Provider API Keys
GROQ_API_KEY=...
DEEPGRAM_API_KEY=...
CARTESIA_API_KEY=...
```

File: `backend/.env.local` lines 10-13.  
Issue: The section explicitly says "Hybrid Provider" — implying the app is intentionally multi-provider. This is no longer true. The entire section is dead.

---

## 4. Model Audit

### 4.1 All Model Names Found

| Model ID | Where Used | Valid? | Notes |
|---|---|---|---|
| `gpt-4o` | `server.py:217` (default `PRIMARY_MODEL`) | Valid | Attending grader chat completions |
| `gpt-4o-mini` | `server.py:222` (default `TRIAGE_MODEL`) | Valid | Triage ESI classification |
| `gpt-4o-mini-realtime-preview` | `server.py:593, 607, 1183`; `.env.local:22`; `.env.example:11` | Valid | Default realtime voice model |
| `gpt-4o-realtime-preview` | `server.py:596` (candidate list) | Valid | Fallback in model probe |
| `gpt-4o-realtime-preview-2024-12-17` | `README.md:121` only | Valid (dated alias) | Only in docs — not at runtime |
| `gpt-realtime-mini` | `server.py:594` (candidate list) | **INVALID** | Not a real OpenAI model ID |
| `gpt-realtime` | `server.py:595` (candidate list) | **INVALID** | Not a real OpenAI model ID |
| `gpt-4o-mini-transcribe` | `server.py:623, 637` | Valid | Transcription model |
| `gpt-4o-mini-transcribe-2025-12-15` | `server.py:624` | **Unvalidated / future-dated** | Not confirmed to exist |
| `gpt-4o-mini-transcribe-2025-03-20` | `server.py:625` | **Unconfirmed** | Not confirmed in public model list |
| `whisper-1` | `server.py:626` | Valid | Legacy STT model |
| `gpt-realtime-whisper` | `server.py:627` | **INVALID** | Not a real OpenAI model ID |

### 4.2 Realtime Model Candidate List Problem

File: `backend/server.py` lines 592-602.

```python
candidates = [
    "gpt-4o-mini-realtime-preview",
    "gpt-realtime-mini",           # INVALID — not an OpenAI model
    "gpt-realtime",                 # INVALID — not an OpenAI model
    "gpt-4o-realtime-preview",
]
```

The function calls `client.models.list()` and tests candidates against the live supported set, so invalid names are never selected. However, two non-existent model IDs are dead weight and potentially confusing.

### 4.3 Transcription Model Candidate List Problem

File: `backend/server.py` lines 622-628.

```python
candidates = [
    "gpt-4o-mini-transcribe",
    "gpt-4o-mini-transcribe-2025-12-15",  # Future-dated, likely doesn't exist
    "gpt-4o-mini-transcribe-2025-03-20",  # Unconfirmed
    "whisper-1",
    "gpt-realtime-whisper",               # INVALID — not a real model ID
]
```

The dynamic probing makes this safe at runtime (non-existent IDs simply won't match), but the list indicates speculative/hallucinated entries.

### 4.4 Dead Module-Level Constant

File: `backend/server.py` line 1183.

```python
OPENAI_REALTIME_MODEL = os.environ.get("OPENAI_REALTIME_MODEL", "gpt-4o-mini-realtime-preview")
```

This variable is declared at the module level but is **never used again** — `get_best_realtime_model()` does its own `os.environ.get("OPENAI_REALTIME_MODEL")` internally. The module-level constant is a dead declaration.

### 4.5 Test File Model Reference (Accurate)

File: `backend/tests/test_triage.py` line 6.

The comment says `model=gpt-4o-mini`. The actual assertion at line 82 checks `server.TRIAGE_MODEL`. This is correct. No issue.

---

## 5. Environment Variable Audit

### 5.1 Complete Variable Inventory

| Variable | `.env.local` | `.env.example` | `server.py` reads? | Status |
|---|---|---|---|---|
| `OPENAI_API_KEY` | Set | Documented | Yes | Required — correct |
| `ATRIUM_AGENT_ID` | Set | Documented | Yes | Required — correct |
| `OPENAI_REALTIME_MODEL` | Set | Documented | Yes (in fn) | Required — correct |
| `OPENAI_REALTIME_VOICE` | Set (`marin`) | Documented | Yes | Required — correct |
| `OPENAI_REALTIME_MALE_VOICE` | Not set | Not documented | Read as override | Undocumented optional |
| `OPENAI_REALTIME_FEMALE_VOICE` | Not set | Not documented | Read as override | Undocumented optional |
| `OPENAI_AGENT_MODEL` | Not set | Not documented | Read as override | Undocumented optional |
| `OPENAI_TRIAGE_MODEL` | Not set | Not documented | Read as override | Undocumented optional |
| `BACKEND_SHARED_SECRET` | Not set | Not documented | Read | Optional but security-critical in production |
| `EHR_API_TOKEN` | Not set | Not documented | Read | Optional — gates vault endpoint |
| `GROQ_API_KEY` | Set | Not documented | Never read | **Dead — security risk** |
| `DEEPGRAM_API_KEY` | Set | Not documented | Never read | **Dead — security risk** |
| `CARTESIA_API_KEY` | Set | Not documented | Never read | **Dead — security risk** |
| `LIVEKIT_URL` | Set | Not documented | Never read | **Dead — security risk** |
| `LIVEKIT_API_KEY` | Set | Not documented | Never read | **Dead — security risk** |
| `LIVEKIT_API_SECRET` | Set | Not documented | Never read | **Dead — security risk** |

### 5.2 Dead Variables (Never Read — Should Be Removed)

- `GROQ_API_KEY` — Not used anywhere. Active credential at risk.
- `DEEPGRAM_API_KEY` — Not used anywhere. Active credential at risk.
- `CARTESIA_API_KEY` — Not used anywhere. Active credential at risk.
- `LIVEKIT_URL` — LiveKit stack removed. Orphaned secret.
- `LIVEKIT_API_KEY` — Same as above.
- `LIVEKIT_API_SECRET` — Same as above.

> CAUTION: These are real, active API keys stored in `.env.local`. While `.env.local` is gitignored, they represent live credentials for third-party services that are completely unused. Keys should be **revoked at the provider dashboard** and removed from the file.

### 5.3 Undocumented Override Variables

- `OPENAI_REALTIME_MALE_VOICE` — Falls back to `OPENAI_REALTIME_VOICE`, then `"ballad"`. Not in `.env.example`.
- `OPENAI_REALTIME_FEMALE_VOICE` — Falls back to `OPENAI_REALTIME_VOICE`, then `"shimmer"`. Not in `.env.example`.
- `OPENAI_AGENT_MODEL` — Override for `PRIMARY_MODEL` (grader). Falls back to `"gpt-4o"`. Not in `.env.example`.
- `OPENAI_TRIAGE_MODEL` — Override for `TRIAGE_MODEL`. Falls back to `"gpt-4o-mini"`. Not in `.env.example`.
- `BACKEND_SHARED_SECRET` — Required for production auth. Not in `.env.example`.
- `EHR_API_TOKEN` — Gates the vault endpoint. Not in `.env.example`.

### 5.4 Conflicting / Inconsistent Variables

**Issue 1**: `OPENAI_REALTIME_VOICE=marin` in `.env.local` serves as a **generic fallback** for both male and female paths in `_realtime_voice_for()`. Because the function checks `OPENAI_REALTIME_VOICE` before the gender-specific defaults, setting it to `marin` causes **all patients** (male and female) to receive the same voice. The gender-specific fallback values (`ballad`, `shimmer`) are unreachable in the current configuration.

**Issue 2**: `OPENAI_REALTIME_MODEL` is set in `.env.local` and is also the default in the `get_best_realtime_model()` function, but the module-level constant at `server.py:1183` reads it independently and is never consumed — creating a confusing duplicate read.

---

## 6. Realtime Voice Audit

### 6.1 Architecture Overview

The realtime voice pipeline is OpenAI-native end-to-end:

```
Browser mic → RTCPeerConnection → OpenAI Realtime API → Speech-to-speech → Browser speaker
```

### 6.2 Token Generation

File: `backend/server.py` lines 1215-1289, endpoint `POST /voice/realtime-secret`.

- Calls `https://api.openai.com/v1/realtime/client_secrets` directly via `httpx`
- Injects `OPENAI_API_KEY` server-side only — key never exposed to the browser
- Session expires in 600 seconds
- Passes `systemPrompt`, `voice`, `model`, `turn_detection`, `transcription` settings
- Uses `semantic_vad` with `eagerness: high` and `interrupt_response: true`
- The transcription model used may be an unvalidated ID (see Section 4.3)

### 6.3 SDP Negotiation

File: `src/voice/conversation.ts` lines 13, 281-294.

- Sends offer SDP to `https://api.openai.com/v1/realtime/calls` (correct OpenAI endpoint)
- Uses the ephemeral `secret.value` as Bearer token — not the master API key
- `RTCPeerConnection` with no explicit STUN/TURN — relies on OpenAI's native WebRTC
- Data channel named `oai-events` (correct OpenAI realtime channel name)

### 6.4 Audio Routing

File: `src/voice/conversation.ts` lines 229-241.

- `pc.ontrack` routes remote audio to an `<audio autoplay>` element AND to `AudioContext` via `createMediaStreamSource`
- Local microphone captured via `getUserMedia` with `echoCancellation`, `noiseSuppression`, `autoGainControl`
- Mic mute implemented by toggling `track.enabled` (not stopping the track — correct)

### 6.5 Transcription Handling

File: `src/voice/conversation.ts` lines 351-353.

- Handles both `conversation.item.input_audio_transcription.completed` and `input_audio_transcription.completed`
- Handles both `response.audio_transcript.delta` and `response.output_text.delta`
- Emotion detection and language detection run on committed assistant text

### 6.6 Interruption Handling

File: `src/voice/conversation.ts` lines 337-343.

- `input_audio_buffer.speech_started` triggers `response.cancel` when patient is speaking
- State transitions correctly: `speaking` → `interrupted` → `listening`
- Gracefully ignores `"Cancellation failed: no active response found"` errors from OpenAI

### 6.7 Reconnect Handling

File: `src/voice/conversation.ts` lines 620-663.

- Up to 3 reconnect attempts with 1500ms backoff
- Reuses `localStream` (mic) across reconnects — avoids re-prompting the user for microphone permission
- `RTCPeerConnection.onconnectionstatechange` triggers reconnect on `failed` or `disconnected`
- `conversationStore.ts` evicts disposed conversations and recreates fresh ones

### 6.8 State Machine

- Explicit FSM with `VALID_TRANSITIONS` guard — invalid transitions logged but not thrown
- Timeout guards on `loading` (15s), `processing` (12s), `recovering` (5s)
- State logged to `eventLog` for debug overlay

### 6.9 Browser Compatibility

- Falls back to `webkitAudioContext` for Safari
- `<audio playsinline>` for mobile Safari autoplay compliance
- `AudioContext` pre-warmed inside a user gesture handler (`acceptNextPatient` in `store.ts`) to satisfy browser autoplay policies

### 6.10 Voice Assignment Dispatch Path (Summary)

```
conversationStore.ts:getOrCreatePatientConversation()
  → speakerGender = isPediatric ? parentGenderFor(case) : case.gender
  → new Conversation(..., { voiceGender: speakerGender })
      → fetchRealtimeSecret POST { gender: this.voiceGender }
          → server.py:_realtime_voice_for(req)
              → if M: OPENAI_REALTIME_MALE_VOICE || OPENAI_REALTIME_VOICE || "ballad"
              → if F: OPENAI_REALTIME_FEMALE_VOICE || OPENAI_REALTIME_VOICE || "shimmer"
```

---

## 7. Female/Male Voice Assignment Audit

### 7.1 Current Implementation Status

Gender-aware voice assignment is **partially implemented** but **broken in the current `.env.local` configuration**.

**Layer 1 — Frontend Gender Detection** (`src/voice/conversationStore.ts`, lines 102-109):

```typescript
const speakerGender: 'M' | 'F' = isPediatric(patientCase)
  ? parentGenderFor(patientCase)   // deterministic FNV-1a hash from case ID
  : patientCase.gender;            // directly from patient data ('M' or 'F')
```

- Adult patients: uses `patientCase.gender` directly
- Pediatric patients: uses deterministic hash so the speaking parent is consistent with the 3D scene

**Layer 2 — Gender Sent to Backend** (`src/voice/conversation.ts`, line 315):

```typescript
gender: this.voiceGender,   // 'M' or 'F'
```

The `voiceGender` is sent correctly in every realtime secret request.

**Layer 3 — Backend Voice Selection** (`backend/server.py`, lines 1204-1212):

```python
def _realtime_voice_for(req: RealtimeSecretRequest) -> str:
    if req.voice:
        return req.voice
    gender = (req.gender or "F").upper()
    if gender == "M":
        return os.environ.get("OPENAI_REALTIME_MALE_VOICE") or \
               os.environ.get("OPENAI_REALTIME_VOICE") or "ballad"
    else:
        return os.environ.get("OPENAI_REALTIME_FEMALE_VOICE") or \
               os.environ.get("OPENAI_REALTIME_VOICE") or "shimmer"
```

The logic is correct in isolation, but the configuration defeats it.

### 7.2 Gaps Identified

**Gap 1 — Single `OPENAI_REALTIME_VOICE` Overrides Both Genders (ACTIVE BUG)**

`.env.local` sets `OPENAI_REALTIME_VOICE=marin`. Because `_realtime_voice_for()` checks `OPENAI_REALTIME_VOICE` before falling back to gender-specific defaults, and because `OPENAI_REALTIME_MALE_VOICE` is not set:

```
Male patient   → checks OPENAI_REALTIME_MALE_VOICE (not set) → checks OPENAI_REALTIME_VOICE → "marin"  ← WRONG
Female patient → checks OPENAI_REALTIME_FEMALE_VOICE (not set) → checks OPENAI_REALTIME_VOICE → "marin" ← correct only by coincidence
```

**Result**: In the current configuration, ALL patients use `marin` regardless of gender. The gender-differentiated fallback voices (`ballad` for male, `shimmer` for female) are never reached.

**Gap 2 — `OPENAI_REALTIME_MALE_VOICE` and `OPENAI_REALTIME_FEMALE_VOICE` Are Undocumented**

These two environment variables exist in `server.py` but are absent from `.env.example`. Developers cannot discover them without reading the source.

**Gap 3 — `Conversation` Constructor Defaults `voiceGender` to `'F'`**

File: `src/voice/conversation.ts` line 181.

```typescript
this.voiceGender = options.voiceGender ?? 'F';
```

If `getOrCreatePatientConversation()` is ever bypassed or a `Conversation` is instantiated directly without providing `voiceGender`, it will default to female regardless of the actual patient gender.

**Gap 4 — Voice Selection Not Covered by Tests**

The test suite does not test `_realtime_voice_for()` or the `/voice/realtime-secret` endpoint. There is no assertion that a male patient receives a male voice.

### 7.3 Recommended Insertion Points (No Implementation)

To fix Gap 1:
- File `backend/.env.local` — add `OPENAI_REALTIME_MALE_VOICE=ballad` and `OPENAI_REALTIME_FEMALE_VOICE=marin` (or `shimmer`), and remove or rename the generic `OPENAI_REALTIME_VOICE` so it does not shadow the gender-specific keys.

To fix Gap 2:
- File `backend/.env.example` — document `OPENAI_REALTIME_MALE_VOICE` and `OPENAI_REALTIME_FEMALE_VOICE`.

To fix Gap 4:
- Add a unit test in `backend/tests/` that calls `_realtime_voice_for()` with both `M` and `F` inputs and asserts correct voice names.

### 7.4 Affected Files

| File | Role | Issue |
|---|---|---|
| `backend/server.py:1204-1212` | Voice selection logic | Gap 1: generic var shadows gender-specific |
| `backend/.env.local:23` | `OPENAI_REALTIME_VOICE=marin` | Gap 1: this value blocks gender splitting |
| `backend/.env.example` | Documentation | Gap 2: missing male/female voice docs |
| `src/voice/conversation.ts:181` | Default voiceGender | Gap 3: defaults to 'F' |
| `backend/tests/` | Test coverage | Gap 4: no voice selection test |

---

## 8. Risks

### 8.1 Critical Risks

| Risk | File(s) | Detail |
|---|---|---|
| Live third-party API keys in dead config | `backend/.env.local:11-19` | Groq, Deepgram, Cartesia, LiveKit keys — active credentials for removed services. Should be revoked immediately. |
| Dead Procfile worker will crash on deploy | `backend/Procfile:2` | `python voice_agent.py start` fails because `voice_agent.py` does not exist. On Render/Heroku, this causes a worker crash loop on every deployment. |

### 8.2 Medium Risks

| Risk | File(s) | Detail |
|---|---|---|
| All patients use the same voice regardless of gender | `backend/.env.local:23`, `server.py:1210-1212` | `OPENAI_REALTIME_VOICE=marin` shadows gender-specific selection. Male patients receive a female-presenting voice. |
| Hallucinated model IDs in candidate lists | `server.py:594-595, 627` | `gpt-realtime-mini`, `gpt-realtime`, `gpt-realtime-whisper` are not valid OpenAI identifiers. Safe at runtime (probe ignores them) but misleading. |
| Undocumented override env vars | `server.py:217, 222, 1210-1212` | `OPENAI_AGENT_MODEL`, `OPENAI_TRIAGE_MODEL`, `OPENAI_REALTIME_MALE_VOICE`, `OPENAI_REALTIME_FEMALE_VOICE` — functional levers invisible to operators. |
| Dead module-level `OPENAI_REALTIME_MODEL` constant | `server.py:1183` | Declared but never consumed. Creates false belief that it controls runtime model selection. |

### 8.3 Low Risks

| Risk | File(s) | Detail |
|---|---|---|
| Misleading comments in `vite.config.ts` | `vite.config.ts:10, 19` | "Claude Managed Agents proxy" and "backend mints LiveKit tokens" — both false. No runtime impact. |
| Dead Ollama proxy route | `vite.config.ts:5-9` | `/ollama` proxy to `localhost:11434`. No code calls it. |
| `buildOpeningLineInstruction()` may be dead code | `src/voice/patientPersona.ts:129-144` | Exported but not referenced in any import or call in the current codebase. |
| Voice_agent.py comment fossil | `src/voice/patientPersona.ts:122` | Comment references a deleted file. |
| Test docstring hardcodes model name | `backend/tests/test_triage.py:6` | Says `gpt-4o-mini` — will become stale if `TRIAGE_MODEL` ever changes. |
| Future-dated transcribe model alias | `server.py:624` | `gpt-4o-mini-transcribe-2025-12-15` — cannot match any real model. |

---

## 9. Cleanup Recommendations

> DO NOT implement. Only listed for planning purposes.

### 9.1 Credential Cleanup (High Priority)

1. Revoke at provider dashboards, then remove from `backend/.env.local`:
   - `GROQ_API_KEY`
   - `DEEPGRAM_API_KEY`
   - `CARTESIA_API_KEY`
   - `LIVEKIT_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`
2. Remove the "Hybrid Provider API Keys" section header.
3. Remove the LiveKit comment block from `.env.local` (lines 15-19).

### 9.2 Procfile Cleanup

Remove the dead worker line from `backend/Procfile`:
```
# DELETE: worker: python voice_agent.py start
```
Only the `web:` entry is valid.

### 9.3 Comment Cleanup

- `vite.config.ts` line 10: Replace "Claude Managed Agents proxy" with "OpenAI grading agent proxy"
- `vite.config.ts` line 19: Replace "backend mints LiveKit tokens" with "backend mints OpenAI Realtime client secrets"
- `backend/.env.local` lines 15-16: Remove the LiveKit/voice_agent.py comment
- `src/voice/patientPersona.ts` line 122: Remove or replace the `voice_agent.py` reference

### 9.4 Model List Cleanup

In `backend/server.py` `get_best_realtime_model()`, remove invalid candidates:
- Delete `"gpt-realtime-mini"` (line 594)
- Delete `"gpt-realtime"` (line 595)

In `get_best_transcribe_model()`, clean up unvalidated entries:
- Delete `"gpt-4o-mini-transcribe-2025-12-15"` (line 624)
- Delete `"gpt-4o-mini-transcribe-2025-03-20"` (line 625)
- Delete `"gpt-realtime-whisper"` (line 627)

Remove the dead module-level constant at `server.py` line 1183:
- Delete `OPENAI_REALTIME_MODEL = os.environ.get("OPENAI_REALTIME_MODEL", "gpt-4o-mini-realtime-preview")`

### 9.5 Ollama Proxy Cleanup

Remove from `vite.config.ts`:
```javascript
// DELETE:
'/ollama': {
  target: 'http://localhost:11434',
  changeOrigin: true,
  rewrite: (path) => path.replace(/^\/ollama/, ''),
},
```

### 9.6 Voice Consistency Fix

In `backend/.env.local`:
- Add: `OPENAI_REALTIME_MALE_VOICE=ballad`
- Add: `OPENAI_REALTIME_FEMALE_VOICE=marin`
- Remove or clearly document `OPENAI_REALTIME_VOICE` as a full override (not a gender-neutral default)

In `backend/.env.example`, document all voice override vars.

### 9.7 Environment Documentation

In `backend/.env.example`, add:
- `OPENAI_AGENT_MODEL` (optional, defaults to `gpt-4o`)
- `OPENAI_TRIAGE_MODEL` (optional, defaults to `gpt-4o-mini`)
- `OPENAI_REALTIME_MALE_VOICE` (optional, defaults to `ballad`)
- `OPENAI_REALTIME_FEMALE_VOICE` (optional, defaults to `shimmer`)
- `BACKEND_SHARED_SECRET` (required in production)
- `EHR_API_TOKEN` (optional, enables vault endpoint)

### 9.8 Dead Code Cleanup

- Investigate and potentially remove `buildOpeningLineInstruction()` from `src/voice/patientPersona.ts` — if unused, it is dead exported code.
- Add a unit test for `_realtime_voice_for()` to lock in male/female voice selection behavior.

---

*End of audit. No code was modified. All findings are read-only observations.*
