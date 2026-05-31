import { useState, useMemo } from 'react';
import { TopBar, Doodle } from './primitives';
import { Mascot, getPatientMascot } from './mascots';
import { CASES, getCase } from '../data/cases';
import { CLINIC_IDS, CLINIC_LABELS, type ClinicId } from '../game/clinic';
import { store, useGameState } from '../game/store';
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

function IllustratedChest() {
  return (
    <svg width="180" height="180" viewBox="0 0 100 100" style={{ filter: 'drop-shadow(4px 4px 0px #151B3D)' }}>
      {/* Glow background rays */}
      <path d="M 50 15 L 42 0 L 58 0 Z" fill="var(--butter-lt)" opacity="0.4" />
      <path d="M 50 15 L 20 5 L 26 15 Z" fill="var(--butter-lt)" opacity="0.4" />
      <path d="M 50 15 L 80 5 L 74 15 Z" fill="var(--butter-lt)" opacity="0.4" />
      <path d="M 50 15 L 5 30 L 10 40 Z" fill="var(--butter-lt)" opacity="0.4" />
      <path d="M 50 15 L 95 30 L 90 40 Z" fill="var(--butter-lt)" opacity="0.4" />

      {/* Golden Chest base block */}
      <rect x="15" y="44" width="70" height="42" rx="6" fill="var(--butter)" stroke="#151B3D" strokeWidth="4" />
      {/* Wooden planks horizontal */}
      <line x1="15" y1="58" x2="85" y2="58" stroke="#151B3D" strokeWidth="3" />
      <line x1="15" y1="72" x2="85" y2="72" stroke="#151B3D" strokeWidth="3" />

      {/* Golden Chest lid rounded */}
      <path d="M 15 44 C 15 20, 85 20, 85 44 Z" fill="var(--butter-deep)" stroke="#151B3D" strokeWidth="4" strokeLinejoin="round" />
      {/* Wood grain curves on Lid */}
      <path d="M 30 25 C 40 28, 60 28, 70 25" fill="none" stroke="#151B3D" strokeWidth="2.5" opacity="0.4" />
      
      {/* Metal bands vertical (Iron reinforcements) */}
      <rect x="26" y="24" width="8" height="62" rx="2" fill="var(--sky-deep)" stroke="#151B3D" strokeWidth="3" opacity="0.9" />
      <rect x="66" y="24" width="8" height="62" rx="2" fill="var(--sky-deep)" stroke="#151B3D" strokeWidth="3" opacity="0.9" />

      {/* Gold metal corners */}
      <path d="M 15 74 L 23 74 L 23 86 L 15 86 Z" fill="var(--butter)" stroke="#151B3D" strokeWidth="2.5" />
      <path d="M 77 74 L 85 74 L 85 86 L 77 86 Z" fill="var(--butter)" stroke="#151B3D" strokeWidth="2.5" />

      {/* Giant padlock latch face */}
      <rect x="42" y="38" width="16" height="20" rx="3" fill="#ffffff" stroke="#151B3D" strokeWidth="4" />
      <circle cx="50" cy="46" r="3" fill="#151B3D" />
      <path d="M 50 49 L 50 54" stroke="#151B3D" strokeWidth="2.5" strokeLinecap="round" />
      {/* Glowing pink heart core on keyhole */}
      <circle cx="50" cy="46" r="1.5" fill="var(--rose)" />
      
      {/* Magical Sparkles around the Chest */}
      <path d="M 10 20 L 12 25 L 17 26 L 12 27 L 10 32 L 8 27 L 3 26 L 8 25 Z" fill="var(--butter)" />
      <path d="M 88 65 L 89 68 L 92 69 L 89 70 L 88 73 L 87 70 L 84 69 L 87 68 Z" fill="var(--butter)" />
    </svg>
  );
}

