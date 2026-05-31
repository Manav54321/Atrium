import { useState, useMemo } from 'react';
import { TopBar } from './primitives';
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

function IllustratedFolder() {
  return (
    <svg width="130" height="130" viewBox="0 0 130 130">
      {/* Cartoon folder body */}
      <rect x="10" y="24" width="110" height="90" rx="16" fill="var(--butter)" stroke="#151B3D" strokeWidth="4" />
      <path d="M10 40 H120" stroke="#151B3D" strokeWidth="4" />
      <rect x="25" y="48" width="80" height="52" rx="10" fill="white" stroke="#151B3D" strokeWidth="3" />
      <line x1="38" y1="64" x2="92" y2="64" stroke="#151B3D" strokeWidth="3" strokeLinecap="round" />
      <line x1="38" y1="76" x2="80" y2="76" stroke="#151B3D" strokeWidth="3" strokeLinecap="round" />
      <circle cx="94" cy="84" r="10" fill="var(--coral)" stroke="#151B3D" strokeWidth="3" />
      <text x="94" y="88" textAnchor="middle" fontFamily="Fredoka" fontWeight="900" fontSize="10" fill="white">🩺</text>
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

  // Map incoming patient to their correct cartoon mascot
  const incomingMascot = next 
    ? getPatientMascot({ id: next.id, age: next.age, sex: next.sex, complaint: next.complaint, cond: next.cond })
    : 'officeWorker';

  return (
    <div className="screen" style={{ background: 'var(--bg)', position: 'relative', overflowY: 'auto' }}>
      <TopBar here={1} steps={['Polyclinic', 'GP']} />

      <div
        style={{
          padding: '32px 24px 56px',
          maxWidth: 1040,
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 28,
        }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center' }}>
          <div 
            className="chip mint" 
            style={{ 
              marginBottom: 14, 
              fontSize: 13, 
              padding: '6px 18px', 
              fontFamily: "'Fredoka', sans-serif",
              border: '3.5px solid #151B3D',
              boxShadow: '3px 3px 0px #151B3D',
            }}
          >
            🏥 PATIENT RECEPTION
          </div>
          <h1
            style={{
              fontSize: 'clamp(32px, 4.5vw, 48px)',
              lineHeight: 1.05,
              fontFamily: "'Fredoka', sans-serif",
              fontWeight: 700,
              color: '#151B3D',
              marginBottom: 10,
            }}
          >
            Who's next? 👨‍⚕️
          </h1>
          <p style={{ fontSize: 16, color: 'var(--ink-2)', fontWeight: 600, maxWidth: 520, margin: '0 auto', lineHeight: 1.55 }}>
            Welcome patients into your consult room, select a clinic department, or browse the case library.
          </p>
        </div>

        {/* Specialty picker in bold cartoon folder format */}
        <div
          style={{
            background: 'white',
            borderRadius: 'var(--r-xl)',
            border: pickerOpen ? '4px solid var(--mint)' : '4px solid #151B3D',
            boxShadow: pickerOpen
              ? '6px 6px 0px var(--mint)'
              : '4px 4px 0px #151B3D',
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
              padding: '18px 24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              fontFamily: "'Fredoka', sans-serif",
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 26 }}>{CLINIC_ICON[activeClinic]}</span>
              <span style={{ textAlign: 'left' }}>
                <span style={{ fontSize: 13, fontWeight: 800, color: '#151B3D', opacity: 0.8, display: 'block', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>
                  Selected Department
                </span>
                <span style={{ fontSize: 18, fontWeight: 850, color: '#151B3D' }}>
                  {CLINIC_LABELS[activeClinic]}
                </span>
              </span>
            </span>
            <span
              style={{
                width: 34, height: 34, borderRadius: '50%',
                background: pickerOpen ? 'var(--mint-lt)' : 'var(--cream)',
                border: '3px solid #151B3D',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 900, fontSize: 16, color: '#151B3D',
                transform: pickerOpen ? 'rotate(180deg)' : 'none',
                boxShadow: '1.5px 1.5px 0px #151B3D',
              }}
            >
              ▼
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
                borderTop: '3px solid #151B3D',
                paddingTop: 16,
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
                      gap: 6,
                      padding: '8px 14px',
                      borderRadius: 'var(--r-pill)',
                      border: '3px solid #151B3D',
                      background: isActive ? 'var(--mint-lt)' : '#ffffff',
                      fontSize: 13,
                      fontWeight: 800,
                      color: '#151B3D',
                      cursor: 'pointer',
                      boxShadow: isActive ? '3px 3px 0px #151B3D' : '1.5px 1.5px 0px #151B3D',
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

        {/* Two main options (Spotlight patient quest vs Browse archive) */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1.25fr 1fr',
            gap: 28,
            alignItems: 'start',
          }}
        >
          {/* LEFT COLUMN: HERO INTRO INCOMING PATIENT CASE */}
          <div
            className={`popin ${next ? 'breathe' : ''}`}
            style={{
              background: '#ffffff',
              borderRadius: 'var(--r-xl)',
              border: '4px solid #151B3D',
              boxShadow: next ? '6px 6px 0px #151B3D' : '3px 3px 0px #151B3D',
              padding: '32px 32px 28px',
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: 450,
              overflow: 'hidden',
            }}
          >
            {/* Colorful top header strip */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 12, background: 'var(--rose)', borderBottom: '4px solid #151B3D' }} />

            {/* Header Tag */}
            <div style={{ position: 'absolute', top: -14, left: 24, zIndex: 5 }}>
              <span 
                className="chip coral" 
                style={{ 
                  fontFamily: "'Fredoka', sans-serif", 
                  fontSize: 12,
                  border: '3.5px solid #151B3D',
                  boxShadow: '3px 3px 0px #151B3D',
                  background: 'var(--coral)',
                  color: '#ffffff',
                }}
              >
                PATIENT QUEST
              </span>
            </div>

            {next ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20, alignItems: 'center', width: '100%', marginTop: 8 }}>
                
                {/* Speech Bubble */}
                <div 
                  className="popin"
                  style={{
                    position: 'relative',
                    background: 'var(--cream-2)',
                    border: '3.5px solid #151B3D',
                    borderRadius: '24px',
                    padding: '16px 20px',
                    fontWeight: 800,
                    fontSize: 16,
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
                  <div style={{ position: 'absolute', bottom: -10, left: '50%', transform: 'translateX(-50%)', width: 0, height: 0, borderLeft: '10px solid transparent', borderRight: '10px solid transparent', borderTop: '12px solid #151B3D' }} />
                  <div style={{ position: 'absolute', bottom: -6, left: '50%', transform: 'translateX(-50%)', width: 0, height: 0, borderLeft: '9px solid transparent', borderRight: '9px solid transparent', borderTop: '10px solid var(--cream-2)' }} />
                </div>

                {/* Massive Patient Portrait Mascot */}
                <div 
                  className="floaty"
                  style={{ 
                    transform: 'scale(1.25)', 
                    height: 180, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    margin: '16px 0 8px' 
                  }}
                >
                  <Mascot name={incomingMascot} size={150} mood={next.mood} />
                </div>

                {/* Character Name & Stats */}
                <div style={{ textAlign: 'center', width: '100%' }}>
                  <h2 style={{ fontSize: 28, fontWeight: 850, color: '#151B3D', fontFamily: "'Fredoka', sans-serif", marginBottom: 6 }}>
                    {next.name}
                  </h2>
                  
                  {/* Collectible Stats pills */}
                  <div style={{ display: 'flex', justifyContent: 'center', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
                    <span className="chip sky" style={{ fontFamily: "'Fredoka', sans-serif", border: '2.5px solid #151B3D', boxShadow: '2px 2px 0px #151B3D', color: '#151B3D', fontWeight: 800 }}>
                      👤 {next.age} years old
                    </span>
                    <span className="chip lav" style={{ fontFamily: "'Fredoka', sans-serif", border: '2.5px solid #151B3D', boxShadow: '2px 2px 0px #151B3D', color: '#151B3D', fontWeight: 800 }}>
                      🧬 {next.sex === 'F' ? 'Female' : 'Male'}
                    </span>
                    <span className="chip coral" style={{ fontFamily: "'Fredoka', sans-serif", border: '2.5px solid #151B3D', boxShadow: '2px 2px 0px #151B3D', color: '#151B3D', fontWeight: 800 }}>
                      🚩 {next.cond}
                    </span>
                  </div>
                </div>

                {/* Chunky Invite Button */}
                <button
                  type="button"
                  className="btn-plush primary breathe btn-toy"
                  style={{
                    width: '100%',
                    background: 'var(--peach)',
                    color: '#ffffff',
                    fontSize: 18,
                    padding: '16px 0',
                    fontFamily: "'Fredoka', sans-serif",
                    marginTop: 10,
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
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center', justifyContent: 'center', flex: 1 }}>
                <span style={{ fontSize: 48 }}>🌈</span>
                <h2 style={{ fontSize: 22, fontWeight: 850, color: '#151B3D', fontFamily: "'Fredoka', sans-serif" }}>
                  Queue Empty
                </h2>
                <p style={{ fontSize: 16, color: '#151B3D', textAlign: 'center', maxWidth: 280, fontWeight: 700 }}>
                  No active simulation cases remaining in this specialty roster.
                </p>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: CASE LIBRARY NAVIGATION */}
          <div
            className="tap popin"
            onMouseEnter={(e) => soundSystem.playCardHover(e.currentTarget)}
            onClick={() => {
              soundSystem.playClick();
              store.setScreen('library');
            }}
            style={{
              background: 'white',
              borderRadius: 'var(--r-xl)',
              border: '4px solid #151B3D',
              boxShadow: '4px 4px 0px #151B3D',
              padding: '32px 28px 24px',
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'space-between',
              minHeight: 450,
              cursor: 'pointer',
              overflow: 'hidden',
            }}
          >
            {/* Colorful top header strip */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 12, background: 'var(--butter)', borderBottom: '4px solid #151B3D' }} />

            {/* Header tag */}
            <div style={{ position: 'absolute', top: -14, left: 24 }}>
              <span 
                className="chip butter" 
                style={{ 
                  fontFamily: "'Fredoka', sans-serif", 
                  fontSize: 12,
                  border: '3.5px solid #151B3D',
                  boxShadow: '3px 3px 0px #151B3D',
                  background: 'var(--butter)',
                  color: '#151B3D',
                  fontWeight: 800,
                }}
              >
                CASE ARCHIVE
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18, width: '100%', flex: 1, justifyContent: 'center', marginTop: 8 }}>
              <div className="floaty">
                <IllustratedFolder />
              </div>

              <div style={{ textAlign: 'center', width: '100%', marginTop: 8 }}>
                <h2 style={{ fontSize: 24, fontWeight: 850, color: '#151B3D', fontFamily: "'Fredoka', sans-serif", marginBottom: 6 }}>
                  Case Library
                </h2>
                <p style={{ fontSize: 14, color: '#151B3D', fontWeight: 700, lineHeight: 1.5, marginBottom: 12, maxWidth: 220, margin: '0 auto' }}>
                  Browse our complete clinic vault, choose a patient case, and manage them.
                </p>
                <div style={{ display: 'flex', justifyContent: 'center', gap: 6, flexWrap: 'wrap', marginTop: 12 }}>
                  <span className="chip sky" style={{ fontFamily: "'Fredoka', sans-serif", border: '2.5px solid #151B3D', boxShadow: '2px 2px 0px #151B3D', color: '#151B3D', fontWeight: 800 }}>
                    📁 {totalAll} Total Cases
                  </span>
                  <span className="chip lav" style={{ fontFamily: "'Fredoka', sans-serif", border: '2.5px solid #151B3D', boxShadow: '2px 2px 0px #151B3D', color: '#151B3D', fontWeight: 800 }}>
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
                fontSize: 16,
                padding: '14px 0',
                fontFamily: "'Fredoka', sans-serif",
              }}
            >
              📚 Browse Library →
            </button>
          </div>
        </div>

        {/* Back button */}
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 8 }}>
          <button
            type="button"
            className="btn-plush ghost btn-toy"
            style={{ fontSize: 14, padding: '12px 28px', fontFamily: "'Fredoka', sans-serif" }}
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
