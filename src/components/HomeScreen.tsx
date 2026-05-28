import { useEffect, useState } from 'react';
import { PatientFace, TopBar } from './primitives';
import { store, useTweaks } from '../game/store';
import {
  listEvalHistory,
  deleteEvalHistory,
  type EvalHistoryEntry,
} from '../data/evalHistory';

const VERDICT_COLOR: Record<EvalHistoryEntry['verdict'], string> = {
  excellent: 'var(--mint)',
  good: 'var(--mint)',
  satisfactory: 'var(--butter)',
  borderline: 'var(--peach)',
  'clear-fail': 'var(--coral)',
};

const VERDICT_BG: Record<EvalHistoryEntry['verdict'], string> = {
  excellent: 'var(--mint-lt)',
  good: 'var(--mint-lt)',
  satisfactory: 'var(--butter-lt)',
  borderline: 'var(--peach-lt)',
  'clear-fail': 'var(--coral-lt)',
};

const VERDICT_LABEL: Record<EvalHistoryEntry['verdict'], string> = {
  excellent: 'Excellent',
  good: 'Good',
  satisfactory: 'Satisfactory',
  borderline: 'Borderline',
  'clear-fail': 'Clear fail',
};

function relativeDate(ms: number): string {
  const diffMs = Date.now() - ms;
  const minutes = Math.round(diffMs / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(ms).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

const VERDICT_SCORE: Record<EvalHistoryEntry['verdict'], number> = {
  'clear-fail': 1,
  borderline: 2,
  satisfactory: 3,
  good: 4,
  excellent: 5,
};

const DOMAIN_META = [
  { key: 'data_gathering' as const,      label: 'Data Gathering',      color: 'var(--peach)',  lt: 'var(--peach-lt)',  emoji: '📋' },
  { key: 'clinical_management' as const, label: 'Clinical Management', color: 'var(--mint)',   lt: 'var(--mint-lt)',   emoji: '🩺' },
  { key: 'interpersonal' as const,       label: 'Interpersonal',       color: 'var(--lav)',    lt: 'var(--lav-lt)',    emoji: '💬' },
];

interface TrainingStats {
  count: number;
  avgRating: number;
  domains: { key: 'data_gathering' | 'clinical_management' | 'interpersonal'; label: string; pct: number; color: string; lt: string; emoji: string }[];
  weakest: { label: string; pct: number; color: string; emoji: string } | null;
  streakDays: number;
}

function computeStats(history: EvalHistoryEntry[]): TrainingStats {
  const count = history.length;
  if (count === 0) {
    return { count: 0, avgRating: 0, domains: DOMAIN_META.map((d) => ({ ...d, pct: 0 })), weakest: null, streakDays: 0 };
  }
  const avgRating = history.reduce((sum, e) => sum + (VERDICT_SCORE[e.verdict] ?? 0), 0) / count;
  const domains = DOMAIN_META.map((d) => {
    const ratios = history
      .map((e) => { const ds = e.evaluation.domain_scores[d.key]; return ds && ds.max > 0 ? ds.raw / ds.max : null; })
      .filter((r): r is number => r !== null);
    const pct = ratios.length > 0 ? Math.round((ratios.reduce((a, b) => a + b, 0) / ratios.length) * 100) : 0;
    return { ...d, pct };
  });
  const weakestDomain = domains.reduce((min, d) => (d.pct < min.pct ? d : min), domains[0]);
  const weakest = { label: weakestDomain.label, pct: weakestDomain.pct, color: weakestDomain.color, emoji: weakestDomain.emoji };
  const days = new Set(history.map((e) => new Date(e.savedAt).toISOString().slice(0, 10)));
  let streakDays = 0;
  const cursor = new Date();
  for (;;) {
    const key = cursor.toISOString().slice(0, 10);
    if (days.has(key)) { streakDays += 1; cursor.setDate(cursor.getDate() - 1); }
    else { break; }
  }
  return { count, avgRating, domains, weakest, streakDays };
}

function StatPill({ value, label, emoji }: { value: string; label: string; emoji: string }) {
  return (
    <div
      style={{
        background: 'white',
        borderRadius: 20,
        padding: '18px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        boxShadow: '0 4px 16px rgba(26,26,46,0.06)',
        border: '1.5px solid var(--line)',
        flex: 1,
        minWidth: 0,
      }}
    >
      <div style={{ fontSize: 24 }}>{emoji}</div>
      <div style={{ fontWeight: 900, fontSize: 30, lineHeight: 1, color: 'var(--ink)', fontFamily: "'Nunito', sans-serif" }}>
        {value}
      </div>
      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-soft)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label}
      </div>
    </div>
  );
}

