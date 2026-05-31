import { Doodle, TopBar } from './primitives';
import { Mascot } from './mascots';
import { store } from '../game/store';
import { soundSystem } from '../utils/audioSystem';

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
  // Select mascot based on the wing type
  const mascotName = 
    kind === 'polyclinic' ? 'gp' :
    kind === 'emergency' ? 'emergency' :
    'scientist';

  return (
    <div
      className={available ? 'tap' : ''}
      onMouseEnter={(e) => {
        if (available) soundSystem.playCardHover(e.currentTarget);
      }}
      onClick={available ? () => {
        soundSystem.playClick();
        if (onOpen) onOpen();
      } : undefined}
      style={{
        width: 320,
        position: 'relative',
        cursor: available ? 'pointer' : 'default',
        transition: 'transform 200ms cubic-bezier(0.34, 1.56, 0.64, 1)',
      }}
    >
      <div
        style={{
          background: available ? '#ffffff' : '#F6F6FA',
          borderRadius: 'var(--r-xl)',
          border: '4px solid #151B3D',
          boxShadow: available
            ? '6px 6px 0px #151B3D'
            : '3px 3px 0px #151B3D',
          padding: 24,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 16,
          position: 'relative',
          overflow: 'hidden',
          height: 490,
          justifyContent: 'space-between',
        }}
      >
        {/* Top accent badge */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 12,
          background: accentColor,
          borderBottom: '4px solid #151B3D',
        }} />

        {/* Mascot Graphics illustration zone */}
        <div
          style={{
            width: '100%',
            height: 190,
            background: available ? accentLt : '#E8E8EE',
            borderRadius: 'var(--r-md)',
            border: '3px solid #151B3D',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            marginTop: 10,
            overflow: 'hidden',
            boxShadow: 'inset 0 0 12px rgba(21, 27, 61, 0.08)',
          }}
        >
          <div className={available ? 'floaty' : ''}>
            <Mascot name={mascotName} size={150} mood={kind === 'emergency' ? 'shocked' : 'happy'} />
          </div>
          {!available && (
            <div style={{
              position: 'absolute', top: 12, right: 12,
              background: '#ffffff',
              border: '2px solid #151B3D',
              borderRadius: 'var(--r-pill)',
              padding: '4px 12px',
              fontSize: 13, fontWeight: 800, color: '#151B3D',
              fontFamily: "'Fredoka', sans-serif",
              boxShadow: '1.5px 1.5px 0px #151B3D',
            }}>
              🔒 Locked
            </div>
          )}
          {available && (
            <div style={{
              position: 'absolute', top: 12, right: 12,
              background: 'var(--butter)',
              border: `2.5px solid #151B3D`,
              borderRadius: 'var(--r-pill)',
              padding: '4px 12px',
              fontSize: 13, fontWeight: 800,
              color: '#151B3D',
              fontFamily: "'Fredoka', sans-serif",
              boxShadow: '1.5px 1.5px 0px #151B3D',
            }}>
              ⭐ ACTIVE
            </div>
          )}
        </div>

        {/* Info */}
        <div style={{ textAlign: 'center', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', width: '100%', marginTop: 8 }}>
          <div>
            <h3 style={{ fontSize: 24, fontWeight: 850, marginBottom: 8, color: available ? '#151B3D' : '#151B3D', opacity: available ? 1 : 0.65, fontFamily: "'Fredoka', sans-serif" }}>
              {label}
            </h3>
            <p style={{ fontSize: 14, color: '#151B3D', lineHeight: 1.5, fontWeight: 700, margin: 0 }}>
              {sub}
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12 }}>
            {/* Tags */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 6, flexWrap: 'wrap' }}>
              {tags.map((t, i) => (
                <span
                  key={i}
                  style={{
                    background: available ? '#ffffff' : '#E8E8EE',
                    border: '2px solid #151B3D',
                    borderRadius: 'var(--r-pill)',
                    padding: '4px 10px',
                    fontSize: 13, fontWeight: 800,
                    color: '#151B3D',
                    fontFamily: "'Fredoka', sans-serif",
                    boxShadow: '1.5px 1.5px 0px #151B3D',
                  }}
                >
                  {t}
                </span>
              ))}
            </div>

            {/* Action label as collectible game button */}
            {available ? (
              <div style={{
                background: accentColor,
                border: '3px solid #151B3D',
                borderRadius: 'var(--r-pill)',
                padding: '10px 20px',
                fontSize: 14, fontWeight: 800,
                color: 'white',
                fontFamily: "'Fredoka', sans-serif",
                boxShadow: '3px 3px 0px #151B3D',
                marginTop: 4,
              }}>
                PLAY LEVEL →
              </div>
            ) : (
              <div style={{
                background: '#E8E8EE',
                border: '3px solid #151B3D',
                borderRadius: 'var(--r-pill)',
                padding: '10px 20px',
                fontSize: 13, fontWeight: 800,
                color: '#151B3D',
                opacity: 0.65,
                fontFamily: "'Fredoka', sans-serif",
                boxShadow: '1.5px 1.5px 0px #151B3D',
                marginTop: 4,
              }}>
                🔒 COMING SOON
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
          padding: '48px 24px 64px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 40,
          position: 'relative',
          minHeight: 'calc(100vh - 58px)',
        }}
      >
        {/* Ambient background vector doodles */}
        <div style={{ position: 'absolute', bottom: '15%', left: '5%' }} className="wobble">
          <Doodle kind="pill" size={54} color="var(--coral)" style={{ opacity: 0.5 }} />
        </div>
        <div style={{ position: 'absolute', bottom: '20%', right: '5%', animationDelay: '1s', opacity: 0.4 }} className="floaty">
          <Doodle kind="stetho" size={50} color="var(--mint)" />
        </div>
        <div style={{ position: 'absolute', top: '15%', left: '3%', opacity: 0.35 }} className="drift">
          <Doodle kind="sparkle" size={32} color="var(--butter)" />
        </div>
        <div style={{ position: 'absolute', top: '22%', right: '4%', animationDelay: '2s', opacity: 0.4 }} className="wobble">
          <Doodle kind="heart" size={38} color="var(--rose)" />
        </div>

        {/* Header */}
        <div style={{ textAlign: 'center', maxWidth: 640 }}>
          <div 
            className="chip butter" 
            style={{ 
              marginBottom: 16, 
              fontSize: 13, 
              padding: '6px 18px', 
              fontFamily: "'Fredoka', sans-serif",
              border: '3.5px solid #151B3D',
              boxShadow: '3px 3px 0px #151B3D',
            }}
          >
            ★ CLINICAL MAP LEVELS
          </div>
          
          <h1
            style={{
              fontSize: 'clamp(36px, 5vw, 52px)',
              lineHeight: 1.05,
              fontFamily: "'Fredoka', sans-serif",
              fontWeight: 700,
              letterSpacing: '-0.02em',
              color: '#151B3D',
              marginBottom: 14,
            }}
          >
            Choose your training wing
          </h1>
          <p style={{ fontSize: 16, fontWeight: 600, color: 'var(--ink-2)', lineHeight: 1.55, margin: 0 }}>
            Step through a polyclinic door and meet your next patient. Each wing brings a different clinical simulation environment.
          </p>
        </div>

        {/* Wing level collectible cards */}
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
            accentLt="var(--green-lt)"
            available
            tags={['Active now', '24 Specialties', '100+ Cases']}
            onOpen={() => store.setScreen('gpRoom')}
          />
          <WingCard
            kind="diagnostics"
            label="Diagnostics Hub"
            sub="Lab Core, Imaging Systems & Pharmacy — diagnostic reasoning practice"
            accentColor="var(--lav)"
            accentLt="var(--sky-lt)"
            tags={['Coming soon']}
          />
          <WingCard
            kind="emergency"
            label="Emergency Wing"
            sub="ED Triage, Resuscitation Bays & Critical Care — high-stakes scenarios"
            accentColor="var(--coral)"
            accentLt="var(--peach-lt)"
            tags={['Coming soon']}
          />
        </div>
      </div>
    </div>
  );
}
