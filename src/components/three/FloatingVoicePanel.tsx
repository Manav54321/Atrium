import { useEffect, useRef, useState } from 'react';
import { Html } from '@react-three/drei';
import type { ActivePatient } from '../../game/types';
import type { ConversationStatus, SubtitleEvent } from '../../voice/conversation';
import { getOrCreatePatientConversation, getExistingConversation } from '../../voice/conversationStore';

interface Props {
  bedPosition: [number, number, number];
  bedRotationY?: number;
  headOffset?: [number, number, number];
  patient: ActivePatient;
  voiceActive?: boolean;
  onStartVoice?: () => void;
}

export function FloatingVoicePanel({
  bedPosition,
  bedRotationY = 0,
  headOffset,
  patient,
  voiceActive = false,
}: Props) {
  const [status, setStatus] = useState<ConversationStatus>('uninitialized');
  const [subtitle, setSubtitle] = useState<SubtitleEvent>({ who: 'patient', text: '…' });
  const [error, setError] = useState('');
  const [voiceReady, setVoiceReady] = useState(false);
  const [voiceStarting, setVoiceStarting] = useState(false);
  const [progress, setProgress] = useState('');
  // Settling timer — avoid showing "…" for too long
  const [settlingText, setSettlingText] = useState<string | null>(null);

  // Stable listener object
  const listenersRef = useRef<{
    onStatus: (s: ConversationStatus) => void;
    onProgress: (m: string) => void;
    onSubtitle: (sub: SubtitleEvent) => void;
    onError: (e: string) => void;
  } | null>(null);
  if (listenersRef.current === null) {
    listenersRef.current = {
      onStatus: (s) => setStatus(s),
      onProgress: (m) => setProgress(m),
      onSubtitle: (sub) => {
        if (sub.who === 'patient') {
          setSubtitle(sub);
          setSettlingText(null); // Got real content, clear settling
        }
      },
      onError: (e) => setError(e),
    };
  }
  const listeners = listenersRef.current;

  // Auto-start when panel mounts and voiceActive is true (which it always is now).
  useEffect(() => {
    if (!voiceActive) {
      setVoiceReady(false);
      setVoiceStarting(false);
      setStatus('uninitialized');
      setSubtitle({ who: 'patient', text: '' });
      return;
    }

    let cancelled = false;
    setStatus('uninitialized');
    setSubtitle({ who: 'patient', text: '…' });
    setVoiceReady(false);
    setVoiceStarting(false);
    setError('');
    setSettlingText(null);

    const conv = getOrCreatePatientConversation(patient.bedIndex, patient.case, listeners);
    const current = conv.getStatus();
    if (current !== 'uninitialized') {
      setVoiceReady(true);
      setStatus(current);
    } else {
      setVoiceStarting(true);
      conv
        .init()
        .then(() => { if (!cancelled) setVoiceReady(true); })
        .catch(() => { /* onError set */ })
        .finally(() => { if (!cancelled) setVoiceStarting(false); });
    }
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patient.bedIndex, patient.case.id, voiceActive]);

  // If the subtitle stays as "…" for more than 3s, show a natural settling message
  useEffect(() => {
    if (subtitle.text !== '…') return;
    const timer = setTimeout(() => {
      if (subtitle.text === '…') {
        setSettlingText('Patient is settling in…');
      }
    }, 3000);
    return () => clearTimeout(timer);
  }, [subtitle.text]);

  const conv = getExistingConversation(patient.bedIndex);
  const voiceDisabled = conv ? (conv.isVoiceDisabled?.() ?? false) : false;

  const firstName = patient.case.name.split(' ')[0];

  // Simplified status — no more MUTED/OFFLINE states since voice is always on
  const statusLabel =
    status === 'recovering' ? 'RECONNECTING…' :
    status === 'listening' ? 'LISTENING…' :
    status === 'thinking' ? 'THINKING…' :
    status === 'speaking' ? `${firstName.toUpperCase()} SPEAKING` :
    status === 'loading' ? 'CONNECTING…' :
    voiceReady ? (voiceDisabled ? 'TEXT MODE' : 'LIVE') :
    voiceStarting ? 'CONNECTING…' : 'CONNECTING…';

  // Natural idle hints — no more "Press S to start"
  const idleHint =
    status === 'recovering' ? 'Connection lost. Retrying...' :
    status === 'speaking' ? `${firstName} is speaking…` :
    status === 'thinking' ? `${firstName} is thinking…` :
    status === 'listening' ? 'Listening — go ahead.' :
    status === 'loading' ? (progress || 'Connecting…') :
    voiceStarting ? (progress || 'Connecting…') :
    voiceReady ? (voiceDisabled ? 'Voice disabled. Type in Chat tab.' : 'Just talk — voice is live.') :
    'Connecting…';

  const live = voiceActive && voiceReady && (status === 'listening' || status === 'speaking' || status === 'thinking' || status === 'ready');
  const statusColor =
    status === 'recovering' ? '#f59e0b' : // Amber/orange for reconnecting
    status === 'speaking' ? 'var(--peach-deep)' :
    status === 'listening' ? 'var(--mint-deep)' :
    status === 'thinking' ? 'var(--butter-deep)' :
    live ? (voiceDisabled ? 'var(--sky-deep)' : 'var(--mint-deep)') : 'var(--ink-soft)';

  // Determine what text to show
  const displayText = settlingText ?? subtitle.text;
  const showSubtitle = !!displayText && displayText !== '…';

  const [ox, oy, oz] = headOffset ?? [-0.88, 1.0, 0];
  const cos = Math.cos(bedRotationY);
  const sin = Math.sin(bedRotationY);
  const mouthX = bedPosition[0] + ox * cos + oz * sin;
  const mouthY = oy;
  const mouthZ = bedPosition[2] - ox * sin + oz * cos;

  return (
    <Html
      position={[mouthX, mouthY, mouthZ]}
      zIndexRange={[100, 0]}
      style={{ pointerEvents: 'auto', userSelect: 'none', transform: 'translate(-50%, -110%)' }}
    >
      <div
        style={{
          position: 'relative',
          minWidth: 240,
          maxWidth: 320,
          background: 'white',
          border: '3px solid var(--line)',
          borderRadius: 'var(--r-md)',
          boxShadow: '0 4px 0 var(--line), 0 8px 16px rgba(43,30,22,0.18)',
          padding: '10px 14px 12px',
          fontFamily: 'Nunito, system-ui, sans-serif',
          color: 'var(--ink)',
          cursor: 'default',
          transition: 'box-shadow 0.12s',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 8,
            marginBottom: 6,
          }}
        >
          <div style={{ fontSize: 14, fontWeight: 900, letterSpacing: '-0.01em' }}>
            {patient.case.name}
            <span style={{ fontSize: 11, color: 'var(--ink-soft)', marginLeft: 6, fontWeight: 700 }}>
              {patient.case.age}{patient.case.gender}
            </span>
          </div>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              fontSize: 10,
              letterSpacing: '0.12em',
              color: statusColor,
              textTransform: 'uppercase',
              fontWeight: 900,
              whiteSpace: 'nowrap',
              padding: '3px 8px',
              borderRadius: 'var(--r-pill)',
              background: 'var(--cream)',
              border: '2px solid var(--line)',
            }}
          >
            <span
              className={live ? 'breathe' : undefined}
              style={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                background: statusColor,
                display: 'inline-block',
              }}
            />
            {statusLabel}
          </div>
        </div>

        {/* Subtitle with fade-in animation */}
        <div
          style={{
            fontStyle: 'italic',
            fontSize: 13,
            lineHeight: 1.4,
            color: 'var(--ink)',
            fontWeight: 600,
            animation: showSubtitle ? 'subtitleFadeIn 0.3s ease-out' : undefined,
          }}
        >
          {showSubtitle ? (
            <span>&ldquo;{displayText}&rdquo;</span>
          ) : (
            <span style={{ color: 'var(--ink-soft)', fontStyle: 'normal', fontSize: 12, fontWeight: 700 }}>
              {idleHint}
            </span>
          )}
        </div>

        {error && (
          <div
            style={{
              marginTop: 8,
              padding: '6px 10px',
              background: 'var(--rose)',
              border: '2.5px solid var(--line)',
              borderRadius: 10,
              boxShadow: '0 2px 0 var(--line)',
              fontSize: 11,
              fontWeight: 800,
              color: 'var(--ink)',
            }}
          >
            ⚠ {error}
          </div>
        )}

        {/* Speech-bubble tail */}
        <div
          style={{
            position: 'absolute',
            left: '50%',
            bottom: -12,
            transform: 'translateX(-50%)',
            width: 0,
            height: 0,
            borderLeft: '12px solid transparent',
            borderRight: '12px solid transparent',
            borderTop: '12px solid var(--line)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: '50%',
            bottom: -8,
            transform: 'translateX(-50%)',
            width: 0,
            height: 0,
            borderLeft: '9px solid transparent',
            borderRight: '9px solid transparent',
            borderTop: '9px solid white',
          }}
        />
      </div>

      {/* Inline animation for subtitle fade-in */}
      <style>{`
        @keyframes subtitleFadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </Html>
  );
}
