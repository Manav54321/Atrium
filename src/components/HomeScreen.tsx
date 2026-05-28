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
  'clear-fail': 'var(--rose)',
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

interface StatProps {
  big: string;
  sub: string;
  out?: string;
}

function Stat({ big, sub, out }: StatProps) {
  return (
    <div
      style={{
        background: '#ffffff',
        border: 'var(--stroke) solid var(--line)',
        borderRadius: 14,
        padding: 12,
        boxShadow: 'var(--plush-tiny)',
      }}
    >
      <div style={{ fontWeight: 900, fontSize: 32, lineHeight: 1, color: 'var(--ink)' }}>
        {big}
        <span style={{ fontSize: 14, color: 'var(--ink-2)' }}>{out}</span>
      </div>
      <div
        style={{
          fontSize: 11,
          fontWeight: 800,
          color: 'var(--ink-2)',
          textTransform: 'uppercase',
          letterSpacing: '.06em',
          marginTop: 4,
        }}
      >
        {sub}
      </div>
    </div>
  );
}

const VERDICT_SCORE: Record<EvalHistoryEntry['verdict'], number> = {
  'clear-fail': 1,
  borderline: 2,
  satisfactory: 3,
  good: 4,
  excellent: 5,
};

const DOMAIN_META = [
  { key: 'data_gathering' as const, label: 'Data Gathering', color: 'var(--peach)', deep: 'var(--peach-deep)' },
  { key: 'clinical_management' as const, label: 'Clinical Management', color: 'var(--mint)', deep: 'var(--mint-deep)' },
  { key: 'interpersonal' as const, label: 'Interpersonal', color: 'var(--sky)', deep: 'var(--sky-deep)' },
];

interface TrainingStats {
  count: number;
  avgRating: number; // 0–5
  domains: { key: 'data_gathering' | 'clinical_management' | 'interpersonal'; label: string; pct: number; color: string; deep: string }[];
  weakest: { label: string; pct: number; deep: string } | null;
  streakDays: number;
}

