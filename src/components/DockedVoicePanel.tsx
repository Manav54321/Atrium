import { useEffect, useRef, useState } from 'react';
import { POLYCLINIC_BED_INDEX } from '../game/store';
import { getExistingConversation } from '../voice/conversationStore';
import type { ConversationStatus, SubtitleEvent, PatientEmotion } from '../voice/conversation';

/** Compact, fixed-position voice transcript card. Used while the Examine
 *  overlay is open so the doctor can still hear/read what the patient is
 *  saying without the in-scene speech bubble bleeding through the modal.
 *
 *  Debug overlay: set `localStorage.debug = '1'` in the browser console,
 *  then reload to see live emotion, language, status, and recent transcripts. */

interface Props {
  patientName: string;
  patientLabel: string; // e.g. "34F"
}

const EMOTION_ICONS: Record<PatientEmotion, string> = {
  pain:    '😣',
  fear:    '😨',
  relief:  '😮‍💨',
  confused:'😕',
  neutral: '😐',
};

function isDebugMode(): boolean {
  try { return localStorage.getItem('debug') === '1'; } catch { return false; }
}

export function DockedVoicePanel({ patientName, patientLabel }: Props) {
  const [status, setStatus]     = useState<ConversationStatus>('uninitialized');
  const [subtitle, setSubtitle] = useState<SubtitleEvent>({ who: 'patient', text: '…' });
  const [emotion, setEmotion]   = useState<PatientEmotion>('neutral');
  const [language, setLanguage] = useState<string>('English');
  const [recentLog, setRecentLog] = useState<Array<{ who: 'patient' | 'you'; text: string }>>([]);
  const [debugOpen, setDebugOpen] = useState(false);
  const debugMode = useRef(isDebugMode());

  // Hook into the live conversation.
  useEffect(() => {
    let disposed = false;
    let attempt  = 0;
    let stopMessages: (() => void) | null = null;

    const tryAttach = () => {
      if (disposed) return;
      const conv = getExistingConversation(POLYCLINIC_BED_INDEX);
      if (!conv) {
        if (attempt++ < 20) window.setTimeout(tryAttach, 100);
        return;
      }
      setStatus(conv.getStatus());
      setEmotion(conv.getCurrentEmotion());
      const msgs = conv.getMessages();
      const last = [...msgs].reverse().find((m) => m.role === 'assistant' || m.role === 'user');
      if (last) {
        setSubtitle({ who: last.role === 'user' ? 'you' : 'patient', text: last.content });
      }
      stopMessages = conv.subscribeMessages((all) => {
        const lastMsg = [...all].reverse().find((m) => m.role === 'assistant' || m.role === 'user');
        if (lastMsg) {
          setSubtitle({ who: lastMsg.role === 'user' ? 'you' : 'patient', text: lastMsg.content });
          if (debugMode.current) {
            setRecentLog((prev) => [
              ...prev.slice(-4),
              { who: lastMsg.role === 'user' ? 'you' : 'patient', text: lastMsg.content.slice(0, 80) },
            ]);
          }
        }
      });
    };
    tryAttach();

    // Status + emotion polling — 400ms tick is responsive without burning CPU.
    const tick = window.setInterval(() => {
      if (disposed) return;
      const conv = getExistingConversation(POLYCLINIC_BED_INDEX);
      if (!conv) return;
      setStatus(conv.getStatus());
      setEmotion(conv.getCurrentEmotion());
      // Language detection from last user utterance
      if (typeof (conv as any).getLastDetectedLanguage === 'function') {
        setLanguage((conv as any).getLastDetectedLanguage());
      }
    }, 400);

    return () => {
      disposed = true;
      window.clearInterval(tick);
      stopMessages?.();
    };
  }, []);

  const firstName   = patientName.split(' ')[0];
  const statusLabel =
    status === 'recovering' ? 'RECONNECTING…' :
    status === 'listening' ? 'LISTENING…' :
    status === 'thinking'  ? 'THINKING…'  :
    status === 'speaking'  ? `${firstName.toUpperCase()} SPEAKING` :
    status === 'loading'   ? 'CONNECTING…' :
    status === 'ready'     ? 'LIVE'        :
    'OFFLINE';

  const live = status === 'listening' || status === 'speaking' || status === 'thinking' || status === 'ready' || status === 'recovering';
  const statusColor =
    status === 'recovering' ? '#f59e0b' : // Amber/orange
    status === 'speaking'  ? 'var(--peach)' :
    status === 'listening' ? '#2d9e6b' :
    status === 'thinking'  ? '#d99a06' :
    live                   ? '#2d9e6b' : 'var(--ink-soft)';

  const showSubtitle  = !!subtitle.text && subtitle.text !== '…';
  const speakerLabel  = subtitle.who === 'you' ? 'You' : firstName;
  const langIsHindi   = language === 'Hindi';

  // Auto-scroll transcript log when subtitle changes.
  const scrollRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [subtitle.text]);

  return (
    <div
      style={{
        position: 'fixed',
        top: 18,
        right: 18,
        zIndex: 60,
        width: 300,
        background: 'rgba(255, 255, 255, 0.97)',
        border: '1.5px solid var(--line)',
        borderRadius: 28,
        boxShadow: '0 16px 48px rgba(26,26,46,0.12)',
        fontFamily: "'Nunito', sans-serif",
        color: 'var(--ink)',
        overflow: 'hidden',
      }}
    >
      {/* Top color accent */}
      <div style={{
        height: 4, width: '100%',
        background: `linear-gradient(90deg, ${statusColor} 0%, ${statusColor}88 100%)`,
        transition: 'background 0.3s',
      }} />

      {/* ── Header ─────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
          padding: '12px 16px',
          borderBottom: '1.5px solid var(--line)',
          background: 'var(--bg-soft)',
        }}
      >
        <div style={{ fontSize: 14, fontWeight: 900, display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 34, height: 34, borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--peach-lt) 0%, var(--rose-lt) 100%)',
            border: '1.5px solid var(--line)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16, flexShrink: 0,
          }}>
            {EMOTION_ICONS[emotion]}
          </div>
          <div>
            <div style={{ fontWeight: 900, fontSize: 14, color: 'var(--ink)', fontFamily: "'Nunito', sans-serif" }}>{patientName}</div>
            <div style={{ fontSize: 10, color: 'var(--ink-soft)', fontWeight: 700 }}>{patientLabel}</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {/* Language chip */}
          <div
            style={{
              background: langIsHindi ? 'var(--butter-lt)' : 'var(--sky-lt)',
              border: `1.5px solid ${langIsHindi ? 'var(--butter)' : 'var(--sky)'}`,
              borderRadius: 'var(--r-pill)',
              padding: '3px 8px',
              fontSize: 9, fontWeight: 900,
              color: langIsHindi ? '#9a6800' : 'var(--sky-deep)',
              fontFamily: "'Nunito', sans-serif",
            }}
          >
            {langIsHindi ? 'हिंदी' : 'EN'}
          </div>

          {/* Status badge */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              fontSize: 9,
              letterSpacing: '0.06em',
              color: statusColor,
              textTransform: 'uppercase',
              fontWeight: 900,
              whiteSpace: 'nowrap',
              padding: '4px 10px',
              borderRadius: 'var(--r-pill)',
              background: 'white',
              border: '1.5px solid var(--line)',
              fontFamily: "'Nunito', sans-serif",
              transition: 'color 0.25s',
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
                boxShadow: `0 0 8px ${statusColor}`,
                transition: 'background 0.25s',
              }}
            />
            {statusLabel}
          </div>
        </div>
      </div>

      {/* ── Transcript box ─────────────────────────────────── */}
      <div style={{ padding: '14px 16px 16px' }}>
        <div
          ref={scrollRef}
          style={{
            fontSize: 13,
            lineHeight: 1.6,
            color: showSubtitle ? 'var(--ink)' : 'var(--ink-2)',
            fontWeight: 600,
            maxHeight: status === 'speaking' ? 120 : 90,
            overflowY: 'auto',
            background: 'var(--cream-2)',
            border: 'var(--stroke) solid var(--line)',
            borderRadius: 14,
            padding: '10px 14px',
            transition: 'max-height 0.2s',
          }}
        >
          {showSubtitle ? (
            <>
              <div
                style={{
                  fontSize: 9,
                  fontWeight: 800,
                  color: subtitle.who === 'you' ? 'var(--peach)' : 'var(--rose)',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  marginBottom: 4,
                  fontStyle: 'normal',
                  fontFamily: 'Outfit, sans-serif',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                {speakerLabel}
                {subtitle.who === 'patient' && (
                  <span style={{ fontSize: 12 }}>{EMOTION_ICONS[emotion]}</span>
                )}
              </div>
              "{subtitle.text}"
            </>
          ) : status === 'thinking' ? (
            <span style={{ color: 'var(--peach)', fontStyle: 'normal', fontFamily: 'Outfit, sans-serif' }}>
              Thinking...
            </span>
          ) : (
            <span style={{ fontFamily: 'Outfit, sans-serif', color: 'var(--ink-soft)', fontSize: 11 }}>
              Ready & Listening
            </span>
          )}
        </div>

        {/* ── Speaking waveform ───────────────────────────────── */}
        {status === 'speaking' && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              justifyContent: 'center',
              marginTop: 10,
            }}
          >
            {[1, 2, 3, 4, 5, 6, 7].map((i) => (
              <div
                key={i}
                style={{
                  width: 3,
                  borderRadius: 2,
                  background: statusColor,
                  boxShadow: `0 0 6px ${statusColor}aa`,
                  animation: `waveBar ${0.4 + i * 0.08}s ease-in-out infinite alternate`,
                  height: 6 + (i % 4) * 6,
                  opacity: 0.85,
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Debug overlay (localStorage.debug='1') ─────────────── */}
      {debugMode.current && (
        <div style={{ borderTop: 'var(--stroke) solid var(--line)' }}>
          <button
            type="button"
            onClick={() => setDebugOpen((o) => !o)}
            style={{
              width: '100%',
              background: 'var(--cream-2)',
              color: 'var(--ink)',
              border: 'none',
              padding: '6px 12px',
              fontSize: 9,
              fontFamily: 'Outfit, sans-serif',
              letterSpacing: '0.1em',
              cursor: 'pointer',
              textAlign: 'left',
              fontWeight: 700,
            }}
          >
            {debugOpen ? '▼' : '▶'} COGNITIVE DIAGNOSTICS {debugOpen ? '(HIDE)' : '(SHOW)'}
          </button>

          {debugOpen && (
            <div
              style={{
                background: 'var(--cream)',
                color: 'var(--ink-2)',
                fontFamily: 'Outfit, sans-serif',
                fontSize: 10,
                padding: '8px 12px 12px',
                lineHeight: 1.6,
                maxHeight: 280,
                overflowY: 'auto',
              }}
            >
              <div><span style={{ color: 'var(--ink-soft)' }}>STATUS  </span>{status}</div>
              <div><span style={{ color: 'var(--ink-soft)' }}>EMOTION </span>{EMOTION_ICONS[emotion]} {emotion}</div>
              <div><span style={{ color: 'var(--ink-soft)' }}>LANG    </span>{language}</div>

              {/* FSM Event Log */}
              <div style={{ marginTop: 8, color: 'var(--ink-soft)', fontSize: 9, borderTop: '1px dashed var(--line)', paddingTop: 6 }}>
                EVENT LOG
              </div>
              {(() => {
                const conv = getExistingConversation(POLYCLINIC_BED_INDEX);
                const events = conv?.getEventLog?.() ?? [];
                const recent = events.slice(-10);
                if (recent.length === 0) {
                  return <div style={{ color: 'var(--ink-soft)' }}>no events yet</div>;
                }
                return recent.map((ev, i) => {
                  const time = new Date(ev.timestamp).toLocaleTimeString('en-US', {
                    hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit',
                  });
                  const ms = i > 0 ? `+${ev.timestamp - recent[i - 1].timestamp}ms` : '';
                  const typeColor =
                    ev.type === 'error' ? 'var(--rose)' :
                    ev.type === 'timeout' ? 'var(--peach)' :
                    ev.type === 'reconnect' ? 'var(--peach)' :
                    ev.type === 'state_transition' ? 'var(--mint)' :
                    ev.type === 'drift' ? 'var(--rose)' :
                    'var(--peach)';
                  return (
                    <div key={i} style={{ color: typeColor, fontSize: 9, lineHeight: 1.4 }}>
                      <span style={{ color: 'var(--ink-soft)' }}>{time}</span>{' '}
                      {ev.type === 'state_transition'
                        ? `${ev.from}→${ev.to}`
                        : ev.type}
                      {ev.detail ? ` ${ev.detail.slice(0, 40)}` : ''}
                      {ms && <span style={{ color: 'var(--ink-soft)' }}> {ms}</span>}
                    </div>
                  );
                });
              })()}

              {/* Recent turns */}
              <div style={{ marginTop: 8, color: 'var(--ink-soft)', fontSize: 9, borderTop: '1px dashed var(--line)', paddingTop: 6 }}>
                RECENT TRANSCRIPT
              </div>
              {recentLog.length === 0 && (
                <div style={{ color: 'var(--ink-soft)' }}>no turns yet</div>
              )}
              {recentLog.map((entry, i) => (
                <div key={i} style={{ color: entry.who === 'you' ? 'var(--mint)' : 'var(--peach)' }}>
                  {entry.who === 'you' ? '→ DR: ' : '← PT: '}{entry.text}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Inline keyframe styles injected once */}
      <style>{`
        @keyframes waveBar {
          from { transform: scaleY(0.7); opacity: 0.5; }
          to   { transform: scaleY(2.2); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
