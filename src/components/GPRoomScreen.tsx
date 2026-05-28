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

function IllustratedFolder() {
  return (
    <svg width="130" height="130" viewBox="0 0 130 130">
      <defs>
        <linearGradient id="folderGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFF0B3" />
          <stop offset="100%" stopColor="#FFD166" />
        </linearGradient>
      </defs>
      {/* Folder tab */}
      <rect x="14" y="20" width="42" height="16" rx="5" fill="url(#folderGrad)" stroke="rgba(74,74,106,0.15)" strokeWidth="2" />
      {/* Main folder body */}
      <rect x="10" y="28" width="110" height="86" rx="12" fill="url(#folderGrad)" stroke="rgba(74,74,106,0.15)" strokeWidth="2.5" />
      {/* Paper inside */}
      <rect x="22" y="40" width="86" height="64" rx="6" fill="white" stroke="rgba(74,74,106,0.1)" strokeWidth="2" />
      {/* Lines on paper */}
      <line x1="32" y1="56" x2="98" y2="56" stroke="rgba(74,74,106,0.15)" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="32" y1="68" x2="90" y2="68" stroke="rgba(74,74,106,0.15)" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="32" y1="80" x2="82" y2="80" stroke="rgba(74,74,106,0.15)" strokeWidth="2.5" strokeLinecap="round" />
      {/* Stethoscope icon accent */}
      <circle cx="98" cy="88" r="12" fill="var(--coral)" />
      <text x="98" y="92" textAnchor="middle" fontFamily="Nunito" fontWeight="900" fontSize="12" fill="white">🩺</text>
    </svg>
  );
}