export function GPRoomScreen() {
  const state = useGameState();
  const activeClinic = state.polyclinic.clinic;
  const [pickerOpen, setPickerOpen] = useState(false);

  const clinicCases = useMemo(() => {
    if (activeClinic === 'all-specialties') return CASES;
    return CASES.filter((c) => c.clinic === activeClinic);
  }, [activeClinic]);

  const totalAll = CASES.length;
  const nextId = store.pickNextCaseId() ?? clinicCases[0]?.id ?? CASES[0]?.id;
  const next = nextId ? getCase(nextId) : null;

  const availableClinics = useMemo(() => {
    return CLINIC_IDS.filter(
      (id) => id === 'all-specialties' || CASES.some((c) => c.clinic === id),
    );
  }, []);

  const incomingMascot = next 
    ? getPatientMascot({ id: next.id, age: next.age, sex: next.sex, complaint: next.complaint, cond: next.cond })
    : 'officeWorker';

  return (
    <div 
      className="screen" 
      style={{ 
        background: 'var(--bg)', 
        position: 'relative', 
        overflowY: 'auto',
        backgroundImage: 'radial-gradient(var(--dots-color) 1.5px, transparent 1.5px)',
        backgroundSize: '24px 24px',
      }}
    >
      <TopBar here={1} steps={['Polyclinic', 'GP']} />

      {/* Whimsical Ambient World Decorations */}
      <div style={{ position: 'absolute', top: '7%', left: '5%', opacity: 0.25 }} className="drift-cloud">
        <Doodle kind="cloud" size={120} color="var(--sky-lt)" />
      </div>
      <div style={{ position: 'absolute', top: '12%', right: '6%', opacity: 0.25 }} className="drift-cloud">
        <Doodle kind="cloud" size={140} color="var(--mint-lt)" style={{ animationDelay: '2s' }} />
      </div>
      <div style={{ position: 'absolute', top: '40%', left: '4%', opacity: 0.5 }} className="wobble">
        <Doodle kind="star" size={38} color="var(--butter)" />
      </div>
      <div style={{ position: 'absolute', top: '48%', right: '5%', opacity: 0.45 }} className="drift">
        <Doodle kind="sparkle" size={32} color="var(--sky)" />
      </div>
      <div style={{ position: 'absolute', bottom: '15%', left: '5%', opacity: 0.45 }} className="wobble">
        <Doodle kind="heart" size={34} color="var(--rose)" />
      </div>
      <div style={{ position: 'absolute', bottom: '18%', right: '7%', opacity: 0.45 }} className="floaty">
        <Doodle kind="stetho" size={48} color="var(--lav)" />
      </div>
      <div style={{ position: 'absolute', top: '22%', left: '20%', opacity: 0.45 }} className="floaty">
        <Doodle kind="leaf" size={44} color="var(--green)" />
      </div>

      <div
        style={{
          padding: '40px 24px 80px',
          maxWidth: 1140,
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 36,
          position: 'relative',
          zIndex: 5,
        }}
      >
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div 
            className="chip mint" 
            style={{ 
              marginBottom: 16, 
              fontSize: 13, 
              padding: '6px 18px', 
              fontFamily: "'Fredoka', sans-serif",
              border: '3.5px solid #151B3D',
              boxShadow: '3px 3px 0px #151B3D',
              fontWeight: 800,
            }}
          >
            🏥 PATIENT RECEPTION
          </div>
          <h1
            style={{
              fontSize: 'clamp(38px, 5.5vw, 52px)',
              lineHeight: 1.05,
              fontFamily: "'Fredoka', sans-serif",
              fontWeight: 800,
              color: '#151B3D',
              marginBottom: 14,
              textShadow: '2px 2px 0px rgba(21, 27, 61, 0.05)',
            }}
          >
            Who's next? 👨‍⚕️
          </h1>
        </div>

        <div
          style={{
            background: 'white',
            borderRadius: 'var(--r-xl)',
            border: pickerOpen ? '4px solid var(--mint)' : '4px solid #151B3D',
            boxShadow: pickerOpen
              ? '8px 8px 0px var(--mint)'
              : '5px 5px 0px #151B3D',
            overflow: 'hidden',
            transition: 'all 0.2s ease',
          }}
        >
          <button
            type="button"
            onMouseEnter={(e) => soundSystem.playHover(e.currentTarget)}
            onClick={() => {
              soundSystem.playClick();
              setPickerOpen((v) => !v);
            }}
            style={{
              width: '100%',
              padding: '20px 28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              fontFamily: "'Fredoka', sans-serif",
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <span style={{ fontSize: 32 }}>{CLINIC_ICON[activeClinic]}</span>
              <span style={{ textAlign: 'left' }}>
                <span style={{ fontSize: 12, fontWeight: 900, color: '#151B3D', opacity: 0.8, display: 'block', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>
                  Selected Department
                </span>
                <span style={{ fontSize: 20, fontWeight: 850, color: '#151B3D' }}>
                  {CLINIC_LABELS[activeClinic]}
                </span>
              </span>
            </span>
            <span
              style={{
                width: 38, height: 38, borderRadius: '50%',
                background: pickerOpen ? 'var(--mint-lt)' : 'var(--cream)',
                border: '3px solid #151B3D',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 900, fontSize: 16, color: '#151B3D',
                transform: pickerOpen ? 'rotate(180deg)' : 'none',
                boxShadow: '2px 2px 0px #151B3D',
              }}
            >
              ▼
            </span>
          </button>

          {pickerOpen && (
            <div
              className="popin"
              style={{
                padding: '0 24px 24px',
                display: 'flex',
                gap: 10,
                flexWrap: 'wrap',
                borderTop: '3px solid #151B3D',
                paddingTop: 20,
                background: 'var(--bg)',
              }}
            >
              {availableClinics.map((id) => {
                const isActive = activeClinic === id;
                return (
                  <span
                    key={id}
                    className="tap"
                    onMouseEnter={(e) => soundSystem.playHover(e.currentTarget)}
                    onClick={() => {
                      soundSystem.playClick();
                      store.setPolyclinicClinic(id);
                      setPickerOpen(false);
                    }}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '10px 18px',
                      borderRadius: 'var(--r-pill)',
                      border: '3px solid #151B3D',
                      background: isActive ? 'var(--mint-lt)' : '#ffffff',
                      fontSize: 14,
                      fontWeight: 800,
                      color: '#151B3D',
                      cursor: 'pointer',
                      boxShadow: isActive ? '4px 4px 0px #151B3D' : '2px 2px 0px #151B3D',
                      fontFamily: "'Fredoka', sans-serif",
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
            gridTemplateColumns: '1.38fr 1fr',
            gap: 36,
            alignItems: 'start',
          }}
        >
          <div
            className={`popin ${next ? 'breathe' : ''}`}
            style={{
              background: 'var(--rose-lt)',
              borderRadius: 'var(--r-xl)',
              border: '4px solid #151B3D',
              boxShadow: next ? '8px 8px 0px #151B3D' : '4px 4px 0px #151B3D',
              padding: '40px 36px 36px',
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: 520,
              overflow: 'visible',
            }}
          >
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 14, background: 'var(--peach)', borderBottom: '4px solid #151B3D', borderTopLeftRadius: '20px', borderTopRightRadius: '20px' }} />

            <div style={{ position: 'absolute', top: -14, left: 24, zIndex: 10 }}>
              <span 
                className="chip coral" 
                style={{ 
                  fontFamily: "'Fredoka', sans-serif", 
                  fontSize: 13,
                  border: '3.5px solid #151B3D',
                  boxShadow: '3px 3px 0px #151B3D',
                  background: 'var(--peach)',
                  color: '#ffffff',
                  fontWeight: 800,
                  padding: '6px 16px',
                }}
              >
                PATIENT QUEST
              </span>
            </div>

            {next ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24, alignItems: 'center', width: '100%', marginTop: 8 }}>
                <div 
                  className="popin"
                  style={{
                    position: 'relative',
                    background: '#ffffff',
                    border: '3.5px solid #151B3D',
                    borderRadius: '24px',
                    padding: '18px 24px',
                    fontWeight: 850,
                    fontSize: 17,
                    lineHeight: 1.5,
                    color: '#151B3D',
                    boxShadow: '4px 4px 0px #151B3D',
                    fontFamily: "'Fredoka', sans-serif",
                    fontStyle: 'italic',
                    width: '100%',
                    textAlign: 'center',
                    marginTop: 8,
                  }}
                >
                  "I've been feeling {next.complaint.toLowerCase()} lately..."
                  <div style={{ position: 'absolute', bottom: -12, left: '50%', transform: 'translateX(-50%)', width: 0, height: 0, borderLeft: '11px solid transparent', borderRight: '11px solid transparent', borderTop: '13px solid #151B3D' }} />
                  <div style={{ position: 'absolute', bottom: -8, left: '50%', transform: 'translateX(-50%)', width: 0, height: 0, borderLeft: '10px solid transparent', borderRight: '10px solid transparent', borderTop: '11px solid #ffffff' }} />
                </div>

                <div 
                  className="floaty"
                  style={{ 
                    height: 220, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    margin: '12px 0 6px',
                    width: '100%',
                  }}
                >
                  <Mascot name={incomingMascot} size={230} mood={next.mood} />
                </div>

                <div style={{ textAlign: 'center', width: '100%' }}>
                  <h2 style={{ fontSize: 32, fontWeight: 900, color: '#151B3D', fontFamily: "'Fredoka', sans-serif", marginBottom: 8, letterSpacing: '-0.01em' }}>
                    {next.name}
                  </h2>
                  
                  <div style={{ display: 'flex', justifyContent: 'center', gap: 10, flexWrap: 'wrap', marginTop: 12 }}>
                    <span className="chip sky" style={{ fontFamily: "'Fredoka', sans-serif", border: '2.5px solid #151B3D', boxShadow: '2.5px 2.5px 0px #151B3D', color: '#151B3D', fontWeight: 800, padding: '5px 14px', fontSize: 13 }}>
                      👤 {next.age} years old
                    </span>
                    <span className="chip lav" style={{ fontFamily: "'Fredoka', sans-serif", border: '2.5px solid #151B3D', boxShadow: '2.5px 2.5px 0px #151B3D', color: '#151B3D', fontWeight: 800, padding: '5px 14px', fontSize: 13 }}>
                      🧬 {next.sex === 'F' ? 'Female' : 'Male'}
                    </span>
                    <span className="chip coral" style={{ fontFamily: "'Fredoka', sans-serif", border: '2.5px solid #151B3D', boxShadow: '2.5px 2.5px 0px #151B3D', color: '#151B3D', fontWeight: 800, padding: '5px 14px', fontSize: 13 }}>
                      🚩 {next.cond}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  className="btn-plush primary breathe btn-toy"
                  style={{
                    width: '100%',
                    background: 'var(--peach)',
                    color: '#ffffff',
                    fontSize: 20,
                    padding: '18px 0',
                    fontFamily: "'Fredoka', sans-serif",
                    marginTop: 12,
                    boxShadow: '0 6px 0px #151B3D !important',
                    border: '4px solid #151B3D',
                    borderRadius: 'var(--r-pill)',
                    fontWeight: 800,
                  }}
                  onMouseEnter={(e) => soundSystem.playHover(e.currentTarget)}
                  onClick={() => {
                    soundSystem.playClick();
                    store.acceptNextPatient();
                  }}
                >
                  🚪 Invite Patient In →
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 18, alignItems: 'center', justifyContent: 'center', flex: 1 }}>
                <span style={{ fontSize: 54 }}>🌈</span>
                <h2 style={{ fontSize: 24, fontWeight: 850, color: '#151B3D', fontFamily: "'Fredoka', sans-serif" }}>
                  Queue Empty
                </h2>
                <p style={{ fontSize: 17, color: '#151B3D', textAlign: 'center', maxWidth: 300, fontWeight: 700, lineHeight: 1.5 }}>
                  No active simulation cases remaining in this specialty roster.
                </p>
              </div>
            )}
          </div>

          <div
            className="tap popin"
            onMouseEnter={(e) => soundSystem.playCardHover(e.currentTarget)}
            onClick={() => {
              soundSystem.playClick();
              store.setScreen('library');
            }}
            style={{
              background: 'var(--sky-lt)',
              borderRadius: 'var(--r-xl)',
              border: '4px solid #151B3D',
              boxShadow: '5px 5px 0px #151B3D',
              padding: '40px 32px 36px',
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'space-between',
              minHeight: 520,
              cursor: 'pointer',
              overflow: 'visible',
            }}
          >
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 14, background: 'var(--butter)', borderBottom: '4px solid #151B3D', borderTopLeftRadius: '20px', borderTopRightRadius: '20px' }} />

            <div style={{ position: 'absolute', top: -14, left: 24, zIndex: 10 }}>
              <span 
                className="chip butter" 
                style={{ 
                  fontFamily: "'Fredoka', sans-serif", 
                  fontSize: 13,
                  border: '3.5px solid #151B3D',
                  boxShadow: '3px 3px 0px #151B3D',
                  background: 'var(--butter)',
                  color: '#151B3D',
                  fontWeight: 800,
                  padding: '6px 16px',
                }}
              >
                📦 ADVENTURE ARCHIVE
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24, width: '100%', flex: 1, justifyContent: 'center', marginTop: 8 }}>
              <div className="floaty" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 190 }}>
                <IllustratedChest />
              </div>

              <div style={{ textAlign: 'center', width: '100%', marginTop: 8 }}>
                <h2 style={{ fontSize: 26, fontWeight: 900, color: '#151B3D', fontFamily: "'Fredoka', sans-serif", marginBottom: 8, letterSpacing: '-0.01em' }}>
                  Case Library
                </h2>
                <p style={{ fontSize: 15, color: '#151B3D', fontWeight: 700, lineHeight: 1.6, marginBottom: 14, maxWidth: 240, margin: '0 auto', opacity: 0.9 }}>
                  Browse our complete clinical vault, unlock patient cases, and review archives.
                </p>
                <div style={{ display: 'flex', justifyContent: 'center', gap: 8, flexWrap: 'wrap', marginTop: 14 }}>
                  <span className="chip sky" style={{ fontFamily: "'Fredoka', sans-serif", border: '2.5px solid #151B3D', boxShadow: '2.5px 2.5px 0px #151B3D', color: '#151B3D', fontWeight: 800, padding: '5px 12px', fontSize: 12 }}>
                    📁 {totalAll} Total Cases
                  </span>
                  <span className="chip lav" style={{ fontFamily: "'Fredoka', sans-serif", border: '2.5px solid #151B3D', boxShadow: '2.5px 2.5px 0px #151B3D', color: '#151B3D', fontWeight: 800, padding: '5px 12px', fontSize: 12 }}>
                    🩺 24 Specialties
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              className="btn-plush primary btn-toy"
              style={{
                width: '100%',
                background: 'var(--butter)',
                color: '#151B3D',
                fontSize: 18,
                padding: '16px 0',
                fontFamily: "'Fredoka', sans-serif",
                fontWeight: 800,
                border: '3.5px solid #151B3D',
                borderRadius: 'var(--r-pill)',
                boxShadow: '0 5px 0px #151B3D !important',
              }}
            >
              📚 Open Case Vault →
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 12 }}>
          <button
            type="button"
            className="btn-plush ghost btn-toy"
            style={{ fontSize: 15, padding: '14px 32px', fontFamily: "'Fredoka', sans-serif", border: '3.5px solid #151B3D', boxShadow: '3px 3px 0px #151B3D' }}
            onMouseEnter={(e) => soundSystem.playHover(e.currentTarget)}
            onClick={() => {
              soundSystem.playClick();
              store.setScreen('mode');
            }}
          >
            ← Back to Wings
          </button>
        </div>
      </div>
    </div>
  );
}
