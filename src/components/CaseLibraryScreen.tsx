import { useMemo, useState } from 'react';
import { TopBar, Doodle } from './primitives';
import { Mascot, getPatientMascot } from './mascots';
import { CASES, CONDITION_COLORS, type Case } from '../data/cases';
import { CLINIC_IDS, CLINIC_LABELS, type ClinicId } from '../game/clinic';
import { store } from '../game/store';
import { soundSystem } from '../utils/audioSystem';

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
}

function CaseCard({ c, delay = 0 }: CaseCardProps) {
  const accentColor = CONDITION_COLORS[c.cond] ?? 'var(--butter)';
  const isRedFlag = c.tags.some((t) => t.toLowerCase().includes('red flag'));

  const patientMascot = getPatientMascot({
    id: c.id,
    age: c.age,
    sex: c.sex,
    complaint: c.complaint,
    cond: c.cond,
  });

  const starCount = (c.id.charCodeAt(c.id.length - 1) % 3) + 1;
  const stars = '⭐'.repeat(starCount);

  return (
    <div
      className="tap popin"
      onMouseEnter={(e) => soundSystem.playCardHover(e.currentTarget)}
      onClick={() => {
        soundSystem.playClick();
        store.selectCase(c.id);
      }}
      style={{
        animationDelay: `${delay}s`,
        position: 'relative',
        transition: 'transform 200ms cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 200ms ease',
      }}
    >
      {/* Condition / Diagnosis Badge */}
      <div
        style={{
          position: 'absolute',
          top: -12,
          left: 16,
          zIndex: 10,
          background: '#ffffff',
          border: '3px solid #151B3D',
          borderRadius: 'var(--r-pill)',
          padding: '4px 12px',
          fontSize: 10,
          fontWeight: 900,
          color: 'var(--ink)',
          fontFamily: "'Fredoka', sans-serif",
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          boxShadow: '2px 2px 0px #151B3D',
        }}
      >
        {c.cond}
      </div>

      {/* Attempted Checkmark Tag */}
      {c.attempted && c.score && (
        <div
          style={{
            position: 'absolute',
            top: -12,
            right: 16,
            zIndex: 10,
            background: 'var(--green-lt)',
            border: '2px solid #151B3D',
            borderRadius: 'var(--r-pill)',
            padding: '3px 10px',
            fontSize: 10,
            fontWeight: 900,
            color: 'var(--green-deep)',
            fontFamily: "'Fredoka', sans-serif",
            boxShadow: '2px 2px 0px #151B3D',
          }}
        >
          ✓ {c.score}
        </div>
      )}

      {/* Red flag indicator badge */}
      {isRedFlag && !c.attempted && (
        <div
          style={{
            position: 'absolute',
            top: -12,
            right: 16,
            zIndex: 10,
            background: 'var(--coral-lt)',
            border: '2.5px solid #151B3D',
            borderRadius: 'var(--r-pill)',
            padding: '3px 10px',
            fontSize: 10,
            fontWeight: 900,
            color: 'var(--coral-deep)',
            fontFamily: "'Fredoka', sans-serif",
            boxShadow: '2px 2px 0px #151B3D',
          }}
        >
          🚩 RED FLAG
        </div>
      )}

      {/* COLLECTIBLE TRADING CARD BODY */}
      <div
        style={{
          background: 'white',
          borderRadius: 'var(--r-xl)',
          border: '4px solid #151B3D',
          boxShadow: '5px 5px 0px #151B3D',
          overflow: 'hidden',
          position: 'relative',
          zIndex: 1,
          height: 415,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}
      >
        {/* Card Header (Increased to 165px) */}
        <div
          style={{
            height: 165,
            background: accentColor,
            borderBottom: '4px solid #151B3D',
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Top accent line */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 10, background: 'rgba(21, 27, 61, 0.12)', borderBottom: '2.5px solid #151B3D', zIndex: 5 }} />

          <div style={{ position: 'absolute', inset: 0, opacity: 0.15, backgroundImage: 'radial-gradient(var(--dots-color) 1.5px, transparent 1.5px)', backgroundSize: '12px 12px' }} />
          <div style={{ position: 'absolute', top: 22, left: 22, opacity: 0.85 }} className="wobble">
            <Doodle kind="star" size={20} color="var(--butter)" />
          </div>
          <div style={{ position: 'absolute', top: 16, right: 22, opacity: 0.85 }} className="floaty">
            <Doodle kind="sparkle" size={18} color="var(--sky)" />
          </div>
          <div className="floaty" style={{ marginBottom: -10 }}>
            <Mascot name={patientMascot} size={150} mood={c.mood} />
          </div>
        </div>

        {/* Card Details Body (Increased Breathing Room) */}
        <div style={{ padding: '20px 18px 18px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <div style={{ fontWeight: 900, fontSize: 20, color: '#151B3D', fontFamily: "'Fredoka', sans-serif" }}>
                {c.name}
              </div>
              <div style={{ fontSize: 11 }} title={`Difficulty: ${starCount} stars`}>
                {stars}
              </div>
            </div>
            <div style={{ fontWeight: 800, fontSize: 13, color: '#151B3D', opacity: 0.85, marginBottom: 12, fontFamily: "'Fredoka', sans-serif" }}>
              {c.age} years old · {c.sex === 'F' ? 'Female' : 'Male'}
            </div>
            <div
              style={{
                fontSize: 14,
                color: '#151B3D',
                lineHeight: 1.45,
                fontWeight: 700,
                fontStyle: 'italic',
                background: 'var(--bg)',
                border: '2.5px solid #151B3D',
                borderRadius: '16px',
                padding: '10px 14px',
                position: 'relative',
                marginBottom: 12,
              }}
            >
              "{c.complaint}"
            </div>
          </div>

          {/* Specialty tag footer */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, fontWeight: 900, color: '#151B3D' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              📂 {c.guideline.toUpperCase()}
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'var(--bg-soft)', border: '2px solid #151B3D', borderRadius: '999px', padding: '4px 10px', color: '#151B3D', boxShadow: '1px 1px 0px #151B3D' }}>
              {CLINIC_ICON[c.clinic]} {CLINIC_LABELS[c.clinic]}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

type ClinicFilter = ClinicId | 'all' | 'red-flag';

export function CaseLibraryScreen() {
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
    soundSystem.playClick();
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
    <div 
      className="screen" 
      style={{ 
        background: 'var(--bg)', 
        overflowY: 'auto',
        backgroundImage: 'radial-gradient(var(--dots-color) 1.5px, transparent 1.5px)',
        backgroundSize: '24px 24px',
        position: 'relative',
      }}
    >
      <TopBar here={2} steps={['Polyclinic', 'GP', 'Case']} />

      {/* Whimsical Low-Opacity Background Doodles */}
      <div style={{ position: 'absolute', top: '6%', left: '4%', opacity: 0.25 }} className="drift-cloud">
        <Doodle kind="cloud" size={110} color="var(--sky-lt)" />
      </div>
      <div style={{ position: 'absolute', top: '10%', right: '5%', opacity: 0.25 }} className="drift-cloud">
        <Doodle kind="cloud" size={130} color="var(--mint-lt)" style={{ animationDelay: '1.5s' }} />
      </div>
      <div style={{ position: 'absolute', top: '26%', left: '3%', opacity: 0.4 }} className="wobble">
        <Doodle kind="star" size={32} color="var(--butter)" />
      </div>
      <div style={{ position: 'absolute', top: '34%', right: '3%', opacity: 0.35 }} className="drift">
        <Doodle kind="sparkle" size={28} color="var(--sky)" />
      </div>
      <div style={{ position: 'absolute', bottom: '15%', left: '4%', opacity: 0.35 }} className="wobble">
        <Doodle kind="leaf" size={40} color="var(--green)" />
      </div>
      <div style={{ position: 'absolute', bottom: '20%', right: '5%', opacity: 0.35 }} className="floaty">
        <Doodle kind="heart" size={32} color="var(--rose)" />
      </div>

      {/* Header */}
      <div
        style={{
          padding: '40px 36px 0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 24,
          maxWidth: 1240,
          margin: '0 auto',
          flexWrap: 'wrap',
          position: 'relative',
          zIndex: 5,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <button
            type="button"
            className="btn-plush ghost btn-toy"
            style={{ fontSize: 14, padding: '10px 22px', fontFamily: "'Fredoka', sans-serif", border: '3.5px solid #151B3D', boxShadow: '3px 3px 0px #151B3D' }}
            onMouseEnter={(e) => soundSystem.playHover(e.currentTarget)}
            onClick={() => { soundSystem.playClick(); store.setScreen('gpRoom'); }}
          >
            ← Back
          </button>
          <div>
            <div 
              className="chip butter" 
              style={{ 
                marginBottom: 10, 
                fontSize: 12, 
                padding: '6px 16px', 
                fontFamily: "'Fredoka', sans-serif",
                border: '3px solid #151B3D',
                boxShadow: '2.5px 2.5px 0px #151B3D',
                fontWeight: 800,
              }}
            >
              ★ COLLECTIBLE CASE CATALOGUE
            </div>
            <h1
              style={{
                fontSize: 'clamp(32px, 4.5vw, 48px)',
                marginBottom: 6,
                fontWeight: 850,
                fontFamily: "'Fredoka', sans-serif",
                letterSpacing: '-0.02em',
                color: '#151B3D',
                textShadow: '2px 2px 0px rgba(21, 27, 61, 0.05)',
              }}
            >
              Case Library
            </h1>
            <div style={{ fontWeight: 800, color: '#151B3D', fontSize: 15, fontFamily: "'Fredoka', sans-serif" }}>
              {totalVisible} character cards · specialty decks
            </div>
          </div>
        </div>
        <button
          type="button"
          className="btn-plush primary btn-toy"
          style={{ 
            fontSize: 15, 
            padding: '14px 28px', 
            whiteSpace: 'nowrap', 
            fontWeight: 800, 
            fontFamily: "'Fredoka', sans-serif",
            background: 'var(--butter)',
            color: '#151B3D',
            boxShadow: '0 5px 0px #151B3D !important',
            border: '3.5px solid #151B3D',
          }}
          onMouseEnter={(e) => soundSystem.playHover(e.currentTarget)}
          onClick={shuffle}
        >
          🔀 Pick Random Case
        </button>
      </div>

      {/* Filter chips — ALL specialty pills get hover + click sounds */}
      <div
        style={{
          padding: '28px 36px 16px',
          display: 'flex',
          gap: 10,
          flexWrap: 'wrap',
          alignItems: 'center',
          maxWidth: 1240,
          margin: '0 auto',
          position: 'relative',
          zIndex: 5,
        }}
      >
        {clinicChips.map((chip) => {
          const isActive = filter === chip.id;
          return (
            <span
              key={chip.id}
              className="tap"
              onMouseEnter={(e) => soundSystem.playHover(e.currentTarget)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                cursor: 'pointer',
                padding: '10px 18px',
                fontSize: 13,
                fontWeight: 800,
                borderRadius: 'var(--r-pill)',
                border: '3px solid #151B3D',
                background: isActive ? 'var(--mint-lt)' : 'white',
                color: '#151B3D',
                boxShadow: isActive ? '4px 4px 0px #151B3D' : '2px 2px 0px #151B3D',
                transition: 'all 0.15s ease',
                fontFamily: "'Fredoka', sans-serif",
              }}
              onClick={() => {
                soundSystem.playClick();
                setFilter(chip.id);
              }}
            >
              {chip.icon && <span>{chip.icon}</span>}
              {chip.label}
            </span>
          );
        })}
      </div>

      {/* Grouped sections */}
      <div style={{ padding: '16px 36px 64px', display: 'flex', flexDirection: 'column', gap: 40, maxWidth: 1240, margin: '0 auto', position: 'relative', zIndex: 5 }}>
        {visibleGroups.map(([clinic, list]) => (
          <section key={clinic}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                marginBottom: 24,
                paddingBottom: 16,
                borderBottom: '4px solid #151B3D',
              }}
            >
              <span
                style={{
                  width: 48, height: 48, borderRadius: '50%',
                  background: '#ffffff',
                  border: '3px solid #151B3D',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 24, flexShrink: 0,
                  boxShadow: '2.5px 2.5px 0px #151B3D',
                }}
              >
                {CLINIC_ICON[clinic] ?? '🏥'}
              </span>
              <h2 style={{ fontSize: 24, margin: 0, fontWeight: 850, color: '#151B3D', fontFamily: "'Fredoka', sans-serif" }}>
                {CLINIC_LABELS[clinic]} Specialty Deck
              </h2>
              <span
                style={{
                  background: 'var(--mint-lt)',
                  border: '2.5px solid #151B3D',
                  borderRadius: 'var(--r-pill)',
                  padding: '5px 14px',
                  fontSize: 12,
                  fontWeight: 800,
                  color: '#151B3D',
                  fontFamily: "'Fredoka', sans-serif",
                  boxShadow: '2.5px 2.5px 0px #151B3D',
                }}
              >
                {list.length} card{list.length !== 1 ? 's' : ''}
              </span>
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: 24,
              }}
            >
              {list.map((c, i) => (
                <CaseCard key={c.id} c={c} delay={(i % 8) * 0.04} />
              ))}
            </div>
          </section>
        ))}

        {visibleGroups.length === 0 && (
          <div
            style={{
              background: 'white',
              borderRadius: 'var(--r-xl)',
              padding: '64px 32px',
              textAlign: 'center',
              color: 'var(--ink-2)',
              fontWeight: 700,
              border: '4px dashed #151B3D',
              boxShadow: '6px 6px 0px #151B3D',
            }}
          >
            <div style={{ fontSize: 64, marginBottom: 16 }}>🔍</div>
            <div style={{ fontWeight: 900, fontSize: 22, fontFamily: "'Fredoka', sans-serif", color: '#151B3D' }}>No matching cards found!</div>
          </div>
        )}
      </div>
    </div>
  );
}

