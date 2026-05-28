import { useEffect } from 'react';
import { Doodle } from './primitives';
import { store } from '../game/store';

export function SplashScreen() {
  // Click anywhere or hit space → onboarding (first run) or home (returning).
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
      className="screen bg-peach-soft"
      onClick={() => store.beginFromSplash()}
      style={{ 
        position: 'relative', 
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        overflow: 'hidden'
      }}
    >
      {/* Soft floating doodles instead of radar */}
      <div
        style={{
          position: 'absolute',
          width: 600,
          height: 600,
          opacity: 0.15,
          pointerEvents: 'none',
          zIndex: 1,
          animation: 'spin-teleporter 60s linear infinite',
        }}
      >
        <svg viewBox="0 0 200 200" width="100%" height="100%">
          <circle cx="100" cy="100" r="80" fill="none" stroke="var(--line)" strokeWidth="2" strokeDasharray="6 12" />
          <circle cx="100" cy="100" r="50" fill="none" stroke="var(--line)" strokeWidth="1.5" strokeDasharray="4 8" />
        </svg>
      </div>

      {/* Center content container */}
      <div
        style={{
          zIndex: 5,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 20,
          maxWidth: 820,
          textAlign: 'center',
        }}
      >
        {/* System eyebrow */}
        <div 
          className="chip peach"
          style={{
            fontSize: 12,
            padding: '6px 16px',
            marginBottom: -10,
          }}
        >
          ★ CLINICAL OUTPATIENT SIMULATION
        </div>

        {/* Brand Title */}
        <div className="popin" style={{ animationDelay: '.05s' }}>
          <div
            style={{
              fontFamily: "'Outfit', sans-serif",
              fontWeight: 900,
              fontSize: 100,
              lineHeight: 0.95,
              letterSpacing: '-0.04em',
              color: 'var(--ink)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 16,
            }}
          >
            atri
            <span style={{ color: 'var(--peach)' }}>um</span>
            <span className="wobble" style={{ display: 'inline-block', marginLeft: 8 }}>
              <Doodle kind="cross" size={54} color="var(--rose)" />
            </span>
          </div>
        </div>

        {/* Subtitle */}
        <div
          className="popin plush-lg"
          style={{
            animationDelay: '.15s',
            fontSize: 18,
            fontWeight: 700,
            color: 'var(--ink-2)',
            background: '#ffffff',
            padding: '20px 32px',
            maxWidth: 600,
            lineHeight: 1.5,
          }}
        >
          The clinical training deck that lets you make every mistake <span style={{ color: 'var(--peach)', fontWeight: 800 }}>before they count</span>.
        </div>

        {/* Telemetry panel */}
        <div
          className="popin"
          style={{
            animationDelay: '.25s',
            display: 'flex',
            gap: 20,
            marginTop: 10,
            fontSize: 13,
            fontWeight: 700,
            color: 'var(--ink-soft)',
          }}
        >
          <span>✦ CLINIC ROOM CONNECTED</span>
          <span style={{ color: 'var(--peach)' }}>● VOICE RECOGNITION LIVE</span>
          <span>✦ READY FOR DUTY</span>
        </div>

        {/* Action Button */}
        <div className="popin breathe" style={{ animationDelay: '.35s', marginTop: 16 }}>
          <button
            type="button"
            className="btn-plush primary"
            style={{ 
              fontSize: 20, 
              padding: '16px 40px',
              fontWeight: 800,
            }}
            onClick={(e) => {
              e.stopPropagation();
              store.beginFromSplash();
            }}
          >
            Enter Simulation
          </button>
        </div>

        {/* Hotkey hint */}
        <div
          className="popin"
          style={{
            animationDelay: '.45s',
            fontSize: 12,
            color: 'var(--ink-soft)',
            fontWeight: 700,
            marginTop: 8,
          }}
        >
          press{' '}
          <span
            style={{
              background: '#ffffff',
              padding: '4px 12px',
              border: 'var(--stroke) solid var(--line)',
              borderRadius: 8,
              boxShadow: '0 2px 0 var(--line)',
              color: 'var(--ink)',
            }}
          >
            space
          </span>{' '}
          to enter
        </div>
      </div>

      <style>{`
        @keyframes spin-teleporter {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
