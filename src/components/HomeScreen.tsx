import { useEffect, useState } from 'react';
import { TopBar, Doodle } from './primitives';
import { Mascot } from './mascots';
import { store } from '../game/store';
import { soundSystem } from '../utils/audioSystem';
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
        background: '#ffffff',
        borderRadius: 'var(--r-md)',
        padding: '16px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        border: '4px solid #151B3D',
        boxShadow: '4px 4px 0px #151B3D',
        flex: 1,
        minWidth: 0,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Decorative top strip */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 6, background: 'var(--peach)' }} />
      <div style={{ fontSize: 24, marginTop: 4 }}>{emoji}</div>
      <div style={{ fontWeight: 800, fontSize: 32, lineHeight: 1, color: '#151B3D', fontFamily: "'Fredoka', sans-serif" }}>
        {value}
      </div>
      <div style={{ fontSize: 11, fontWeight: 800, color: '#151B3D', textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.85 }}>
        {label}
      </div>
    </div>
  );
}

export function HomeScreen() {
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
          padding: '24px 24px 60px',
          maxWidth: 1200,
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 32,
        }}
      >
        {/* ─── REDESIGNED HERO: GAME WORLD CONSULTATION ROOM ─── */}
        <div
          className="popin"
          style={{
            background: 'var(--butter-lt)',
            border: '4px solid #151B3D',
            borderRadius: 'var(--r-xl)',
            boxShadow: '6px 6px 0px #151B3D',
            position: 'relative',
            padding: '40px 48px',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            minHeight: 340,
          }}
        >
          {/* Environment details (Clouds, trees, medical icons, clinic building) */}
          <div style={{ position: 'absolute', top: '15%', left: '4%', opacity: 0.8 }} className="drift">
            <Doodle kind="cloud" size={70} color="#ffffff" />
          </div>
          <div style={{ position: 'absolute', top: '22%', right: '35%', opacity: 0.6 }} className="drift">
            <Doodle kind="cloud" size={54} color="#ffffff" />
          </div>
          <div style={{ position: 'absolute', bottom: '4%', left: '30%', opacity: 0.2 }}>
            {/* Cute mini vector clinic building on base */}
            <svg width="60" height="60" viewBox="0 0 100 100" fill="none">
              <rect x="10" y="30" width="80" height="70" rx="10" fill="#ffffff" stroke="#151B3D" strokeWidth="4" />
              <rect x="35" y="10" width="30" height="20" rx="5" fill="#4ECDC4" stroke="#151B3D" strokeWidth="4" />
              <rect x="42" y="50" width="16" height="50" fill="#FF8A5B" stroke="#151B3D" strokeWidth="4" />
            </svg>
          </div>
          
          {/* Floating Game World Doodles */}
          <div style={{ position: 'absolute', top: '12%', left: '42%', opacity: 0.85 }} className="wobble">
            <Doodle kind="pill" size={40} color="var(--rose)" />
          </div>
          <div style={{ position: 'absolute', bottom: '15%', left: '5%', opacity: 0.85 }} className="floaty">
            <Doodle kind="stetho" size={44} color="var(--mint)" />
          </div>
          <div style={{ position: 'absolute', top: '45%', right: '42%', opacity: 0.85 }} className="wobble">
            <Doodle kind="heart" size={38} color="var(--coral)" />
          </div>
          <div style={{ position: 'absolute', top: '8%', right: '8%', opacity: 0.85 }} className="floaty">
            <Doodle kind="star" size={36} color="var(--butter)" />
          </div>

          <div
            style={{
              display: 'flex',
              width: '100%',
              justifyContent: 'space-between',
              alignItems: 'center',
              zIndex: 5,
              flexWrap: 'wrap-reverse',
              gap: 28,
            }}
          >
            {/* Left side info */}
            <div style={{ flex: '1.2', minWidth: 320 }}>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  background: 'var(--peach)',
                  border: '3px solid #151B3D',
                  borderRadius: 'var(--r-pill)',
                  padding: '6px 16px',
                  fontFamily: "'Fredoka', sans-serif",
                  fontWeight: 800,
                  fontSize: 13,
                  color: 'white',
                  marginBottom: 16,
                  boxShadow: '2px 2px 0px #151B3D',
                }}
              >
                {stats.streakDays > 0 ? `🔥 ${stats.streakDays}-DAY CLINICAL STREAK!` : '👋 WELCOME TO THE CLINIC'}
              </div>
              
              <h1
                style={{
                  fontSize: 'clamp(36px, 5vw, 48px)',
                  lineHeight: 1.05,
                  fontFamily: "'Fredoka', sans-serif",
                  fontWeight: 850,
                  color: '#151B3D',
                  marginBottom: 14,
                  textShadow: '1px 1px 0px #ffffff',
                }}
              >
                {stats.count === 0 ? "Ready for your next patient?" : "Good to see you, Doctor!"}
              </h1>
              
              <p
                style={{
                  fontSize: 16,
                  color: '#151B3D',
                  fontWeight: 750,
                  lineHeight: 1.6,
                  maxWidth: 440,
                  margin: '0 0 24px',
                }}
              >
                Step through the polyclinic doors to meet your simulated patient cases. You can talk to them out loud, order diagnostic tests, and get real Attending critiques!
              </p>

              <button
                type="button"
                className="btn-plush primary breathe btn-toy"
                style={{ 
                  fontSize: 18, 
                  padding: '16px 40px', 
                  fontFamily: "'Fredoka', sans-serif",
                  background: 'var(--mint)',
                  color: '#ffffff',
                }}
                onMouseEnter={(e) => soundSystem.playHover(e.currentTarget)}
                onClick={() => {
                  soundSystem.playClick();
                  store.setScreen('mode');
                }}
              >
                🏥 Start Clinic
              </button>
            </div>

            {/* Right side GP Doctor Mascot beside Patient (Occupies at least 60% of layout width in display spacing) */}
            <div 
              style={{ 
                flex: '1.8', 
                display: 'flex', 
                alignItems: 'flex-end', 
                justifyContent: 'center',
                gap: 0,
                position: 'relative',
                height: 250,
              }}
            >
              {/* Doctor speech bubble */}
              <div 
                style={{ 
                  position: 'absolute', 
                  top: -24, 
                  right: '30%', 
                  zIndex: 10,
                  fontFamily: "'Fredoka', sans-serif",
                  background: '#ffffff',
                  border: '3px solid #151B3D',
                  borderRadius: '20px',
                  padding: '8px 16px',
                  boxShadow: '3px 3px 0px #151B3D',
                  fontWeight: 800,
                  fontSize: 14,
                  color: '#151B3D',
                  whiteSpace: 'nowrap',
                }}
              >
                Ready for your next patient?
                <div style={{ position: 'absolute', bottom: -10, right: 30, width: 0, height: 0, borderLeft: '8px solid transparent', borderRight: '8px solid transparent', borderTop: '10px solid #151B3D' }} />
                <div style={{ position: 'absolute', bottom: -7, right: 31, width: 0, height: 0, borderLeft: '7px solid transparent', borderRight: '7px solid transparent', borderTop: '8px solid #ffffff' }} />
              </div>

              {/* GPMascot */}
              <div style={{ transform: 'scale(1.25)', transformOrigin: 'bottom center', zIndex: 3 }}>
                <Mascot name="gp" size={170} />
              </div>

              {/* Patient Mascot (Propeller-hat child is super cute!) */}
              <div style={{ transform: 'scale(1.1) translateX(-20px)', transformOrigin: 'bottom center', zIndex: 2, filter: 'brightness(0.98)' }}>
                <Mascot name="child" size={150} mood="happy" />
              </div>
            </div>
          </div>
        </div>

        {/* ─── TWO COLUMN STATS & LOGS GRID ─── */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1.25fr 1fr',
            gap: 28,
            alignItems: 'start',
          }}
        >
          {/* ── LEFT COLUMN: RECENT HISTORY ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Recent cases card */}
            {/* Recent cases card */}
            <div
              style={{
                background: 'white',
                borderRadius: 'var(--r-xl)',
                padding: '36px 28px 28px',
                boxShadow: 'var(--shadow-md)',
                border: '4px solid #151B3D',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {/* Colorful top header strip */}
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 12, background: 'var(--peach)', borderBottom: '4px solid #151B3D' }} />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, marginTop: 8 }}>
                <div style={{ fontWeight: 850, fontSize: 18, color: '#151B3D', fontFamily: "'Fredoka', sans-serif" }}>
                  📚 Your Case Portfolio
                </div>
                <span
                  style={{ fontSize: 14, fontWeight: 800, color: 'var(--mint-deep)', cursor: 'pointer', fontFamily: "'Fredoka', sans-serif" }}
                  onMouseEnter={(e) => soundSystem.playHover(e.currentTarget)}
                  onClick={() => {
                    soundSystem.playClick();
                    store.setScreen('history');
                  }}
                >
                  See all →
                </span>
              </div>

              {history.length === 0 ? (
                <div
                  style={{
                    background: 'var(--bg-soft)',
                    borderRadius: 24,
                    padding: '40px 24px',
                    textAlign: 'center',
                    border: '3px dashed #151B3D',
                  }}
                >
                  <div style={{ fontSize: 48, marginBottom: 12 }}>🩺</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: '#151B3D', fontFamily: "'Fredoka', sans-serif" }}>
                    No reviews in your locker yet!
                  </div>
                  <p style={{ fontSize: 14, color: '#151B3D', margin: '6px 0 0', fontWeight: 700 }}>
                    Your clinical scorecard will be saved here after your first consultation!
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {history.slice(0, 5).map((r) => {
                    const color = VERDICT_COLOR[r.verdict];
                    const bg = VERDICT_BG[r.verdict];
                    return (
                      <div
                        key={r.id}
                        className="tap"
                        onMouseEnter={(e) => soundSystem.playCardHover(e.currentTarget)}
                        onClick={() => {
                          soundSystem.playClick();
                          store.viewEvalHistory(r.id);
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 14,
                          padding: '14px 18px',
                          background: '#ffffff',
                          border: '3px solid #151B3D',
                          borderRadius: 'var(--r-md)',
                          cursor: 'pointer',
                          boxShadow: '3px 3px 0px #151B3D',
                          transition: 'all 150ms ease',
                        }}
                      >
                        <div style={{
                          width: 14, height: 14, borderRadius: '50%',
                          background: color, flexShrink: 0,
                          border: '2.5px solid #151B3D',
                        }} />
                        
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 800, fontSize: 16, color: '#151B3D', fontFamily: "'Fredoka', sans-serif", whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {r.caseName} <span style={{ fontWeight: 800, color: '#151B3D', opacity: 0.8, fontSize: 13 }}>· {r.caseAge}{r.caseGender}</span>
                          </div>
                          <div style={{ fontSize: 13, color: '#151B3D', opacity: 0.85, fontWeight: 800 }}>{r.diagnosisLabel}</div>
                        </div>

                        <span 
                          style={{ 
                            background: bg, 
                            border: `2.5px solid #151B3D`, 
                            borderRadius: 'var(--r-pill)', 
                            padding: '4px 12px', 
                            fontSize: 13, 
                            fontWeight: 800, 
                            color: '#151B3D', 
                            whiteSpace: 'nowrap',
                            boxShadow: '1.5px 1.5px 0px #151B3D',
                            fontFamily: "'Fredoka', sans-serif",
                          }}
                        >
                          {VERDICT_LABEL[r.verdict]}
                        </span>
                        
                        <span style={{ fontSize: 13, color: '#151B3D', opacity: 0.8, fontWeight: 800, whiteSpace: 'nowrap' }}>
                          {relativeDate(r.savedAt)}
                        </span>
                        
                        <button
                          type="button"
                          onMouseEnter={(e) => soundSystem.playHover(e.currentTarget)}
                          onClick={(e) => {
                            e.stopPropagation();
                            soundSystem.playClick();
                            if (window.confirm(`Delete review for ${r.caseName}?`)) onDelete(r.id);
                          }}
                          style={{
                            background: 'transparent', 
                            border: 'none',
                            fontSize: 16, 
                            fontWeight: 900, 
                            color: '#151B3D',
                            cursor: 'pointer', 
                            padding: 4, 
                            fontFamily: 'inherit',
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

          {/* ── RIGHT COLUMN: STATS PANELS ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Stats block */}
            <div
              style={{
                background: 'white',
                borderRadius: 'var(--r-xl)',
                padding: '36px 24px 24px',
                boxShadow: 'var(--shadow-md)',
                border: '4px solid #151B3D',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {/* Colorful top header strip */}
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 12, background: 'var(--lav)', borderBottom: '4px solid #151B3D' }} />

              <div style={{ fontWeight: 850, fontSize: 18, color: '#151B3D', marginBottom: 18, marginTop: 8, fontFamily: "'Fredoka', sans-serif" }}>
                📊 Clinician Report Card
              </div>
              <div style={{ display: 'flex', gap: 14, marginBottom: 18 }}>
                <StatPill
                  value={stats.count > 0 ? String(stats.count) : '—'}
                  label="Cases Managed"
                  emoji="🏥"
                />
                <StatPill
                  value={stats.count > 0 ? stats.avgRating.toFixed(1) : '—'}
                  label="Attending Score"
                  emoji="⭐"
                />
              </div>

              {/* Weakest domain highlight */}
              <div
                style={{
                  background: stats.weakest ? 'var(--bg-soft)' : 'var(--cream)',
                  borderRadius: 'var(--r-md)',
                  padding: '16px 20px',
                  border: '3px solid #151B3D',
                  boxShadow: '3px 3px 0px #151B3D',
                }}
              >
                <div style={{ fontSize: 11, fontWeight: 900, color: '#151B3D', opacity: 0.8, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8, fontFamily: "'Fredoka', sans-serif" }}>
                  Focus Area Required
                </div>
                <div style={{ fontWeight: 800, fontSize: 18, color: '#151B3D', marginBottom: 12, fontFamily: "'Fredoka', sans-serif" }}>
                  {stats.weakest ? `${stats.weakest.emoji} ${stats.weakest.label}` : '— Portfolio Empty'}
                </div>
                {stats.weakest && (
                  <>
                    <div style={{
                      height: 16, background: '#ffffff',
                      borderRadius: 'var(--r-pill)', overflow: 'hidden', marginBottom: 8,
                      border: '3px solid #151B3D',
                    }}>
                      <div style={{
                        height: '100%', width: `${stats.weakest.pct}%`,
                        background: stats.weakest.color,
                        borderRadius: 'var(--r-pill)',
                        borderRight: '2px solid #151B3D',
                      }} />
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: '#151B3D', opacity: 0.8, fontFamily: "'Fredoka', sans-serif" }}>
                      {stats.weakest.pct}% average performance · needs practice
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
                padding: '36px 24px 24px',
                boxShadow: 'var(--shadow-md)',
                border: '4px solid #151B3D',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {/* Colorful top header strip */}
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 12, background: 'var(--butter)', borderBottom: '4px solid #151B3D' }} />

              <div style={{ fontWeight: 850, fontSize: 18, color: '#151B3D', marginBottom: 18, marginTop: 8, fontFamily: "'Fredoka', sans-serif" }}>
                🎯 Core Skill Metrics
              </div>

              {stats.count === 0 ? (
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink-soft)', fontStyle: 'italic', textAlign: 'center', padding: '12px 0' }}>
                  Clinical skill meters will unlock after your first Attending review.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {stats.domains.map((d) => (
                    <div key={d.label}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, fontWeight: 800, marginBottom: 6, fontFamily: "'Fredoka', sans-serif" }}>
                        <span style={{ color: 'var(--ink)' }}>{d.emoji} {d.label}</span>
                        <span style={{ color: d.color, fontWeight: 800 }}>{d.pct}%</span>
                      </div>
                      <div style={{ height: 16, background: '#ffffff', borderRadius: 'var(--r-pill)', overflow: 'hidden', border: '3px solid #151B3D' }}>
                        <div style={{
                          height: '100%', width: `${d.pct}%`,
                          background: d.color,
                          borderRadius: 'var(--r-pill)',
                          borderRight: '2px solid #151B3D',
                        }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