export function HomeScreen() {
  const tweaks = useTweaks();
  const [history, setHistory] = useState<EvalHistoryEntry[]>([]);

  useEffect(() => {
    setHistory(listEvalHistory());
  }, []);

  const refresh = () => setHistory(listEvalHistory());
  const onDelete = (id: string) => {
    deleteEvalHistory(id);
    refresh();
  };

  const stats = computeStats(history);

  return (
    <div className="screen" style={{ background: 'var(--bg)', overflowY: 'auto' }}>
      <TopBar here={0} steps={['Profile']} />

      <div
        style={{
          padding: '32px 36px 48px',
          maxWidth: 1180,
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: '1.35fr 1fr',
          gap: 28,
          alignItems: 'start',
        }}
      >
        {/* ── LEFT COLUMN ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

          {/* Welcome hero */}
          <div>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                background: 'var(--mint-lt)',
                border: '1.5px solid var(--mint)',
                borderRadius: 'var(--r-pill)',
                padding: '5px 14px',
                fontFamily: "'Nunito', sans-serif",
                fontWeight: 800,
                fontSize: 12,
                color: 'var(--mint-deep)',
                marginBottom: 12,
                letterSpacing: '0.03em',
              }}
            >
              {stats.streakDays > 0 ? `🔥 ${stats.streakDays}-day streak` : '👋 Welcome'}
            </div>
            <h1
              style={{
                fontSize: 'clamp(36px, 4vw, 52px)',
                lineHeight: 1.05,
                fontFamily: "'Nunito', sans-serif",
                fontWeight: 900,
                letterSpacing: '-0.02em',
                marginBottom: 10,
              }}
            >
              {stats.count === 0 ? (
                <>Ready when<br />you are! 🌟</>
              ) : (
                <>Good to see<br />you, Doctor 👋</>
              )}
            </h1>
            <p
              style={{
                fontSize: 16,
                color: 'var(--ink-2)',
                fontWeight: 600,
                lineHeight: 1.55,
                maxWidth: 480,
                margin: 0,
              }}
            >
              {stats.count === 0
                ? 'Pick a polyclinic and your first patient walks in. Your training log starts filling in after that.'
                : 'Your training log is updating with every case you complete. Keep the streak going!'}
            </p>
          </div>

          {/* Hero action card */}
          {stats.count === 0 ? (
            <div
              className="popin"
              style={{
                background: 'white',
                borderRadius: 'var(--r-xl)',
                padding: 28,
                position: 'relative',
                boxShadow: '0 8px 32px rgba(26,26,46,0.08)',
                border: '1.5px solid var(--line)',
                overflow: 'hidden',
              }}
            >
              {/* Top accent bar */}
              <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, height: 5,
                background: 'linear-gradient(90deg, var(--coral) 0%, var(--peach) 50%, var(--butter) 100%)',
                borderRadius: '32px 32px 0 0',
              }} />
              <div style={{ paddingTop: 8, display: 'flex', gap: 20, alignItems: 'center' }}>
                <div className="floaty" style={{ flexShrink: 0 }}>
                  <div style={{
                    width: 90, height: 90, borderRadius: '50%',
                    background: 'linear-gradient(135deg, var(--bg-soft) 0%, var(--bg-mint) 100%)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: '2px solid var(--line)',
                  }}>
                    <PatientFace style={tweaks.avatarStyle} skin="#E8B68F" hair="#3B2A1F" size={86} mood="neutral" />
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 900, fontSize: 20, color: 'var(--ink)', marginBottom: 6, fontFamily: "'Nunito', sans-serif" }}>
                    No case active yet
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink-2)', lineHeight: 1.5, marginBottom: 16 }}>
                    Choose a polyclinic below — your first patient will walk straight in.
                  </div>
                  <button
                    type="button"
                    className="btn-plush primary breathe"
                    style={{ fontSize: 15, padding: '13px 28px', fontFamily: "'Nunito', sans-serif" }}
                    onClick={() => store.setScreen('mode')}
                  >
                    Start Session →
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div
              className="popin tap"
              onClick={() => store.viewEvalHistory(history[0].id)}
              style={{
                background: 'white',
                borderRadius: 'var(--r-xl)',
                padding: 28,
                position: 'relative',
                boxShadow: '0 8px 32px rgba(26,26,46,0.08)',
                border: '1.5px solid var(--line)',
                overflow: 'hidden',
                cursor: 'pointer',
              }}
            >
              <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, height: 5,
                background: `linear-gradient(90deg, ${VERDICT_COLOR[history[0].verdict]} 0%, ${VERDICT_COLOR[history[0].verdict]}aa 100%)`,
                borderRadius: '32px 32px 0 0',
              }} />
              <div style={{
                position: 'absolute', top: 20, right: 20,
                background: VERDICT_BG[history[0].verdict],
                border: `1.5px solid ${VERDICT_COLOR[history[0].verdict]}`,
                borderRadius: 'var(--r-pill)',
                padding: '4px 12px',
                fontSize: 11, fontWeight: 800, color: 'var(--ink)',
                fontFamily: "'Nunito', sans-serif",
              }}>
                {VERDICT_LABEL[history[0].verdict]}
              </div>
              <div style={{ paddingTop: 8, display: 'flex', gap: 20, alignItems: 'center' }}>
                <div className="floaty" style={{ flexShrink: 0 }}>
                  <div style={{
                    width: 90, height: 90, borderRadius: '50%',
                    background: 'var(--bg-soft)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: '2px solid var(--line)',
                  }}>
                    <PatientFace
                      style={tweaks.avatarStyle}
                      skin={history[0].caseGender === 'F' ? '#F0C4A8' : '#E8B68F'}
                      hair="#3B2A1F"
                      size={86}
                      mood="neutral"
                    />
                  </div>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 900, fontSize: 20, color: 'var(--ink)', marginBottom: 4, fontFamily: "'Nunito', sans-serif" }}>
                    {history[0].caseName}, {history[0].caseAge}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-2)', marginBottom: 14 }}>
                    {history[0].diagnosisLabel}
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                    <span className="chip" style={{ fontSize: 11 }}>🕐 {relativeDate(history[0].savedAt)}</span>
                    {stats.weakest && (
                      <span className="chip peach" style={{ fontSize: 11 }}>Focus: {stats.weakest.label}</span>
                    )}
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-soft)', marginLeft: 'auto' }}>
                      Review →
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Start session button */}
          <button
            type="button"
            className="btn-plush mint breathe"
            style={{
              fontSize: 18,
              padding: '20px 0',
              alignSelf: 'stretch',
              borderRadius: 'var(--r-xl)',
              fontFamily: "'Nunito', sans-serif",
              fontWeight: 900,
              letterSpacing: '-0.01em',
            }}
            onClick={() => store.setScreen('mode')}
          >
            ▶ Start a New Session
          </button>

          {/* Recent cases */}
          <div
            style={{
              background: 'white',
              borderRadius: 'var(--r-xl)',
              padding: 24,
              boxShadow: '0 4px 20px rgba(26,26,46,0.06)',
              border: '1.5px solid var(--line)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ fontWeight: 900, fontSize: 15, color: 'var(--ink)', fontFamily: "'Nunito', sans-serif" }}>
                📚 Recent Cases
              </div>
              <span
                style={{ fontSize: 13, fontWeight: 700, color: 'var(--mint-deep)', cursor: 'pointer' }}
                onClick={() => store.setScreen('history')}
              >
                See all →
              </span>
            </div>

            {history.length === 0 ? (
              <div
                style={{
                  background: 'var(--bg-soft)',
                  borderRadius: 16,
                  padding: '20px 16px',
                  textAlign: 'center',
                  border: '2px dashed var(--line)',
                }}
              >
                <div style={{ fontSize: 32, marginBottom: 8 }}>🩺</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink-2)' }}>
                  No reviews yet — finish an encounter to see your AI feedback here.
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {history.slice(0, 6).map((r) => {
                  const color = VERDICT_COLOR[r.verdict];
                  const bg = VERDICT_BG[r.verdict];
                  return (
                    <div
                      key={r.id}
                      className="tap"
                      onClick={() => store.viewEvalHistory(r.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        padding: '10px 14px',
                        background: 'var(--bg)',
                        border: '1.5px solid var(--line)',
                        borderRadius: 16,
                        cursor: 'pointer',
                        transition: 'all 150ms ease',
                      }}
                    >
                      <div style={{
                        width: 10, height: 10, borderRadius: '50%',
                        background: color, flexShrink: 0,
                        boxShadow: `0 0 8px ${color}`,
                      }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {r.caseName} <span style={{ fontWeight: 600, color: 'var(--ink-soft)' }}>· {r.caseAge}{r.caseGender}</span>
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--ink-soft)', fontWeight: 600 }}>{r.diagnosisLabel}</div>
                      </div>
                      <span style={{ background: bg, border: `1.5px solid ${color}`, borderRadius: 'var(--r-pill)', padding: '3px 10px', fontSize: 10, fontWeight: 800, color: 'var(--ink)', whiteSpace: 'nowrap' }}>
                        {VERDICT_LABEL[r.verdict]}
                      </span>
                      <span style={{ fontSize: 11, color: 'var(--ink-soft)', fontWeight: 700, whiteSpace: 'nowrap' }}>
                        {relativeDate(r.savedAt)}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm(`Delete review for ${r.caseName}?`)) onDelete(r.id);
                        }}
                        style={{
                          background: 'transparent', border: 'none',
                          fontSize: 14, fontWeight: 800, color: 'var(--ink-soft)',
                          cursor: 'pointer', padding: 4, fontFamily: 'inherit',
                          flexShrink: 0,
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT COLUMN ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, position: 'sticky', top: 20 }}>

          {/* Stats tiles */}
          <div
            style={{
              background: 'white',
              borderRadius: 'var(--r-xl)',
              padding: 24,
              boxShadow: '0 4px 20px rgba(26,26,46,0.06)',
              border: '1.5px solid var(--line)',
            }}
          >
            <div style={{ fontWeight: 900, fontSize: 14, color: 'var(--ink)', marginBottom: 16, fontFamily: "'Nunito', sans-serif" }}>
              📊 Your Clinical Record
            </div>
            <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
              <StatPill
                value={stats.count > 0 ? String(stats.count) : '—'}
                label="Cases Done"
                emoji="🏥"
              />
              <StatPill
                value={stats.count > 0 ? stats.avgRating.toFixed(1) : '—'}
                label="Avg Rating"
                emoji="⭐"
              />
            </div>

            {/* Weakest domain highlight */}
            <div
              style={{
                background: stats.weakest ? 'var(--bg-soft)' : 'var(--bg)',
                borderRadius: 18,
                padding: '16px 18px',
                border: '1.5px solid var(--line)',
              }}
            >
              <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--ink-soft)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
                Focus Area
              </div>
              <div style={{ fontWeight: 900, fontSize: 18, color: 'var(--ink)', marginBottom: 10, fontFamily: "'Nunito', sans-serif" }}>
                {stats.weakest ? `${stats.weakest.emoji} ${stats.weakest.label}` : '— No reviews yet'}
              </div>
              {stats.weakest && (
                <>
                  <div style={{
                    height: 12, background: 'var(--line)',
                    borderRadius: 'var(--r-pill)', overflow: 'hidden', marginBottom: 6,
                  }}>
                    <div style={{
                      height: '100%', width: `${stats.weakest.pct}%`,
                      background: stats.weakest.color,
                      borderRadius: 'var(--r-pill)',
                      transition: 'width 0.7s cubic-bezier(0.4, 0, 0.2, 1)',
                    }} />
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-soft)' }}>
                    {stats.weakest.pct}% average · needs practice
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Domain progress */}
          <div
            style={{
              background: 'white',
              borderRadius: 'var(--r-xl)',
              padding: 24,
              boxShadow: '0 4px 20px rgba(26,26,46,0.06)',
              border: '1.5px solid var(--line)',
            }}
          >
            <div style={{ fontWeight: 900, fontSize: 14, color: 'var(--ink)', marginBottom: 16, fontFamily: "'Nunito', sans-serif" }}>
              🎯 Domain Progress
            </div>

            {stats.count === 0 ? (
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink-soft)', fontStyle: 'italic', textAlign: 'center', padding: '12px 0' }}>
                Domain breakdown unlocks after your first AI review.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {stats.domains.map((d) => (
                  <div key={d.label}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 800, marginBottom: 7 }}>
                      <span style={{ color: 'var(--ink)' }}>{d.emoji} {d.label}</span>
                      <span style={{ color: d.color, fontWeight: 900 }}>{d.pct}%</span>
                    </div>
                    <div style={{ height: 12, background: d.lt, borderRadius: 'var(--r-pill)', overflow: 'hidden', border: '1.5px solid var(--line)' }}>
                      <div style={{
                        height: '100%', width: `${d.pct}%`,
                        background: d.color,
                        borderRadius: 'var(--r-pill)',
                        transition: 'width 0.7s cubic-bezier(0.4, 0, 0.2, 1)',
                      }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Streak card */}
          <div
            style={{
              background: stats.streakDays > 0
                ? 'linear-gradient(135deg, var(--mint-lt) 0%, var(--sky-lt) 100%)'
                : 'var(--bg-soft)',
              borderRadius: 'var(--r-xl)',
              padding: 20,
              border: '1.5px solid var(--line)',
              boxShadow: stats.streakDays > 0 ? '0 4px 20px rgba(78,205,196,0.18)' : 'none',
              display: 'flex',
              alignItems: 'center',
              gap: 16,
            }}
          >
            <div style={{ fontSize: 44 }} className="floaty">
              {stats.streakDays >= 7 ? '🏆' : stats.streakDays >= 3 ? '🔥' : stats.streakDays >= 1 ? '⚡' : '📚'}
            </div>
            <div>
              <div style={{ fontWeight: 900, fontSize: 16, color: 'var(--ink)', fontFamily: "'Nunito', sans-serif" }}>
                {stats.streakDays === 0 ? 'No streak yet' : `${stats.streakDays}-day streak!`}
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-2)', marginTop: 3 }}>
                {stats.streakDays === 0
                  ? 'Finish your first case to start a streak.'
                  : 'One more case today keeps it alive!'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