function computeStats(history: EvalHistoryEntry[]): TrainingStats {
  const count = history.length;
  if (count === 0) {
    return {
      count: 0,
      avgRating: 0,
      domains: DOMAIN_META.map((d) => ({ ...d, pct: 0 })),
      weakest: null,
      streakDays: 0,
    };
  }

  const avgRating =
    history.reduce((sum, e) => sum + (VERDICT_SCORE[e.verdict] ?? 0), 0) / count;

  const domains = DOMAIN_META.map((d) => {
    const ratios = history
      .map((e) => {
        const ds = e.evaluation.domain_scores[d.key];
        return ds && ds.max > 0 ? ds.raw / ds.max : null;
      })
      .filter((r): r is number => r !== null);
    const pct = ratios.length > 0
      ? Math.round((ratios.reduce((a, b) => a + b, 0) / ratios.length) * 100)
      : 0;
    return { ...d, pct };
  });

  const weakestDomain = domains.reduce((min, d) => (d.pct < min.pct ? d : min), domains[0]);
  const weakest = { label: weakestDomain.label, pct: weakestDomain.pct, deep: weakestDomain.deep };

  // Streak: count consecutive days (today, yesterday, …) with at least one
  // saved review. Stops at the first gap.
  const days = new Set(
    history.map((e) => new Date(e.savedAt).toISOString().slice(0, 10)),
  );
  let streakDays = 0;
  const cursor = new Date();
  for (;;) {
    const key = cursor.toISOString().slice(0, 10);
    if (days.has(key)) {
      streakDays += 1;
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
  }

  return { count, avgRating, domains, weakest, streakDays };
}

export function HomeScreen() {
  const tweaks = useTweaks();
  const [history, setHistory] = useState<EvalHistoryEntry[]>([]);

  // Load on mount + whenever the screen is shown so it stays current.
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
    <div className="screen" style={{ background: 'var(--cream)' }}>
      <TopBar here={0} steps={['Profile']} />

      <div
        style={{
          padding: '28px 36px',
          minHeight: 'calc(100vh - 67px)',
          display: 'grid',
          gridTemplateColumns: '1.4fr 1fr',
          gap: 24,
        }}
      >
        {/* LEFT — desk */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--ink-2)' }}>
              {stats.count === 0 ? 'Day one' : 'Welcome back'}
            </div>
            <h1 style={{ fontSize: 44, lineHeight: 1.05, marginTop: 4 }}>
              {stats.count === 0 ? 'Ready when you are.' : 'Welcome back, doctor.'}
            </h1>
            <div style={{ fontSize: 16, color: 'var(--ink-2)', fontWeight: 600, marginTop: 6 }}>
              {stats.count === 0
                ? 'Pick a polyclinic and your first case walks in. Your training log starts filling in after that.'
                : 'Your training log is updating with every case you finish.'}
            </div>
          </div>

          {stats.count === 0 ? (
            <div
              className="plush-lg"
              style={{
                background: '#ffffff',
                padding: 18,
                position: 'relative',
                transform: 'rotate(-0.6deg)',
              }}
            >
              <div style={{ position: 'absolute', top: -12, left: 22 }} className="chip butter">
                ★ first case
              </div>
              <div
                style={{
                  display: 'flex',
                  gap: 18,
                  alignItems: 'center',
                  background: 'var(--cream-2)',
                  borderRadius: 18,
                  border: 'var(--stroke) dashed var(--line)',
                  padding: 16,
                }}
              >
                <div className="floaty" style={{ opacity: 0.6 }}>
                  <PatientFace style={tweaks.avatarStyle} skin="#E8B68F" hair="#3B2A1F" size={120} mood="neutral" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 900, fontSize: 22 }}>No case picked yet</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink-2)', marginTop: 2 }}>
                    Choose a polyclinic — the next patient on the bench will walk straight in.
                  </div>
                </div>
                <button
                  type="button"
                  className="btn-plush primary"
                  style={{ fontSize: 15, padding: '14px 18px' }}
                  onClick={() => store.setScreen('mode')}
                >
                  Start →
                </button>
              </div>
            </div>
          ) : (
            <div className="plush-lg" style={{ background: '#ffffff', padding: 18, position: 'relative', transform: 'rotate(-0.6deg)' }}>
              <div style={{ position: 'absolute', top: -12, left: 22 }} className="chip butter">
                ★ pick up where you left off
              </div>
              <div
                style={{
                  display: 'flex',
                  gap: 18,
                  alignItems: 'center',
                  background: 'var(--cream-2)',
                  borderRadius: 18,
                  border: 'var(--stroke) solid var(--line)',
                  padding: 16,
                }}
              >
                <div className="floaty">
                  <PatientFace
                    style={tweaks.avatarStyle}
                    skin={history[0].caseGender === 'F' ? '#F0C4A8' : '#E8B68F'}
                    hair="#3B2A1F"
                    size={120}
                    mood="neutral"
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 900, fontSize: 22 }}>
                    {history[0].caseName}, {history[0].caseAge}
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink-2)', marginTop: 2 }}>
                    {history[0].diagnosisLabel}
                  </div>
                  <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
                    <span className="chip" style={{ background: VERDICT_COLOR[history[0].verdict] }}>
                      {VERDICT_LABEL[history[0].verdict]}
                    </span>
                    <span className="chip">last review · {relativeDate(history[0].savedAt)}</span>
                    {stats.weakest && (
                      <span className="chip butter">focus · {stats.weakest.label.toLowerCase()}</span>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  className="btn-plush primary"
                  style={{ fontSize: 15, padding: '14px 18px' }}
                  onClick={() => store.viewEvalHistory(history[0].id)}
                >
                  Review →
                </button>
              </div>
            </div>
          )}

          <button
            type="button"
            className="btn-plush mint"
            style={{ fontSize: 22, padding: '18px 0', alignSelf: 'stretch' }}
            onClick={() => store.setScreen('mode')}
          >
            ▶ Start a session
          </button>

          <div className="plush" style={{ padding: 16 }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
                marginBottom: 10,
              }}
            >
              <div
                style={{
                  fontWeight: 800,
                  fontSize: 12,
                  color: 'var(--ink-2)',
                  letterSpacing: '.06em',
                  textTransform: 'uppercase',
                }}
              >
                RECENT CASES
              </div>
              <span
                style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-2)', cursor: 'pointer' }}
                onClick={() => store.setScreen('history')}
              >
                see all →
              </span>
            </div>
            {history.length === 0 ? (
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: 'var(--ink-2)',
                  background: 'var(--cream)',
                  border: '2.5px dashed rgba(43,30,22,0.2)',
                  borderRadius: 12,
                  padding: '14px 16px',
                  textAlign: 'center',
                }}
              >
                No reviews yet — finish an encounter to see your AI feedback here.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {history.slice(0, 6).map((r) => {
                  const color = VERDICT_COLOR[r.verdict];
                  return (
                    <div
                      key={r.id}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '40px 1fr 110px 80px 28px',
                        gap: 12,
                        alignItems: 'center',
                        padding: '8px 12px',
                        background: '#ffffff',
                        border: 'var(--stroke) solid var(--line)',
                        borderRadius: 16,
                        boxShadow: 'var(--plush-tiny)',
                      }}
                    >
                      <div
                        className="tap"
                        onClick={() => store.viewEvalHistory(r.id)}
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: '50%',
                          background: color,
                          border: '2.5px solid var(--line)',
                          boxShadow: '0 2px 0 var(--line)',
                          cursor: 'pointer',
                        }}
                      />
                      <div className="tap" onClick={() => store.viewEvalHistory(r.id)} style={{ cursor: 'pointer' }}>
                        <div style={{ fontWeight: 800, fontSize: 14 }}>
                          {r.caseName} <span style={{ fontWeight: 600, color: 'var(--ink-2)' }}>· {r.caseAge}{r.caseGender}</span>
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--ink-2)', fontWeight: 700 }}>
                          {r.diagnosisLabel}
                        </div>
                      </div>
                      <span
                        className="tap chip"
                        onClick={() => store.viewEvalHistory(r.id)}
                        style={{ background: color, fontSize: 11, cursor: 'pointer' }}
                      >
                        {VERDICT_LABEL[r.verdict]}
                      </span>
                      <span style={{ fontSize: 12, color: 'var(--ink-2)', fontWeight: 700 }}>
                        {relativeDate(r.savedAt)}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm(`Delete review for ${r.caseName}?`)) onDelete(r.id);
                        }}
                        title="Delete this review"
                        style={{
                          background: 'transparent',
                          border: 'none',
                          fontSize: 16,
                          fontWeight: 800,
                          color: 'var(--ink-2)',
                          cursor: 'pointer',
                          padding: 4,
                          fontFamily: 'inherit',
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

        {/* RIGHT — stats */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="plush" style={{ padding: 16, background: '#ffffff' }}>
            <div
              style={{
                fontWeight: 800,
                fontSize: 11,
                color: 'var(--ink-2)',
                letterSpacing: '.06em',
                textTransform: 'uppercase',
                marginBottom: 10,
              }}
            >
              YOUR TRAINING
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <Stat big={stats.count > 0 ? String(stats.count) : '—'} sub="cases done" />
              <Stat
                big={stats.count > 0 ? stats.avgRating.toFixed(1) : '—'}
                sub="avg rating"
                out={stats.count > 0 ? ' / 5' : ''}
              />
            </div>
            <div
              style={{
                marginTop: 12,
                background: 'var(--cream-2)',
                border: 'var(--stroke) solid var(--line)',
                borderRadius: 14,
                padding: 12,
                boxShadow: 'var(--plush-tiny)',
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  color: 'var(--ink-2)',
                  textTransform: 'uppercase',
                  letterSpacing: '.06em',
                }}
              >
                WEAKEST DOMAIN
              </div>
              <div style={{ fontSize: 18, fontWeight: 900, marginTop: 2 }}>
                {stats.weakest ? stats.weakest.label : '—'}
              </div>
              <div
                style={{
                  marginTop: 8,
                  height: 12,
                  background: 'var(--cream)',
                  borderRadius: 8,
                  border: '2px solid var(--line)',
                  overflow: 'hidden',
                  position: 'relative',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    width: `${stats.weakest?.pct ?? 0}%`,
                    background: stats.weakest?.deep ?? 'var(--peach-deep)',
                  }}
                />
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginTop: 6,
                  fontSize: 11,
                  fontWeight: 700,
                  color: 'var(--ink-2)',
                }}
              >
                <span>
                  {stats.weakest ? `${stats.weakest.label} · ${stats.weakest.pct}%` : 'No reviews yet'}
                </span>
                <span>focus area</span>
              </div>
            </div>
          </div>

          <div className="plush" style={{ padding: 16 }}>
            <div
              style={{
                fontWeight: 800,
                fontSize: 11,
                color: 'var(--ink-2)',
                letterSpacing: '.06em',
                textTransform: 'uppercase',
                marginBottom: 10,
              }}
            >
              DOMAIN PROGRESS
            </div>
            {stats.count === 0 ? (
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-2)' }}>
                Domain breakdown unlocks after your first AI review.
              </div>
            ) : (
              stats.domains.map((d) => (
                <div key={d.label} style={{ marginBottom: 10 }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: 12,
                      fontWeight: 800,
                      marginBottom: 4,
                    }}
                  >
                    <span>{d.label}</span>
                    <span>{d.pct}%</span>
                  </div>
                  <div
                    style={{
                      height: 16,
                      background: 'var(--cream)',
                      borderRadius: 'var(--r-pill)',
                      border: 'var(--stroke) solid var(--line)',
                      overflow: 'hidden',
                      position: 'relative',
                    }}
                  >
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        width: `${d.pct}%`,
                        background: d.color,
                        borderRight: 'var(--stroke) solid var(--line)',
                      }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>

          <div
            className="plush"
            style={{ padding: 14, background: 'var(--mint)', display: 'flex', alignItems: 'center', gap: 12 }}
          >
            <div style={{ fontSize: 36 }} className="floaty">
              📚
            </div>
            <div>
              <div style={{ fontWeight: 900, fontSize: 14 }}>
                {stats.streakDays === 0
                  ? 'Streak: —'
                  : `Streak: ${stats.streakDays} ${stats.streakDays === 1 ? 'day' : 'days'}`}
              </div>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-2)' }}>
                {stats.streakDays === 0
                  ? 'Finish your first case to start a streak.'
                  : 'One more case today keeps it alive.'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
