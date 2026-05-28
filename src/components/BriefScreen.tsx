import { PatientFace, TopBar } from './primitives';
import { getCase, getPatientCase } from '../data/cases';
import { store, useStore, useTweaks } from '../game/store';

interface VitalCard {
  label: string;
  value: string;
  unit: string;
  color: string;
  icon: string;
}

function buildVitals(p?: { hr: number; bp: string; spo2: number; temp: number; rr: number }): VitalCard[] {
  return [
    { label: 'HR', value: String(p?.hr ?? 88), unit: 'bpm', color: 'var(--rose)', icon: '❤' },
    { label: 'BP', value: p?.bp ?? '120/80', unit: 'mmHg', color: 'var(--peach)', icon: '⌥' },
    { label: 'RR', value: String(p?.rr ?? 16), unit: '/min', color: 'var(--sky)', icon: '~' },
    { label: 'SpO₂', value: String(p?.spo2 ?? 98), unit: '%', color: 'var(--mint)', icon: '○' },
    { label: 'Temp', value: (p?.temp ?? 36.7).toFixed(1), unit: '°C', color: 'var(--butter)', icon: '☼' },
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
      ? { label: 'critical · resuscitate', tone: 'rose' }
      : patient?.severity === 'urgent'
        ? { label: 'urgent', tone: 'peach' }
        : { label: 'first presentation', tone: 'rose' };

  return (
    <div className="screen" style={{ position: 'relative', overflowY: 'auto' }}>
      <TopBar here={3} steps={['Polyclinic', 'GP', 'Case', 'Brief']} />

      {/* Friendly Brief Header Sign */}
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
        <span>📄 Consultation Briefing</span>
      </div>

      <div
        style={{
          padding: '24px 36px',
          display: 'grid',
          gridTemplateColumns: '1.2fr 1fr',
          gap: 32,
          maxWidth: 1120,
          margin: '0 auto',
          minHeight: 'calc(100vh - 80px)',
        }}
      >
        {/* LEFT: clinical datapad / clipboard */}
        <div
          className="plush-lg"
          style={{
            background: 'var(--paper)',
            padding: 32,
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxShadow: 'var(--plush)',
          }}
        >
          {/* Friendly Clipboard Clip */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: '50%',
              transform: 'translate(-50%, -40%)',
              height: 24,
              width: 120,
              background: 'var(--sky)',
              border: '3px solid var(--ink)',
              borderRadius: '8px 8px 0 0',
              boxShadow: 'var(--plush-sm)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div style={{ width: 16, height: 16, borderRadius: '50%', background: 'var(--paper)', border: '2px solid var(--ink)' }} />
          </div>

          <div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 20,
              }}
            >
              <span className="chip peach">DOORWAY BRIEFING</span>
              <span className="chip" style={{ fontFamily: 'Outfit, sans-serif' }}>
                Chart: #{caseId.substring(0, 4).toUpperCase()}
              </span>
            </div>

            <h1 style={{ fontSize: 36, lineHeight: 1.1, marginBottom: 6, fontWeight: 900 }}>
              {c.name}
            </h1>
            <div
              style={{
                fontWeight: 800,
                fontSize: 13,
                color: 'var(--peach)',
                marginBottom: 24,
              }}
            >
              {c.age} Y · {c.sex === 'F' ? 'Female' : 'Male'} · {c.cond.toUpperCase()}
            </div>

            {/* Chief Complaint Panel */}
            <div
              style={{
                background: 'var(--cream-2)',
                border: 'var(--stroke) solid var(--line)',
                borderRadius: 'var(--r-md)',
                padding: 18,
                marginBottom: 20,
                boxShadow: 'var(--plush-tiny)',
              }}
            >
              <div
                style={{
                  fontWeight: 900,
                  fontSize: 11,
                  color: 'var(--ink-soft)',
                  letterSpacing: '.05em',
                  textTransform: 'uppercase',
                  marginBottom: 6,
                }}
              >
                📝 Chief Complaint
              </div>
              <div
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  lineHeight: 1.4,
                  color: 'var(--ink)',
                  fontStyle: 'italic',
                }}
              >
                "{chiefComplaint}"
              </div>
            </div>

            {/* Arrival Notes Panel */}
            <div
              style={{
                background: 'var(--cream-2)',
                border: 'var(--stroke) solid var(--line)',
                borderRadius: 'var(--r-md)',
                padding: 16,
                marginBottom: 20,
              }}
            >
              <div
                style={{
                  fontWeight: 900,
                  fontSize: 11,
                  color: 'var(--ink-soft)',
                  letterSpacing: '.05em',
                  textTransform: 'uppercase',
                  marginBottom: 4,
                }}
              >
                👁️ Presentation & Observation
              </div>
              <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--ink-2)' }}>
                {arrivalBlurb}
              </div>
            </div>
          </div>

          {/* Directives / Task Panel */}
          <div
            style={{
              background: 'var(--sky-deep)',
              border: 'var(--stroke) solid var(--line)',
              borderRadius: 'var(--r-md)',
              padding: 18,
              boxShadow: 'var(--plush-tiny)',
            }}
          >
            <div
              style={{
                fontWeight: 900,
                fontSize: 11,
                color: 'var(--ink)',
                letterSpacing: '.05em',
                textTransform: 'uppercase',
                marginBottom: 8,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <span className="dot" style={{ background: 'var(--peach)' }} />
              OPERATIONAL DIRECTIVES
            </div>
            <ol
              style={{
                margin: 0,
                paddingLeft: 20,
                fontSize: 14,
                fontWeight: 600,
                lineHeight: 1.6,
                color: 'var(--ink)',
              }}
            >
              <li style={{ marginBottom: 4 }}>Synthesize a clinical case history via voice interface</li>
              <li style={{ marginBottom: 4 }}>Perform diagnostic physiological tests if indicated</li>
              <li>Formulate and align a shared care plan with the patient</li>
            </ol>
          </div>
        </div>

        {/* RIGHT: Vitals & Action */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24, justifyContent: 'space-between' }}>
          {/* Patient Persona Card */}
          <div
            className="plush"
            style={{
              background: 'rgba(255, 255, 255, 0.82)',
              border: 'var(--stroke-thick) solid var(--line)',
              padding: 20,
              position: 'relative',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 20,
              }}
            >
              <div
                style={{
                  position: 'relative',
                  width: 90,
                  height: 90,
                  borderRadius: '50%',
                  overflow: 'hidden',
                  background: 'var(--cream)',
                  border: 'var(--stroke) solid var(--line)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <PatientFace
                  style={tweaks.avatarStyle}
                  skin={c.skin}
                  hair={c.hair}
                  size={85}
                  mood={c.mood}
                  accessory={c.accessory}
                  gender={c.sex}
                  age={c.age}
                />
              </div>

              <div>
                <div style={{ fontWeight: 900, fontSize: 22, color: 'var(--ink)' }}>
                  {c.name.split(' ')[0]}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: 'var(--ink-soft)',
                    fontWeight: 700,
                  }}
                >
                  SIMULATION ENCOUNTER INITIALIZED
                </div>
                <div style={{ marginTop: 8 }} className={`chip ${severityChip.tone}`}>
                  {severityChip.label}
                </div>
              </div>
            </div>
          </div>

          {/* Vitals Panel */}
          <div className="plush" style={{ padding: 20, background: 'var(--paper)' }}>
            <div
              style={{
                fontWeight: 900,
                fontSize: 11,
                color: 'var(--ink-soft)',
                letterSpacing: '.05em',
                textTransform: 'uppercase',
                marginBottom: 12,
              }}
            >
              📊 Physiological Telemetry
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
              {VITALS.map((v) => (
                <div
                  key={v.label}
                  style={{
                    background: 'var(--cream)',
                    border: `var(--stroke-thick) solid ${v.color}`,
                    borderRadius: 'var(--r-sm)',
                    padding: '12px 4px',
                    textAlign: 'center',
                    boxShadow: 'var(--plush-tiny)',
                    transition: 'all 0.3s',
                  }}
                >
                  <div style={{ fontSize: 16, color: v.color, marginBottom: 4 }}>{v.icon}</div>
                  <div
                    style={{
                      fontWeight: 900,
                      fontSize: 18,
                      lineHeight: 1,
                      color: 'var(--ink)',
                      fontFamily: 'Outfit, sans-serif',
                    }}
                  >
                    {v.value}
                  </div>
                  <div
                    style={{
                      fontSize: 9,
                      fontWeight: 800,
                      color: 'var(--ink-2)',
                      marginTop: 4,
                      textTransform: 'uppercase',
                    }}
                  >
                    {v.label} <span style={{ color: 'var(--ink-soft)' }}>{v.unit}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Simulation Timer Indicator */}
          <div
            className="plush"
            style={{
              padding: 20,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'var(--paper)',
            }}
          >
            <div>
              <div
                style={{
                  fontWeight: 900,
                  fontSize: 11,
                  color: 'var(--ink-soft)',
                  letterSpacing: '.05em',
                  textTransform: 'uppercase',
                }}
              >
                SIMULATION LENGTH
              </div>
              <div
                style={{
                  fontSize: 32,
                  fontWeight: 900,
                  color: 'var(--rose)',
                  fontFamily: 'Outfit, sans-serif',
                }}
              >
                08:00
              </div>
            </div>
            <div style={{ display: 'flex', gap: 5 }}>
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  style={{
                    width: 8,
                    height: 28,
                    borderRadius: 4,
                    background: 'var(--mint)',
                    border: 'var(--stroke) solid var(--line)',
                  }}
                />
              ))}
            </div>
          </div>

          {/* Action Trigger */}
          <button
            type="button"
            className="btn-plush mint breathe"
            style={{
              fontSize: 18,
              padding: '20px 0',
              borderRadius: 14,
              border: 'var(--stroke-thick) solid var(--line)',
              fontWeight: 800,
              textTransform: 'uppercase',
            }}
            onClick={() => store.setScreen('encounter')}
          >
            🚪 KNOCK & ENTER CHAMBER
          </button>
        </div>
      </div>
    </div>
  );
}
