import { useMemo, useState } from 'react';
import { PatientFace, TopBar } from './primitives';
import { CASES, CONDITION_COLORS, type Case } from '../data/cases';
import { CLINIC_IDS, CLINIC_LABELS, type ClinicId } from '../game/clinic';
import { store, useTweaks } from '../game/store';

interface CaseCardProps {
  c: Case;
  delay?: number;
  avatarStyle: ReturnType<typeof useTweaks>['avatarStyle'];
}

function CaseCard({ c, delay = 0, avatarStyle }: CaseCardProps) {
  const bg = CONDITION_COLORS[c.cond] ?? 'var(--butter)';
  return (
    <div
      className="tap popin"
      onClick={() => store.selectCase(c.id)}
      style={{ animationDelay: `${delay}s`, position: 'relative', marginTop: 12 }}
    >
      {/* Condition label badge */}
      <div
        style={{
          position: 'absolute',
          top: -10,
          left: 14,
          zIndex: 2,
          background: 'var(--paper)',
          border: `var(--stroke) solid ${bg}`,
          borderRadius: 'var(--r-sm)',
          padding: '3px 10px',
          fontWeight: 800,
          fontSize: 10,
          color: 'var(--ink)',
          fontFamily: 'Outfit, sans-serif',
          letterSpacing: '0.05em',
        }}
      >
        {c.cond.toUpperCase()}
      </div>

      <div
        className="plush"
        style={{
          padding: 16,
          opacity: c.attempted ? 0.9 : 1,
          position: 'relative',
          overflow: 'hidden',
          background: 'var(--paper)',
          border: 'var(--stroke) solid var(--line)',
          borderRadius: 16,
        }}
      >
        {/* Attempted score badge */}
        {c.attempted && c.score && (
          <div
            className="chip mint"
            style={{
              position: 'absolute',
              top: 14,
              right: 14,
              zIndex: 3,
              fontSize: 10,
              padding: '2px 8px',
            }}
          >
            SCORE: {c.score}
          </div>
        )}

        {/* Patient portrait deck box */}
        <div
          style={{
            background: 'var(--cream-2)',
            borderRadius: 12,
            border: 'var(--stroke) solid var(--line)',
            height: 140,
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            marginBottom: 12,
            overflow: 'hidden',
            position: 'relative',
            borderBottom: `var(--stroke-thick) solid ${bg}`,
          }}
        >
          <div style={{ marginBottom: -8 }} className="floaty">
            <PatientFace
              name={c.name}
              style={avatarStyle}
              skin={c.skin}
              hair={c.hair}
              size={120}
              mood={c.mood}
              accessory={c.accessory}
              gender={c.sex}
              age={c.age}
            />
          </div>
        </div>

        <div style={{ fontWeight: 800, fontSize: 16, lineHeight: 1.2, color: 'var(--ink)' }}>{c.name}</div>
        <div
          style={{
            fontWeight: 700,
            fontSize: 11,
            color: 'var(--ink-soft)',
            marginBottom: 8,
            fontFamily: 'Outfit, sans-serif',
          }}
        >
          {c.age}Y · {c.sex === 'F' ? 'Female' : 'Male'}
        </div>
        <div
          style={{
            fontSize: 13,
            color: 'var(--ink-2)',
            minHeight: 38,
            lineHeight: 1.4,
            fontWeight: 500,
            fontStyle: 'italic',
          }}
        >
          "{c.complaint}"
        </div>

        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
          {c.tags.slice(0, 2).map((t) => {
            const isRedFlag = t.toLowerCase().includes('red flag');
            return (
              <span
                key={t}
                className={`chip ${isRedFlag ? 'rose' : ''}`}
                style={{
                  fontSize: 9,
                  padding: '2px 8px',
                }}
              >
                {t.toUpperCase()}
              </span>
            );
          })}
        </div>
        <div
          style={{
            marginTop: 10,
            fontSize: 10,
            fontWeight: 700,
            color: 'var(--ink-soft)',
            fontFamily: 'Outfit, sans-serif',
          }}
        >
          📖 {c.guideline.toUpperCase()}
        </div>
      </div>
    </div>
  );
}

type ClinicFilter = ClinicId | 'all' | 'red-flag';

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

