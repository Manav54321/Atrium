import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import type { PerspectiveCamera } from 'three';
import {
  Polyclinic,
  POLYCLINIC_COLLIDERS,
  DOCTOR_CHAIR_POS,
  PATIENT_CHAIR_POS,
} from './three/Polyclinic';
import { Player } from './three/Player';
import { useActiveInteractable, interactionBus } from './three/interactions';
import {
  store,
  useGameState,
  POLYCLINIC_BED_INDEX,
} from '../game/store';
import {
  getExistingConversation,
  disposePatientConversation,
} from '../voice/conversationStore';
import { TopBar } from './primitives';
import { ExamineOverlay } from './ExamineOverlay';
import { DockedVoicePanel } from './DockedVoicePanel';

/** Adaptive FOV — keeps the horizontal FOV near 82° regardless of viewport
 *  aspect, plus a hold-Z (or scroll wheel) "lean in" zoom. */
function AdaptiveCameraFov() {
  const { camera, size } = useThree();
  const zoomedRef = useRef(false);
  const baseFovRef = useRef(55);
  const targetFovRef = useRef(55);

  useEffect(() => {
    const aspect = size.width / Math.max(1, size.height);
    const targetHFov = (82 * Math.PI) / 180;
    const vFovRad = 2 * Math.atan(Math.tan(targetHFov / 2) / aspect);
    const baseFovDeg = Math.max(42, Math.min(68, (vFovRad * 180) / Math.PI));
    baseFovRef.current = baseFovDeg;
    targetFovRef.current = zoomedRef.current ? baseFovDeg * 0.4 : baseFovDeg;
  }, [size.width, size.height]);

  const zoomLevelRef = useRef(0);
  const applyZoom = () => {
    const z = zoomLevelRef.current;
    const base = baseFovRef.current;
    const min = base * 0.4;
    targetFovRef.current = base + (min - base) * z;
  };
  useEffect(() => {
    const onWheel = (e: WheelEvent) => {
      if (!document.pointerLockElement) return;
      e.preventDefault();
      const dir = e.deltaY > 0 ? -1 : 1;
      zoomLevelRef.current = Math.max(0, Math.min(1, zoomLevelRef.current + dir * 0.15));
      zoomedRef.current = zoomLevelRef.current > 0;
      applyZoom();
    };
    const isZoomKey = (e: KeyboardEvent) => e.key === 'z' || e.key === 'Z';
    const onDown = (e: KeyboardEvent) => {
      if (!isZoomKey(e) || !document.pointerLockElement) return;
      zoomLevelRef.current = 1;
      zoomedRef.current = true;
      applyZoom();
    };
    const onUp = (e: KeyboardEvent) => {
      if (!isZoomKey(e)) return;
      zoomLevelRef.current = 0;
      zoomedRef.current = false;
      applyZoom();
    };
    window.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    return () => {
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('keydown', onDown);
      window.removeEventListener('keyup', onUp);
    };
  }, []);

  useFrame(() => {
    const cam = camera as PerspectiveCamera;
    if (!cam.isPerspectiveCamera) return;
    const target = targetFovRef.current;
    const diff = target - cam.fov;
    if (Math.abs(diff) < 0.05) {
      if (cam.fov !== target) {
        cam.fov = target;
        cam.updateProjectionMatrix();
      }
      return;
    }
    cam.fov += diff * 0.22;
    cam.updateProjectionMatrix();
  });

  return null;
}

function Loader() {
  return (
    <Html center>
      <div
        style={{
          fontFamily: 'Nunito, sans-serif',
          fontWeight: 800,
          color: 'var(--peach-deep)',
          background: 'white',
          padding: '8px 14px',
          border: '3px solid var(--line)',
          borderRadius: 'var(--r-pill)',
          boxShadow: 'var(--plush-tiny)',
          fontSize: 13,
          letterSpacing: '0.05em',
        }}
      >
        Loading polyclinic…
      </div>
    </Html>
  );
}

function Crosshair() {
  const active = useActiveInteractable();
  const hot = !!active;
  const size = hot ? 14 : 6;
  return (
    <div
      style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        width: size,
        height: size,
        marginLeft: -size / 2,
        marginTop: -size / 2,
        borderRadius: '50%',
        background: hot ? 'transparent' : 'rgba(255,248,236,0.85)',
        border: hot ? '2.5px solid var(--peach-deep)' : 'none',
        boxShadow: hot
          ? '0 0 12px rgba(255,142,92,0.55), 0 0 0 1px rgba(43,30,22,0.3)'
          : '0 0 0 1px rgba(43,30,22,0.4)',
        pointerEvents: 'none',
        transition: 'width 0.12s, height 0.12s, margin 0.12s, border 0.12s, box-shadow 0.12s',
      }}
    />
  );
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        background: 'var(--cream)',
        padding: '2px 8px',
        borderRadius: 6,
        fontFamily: 'ui-monospace, monospace',
        fontSize: 11,
        border: '2px solid var(--line)',
        boxShadow: '0 2px 0 var(--line)',
        margin: '0 2px',
        color: 'var(--ink)',
      }}
    >
      {children}
    </span>
  );
}

