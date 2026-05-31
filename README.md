# Atrium — Immersive Clinical Intelligence Platform

Atrium is an AI-native medical simulation workspace for advanced clinical training, supporting both global/UK workflows (PLAB2 / OSCE) and Indian workflows (NEXT / FMGE / MBBS practicals). It places the user in the role of a consulting clinician inside an immersive 3D room, conducting real-time voice interviews with patients, ordering tests, forming diagnoses, prescribing treatments, and receiving an automated attending evaluation cited to real-world clinical guidelines.

---

## Key Capabilities

- **Cinematic 3D Consult Room** — A stylized polyclinic room rendered in real-time with Three.js (`@react-three/fiber` / `@react-three/drei`). Patients walk in, sit down, and react dynamically.
- **OpenAI Realtime Voice** — Direct browser WebRTC sessions with the OpenAI Realtime API. Speech-to-text, reasoning, interruption handling, and text-to-speech all flow through a single OpenAI connection — zero third-party STT or TTS services.
- **Gender-Aware Voice Selection** — Male patients speak with a male voice (`ballad`); female patients and pediatric case parents speak with a female voice (`shimmer`). Fully deterministic and configurable via env vars.
- **Autonomous Patient Personas** — Deterministic clinical personas stay in-character, reveal history gradually, express realistic emotions, and support English, Hindi, and Hinglish.
- **Automated Attending Debrief** — A structured OSCE scoring engine (OpenAI Assistants) grades performance across data-gathering, clinical management, and interpersonal domains — with every criterion cited to a real guideline.
- **Multi-Specialty Case Library** — Cases spanning Internal Medicine, Pediatrics, Cardiology, Respiratory, Neurology, Emergency Medicine, and endemic infectious diseases (Dengue, Tuberculosis, Typhoid, Heat stroke, Malnutrition, Rheumatic heart disease, Maternal anemia, Organophosphate poisoning).

---

## India-Focused Clinical Training

Atrium natively supports Indian clinical training pathways and workflows, ensuring alignment with the National Medical Commission (NMC) competency standards, the National Exit Test (NEXT), and FMGE preparation.

Key features include:
- **Low-Resource Clinical Reasoning** — Scenarios requiring clinical judgment in low-resource environments (e.g., opting for essential-only tests, prescribing cost-effective generic medications as per NMC guidelines).
- **India-Native Case Scenarios** — Practice cases featuring endemic diseases (Dengue fever, Tuberculosis, Typhoid), environmental emergencies (Heat stroke), pediatric conditions (Malnutrition), and acute toxicological presentations (Organophosphate poisoning).
- **OPD & Consultation Realism** — Simulate high-pressure government hospital OPD environments or structured private hospital consultations.
- **Cultural & Communication Realism** — Patients present with realistic behaviors, such as family members speaking on behalf of patients, concerns about treatment/test costs, medicine non-adherence, and code-switching mid-conversation between English, Hindi, and Hinglish.

---

## Visual Design System

Atrium uses a character-driven cartoon aesthetic inspired by Duolingo, Animal Crossing, and Pokémon:

| Element | Design |
|---|---|
| **Color palette** | Warm cream backgrounds, bold saturated accents (mint, peach, coral, butter, lavender) |
| **Borders** | Thick `4px solid #151B3D` outlines everywhere — flat cartoon sticker style |
| **Shadows** | 3D offset block shadows (`4px 4px 0px #151B3D`) for tactile depth |
| **Typography** | Fredoka (headings) + Nunito (body) — round, friendly, highly legible |
| **Mascots** | 20+ chibi patient characters — large heads, expressive eyes, personality accessories |
| **Animations** | `floaty`, `wobble`, `breathe`, `popin`, `drift` — every mascot is always gently moving |
| **Cards** | Collectible trading card format with colored header bands, condition badges, and difficulty stars |

---

## Audio System

The entire audio engine is **procedurally generated** — no MP3 files. Everything runs through the Web Audio API.

### Background Music
A warm, looping Animal Crossing / Pokémon Center style melody built from:
- **Fmaj7 → G6 → Em7 → Am7** chord progression
- Triangle wave arpeggios (soft marimba) + sine wave lead (cozy bells/flute)
- 5.5 Hz vibrato on lead notes
- Smooth 1.2s fade-in on every session start

