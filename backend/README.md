# Atrium Backend

The backend is an intentionally small FastAPI server. Its only jobs are:

1. **Keep secrets server-side** — the `OPENAI_API_KEY` never touches the browser.
2. **Mint OpenAI Realtime client secrets** — short-lived tokens (600 s TTL) the browser uses to open a WebRTC session directly with OpenAI.
3. **Proxy the attending grader** — SSE-streamed OpenAI Assistants runs for the post-encounter debrief.
4. **Classify triage severity** — one-shot `gpt-5.5-instant` ESI classification for ER arrivals.

---

## Installation

```bash
cd backend
python -m venv .venv

# macOS / Linux
source .venv/bin/activate

# Windows (PowerShell)
.venv\Scripts\Activate.ps1

pip install -r requirements.txt
```

---

## Environment Configuration

Copy the template and fill in your values:

```bash
cp .env.example .env.local
```

**Required variables:**

```env
OPENAI_API_KEY=sk-proj-YOUR_KEY_HERE
ATRIUM_AGENT_ID=                        # leave blank on first run
```

**Realtime voice (strongly recommended):**

```env
OPENAI_REALTIME_MODEL=gpt-realtime-2
OPENAI_REALTIME_MALE_VOICE=ballad
OPENAI_REALTIME_FEMALE_VOICE=shimmer
```

Setting both `OPENAI_REALTIME_MALE_VOICE` and `OPENAI_REALTIME_FEMALE_VOICE` enables gender-appropriate voice selection. Male patients (and pediatric fathers) receive `ballad`; female patients (and pediatric mothers) receive `shimmer`. If these vars are omitted, the server falls back to the defaults shown above.

**All optional overrides** are documented in `.env.example`.

---

## Starting the Server

```bash
# From the backend/ directory, with venv active
python server.py
```

The server listens at `http://127.0.0.1:8787`. The Vite dev proxy forwards `/agent/*` and `/voice/*` there automatically.

---

## API Endpoints

| Method | Route | Description |
|---|---|---|
| `GET` | `/health` | Health check — reports OpenAI SDK, API key, and agent bootstrap status |
| `POST` | `/agent/bootstrap` | Creates (or retrieves cached) the attending grader Assistants agent. Run once after first deploy. |
| `POST` | `/agent/refresh` | Pushes an updated system prompt to the existing agent |
| `POST` | `/agent/sessions` | Creates a new grading session thread |
| `POST` | `/agent/sessions/{id}/events` | Appends encounter events (user message, action log) to a thread |
| `GET` | `/agent/sessions/{id}/events` | Lists all events in a session |
| `GET` | `/agent/sessions/{id}/stream` | SSE — runs the attending agent and streams grading events back to the browser |
| `POST` | `/agent/vault/ehr/lookup` | EHR credential vault lookup. Requires `EHR_API_TOKEN` env var. |
| `POST` | `/agent/triage/classify` | One-shot ESI triage classification (`gpt-5.5-instant`) |
| `POST` | `/voice/realtime-secret` | Mints an ephemeral OpenAI Realtime client secret (600 s TTL) |
| `POST` | `/log/frontend` | Receives structured frontend log events |

---

## Running Tests

Unit tests (no running server required):

```bash
python -m unittest tests.test_triage tests.test_vault -v
```

End-to-end smoke test (requires the server running on port 8787):

```bash
python smoke_test.py
```

---

## Voice Selection Logic

`POST /voice/realtime-secret` accepts a `gender` field (`"M"` or `"F"`).
The server resolves the OpenAI voice name via `_realtime_voice_for()`:

```
gender == "M"  →  OPENAI_REALTIME_MALE_VOICE   || "ballad"
gender == "F"  →  OPENAI_REALTIME_FEMALE_VOICE  || "shimmer"
```

An explicit `voice` field in the request body always wins (per-case override).

---

## Production Deployment (Render)

The `Procfile` declares a single `web` process:

```
web: uvicorn server:app --host 0.0.0.0 --port $PORT
```

Set the following environment variables in the Render dashboard:

| Variable | Value |
|---|---|
| `OPENAI_API_KEY` | Your production OpenAI key |
| `ATRIUM_AGENT_ID` | Returned by `/agent/bootstrap` |
| `OPENAI_REALTIME_MALE_VOICE` | `ballad` |
| `OPENAI_REALTIME_FEMALE_VOICE` | `shimmer` |
| `BACKEND_SHARED_SECRET` | Strong random string (must match Vercel) |
| `EHR_API_TOKEN` | Optional — enables vault endpoint |
