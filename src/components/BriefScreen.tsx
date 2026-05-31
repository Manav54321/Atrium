import { TopBar, Doodle } from './primitives';
import { Mascot, getPatientMascot } from './mascots';
import { getCase, getPatientCase } from '../data/cases';
import { store, useStore } from '../game/store';
import { soundSystem } from '../utils/audioSystem';

interface VitalCard {
  label: string;
  value: string;
  unit: string;
  color: string;
  lt: string;
  icon: string;
}

function buildVitals(p?: { hr: number; bp: string; spo2: number; temp: number; rr: number }): VitalCard[] {
  return [
    { label: 'HR', value: String(p?.hr ?? 88), unit: 'bpm', color: 'var(--rose)', lt: 'var(--rose-lt)', icon: '❤' },
    { label: 'BP', value: p?.bp ?? '120/80', unit: 'mmHg', color: 'var(--peach)', lt: 'var(--peach-lt)', icon: '⌥' },
    { label: 'RR', value: String(p?.rr ?? 16), unit: '/min', color: 'var(--sky)', lt: 'var(--sky-lt)', icon: '~' },
    { label: 'SpO₂', value: String(p?.spo2 ?? 98), unit: '%', color: 'var(--mint)', lt: 'var(--mint-lt)', icon: '○' },
    { label: 'Temp', value: (p?.temp ?? 36.7).toFixed(1), unit: '°C', color: 'var(--butter)', lt: 'var(--butter-lt)', icon: '☼' },
  ];
}

