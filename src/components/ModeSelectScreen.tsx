import { Doodle, TopBar } from './primitives';
import { store } from '../game/store';

interface DoorProps {
  label: string;
  sub: string;
  color: string;
  glowColor: string;
  available?: boolean;
  locked?: boolean;
  tags?: string[];
  onOpen?: () => void;
}

function DiagnosticPod({ label, sub, glowColor, available, locked, tags = [], onOpen }: DoorProps) {
  return (
    <div
      className={available ? 'tap' : ''}
      onClick={available ? onOpen : undefined}
      style={{
        width: 280,
        position: 'relative',
        filter: locked ? 'brightness(0.85)' : 'none',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      {/* Outer Chamber Frame */}
      <div
        className="plush-lg"
        style={{
          background: '#ffffff',
          border: `var(--stroke-thick) solid ${available ? 'var(--line)' : 'rgba(0, 0, 0, 0.08)'}`,
          borderRadius: 24,
          padding: 16,
          boxShadow: available ? `0 8px 24px rgba(${glowColor}, 0.08)` : 'none',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          height: 380,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Holographic Scan Screen */}
        <div
          style={{
            width: '100%',
            height: 160,
            background: 'var(--cream-2)',
            border: `var(--stroke) solid ${available ? 'var(--line)' : 'rgba(0,0,0,0.05)'}`,
            borderRadius: 16,
            marginBottom: 20,
            position: 'relative',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Grid lines inside display */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage: 'linear-gradient(var(--line) 0.5px, transparent 0.5px), linear-gradient(90deg, var(--line) 0.5px, transparent 0.5px)',
              backgroundSize: '12px 12px',
              opacity: 0.3,
            }}
          />

          {available ? (
            <div
              className="floaty"
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <Doodle kind="cross" size={48} color={`rgb(${glowColor})`} />
              <div 
                style={{ 
                  fontSize: 10, 
                  fontWeight: 900,
                  color: `rgb(${glowColor})`,
                }}
              >
                ✦ ACTIVE ✦
              </div>
            </div>
          ) : (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 8,
                opacity: 0.5,
              }}
            >
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--ink-2)" strokeWidth="2.5">
                <rect x="3" y="11" width="18" height="11" rx="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <div style={{ fontSize: 10, fontWeight: 900, color: 'var(--ink-soft)' }}>
                ✦ RESTRICTED ✦
              </div>
            </div>
          )}
        </div>

        {/* Info Deck */}
        <div style={{ textAlign: 'center', width: '100%', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ fontSize: 22, fontWeight: 900, marginBottom: 6, color: 'var(--ink)' }}>{label}</h3>
            <div style={{ fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.4, fontWeight: 600 }}>{sub}</div>
          </div>

          {/* Action indicator */}
          <div 
            style={{ 
              fontSize: 11, 
              color: available ? 'var(--peach)' : 'var(--ink-soft)',
              fontWeight: 800,
              background: 'var(--cream)',
              padding: '6px 12px',
              borderRadius: 'var(--r-sm)',
              border: 'var(--stroke) solid var(--line)',
              marginTop: 10
            }}
          >
            {available ? '▸ OPEN FOR TRAINING' : '🔒 COMING SOON'}
          </div>
        </div>
      </div>

      {/* Specialty Chips */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 16, flexWrap: 'wrap' }}>
        {tags.map((t, i) => (
          <span key={i} className={`chip ${available ? 'peach' : ''}`}>
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}

export function ModeSelectScreen() {
  return (
    <div className="screen" style={{ background: 'var(--cream)', overflowY: 'auto' }}>
      <TopBar here={0} showProfile />

      {/* Control Desk Content */}
      <div 
        style={{ 
          padding: '48px 24px', 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          gap: 40,
          position: 'relative',
          minHeight: 'calc(100vh - 67px)'
        }}
      >
        {/* Sector telemetries */}
        <div style={{ textAlign: 'center', maxWidth: 680 }}>
          <span className="chip butter" style={{ marginBottom: 12 }}>
            ★ SIMULATION WINGS
          </span>
          <h1 style={{ fontSize: 44, lineHeight: 1.1, marginBottom: 10 }}>Select Simulation Wing</h1>
          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink-2)' }}>
            Select a simulation wing to begin your clinical training and review diagnostics.
          </div>
        </div>

        {/* The Diagnostic Pod Deck */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: 40,
            flexWrap: 'wrap',
            zIndex: 10,
            width: '100%',
            maxWidth: 1000,
          }}
        >
          <DiagnosticPod
            label="Polyclinics"
            sub="General Outpatients — Specialty Consultation Decks"
            color="var(--mint)"
            glowColor="132, 210, 196"
            available
            tags={['Active now', '24 Specialties']}
            onOpen={() => store.setScreen('gpRoom')}
          />
          <DiagnosticPod
            label="Diagnostics Hub"
            sub="Lab Core, Imaging Systems & Pharmacy Telemetries"
            color="var(--sky)"
            glowColor="156, 180, 204"
            locked
            tags={['Coming soon']}
          />
          <DiagnosticPod
            label="Emergency Wing"
            sub="ED Triage Stations, Resuscitation & Critical Care Pods"
            color="var(--rose)"
            glowColor="244, 122, 146"
            locked
            tags={['Coming soon']}
          />
        </div>

        {/* Ambient floating elements */}
        <div style={{ position: 'absolute', bottom: 30, left: '8%' }} className="wobble">
          <Doodle kind="pill" size={54} color="var(--peach)" />
        </div>
        <div style={{ position: 'absolute', bottom: 50, right: '10%' }} className="floaty">
          <Doodle kind="stetho" size={48} color="var(--peach-deep)" />
        </div>
      </div>
    </div>
  );
}
