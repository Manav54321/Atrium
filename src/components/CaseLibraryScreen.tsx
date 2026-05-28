import { useMemo, useState } from 'react';
import { PatientFace, TopBar } from './primitives';
import { CASES, CONDITION_COLORS, type Case } from '../data/cases';
import { CLINIC_IDS, CLINIC_LABELS, type ClinicId } from '../game/clinic';
import { store, useTweaks } from '../game/store';

const CLINIC_ICON: Record<ClinicId, string> = {
  'all-specialties': '🌈',
  'internal-medicine': '🩺',
  cardiology: '❤️',
  neurology: '🧠',
  neurosurgery: '🧠',
  dermatology: '🌿',
  endocrinology: '🍯',
  gastroenterology: '🍽️',
  pulmonology: '🫁',
  nephrology: '💧',
  rheumatology: '🦴',
  hematology: '🩸',
  oncology: '🎗️',
  'infectious-disease': '🦠',
  'allergy-immunology': '🌼',
  psychiatry: '💭',
  obgyn: '🌷',
  urology: '💧',
  ophthalmology: '👁️',
  ent: '👂',
  orthopedics: '🦴',
  pmr: '🏃',
  pediatrics: '🧸',
  'general-surgery': '🔪',
  'cardiothoracic-vascular-surgery': '🫀',
};

interface CaseCardProps {
  c: Case;
  delay?: number;
  avatarStyle: ReturnType<typeof useTweaks>['avatarStyle'];
}

