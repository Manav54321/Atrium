# Atrium Backend Services

The backend is now intentionally small. It keeps secrets server-side, mints short-lived OpenAI Realtime client secrets, and exposes the attending/triage support endpoints used by the browser.

1.  **FastAPI Web Server** (`server.py`):
    *   Generates OpenAI Realtime client secrets at `/voice/realtime-secret`.
    *   Proxies attending debrief and triage requests through the OpenAI API.
    *   Listens on `127.0.0.1:8787`.

2.  **Browser Realtime Session**:
    *   The frontend connects directly to OpenAI Realtime over WebRTC.
    *   OpenAI handles STT, reasoning, TTS, turn-taking, and interruptions.

---

## Installation & Setup

```bash
python -m venv .venv
.venv/bin/python -m pip install -r requirements.txt
```

On Windows, replace `.venv/bin/` with `.venv/Scripts/`.

---

## Local Environment Configuration

Secrets and configuration settings are stored in `backend/.env.local`:

```env
OPENAI_API_KEY=sk-...
OPENAI_REALTIME_MODEL=gpt-realtime
OPENAI_REALTIME_VOICE=marin
```

`OPENAI_REALTIME_MODEL` and `OPENAI_REALTIME_VOICE` are optional; the defaults are `gpt-realtime` and `marin`.

---

## Running Backend Services

```bash
.venv/bin/python server.py
```
