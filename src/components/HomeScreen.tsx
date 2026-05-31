import { useState } from 'react';
import { Doodle } from './primitives';
import { store } from '../game/store';
import { soundSystem } from '../utils/audioSystem';


function Flower({ color = '#FF7B6B', size = 22 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size * 1.35} viewBox="0 0 30 39" style={{ overflow: 'visible', filter: 'drop-shadow(0px 2px 0px #16205C)' }}>
      <path d="M 15 38 Q 15 24 15 18" stroke="#86E36A" strokeWidth="3.5" strokeLinecap="round" />
      <path d="M 15 30 Q 8 26 6 20 Q 12 24 15 30 Z" fill="#86E36A" stroke="#16205C" strokeWidth="1.5" />
      <circle cx="15" cy="10" r="4.5" fill={color} stroke="#16205C" strokeWidth="1.5" />
      <circle cx="21" cy="14" r="4.5" fill={color} stroke="#16205C" strokeWidth="1.5" />
      <circle cx="9" cy="14" r="4.5" fill={color} stroke="#16205C" strokeWidth="1.5" />
      <circle cx="21" cy="6" r="4.5" fill={color} stroke="#16205C" strokeWidth="1.5" />
      <circle cx="9" cy="6" r="4.5" fill={color} stroke="#16205C" strokeWidth="1.5" />
      <circle cx="15" cy="10" r="5.5" fill="#FFD54A" stroke="#16205C" strokeWidth="1.5" />
    </svg>
  );
}

export const LETTER_PATHS: Record<string, string> = {
  A: 'M 25 125 C 25 90, 35 55, 55 35 C 65 25, 85 25, 95 35 C 115 55, 125 90, 125 125 C 125 133, 117 138, 110 135 C 103 133, 102 125, 102 120 H 48 C 48 125, 47 133, 40 135 C 33 138, 25 133, 25 125 Z M 58 90 L 75 56 L 92 90 Z',
  T: 'M 25 40 C 25 32, 32 25, 40 25 H 105 C 113 25, 120 32, 120 40 C 120 48, 113 55, 105 55 H 85 V 125 C 85 133, 78 140, 70 140 C 62 140, 55 133, 55 125 V 55 H 40 C 32 55, 25 48, 25 40 Z',
  R: 'M 25 125 V 35 C 25 27, 32 20, 40 20 H 85 C 107 20, 120 32, 120 50 C 120 65, 107 75, 90 78 L 110 120 C 115 127, 107 132, 100 132 C 93 132, 88 127, 83 120 L 67 92 H 52 V 125 C 52 133, 45 140, 37 140 C 29 140, 25 133, 25 125 Z M 52 42 V 66 H 83 C 89 66, 92 62, 92 54 C 92 46, 89 42, 83 42 Z',
  I: 'M 45 40 V 125 C 45 133, 52 140, 60 140 C 68 140, 75 133, 75 125 V 40 C 75 32, 68 25, 60 25 C 52 25, 45 32, 45 40 Z',
  U: 'M 25 35 V 95 C 25 113, 42 125, 70 125 C 98 125, 115 113, 115 95 V 35 C 115 27, 108 20, 100 20 C 92 20, 85 27, 85 35 V 90 C 85 96, 80 102, 70 102 C 60 102, 55 96, 55 90 V 35 C 55 27, 48 20, 40 20 C 32 20, 25 27, 25 35 Z',
  M: 'M 15 125 V 35 C 15 27, 22 20, 30 20 C 38 20, 44 26, 47 33 L 65 68 L 83 33 C 86 26, 92 20, 100 20 C 108 20, 115 27, 115 125 V 125 C 115 133, 108 140, 100 140 C 92 140, 85 133, 85 125 V 65 L 72 90 C 68 97, 62 97, 58 90 L 45 65 V 125 C 45 133, 38 140, 30 140 C 22 140, 15 133, 15 125 Z',
  '+': 'M 25 45 H 45 V 25 C 45 17, 52 10, 60 10 C 68 10, 75 17, 75 25 V 45 H 95 C 103 45, 110 52, 110 60 C 110 68, 103 75, 95 75 H 75 V 95 C 75 103, 68 110, 60 110 C 52 110, 45 103, 45 95 V 75 H 25 C 17 75, 10 68, 10 60 C 10 52, 17 45, 25 45 Z'
};

