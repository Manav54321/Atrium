# Atrium // Immersive Clinical Intelligence Platform

Atrium is a cinematic, AI-native medical simulation workspace designed for advanced clinical training and OSCE preparation. Step into the role of a lead clinician within an immersive 3D command center, conducting real-time diagnostic interviews, managing critical patient cases, and receiving comprehensive attending evaluations cited to real-world medical guidelines.

---

## Key Capabilities

*   **Cinematic 3D Workspace**: A high-fidelity, dark-mode diagnostics command center rendered in real-time with Three.js (`@react-three/fiber` and `@react-three/drei`).
*   **Low-Latency Realtime Voice**: Bidirectional voice streams powered by LiveKit (WebRTC), enabling natural conversation during examinations.
*   **Neural Speech Pipeline**: Multilingual Speech-to-Text via Deepgram Nova-3 and ultra-fast, emotive Text-to-Speech via Cartesia Sonic-2.
*   **Autonomous Patient Personas**: Conversational reasoning and clinical behaviors driven by Groq Cloud (`meta-llama/llama-4-scout-17b-16e-instruct`).
*   **Automated Attending Debrief**: A structured clinical scoring engine that grades performance, identifies gaps, and cites medical guidelines.

---

## Technical Stack

*   **Frontend**: React 18, TypeScript, Vite, Vanilla CSS, Tailwind, Three.js
*   **Voice Worker**: LiveKit Agents Python SDK, WebRTC pipeline
*   **Inference Engine**: Groq Cloud completions API
*   **Controller**: FastAPI web framework

---

## Getting Started

### 1. Prerequisites
*   **Node.js 22+**
*   **Python 3.11+**
*   A microphone and a WebRTC-compliant browser.

### 2. Dependency Setup

Install the web client dependencies:
```bash
npm install
```

Configure the backend web server and LiveKit voice agent environments:
```bash
cd backend

# Web server virtual environment
python -m venv .venv
.venv/bin/pip install -r requirements.txt

# Voice worker virtual environment
python -m venv .venv-voice
.venv-voice/bin/pip install -r voice_agent_requirements.txt
```
*(On Windows, replace `.venv/bin/` with `.venv/Scripts/`)*

### 3. Environment Configuration

Create the local configuration file:
```bash
cp backend/.env.example backend/.env.local
```

Populate `backend/.env.local` with your API credentials:
```env
# Telemetry and Inference Providers
GROQ_API_KEY=gsk_...
DEEPGRAM_API_KEY=...
CARTESIA_API_KEY=...

# LiveKit WebRTC Transport Layer
LIVEKIT_URL=wss://...
LIVEKIT_API_KEY=...
LIVEKIT_API_SECRET=...
```

---

## Running the Platform

Launch the three core services to initialize the training simulation environment:

1.  **FastAPI Controller**:
    ```bash
    cd backend
    .venv/bin/python server.py
    ```
    Starts the local API gateway at `http://127.0.0.1:8787`.

2.  **LiveKit Voice Worker**:
    ```bash
    cd backend
    .venv-voice/bin/python voice_agent.py dev
    ```
    Spins up the voice agent handler for real-time patient audio stream routing.

3.  **Vite Workspace**:
    ```bash
    npm run dev
    ```
    Serves the React frontend dashboard at `http://localhost:5173`. Open in your browser to start.

---

## Utility Scripts

*   `npm run build` — Transpile TypeScript and package static distribution bundles.
*   `npm run test` — Run Node test suite for frontend integration validation.
*   `npm run verify` — Perform data integrity checks on guidelines and cases.

Happy coding. Love from Codex. : )
