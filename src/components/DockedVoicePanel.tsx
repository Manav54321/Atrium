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
    status === 'listening' ? 'LISTENING…' :
    status === 'thinking'  ? 'THINKING…'  :
    status === 'speaking'  ? `${firstName.toUpperCase()} SPEAKING` :
    status === 'loading'   ? 'CONNECTING…' :
    status === 'ready'     ? 'LIVE'        :
    'OFFLINE';

  const live = status === 'listening' || status === 'speaking' || status === 'thinking' || status === 'ready';
  const statusColor =
    status === 'speaking'  ? '#e8541a' :
    status === 'listening' ? '#2d9e6b' :
    status === 'thinking'  ? '#c8900a' :
    live                   ? '#2d9e6b' : '#9a8d80';

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
        width: 270,
        background: 'white',
        border: '3px solid var(--line)',
        borderRadius: 'var(--r-md)',
        boxShadow: '0 6px 0 var(--line), 0 14px 28px rgba(43,30,22,0.18)',
        fontFamily: 'Nunito, system-ui, sans-serif',
        color: 'var(--ink)',
        overflow: 'hidden',
      }}
    >
      {/* ── Header ─────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
          padding: '10px 14px 8px',
          borderBottom: '2px solid var(--line)',
        }}
      >
        <div style={{ fontSize: 13, fontWeight: 900, display: 'flex', alignItems: 'center', gap: 6 }}>
          {patientName}
          <span style={{ fontSize: 10, color: 'var(--ink-soft)', fontWeight: 700 }}>
            {patientLabel}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {/* Language chip */}
          <div
            style={{
              fontSize: 9,
              fontWeight: 800,
              letterSpacing: '0.08em',
              padding: '2px 6px',
              borderRadius: 'var(--r-pill)',
              background: langIsHindi ? '#fdf3e7' : '#f0f7ff',
              border: `1.5px solid ${langIsHindi ? '#e8a54a' : '#aac6e8'}`,
              color: langIsHindi ? '#b8620a' : '#2a62a8',
              transition: 'background 0.3s, color 0.3s, border-color 0.3s',
              whiteSpace: 'nowrap',
            }}
          >
            {langIsHindi ? '🇮🇳 Hindi' : '🇺🇸 English'}
          </div>

          {/* Status badge */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              fontSize: 9,
              letterSpacing: '0.12em',
              color: statusColor,
              textTransform: 'uppercase',
              fontWeight: 900,
              whiteSpace: 'nowrap',
              padding: '3px 7px',
              borderRadius: 'var(--r-pill)',
              background: 'var(--cream)',
              border: '2px solid var(--line)',
              transition: 'color 0.25s',
            }}
          >
            <span
              className={live ? 'breathe' : undefined}
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: statusColor,
                display: 'inline-block',
                transition: 'background 0.25s',
              }}
            />
            {statusLabel}
          </div>
        </div>
      </div>

      {/* ── Subtitle / transcript box ───────────────────────── */}
      <div style={{ padding: '8px 14px 10px' }}>
        <div
          ref={scrollRef}
          style={{
            fontStyle: showSubtitle ? 'italic' : 'normal',
            fontSize: 12,
            lineHeight: 1.45,
            color: showSubtitle ? 'var(--ink)' : 'var(--ink-soft)',
            fontWeight: 600,
            maxHeight: status === 'speaking' ? 110 : 90,
            overflowY: 'auto',
            background: 'var(--cream-2)',
            border: '2px solid var(--line)',
            borderRadius: 10,
            padding: '8px 10px',
            transition: 'max-height 0.2s',
          }}
        >
          {showSubtitle ? (
            <>
              <div
                style={{
                  fontSize: 9,
                  fontWeight: 800,
                  color: subtitle.who === 'you' ? '#2a62a8' : 'var(--ink-2)',
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  marginBottom: 3,
                  fontStyle: 'normal',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                {speakerLabel}
                {subtitle.who === 'patient' && (
                  <span style={{ fontSize: 11 }}>{EMOTION_ICONS[emotion]}</span>
                )}
              </div>
              "{subtitle.text}"
            </>
          ) : status === 'thinking' ? (
            <span style={{ color: '#c8900a', fontStyle: 'normal' }}>
              Thinking<span className="ellipsis-dots">…</span>
            </span>
          ) : (
            'Voice live · just talk'
          )}
        </div>

        {/* ── Speaking waveform ───────────────────────────────── */}
        {status === 'speaking' && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 3,
              justifyContent: 'center',
              marginTop: 6,
            }}
          >
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                style={{
                  width: 3,
                  borderRadius: 2,
                  background: statusColor,
                  animation: `waveBar ${0.5 + i * 0.1}s ease-in-out infinite alternate`,
                  height: 8 + (i % 3) * 5,
                  opacity: 0.8,
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Debug overlay (localStorage.debug='1') ─────────────── */}
      {debugMode.current && (
        <div style={{ borderTop: '2px solid var(--line)' }}>
          <button
            type="button"
            onClick={() => setDebugOpen((o) => !o)}
            style={{
              width: '100%',
              background: '#1a1209',
              color: '#7cfc94',
              border: 'none',
              padding: '5px 10px',
              fontSize: 9,
              fontFamily: 'ui-monospace, monospace',
              letterSpacing: '0.1em',
              cursor: 'pointer',
              textAlign: 'left',
              fontWeight: 700,
            }}
          >
            {debugOpen ? '▾' : '▸'} DEBUG {debugOpen ? '(click to collapse)' : ''}
          </button>

          {debugOpen && (
            <div
              style={{
                background: '#1a1209',
                color: '#7cfc94',
                fontFamily: 'ui-monospace, monospace',
                fontSize: 10,
                padding: '6px 10px 8px',
                lineHeight: 1.6,
                maxHeight: 280,
                overflowY: 'auto',
              }}
            >
              <div><span style={{ color: '#aaa' }}>STATUS  </span>{status}</div>
              <div><span style={{ color: '#aaa' }}>EMOTION </span>{EMOTION_ICONS[emotion]} {emotion}</div>
              <div><span style={{ color: '#aaa' }}>LANG    </span>{language}</div>

              {/* FSM Event Log */}
              <div style={{ marginTop: 6, color: '#aaa', fontSize: 9, borderTop: '1px solid #333', paddingTop: 4 }}>
                FSM EVENT LOG
              </div>
              {(() => {
                const conv = getExistingConversation(POLYCLINIC_BED_INDEX);
                const events = conv?.getEventLog?.() ?? [];
                const recent = events.slice(-10);
                if (recent.length === 0) {
                  return <div style={{ color: '#555' }}>no events yet</div>;
                }
                return recent.map((ev, i) => {
                  const time = new Date(ev.timestamp).toLocaleTimeString('en-US', {
                    hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit',
                  });
                  const ms = i > 0 ? `+${ev.timestamp - recent[i - 1].timestamp}ms` : '';
                  const typeColor =
                    ev.type === 'error' ? '#ff6b6b' :
                    ev.type === 'timeout' ? '#ffa94d' :
                    ev.type === 'reconnect' ? '#ffa94d' :
                    ev.type === 'state_transition' ? '#7cfc94' :
                    ev.type === 'drift' ? '#ff6b6b' :
                    '#6fc3f7';
                  return (
                    <div key={i} style={{ color: typeColor, fontSize: 9, lineHeight: 1.4 }}>
                      <span style={{ color: '#666' }}>{time}</span>{' '}
                      {ev.type === 'state_transition'
                        ? `${ev.from}→${ev.to}`
                        : ev.type}
                      {ev.detail ? ` ${ev.detail.slice(0, 40)}` : ''}
                      {ms && <span style={{ color: '#555' }}> {ms}</span>}
                    </div>
                  );
                });
              })()}

              {/* Recent turns */}
              <div style={{ marginTop: 6, color: '#aaa', fontSize: 9, borderTop: '1px solid #333', paddingTop: 4 }}>
                RECENT TURNS
              </div>
              {recentLog.length === 0 && (
                <div style={{ color: '#555' }}>no turns yet</div>
              )}
              {recentLog.map((entry, i) => (
                <div key={i} style={{ color: entry.who === 'you' ? '#6fc3f7' : '#7cfc94' }}>
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
          from { transform: scaleY(1); opacity: 0.6; }
          to   { transform: scaleY(2.2); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
