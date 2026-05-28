import { Doodle, TopBar } from './primitives';
import { store } from '../game/store';

function PolyclinicCard() {
  return (
    <svg width="110" height="110" viewBox="0 0 110 110" style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id="pcBldg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#E3F6F5" />
          <stop offset="100%" stopColor="#B3E5F0" />
        </linearGradient>
      </defs>
      {/* Shadow */}
      <ellipse cx="55" cy="106" rx="42" ry="7" fill="rgba(78,205,196,0.18)" />
      {/* Main building */}
      <rect x="16" y="36" width="78" height="68" rx="10" fill="url(#pcBldg)" stroke="rgba(74,74,106,0.14)" strokeWidth="2" />
      {/* Roof */}
      <rect x="28" y="22" width="54" height="22" rx="7" fill="#A8EDE9" stroke="rgba(74,74,106,0.14)" strokeWidth="2" />
      {/* Roof line */}
      <path d="M10 37 H100" stroke="rgba(74,74,106,0.12)" strokeWidth="3" strokeLinecap="round" />
      {/* Cross sign on top */}
      <rect x="44" y="6" width="22" height="22" rx="5" fill="white" stroke="rgba(74,74,106,0.14)" strokeWidth="1.5" />
      <rect x="51" y="10" width="8" height="14" rx="2" fill="#FF6B6B" />
      <rect x="47" y="14" width="16" height="6" rx="2" fill="#FF6B6B" />
      {/* Windows row 1 */}
      <rect x="24" y="48" width="18" height="18" rx="4" fill="#FFE599" stroke="rgba(74,74,106,0.1)" strokeWidth="1.5" />
      <rect x="46" y="48" width="18" height="18" rx="4" fill="#FFD4DC" stroke="rgba(74,74,106,0.1)" strokeWidth="1.5" />
      <rect x="68" y="48" width="18" height="18" rx="4" fill="#D8D1FF" stroke="rgba(74,74,106,0.1)" strokeWidth="1.5" />
      {/* Door */}
      <rect x="40" y="74" width="30" height="30" rx="5" fill="#4ECDC4" stroke="rgba(74,74,106,0.12)" strokeWidth="1.5" />
      <circle cx="64" cy="90" r="2.5" fill="white" />
      {/* Door arch */}
      <path d="M40 86 A15 15 0 0 1 70 86" fill="#2BB5AB" />
    </svg>
  );
}

function DiagnosticsCard() {
  return (
    <svg width="110" height="110" viewBox="0 0 110 110" style={{ overflow: 'visible', opacity: 0.55 }}>
      <ellipse cx="55" cy="106" rx="40" ry="6" fill="rgba(155,137,255,0.12)" />
      <path d="M15 100 A40 40 0 0 1 95 100 Z" fill="#EBF3EB" stroke="rgba(74,74,106,0.14)" strokeWidth="2.5" />
      <rect x="10" y="94" width="90" height="14" rx="5" fill="#D8D1FF" stroke="rgba(74,74,106,0.12)" strokeWidth="2" />
      <circle cx="44" cy="78" r="9" fill="#FFE599" stroke="rgba(74,74,106,0.1)" strokeWidth="1.5" />
      <circle cx="66" cy="78" r="9" fill="#B3E5F0" stroke="rgba(74,74,106,0.1)" strokeWidth="1.5" />
      <line x1="55" y1="60" x2="55" y2="30" stroke="rgba(74,74,106,0.2)" strokeWidth="3" strokeLinecap="round" />
      <circle cx="55" cy="26" r="8" fill="#9B89FF" stroke="rgba(74,74,106,0.12)" strokeWidth="1.5" />
    </svg>
  );
}

function EmergencyCard() {
  return (
    <svg width="110" height="110" viewBox="0 0 110 110" style={{ overflow: 'visible', opacity: 0.55 }}>
      <ellipse cx="55" cy="106" rx="40" ry="6" fill="rgba(255,143,163,0.12)" />
      <rect x="16" y="44" width="78" height="60" rx="10" fill="#FFE8E8" stroke="rgba(74,74,106,0.12)" strokeWidth="2" />
      <rect x="30" y="68" width="50" height="36" rx="4" fill="#FFD4B3" stroke="rgba(74,74,106,0.1)" strokeWidth="1.5" />
      <rect x="44" y="18" width="22" height="30" rx="4" fill="white" stroke="rgba(74,74,106,0.12)" strokeWidth="1.5" />
      <path d="M55 24 V42 M48 33 H62" stroke="#FF6B6B" strokeWidth="3" strokeLinecap="round" />
      <circle cx="55" cy="12" r="6" fill="#FFA07A" stroke="rgba(74,74,106,0.1)" strokeWidth="1.5" />
    </svg>
  );
}

