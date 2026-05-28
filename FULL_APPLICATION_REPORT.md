# Atrium Full Application Audit Report

## 1. Executive Summary

### Overall Application Quality
The Atrium application is a highly polished, stylized clinical outpatient training simulator. Visually, it features a warm, Pixar-style 3D aesthetics design language implemented via Three.js (React Three Fiber) and vanilla CSS, creating a premium and interactive environment. Architecturally, the app utilizes an OpenAI-native WebRTC direct peer-to-peer real-time audio pipeline for patient-doctor conversations, paired with a FastAPI backend that mints short-lived WebRTC tokens and proxies attending evaluation requests.

However, beneath the polished visual facade, there are significant architectural and runtime weaknesses, including invalid default model variables, broken streaming logic, browser autoplay blocks, and a mismatch in transition state lifecycle handling that creates rendering flickers and silences voice playback.

### Current Readiness Level
* **Prototype/Demo Stable (with local overrides)**: The application compiles and runs successfully. The frontend verification suite (`npm run verify` and `npm run test`) passes because it utilizes mocked endpoints and offline static checks. 
* **Production-Blocked**: The app is currently not ready for production or a live hackathon demo due to hardcoded invalid OpenAI model names, local `.env` keys mismatch, and browser autoplay policies muting WebRTC stream playback.

