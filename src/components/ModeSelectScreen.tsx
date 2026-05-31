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
      className={available ? 'active-wing-card tap' : 'locked-wing-card'}
      onMouseEnter={(e) => {
        if (available) soundSystem.playCardHover(e.currentTarget);
      }}
      onClick={available ? () => {
        soundSystem.playClick();
        if (onOpen) onOpen();
      } : undefined}
      style={{
        width: 380,
        position: 'relative',
        cursor: available ? 'pointer' : 'default',
      }}
    >
      <div
        style={{
          background: available ? '#ffffff' : '#F6F6FA',
          borderRadius: 'var(--r-xl)',
          border: '4px solid #151B3D',
          boxShadow: available
            ? '8px 8px 0px #151B3D'
            : '4px 4px 0px #151B3D',
          padding: 28,
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          overflow: 'hidden',
          height: 580,
          justifyContent: 'space-between',
        }}
      >
        {/* Top accent badge */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 14,
          background: accentColor,
          borderBottom: '4px solid #151B3D',
        }} />

        {/* Mascot Graphics illustration zone */}
        <div
          style={{
            width: '100%',
            height: 260,
            background: accentLt,
            borderRadius: 'var(--r-md)',
            border: '3px solid #151B3D',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            marginTop: 12,
            overflow: 'hidden',
            boxShadow: 'inset 0 0 16px rgba(21, 27, 61, 0.08)',
          }}
        >
          <div className={available ? 'floaty' : ''} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Mascot name={mascotName} size={225} mood={kind === 'emergency' ? 'shocked' : 'happy'} />
          </div>
          {!available && (
            <div style={{
              position: 'absolute', top: 12, right: 12,
              background: '#EAEAEA',
              border: '2.5px solid #151B3D',
              borderRadius: 'var(--r-pill)',
              padding: '5px 14px',
              fontSize: 13, fontWeight: 800, color: '#151B3D',
              fontFamily: "'Fredoka', sans-serif",
              boxShadow: '2px 2px 0px #151B3D',
              zIndex: 2,
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
              padding: '5px 14px',
              fontSize: 13, fontWeight: 800,
              color: '#151B3D',
              fontFamily: "'Fredoka', sans-serif",
              boxShadow: '2px 2px 0px #151B3D',
              zIndex: 2,
            }}>
              ⭐ ACTIVE
            </div>
          )}
        </div>

        {/* Info & Description */}
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          justifyContent: 'space-between', 
          flex: 1, 
          width: '100%', 
          marginTop: 20 
        }}>
          {/* Text content area */}
          <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 10, padding: '0 8px' }}>
            <h3 style={{ 
              fontSize: 26, 
              fontWeight: 850, 
              color: '#151B3D', 
              fontFamily: "'Fredoka', sans-serif",
              letterSpacing: '-0.01em',
              margin: 0
            }}>
              {label}
            </h3>
            <p style={{ 
              fontSize: 15, 
              color: '#151B3D', 
              lineHeight: 1.5, 
              fontWeight: 700, 
              margin: 0,
              opacity: available ? 0.85 : 0.7
            }}>
              {sub}
            </p>
          </div>

          {/* Tags & Action CTA Area */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 20 }}>
            {/* Tags */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 6, flexWrap: 'wrap' }}>
              {tags.map((t, i) => (
                <span
                  key={i}
                  style={{
                    background: available ? '#ffffff' : '#E8E8EE',
                    border: '2px solid #151B3D',
                    borderRadius: 'var(--r-pill)',
                    padding: '4px 12px',
                    fontSize: 12, fontWeight: 800,
                    color: '#151B3D',
                    fontFamily: "'Fredoka', sans-serif",
                    boxShadow: '2px 2px 0px #151B3D',
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
                padding: '12px 24px',
                fontSize: 15, fontWeight: 800,
                color: 'white',
                fontFamily: "'Fredoka', sans-serif",
                boxShadow: '3px 3px 0px #151B3D',
                textAlign: 'center',
                letterSpacing: '0.04em',
                transition: 'all 0.15s ease',
              }}>
                PLAY LEVEL →
              </div>
            ) : (
              <div style={{
                background: '#E8E8EE',
                border: '3px solid #151B3D',
                borderRadius: 'var(--r-pill)',
                padding: '12px 24px',
                fontSize: 14, fontWeight: 800,
                color: '#151B3D',
                opacity: 0.65,
                fontFamily: "'Fredoka', sans-serif",
                boxShadow: '2px 2px 0px #151B3D',
                textAlign: 'center',
                letterSpacing: '0.02em',
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
    <div 
      className="screen" 
      style={{ 
        background: 'var(--bg)', 
        overflowY: 'auto',
        backgroundImage: 'radial-gradient(var(--dots-color) 1.5px, transparent 1.5px)',
        backgroundSize: '24px 24px',
      }}
    >
      <TopBar here={0} showProfile />

      <div
        style={{
          padding: '48px 24px 64px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 48,
          position: 'relative',
          minHeight: 'calc(100vh - 58px)',
        }}
      >
        {/* Whimsical Ambient World-Building Elements */}
        
        {/* Clouds */}
        <div style={{ position: 'absolute', top: '8%', left: '6%', opacity: 0.25 }} className="drift-cloud">
          <Doodle kind="cloud" size={120} color="var(--sky-lt)" />
        </div>
        <div style={{ position: 'absolute', top: '14%', right: '5%', opacity: 0.25 }} className="drift-cloud">
          <Doodle kind="cloud" size={150} color="var(--mint-lt)" style={{ animationDelay: '2s' }} />
        </div>

        {/* Stars & Sparkles */}
        <div style={{ position: 'absolute', top: '35%', left: '4%', opacity: 0.5 }} className="wobble">
          <Doodle kind="star" size={38} color="var(--butter)" />
        </div>
        <div style={{ position: 'absolute', top: '42%', right: '6%', opacity: 0.45 }} className="drift">
          <Doodle kind="sparkle" size={32} color="var(--sky)" />
        </div>
        <div style={{ position: 'absolute', top: '22%', left: '20%', opacity: 0.45 }} className="floaty">
          <Doodle kind="pill" size={48} color="var(--peach)" />
        </div>
        <div style={{ position: 'absolute', top: '55%', right: '12%', opacity: 0.45 }} className="wobble">
          <Doodle kind="heart" size={34} color="var(--rose)" />
        </div>
        <div style={{ position: 'absolute', top: '65%', left: '11%', opacity: 0.45 }} className="floaty">
          <Doodle kind="bandage" size={54} color="var(--lav)" />
        </div>
        
        {/* Plants & Medical Signs */}
        <div style={{ position: 'absolute', bottom: '12%', left: '5%', opacity: 0.5 }} className="wobble">
          <Doodle kind="leaf" size={44} color="var(--green)" />
        </div>
        <div style={{ position: 'absolute', bottom: '16%', right: '7%', opacity: 0.45 }} className="floaty">
          <Doodle kind="stetho" size={48} color="var(--mint)" />
        </div>

        {/* Header */}
        <div style={{ textAlign: 'center', maxWidth: 680, zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div 
            className="chip butter" 
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
            ★ CLINICAL MAP LEVELS
          </div>
          
          <h1
            style={{
              fontSize: 'clamp(40px, 6vw, 54px)',
              lineHeight: 1.05,
              fontFamily: "'Fredoka', sans-serif",
              fontWeight: 800,
              letterSpacing: '-0.02em',
              color: '#151B3D',
              marginBottom: 16,
              textShadow: '2px 2px 0px rgba(21, 27, 61, 0.05)',
            }}
          >
            Choose your Training Wing
          </h1>
          <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--ink-2)', lineHeight: 1.6, margin: 0, opacity: 0.9 }}>
            Step through a clinic door and meet your next patient. Each wing brings a different clinical simulation environment.
          </p>
        </div>

        {/* Wing level collectible cards */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: 40,
            flexWrap: 'wrap',
            zIndex: 10,
            width: '100%',
            maxWidth: 1300,
            marginTop: 10,
            paddingBottom: 40,
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
            accentColor="var(--peach)"
            accentLt="var(--coral-lt)"
            tags={['Coming soon']}
          />
        </div>
      </div>
    </div>
  );
}

