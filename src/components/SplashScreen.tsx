import { useEffect } from 'react';
import { Doodle } from './primitives';
import { store } from '../game/store';

function HospitalIllustration() {
  return (
    <svg width="320" height="240" viewBox="0 0 320 240" style={{ overflow: 'visible' }}>
      {/* Sky gradient */}
      <defs>
        <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#E0F7FA" />
          <stop offset="100%" stopColor="#FFF8F5" />
        </linearGradient>
        <linearGradient id="buildingGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#E3F6F5" />
          <stop offset="100%" stopColor="#CADEDE" />
        </linearGradient>
      </defs>
      {/* Ground */}
      <ellipse cx="160" cy="230" rx="150" ry="18" fill="rgba(78,205,196,0.12)" />
      {/* Main hospital building */}
      <rect x="80" y="80" width="160" height="148" rx="14" fill="url(#buildingGrad)" stroke="rgba(74,74,106,0.12)" strokeWidth="2" />
      {/* Roof cap */}
      <rect x="100" y="62" width="120" height="28" rx="8" fill="#B3E5F0" stroke="rgba(74,74,106,0.12)" strokeWidth="2" />
      {/* Cross sign */}
      <rect x="140" y="30" width="40" height="40" rx="10" fill="white" stroke="rgba(74,74,106,0.12)" strokeWidth="2" />
      <rect x="155" y="38" width="10" height="24" rx="3" fill="#FF6B6B" />
      <rect x="148" y="45" width="24" height="10" rx="3" fill="#FF6B6B" />
      {/* Windows row 1 */}
      <rect x="100" y="100" width="30" height="30" rx="6" fill="#FFEBB4" stroke="rgba(74,74,106,0.1)" strokeWidth="1.5" />
      <rect x="145" y="100" width="30" height="30" rx="6" fill="#B3E5F0" stroke="rgba(74,74,106,0.1)" strokeWidth="1.5" />
      <rect x="190" y="100" width="30" height="30" rx="6" fill="#FFD4DC" stroke="rgba(74,74,106,0.1)" strokeWidth="1.5" />
      {/* Windows row 2 */}
      <rect x="100" y="148" width="30" height="30" rx="6" fill="#D8D1FF" stroke="rgba(74,74,106,0.1)" strokeWidth="1.5" />
      <rect x="190" y="148" width="30" height="30" rx="6" fill="#FFEBB4" stroke="rgba(74,74,106,0.1)" strokeWidth="1.5" />
      {/* Door */}
      <rect x="135" y="170" width="50" height="58" rx="8" fill="#FFA07A" stroke="rgba(74,74,106,0.12)" strokeWidth="2" />
      <circle cx="178" cy="200" r="3" fill="white" />
      {/* Door arch */}
      <path d="M135 190 A25 25 0 0 1 185 190" fill="#FF8C62" />
      {/* Ambulance */}
      <rect x="20" y="195" width="70" height="35" rx="8" fill="white" stroke="rgba(74,74,106,0.12)" strokeWidth="2" />
      <rect x="20" y="195" width="24" height="35" rx="8" fill="#FF6B6B" />
      <path d="M29 207 V219 M23 213 H35" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="36" cy="232" r="6" fill="#4A4A6A" />
      <circle cx="36" cy="232" r="3" fill="#8E8EAA" />
      <circle cx="70" cy="232" r="6" fill="#4A4A6A" />
      <circle cx="70" cy="232" r="3" fill="#8E8EAA" />
      {/* Trees */}
      <circle cx="270" cy="185" r="22" fill="#A8EDE9" />
      <rect x="267" y="200" width="6" height="28" rx="2" fill="#6B8E78" />
      <circle cx="258" cy="195" r="16" fill="#4ECDC4" />
      {/* Sun */}
      <circle cx="282" cy="50" r="18" fill="#FFD166" opacity="0.9" />
      <circle cx="282" cy="50" r="12" fill="#FFE599" />
      {/* Small clouds */}
      <ellipse cx="50" cy="55" rx="22" ry="12" fill="white" opacity="0.8" />
      <ellipse cx="68" cy="50" rx="16" ry="10" fill="white" opacity="0.8" />
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
        background: 'linear-gradient(160deg, #FFF8F5 0%, #F0FDFB 40%, #F0FAFD 100%)',
        minHeight: '100vh',
      }}
    >
      {/* Large ambient gradient circles */}
      <div style={{
        position: 'absolute', top: '-15%', left: '-10%',
        width: '50vw', height: '50vw',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(78,205,196,0.15) 0%, transparent 70%)',
        filter: 'blur(40px)', pointerEvents: 'none',
        animation: 'blob-drift-1 18s ease-in-out infinite',
      }} />
      <div style={{
        position: 'absolute', bottom: '-15%', right: '-10%',
        width: '45vw', height: '45vw',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(255,160,122,0.15) 0%, transparent 70%)',
        filter: 'blur(40px)', pointerEvents: 'none',
        animation: 'blob-drift-2 22s ease-in-out infinite',
      }} />
      <div style={{
        position: 'absolute', top: '30%', right: '5%',
        width: '30vw', height: '30vw',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(155,137,255,0.12) 0%, transparent 70%)',
        filter: 'blur(40px)', pointerEvents: 'none',
      }} />

      {/* Floating ambient doodles */}
      <div style={{ position: 'absolute', top: '8%',  left: '6%' }} className="wobble">
        <Doodle kind="pill"    size={50} color="var(--coral)"  style={{ opacity: 0.7 }} />
      </div>
      <div style={{ position: 'absolute', top: '12%', right: '8%' }} className="floaty">
        <Doodle kind="heart"   size={40} color="var(--rose)"   style={{ opacity: 0.65 }} />
      </div>
      <div style={{ position: 'absolute', bottom: '20%', left: '5%', animationDelay: '1.2s', opacity: 0.7 }} className="floaty">
        <Doodle kind="stetho"  size={54} color="var(--mint)"  />
      </div>
      <div style={{ position: 'absolute', bottom: '18%', right: '6%', animationDelay: '0.8s', opacity: 0.65 }} className="wobble">
        <Doodle kind="bandage" size={54} color="var(--sky)"   />
      </div>
      <div style={{ position: 'absolute', top: '55%', left: '3%', animationDelay: '2s', opacity: 0.5 }} className="floaty">
        <Doodle kind="leaf"    size={38} color="var(--mint)"  />
      </div>
      <div style={{ position: 'absolute', top: '40%', right: '3%', opacity: 0.5 }} className="drift">
        <Doodle kind="sparkle" size={30} color="var(--butter)" />
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
          className="popin chip mint"
          style={{
            animationDelay: '.08s',
            fontSize: 12,
            padding: '7px 18px',
            fontFamily: "'Nunito', sans-serif",
            letterSpacing: '0.04em',
          }}
        >
          🏥 Clinical Outpatient Simulation
        </div>

        {/* Brand title */}
        <div className="popin" style={{ animationDelay: '.14s' }}>
          <div
            style={{
              fontFamily: "'Nunito', sans-serif",
              fontWeight: 900,
              fontSize: 'clamp(64px, 10vw, 108px)',
              lineHeight: 0.92,
              letterSpacing: '-0.04em',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 12,
            }}
          >
            <span style={{ color: 'var(--ink)' }}>atri</span>
            <span
              style={{
                background: 'linear-gradient(135deg, var(--coral) 0%, var(--peach) 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              um
            </span>
            <span className="wobble" style={{ display: 'inline-block', marginLeft: 4 }}>
              <Doodle kind="cross" size={56} color="var(--coral)" />
            </span>
          </div>
        </div>

        {/* Subtitle card */}
        <div
          className="popin"
          style={{
            animationDelay: '.22s',
            fontSize: 19,
            fontWeight: 700,
            color: 'var(--ink-2)',
            background: 'rgba(255,255,255,0.85)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            padding: '20px 36px',
            maxWidth: 560,
            lineHeight: 1.55,
            borderRadius: 'var(--r-xl)',
            border: '1.5px solid var(--line)',
            boxShadow: '0 8px 32px rgba(26,26,46,0.08)',
          }}
        >
          The clinical training world that lets you make every mistake{' '}
          <span
            style={{
              background: 'linear-gradient(135deg, var(--coral) 0%, var(--peach) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              fontWeight: 900,
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
          <span className="chip mint" style={{ fontFamily: "'Nunito', sans-serif", fontSize: 12 }}>
            ✦ Clinic Room Connected
          </span>
          <span className="chip coral" style={{ fontFamily: "'Nunito', sans-serif", fontSize: 12 }}>
            ● Voice Recognition Live
          </span>
          <span className="chip sky" style={{ fontFamily: "'Nunito', sans-serif", fontSize: 12 }}>
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
              fontFamily: "'Nunito', sans-serif",
              letterSpacing: '-0.01em',
              borderRadius: 'var(--r-pill)',
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
            color: 'var(--ink-soft)',
            fontWeight: 700,
            marginTop: -8,
          }}
        >
          press{' '}
          <span
            style={{
              background: 'white',
              padding: '4px 14px',
              border: '1.5px solid var(--line)',
              borderRadius: 10,
              boxShadow: '0 2px 0 var(--line)',
              color: 'var(--ink-2)',
              fontSize: 12,
              fontFamily: "'Nunito', sans-serif",
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