function CaseCard({ c, delay = 0, avatarStyle }: CaseCardProps) {
  const accentColor = CONDITION_COLORS[c.cond] ?? 'var(--butter)';
  const isRedFlag = c.tags.some((t) => t.toLowerCase().includes('red flag'));

  return (
    <div
      className="tap popin"
      onClick={() => store.selectCase(c.id)}
      style={{ animationDelay: `${delay}s`, position: 'relative' }}
    >
      {/* Condition badge */}
      <div
        style={{
          position: 'absolute',
          top: -10,
          left: 14,
          zIndex: 10,
          background: 'white',
          border: `2px solid ${accentColor}`,
          borderRadius: 'var(--r-pill)',
          padding: '3px 10px',
          fontSize: 9,
          fontWeight: 900,
          color: 'var(--ink)',
          fontFamily: "'Nunito', sans-serif",
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          boxShadow: 'var(--shadow-xs)',
        }}
      >
        {c.cond}
      </div>

      {/* Attempted score */}
      {c.attempted && c.score && (
        <div
          style={{
            position: 'absolute',
            top: -10,
            right: 14,
            zIndex: 10,
            background: 'var(--mint-lt)',
            border: '1.5px solid var(--mint)',
            borderRadius: 'var(--r-pill)',
            padding: '3px 10px',
            fontSize: 9,
            fontWeight: 900,
            color: 'var(--mint-deep)',
            fontFamily: "'Nunito', sans-serif",
            boxShadow: 'var(--shadow-xs)',
          }}
        >
          ✓ {c.score}
        </div>
      )}

      {/* Red flag marker */}
      {isRedFlag && (
        <div
          style={{
            position: 'absolute',
            top: -10,
            right: c.attempted && c.score ? 66 : 14,
            zIndex: 10,
            background: 'var(--coral-lt)',
            border: '1.5px solid var(--coral)',
            borderRadius: 'var(--r-pill)',
            padding: '3px 10px',
            fontSize: 9,
            fontWeight: 900,
            color: 'var(--coral-deep)',
            fontFamily: "'Nunito', sans-serif",
            boxShadow: 'var(--shadow-xs)',
          }}
        >
          🚩
        </div>
      )}

      <div
        style={{
          background: 'white',
          borderRadius: 24,
          border: '1.5px solid var(--line)',
          boxShadow: '0 4px 20px rgba(26,26,46,0.06)',
          overflow: 'hidden',
          position: 'relative',
          zIndex: 1,
          transition: 'all 300ms cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
      >
        {/* Colorful header zone */}
        <div
          style={{
            height: 140,
            background: `linear-gradient(160deg, ${accentColor}22 0%, ${accentColor}10 100%)`,
            borderBottom: `2.5px solid ${accentColor}`,
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div className="floaty" style={{ marginBottom: -6 }}>
            <PatientFace
              name={c.name}
              style={avatarStyle}
              skin={c.skin}
              hair={c.hair}
              size={100}
              mood={c.mood}
              accessory={c.accessory}
              gender={c.sex}
              age={c.age}
            />
          </div>
        </div>

        {/* Card body */}
        <div style={{ padding: '14px 16px 16px' }}>
          <div style={{ fontWeight: 900, fontSize: 17, lineHeight: 1.2, color: 'var(--ink)', marginBottom: 4, fontFamily: "'Nunito', sans-serif" }}>
            {c.name}
          </div>
          <div style={{ fontWeight: 700, fontSize: 11, color: 'var(--ink-soft)', marginBottom: 10 }}>
            {c.age}Y · {c.sex === 'F' ? 'Female' : 'Male'}
          </div>
          <div style={{ fontSize: 13, color: 'var(--ink-2)', minHeight: 38, lineHeight: 1.5, fontWeight: 600, fontStyle: 'italic', marginBottom: 12 }}>
            "{c.complaint}"
          </div>

          {/* Tags */}
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 8 }}>
            {c.tags.slice(0, 2).map((t) => {
              const rf = t.toLowerCase().includes('red flag');
              return (
                <span
                  key={t}
                  style={{
                    background: rf ? 'var(--coral-lt)' : 'var(--bg-soft)',
                    border: `1.5px solid ${rf ? 'var(--coral)' : 'var(--line)'}`,
                    borderRadius: 'var(--r-pill)',
                    padding: '3px 8px',
                    fontSize: 9,
                    fontWeight: 800,
                    color: rf ? 'var(--coral-deep)' : 'var(--ink-2)',
                    fontFamily: "'Nunito', sans-serif",
                    letterSpacing: '0.03em',
                  }}
                >
                  {t.toUpperCase()}
                </span>
              );
            })}
          </div>

          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--ink-soft)', display: 'flex', alignItems: 'center', gap: 4 }}>
            📖 {c.guideline.toUpperCase()}
          </div>
        </div>
      </div>
    </div>
  );
}

type ClinicFilter = ClinicId | 'all' | 'red-flag';

export function CaseLibraryScreen() {
  const tweaks = useTweaks();
  const [filter, setFilter] = useState<ClinicFilter>('all');

  const grouped = useMemo(() => {
    const map = new Map<ClinicId, Case[]>();
    for (const id of CLINIC_IDS) {
      if (id === 'all-specialties') continue;
      map.set(id, []);
    }
    for (const c of CASES) {
      const list = map.get(c.clinic);
      if (list) list.push(c);
    }
    return map;
  }, []);

  const visibleGroups = useMemo<Array<[ClinicId, Case[]]>>(() => {
    if (filter === 'red-flag') {
      const out: Array<[ClinicId, Case[]]> = [];
      for (const [clinic, list] of grouped) {
        const reds = list.filter((c) => c.tags.some((t) => t.toLowerCase().includes('red flag')));
        if (reds.length) out.push([clinic, reds]);
      }
      return out;
    }
    if (filter === 'all') {
      return Array.from(grouped.entries()).filter(([, list]) => list.length > 0);
    }
    const list = grouped.get(filter as ClinicId) ?? [];
    return list.length ? [[filter as ClinicId, list]] : [];
  }, [grouped, filter]);

  const totalVisible = visibleGroups.reduce((n, [, list]) => n + list.length, 0);

  const shuffle = () => {
    const pool = visibleGroups.flatMap(([, list]) => list);
    const fallback = pool.length > 0 ? pool : CASES;
    const pick = fallback[Math.floor(Math.random() * fallback.length)];
    store.selectCase(pick.id);
  };

  const clinicChips: Array<{ id: ClinicFilter; label: string; icon?: string }> = [
    { id: 'all', label: 'All Clinics', icon: '🌈' },
    { id: 'red-flag', label: 'Red Flag', icon: '🚩' },
    ...CLINIC_IDS.filter((id) => id !== 'all-specialties' && (grouped.get(id)?.length ?? 0) > 0).map(
      (id) => ({ id: id as ClinicFilter, label: CLINIC_LABELS[id], icon: CLINIC_ICON[id] }),
    ),
  ];

  return (
    <div className="screen" style={{ background: 'var(--bg)', overflowY: 'auto' }}>
      <TopBar here={2} steps={['Polyclinic', 'GP', 'Case']} />

      {/* Header */}
      <div
        style={{
          padding: '28px 36px 0',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 20,
          maxWidth: 1240,
          margin: '0 auto',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <button
            type="button"
            className="btn-plush ghost"
            style={{ fontSize: 13, padding: '10px 20px', fontFamily: "'Nunito', sans-serif" }}
            onClick={() => store.setScreen('gpRoom')}
          >
            ← Back
          </button>
          <div>
            <div className="chip butter" style={{ marginBottom: 8, fontSize: 12, padding: '5px 14px', fontFamily: "'Nunito', sans-serif" }}>
              📚 Case Archive
            </div>
            <h1
              style={{
                fontSize: 'clamp(28px, 3.5vw, 42px)',
                marginBottom: 4,
                fontWeight: 900,
                fontFamily: "'Nunito', sans-serif",
                letterSpacing: '-0.02em',
              }}
            >
              Clinical Catalogue
            </h1>
            <div style={{ fontWeight: 600, color: 'var(--ink-2)', fontSize: 14 }}>
              {totalVisible} case{totalVisible !== 1 ? 's' : ''} · grouped by specialty
            </div>
          </div>
        </div>
        <button
          type="button"
          className="btn-plush mint"
          style={{ fontSize: 14, padding: '13px 24px', whiteSpace: 'nowrap', fontWeight: 800, fontFamily: "'Nunito', sans-serif" }}
          onClick={shuffle}
        >
          🔀 Random Case
        </button>
      </div>

      {/* Filter chips */}
      <div
        style={{
          padding: '20px 36px 10px',
          display: 'flex',
          gap: 8,
          flexWrap: 'wrap',
          alignItems: 'center',
          maxWidth: 1240,
          margin: '0 auto',
        }}
      >
        {clinicChips.map((chip) => {
          const isActive = filter === chip.id;
          return (
            <span
              key={chip.id}
              className="tap"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                cursor: 'pointer',
                padding: '8px 16px',
                fontSize: 12,
                fontWeight: 800,
                borderRadius: 'var(--r-pill)',
                border: `2px solid ${isActive ? 'var(--mint)' : 'var(--line)'}`,
                background: isActive ? 'var(--mint-lt)' : 'white',
                color: isActive ? 'var(--mint-deep)' : 'var(--ink-2)',
                boxShadow: isActive ? '0 4px 14px rgba(78,205,196,0.2)' : 'var(--shadow-xs)',
                transition: 'all 0.2s ease',
                fontFamily: "'Nunito', sans-serif",
              }}
              onClick={() => setFilter(chip.id)}
            >
              {chip.icon && <span>{chip.icon}</span>}
              {chip.label}
            </span>
          );
        })}
      </div>

      {/* Grouped sections */}
      <div style={{ padding: '12px 36px 48px', display: 'flex', flexDirection: 'column', gap: 36, maxWidth: 1240, margin: '0 auto' }}>
        {visibleGroups.map(([clinic, list]) => (
          <section key={clinic}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                marginBottom: 18,
                paddingBottom: 14,
                borderBottom: '2px solid var(--line)',
              }}
            >
              <span
                style={{
                  width: 42, height: 42, borderRadius: '50%',
                  background: 'var(--bg-soft)',
                  border: '2px solid var(--line)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 22, flexShrink: 0,
                }}
              >
                {CLINIC_ICON[clinic] ?? '🏥'}
              </span>
              <h2 style={{ fontSize: 20, margin: 0, fontWeight: 900, color: 'var(--ink)', fontFamily: "'Nunito', sans-serif" }}>
                {CLINIC_LABELS[clinic]}
              </h2>
              <span
                style={{
                  background: 'var(--mint-lt)',
                  border: '1.5px solid var(--mint)',
                  borderRadius: 'var(--r-pill)',
                  padding: '4px 12px',
                  fontSize: 11,
                  fontWeight: 800,
                  color: 'var(--mint-deep)',
                  fontFamily: "'Nunito', sans-serif",
                }}
              >
                {list.length} case{list.length !== 1 ? 's' : ''}
              </span>
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))',
                gap: 18,
              }}
            >
              {list.map((c, i) => (
                <CaseCard key={c.id} c={c} delay={(i % 8) * 0.04} avatarStyle={tweaks.avatarStyle} />
              ))}
            </div>
          </section>
        ))}

        {visibleGroups.length === 0 && (
          <div
            style={{
              background: 'white',
              borderRadius: 'var(--r-xl)',
              padding: '40px 32px',
              textAlign: 'center',
              color: 'var(--ink-2)',
              fontWeight: 600,
              border: '2px dashed var(--line)',
            }}
          >
            <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
            <div style={{ fontWeight: 800, fontSize: 16 }}>No cases match this filter.</div>
          </div>
        )}
      </div>
    </div>
  );
}