export function CaseLibraryScreen() {
  const tweaks = useTweaks();
  const [filter, setFilter] = useState<ClinicFilter>('all');

  // Group every case by its clinic once. The grouping respects
  // CLINIC_IDS order so sections render in the same canonical order.
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

  // Apply the active filter to the grouped data so we can render it as
  // sections without having to re-group inside the JSX.
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
    { id: 'all', label: 'All clinics', icon: '🌈' },
    { id: 'red-flag', label: 'Red-flag only', icon: '🚩' },
    ...CLINIC_IDS.filter((id) => id !== 'all-specialties' && (grouped.get(id)?.length ?? 0) > 0).map(
      (id) => ({ id: id as ClinicFilter, label: CLINIC_LABELS[id], icon: CLINIC_ICON[id] }),
    ),
  ];

  return (
    <div className="screen" style={{ background: 'var(--cream)', overflowY: 'auto' }}>
      <TopBar here={2} steps={['Polyclinic', 'GP', 'Case']} />

      {/* Header row: back button + title + shuffle */}
      <div
        style={{
          padding: '24px 32px 0',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 20,
          maxWidth: 1200,
          margin: '0 auto',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <button
            type="button"
            className="btn-plush ghost"
            style={{ fontSize: 13, padding: '10px 18px' }}
            onClick={() => store.setScreen('gpRoom')}
            title="Back to the GP room"
          >
            ← BACK
          </button>
          <div>
            <h1 style={{ fontSize: 36, marginBottom: 4, fontWeight: 900 }}>Clinical Catalogue</h1>
            <div style={{ fontWeight: 500, color: 'var(--ink-2)', fontSize: 14 }}>
              Grouped by simulation clinic. Select a category node below to filter.
            </div>
          </div>
        </div>
        <button
          type="button"
          className="btn-plush mint"
          style={{ fontSize: 14, padding: '12px 22px', whiteSpace: 'nowrap', fontWeight: 800 }}
          onClick={shuffle}
        >
          🔀 DEPLOY RANDOM ({totalVisible})
        </button>
      </div>

      {/* Clinic filter chip row */}
      <div
        style={{
          padding: '20px 32px 10px',
          display: 'flex',
          gap: 10,
          flexWrap: 'wrap',
          alignItems: 'center',
          maxWidth: 1200,
          margin: '0 auto',
        }}
      >
        {clinicChips.map((chip) => {
          const isActive = filter === chip.id;
          return (
            <span
              key={chip.id}
              className={`chip ${isActive ? 'peach' : ''}`}
              style={{
                cursor: 'pointer',
                padding: '6px 12px',
                fontSize: 12,
                borderColor: isActive ? 'var(--peach)' : 'var(--line)',
                background: isActive ? 'var(--butter-deep)' : 'var(--paper)',
                transition: 'all 0.2s',
              }}
              onClick={() => setFilter(chip.id)}
            >
              {chip.icon ? `${chip.icon} ` : ''}
              {chip.label.toUpperCase()}
            </span>
          );
        })}
      </div>

      {/* Grouped sections */}
      <div style={{ padding: '10px 32px 40px', display: 'flex', flexDirection: 'column', gap: 32, maxWidth: 1200, margin: '0 auto' }}>
        {visibleGroups.map(([clinic, list]) => (
          <section key={clinic}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                marginBottom: 16,
                paddingBottom: 10,
                borderBottom: '1px dashed var(--line)',
              }}
            >
              <span style={{ fontSize: 24 }}>{CLINIC_ICON[clinic] ?? '🏥'}</span>
              <h2 style={{ fontSize: 22, margin: 0, fontWeight: 800, color: 'var(--ink)' }}>
                {CLINIC_LABELS[clinic].toUpperCase()}
              </h2>
              <span className="chip" style={{ fontSize: 10, marginLeft: 8, fontFamily: 'JetBrains Mono, monospace' }}>
                {list.length} CODE{list.length === 1 ? '' : 'S'}
              </span>
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                gap: 20,
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
            className="plush"
            style={{ padding: 32, textAlign: 'center', color: 'var(--ink-2)', fontWeight: 600, background: 'var(--paper)' }}
          >
            No simulation cases match the selected diagnostics node.
          </div>
        )}
      </div>
    </div>
  );
}
