# Atrium Backend Services

The backend architecture consists of two distinct Python services that coordinate to manage the simulation logic, credentials, and WebRTC streaming:

1.  **FastAPI Web Server** (`server.py`):
    *   Generates secure WebRTC access tokens for LiveKit rooms (`/voice/token`).
    *   Proxies and structures patient text-chat completion requests and evaluation metrics.
    *   Listens on `127.0.0.1:8787`.

2.  **LiveKit Voice Worker** (`voice_agent.py`):
    *   Automatically joins active LiveKit rooms dispatched by the server.
    *   Manages the real-time audio pipeline: transcribes doctor input (Deepgram Nova-3), performs conversational reasoning (Groq Llama-4), and synthesizes spoken patient output (Cartesia Sonic-2).

---

## Installation & Setup

Both services run in separate virtual environments to keep dependencies isolated:

```bash
# Set up web server
python -m venv .venv
.venv/Scripts/python -m pip install -r requirements.txt

# Set up voice agent worker
python -m venv .venv-voice
.venv-voice/Scripts/python -m pip install -r voice_agent_requirements.txt
```

---

## Local Environment Configuration

Secrets and configuration settings are stored in `backend/.env.local` (created by copying `.env.example`).

*   `GROQ_API_KEY` — Required for generating patient dialogue and grading encounters.
*   `DEEPGRAM_API_KEY` — Required for streaming speech transcription.
*   `CARTESIA_API_KEY` — Required for low-latency text-to-speech voice synthesis.
*   `LIVEKIT_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET` — WebRTC room connection variables.

---

## Running Backend Services

Launch both processes in separate terminal instances:

```bash
# Terminal 1: FastAPI server
.venv/Scripts/python server.py

# Terminal 2: Voice agent worker
.venv-voice/Scripts/python voice_agent.py dev
```
