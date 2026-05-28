import { useState, useMemo } from 'react';
import { PatientFace, TopBar } from './primitives';
import { CASES, getCase } from '../data/cases';
import { CLINIC_IDS, CLINIC_LABELS, type ClinicId } from '../game/clinic';
import { store, useGameState, useTweaks } from '../game/store';

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

export function GPRoomScreen() {
  const tweaks = useTweaks();
  const state = useGameState();
  const activeClinic = state.polyclinic.clinic;
  const [pickerOpen, setPickerOpen] = useState(false);

  // Cases from the active clinic — that's what "Accept the next patient"
  // will walk through. 'all-specialties' pulls from every roster.
  const clinicCases = useMemo(() => {
    if (activeClinic === 'all-specialties') return CASES;
    return CASES.filter((c) => c.clinic === activeClinic);
  }, [activeClinic]);

  const totalAll = CASES.length;
  const queueAhead = clinicCases.length;
  const nextId = store.pickNextCaseId() ?? clinicCases[0]?.id ?? CASES[0]?.id;
  const next = nextId ? getCase(nextId) : null;

  // Only show clinics that actually have at least one case in the
  // catalogue, plus the synthetic "all" option at the top.
  const availableClinics = useMemo(() => {
    return CLINIC_IDS.filter(
      (id) => id === 'all-specialties' || CASES.some((c) => c.clinic === id),
    );
  }, []);

  return (
    <div className="screen" style={{ background: 'var(--cream)', position: 'relative', overflowY: 'auto' }}>
      <TopBar here={1} steps={['Polyclinic', 'GP']} />

      {/* Friendly Desk Sign */}
      <div
        style={{
          position: 'absolute',
          top: 80,
          left: 40,
          fontSize: 12,
          fontWeight: 700,
          color: 'var(--ink-soft)',
          pointerEvents: 'none',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        <span>📍 Desk 4</span>
        <span>•</span>
        <span>GP Consultation Room</span>
      </div>

      <div
        style={{
          position: 'absolute',
          top: 80,
          right: 40,
          fontSize: 12,
          fontWeight: 700,
          color: 'var(--ink-soft)',
          pointerEvents: 'none',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        <span style={{ color: 'var(--peach)', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <span className="dot" style={{ background: 'var(--peach)', width: 8, height: 8 }} />
          Online
        </span>
      </div>

      <div style={{ padding: '40px 36px 12px', textAlign: 'center' }}>
        <span className="chip butter" style={{ marginBottom: 12 }}>
          🏥 CLINICAL INTRODUCTIONS
        </span>
        <h1 style={{ fontSize: 44, lineHeight: 1.05, marginTop: 12, fontWeight: 900 }}>
          Patient Reception Desk
        </h1>
        <div
          style={{
            fontSize: 16,
            color: 'var(--ink-2)',
            fontWeight: 500,
            marginTop: 8,
            maxWidth: 620,
            margin: '8px auto 0',
          }}
        >
          Select a specialty clinic below to meet your next patient, or browse patient charts in the case library.
        </div>
      </div>

      {/* Specialty Picker Console */}
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '12px 36px 4px' }}>
        <button
          type="button"
          onClick={() => setPickerOpen((v) => !v)}
          className="btn-plush ghost"
          style={{
            width: '100%',
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: 15,
            fontWeight: 700,
            background: 'var(--paper)',
            borderColor: pickerOpen ? 'var(--peach)' : 'var(--line)',
            boxShadow: pickerOpen ? 'var(--plush-sm)' : 'none',
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span
              style={{
                fontSize: 10,
                fontWeight: 800,
                color: 'var(--ink-soft)',
                letterSpacing: '0.1em',
                fontFamily: 'Outfit, sans-serif',
              }}
            >
              ACTIVE DEPT:
            </span>
            <span style={{ color: 'var(--ink)', fontSize: 16, fontWeight: 800 }}>
              {CLINIC_ICON[activeClinic]} {CLINIC_LABELS[activeClinic]}
            </span>
          </span>
          <span style={{ fontWeight: 800, color: 'var(--peach)', fontSize: 16 }}>
            {pickerOpen ? '▲' : '▼'}
          </span>
        </button>

        {pickerOpen && (
          <div
            className="plush popin"
            style={{
              marginTop: 8,
              padding: 16,
              background: 'var(--paper)',
              border: 'var(--stroke-thick) solid var(--line)',
              display: 'flex',
              gap: 10,
              flexWrap: 'wrap',
              boxShadow: 'var(--plush)',
            }}
          >
            {availableClinics.map((id) => {
              const isActive = activeClinic === id;
              return (
                <span
                  key={id}
                  className={`chip ${isActive ? 'peach' : ''}`}
                  style={{
                    cursor: 'pointer',
                    fontSize: 12,
                    padding: '8px 14px',
                    borderColor: isActive ? 'var(--peach)' : 'var(--line)',
                    background: isActive ? 'var(--peach-deep)' : 'var(--cream-2)',
                    transition: 'all 0.2s',
                  }}
                  onClick={() => {
                    store.setPolyclinicClinic(id);
                    setPickerOpen(false);
                  }}
                >
                  {CLINIC_ICON[id]} {CLINIC_LABELS[id]}
                </span>
              );
            })}
          </div>
        )}
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 32,
          padding: '24px 36px 40px',
          maxWidth: 960,
          margin: '0 auto',
        }}
      >
        {/* LEFT — teleporter pad (accept next patient) */}
        <div
          className={`tap plush-lg popin ${next ? 'breathe' : ''}`}
          onClick={() => next && store.acceptNextPatient()}
          style={{
            background: 'var(--paper)',
            borderColor: next ? 'var(--peach)' : 'var(--line)',
            padding: 32,
            position: 'relative',
            opacity: next ? 1 : 0.5,
            cursor: next ? 'pointer' : 'not-allowed',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'stretch',
            justifyContent: 'space-between',
            boxShadow: next ? 'var(--plush)' : 'var(--plush-sm)',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: -14,
              left: 24,
            }}
            className="chip peach"
          >
            PATIENT INTAKE
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              margin: '20px 0',
            }}
          >
            {/* Friendly Avatar Container */}
            <div
              className="plush"
              style={{
                width: 170,
                height: 170,
                background: 'var(--cream-2)',
                borderColor: next ? 'var(--peach)' : 'var(--line)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                overflow: 'hidden',
                borderRadius: '50%',
                boxShadow: next ? '0 8px 24px rgba(255, 123, 84, 0.15)' : 'none',
              }}
            >
              {/* Soft warm radial glow */}
              {next && (
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'radial-gradient(circle, rgba(255, 213, 107, 0.15) 0%, transparent 70%)',
                    pointerEvents: 'none',
                    zIndex: 2,
                  }}
                />
              )}

              {next ? (
                <PatientFace
                  style={tweaks.avatarStyle}
                  skin={next.skin}
                  hair={next.hair}
                  size={130}
                  mood={next.mood}
                  accessory={next.accessory}
                  gender={next.sex}
                  age={next.age}
                />
              ) : (
                <span style={{ fontSize: 48 }}>
                  {CLINIC_ICON[activeClinic]}
                </span>
              )}
            </div>
          </div>

          <div>
            <h2 style={{ fontSize: 24, textAlign: 'center', marginBottom: 8, fontWeight: 800 }}>
              {next ? 'Invite Patient In' : 'Queue Empty'}
            </h2>
            <div
              style={{
                fontSize: 14,
                color: 'var(--ink-2)',
                fontWeight: 500,
                textAlign: 'center',
                marginBottom: 20,
                minHeight: 42,
                lineHeight: 1.4,
              }}
            >
              {next
                ? `Ready to welcome ${next.name} into the clinical consultation room.`
                : `No simulation cases queued in ${CLINIC_LABELS[activeClinic]}.`}
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, flexWrap: 'wrap' }}>
              {next && (
                <>
                  <span className="chip sky">
                    {next.name.split(' ')[0]} · {next.age}Y · {next.sex === 'F' ? 'Female' : 'Male'}
                  </span>
                  <span className="chip rose">{next.cond}</span>
                </>
              )}
              <span className="chip butter">
                {queueAhead} IN ROSTER
              </span>
            </div>
          </div>
        </div>

        {/* RIGHT — database folder (browse charts) */}
        <div
          className="tap plush-lg popin"
          onClick={() => store.setScreen('library')}
          style={{
            background: 'var(--paper)',
            borderColor: 'var(--line)',
            padding: 32,
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'stretch',
            justifyContent: 'space-between',
            boxShadow: 'var(--plush)',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: -14,
              left: 24,
            }}
            className="chip mint"
          >
            CASE ARCHIVE
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              margin: '20px 0',
            }}
          >
            {/* Friendly Folder Frame */}
            <div
              className="plush"
              style={{
                width: 170,
                height: 170,
                background: 'var(--cream-2)',
                borderColor: 'var(--line)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '50%',
                position: 'relative',
                boxShadow: '0 8px 24px var(--shadow)',
              }}
            >
              <div style={{ transform: 'scale(1.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ChartFolder />
              </div>
            </div>
          </div>

          <div>
            <h2 style={{ fontSize: 24, textAlign: 'center', marginBottom: 8, fontWeight: 800 }}>
              Case Library
            </h2>
            <div
              style={{
                fontSize: 14,
                color: 'var(--ink-2)',
                fontWeight: 500,
                textAlign: 'center',
                marginBottom: 20,
                minHeight: 42,
                lineHeight: 1.4,
              }}
            >
              Browse through clinical cases, review attempt ribbons, and practice specific scenarios.
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span className="chip sky">
                📁 {totalAll} Cases
              </span>
              <span className="chip peach">INDEX SORTED</span>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', paddingBottom: 40 }}>
        <button
          type="button"
          className="btn-plush ghost"
          style={{ fontSize: 13, padding: '12px 24px' }}
          onClick={() => store.setScreen('mode')}
        >
          ← EXIT TO CORRIDOR
        </button>
      </div>
    </div>
  );
}

function ChartFolder() {
  const stroke = 'var(--line)';
  return (
    <svg width="120" height="120" viewBox="0 0 120 120">
      <rect x="14" y="22" width="92" height="14" rx="4" fill="#FFD86B" stroke={stroke} strokeWidth="3.5" />
      <rect x="10" y="30" width="100" height="78" rx="10" fill="#FFB68A" stroke={stroke} strokeWidth="4" />
      <rect x="20" y="42" width="80" height="60" rx="6" fill="white" stroke={stroke} strokeWidth="3" />
      <line x1="30" y1="56" x2="86" y2="56" stroke={stroke} strokeWidth="3" strokeLinecap="round" />
      <line x1="30" y1="68" x2="78" y2="68" stroke={stroke} strokeWidth="3" strokeLinecap="round" />
      <line x1="30" y1="80" x2="70" y2="80" stroke={stroke} strokeWidth="3" strokeLinecap="round" />
      <circle cx="92" cy="84" r="9" fill="#F47A92" stroke={stroke} strokeWidth="3" />
      <text x="92" y="88" textAnchor="middle" fontFamily="Nunito" fontWeight="900" fontSize="11" fill="white">
        +
      </text>
    </svg>
  );
}
