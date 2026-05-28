import { PatientFace, TopBar } from './primitives';
import { getCase, getPatientCase } from '../data/cases';
import { store, useStore, useTweaks } from '../game/store';

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
  const tweaks = useTweaks();
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

  return (
    <div className="screen" style={{ background: 'var(--bg)', position: 'relative', overflowY: 'auto' }}>
      <TopBar here={3} steps={['Polyclinic', 'GP', 'Case', 'Brief']} />

      <div
        style={{
          padding: '32px 36px 48px',
          display: 'grid',
          gridTemplateColumns: '1.25fr 1fr',
          gap: 28,
          maxWidth: 1100,
          margin: '0 auto',
        }}
      >
        {/* ── LEFT: Clinical datapad ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

          {/* Header */}
          <div>
            <div className="chip peach" style={{ marginBottom: 12, fontSize: 12, padding: '6px 16px', fontFamily: "'Nunito', sans-serif" }}>
              📋 Doorway Briefing
            </div>
            <h1
              style={{
                fontSize: 'clamp(36px, 4vw, 48px)',
                lineHeight: 1.05,
                fontFamily: "'Nunito', sans-serif",
                fontWeight: 900,
                letterSpacing: '-0.02em',
                marginBottom: 8,
              }}
            >
              {c.name}
            </h1>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 4 }}>
              <span className="chip sky" style={{ fontSize: 12, fontFamily: "'Nunito', sans-serif" }}>
                {c.age}Y · {c.sex === 'F' ? 'Female' : 'Male'}
              </span>
              <span
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  background: severityChip.lt, border: `1.5px solid ${severityChip.color}`,
                  borderRadius: 'var(--r-pill)', padding: '4px 14px',
                  fontSize: 12, fontWeight: 800, color: 'var(--ink)',
                  fontFamily: "'Nunito', sans-serif",
                }}
              >
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: severityChip.color, display: 'inline-block' }} />
                {severityChip.label}
              </span>
              <span className="chip" style={{ fontSize: 11, fontFamily: "'Nunito', sans-serif" }}>
                Chart #{caseId.substring(0, 4).toUpperCase()}
              </span>
            </div>
          </div>

          {/* Speech bubble — chief complaint */}
          <div
            style={{
              background: 'white',
              borderRadius: 'var(--r-xl)',
              padding: 24,
              border: '2px solid var(--line)',
              boxShadow: '0 4px 20px rgba(26,26,46,0.06)',
              position: 'relative',
            }}
          >
            <div
              style={{
                position: 'absolute', top: -1, left: 0, right: 0, height: 4,
                background: 'linear-gradient(90deg, var(--coral) 0%, var(--peach) 50%, var(--butter) 100%)',
                borderRadius: '32px 32px 0 0',
              }}
            />
            <div style={{ fontSize: 11, fontWeight: 900, color: 'var(--ink-soft)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12, marginTop: 2 }}>
              💬 Chief Complaint
            </div>
            <div
              style={{
                fontSize: 18,
                fontWeight: 700,
                lineHeight: 1.5,
                color: 'var(--ink)',
                fontStyle: 'italic',
                paddingLeft: 16,
                borderLeft: '3.5px solid var(--peach)',
              }}
            >
              "{chiefComplaint}"
            </div>
          </div>

          {/* Arrival notes */}
          <div
            style={{
              background: 'var(--bg-mint)',
              border: '1.5px solid var(--mint)',
              borderRadius: 'var(--r-lg)',
              padding: '16px 20px',
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 900, color: 'var(--mint-deep)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
              👁️ Presentation & Observation
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.5, color: 'var(--ink-2)' }}>
              {arrivalBlurb}
            </div>
          </div>

          {/* Directives panel */}
          <div
            style={{
              background: 'linear-gradient(135deg, var(--sky-lt) 0%, var(--lav-lt) 100%)',
              border: '2px solid var(--sky)',
              borderRadius: 'var(--r-lg)',
              padding: '18px 22px',
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 900, color: 'var(--sky-deep)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--sky)', display: 'inline-block' }} />
              Your Objectives
            </div>
            <ol style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                'Take a full clinical history through voice',
                'Perform diagnostic tests if clinically indicated',
                'Agree a shared management plan with the patient',
              ].map((task, i) => (
                <li
                  key={i}
                  style={{
                    fontSize: 14, fontWeight: 700,
                    color: 'var(--ink)',
                    lineHeight: 1.5,
                    paddingLeft: 6,
                  }}
                >
                  {task}
                </li>
              ))}
            </ol>
          </div>
        </div>

        {/* ── RIGHT: Patient persona + Vitals + CTA ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Patient persona card */}
          <div
            className="popin"
            style={{
              background: 'white',
              borderRadius: 'var(--r-xl)',
              padding: 24,
              border: '2px solid var(--line)',
              boxShadow: '0 8px 30px rgba(26,26,46,0.08)',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Gradient top */}
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0,
              height: 80,
              background: 'linear-gradient(135deg, var(--peach-lt) 0%, var(--rose-lt) 100%)',
              pointerEvents: 'none',
            }} />

            <div style={{ position: 'relative', display: 'flex', alignItems: 'flex-end', gap: 18, paddingTop: 8 }}>
              <div
                className="floaty"
                style={{
                  width: 110,
                  height: 110,
                  borderRadius: '50%',
                  background: 'white',
                  border: '3px solid white',
                  boxShadow: '0 8px 24px rgba(26,26,46,0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  overflow: 'hidden',
                }}
              >
                <PatientFace
                  style={tweaks.avatarStyle}
                  skin={c.skin}
                  hair={c.hair}
                  size={105}
                  mood={c.mood}
                  accessory={c.accessory}
                  gender={c.sex}
                  age={c.age}
                />
              </div>
              <div style={{ paddingBottom: 4 }}>
                <div style={{ fontWeight: 900, fontSize: 26, color: 'var(--ink)', fontFamily: "'Nunito', sans-serif", lineHeight: 1 }}>
                  {c.name.split(' ')[0]}
                </div>
                <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--ink-soft)', marginTop: 4 }}>
                  {c.age} years · {c.sex === 'F' ? 'Female' : 'Male'} · {c.cond}
                </div>
                <div style={{ marginTop: 10 }}>
                  <span
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 5,
                      background: 'var(--mint-lt)', border: '1.5px solid var(--mint)',
                      borderRadius: 'var(--r-pill)', padding: '4px 12px',
                      fontSize: 11, fontWeight: 800, color: 'var(--mint-deep)',
                      fontFamily: "'Nunito', sans-serif",
                    }}
                  >
                    <span className="breathe" style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--mint)', display: 'inline-block' }} />
                    Ready for Encounter
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Vitals grid */}
          <div
            style={{
              background: 'white',
              borderRadius: 'var(--r-xl)',
              padding: 20,
              border: '1.5px solid var(--line)',
              boxShadow: '0 4px 16px rgba(26,26,46,0.06)',
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 900, color: 'var(--ink-soft)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>
              📊 Physiological Telemetry
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
              {VITALS.map((v) => (
                <div
                  key={v.label}
                  style={{
                    background: v.lt,
                    border: `2px solid ${v.color}`,
                    borderRadius: 16,
                    padding: '12px 4px',
                    textAlign: 'center',
                    transition: 'all 0.3s',
                  }}
                >
                  <div style={{ fontSize: 16, color: v.color, marginBottom: 4 }}>{v.icon}</div>
                  <div
                    style={{
                      fontWeight: 900,
                      fontSize: 17,
                      lineHeight: 1,
                      color: 'var(--ink)',
                      fontFamily: "'Nunito', sans-serif",
                    }}
                  >
                    {v.value}
                  </div>
                  <div style={{ fontSize: 9, fontWeight: 800, color: 'var(--ink-2)', marginTop: 4, textTransform: 'uppercase' }}>
                    {v.label} <span style={{ color: 'var(--ink-soft)' }}>{v.unit}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Simulation time */}
          <div
            style={{
              background: 'white',
              borderRadius: 'var(--r-lg)',
              padding: '16px 20px',
              border: '1.5px solid var(--line)',
              boxShadow: '0 2px 10px rgba(26,26,46,0.05)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--ink-soft)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Target Duration
              </div>
              <div style={{
                fontSize: 30, fontWeight: 900, color: 'var(--rose)',
                fontFamily: "'Nunito', sans-serif", marginTop: 2,
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
                    background: `hsl(${160 + i * 8}, 65%, ${68 - i * 4}%)`,
                  }}
                />
              ))}
            </div>
          </div>

          {/* CTA */}
          <button
            type="button"
            className="btn-plush primary breathe"
            style={{
              fontSize: 18,
              padding: '20px 0',
              borderRadius: 'var(--r-xl)',
              fontWeight: 900,
              fontFamily: "'Nunito', sans-serif",
              width: '100%',
            }}
            onClick={() => store.acceptNextPatient(caseId)}
          >
            🚪 Knock & Enter Room →
          </button>

          <button
            type="button"
            className="btn-plush ghost"
            style={{ fontSize: 14, padding: '12px 0', fontFamily: "'Nunito', sans-serif", width: '100%' }}
            onClick={() => store.setScreen('gpRoom')}
          >
            ← Back to Reception
          </button>
        </div>
      </div>
    </div>
  );
}
