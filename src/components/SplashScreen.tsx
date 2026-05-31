import { useEffect } from 'react';
import { Doodle } from './primitives';
import { store } from '../game/store';

function HospitalIllustration() {
  return (
    <svg width="320" height="240" viewBox="0 0 320 240" style={{ overflow: 'visible' }}>
      {/* Sky gradient */}
      <defs>
        <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#EEF4FF" />
          <stop offset="100%" stopColor="#FFF8F5" />
        </linearGradient>
        <linearGradient id="buildingGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#E9FFF6" />
          <stop offset="100%" stopColor="#CADEDE" />
        </linearGradient>
      </defs>
      {/* Ground */}
      <ellipse cx="160" cy="230" rx="150" ry="18" fill="rgba(107,203,119,0.18)" />
      {/* Main hospital building */}
      <rect x="80" y="80" width="160" height="148" rx="14" fill="url(#buildingGrad)" stroke="#000000" strokeWidth="4" />
      {/* Roof cap */}
      <rect x="100" y="62" width="120" height="28" rx="8" fill="#74CFFF" stroke="#000000" strokeWidth="3" />
      {/* Cross sign */}
      <rect x="140" y="30" width="40" height="40" rx="10" fill="white" stroke="#000000" strokeWidth="3.5" />
      <rect x="155" y="38" width="10" height="24" rx="3" fill="#FF6B6B" />
      <rect x="148" y="45" width="24" height="10" rx="3" fill="#FF6B6B" />
      {/* Windows row 1 */}
      <rect x="100" y="100" width="30" height="30" rx="6" fill="#FFD166" stroke="#000000" strokeWidth="2.5" />
      <rect x="145" y="100" width="30" height="30" rx="6" fill="#74CFFF" stroke="#000000" strokeWidth="2.5" />
      <rect x="190" y="100" width="30" height="30" rx="6" fill="#FF8FAB" stroke="#000000" strokeWidth="2.5" />
      {/* Windows row 2 */}
      <rect x="100" y="148" width="30" height="30" rx="6" fill="#A978FF" stroke="#000000" strokeWidth="2.5" />
      <rect x="190" y="148" width="30" height="30" rx="6" fill="#FFD166" stroke="#000000" strokeWidth="2.5" />
      {/* Door */}
      <rect x="135" y="170" width="50" height="58" rx="8" fill="#FF8A5B" stroke="#000000" strokeWidth="3" />
      <circle cx="178" cy="200" r="3" fill="white" />
      {/* Door arch */}
      <path d="M135 190 A25 25 0 0 1 185 190" fill="#FF7440" />
      {/* Ambulance */}
      <rect x="20" y="195" width="70" height="35" rx="8" fill="white" stroke="#000000" strokeWidth="3.5" />
      <rect x="20" y="195" width="24" height="35" rx="8" fill="#FF6B6B" />
      <path d="M29 207 V219 M23 213 H35" stroke="white" strokeWidth="3" strokeLinecap="round" />
      <circle cx="36" cy="232" r="6" fill="#000000" />
      <circle cx="36" cy="232" r="3" fill="#FFEADB" />
      <circle cx="70" cy="232" r="6" fill="#000000" />
      <circle cx="70" cy="232" r="3" fill="#FFEADB" />
      {/* Trees */}
      <circle cx="270" cy="185" r="22" fill="#7EE3B5" stroke="#000000" strokeWidth="3" />
      <rect x="267" y="200" width="6" height="28" rx="2" fill="#6BCB77" stroke="#000000" strokeWidth="2" />
      <circle cx="258" cy="195" r="16" fill="#6BCB77" stroke="#000000" strokeWidth="2.5" />
      {/* Sun */}
      <circle cx="282" cy="50" r="18" fill="#FFD166" opacity="0.9" />
      <circle cx="282" cy="50" r="12" fill="#FFE599" />
      {/* Small clouds */}
      <ellipse cx="50" cy="55" rx="22" ry="12" fill="white" opacity="0.85" />
      <ellipse cx="68" cy="50" rx="16" ry="10" fill="white" opacity="0.85" />
    </svg>
  );
}