interface WingCardProps {
  kind: 'polyclinic' | 'diagnostics' | 'emergency';
  label: string;
  sub: string;
  tags: string[];
  available?: boolean;
  accentColor: string;
  accentLt: string;
  onOpen?: () => void;
}

function WingCard({ kind, label, sub, tags, available, accentColor, accentLt, onOpen }: WingCardProps) {
  return (
    <div
      className={available ? 'tap' : ''}
      onClick={available ? onOpen : undefined}
      style={{
        width: 300,
        position: 'relative',
        transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
        cursor: available ? 'pointer' : 'default',
      }}
    >
      <div
        style={{
          background: available ? 'white' : 'rgba(255,255,255,0.7)',
          borderRadius: 'var(--r-xl)',
          border: `2px solid ${available ? accentColor : 'rgba(74,74,106,0.1)'}`,
          boxShadow: available
            ? `0 12px 40px ${accentColor}28, 0 4px 12px rgba(26,26,46,0.06)`
            : '0 4px 16px rgba(26,26,46,0.05)',
          padding: 24,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 16,
          position: 'relative',
          overflow: 'hidden',
          height: 420,
          justifyContent: 'space-between',
        }}
      >
        {/* Top accent gradient */}
        {available && (
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: 6,
            background: `linear-gradient(90deg, ${accentColor} 0%, ${accentLt} 100%)`,
            borderRadius: '32px 32px 0 0',
          }} />
        )}

        {/* Building illustration zone */}
        <div
          style={{
            width: '100%',
            height: 170,
            background: available ? `linear-gradient(160deg, ${accentLt}60 0%, rgba(255,248,245,0.6) 100%)` : 'rgba(74,74,106,0.04)',
            borderRadius: 18,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            marginTop: available ? 8 : 0,
            overflow: 'hidden',
          }}
        >
          <div className={available ? 'floaty' : ''}>
            {kind === 'polyclinic' && <PolyclinicCard />}
            {kind === 'diagnostics' && <DiagnosticsCard />}
            {kind === 'emergency' && <EmergencyCard />}
          </div>
          {!available && (
            <div style={{
              position: 'absolute', top: 12, right: 12,
              background: 'rgba(74,74,106,0.08)',
              borderRadius: 'var(--r-pill)',
              padding: '4px 10px',
              fontSize: 11, fontWeight: 800, color: 'var(--ink-soft)',
              fontFamily: "'Nunito', sans-serif",
            }}>
              🔒 Locked
            </div>
          )}
          {available && (
            <div style={{
              position: 'absolute', top: 12, right: 12,
              background: accentLt,
              border: `1.5px solid ${accentColor}`,
              borderRadius: 'var(--r-pill)',
              padding: '4px 10px',
              fontSize: 11, fontWeight: 800,
              color: 'var(--ink)',
              fontFamily: "'Nunito', sans-serif",
            }}>
              ✦ Live
            </div>
          )}
        </div>

        {/* Info */}
        <div style={{ textAlign: 'center', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', width: '100%' }}>
          <div>
            <h3 style={{ fontSize: 22, fontWeight: 900, marginBottom: 8, color: available ? 'var(--ink)' : 'var(--ink-soft)', fontFamily: "'Nunito', sans-serif" }}>
              {label}
            </h3>
            <p style={{ fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.5, fontWeight: 600, margin: 0 }}>
              {sub}
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 14 }}>
            {/* Tags */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 6, flexWrap: 'wrap' }}>
              {tags.map((t, i) => (
                <span
                  key={i}
                  style={{
                    background: available ? accentLt : 'rgba(74,74,106,0.06)',
                    border: `1.5px solid ${available ? accentColor : 'rgba(74,74,106,0.1)'}`,
                    borderRadius: 'var(--r-pill)',
                    padding: '4px 12px',
                    fontSize: 11, fontWeight: 800,
                    color: available ? 'var(--ink)' : 'var(--ink-soft)',
                    fontFamily: "'Nunito', sans-serif",
                  }}
                >
                  {t}
                </span>
              ))}
            </div>

            {/* Action label */}
            {available ? (
              <div style={{
                background: `linear-gradient(135deg, ${accentColor} 0%, ${accentLt} 100%)`,
                borderRadius: 'var(--r-pill)',
                padding: '10px 20px',
                fontSize: 14, fontWeight: 900,
                color: 'white',
                fontFamily: "'Nunito', sans-serif",
                textShadow: '0 1px 2px rgba(0,0,0,0.1)',
                boxShadow: `0 4px 16px ${accentColor}44`,
              }}>
                Open for Training →
              </div>
            ) : (
              <div style={{
                background: 'rgba(74,74,106,0.06)',
                borderRadius: 'var(--r-pill)',
                padding: '10px 20px',
                fontSize: 13, fontWeight: 700,
                color: 'var(--ink-soft)',
                fontFamily: "'Nunito', sans-serif",
              }}>
                🔒 Coming Soon
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function ModeSelectScreen() {
  return (
    <div className="screen" style={{ background: 'var(--bg)', overflowY: 'auto' }}>
      <TopBar here={0} showProfile />

      <div
        style={{
          padding: '56px 24px 64px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 48,
          position: 'relative',
          minHeight: 'calc(100vh - 58px)',
        }}
      >
        {/* Ambient doodles */}
        <div style={{ position: 'absolute', bottom: '12%', left: '4%' }} className="wobble">
          <Doodle kind="pill" size={58} color="var(--coral)" style={{ opacity: 0.55 }} />
        </div>
        <div style={{ position: 'absolute', bottom: '16%', right: '5%', animationDelay: '1s', opacity: 0.5 }} className="floaty">
          <Doodle kind="stetho" size={52} color="var(--mint)" />
        </div>
        <div style={{ position: 'absolute', top: '18%', left: '3%', opacity: 0.35 }} className="drift">
          <Doodle kind="sparkle" size={36} color="var(--butter)" />
        </div>
        <div style={{ position: 'absolute', top: '25%', right: '4%', animationDelay: '2s', opacity: 0.4 }} className="wobble">
          <Doodle kind="heart" size={40} color="var(--rose)" />
        </div>

        {/* Header */}
        <div style={{ textAlign: 'center', maxWidth: 640 }}>
          <div className="chip butter" style={{ marginBottom: 16, fontSize: 12, padding: '6px 18px', fontFamily: "'Nunito', sans-serif" }}>
            ★ Simulation Wings
          </div>
          <h1
            style={{
              fontSize: 'clamp(36px, 5vw, 56px)',
              lineHeight: 1.05,
              fontFamily: "'Nunito', sans-serif",
              fontWeight: 900,
              letterSpacing: '-0.02em',
              marginBottom: 14,
            }}
          >
            Select your training wing
          </h1>
          <p style={{ fontSize: 16, fontWeight: 600, color: 'var(--ink-2)', lineHeight: 1.55, margin: 0 }}>
            Step through a polyclinic door and meet your next patient. Each wing brings a different clinical environment.
          </p>
        </div>

        {/* Wing cards */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: 28,
            flexWrap: 'wrap',
            zIndex: 10,
            width: '100%',
            maxWidth: 1060,
          }}
        >
          <WingCard
            kind="polyclinic"
            label="Polyclinics"
            sub="General Outpatients — Specialty Consultation Rooms across 24 departments"
            accentColor="var(--mint)"
            accentLt="var(--mint-lt)"
            available
            tags={['Active now', '24 Specialties', '100+ Cases']}
            onOpen={() => store.setScreen('gpRoom')}
          />
          <WingCard
            kind="diagnostics"
            label="Diagnostics Hub"
            sub="Lab Core, Imaging Systems & Pharmacy — diagnostic reasoning practice"
            accentColor="var(--lav)"
            accentLt="var(--lav-lt)"
            tags={['Coming soon']}
          />
          <WingCard
            kind="emergency"
            label="Emergency Wing"
            sub="ED Triage, Resuscitation Bays & Critical Care — high-stakes scenarios"
            accentColor="var(--coral)"
            accentLt="var(--coral-lt)"
            tags={['Coming soon']}
          />
        </div>
      </div>
    </div>
  );
}
