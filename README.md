# Atrium // Immersive Clinical Intelligence Platform

Atrium is a cinematic, AI-native medical simulation workspace designed for advanced clinical training and PLAB2 / OSCE preparation. It places the user in the role of a lead clinician in an immersive 3D command center, conducting real-time diagnostic voice interviews, ordering tests, making diagnoses, prescribing treatments, and receiving attending evaluations cited to real-world medical guidelines.

---

## 🌟 Key Capabilities

*   **Cinematic 3D Consult Room**: A stylized clinical room rendered in real-time with Three.js (`@react-three/fiber` and `@react-three/drei`).
*   **Low-Latency OpenAI Realtime Voice**: Direct browser WebRTC sessions with OpenAI Realtime API for speech-to-speech patient encounters.
*   **Single-Provider Speech Pipeline**: Speech-to-text (STT), turn-taking, reasoning, interruptions, and text-to-speech (TTS) are handled by a single OpenAI Realtime connection.
*   **Autonomous Patient Personas**: Deterministic clinical personas that stay in-character, reveal history gradually, express realistic emotions, and adapt dynamically to English or Hindi input.
*   **Automated Attending Debrief**: A structured clinical scoring engine (using a Managed Agent) that grades performance across OSCE domains, identifies gaps, and cites medical guidelines.

---

## 🛠️ Technical Stack

*   **Frontend**: React 18, TypeScript, Vite, Vanilla CSS, Tailwind CSS, Three.js (via React Three Fiber & Drei)
*   **Realtime Voice**: WebRTC media stream direct to OpenAI Realtime API
*   **Inference & Grading**: OpenAI API (FastAPI backend proxies and grading agents)
*   **Backend Server**: FastAPI (Python 3.11+)

---

## 📂 Codebase Directory & File Guide

Below is a detailed map of the repository to help developers and AI agents navigate the codebase:

```
Atrium/
├── backend/                        # FastAPI Backend Services
│   ├── server.py                   # Main FastAPI server (proxies OpenAI APIs, generates WebRTC secrets)
│   ├── requirements.txt            # Python dependencies
│   ├── .env.example                # Example environment variables template
│   └── README.md                   # Backend detailed setup and API reference
├── src/                            # React Frontend Source
│   ├── main.tsx                    # Application entry point
│   ├── App.tsx                     # Screen router (splash, onboarding, home, library, encounter, debrief, etc.)
│   ├── styles/                     # Global stylesheet definitions & HSL color palettes
│   ├── game/                       # Core State Engine
│   │   ├── store.ts                # Consultation state manager (SyncExternalStore pattern)
│   │   ├── types.ts                # Core types for active patients, cases, rubrics, and game state
│   │   └── clinic.ts               # Specialty clinic enum mapping (GP, Cardiology, Respiratory, etc.)
│   ├── voice/                      # Realtime Voice Engine
│   │   ├── conversation.ts         # WebRTC session negotiation, RTC data channel event handler, FSM state, emotion/language heuristics
│   │   ├── conversationStore.ts    # AudioContext & lifecycle hooks for patient speech threads
│   │   └── patientPersona.ts       # Algorithmic system prompt builder for patient traits (age, gender, severity, anxiety, ICE)
│   ├── data/                       # Static Medical Knowledge & Case Database
│   │   ├── polyclinicPatients.ts   # Main database of clinical cases, patient histories, vitals, and test results
│   │   ├── guidelines.ts           # Clinical guideline citations registry for attending markings
│   │   ├── tests.ts                # Laboratory, imaging, and bedside test index
│   │   ├── medications.ts          # Pharmacological catalog (names, doses, frequencies)
│   │   └── cases.ts                # Cartoon library deterministic case compiler
│   ├── agents/                     # Attending Grading Agents
│   │   ├── managedAgent.ts         # Managed Agent SDK client
│   │   ├── debriefRequest.ts       # OSCE rubric parsing and prompt payload builders
│   │   └── useAttendingDebrief.ts  # React hook orchestrating debrief results fetching
│   └── components/                 # UI Screen Components
│       ├── EncounterScreen.tsx     # Canvas wrapper, adaptive camera FOV, pointer lock, and global hotkeys
│       ├── ExamineOverlay.tsx      # 2D Examine workspace modal (History, Chat, Order tests, Diagnose, Rx tabs)
│       ├── DockedVoicePanel.tsx    # Compact floating HUD showing voice transcripts & emotion while Examine modal is open
│       ├── DebriefScreen.tsx       # Grading debrief sheet displaying scored domains (Data Gathering, management, etc.)
│       └── three/                  # 3D Scene Components
│           ├── Polyclinic.tsx      # Main 3D meshes (desk, desk items, furniture, lights, walls, walk-in/out animations)
│           ├── Player.tsx          # Camera placement, pointer-lock camera-look, bounding collision boxes
│           ├── StylizedCharacter.tsx # 3D Avatar mesh generator (derives skin, hair, parent companion deterministically)
│           └── FloatingVoicePanel.tsx # 3D HTML speech bubble hovering above the seated patient's head
├── scripts/                        # Automation & Testing Tools
│   ├── verify/                     # Data integrity checks (run-all.ts, data-integrity.ts, triage-priority.ts, etc.)
│   └── test/                       # Node integration tests (run-all.ts, custom-tools.test.ts, etc.)
├── patients.md                     # Step-by-step crib sheets for perfect/low-scoring runs
└── README.md                       # Main master documentation (this file)
```