### UI Sounds
| Sound | When | Character |
|---|---|---|
| `playHover()` | Any interactive element — `onMouseEnter` | Tiny upward frequency sweep (`260Hz → 580Hz`) |
| `playCardHover()` | Patient cards, case cards, domain rings | Soft triangle downward thump |
| `playClick()` | Any `onClick` | Subtle high-pass noise tick + gentle bell chime (C5/G5) |
| `playSuccess()` | Debrief load, level complete | Ascending C5→E5→G5→C6 arpeggio cascade |
| `playTransition()` | Screen navigation | Bandpass noise whoosh |

**Debounce**: All hover sounds use a `WeakMap<EventTarget, number>` per-element cooldown (120ms minimum) — moving the mouse inside the same element never triggers double sounds.

---

## Patient Mascots

Every patient is a unique **chibi cartoon character** — not a generic avatar:

| Mascot | Personality |
|---|---|
| Office worker | Messy hair, tired eyes, coffee cup |
| Elderly male | Warm smile, walking stick |
| Young athlete | Sporty, energetic pose |
| Child | Propeller hat, oversized backpack |
| Pregnant patient | Soft rounded design, serene expression |
| Emergency patient | Wide eyes, distressed pose |
| Scientist | Lab coat, clipboard |
| + 13 more... | Each with unique accessories and mood states |

Mascot selection is **deterministic** — the same patient always gets the same character based on their case ID, age, sex, and chief complaint.

---

## Technical Stack

| Layer | Technology |
|---|---|
| Frontend framework | React 18, TypeScript, Vite |
| Styling | Vanilla CSS + HSL design tokens |
| Audio engine | Web Audio API (procedural — zero MP3s for UI sounds) |
| 3D scene | Three.js via `@react-three/fiber` and `@react-three/drei` |
| Realtime voice | OpenAI Realtime API over WebRTC (browser-direct) |
| Attending grader | OpenAI Assistants API (`gpt-5.5`) |
| Triage classifier | OpenAI Chat Completions (`gpt-5.5-instant`) |
| Backend server | FastAPI (Python 3.11+), Uvicorn |
| Backend-to-OpenAI | `openai >= 1.78.0`, `httpx` |

---

## Repository Structure