/** Ambient mic indicator — subtle pulsing dot when voice is live. */
function MicIndicator({ muted }: { muted: boolean }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        background: 'white',
        border: '2.5px solid var(--line)',
        borderRadius: 'var(--r-pill)',
        padding: '6px 12px',
        boxShadow: 'var(--plush-tiny)',
        fontSize: 11,
        fontWeight: 800,
        color: muted ? 'var(--ink-soft)' : 'var(--mint-deep)',
        letterSpacing: '0.04em',
      }}
    >
      <span
        className={muted ? undefined : 'breathe'}
        style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: muted ? 'var(--ink-soft)' : '#2d9e6b',
          display: 'inline-block',
          transition: 'background 0.3s',
        }}
      />
      {muted ? 'MIC MUTED' : 'VOICE LIVE'}
    </div>
  );
}

export function EncounterScreen() {
  const state = useGameState();
  const patient = state.polyclinic.patient;
  const [pointerLocked, setPointerLocked] = useState(false);
  const [examineOpen, setExamineOpen] = useState(false);
  const [micMuted, setMicMuted] = useState(false);

  // Voice is ALWAYS active during an encounter — no toggle, no "Speak" button.
  // The mic opens on mount and stays open until the encounter ends.
  const voiceActive = true;

  // If the user navigated straight here without a patient set, load one.
  useEffect(() => {
    if (!patient) store.loadPolyclinicPatient(state.selectedCaseId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Release pointer lock on unmount.
  useEffect(() => {
    return () => {
      if (document.pointerLockElement) document.exitPointerLock();
    };
  }, []);

  // Track pointer-lock state.
  const examineOpenRef = useRef(false);
  examineOpenRef.current = examineOpen;
  useEffect(() => {
    const onChange = () => {
      const locked = !!document.pointerLockElement;
      setPointerLocked(locked);
      if (locked && examineOpenRef.current) {
        document.exitPointerLock();
      }
    };
    document.addEventListener('pointerlockchange', onChange);
    return () => document.removeEventListener('pointerlockchange', onChange);
  }, []);

  // When Examine opens, release pointer lock.
  useEffect(() => {
    if (!examineOpen) return;
    if (document.pointerLockElement) document.exitPointerLock();
    interactionBus.setActive(null);
  }, [examineOpen]);

  // Global hotkeys:
  //   E → examine
  //   M → soft mic mute/unmute (session stays alive)
  //   Esc → release pointer lock (handled by browser)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tgt = e.target as HTMLElement | null;
      if (tgt && (tgt.tagName === 'INPUT' || tgt.tagName === 'TEXTAREA' || tgt.isContentEditable)) return;

      // E — examine
      if ((e.key === 'e' || e.key === 'E') && !examineOpen) {
        e.preventDefault();
        setExamineOpen(true);
        if (document.pointerLockElement) document.exitPointerLock();
        interactionBus.setActive(null);
        return;
      }

      // M — toggle mic mute (soft mute, session stays alive)
      if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        const conv = getExistingConversation(POLYCLINIC_BED_INDEX);
        if (conv) {
          conv.toggleMicMute().then((muted) => setMicMuted(muted));
        }
        return;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [examineOpen]);

  // Dispose conversation when the patient changes / leaves.
  const currentPatientCaseId = patient?.case.id ?? null;
  useEffect(() => {
    return () => {
      disposePatientConversation(POLYCLINIC_BED_INDEX);
    };
  }, [currentPatientCaseId]);

  const openExamine = () => {
    if (document.pointerLockElement) document.exitPointerLock();
    interactionBus.setActive(null);
    setExamineOpen(true);
  };

  const handleInteract = (kind: 'desk' | 'bed' | 'triage', bedIndex?: number) => {
    if (kind === 'bed' && bedIndex === POLYCLINIC_BED_INDEX) {
      openExamine();
    }
  };

  const handleTalk = (_bedIndex: number | null) => {
    // Voice is always active — no-op. Kept for interface compatibility.
  };

  const endConsultation = async () => {
    console.log('[Lifecycle] End consultation button clicked.');
    const conv = getExistingConversation(POLYCLINIC_BED_INDEX);
    if (conv) {
      try {
        await conv.sayFarewell();
      } catch {
        /* network/voice failure — proceed anyway */
      }
    }
    if (document.pointerLockElement) document.exitPointerLock();
    interactionBus.setActive(null);
    console.log('[Lifecycle] Tearing down active patient slot and conversation.');
    store.finishPolyclinicCase();
    disposePatientConversation(POLYCLINIC_BED_INDEX);
    store.setScreen('endConfirm');
  };

  const SEATED_HEIGHT = 1.45;
  const playerSpawn = useMemo<[number, number, number]>(
    () => [DOCTOR_CHAIR_POS[0], SEATED_HEIGHT, DOCTOR_CHAIR_POS[2]],
    [],
  );
  const doctorLookAt = useMemo<[number, number, number]>(
    () => [PATIENT_CHAIR_POS[0], 1.3, PATIENT_CHAIR_POS[2]],
    [],
  );

  return (
    <div className="screen" style={{ background: 'var(--cream)', position: 'relative' }}>
      <TopBar here={4} steps={['Polyclinic', 'GP', 'Case', 'Brief', 'Encounter']} />

      <div
        style={{
          position: 'relative',
          height: 'calc(100vh - 67px)',
          overflow: 'hidden',
          pointerEvents: examineOpen ? 'none' : undefined,
        }}
      >
        <Canvas
          shadows
          camera={{ position: playerSpawn, fov: 55 }}
          style={{ background: 'linear-gradient(#f0ebe1, #e3dac7)' }}
        >
          <AdaptiveCameraFov />
          <Suspense fallback={<Loader />}>
            <Polyclinic
              voiceActive={voiceActive && !examineOpen}
              onStartVoice={() => {/* always on */}}
            />
            <Player
              spawn={playerSpawn}
              colliders={POLYCLINIC_COLLIDERS}
              onInteract={handleInteract}
              onTalk={handleTalk}
              height={SEATED_HEIGHT}
              locked
              lookAt={doctorLookAt}
              enableLook={!examineOpen}
            />
          </Suspense>
        </Canvas>

        {pointerLocked && <Crosshair />}

        {/* Action button — End consultation */}
        <div
          style={{
            position: 'absolute',
            bottom: 18,
            right: 18,
            zIndex: 6,
            display: 'flex',
            gap: 10,
          }}
        >
          <button
            type="button"
            className="btn-plush ghost"
            onClick={(e) => {
              e.stopPropagation();
              endConsultation();
            }}
            style={{ fontSize: 14, padding: '12px 18px' }}
          >
            End consultation →
          </button>
        </div>

        {/* Bottom-left: ambient status indicators */}
        <div
          style={{
            position: 'absolute',
            bottom: 18,
            left: 18,
            zIndex: 6,
            display: 'flex',
            gap: 8,
            alignItems: 'center',
          }}
        >
          <MicIndicator muted={micMuted} />
          {pointerLocked ? (
            <div
              style={{
                background: 'white',
                border: '2.5px solid var(--line)',
                borderRadius: 'var(--r-pill)',
                padding: '6px 12px',
                boxShadow: 'var(--plush-tiny)',
                fontSize: 11,
                fontWeight: 700,
                color: 'var(--ink-2)',
                pointerEvents: 'none',
              }}
            >
              <Kbd>E</Kbd> examine · <Kbd>M</Kbd> mute · <Kbd>Esc</Kbd> release
            </div>
          ) : (
            <div
              style={{
                background: 'white',
                border: '2.5px solid var(--line)',
                borderRadius: 'var(--r-pill)',
                padding: '6px 12px',
                boxShadow: 'var(--plush-tiny)',
                fontSize: 11,
                fontWeight: 700,
                color: 'var(--ink-2)',
                pointerEvents: 'none',
              }}
            >
              Click room to look around · <Kbd>E</Kbd> examine · <Kbd>M</Kbd> mute
            </div>
          )}
        </div>
      </div>

      {examineOpen && patient && (
        <>
          <DockedVoicePanel
            patientName={patient.case.name}
            patientLabel={`${patient.case.age}${patient.case.gender}`}
          />
          <ExamineOverlay
            onClose={() => setExamineOpen(false)}
            onDispatch={async () => {
              console.log('[Lifecycle] Dispatch patient triggered. Ending consultation.');
              setExamineOpen(false);

              const conv = getExistingConversation(POLYCLINIC_BED_INDEX);
              if (conv) {
                try {
                  await conv.sayFarewell();
                } catch {
                  /* network/voice failure — keep going */
                }
              }

              if (document.pointerLockElement) document.exitPointerLock();
              interactionBus.setActive(null);
              console.log('[Lifecycle] Tearing down active patient slot and conversation.');
              store.finishPolyclinicCase();
              disposePatientConversation(POLYCLINIC_BED_INDEX);
              store.setScreen('endConfirm');
            }}
          />
        </>
      )}
    </div>
  );
}