export function GPRoomScreen() {
  const tweaks = useTweaks();
  const state = useGameState();
  const activeClinic = state.polyclinic.clinic;
  const [pickerOpen, setPickerOpen] = useState(false);

  const clinicCases = useMemo(() => {
    if (activeClinic === 'all-specialties') return CASES;
    return CASES.filter((c) => c.clinic === activeClinic);
  }, [activeClinic]);

  const totalAll = CASES.length;
  const queueAhead = clinicCases.length;
  const nextId = store.pickNextCaseId() ?? clinicCases[0]?.id ?? CASES[0]?.id;
  const next = nextId ? getCase(nextId) : null;

  const availableClinics = useMemo(() => {
    return CLINIC_IDS.filter(
      (id) => id === 'all-specialties' || CASES.some((c) => c.clinic === id),
    );
  }, []);

  return (
    <div className="screen" style={{ background: 'var(--bg)', position: 'relative', overflowY: 'auto' }}>
      <TopBar here={1} steps={['Polyclinic', 'GP']} />

      <div
        style={{
          padding: '40px 36px 56px',
          maxWidth: 980,
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 28,
        }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center' }}>
          <div className="chip mint" style={{ marginBottom: 14, fontSize: 12, padding: '6px 18px', fontFamily: "'Nunito', sans-serif" }}>
            🏥 Patient Reception
          </div>
          <h1
            style={{
              fontSize: 'clamp(32px, 4.5vw, 50px)',
              lineHeight: 1.05,
              fontFamily: "'Nunito', sans-serif",
              fontWeight: 900,
              letterSpacing: '-0.02em',
              marginBottom: 12,
            }}
          >
            Who's next? 👨‍⚕️
          </h1>
          <p style={{ fontSize: 16, color: 'var(--ink-2)', fontWeight: 600, maxWidth: 520, margin: '0 auto', lineHeight: 1.55 }}>
            Select a specialty clinic to meet your next patient, or browse the full case library.
          </p>
        </div>

        {/* Specialty picker */}
        <div
          style={{
            background: 'white',
            borderRadius: 'var(--r-xl)',
            border: `2px solid ${pickerOpen ? 'var(--mint)' : 'var(--line)'}`,
            boxShadow: pickerOpen
              ? '0 8px 32px rgba(78,205,196,0.18)'
              : '0 4px 16px rgba(26,26,46,0.06)',
            overflow: 'hidden',
            transition: 'all 0.25s ease',
          }}
        >
          <button
            type="button"
            onClick={() => setPickerOpen((v) => !v)}
            style={{
              width: '100%',
              padding: '18px 24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              fontFamily: "'Nunito', sans-serif",
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 22 }}>{CLINIC_ICON[activeClinic]}</span>
              <span>
                <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--ink-soft)', display: 'block', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>
                  Active Department
                </span>
                <span style={{ fontSize: 17, fontWeight: 900, color: 'var(--ink)' }}>
                  {CLINIC_LABELS[activeClinic]}
                </span>
              </span>
            </span>
            <span
              style={{
                width: 34, height: 34, borderRadius: '50%',
                background: pickerOpen ? 'var(--mint-lt)' : 'var(--bg-soft)',
                border: `1.5px solid ${pickerOpen ? 'var(--mint)' : 'var(--line)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 900, fontSize: 16, color: pickerOpen ? 'var(--mint-deep)' : 'var(--ink-2)',
                transition: 'all 0.2s ease',
                transform: pickerOpen ? 'rotate(180deg)' : 'none',
              }}
            >
              ▾
            </span>
          </button>

          {pickerOpen && (
            <div
              className="popin"
              style={{
                padding: '0 20px 20px',
                display: 'flex',
                gap: 8,
                flexWrap: 'wrap',
                borderTop: '1.5px solid var(--line)',
                paddingTop: 16,
              }}
            >
              {availableClinics.map((id) => {
                const isActive = activeClinic === id;
                return (
                  <span
                    key={id}
                    className="tap"
                    onClick={() => {
                      store.setPolyclinicClinic(id);
                      setPickerOpen(false);
                    }}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '8px 14px',
                      borderRadius: 'var(--r-pill)',
                      border: `2px solid ${isActive ? 'var(--mint)' : 'var(--line)'}`,
                      background: isActive ? 'var(--mint-lt)' : 'var(--bg)',
                      fontSize: 13,
                      fontWeight: 800,
                      color: isActive ? 'var(--mint-deep)' : 'var(--ink-2)',
                      cursor: 'pointer',
                      transition: 'all 0.18s ease',
                      fontFamily: "'Nunito', sans-serif",
                    }}
                  >
                    {CLINIC_ICON[id]} {CLINIC_LABELS[id]}
                  </span>
                );
              })}
            </div>
          )}
        </div>

        {/* Two action cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 24,
          }}
        >
          {/* LEFT: Accept next patient */}
          <div
            className={`tap popin ${next ? 'breathe' : ''}`}
            onClick={() => next && store.acceptNextPatient()}
            style={{
              background: 'white',
              borderRadius: 'var(--r-xl)',
              border: `2.5px solid ${next ? 'var(--coral)' : 'rgba(74,74,106,0.1)'}`,
              boxShadow: next
                ? '0 12px 40px rgba(255,107,107,0.18), 0 4px 12px rgba(26,26,46,0.06)'
                : '0 4px 16px rgba(26,26,46,0.05)',
              padding: 28,
              position: 'relative',
              cursor: next ? 'pointer' : 'not-allowed',
              opacity: next ? 1 : 0.55,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'space-between',
              overflow: 'hidden',
              minHeight: 400,
            }}
          >
            {/* Top accent */}
            {next && (
              <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, height: 5,
                background: 'linear-gradient(90deg, var(--coral) 0%, var(--peach) 100%)',
                borderRadius: '32px 32px 0 0',
              }} />
            )}

            {/* Floating badge */}
            <div style={{ position: 'absolute', top: 18, left: 20 }}>
              <span className="chip coral" style={{ fontFamily: "'Nunito', sans-serif", fontSize: 11 }}>
                Patient Intake
              </span>
            </div>

            {/* Avatar area */}
            <div style={{ marginTop: 36, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, flex: 1 }}>
              <div
                className="floaty"
                style={{
                  width: 160,
                  height: 160,
                  borderRadius: '50%',
                  background: next
                    ? 'linear-gradient(135deg, rgba(255,160,122,0.12) 0%, rgba(255,107,107,0.08) 100%)'
                    : 'var(--bg-soft)',
                  border: `2.5px solid ${next ? 'var(--coral)' : 'rgba(74,74,106,0.1)'}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: next ? '0 12px 36px rgba(255,107,107,0.18)' : 'none',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {next && (
                  <div style={{
                    position: 'absolute', inset: 0,
                    background: 'radial-gradient(circle, rgba(255,213,107,0.18) 0%, transparent 70%)',
                    pointerEvents: 'none', zIndex: 2,
                  }} />
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
                  <span style={{ fontSize: 52 }}>{CLINIC_ICON[activeClinic]}</span>
                )}
              </div>

              <div style={{ textAlign: 'center', width: '100%' }}>
                <h2 style={{ fontSize: 22, fontWeight: 900, marginBottom: 8, color: 'var(--ink)', fontFamily: "'Nunito', sans-serif" }}>
                  {next ? 'Invite Patient In' : 'Queue Empty'}
                </h2>
                <p style={{ fontSize: 14, color: 'var(--ink-2)', fontWeight: 600, lineHeight: 1.5, marginBottom: 16, maxWidth: 260, margin: '0 auto 16px' }}>
                  {next
                    ? `Ready to welcome ${next.name} into the consultation room.`
                    : `No simulation cases queued in ${CLINIC_LABELS[activeClinic]}.`}
                </p>
                <div style={{ display: 'flex', justifyContent: 'center', gap: 6, flexWrap: 'wrap' }}>
                  {next && (
                    <>
                      <span className="chip sky" style={{ fontFamily: "'Nunito', sans-serif", fontSize: 11 }}>
                        {next.name.split(' ')[0]} · {next.age}Y · {next.sex === 'F' ? 'F' : 'M'}
                      </span>
                      <span className="chip coral" style={{ fontFamily: "'Nunito', sans-serif", fontSize: 11 }}>
                        {next.cond}
                      </span>
                    </>
                  )}
                  <span className="chip butter" style={{ fontFamily: "'Nunito', sans-serif", fontSize: 11 }}>
                    {queueAhead} in roster
                  </span>
                </div>
              </div>
            </div>

            {/* CTA */}
            {next && (
              <div
                style={{
                  width: '100%', marginTop: 20,
                  background: 'linear-gradient(135deg, var(--coral) 0%, var(--peach) 100%)',
                  borderRadius: 'var(--r-pill)',
                  padding: '14px 0',
                  textAlign: 'center',
                  fontWeight: 900,
                  fontSize: 16,
                  color: 'white',
                  fontFamily: "'Nunito', sans-serif",
                  boxShadow: '0 6px 20px rgba(255,107,107,0.35)',
                  letterSpacing: '-0.01em',
                }}
              >
                🚪 Welcome Patient →
              </div>
            )}
          </div>

          {/* RIGHT: Case library */}
          <div
            className="tap popin"
            onClick={() => store.setScreen('library')}
            style={{
              background: 'white',
              borderRadius: 'var(--r-xl)',
              border: '2px solid var(--line)',
              boxShadow: '0 8px 28px rgba(26,26,46,0.07)',
              padding: 28,
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'space-between',
              overflow: 'hidden',
              minHeight: 400,
              cursor: 'pointer',
              transition: 'all 300ms cubic-bezier(0.34, 1.56, 0.64, 1)',
            }}
          >
            {/* Top accent */}
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: 5,
              background: 'linear-gradient(90deg, var(--butter) 0%, var(--peach) 100%)',
              borderRadius: '32px 32px 0 0',
            }} />

            <div style={{ position: 'absolute', top: 18, left: 20 }}>
              <span className="chip butter" style={{ fontFamily: "'Nunito', sans-serif", fontSize: 11 }}>
                Case Archive
              </span>
            </div>

            <div style={{ marginTop: 36, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, flex: 1 }}>
              <div
                className="floaty"
                style={{
                  width: 160,
                  height: 160,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--butter-lt) 0%, rgba(255,160,122,0.1) 100%)',
                  border: '2px solid var(--line)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <IllustratedFolder />
              </div>

              <div style={{ textAlign: 'center', width: '100%' }}>
                <h2 style={{ fontSize: 22, fontWeight: 900, marginBottom: 8, color: 'var(--ink)', fontFamily: "'Nunito', sans-serif" }}>
                  Case Library
                </h2>
                <p style={{ fontSize: 14, color: 'var(--ink-2)', fontWeight: 600, lineHeight: 1.5, marginBottom: 16, maxWidth: 260, margin: '0 auto 16px' }}>
                  Browse clinical cases, pick a specific scenario, and practice on your own terms.
                </p>
                <div style={{ display: 'flex', justifyContent: 'center', gap: 6, flexWrap: 'wrap' }}>
                  <span className="chip sky" style={{ fontFamily: "'Nunito', sans-serif", fontSize: 11 }}>
                    📁 {totalAll} Cases
                  </span>
                  <span className="chip lav" style={{ fontFamily: "'Nunito', sans-serif", fontSize: 11 }}>
                    24 Specialties
                  </span>
                </div>
              </div>
            </div>

            <div
              style={{
                width: '100%', marginTop: 20,
                background: 'linear-gradient(135deg, var(--butter) 0%, var(--peach) 100%)',
                borderRadius: 'var(--r-pill)',
                padding: '14px 0',
                textAlign: 'center',
                fontWeight: 900,
                fontSize: 16,
                color: 'var(--ink)',
                fontFamily: "'Nunito', sans-serif",
                boxShadow: '0 6px 20px rgba(255,209,102,0.35)',
                letterSpacing: '-0.01em',
              }}
            >
              📚 Browse Cases →
            </div>
          </div>
        </div>

        {/* Back button */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <button
            type="button"
            className="btn-plush ghost"
            style={{ fontSize: 14, padding: '12px 28px', fontFamily: "'Nunito', sans-serif" }}
            onClick={() => store.setScreen('mode')}
          >
            ← Back to Wings
          </button>
        </div>
      </div>
    </div>
  );
}