export function BriefScreen() {
  const caseId = useStore((s) => s.selectedCaseId);
  const c = getCase(caseId);
  const patient = getPatientCase(caseId);
  const VITALS = buildVitals(patient?.vitals);
  const chiefComplaint = patient?.chiefComplaint ?? c.complaint;
  const arrivalBlurb = patient?.arrivalBlurb ?? 'Looks well. No acute distress.';
  const severityChip =
    patient?.severity === 'critical'
      ? { label: 'Critical', tone: 'coral', color: 'var(--coral)', lt: 'var(--coral-lt)' }
      : patient?.severity === 'urgent'
        ? { label: 'Urgent', tone: 'peach', color: 'var(--peach)', lt: 'var(--peach-lt)' }
        : { label: 'Routine', tone: 'mint', color: 'var(--mint)', lt: 'var(--mint-lt)' };

  // Map case to correct cartoon mascot
  const pMascot = getPatientMascot({
    id: c.id,
    age: c.age,
    sex: c.sex,
    complaint: c.complaint,
    cond: c.cond,
  });

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
      <TopBar here={3} steps={['Polyclinic', 'GP', 'Case', 'Brief']} />

      {/* Whimsical Ambient World Decorations */}
      <div style={{ position: 'absolute', top: '5%', left: '5%', opacity: 0.25, zIndex: 0 }} className="drift-cloud">
        <Doodle kind="cloud" size={110} color="var(--sky-lt)" />
      </div>
      <div style={{ position: 'absolute', top: '10%', right: '8%', opacity: 0.25, zIndex: 0 }} className="drift-cloud">
        <Doodle kind="cloud" size={130} color="var(--mint-lt)" style={{ animationDelay: '1.5s' }} />
      </div>
      <div style={{ position: 'absolute', top: '35%', left: '3%', opacity: 0.45, zIndex: 0 }} className="wobble">
        <Doodle kind="star" size={32} color="var(--butter)" />
      </div>
      <div style={{ position: 'absolute', top: '55%', right: '4%', opacity: 0.4, zIndex: 0 }} className="drift">
        <Doodle kind="sparkle" size={28} color="var(--sky)" />
      </div>
      <div style={{ position: 'absolute', bottom: '12%', left: '4%', opacity: 0.45, zIndex: 0 }} className="wobble">
        <Doodle kind="heart" size={30} color="var(--rose)" />
      </div>
      <div style={{ position: 'absolute', bottom: '20%', right: '5%', opacity: 0.4, zIndex: 0 }} className="floaty">
        <Doodle kind="stetho" size={42} color="var(--mint)" />
      </div>

      <div
        style={{
          padding: '40px 24px 56px',
          display: 'grid',
          gridTemplateColumns: '1.32fr 1fr',
          gap: 28,
          maxWidth: 1100,
          margin: '0 auto',
          alignItems: 'start',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* ── LEFT: MISSION BRIEFS & DOSSIER ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Header */}
          <div>
            <div
              className="chip peach"
              style={{
                marginBottom: 12,
                fontSize: 13,
                padding: '6px 16px',
                fontFamily: "'Fredoka', sans-serif",
                border: '3px solid #151B3D',
                boxShadow: '2.5px 2.5px 0px #151B3D',
              }}
            >
              📋 MISSION DOSSIER BRIEFING
            </div>

            <h1
              style={{
                fontSize: 'clamp(36px, 4vw, 46px)',
                lineHeight: 1.05,
                fontFamily: "'Fredoka', sans-serif",
                fontWeight: 800,
                color: '#151B3D',
                marginBottom: 8,
              }}
            >
              {c.name}
            </h1>

            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <span className="chip sky" style={{ fontSize: 13, fontFamily: "'Fredoka', sans-serif", border: '2px solid #151B3D', boxShadow: '1.5px 1.5px 0px #151B3D' }}>
                {c.age}Y · {c.sex === 'F' ? 'Female' : 'Male'}
              </span>
              <span
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  background: severityChip.lt, border: `2.5px solid #151B3D`,
                  borderRadius: 'var(--r-pill)', padding: '5px 14px',
                  fontSize: 13, fontWeight: 800, color: '#151B3D',
                  fontFamily: "'Fredoka', sans-serif",
                  boxShadow: '1.5px 1.5px 0px #151B3D',
                }}
              >
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: severityChip.color, border: '1.5px solid #151B3D', display: 'inline-block' }} />
                {severityChip.label}
              </span>
              <span className="chip" style={{ fontSize: 13, fontFamily: "'Fredoka', sans-serif", border: '2px solid #151B3D', boxShadow: '1.5px 1.5px 0px #151B3D' }}>
                Chart #{caseId.substring(0, 4).toUpperCase()}
              </span>
            </div>
          </div>

          {/* Chief complaint speech bubble */}
          <div style={{ position: 'relative', marginBottom: 12 }}>
            <div
              style={{
                background: 'white',
                borderRadius: 'var(--r-xl)',
                padding: 24,
                border: '4px solid #151B3D',
                boxShadow: '4px 4px 0px #151B3D',
                position: 'relative',
              }}
            >
              <div
                style={{
                  position: 'absolute', top: 0, left: 0, right: 0, height: 8,
                  background: 'var(--peach)',
                  borderBottom: '4px solid #151B3D',
                }}
              />
              <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--ink-soft)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12, marginTop: 4, fontFamily: "'Fredoka', sans-serif" }}>
                💬 CHIEF COMPLAINT
              </div>
              <div
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  lineHeight: 1.55,
                  color: '#151B3D',
                  fontStyle: 'italic',
                  paddingLeft: 16,
                  borderLeft: '4px solid var(--peach)',
                  fontFamily: "'Fredoka', sans-serif",
                }}
              >
                "{chiefComplaint}"
              </div>
            </div>
            {/* Bubble arrow pointer */}
            <div
              style={{
                position: 'absolute',
                bottom: -10,
                left: 45,
                width: 20,
                height: 20,
                background: 'white',
                borderRight: '4px solid #151B3D',
                borderBottom: '4px solid #151B3D',
                transform: 'rotate(45deg)',
                zIndex: 1,
              }}
            />
          </div>

          {/* Clinical observation briefing */}
          <div
            style={{
              background: 'var(--mint-lt)',
              border: '3px solid #151B3D',
              borderRadius: 'var(--r-lg)',
              padding: '16px 20px',
              boxShadow: '3px 3px 0px #151B3D',
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 900, color: '#151B3D', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8, fontFamily: "'Fredoka', sans-serif" }}>
              👁️ Doorway Notes & Observation
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, lineHeight: 1.5, color: '#151B3D' }}>
              {arrivalBlurb}
            </div>
          </div>

          {/* Game objectives card */}
          <div
            style={{
              background: 'var(--butter-lt)',
              border: '4px solid #151B3D',
              borderRadius: 'var(--r-xl)',
              padding: '24px 28px',
              boxShadow: '4px 4px 0px #151B3D',
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 900, color: '#151B3D', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6, fontFamily: "'Fredoka', sans-serif" }}>
              🎯 CLINICAL QUEST OBJECTIVES
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[
                'Interrogate patient history using advanced interactive voice dialogue',
                'Order diagnostic labs, imaging panels and procedures in the examine interface',
                'Explain your definitive diagnosis and coordinate a consensus management plan',
              ].map((task, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    gap: 12,
                    alignItems: 'flex-start',
                  }}
                >
                  <div
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 6,
                      border: '2.5px solid #151B3D',
                      background: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      fontSize: 13,
                      fontWeight: 900,
                      color: 'var(--green-deep)',
                      boxShadow: '1.5px 1.5px 0px #151B3D',
                    }}
                  >
                    ✓
                  </div>
                  <div
                    style={{
                      fontSize: 16,
                      fontWeight: 800,
                      color: '#151B3D',
                      lineHeight: 1.4,
                      fontFamily: "'Fredoka', sans-serif",
                    }}
                  >
                    {task}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── RIGHT: PATIENT DOSSIER CARD & VITALS POWER METERS ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Patient Card dossier */}
          <div
            style={{
              background: 'white',
              borderRadius: 'var(--r-xl)',
              padding: '24px 24px 28px',
              border: '4px solid #151B3D',
              boxShadow: '6px 6px 0px #151B3D',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0,
              height: 110,
              background: 'var(--rose-lt)',
              borderBottom: '4px solid #151B3D',
            }} />

            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 20, paddingTop: 45, zIndex: 5, position: 'relative' }}>
              <div
                className="floaty"
                style={{
                  width: 136,
                  height: 136,
                  borderRadius: '50%',
                  background: 'white',
                  border: '4px solid #151B3D',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  overflow: 'hidden',
                  boxShadow: '4px 4px 0px #151B3D',
                }}
              >
                <Mascot name={pMascot} size={125} mood={c.mood} />
              </div>
              <div style={{ paddingBottom: 8 }}>
                <div style={{ fontWeight: 900, fontSize: 26, color: '#151B3D', fontFamily: "'Fredoka', sans-serif", lineHeight: 1.1 }}>
                  {c.name}
                </div>
                <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--ink-soft)', marginTop: 6, fontFamily: "'Fredoka', sans-serif" }}>
                  {c.age} yrs · {c.sex === 'F' ? 'Female' : 'Male'} · {c.cond}
                </div>
              </div>
            </div>
          </div>

          {/* Vitals power badge parameters */}
          <div
            style={{
              background: 'white',
              borderRadius: 'var(--r-xl)',
              padding: 20,
              border: '4px solid #151B3D',
              boxShadow: '4px 4px 0px #151B3D',
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 900, color: 'var(--ink-soft)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14, fontFamily: "'Fredoka', sans-serif" }}>
              🩺 PHYSIOLOGICAL GAUGES
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
              {VITALS.map((v) => (
                <div
                  key={v.label}
                  onMouseEnter={(e) => soundSystem.playCardHover(e.currentTarget)}
                  style={{
                    background: v.lt,
                    border: '3px solid #151B3D',
                    borderRadius: 18,
                    padding: '14px 4px',
                    textAlign: 'center',
                    boxShadow: '3px 3px 0px #151B3D',
                    transition: 'transform 0.1s ease',
                  }}
                  className="btn-toy"
                >
                  <div style={{ fontSize: 18, color: 'var(--ink)', marginBottom: 4 }}>{v.icon}</div>
                  <div
                    style={{
                      fontWeight: 800,
                      fontSize: 16,
                      lineHeight: 1.1,
                      color: '#151B3D',
                      fontFamily: "'Fredoka', sans-serif",
                    }}
                  >
                    {v.value}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#151B3D', marginTop: 4, textTransform: 'uppercase', fontFamily: "'Fredoka', sans-serif" }}>
                    {v.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quest target timing */}
          <div
            style={{
              background: 'white',
              borderRadius: 'var(--r-lg)',
              padding: '16px 20px',
              border: '3px solid #151B3D',
              boxShadow: '3px 3px 0px #151B3D',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--ink-soft)', textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: "'Fredoka', sans-serif" }}>
                Target Duration
              </div>
              <div style={{
                fontSize: 28, fontWeight: 800, color: 'var(--rose-deep)',
                fontFamily: "'Fredoka', sans-serif", marginTop: 2,
              }}>
                08:00
              </div>
            </div>
            <div style={{ display: 'flex', gap: 4, alignItems: 'flex-end' }}>
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  style={{
                    width: 8,
                    height: 12 + i * 4,
                    borderRadius: 4,
                    border: '1.5px solid #151B3D',
                    background: `hsl(${160 + i * 8}, 75%, 60%)`,
                  }}
                />
              ))}
            </div>
          </div>

          {/* Chunky knock CTA button */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <button
              type="button"
              className="btn-plush primary breathe btn-toy"
              style={{
                fontSize: 22,
                padding: '20px 0',
                borderRadius: 'var(--r-pill)',
                fontWeight: 900,
                fontFamily: "'Fredoka', sans-serif",
                width: '100%',
                background: 'var(--green)',
                color: '#ffffff',
                boxShadow: '0 8px 0px #151B3D !important',
                border: '4px solid #151B3D',
                letterSpacing: '0.04em',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => soundSystem.playHover(e.currentTarget)}
              onClick={() => {
                soundSystem.playClick();
                store.acceptNextPatient(caseId);
              }}
            >
              🚪 Knock & Enter Room →
            </button>

            <button
              type="button"
              className="btn-plush ghost btn-toy"
              style={{
                fontSize: 15,
                padding: '14px 0',
                fontFamily: "'Fredoka', sans-serif",
                width: '100%',
                color: '#151B3D',
                border: '3px solid #151B3D',
                borderRadius: 'var(--r-pill)',
                boxShadow: '0 4px 0px #151B3D !important',
                fontWeight: 800,
                marginTop: 8,
              }}
              onMouseEnter={(e) => soundSystem.playHover(e.currentTarget)}
              onClick={() => {
                soundSystem.playClick();
                store.setScreen('gpRoom');
              }}
            >
              ← Back to Reception
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