```
Atrium/
├── backend/                         FastAPI backend
│   ├── server.py                    Main server — OpenAI secret minting, grader proxy, triage
│   ├── smoke_test.py                End-to-end smoke test script (run before demos)
│   ├── requirements.txt             Python dependencies (fastapi, openai, httpx, uvicorn…)
│   ├── Procfile                     Render/Heroku deploy descriptor (web process only)
│   ├── .env.example                 Environment variable template — copy to .env.local
│   ├── .env.local                   Local secrets (gitignored — never commit this file)
│   ├── README.md                    Backend setup reference
│   └── tests/
│       ├── test_triage.py           Unit tests for the triage ESI classifier
│       └── test_vault.py            Unit tests for the EHR vault endpoint
│
├── src/                             React frontend source
│   ├── main.tsx                     Application entry point
│   ├── App.tsx                      Screen router (splash → mode → encounter → debrief…)
│   │
│   ├── game/                        Core state engine
│   │   ├── store.ts                 Global consultation state (useSyncExternalStore)
│   │   ├── types.ts                 Types: PatientCase, ActivePatient, CaseRubric, GameState…
│   │   └── clinic.ts                Specialty clinic enum (GP, Cardiology, Paediatrics…)
│   │
│   ├── utils/
│   │   └── audioSystem.ts           Procedural audio engine (background music + UI sounds)
│   │
│   ├── voice/                       Realtime voice engine
│   │   ├── conversation.ts          WebRTC session lifecycle, FSM state, emotion/language heuristics
│   │   ├── conversationStore.ts     AudioContext management and patient conversation cache
│   │   └── patientPersona.ts        Algorithmic system-prompt builder (traits, anxiety, ICE, opening line)
│   │
│   ├── data/                        Static medical knowledge base
│   │   ├── polyclinicPatients.ts    Full case database (histories, vitals, tests, rubrics)
│   │   ├── guidelines.ts            Clinical guideline registry (NICE, BNF, SIGN, ICMR, NMC, AIIMS, RSSDI, IAP, FOGSI, NABH, NHM)
│   │   ├── cases.ts                 Case catalogue compiler
│   │   ├── tests.ts                 Lab, imaging, and bedside test index
│   │   ├── treatments.ts            Treatment catalogue
│   │   ├── medications.ts           Pharmacological catalogue (names, doses, frequencies)
│   │   ├── evalHistory.ts           Local evaluation history storage
│   │   └── patients.ts / defaultTestResults.ts / radiologyImages.ts / avatarModels.ts
│   │
│   ├── agents/                      Attending grading agent
│   │   ├── managedAgent.ts          OpenAI Assistants SDK client
│   │   ├── debriefRequest.ts        OSCE rubric parsing and prompt payload builders
│   │   ├── customTools.ts           Custom tool definitions (render_case_evaluation…)
│   │   ├── autoRubric.ts            Auto-rubric generator for cases without explicit rubric
│   │   └── useAttendingDebrief.ts   React hook — orchestrates debrief streaming results
│   │
│   ├── styles/                      Global CSS + HSL color palettes
│   │
│   └── components/                  Screen and UI components
│       ├── SplashScreen.tsx         Loading / splash
│       ├── OnboardingScreen.tsx     First-run tutorial (3 steps)
│       ├── ModeSelectScreen.tsx     Polyclinic vs library mode picker
│       ├── HomeScreen.tsx           Dashboard
│       ├── CaseLibraryScreen.tsx    Browsable case catalogue
│       ├── BriefScreen.tsx          Pre-encounter patient brief card
│       ├── EncounterScreen.tsx      3D canvas wrapper + hotkeys + mute control
│       ├── ExamineOverlay.tsx       2D examine modal (History, Chat, Tests, Diagnose, Rx tabs)
│       ├── DockedVoicePanel.tsx     Floating voice HUD (transcripts, emotion, language chip)
│       ├── EndConfirmScreen.tsx     End-consultation confirmation checklist
│       ├── DebriefScreen.tsx        Attending evaluation sheet (domain scores, guideline citations)
│       ├── HistoryScreen.tsx        Past evaluations history viewer
│       ├── GPRoomScreen.tsx         GP room screen
│       ├── BackgroundMusic.tsx      Ambient music controller + AudioContext lifecycle
│       ├── mascots.tsx              All 20+ chibi SVG patient characters
│       ├── primitives.tsx           Shared UI primitives (TopBar, Breadcrumbs, etc.)
│       └── three/                   3D scene components
│           ├── Polyclinic.tsx       Room mesh (furniture, walls, lights, walk-in/out animations)
│           ├── Player.tsx           First-person camera and pointer-lock
│           ├── StylizedCharacter.tsx 3D avatar mesh (skin, hair, companion determinism)
│           ├── FloatingVoicePanel.tsx 3D HTML speech bubble over seated patient
│           ├── createStore.ts       Three.js state store
│           └── interactions.ts      Pointer interaction helpers
│
└── scripts/                         Developer utilities
    ├── verify/                      Data integrity validators
    │   ├── run-all.ts               Runs all verify scripts
    │   ├── data-integrity.ts        Case + guideline cross-reference check
    │   ├── rubric-smoke.ts          Rubric citation resolution check
    │   ├── three-scene.ts           3D asset path validator
    │   └── triage-priority.ts       Triage severity ordering check
    └── test/                        Integration test suite
        ├── run-all.ts               Runs all tests
        ├── custom-tools.test.ts     Custom tool schema validation
        └── loop-commands.test.ts    Agent loop command tests
```

---

## Setup & Installation

### Prerequisites

- **Node.js 22+**
- **Python 3.11+**
- An **OpenAI API key** with access to `gpt-5.5`, `gpt-5.5-instant`, and `gpt-realtime-2`
- A microphone and a WebRTC-capable browser (Chrome, Edge, or Safari 17+)

---

### 1. Backend Setup

```bash
cd backend
python -m venv .venv

# macOS / Linux
source .venv/bin/activate

# Windows (PowerShell)
.venv\Scripts\Activate.ps1
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Create your local environment file:

```bash
cp .env.example .env.local
```

Open `backend/.env.local` and fill in your credentials:

```env
# Required
OPENAI_API_KEY=sk-proj-YOUR_KEY_HERE
ATRIUM_AGENT_ID=              # leave blank on first run; set automatically by /agent/bootstrap