export function SplashScreen() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        store.beginFromSplash();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div
      className="screen"
      onClick={() => store.beginFromSplash()}
      style={{
        position: 'relative',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 32,
        overflow: 'hidden',
        background: '#F3FBFF', /* Soft sky blue background */
        minHeight: '100vh',
      }}
    >
      {/* Floating ambient doodles */}
      <div style={{ position: 'absolute', top: '8%',  left: '6%' }} className="wobble">
        <Doodle kind="pill"    size={50} color="#FFBE98" />
      </div>
      <div style={{ position: 'absolute', top: '12%', right: '8%' }} className="floaty">
        <Doodle kind="heart"   size={40} color="#FF8FAB" />
      </div>
      <div style={{ position: 'absolute', bottom: '20%', left: '5%', animationDelay: '1.2s' }} className="floaty">
        <Doodle kind="stetho"  size={54} color="#20C9D2" />
      </div>
      <div style={{ position: 'absolute', bottom: '18%', right: '6%', animationDelay: '0.8s' }} className="wobble">
        <Doodle kind="bandage" size={54} color="#FFBE98" />
      </div>
      <div style={{ position: 'absolute', top: '55%', left: '3%', animationDelay: '2s' }} className="floaty">
        <Doodle kind="leaf"    size={38} color="#6BCB77" />
      </div>
      <div style={{ position: 'absolute', top: '40%', right: '3%' }} className="drift">
        <Doodle kind="sparkle" size={30} color="#FFD166" />
      </div>

      {/* Main content */}
      <div
        style={{
          zIndex: 5,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 24,
          maxWidth: 700,
          textAlign: 'center',
        }}
      >
        {/* Hospital illustration */}
        <div className="popin floaty" style={{ animationDelay: '0s', marginBottom: -8 }}>
          <HospitalIllustration />
        </div>

        {/* Eyebrow badge */}
        <div
          className="popin chip"
          style={{
            animationDelay: '.08s',
            fontSize: 12,
            padding: '7px 18px',
            fontFamily: "'Fredoka', sans-serif",
            letterSpacing: '0.04em',
            border: '3px solid #000000',
            boxShadow: '0 3px 0 #000000',
            background: '#20C9D2',
            color: 'white',
            borderRadius: '999px',
          }}
        >
          🏥 Clinical Outpatient Simulation
        </div>

        {/* Brand title (Outlined sticker logo) */}
        <div className="popin" style={{ animationDelay: '.14s' }}>
          <div
            style={{
              fontFamily: "'Fredoka', sans-serif",
              fontWeight: 900,
              fontSize: 'clamp(64px, 10vw, 108px)',
              lineHeight: 0.92,
              letterSpacing: '-0.04em',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
            }}
          >
            <span style={{
              color: '#000000',
              textShadow: `
                -3px -3px 0 #000000, 3px -3px 0 #000000, -3px 3px 0 #000000, 3px 3px 0 #000000,
                0px 6px 0px #000000
              `
            }}>atri</span>
            <span style={{
              color: '#FF8A5B',
              textShadow: `
                -3px -3px 0 #000000, 3px -3px 0 #000000, -3px 3px 0 #000000, 3px 3px 0 #000000,
                0px 6px 0px #000000
              `
            }}>um</span>
            <span style={{
              color: '#FF6B6B',
              textShadow: `
                -3px -3px 0 #000000, 3px -3px 0 #000000, -3px 3px 0 #000000, 3px 3px 0 #000000,
                0px 6px 0px #000000
              `
            }}>+</span>
          </div>
        </div>

        {/* Subtitle card (Warm cream yellow Nintendo panel #FFF7D6) */}
        <div
          className="popin"
          style={{
            animationDelay: '.22s',
            fontSize: 19,
            fontWeight: 700,
            color: '#000000',
            background: '#FFF7D6',
            padding: '20px 36px',
            maxWidth: 560,
            lineHeight: 1.55,
            borderRadius: 'var(--r-xl)',
            border: '4px solid #000000',
            boxShadow: '0 8px 0px #000000',
            fontFamily: "'Fredoka', sans-serif",
          }}
        >
          The clinical training world that lets you make every mistake{' '}
          <span
            style={{
              color: '#FF6B6B',
              fontWeight: 900,
              textDecoration: 'underline',
              textDecorationColor: '#000000',
              textDecorationThickness: '2px',
            }}
          >
            before they count.
          </span>
        </div>

        {/* Status pills */}
        <div
          className="popin"
          style={{
            animationDelay: '.30s',
            display: 'flex',
            gap: 10,
            flexWrap: 'wrap',
            justifyContent: 'center',
          }}
        >
          <span className="chip" style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 12, border: '2.5px solid #000000', boxShadow: '0 2px 0 #000000', background: '#E8FFF1', color: '#000000', borderRadius: '999px', padding: '4px 12px' }}>
            ✦ Clinic Room Connected
          </span>
          <span className="chip" style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 12, border: '2.5px solid #000000', boxShadow: '0 2px 0 #000000', background: '#FFF0ED', color: '#000000', borderRadius: '999px', padding: '4px 12px' }}>
            ● Voice Recognition Live
          </span>
          <span className="chip" style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 12, border: '2.5px solid #000000', boxShadow: '0 2px 0 #000000', background: '#EEF4FF', color: '#000000', borderRadius: '999px', padding: '4px 12px' }}>
            ✦ Ready for Duty
          </span>
        </div>

        {/* CTA button */}
        <div className="popin breathe" style={{ animationDelay: '.38s', marginTop: 8 }}>
          <button
            type="button"
            className="btn-plush primary"
            style={{
              fontSize: 20,
              padding: '18px 52px',
              fontWeight: 900,
              fontFamily: "'Fredoka', sans-serif",
              borderRadius: 'var(--r-pill)',
              border: '4px solid #000000',
              boxShadow: '0 8px 0px #000000 !important',
            }}
            onClick={(e) => {
              e.stopPropagation();
              store.beginFromSplash();
            }}
          >
            Enter Simulation →
          </button>
        </div>

        {/* Space hint */}
        <div
          className="popin"
          style={{
            animationDelay: '.46s',
            fontSize: 13,
            color: '#000000',
            fontWeight: 700,
            marginTop: -8,
            fontFamily: "'Fredoka', sans-serif",
          }}
        >
          press{' '}
          <span
            style={{
              background: 'white',
              padding: '4px 14px',
              border: '2.5px solid #000000',
              borderRadius: 10,
              boxShadow: '0 2px 0 #000000',
              color: '#000000',
              fontSize: 12,
              fontFamily: "'Fredoka', sans-serif",
            }}
          >
            space
          </span>{' '}
          to enter
        </div>
      </div>
    </div>
  );
}