---

## ⚡ Setup & Installation

### 1. Prerequisites
*   **Node.js 22+**
*   **Python 3.11+**
*   A microphone and a WebRTC-compliant web browser.

---

### 2. Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create a Python virtual environment:
   ```bash
   python -m venv .venv
   ```
3. Activate the virtual environment:
   * **macOS / Linux**:
     ```bash
     source .venv/bin/activate
     ```
   * **Windows (Command Prompt)**:
     ```cmd
     .venv\Scripts\activate.bat
     ```
   * **Windows (PowerShell)**:
     ```powershell
     .venv\Scripts\Activate.ps1
     ```
4. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```
5. Create local environment configuration:
   ```bash
   cp .env.example .env.local
   ```
6. Open `.env.local` and add your OpenAI API credentials:
   ```env
   OPENAI_API_KEY=sk-proj-YOUR_REAL_API_KEY
   # Optional overrides:
   OPENAI_REALTIME_MODEL=gpt-4o-realtime-preview-2024-12-17
   OPENAI_REALTIME_VOICE=shimmer
   ```

---

### 3. Frontend Setup
1. Return to the root directory and install dependencies:
   ```bash
   npm install
   ```

---

## 🚀 Running the Platform

To run the Atrium simulation, launch the FastAPI server and the Vite development server in parallel:

### 1. Start the FastAPI Server
Ensure your Python virtual environment is activated, then run:
```bash
cd backend
python server.py
```
This starts the backend gateway at `http://127.0.0.1:8787`.

### 2. Start the Vite Frontend Workspace
In a separate terminal window, run:
```bash
npm run dev
```
This starts the local web client server at `http://localhost:5173`. Open this URL in a browser to begin.

---

## 🎹 Keyboard Controls & HUD Interactions

While inside the **Consultation Room (3D Canvas)**:
*   **Mouse Click inside Room**: Activates first-person mode (pointer lock) to look around using mouse movement.
*   **Esc**: Releases pointer lock, allowing you to use your mouse cursor to click buttons.
*   **`Z` Key / Mouse Scroll**: Leans in / zooms the camera view.
*   **`E` Key**: Opens the **Examine** dashboard overlay (unlocks cursor automatically).
*   **`M` Key**: Toggles microphone mute.
*   **Mic Indicator Pill (Bottom-left)**: Displays the microphone status (`VOICE LIVE` / `MIC MUTED`). Can be clicked directly to mute/unmute.
*   **Floating Speech Bubble (`FloatingVoicePanel`)**: Shows patient speech, status (`LISTENING`, `THINKING`, `SPEAKING`), and real-time subtitles. Unmounts automatically when the Examine dashboard is open.
*   **Docked Voice Panel (Top-right during Examine)**: Tracks patient voice transcripts, language (English/Hindi), and emotion (neutral 😐, pain 😣, fear 😨, relief 😮‍💨, confused 😕) while you work in the 2D Examine tab.