# Realtime voice — gender-specific voices
OPENAI_REALTIME_MODEL=gpt-realtime-2
OPENAI_REALTIME_MALE_VOICE=ballad
OPENAI_REALTIME_FEMALE_VOICE=shimmer
```

See `backend/.env.example` for all optional override variables.

---

### 2. Frontend Setup

From the repository root:

```bash
npm install
```

---

## Running the Platform

Launch the backend and frontend in two separate terminals.

**Terminal 1 — FastAPI backend:**

```bash
cd backend
source .venv/bin/activate      # or .venv\Scripts\Activate.ps1 on Windows
python server.py
```

Starts the backend at `http://127.0.0.1:8787`.

**Terminal 2 — Vite frontend:**

```bash
npm run dev
```

Opens the app at `http://localhost:5173`.

---

## Backend API Reference

All routes are proxied through Vite in development (`/agent/*`, `/voice/*`) and through the Vercel edge middleware in production.

| Method | Route | Description |
|---|---|---|
| `GET` | `/health` | Health check — confirms OpenAI SDK, API key, and agent bootstrap status |
| `POST` | `/agent/bootstrap` | Creates (or retrieves cached) the attending grader Assistants agent |
| `POST` | `/agent/refresh` | Pushes an updated system prompt to the existing agent |
| `POST` | `/agent/sessions` | Creates a new grading session thread |
| `POST` | `/agent/sessions/{id}/events` | Appends encounter events (user message, action log) to the thread |
| `GET` | `/agent/sessions/{id}/events` | Lists all events in a session thread |
| `GET` | `/agent/sessions/{id}/stream` | SSE stream — runs the attending agent and streams grading events |
| `POST` | `/agent/vault/ehr/lookup` | EHR credential vault lookup (requires `EHR_API_TOKEN`) |
| `POST` | `/agent/triage/classify` | One-shot ESI triage classification via `gpt-5.5-instant` |
| `POST` | `/voice/realtime-secret` | Mints a short-lived OpenAI Realtime client secret (600s TTL) |
| `POST` | `/log/frontend` | Receives structured frontend log events |

---

## Environment Variables

All variables are read from `backend/.env.local`. See `backend/.env.example` for full documentation.

| Variable | Required | Default | Description |
|---|---|---|---|
| `OPENAI_API_KEY` | **Yes** | — | Master OpenAI API key (never exposed to browser) |
| `ATRIUM_AGENT_ID` | **Yes** (after bootstrap) | — | Attending grader assistant ID; set by `/agent/bootstrap` |
| `OPENAI_REALTIME_MODEL` | No | `gpt-realtime-2` | Realtime model; server probes live model list |
| `OPENAI_REALTIME_MALE_VOICE` | No | `ballad` | Voice for male patients and pediatric fathers |
| `OPENAI_REALTIME_FEMALE_VOICE` | No | `shimmer` | Voice for female patients and pediatric mothers |
| `OPENAI_AGENT_MODEL` | No | `gpt-5.5` | Model for the attending grader |
| `OPENAI_TRIAGE_MODEL` | No | `gpt-5.5-instant` | Model for the triage ESI classifier |
| `BACKEND_SHARED_SECRET` | Production only | — | Auth header checked by the Vercel edge middleware |
| `EHR_API_TOKEN` | No | — | Enables the `/agent/vault/ehr/lookup` endpoint |

---

## Voice Pipeline & Routing Validation

Patient voice runs entirely through OpenAI:

```
Microphone → RTCPeerConnection → OpenAI Realtime API
                                        ↕  (speech-to-speech)
Speaker    ← Audio track        ← OpenAI Realtime API
```

1. The browser calls `POST /voice/realtime-secret` to get a short-lived client secret.
2. The browser opens a `RTCPeerConnection`, adds the microphone track, and sends an SDP offer to `https://api.openai.com/v1/realtime/calls` using the secret as a Bearer token.
3. OpenAI streams audio back. The patient persona (system prompt + opening line) is injected at session creation time.
4. Gender-appropriate voice (`ballad` / `shimmer`) is selected server-side by `_realtime_voice_for()` based on `gender` in the request body.
5. Voice routing is deterministic and environment-configurable (using `OPENAI_REALTIME_MALE_VOICE` and `OPENAI_REALTIME_FEMALE_VOICE` env variables):
   - **Adult Male Patients** → male voice (default: `ballad`)
   - **Adult Female Patients** → female voice (default: `shimmer`)
   - **Pediatric Mother Speaker** → female voice (default: `shimmer`)
   - **Pediatric Father Speaker** → male voice (default: `ballad`)
   Deterministic routing is mapped by taking the case ID hash on initialization to decide the parent speaker gender, guaranteeing that the 3D visual avatar and speaking voice are consistently matched.