### Major Strengths
* **Dynamic 3D Scene**: Custom low-poly procedural elements in [Polyclinic.tsx](file:///Users/manavdesai/Desktop/GitHub/Atrium/src/components/three/Polyclinic.tsx) avoid bulky GLTF asset loads, keeping bundle footprints reasonable.
* **Cozy Aesthetic Theme**: Consistent styling with smooth, Pixar-like color palettes, glass HUD overlays, and custom doodles.
* **Structured Evaluation System**: Robust PLAB2-style criteria mapping guidelines directly onto user action logs, producing highly contextual feedback.

### Major Weaknesses
* **Failing Defaults / Model Names**: Hardcoded `gpt-4.1` and `gpt-4.1-mini` models in the backend default configurations will instantly crash on standard OpenAI API endpoints.
* **Autoplay Blocks**: dynamially loaded WebRTC audio elements are blocked by standard web browser security policies because user gestures are not correctly chained to the asynchronous stream initialization.
* **Broken Streaming UX**: Mismatch in JSON structures between python server payload and TypeScript client hooks prevents partial debrief narration from displaying.
* **Dangling Infrastructure**: Residual LiveKit, Deepgram, and Cartesia code and configuration keys remain in logs and environment settings despite the app migrating to WebRTC.

### Biggest Hackathon/Demo Risks
1. **Silence During Live Demo**: The patient failing to speak because the browser blocks audio autoplay.
2. **Crash on Attending Grading**: The attending grader route throwing a 400 Bad Request because it calls the non-existent `gpt-4.1` model.
3. **Empty Chair / Layout Flickering**: Navigation to the consultation room briefly displaying an empty chair and a "WAITING FOR NEXT PATIENT" screen before the state catches up.

---

## 2. Critical Bugs

### Bug 1: Invalid OpenAI Model Defaults (`gpt-4.1` / `gpt-4.1-mini`)
* **Exact Issue**: The backend server specifies `gpt-4.1` as the default model for its attending evaluation and `gpt-4.1-mini` for ESI triage, neither of which exists in OpenAI's API.
* **Reproduction Steps**:
  1. Boot the backend server via `python server.py` without specifying `OPENAI_AGENT_MODEL` in `.env.local`.
  2. Send a POST request to `/agent/triage/classify` or run an attending debrief from the frontend.
  3. The request will fail with an HTTP 400 Bad Request error returned by the OpenAI API because the requested model is unknown.
* **Affected Files**:
  - [backend/server.py](file:///Users/manavdesai/Desktop/GitHub/Atrium/backend/server.py#L217) (Lines 187, 217, 953, 1044)
  - [backend/tests/test_triage.py](file:///Users/manavdesai/Desktop/GitHub/Atrium/backend/tests/test_triage.py#L6) (Unit tests hardcode assertion to this invalid model name)
* **Severity**: Critical
* **Likely Root Cause**: Typo or placeholder naming used during mock setups that was never updated to official production models (`gpt-4o` or `gpt-4o-mini`).

### Bug 2: Invalid Default Realtime Model (`gpt-realtime`)
* **Exact Issue**: The default realtime model in the backend and local environment is set to `gpt-realtime`. This is not a standard model name.
* **Reproduction Steps**:
  1. Start the backend and try to enter a voice encounter.
  2. The server calls `/voice/realtime-secret` which tries to mint a token with `model="gpt-realtime"`.
  3. The OpenAI client secret API returns HTTP 400/502 as `gpt-realtime` is not a valid model.
* **Affected Files**:
  - [backend/server.py](file:///Users/manavdesai/Desktop/GitHub/Atrium/backend/server.py#L1112)
  - [backend/.env.local](file:///Users/manavdesai/Desktop/GitHub/Atrium/backend/.env.local#L11)
* **Severity**: Critical
* **Likely Root Cause**: Misconfigured environment file and default fallback variables. Should point to `gpt-4o-realtime-preview` or `gpt-4o-mini-realtime-preview`.

### Bug 3: Autoplay Muting on WebRTC Stream Playback
* **Exact Issue**: Remote audio streams from the OpenAI Realtime API are muted upon entering a simulation.
* **Reproduction Steps**:
  1. Complete a Doorway Briefing on `BriefScreen` and click "Knock & Enter Room →".
  2. Speak into the microphone. The patient responds visually (the subtitle appears and the waveform moves), but no sound comes out.
  3. Inspecting the browser console shows: `Play attempt blocked because user did not interact with the document first`.
* **Affected Files**:
  - [src/components/BriefScreen.tsx](file:///Users/manavdesai/Desktop/GitHub/Atrium/src/components/BriefScreen.tsx#L357)
  - [src/voice/conversation.ts](file:///Users/manavdesai/Desktop/GitHub/Atrium/src/voice/conversation.ts#L211)
* **Severity**: Critical
* **Likely Root Cause**: `BriefScreen.tsx` calls `store.setScreen('encounter')` directly. This bypasses `store.acceptNextPatient()`, which is responsible for invoking `ensureAudioContext()` inside the user gesture event chain. Moreover, the HTML `<audio>` tag is created dynamically *after* the asynchronous fetch to `/voice/realtime-secret` resolves, breaking the browser's user-gesture propagation link.

### Bug 4: Broken Partial Debrief Streaming
* **Exact Issue**: The attending's live "thinking aloud" feedback does not render on screen while grading, showing only a static list of checklist tasks until the final result arrives.
* **Reproduction Steps**:
  1. Click "End Consultation" to trigger a debrief.
  2. The screen shows "The attending is grading..." but the area remains empty.
  3. Once the stream ends, the entire card pops in at once.
* **Affected Files**:
  - [src/agents/useAttendingDebrief.ts](file:///Users/manavdesai/Desktop/GitHub/Atrium/src/agents/useAttendingDebrief.ts#L152)
  - [backend/server.py](file:///Users/manavdesai/Desktop/GitHub/Atrium/backend/server.py#L751)
* **Severity**: High
* **Likely Root Cause**: Schema mismatch. The `useAttendingDebrief` consumer expects an array of message blocks (`Array.isArray(content)`), whereas `backend/server.py` emits the text as a flat string: `payload = {"content": accumulated_text, ...}`. The client-side array check fails and ignores the streaming token text.

### Bug 5: One-Frame Rendering Flicker
* **Exact Issue**: The doctor's monitor briefly renders an empty/error state when transitioning into the consultation room.
* **Reproduction Steps**:
  1. Click "Knock & Enter Room →" from the doorway brief.
  2. Observe the desk monitor. It briefly displays "WAITING FOR NEXT PATIENT..." and the patient chair sits empty before the walk-in animation kicks off.
* **Affected Files**:
  - [src/components/EncounterScreen.tsx](file:///Users/manavdesai/Desktop/GitHub/Atrium/src/components/EncounterScreen.tsx#L229)
  - [src/components/three/Polyclinic.tsx](file:///Users/manavdesai/Desktop/GitHub/Atrium/src/components/three/Polyclinic.tsx#L2900)
* **Severity**: Medium
* **Likely Root Cause**: Since the user transitioned via `store.setScreen('encounter')`, the patient remains unitialized (`null`) in the global game store. It is only initialized *after* mounting via `useEffect`, which updates the store and triggers a second render frame.

---

## 3. Realtime + Voice Issues

* **LiveKit**: The backend contains configuration credentials for LiveKit Cloud (`LIVEKIT_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`) in [backend/.env.local](file:///Users/manavdesai/Desktop/GitHub/Atrium/backend/.env.local#L17-L19). However, no LiveKit worker is active or present in the current codebase version.
* **Deepgram / Cartesia**: Key parameters are defined in `.env.local` but are entirely unused in the active WebRTC pipeline. This represents dead configuration block.
* **Microphone Handling**: Microphone permission is requested immediately upon mounting `EncounterScreen`. If the user denies or blocks the microphone, the WebRTC initialization fails completely and throws an error banner, locking the user out of typing text alternative unless they examine the patient and use the docked voice log.
* **Audio Synchronization**: Since WebRTC is native and peer-to-peer directly to the OpenAI servers, audio and video synchronization is handled by the browser. However, there is no visual lip-sync on the 3D character; it plays a generic breathing loop while speaking.
* **Autoplay Issues**: (See Bug 3) dynamially created `<audio>` tags are blocked by modern Safari and Chrome policies due to asynchronous token generation breaking user gesture association.
* **Browser Compatibility**: The WebRTC SDP implementation in [conversation.ts](file:///Users/manavdesai/Desktop/GitHub/Atrium/src/voice/conversation.ts) utilizes modern browser WebRTC standard APIs (`RTCPeerConnection`). This is incompatible with some older browsers or strict corporate network proxy setups that block WebUDP traffic.
* **Reconnect Logic**: Reconnection relies on a single fallback attempt in `handleConnectionLoss` in [conversation.ts](file:///Users/manavdesai/Desktop/GitHub/Atrium/src/voice/conversation.ts#L581). If the socket experiences a minor blip, it tears down the connection and attempts to restart. This fails to handle flapping connections smoothly.

---

## 4. Frontend Issues

* **Excessive Rerenders**: 
  - The `EncounterScreen` has a high frequency of state ticks due to polling status and emotion variables every 400ms in [DockedVoicePanel.tsx](file:///Users/manavdesai/Desktop/GitHub/Atrium/src/components/DockedVoicePanel.tsx#L75).
  - The global store's external subscriber model triggers updates across components even when unrelated sub-states change.
* **UI Inconsistencies**:
  - The font loading in [global.css](file:///Users/manavdesai/Desktop/GitHub/Atrium/src/styles/global.css#L6) pulls in `Nunito` and `JetBrains Mono` from Google Fonts, but some components explicitly inline font-family strings like `'Nunito', sans-serif` while others use `Outfit` (which is not imported in the CSS, falling back to browser defaults).
* **Broken Components**:
  - [DockedVoicePanel.tsx](file:///Users/manavdesai/Desktop/GitHub/Atrium/src/components/DockedVoicePanel.tsx) relies on `localStorage.debug === '1'` to show debug overlays. However, there is no button or UI element to toggle this, meaning normal users can never access the cognitive diagnostic logs.
* **Navigation Issues**:
  - Transitioning between `BriefScreen` and `EncounterScreen` lacks an intermediate loading transition, exposing the frame rate drops during Three.js canvas initialization.

---

## 5. 3D + Performance Issues

* **GPU-Heavy Rendering**: The 3D scene uses shadows (`castShadow`, `receiveShadow`) on almost all complex geometries (such as chairs, tables, and books) inside the R3F Canvas. This leads to a high shadow map recalculation overhead.
* **Excessive Draw Calls**: The bookshelf and diplomas render dozens of independent meshes (each book and framed photo is a separate `<boxGeometry>` or `<planeGeometry>`). These draw calls are not batched or instanced, resulting in poor rendering performance on lower-end devices.
* **Render-loop Inefficiencies**: The `useFrame` hook in [StylizedCharacter.tsx](file:///Users/manavdesai/Desktop/GitHub/Atrium/src/components/three/StylizedCharacter.tsx#L175) performs matrix math and look-at calculations (calculating quaternion updates to face the camera) on every single frame, even when the player is not moving.
* **Memory Leaks**: Each time a patient is loaded, the monitor screen texture in [Polyclinic.tsx](file:///Users/manavdesai/Desktop/GitHub/Atrium/src/components/three/Polyclinic.tsx#L537) creates a new `CanvasTexture`. Although there is a `useMemo` cleanup calling `monitorTex.dispose()`, if a render cycle is interrupted or unmounted abruptly, the offscreen canvas memory may leak.

---

## 6. Backend Issues

* **Environment Handling**:
  - The minimal local loader in [server.py](file:///Users/manavdesai/Desktop/GitHub/Atrium/backend/server.py#L21) reads `.env.local` line-by-line without standard library parsing. It fails to handle multiline strings or escaped quotes correctly.
  - Exposing and committing active credential keys in [backend/.env.local](file:///Users/manavdesai/Desktop/GitHub/Atrium/backend/.env.local) is a major configuration risk.
* **Session Lifecycle Issues**:
  - The backend maintains an in-memory session dictionary (`SESSIONS`). If the backend process restarts (e.g. server crash, redeployment, or idle-out), all active session histories are wiped, breaking any ongoing debrief requests.
* **Error Handling**:
  - Streaming SSE responses in `stream_events` catch general exceptions but return a custom `proxy_error` event, which the frontend's `openEventStream` parses but does not always display as a user-friendly modal, leading to hanging loading screens in the UI.

---

## 7. UX / Product Issues

* **Weak Onboarding**: The onboarding screen is a simple linear slider that does not verify if the microphone is functioning before letting the user enter the consultation room.
* **Confusing Room Interactions**: When entering the consultation room, there is a pointer lock control. Users must click the screen to look around, but clicking also triggers interaction with the desk or patient chair. Toggling pointer lock using `Esc` is counter-intuitive for casual users.
* **Emotional UX Weaknesses**: The emotion detection logic is built on simple keyword regex matching in [conversation.ts](file:///Users/manavdesai/Desktop/GitHub/Atrium/src/voice/conversation.ts#L111). It fails to capture vocal tone or pitch, which means the patient's face might stay "neutral" even if the doctor is screaming or the patient is describing a painful emergency in a non-matched phrase.

---

## 8. Mobile + Responsive Issues

* **3D Canvas Overflow**: The `Canvas` height in [EncounterScreen.tsx](file:///Users/manavdesai/Desktop/GitHub/Atrium/src/components/EncounterScreen.tsx#L358) is calculated as `calc(100vh - 67px)`. On mobile safari, the dynamic navigation bar overlaps this container, cutting off the bottom glass HUD containing the "End Consultation" button.
* **Pointer Lock on Touch**: Pointer lock APIs are completely unsupported on mobile browsers. Since looking around relies on pointer lock, mobile players are locked to a fixed camera angle and cannot navigate the room properly.
* **Touch Targets**: HUD buttons are narrow (such as the mute toggle or back buttons), making them difficult to tap accurately on small mobile viewports.

---

## 9. Code Quality Issues

* **Dead Code**:
  - The backend folder contains `Procfile` references to a worker calling `voice_agent.py` which does not exist in the repository.
  - Multiple unused assets and dependencies (e.g., LiveKit, Deepgram, Cartesia environment keys) remain in configuration.
* **Oversized Components**:
  - [Polyclinic.tsx](file:///Users/manavdesai/Desktop/GitHub/Atrium/src/components/three/Polyclinic.tsx) is over 3,000 lines long. It blends canvas texture generators, lighting components, structural walls, furniture details, and interactivity logic. This poses a massive maintainability risk.
* **React Anti-Patterns**:
  - Modifying native styles directly via DOM updates in helper libraries rather than reacting to state updates.
  - Inlining styling objects inside 3D render loops instead of utilizing theme variables.

---

## 10. Security / Stability Risks

* **Exposed Credentials**: Committing active OpenAI and third-party API keys in `.env.local` creates an immediate credentials leak risk if public repositories are used.
* **Websocket Lifecycle Risks**: WebRTC connection errors do not gracefully decay. A socket dropout can cause infinite loading spin wheels or audio drops without triggering a visible warning.
* **Missing Rate Limiting Protection on WebRTC**: The `/voice/realtime-secret` route is rate-limited, but once a WebRTC connection is negotiated, there is no server-side control over bandwidth usage or connection limits, risking billing spikes.

---

## 11. Hackathon Demo Risks

* **Autoplay Security Failure**: If you open the site on a fresh browser tab and walk through the demo, the patient's voice response will be completely silent. This is a fatal presentation risk.
* **OpenAI API Latency**: The direct WebRTC token creation takes 2–4 seconds. During a live pitch, this creates a heavy lag between clicking "Enter Room" and the patient actually greeting the user.
* **Model Not Found Error**: If the environment variables are not loaded exactly as expected, the backend will return a `gpt-4.1 model not found` error immediately upon ending the consultation, causing the debrief generation to crash live.

---

## 12. Performance Metrics

* **Rendering Costs**:
  - High redraw cycles due to shadow maps.
  - 3,000+ line components trigger deep virtual DOM diffs on every state change.
* **Network Overhead**:
  - Real-time WebRTC audio streams consume constant bidirectional bandwidth (~64kbps).
  - SSE streams during debrief generate massive logs in memory history.

---

## 13. Prioritized Fix Plan

### MUST FIX NOW (Hackathon / Demo Blockers)
1. **Update Default Model Variables**:
   - Change `PRIMARY_MODEL` in [server.py](file:///Users/manavdesai/Desktop/GitHub/Atrium/backend/server.py#L217) from `gpt-4.1` to `gpt-4o` or `gpt-4o-mini`.
   - Update `OPENAI_REALTIME_MODEL` in `server.py` and `.env.local` to `gpt-4o-mini-realtime-preview`.
2. **Fix Autoplay Blocks**:
   - Update the "Knock & Enter Room" click handler in [BriefScreen.tsx](file:///Users/manavdesai/Desktop/GitHub/Atrium/src/components/BriefScreen.tsx#L357) to trigger `store.acceptNextPatient()` instead of a raw `store.setScreen('encounter')`. This ensures that user gestures are associated with browser audio context registration.
3. **Align Debrief SSE JSON Shapes**:
   - Modify the `useAttendingDebrief.ts` stream parser to handle string-based `content` payloads alongside arrays, preventing the streaming narration from hanging.
4. **Evict Unused LiveKit Infrastructure**:
   - Clean up `Procfile` and delete unused references to `voice_agent.py`.

### SHOULD FIX (stability + UX)
1. **Refactor Polyclinic Component**:
   - Split [Polyclinic.tsx](file:///Users/manavdesai/Desktop/GitHub/Atrium/src/components/three/Polyclinic.tsx) into smaller modules (e.g. `Furniture`, `Posters`, `Decorations`) to reduce single-file load and optimize rendering.
2. **Instance 3D Geometries**:
   - Merge mesh draw calls for books, diploma frames, and cabinet parts.
3. **Graceful Reconnection UI**:
   - Add a visible banner in the room showing "Reconnecting Voice..." when WebRTC experiences packet loss.

### NICE TO HAVE (polish + extensions)
1. **True Vocal Emotion Analysis**:
   - Move from basic regex keyword matching to using the real-time audio modality output attributes (if supported by the model) to determine visual expressions.
2. **Mobile Pointer Emulation**:
   - Implement virtual joystick touch controls for mobile viewports to allow looking around without pointer lock APIs.