export const LETTERS = [
  { char: 'A', x: 25, y: 15 },
  { char: 'T', x: 145, y: 15 },
  { char: 'R', x: 250, y: 15 },
  { char: 'I', x: 360, y: 15 },
  { char: 'U', x: 430, y: 15 },
  { char: 'M', x: 540, y: 15 },
  { char: '+', x: 670, y: 25 }
];

export function HomeScreen() {
  const [btnHover, setBtnHover] = useState(false);

  return (
    <div
      className="screen"
      style={{
        background: '#DDF4FF', /* Light sky blue */
        overflow: 'hidden', // Viewport fit rule
        backgroundImage: 'radial-gradient(rgba(22, 32, 92, 0.2) 1.5px, transparent 1.5px)',
        backgroundSize: '24px 24px',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        width: '100vw',
        boxSizing: 'border-box',
      }}
    >
      {/* ── Main Content Area ── */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '10px 24px 105px', // Leaves room for hills landscape at bottom
          gap: 12, // Reduced vertical spacing by 40% for compact fit
          position: 'relative',
          zIndex: 10,
          boxSizing: 'border-box',
          width: '100%',
        }}
      >
        {/* Top Yellow Pill Badge */}
        <div
          style={{
            fontSize: 15, // Scaled up text
            padding: '8px 24px', // Scaled up padding
            fontFamily: "'Fredoka', sans-serif",
            border: '4px solid #16205C',
            boxShadow: 'inset 0 3px 0 rgba(255, 255, 255, 0.6), 0 4px 0px #16205C',
            fontWeight: 900,
            background: '#FFD54A', // Sunshine Yellow
            color: '#16205C',
            borderRadius: '999px',
            transform: 'rotate(-1.5deg)',
            display: 'inline-flex',
            alignItems: 'center',
            zIndex: 12,
            letterSpacing: '0.08em',
          }}
        >
          ★ CLINICAL OUTPATIENT SIMULATOR ★
        </div>

        {/* Hero Section: Enormous 3D Custom Mascot SVG Logo Wordmark */}
        <div className="wobble" style={{ zIndex: 11, margin: '2px 0' }}>
          <svg
            viewBox="0 0 820 180"
            style={{
              width: '78vw',
              maxWidth: '920px',
              height: 'auto',
              maxHeight: '190px',
              overflow: 'visible',
              filter: 'drop-shadow(0px 10px 0px rgba(22, 32, 92, 0.15))'
            }}
          >
            <defs>
              <linearGradient id="bubble-logo-grad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#FFA69E" />
                <stop offset="60%" stopColor="#FF7B6B" />
                <stop offset="100%" stopColor="#E05B4B" />
              </linearGradient>
            </defs>

            {/* Sparkles (four-point stars) */}
            <g transform="translate(105, 50)" fill="#24D7E5" stroke="#16205C" strokeWidth="2.5">
              <path d="M 0,-12 Q 0,0 12,0 Q 0,0 0,12 Q 0,0 -12,0 Q 0,0 0,-12 Z" />
            </g>
            <g transform="translate(815, 85)" fill="#B48CFF" stroke="#16205C" strokeWidth="2.5">
              <path d="M 0,-10 Q 0,0 10,0 Q 0,0 0,10 Q 0,0 -10,0 Q 0,0 0,-10 Z" />
            </g>

            {/* Floating Stars */}
            <g transform="translate(85, 120) rotate(-15)" fill="#FFD54A" stroke="#16205C" strokeWidth="2.5">
              <polygon points="0,-9 2.5,-3 8.5,-3 3.5,1 5.5,7 0,3 -5.5,7 -3.5,1 -8.5,-3 -2.5,-3" />
            </g>
            <g transform="translate(790, 30) rotate(15)" fill="#FFD54A" stroke="#16205C" strokeWidth="2.5">
              <polygon points="0,-7 2,-2 7,-2 3,1 4.5,5.5 0,2.5 -4.5,5.5 -3,1 -7,-2 -2,-2" />
            </g>

            {/* Glow / Action lines */}
            <path d="M 125,15 Q 115,25 110,40" fill="none" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />
            <path d="M 800,120 Q 810,110 815,95" fill="none" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />

            {/* 1. Heavy Outline Path behind text (Shuffled down for 3D extrusion) */}
            {LETTERS.map(({ char, x, y }) => (
              <g key={`shadow-${char}`} transform={`translate(${x + 2}, ${y + 12})`}>
                <path
                  d={LETTER_PATHS[char]}
                  fill="#16205C"
                  stroke="#16205C"
                  strokeWidth={28}
                  strokeLinejoin="round"
                />
              </g>
            ))}

            {/* 2. White Glow Border overlay */}
            {LETTERS.map(({ char, x, y }) => (
              <g key={`glow-${char}`} transform={`translate(${x}, ${y})`}>
                <path
                  d={LETTER_PATHS[char]}
                  fill="#ffffff"
                  stroke="#ffffff"
                  strokeWidth={20}
                  strokeLinejoin="round"
                />
              </g>
            ))}

            {/* 3. Base Logo Fill with thin Navy Outline */}
            {LETTERS.map(({ char, x, y }) => (
              <g key={`base-${char}`} transform={`translate(${x}, ${y})`}>
                <path
                  d={LETTER_PATHS[char]}
                  fill="url(#bubble-logo-grad)"
                  stroke="#16205C"
                  strokeWidth={7}
                  strokeLinejoin="round"
                />
              </g>
            ))}

          </svg>
        </div>

        <div
          style={{
            background: '#ffffff',
            border: '4px solid #16205C',
            borderRadius: '24px',
            boxShadow: '0 6px 0px #16205C',
            padding: '16px 32px',
            maxWidth: 720,
            textAlign: 'center',
            margin: '8px 0 12px',
            boxSizing: 'border-box',
          }}
        >
          <p
            style={{
              fontSize: 20,
              fontWeight: 900,
              color: '#000000',
              lineHeight: 1.5,
              margin: 0,
              fontFamily: "'Fredoka', sans-serif",
            }}
          >
            The virtual clinic where every mistake becomes a lesson before it reaches a real patient.
          </p>
        </div>

        {/* ─── FEATURE PILLS ─── */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: 16,
            flexWrap: 'wrap',
            width: '100%',
            maxWidth: 800,
            margin: '4px auto 8px',
          }}
        >
          <span style={{
            fontSize: 14,
            fontWeight: 900,
            color: '#16205C',
            padding: '8px 18px',
            background: '#CFFECC',
            border: '3px solid #16205C',
            borderRadius: '999px',
            boxShadow: '0 4px 0px #16205C',
            fontFamily: "'Fredoka', sans-serif",
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
          }}>
            🩺 Clinical Rooms
          </span>
          <span style={{
            fontSize: 14,
            fontWeight: 900,
            color: '#16205C',
            padding: '8px 18px',
            background: '#D1F8FF',
            border: '3px solid #16205C',
            borderRadius: '999px',
            boxShadow: '0 4px 0px #16205C',
            fontFamily: "'Fredoka', sans-serif",
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
          }}>
            🎤 Voice Recognition
          </span>
          <span style={{
            fontSize: 14,
            fontWeight: 900,
            color: '#16205C',
            padding: '8px 18px',
            background: '#FFF5C2',
            border: '3px solid #16205C',
            borderRadius: '999px',
            boxShadow: '0 4px 0px #16205C',
            fontFamily: "'Fredoka', sans-serif",
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
          }}>
            📚 Case Library
          </span>
        </div>

        {/* ─── MASSIVE CTA BUTTON ─── */}
        <div style={{ display: 'flex', justifyContent: 'center', width: '100%', marginTop: 12 }}>
          <button
            type="button"
            className="btn-plush primary breathe btn-toy"
            style={{
              width: 460, // Exactly sized to meet user specs (width: 420-500px)
              height: 84, // Exactly sized to meet user specs (height: 80-100px)
              fontSize: 26, // Scaled up font size
              fontFamily: "'Fredoka', sans-serif",
              background: 'linear-gradient(135deg, #FF9C90, #FF7B6B)', // Coral orange gradient
              color: '#ffffff',
              boxShadow: btnHover 
                ? 'inset 0 6px 0 rgba(255, 255, 255, 0.4), 0 12px 24px rgba(22, 32, 92, 0.25), 0 10px 0 #16205C' 
                : 'inset 0 6px 0 rgba(255, 255, 255, 0.4), 0 8px 16px rgba(22, 32, 92, 0.15), 0 6px 0 #16205C',
              borderRadius: '999px',
              border: '5px solid #16205C', // Thicker border for scale
              letterSpacing: '0.04em',
              fontWeight: 900,
              cursor: 'pointer',
              transform: btnHover ? 'translateY(-4px) scale(1.02)' : 'none',
              transition: 'all 0.15s cubic-bezier(0.34, 1.56, 0.64, 1)',
              textShadow: '0 2px 0 rgba(22, 32, 92, 0.3)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onMouseEnter={(e) => {
              soundSystem.playHover(e.currentTarget);
              setBtnHover(true);
            }}
            onMouseLeave={() => btnHover && setBtnHover(false)}
            onClick={() => {
              soundSystem.playClick();
              store.beginFromSplash();
            }}
          >
            {/* Play symbol inside white circle */}
            <div style={{
              width: 44, // Enlarged play symbol
              height: 44,
              borderRadius: '50%',
              background: '#ffffff',
              border: '3px solid #16205C',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginRight: 16,
              fontSize: 18,
              color: '#FF7B6B',
              boxShadow: '0 2px 0 #16205C',
            }}>
              ▶
            </div>
            ENTER SIMULATION →
          </button>
        </div>
      </div>

      {/* ── Landscape Background Layer (Sloping Hills, Path & Flowers) ── */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 160, zIndex: 1, pointerEvents: 'none' }}>
        <svg width="100%" height="100%" viewBox="0 0 1440 160" preserveAspectRatio="none" style={{ display: 'block', overflow: 'visible' }}>
          <defs>
            <linearGradient id="hill-back-grad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#DDF6CE" />
              <stop offset="100%" stopColor="#B3E69C" />
            </linearGradient>
            <linearGradient id="hill-mid-grad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#B5EE9D" />
              <stop offset="100%" stopColor="#8BD96E" />
            </linearGradient>
            <linearGradient id="hill-front-grad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#86E36A" />
              <stop offset="100%" stopColor="#55C03B" />
            </linearGradient>
            <linearGradient id="path-grad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FFF2D9" />
              <stop offset="100%" stopColor="#FED792" />
            </linearGradient>
          </defs>

          {/* Back Hills */}
          <path d="M 0 100 Q 300 40 720 120 T 1440 80 V 160 H 0 Z" fill="url(#hill-back-grad)" stroke="#16205C" strokeWidth="3" />
          
          {/* Mid Hills */}
          <path d="M 0 120 Q 400 70 720 130 T 1440 100 V 160 H 0 Z" fill="url(#hill-mid-grad)" stroke="#16205C" strokeWidth="3" />
          
          {/* Path in center */}
          <path d="M 620 160 L 680 125 L 760 125 L 820 160 Z" fill="url(#path-grad)" stroke="#16205C" strokeWidth="3" />

          {/* Front Left Hill */}
          <path d="M 0 130 Q 350 80 650 160 H 0 Z" fill="url(#hill-front-grad)" stroke="#16205C" strokeWidth="4" />
          
          {/* Front Right Hill */}
          <path d="M 790 160 Q 1090 80 1440 130 V 160 Z" fill="url(#hill-front-grad)" stroke="#16205C" strokeWidth="4" />
        </svg>

        {/* Small Flowers (Daisies & Tulips) positioned on top of the hills */}
        <div style={{ position: 'absolute', bottom: 20, left: '6%', transform: 'scale(0.85)' }}><Flower color="#FF7B6B" /></div>
        <div style={{ position: 'absolute', bottom: 10, left: '12%', transform: 'scale(0.7)' }}><Flower color="#ffffff" /></div>
        <div style={{ position: 'absolute', bottom: 35, left: '18%', transform: 'scale(0.9)' }}><Flower color="#FFD54A" /></div>

        <div style={{ position: 'absolute', bottom: 20, right: '6%', transform: 'scale(0.85)' }}><Flower color="#FF7B6B" /></div>
        <div style={{ position: 'absolute', bottom: 10, right: '12%', transform: 'scale(0.7)' }}><Flower color="#ffffff" /></div>
        <div style={{ position: 'absolute', bottom: 35, right: '18%', transform: 'scale(0.9)' }}><Flower color="#FFD54A" /></div>
      </div>

      {/* ── Clouds in Corners ── */}
      <div style={{ position: 'absolute', top: '6%', left: '4%', opacity: 0.85, zIndex: 2 }} className="drift-cloud">
        <svg width="100" height="60" viewBox="0 0 140 84">
          <path d="M 30 64 Q 8 64 8 48 Q 8 32 26 32 Q 28 14 46 14 Q 60 14 66 28 Q 90 20 102 38 Q 118 38 118 52 Q 118 70 100 70 H 36 Q 30 70 30 64 Z" fill="#FFFFFF" stroke="#A8CFFF" strokeWidth="2.5" />
        </svg>
      </div>
      <div style={{ position: 'absolute', top: '5%', right: '4%', opacity: 0.85, zIndex: 2 }} className="drift-cloud">
        <svg width="110" height="66" viewBox="0 0 140 84">
          <path d="M 30 64 Q 8 64 8 48 Q 8 32 26 32 Q 28 14 46 14 Q 60 14 66 28 Q 90 20 102 38 Q 118 38 118 52 Q 118 70 100 70 H 36 Q 30 70 30 64 Z" fill="#FFFFFF" stroke="#A8CFFF" strokeWidth="2.5" />
        </svg>
      </div>
      
      {/* ── Sparse and Elegant Floating Medical/Game-Themed Decorations ── */}
      {/* Star */}
      <div style={{ position: 'absolute', top: '22%', left: '4%', opacity: 0.7, zIndex: 2 }} className="wobble">
        <Doodle kind="star" size={22} color="#FFD54A" />
      </div>
      {/* Sparkle */}
      <div style={{ position: 'absolute', top: '15%', right: '8%', opacity: 0.7, zIndex: 2 }} className="drift">
        <Doodle kind="sparkle" size={20} color="#24D7E5" />
      </div>
      {/* Pill */}
      <div style={{ position: 'absolute', top: '12%', left: '26%', opacity: 0.6, zIndex: 2 }} className="floaty">
        <Doodle kind="pill" size={24} color="#FF7B6B" />
      </div>
      {/* Leaf */}
      <div style={{ position: 'absolute', top: '16%', right: '24%', opacity: 0.6, zIndex: 2 }} className="wobble">
        <Doodle kind="leaf" size={20} color="#86E36A" />
      </div>
      {/* Heart */}
      <div style={{ position: 'absolute', bottom: '32%', right: '6%', opacity: 0.7, zIndex: 2 }} className="drift">
        <Doodle kind="heart" size={22} color="#FF7B6B" />
      </div>
      {/* Bandage */}
      <div style={{ position: 'absolute', bottom: '26%', left: '5%', opacity: 0.65, zIndex: 2 }} className="floaty">
        <Doodle kind="bandage" size={28} color="#FFD54A" />
      </div>
    </div>
  );
}