---

## 🧪 Testing Cheat Sheet (PLAB2 / OSCE Preparation)

To verify the end-to-end integration (Voice interaction -> Lab orders -> Diagnosis -> Prescription -> Disposition -> Attending scoring), follow these instructions for a high-scoring run:

### Patient Encounter Walkthrough: Mary Smith (Iron Deficiency Anemia)
*   **Goal**: Score **10/10 (OSCE Grade A)**

#### 1. Verbal Inquiry (Talk with Patient via Microphone)
Ask the patient the following questions to satisfy the **Data Gathering** rubric criteria:
1.  **Onset**: *"How long have you been feeling this exhausted?"*
    *   *Patient response*: Around 4 months, getting worse.
2.  **Menstruation**: *"How are your periods? Are they particularly heavy?"*
    *   *Patient response*: Yes, heavy, lasting 7-8 days.
3.  **Diet**: *"How is your typical diet? Do you eat red meat?"*
    *   *Patient response*: Vegetarian, eats very little red meat.
4.  **Cravings (Pica)**: *"Have you noticed any unusual cravings, like wanting to chew on ice?"*
    *   *Patient response*: Yes, constantly craves ice.
5.  **Bleeding**: *"Have you noticed any blood in your stool or changes in bowel movements?"*
    *   *Patient response*: No bowel changes or bleeding.

#### 2. Clinical Management (Examine overlay - `E` key)
1.  Navigate to **Order tests** tab:
    *   Expand **🧬 Laboratory**.
    *   Select **CBC w/ differential** (`cbc`) -> *Wait for turnaround. Results show Low Hemoglobin (9.2 g/dL) and Low MCV (72 fL).*
    *   Select **Iron Studies (Fe/TIBC/ferritin)** (`iron`) -> *Results show Low Serum Iron (28 mcg/dL) and High TIBC (462 mcg/dL).*
    *   Select **Ferritin** (`ferritin`) -> *Results show Low Ferritin (6 ng/mL).*
2.  Navigate to **Diagnose** tab:
    *   Select **Iron Deficiency Anemia** (`iron-deficiency-anemia`) as the primary diagnosis.
    *   Select **Discharge** (`discharge`) as the disposition.
3.  Navigate to **Rx** (Prescriptions) tab:
    *   Select **Ferrous Sulfate 325mg** (`ferrous-sulfate-325`).
    *   Set Dose to: `1 tab` (frequency: `1x1, PO (with vitamin C)`).
    *   Set Duration to: `90 days`.
    *   Click **Add to prescription**, then click **Submit/Prescribe**.

#### 3. Interpersonal Skills (Verbal Dialogue)
*   **Agenda & ICE**: Explain the plan clearly. Speak in plain English without complex abbreviations. Elicit expectations and concerns.
*   **Empathize**: Validate how challenging exhaustion is.
*   **Teach-Back**: Summarize the plan at the end and invite questions (*"To make sure we're on the same page, could you repeat back how you will take these tablets?"*).

#### 4. End Consultation
*   Click **End Consultation** (or Dispatch).
*   Verify the checkboxes on the confirmation popup, then click **Finish**.
*   The **Debrief Screen** will load. Verify that the Attending grades you Grade A/10 out of 10, citing actual guidelines for CBC, Ferritin, and Iron Studies.

---

## 🛠️ Utility Scripts

Run these scripts from the repository root to validate local codebase adjustments:

*   **Production Build**:
    ```bash
    npm run build
    ```
    Compiles TypeScript and packages Vite production distribution bundles in `/dist`.
*   **Data Integrity Verification**:
    ```bash
    npm run verify
    ```
    Runs all scripts inside `scripts/verify/` to check case configurations, guideline registries, Three.js asset paths, and rubric citation matches.
*   **Integration Tests**:
    ```bash
    npm run test
    ```
    Executes automated tests in `scripts/test/` validating custom tools and model loops.

Happy coding!
