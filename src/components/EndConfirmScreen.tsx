import { DoodleScatter, PatientFace, TopBar } from './primitives';
import { getCase } from '../data/cases';
import { store, useStore, useTweaks } from '../game/store';
import type { EndConfirmChecks } from '../game/types';

interface Item {
  id: keyof EndConfirmChecks;
  label: string;
  sub: string;
  emoji: string;
}

const ITEMS: Item[] = [
  { id: 'sum',  label: 'Have you summarised back to the patient?', sub: 'A short read-back of the story.',          emoji: '📋' },
  { id: 'safe', label: 'Have you safety-netted?',                   sub: 'What to look for, when to come back.',     emoji: '🛡️' },
  { id: 'ice',  label: 'Have you addressed their ICE?',             sub: 'Did the patient feel heard & understood?', emoji: '💬' },
];

export function EndConfirmScreen() {
  const tweaks = useTweaks();
  const checked = useStore((s) => s.endConfirm);
  const caseId  = useStore((s) => s.selectedCaseId);
  const c = getCase(caseId);

  return (
    <div className="screen" style={{ background: 'var(--bg)', position: 'relative' }}>
      <TopBar here={5} steps={['Polyclinic', 'GP', 'Case', 'Brief', 'Encounter', 'Wrap']} />

      <DoodleScatter
        items={[
          { kind: 'sparkle', x: 60,   y: 90,  size: 22, color: 'var(--butter)' },
          { kind: 'sparkle', x: '88%', y: 130, size: 20, color: 'var(--sky)' },
          { kind: 'heart',   x: '15%', y: '75%', size: 32, color: 'var(--rose)' },
          { kind: 'pill',    x: '82%', y: '70%', size: 30, color: 'var(--mint)' },
        ]}
      />

      <div
        style={{
          position: 'absolute',
          inset: 0,
          top: 58,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 40,
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: 700,
            background: 'white',
            borderRadius: 'var(--r-xl)',
            border: '2px solid var(--line)',
            boxShadow: '0 20px 60px rgba(26,26,46,0.10)',
            padding: 36,
            position: 'relative',
            overflow: 'visible',
          }}
        >
          {/* Top gradient accent */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: 5,
            background: 'linear-gradient(90deg, var(--coral) 0%, var(--peach) 50%, var(--butter) 100%)',
            borderRadius: '32px 32px 0 0',
          }} />

          {/* Floating patient avatar */}
          <div style={{ position: 'absolute', right: -38, top: -55 }}>
            <div className="floaty">
              <div
                style={{
                  width: 118,
                  height: 118,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--peach-lt) 0%, var(--rose-lt) 100%)',
                  border: '3px solid white',
                  boxShadow: '0 12px 32px rgba(26,26,46,0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                }}
              >
                <PatientFace style={tweaks.avatarStyle} skin={c.skin} hair={c.hair} size={110} mood="happy" />
              </div>
            </div>
            {/* Speech bubble */}
            <div style={{ position: 'absolute', left: -172, top: 22, width: 174 }}>
              <div
                style={{
                  position: 'relative',
                  background: 'white',
                  border: '2px solid var(--line)',
                  borderRadius: 16,
                  padding: '10px 14px',
                  fontWeight: 700,
                  fontSize: 12,
                  fontFamily: "'Nunito', sans-serif",
                  color: 'var(--ink-2)',
                  boxShadow: '0 4px 14px rgba(26,26,46,0.08)',
                  lineHeight: 1.4,
                }}
              >
                "Is there anything else I should know?"
                <svg
                  style={{ position: 'absolute', right: -14, top: 14 }}
                  width="20" height="22" viewBox="0 0 20 22"
                >
                  <path d="M 0 4 L 18 12 L 0 18 Z" fill="white" stroke="var(--line)" strokeWidth="2.5" strokeLinejoin="round" />
                  <line x1="0" y1="4" x2="0" y2="18" stroke="white" strokeWidth="4" />
                </svg>
              </div>
            </div>
          </div>

          {/* Header */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: 'var(--butter-lt)',
              border: '1.5px solid var(--butter)',
              borderRadius: 'var(--r-pill)',
              padding: '5px 14px',
              fontSize: 11, fontWeight: 800,
              color: '#9a6800',
              fontFamily: "'Nunito', sans-serif",
              marginBottom: 16,
            }}
          >
            ✋ Before You Finish
          </div>
          <h1
            style={{
              fontSize: 36,
              lineHeight: 1.1,
              fontFamily: "'Nunito', sans-serif",
              fontWeight: 900,
              letterSpacing: '-0.02em',
              marginBottom: 10,
            }}
          >
            Take a breath.
          </h1>
          <p
            style={{
              fontSize: 15,
              color: 'var(--ink-2)',
              fontWeight: 600,
              marginBottom: 24,
              maxWidth: 440,
              lineHeight: 1.55,
            }}
          >
            One last check — these affect your debrief score. Tick only what you actually did.
          </p>

          {/* Checklist */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
            {ITEMS.map((it) => {
              const on = checked[it.id];
              return (
                <div
                  key={it.id}
                  className="tap"
                  onClick={() => store.toggleEndConfirm(it.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    padding: '14px 16px',
                    background: on ? 'var(--mint-lt)' : 'var(--bg)',
                    border: `2px solid ${on ? 'var(--mint)' : 'var(--line)'}`,
                    borderRadius: 18,
                    cursor: 'pointer',
                    transition: 'all 200ms cubic-bezier(0.34, 1.56, 0.64, 1)',
                    boxShadow: on ? '0 4px 16px rgba(78,205,196,0.2)' : 'none',
                  }}
                >
                  {/* Checkbox */}
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      background: on ? 'var(--mint)' : 'white',
                      border: `2px solid ${on ? 'var(--mint-deep)' : 'var(--line)'}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 900,
                      fontSize: 18,
                      color: 'white',
                      flexShrink: 0,
                      transition: 'all 200ms cubic-bezier(0.34, 1.56, 0.64, 1)',
                    }}
                  >
                    {on ? '✓' : ''}
                  </div>
                  {/* Emoji */}
                  <span style={{ fontSize: 22, flexShrink: 0 }}>{it.emoji}</span>
                  {/* Text */}
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 15, fontFamily: "'Nunito', sans-serif", color: 'var(--ink)' }}>
                      {it.label}
                    </div>
                    <div style={{ fontWeight: 600, fontSize: 12, color: 'var(--ink-2)', marginTop: 2 }}>
                      {it.sub}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 12 }}>
            <button
              type="button"
              className="btn-plush ghost"
              style={{ flex: 1, fontFamily: "'Nunito', sans-serif", fontSize: 14 }}
              onClick={() => store.setScreen('encounter')}
            >
              ← Back to room
            </button>
            <button
              type="button"
              className="btn-plush primary"
              style={{ flex: 1.5, fontFamily: "'Nunito', sans-serif", fontSize: 15, fontWeight: 900 }}
              onClick={() => store.setScreen('debrief')}
            >
              End consultation →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