---

## Keyboard Controls

Inside the **3D Consultation Room**:

| Input | Action |
|---|---|
| Mouse click (in room) | Activates first-person pointer-lock |
| `Esc` | Releases pointer-lock |
| `E` | Opens / closes the Examine dashboard overlay |
| `M` | Toggles microphone mute |
| `Z` / scroll | Zoom / lean camera |
| Mic pill (bottom-left) | Click to mute / unmute |
| Speech bubble (patient) | Live patient subtitles, emotion, and connection status |
| Docked voice panel (top-right, Examine open) | Transcripts, language chip (EN / हिंदी), emotion icon |

---

## Testing Cheat Sheet — Full 10/10 Encounter

**Patient**: Mary Smith — Iron Deficiency Anaemia

### 1. Verbal History (speak via microphone)

| Ask | Expected response |
|---|---|
| "How long have you been this exhausted?" | ~4 months, progressive |
| "How are your periods — are they heavy?" | Yes, 7–8 days, heavy flow |
| "Tell me about your diet." | Mostly vegetarian, very little red meat |
| "Any unusual cravings — like chewing ice?" | Yes, constant craving for ice |
| "Any blood in your stool or change in bowel habit?" | No |

### 2. Clinical Management (`E` key → Examine overlay)

**Order Tests tab:**
- `CBC w/ differential` → Hb 9.2 g/dL, MCV 72 fL
- `Iron Studies (Fe/TIBC/ferritin)` → Fe ↓, TIBC ↑
- `Ferritin` → 6 ng/mL (critically low)

**Diagnose tab:**
- Diagnosis: **Iron Deficiency Anaemia**
- Disposition: **Discharge**

**Rx tab:**
- Medication: **Ferrous Sulfate 325 mg**
- Dose: `1 tab`, Frequency: `1×1 PO (with vitamin C)`
- Duration: `90 days` → Add → Submit

### 3. Interpersonal Skills (verbal)

- Explain the plan in plain language (no jargon)
- Elicit patient's concerns and expectations (ICE)
- Teach-back: *"To make sure we're on the same page — can you tell me how you'll take the tablets?"*

### 4. End Consultation

Click **End Consultation** → check all three confirmation boxes → **Finish**.

The Debrief screen should load and grade you **10/10 (Grade A)** with guideline citations for CBC, ferritin, and iron studies.

---

## Utility Scripts

Run from the repository root:

```bash
# Start development server
npm run dev

# Production build (TypeScript + Vite bundle into /dist)
npm run build

# Data integrity check (cases, rubric citations, guideline registry, 3D asset paths)
npm run verify

# Integration test suite (custom tools, agent loop commands)
npm run test
```

Backend tests (from the `backend/` directory with venv active):

```bash
python -m unittest tests.test_triage tests.test_vault -v
```

End-to-end smoke test (with the backend running on port 8787):

```bash
python smoke_test.py
```

---

## Production Deployment

The app deploys as two separate services:

| Service | Platform | Entry point |
|---|---|---|
| Frontend | Vercel (static + edge functions) | `npm run build` → `/dist` |
| Backend | Render (or any WSGI host) | `uvicorn server:app --host 0.0.0.0 --port $PORT` |

The Vercel edge middleware (`middleware.ts`) proxies `/agent/*` and `/voice/*` to the Render backend, injecting `BACKEND_SHARED_SECRET` as an `x-atrium-auth` header. The backend verifies this header and rejects requests that lack it (except from localhost).

For production, set in **Vercel environment**:
- `BACKEND_SHARED_SECRET` — any strong random string

Set in **Render environment** (in addition to all `backend/.env.local` vars):
- `BACKEND_SHARED_SECRET` — same value as Vercel
- `OPENAI_API_KEY`
- `ATRIUM_AGENT_ID` (after running `/agent/bootstrap` once)
- `OPENAI_REALTIME_MALE_VOICE=ballad`
- `OPENAI_REALTIME_FEMALE_VOICE=shimmer`
