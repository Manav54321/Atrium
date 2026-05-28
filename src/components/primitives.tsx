import { Fragment, type CSSProperties, type ReactNode } from 'react';
import { store } from '../game/store';

// ─── PATIENT FACE ───────────────────────────────────────────
// style: 'cute' | 'portrait' | 'animal' | 'initials'

export type FaceMood = 'neutral' | 'happy' | 'sad' | 'sick' | 'worried';
export type FaceStyle = 'cute' | 'portrait' | 'animal' | 'initials';
export type FaceAccessory = 'thermometer' | 'bandage';

interface PatientFaceProps {
  name?: string;
  style?: FaceStyle;
  skin?: string;
  hair?: string;
  size?: number;
  mood?: FaceMood;
  accessory?: FaceAccessory;
  gender?: 'M' | 'F';
  age?: number;
}

export function PatientFace({
  name = 'Aisha',
  style = 'cute',
  skin = '#FFD8B5',
  hair = '#3B2A1F',
  size = 120,
  mood = 'neutral',
  accessory,
  gender,
  age = 35,
}: PatientFaceProps) {
  // Heuristic fallbacks if gender is missing
  const isFemale = gender === 'F' || 
    name.toLowerCase().includes('aisha') || 
    name.toLowerCase().includes('priya') || 
    name.toLowerCase().includes('leila') || 
    name.toLowerCase().includes('mei') || 
    name.toLowerCase().includes('haddad') || 
    name.toLowerCase().includes('rahman') || 
    name.toLowerCase().includes('whitford') === false && 
    (name.toLowerCase().includes('tan') || name.toLowerCase().includes('chen') === false);
  const finalGender: 'M' | 'F' = gender ? gender : (isFemale ? 'F' : 'M');

  if (style === 'initials') {
    const initials = name.split(' ').map((s) => s[0]).slice(0, 2).join('');
    return (
      <div
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          background: hair,
          color: 'white',
          fontWeight: 900,
          fontSize: size * 0.36,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: 'var(--stroke-thick) solid var(--line)',
          boxShadow: 'var(--plush-sm)',
        }}
      >
        {initials}
      </div>
    );
  }
  if (style === 'animal') return <AnimalFace size={size} mood={mood} accessory={accessory} />;
  if (style === 'portrait') return <PortraitFace size={size} skin={skin} hair={hair} mood={mood} accessory={accessory} gender={finalGender} age={age} />;
  return <CuteFace size={size} skin={skin} hair={hair} mood={mood} accessory={accessory} gender={finalGender} age={age} />;
}

interface CuteFaceProps {
  size?: number;
  skin?: string;
  hair?: string;
  mood?: FaceMood;
  accessory?: FaceAccessory;
  gender?: 'M' | 'F';
  age?: number;
}

export function CuteFace({
  size = 120,
  skin = '#FFD8B5',
  hair = '#3B2A1F',
  mood = 'neutral',
  accessory,
  gender = 'F',
  age = 35,
}: CuteFaceProps) {
  const stroke = 'var(--line)';
  
  // Choose hair color based on age (elderly lean grey/silver)
  const hairColor = age >= 65 ? '#E5DACE' : hair;

  // Mouth path mappings based on mood
  const mouthByMood: Record<FaceMood, ReactNode> = {
    neutral: <path d="M 85 136 Q 100 144 115 136" stroke="var(--ink)" strokeWidth="4.5" fill="none" strokeLinecap="round" />,
    happy: <path d="M 82 130 Q 100 152 118 130" stroke="var(--ink)" strokeWidth="4.5" fill="none" strokeLinecap="round" />,
    sad: <path d="M 82 142 Q 100 126 118 142" stroke="var(--ink)" strokeWidth="4.5" fill="none" strokeLinecap="round" />,
    sick: <path d="M 82 136 Q 90 128 100 136 T 118 136" stroke="var(--ink)" strokeWidth="4.5" fill="none" strokeLinecap="round" />,
    worried: <path d="M 84 137 Q 100 131 116 137" stroke="var(--ink)" strokeWidth="4.5" fill="none" strokeLinecap="round" />,
  };

  // Eyebrows mapping based on mood
  const browsByMood: Record<FaceMood, ReactNode> = {
    neutral: (
      <g stroke="var(--ink)" strokeWidth="3.5" strokeLinecap="round" fill="none">
        <path d="M 64 92 Q 74 90 84 94" />
        <path d="M 136 92 Q 126 90 116 94" />
      </g>
    ),
    happy: (
      <g stroke="var(--ink)" strokeWidth="3.5" strokeLinecap="round" fill="none" transform="translate(0 -2)">
        <path d="M 62 90 Q 74 84 86 90" />
        <path d="M 138 90 Q 126 84 114 90" />
      </g>
    ),
    sad: (
      <g stroke="var(--ink)" strokeWidth="3.5" strokeLinecap="round" fill="none">
        <path d="M 64 96 Q 74 90 84 88" />
        <path d="M 136 96 Q 126 90 116 88" />
      </g>
    ),
    sick: (
      <g stroke="var(--ink)" strokeWidth="3.5" strokeLinecap="round" fill="none">
        <path d="M 64 92 H 84" />
        <path d="M 136 92 H 116" />
      </g>
    ),
    worried: (
      <g stroke="var(--ink)" strokeWidth="3.5" strokeLinecap="round" fill="none">
        <path d="M 64 88 Q 74 90 84 94" />
        <path d="M 136 88 Q 126 90 116 94" />
      </g>
    ),
  };

  // Cheeks colors based on emotional state
  const cheekColor = 
    mood === 'happy' ? '#FF7597' :
    mood === 'sad' ? '#92A8D1' :
    mood === 'sick' ? '#84D2C4' :
    '#FFB5C5';

  return (
    <svg width={size} height={size} viewBox="0 0 200 200" style={{ overflow: 'visible' }}>
      {/* Background Soft circle instead of cyber grid */}
      <circle cx="100" cy="100" r="84" fill="var(--cream-2)" stroke="var(--line)" strokeWidth="3" />
      
      {/* Hair backing mass */}
      {gender === 'F' ? (
        <>
          {/* Space buns/ponytail backings */}
          <circle cx="45" cy="50" r="28" fill={hairColor} stroke={stroke} strokeWidth="3" />
          <circle cx="155" cy="50" r="28" fill={hairColor} stroke={stroke} strokeWidth="3" />
          <ellipse cx="100" cy="86" rx="76" ry="78" fill={hairColor} />
        </>
      ) : (
        <ellipse cx="100" cy="86" rx="74" ry="76" fill={hairColor} />
      )}

      {/* Face Skin */}
      <circle cx="100" cy="108" r="62" fill={skin} stroke={stroke} strokeWidth="4" />

      {/* Hair (Front / Bangs / Spikes) */}
      {gender === 'F' ? (
        <path d="M 40 76 Q 60 38 100 40 Q 140 38 160 76 Q 130 54 100 58 Q 70 54 40 76 Z" fill={hairColor} stroke={stroke} strokeWidth="2" />
      ) : (
        /* Male Spiky Hair Cut */
        <path d="M 40 78 L 62 26 L 85 36 L 100 22 L 115 36 L 138 26 L 160 78 Q 130 60 100 64 Q 70 60 40 78 Z" fill={hairColor} stroke={stroke} strokeWidth="2" />
      )}

      {/* Wrinkles / Crows Feet for elderly */}
      {age >= 60 && (
        <g opacity="0.4">
          <path d="M 64 104 Q 56 106 50 102 M 64 108 Q 54 112 48 108" fill="none" stroke="var(--ink)" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M 136 104 Q 144 106 150 102 M 136 108 Q 146 112 152 108" fill="none" stroke="var(--ink)" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M 78 128 Q 74 135 78 142" fill="none" stroke="var(--ink)" strokeWidth="2" strokeLinecap="round" />
          <path d="M 122 128 Q 126 135 122 142" fill="none" stroke="var(--ink)" strokeWidth="2" strokeLinecap="round" />
        </g>
      )}

      {/* Eyebrows */}
      {browsByMood[mood] ?? browsByMood.neutral}

      {/* Cheek glow */}
      <ellipse cx="72" cy="120" rx="10" ry="7" fill={cheekColor} opacity="0.5" />
      <ellipse cx="128" cy="120" rx="10" ry="7" fill={cheekColor} opacity="0.5" />

      {/* Playful cartoon eyes with double sparkle shines */}
      <g className="blink" style={{ transformOrigin: '100px 105px' }}>
        {gender === 'F' && (
          <g stroke={stroke} strokeWidth="2.5" fill="none" strokeLinecap="round">
            <path d="M 68 100 Q 78 92 88 100" />
            <path d="M 112 100 Q 122 92 132 100" />
          </g>
        )}
        
        <circle cx="76" cy="105" r="9" fill="var(--ink)" />
        <circle cx="73.5" cy="102.5" r="2.5" fill="white" />
        <circle cx="78.5" cy="107.5" r="1.2" fill="white" />

        <circle cx="124" cy="105" r="9" fill="var(--ink)" />
        <circle cx="121.5" cy="102.5" r="2.5" fill="white" />
        <circle cx="126.5" cy="107.5" r="1.2" fill="white" />
      </g>

      {/* Mouth */}
      {mouthByMood[mood] ?? mouthByMood.neutral}

      {/* Cozy medical stethoscope around neck instead of cyber headset */}
      <g stroke="var(--line)" strokeWidth="3.5" fill="none" strokeLinecap="round">
        <path d="M 72 165 C 72 185 128 185 128 165" />
        <circle cx="100" cy="184" r="6" fill="var(--peach)" stroke="var(--line)" strokeWidth="2" />
      </g>

      {/* Medical Accessories */}
      {accessory === 'thermometer' && (
        <g>
          <rect x="114" y="128" width="36" height="8" rx="4" fill="white" stroke={stroke} strokeWidth="3" transform="rotate(-15 130 132)" />
          <circle cx="116" cy="133" r="5" fill="var(--rose)" />
          <line x1="126" y1="131" x2="144" y2="131" stroke="var(--rose)" strokeWidth="2" transform="rotate(-15 130 132)" />
        </g>
      )}
      {accessory === 'bandage' && (
        <g transform="translate(100 78) rotate(-12)">
          <rect x="-24" y="-8" width="48" height="16" rx="4" fill="var(--sky-deep)" stroke="var(--line)" strokeWidth="2" />
          <line x1="-18" y1="0" x2="18" y2="0" stroke="white" strokeWidth="2.5" strokeDasharray="3 3" />
        </g>
      )}
    </svg>
  );
}

export function PortraitFace({ 
  size = 120, 
  skin = '#FFD8B5', 
  hair = '#3B2A1F',
  mood = 'neutral',
  accessory,
  gender = 'F',
  age = 35
}: { 
  size?: number; 
  skin?: string; 
  hair?: string;
  mood?: FaceMood;
  accessory?: FaceAccessory;
  gender?: 'M' | 'F';
  age?: number;
}) {
  return (
    <div 
      className="plush floaty"
      style={{
        width: size,
        height: size,
        borderRadius: 'var(--r-md)',
        overflow: 'hidden',
        background: 'var(--cream-2)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: '2px solid var(--line)',
        position: 'relative'
      }}
    >
      <CuteFace size={size * 0.95} skin={skin} hair={hair} mood={mood} accessory={accessory} gender={gender} age={age} />
    </div>
  );
}

export function AnimalFace({ 
  size = 120,
  mood = 'neutral',
  accessory
}: { 
  size?: number;
  mood?: FaceMood;
  accessory?: FaceAccessory;
}) {
  const stroke = 'var(--line)';
  const cheekColor = mood === 'happy' ? '#FF7597' : '#FFB5C5';
  return (
    <svg width={size} height={size} viewBox="0 0 200 200">
      {/* Background soft circle */}
      <circle cx="100" cy="100" r="84" fill="var(--cream-2)" stroke="var(--line)" strokeWidth="3" />

      {/* Bear Ears */}
      <circle cx="60" cy="66" r="24" fill="#C58F5E" stroke={stroke} strokeWidth="3" />
      <circle cx="140" cy="66" r="24" fill="#C58F5E" stroke={stroke} strokeWidth="3" />
      <circle cx="60" cy="66" r="12" fill="#9C6B43" />
      <circle cx="140" cy="66" r="12" fill="#9C6B43" />

      {/* Bear Head */}
      <circle cx="100" cy="110" r="68" fill="#D9A574" stroke={stroke} strokeWidth="4" />
      
      {/* Cheeks */}
      <circle cx="68" cy="120" r="8" fill={cheekColor} opacity="0.6" />
      <circle cx="132" cy="120" r="8" fill={cheekColor} opacity="0.6" />

      {/* Snout */}
      <ellipse cx="100" cy="122" rx="34" ry="24" fill="#FFE6CC" stroke={stroke} strokeWidth="2.5" />
      
      {/* Playful cartoon eyes */}
      <g className="blink" style={{ transformOrigin: '100px 100px' }}>
        <circle cx="78" cy="100" r="8" fill="var(--ink)" />
        <circle cx="75.5" cy="97.5" r="2.2" fill="white" />
        <circle cx="80" cy="102" r="1" fill="white" />
        <circle cx="122" cy="100" r="8" fill="var(--ink)" />
        <circle cx="119.5" cy="97.5" r="2.2" fill="white" />
        <circle cx="124" cy="102" r="1" fill="white" />
      </g>
      
      {/* Nose */}
      <ellipse cx="100" cy="118" rx="8" ry="6" fill={stroke} />
      <path d="M 100 124 Q 100 134 92 134" stroke={stroke} strokeWidth="3.5" fill="none" strokeLinecap="round" />
      <path d="M 100 124 Q 100 134 108 134" stroke={stroke} strokeWidth="3.5" fill="none" strokeLinecap="round" />

      {/* Accessory thermometer/bandage overlay */}
      {accessory === 'thermometer' && (
        <g>
          <rect x="114" y="128" width="34" height="8" rx="4" fill="white" stroke="var(--line)" strokeWidth="2.5" transform="rotate(-15 130 131)" />
          <circle cx="116" cy="133" r="5" fill="var(--rose)" />
        </g>
      )}
      {accessory === 'bandage' && (
        <g transform="translate(100 76) rotate(-10)">
          <rect x="-20" y="-6" width="40" height="12" rx="3" fill="var(--sky-deep)" stroke={stroke} strokeWidth="2" />
        </g>
      )}
    </svg>
  );
}

// ─── DOODLES ─────────────────────────────────
export type DoodleKind =
  | 'pill'
  | 'cross'
  | 'heart'
  | 'bandage'
  | 'stetho'
  | 'star'
  | 'sparkle'
  | 'cloud'
  | 'leaf';

interface DoodleProps {
  kind: DoodleKind;
  size?: number;
  color?: string;
  style?: CSSProperties;
}

export function Doodle({ kind, size = 50, color, style }: DoodleProps) {
  const stroke = 'var(--line)';
  const defaultColors: Record<DoodleKind, string> = {
    pill: '#FFB68A',
    cross: '#F47A92',
    heart: '#F47A92',
    bandage: '#FFE0BD',
    stetho: '#5FCFA0',
    star: '#FFD86B',
    sparkle: '#5AB7F2',
    cloud: '#FFFFFF',
    leaf: '#A8E5C8',
  };
  const c = color ?? defaultColors[kind];
  switch (kind) {
    case 'pill':
      return (
        <svg width={size} height={size * 0.55} viewBox="0 0 100 55" style={style}>
          <rect x="3" y="3" width="94" height="49" rx="24" fill={c} stroke={stroke} strokeWidth="3.5" />
          <line x1="50" y1="3" x2="50" y2="52" stroke={stroke} strokeWidth="3.5" />
          <rect x="3" y="3" width="48" height="49" rx="24" fill="#FFD86B" />
          <line x1="50" y1="3" x2="50" y2="52" stroke={stroke} strokeWidth="3.5" />
          <rect x="3" y="3" width="94" height="49" rx="24" fill="none" stroke={stroke} strokeWidth="3.5" />
        </svg>
      );
    case 'cross':
      return (
        <svg width={size} height={size} viewBox="0 0 100 100" style={style}>
          <path
            d="M 38 8 H 62 Q 70 8 70 16 V 38 H 92 Q 100 38 100 46 V 62 Q 100 70 92 70 H 70 V 92 Q 70 100 62 100 H 38 Q 30 100 30 92 V 70 H 8 Q 0 70 0 62 V 46 Q 0 38 8 38 H 30 V 16 Q 30 8 38 8 Z"
            transform="translate(0 -3)"
            fill={c}
            stroke={stroke}
            strokeWidth="4"
          />
        </svg>
      );
    case 'heart':
      return (
        <svg width={size} height={size} viewBox="0 0 100 100" style={style}>
          <path
            d="M 50 88 C 14 64 8 38 26 26 C 38 18 50 26 50 38 C 50 26 62 18 74 26 C 92 38 86 64 50 88 Z"
            fill={c}
            stroke={stroke}
            strokeWidth="4"
          />
        </svg>
      );
    case 'bandage':
      return (
        <svg width={size} height={size * 0.5} viewBox="0 0 100 50" style={style}>
          <rect x="4" y="4" width="92" height="42" rx="14" fill={c} stroke={stroke} strokeWidth="3.5" transform="rotate(-8 50 25)" />
          <g transform="rotate(-8 50 25)">
            <circle cx="32" cy="25" r="2" fill={stroke} />
            <circle cx="46" cy="25" r="2" fill={stroke} />
            <circle cx="60" cy="25" r="2" fill={stroke} />
            <circle cx="38" cy="18" r="2" fill={stroke} />
            <circle cx="54" cy="18" r="2" fill={stroke} />
          </g>
        </svg>
      );
    case 'stetho':
      return (
        <svg width={size} height={size} viewBox="0 0 100 100" style={style}>
          <path d="M 25 20 V 50 Q 25 70 50 70 Q 75 70 75 50 V 20" fill="none" stroke={stroke} strokeWidth="5" strokeLinecap="round" />
          <path d="M 50 70 V 80" stroke={stroke} strokeWidth="5" />
          <circle cx="50" cy="86" r="10" fill={c} stroke={stroke} strokeWidth="4" />
          <circle cx="25" cy="20" r="6" fill="white" stroke={stroke} strokeWidth="4" />
          <circle cx="75" cy="20" r="6" fill="white" stroke={stroke} strokeWidth="4" />
        </svg>
      );
    case 'star':
      return (
        <svg width={size} height={size} viewBox="0 0 100 100" style={style}>
          <path
            d="M 50 8 L 62 38 L 92 42 L 70 62 L 76 92 L 50 76 L 24 92 L 30 62 L 8 42 L 38 38 Z"
            fill={c}
            stroke={stroke}
            strokeWidth="4"
            strokeLinejoin="round"
          />
        </svg>
      );
    case 'sparkle':
      return (
        <svg width={size} height={size} viewBox="0 0 100 100" style={style}>
          <path
            d="M 50 6 L 56 44 L 94 50 L 56 56 L 50 94 L 44 56 L 6 50 L 44 44 Z"
            fill={c}
            stroke={stroke}
            strokeWidth="3.5"
            strokeLinejoin="round"
          />
        </svg>
      );
    case 'cloud':
      return (
        <svg width={size} height={size * 0.66} viewBox="0 0 100 66" style={style}>
          <path
            d="M 22 50 Q 4 50 4 36 Q 4 22 20 22 Q 22 8 38 8 Q 52 8 56 20 Q 78 14 86 30 Q 96 30 96 42 Q 96 56 80 56 H 28 Q 22 56 22 50 Z"
            fill={c}
            stroke={stroke}
            strokeWidth="4"
          />
        </svg>
      );
    case 'leaf':
      return (
        <svg width={size} height={size} viewBox="0 0 100 100" style={style}>
          <path d="M 12 88 Q 20 28 88 12 Q 76 76 12 88 Z" fill={c} stroke={stroke} strokeWidth="4" />
          <path d="M 22 78 Q 50 50 80 30" fill="none" stroke={stroke} strokeWidth="3" />
        </svg>
      );
    default:
      return null;
  }
}

// ─── BREADCRUMB ──────────────────────────────
import type { Screen } from '../game/types';

const LABEL_TO_SCREEN: Record<string, Screen> = {
  Polyclinic: 'mode',
  GP: 'gpRoom',
  Case: 'library',
  Brief: 'brief',
  Encounter: 'encounter',
  Wrap: 'endConfirm',
  Debrief: 'debrief',
  Profile: 'home',
  History: 'history',
};

interface BreadcrumbProps {
  steps: string[];
  here: number;
}

export function Breadcrumb({ steps, here }: BreadcrumbProps) {
  return (
    <div className="breadcrumb">
      {steps.map((s, i) => {
        const target = LABEL_TO_SCREEN[s];
        const isHere = i === here;
        const clickable = !isHere && !!target;
        return (
          <Fragment key={i}>
            {i > 0 && <span className="sep">›</span>}
            {isHere ? (
              <span className="here">{s}</span>
            ) : (
              <span
                onClick={clickable ? () => store.setScreen(target) : undefined}
                style={{
                  cursor: clickable ? 'pointer' : 'default',
                  fontWeight: 600,
                  fontSize: 12,
                  color: 'var(--ink-2)',
                  transition: 'color 0.2s',
                }}
              >
                {s}
              </span>
            )}
          </Fragment>
        );
      })}
    </div>
  );
}


// ─── TOP BAR ─────────────────────────────────
interface TopBarProps {
  here?: number;
  steps?: string[];
  showProfile?: boolean;
}

export function TopBar({
  here = 0,
  steps = ['Polyclinic'],
  showProfile = true,
}: TopBarProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 24px',
        borderBottom: '1.5px solid var(--line)',
        background: 'rgba(255, 248, 245, 0.92)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        position: 'relative',
        zIndex: 10,
        boxShadow: '0 1px 12px rgba(26, 26, 46, 0.06)',
      }}
    >
      <span
        className="tap"
        onClick={() => store.setScreen('splash')}
        title="Back to start"
        style={{ display: 'inline-flex', alignItems: 'center', cursor: 'pointer' }}
      >
        <Wordmark size={22} />
      </span>
      <Breadcrumb steps={steps} here={here} />
      {showProfile ? (
        <div
          className="tap"
          onClick={() => store.setScreen('home')}
          title="Open profile"
          style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}
        >
          <span
            style={{
              fontFamily: "'Nunito', sans-serif",
              fontWeight: 800,
              fontSize: 13,
              color: 'var(--ink-2)',
            }}
          >
            Dr. Desai
          </span>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--mint) 0%, var(--sky) 100%)',
              border: '2px solid rgba(255,255,255,0.8)',
              boxShadow: '0 3px 10px rgba(78, 205, 196, 0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: "'Nunito', sans-serif",
              fontWeight: 900,
              fontSize: 14,
              color: '#ffffff',
              letterSpacing: 0,
            }}
          >
            D
          </div>
        </div>
      ) : (
        <div style={{ width: 80 }} />
      )}
    </div>
  );
}

// ─── WORDMARK ────────────────────────────────
interface WordmarkProps {
  size?: number;
  dark?: boolean;
}

export function Wordmark({ size = 36, dark = false }: WordmarkProps) {
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        fontFamily: "'Nunito', sans-serif",
        fontWeight: 900,
        fontSize: size,
        letterSpacing: '-0.03em',
      }}
    >
      <span style={{ color: dark ? '#ffffff' : 'var(--ink)' }}>
        atri
        <span style={{ color: 'var(--peach)' }}>um</span>
      </span>
      <span className="wobble" style={{ display: 'inline-block' }}>
        <Doodle kind="cross" size={size * 0.8} color="var(--rose)" />
      </span>
    </div>
  );
}

// ─── DOODLE SCATTER ──────────────────────────
export interface DoodleScatterItem {
  kind: DoodleKind;
  x: number | string;
  y: number | string;
  size?: number;
  color?: string;
  rot?: number;
  opacity?: number;
  anim?: 'floaty' | 'wobble' | 'drift' | 'breathe';
}

export function DoodleScatter({ items }: { items: DoodleScatterItem[] }) {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
      }}
    >
      {items.map((it, i) => (
        <div
          key={i}
          className={it.anim ?? 'floaty'}
          style={{
            position: 'absolute',
            left: it.x,
            top: it.y,
            transform: `rotate(${it.rot ?? 0}deg)`,
            opacity: it.opacity ?? 1,
            animationDelay: `${(i * 0.4) % 3}s`,
          }}
        >
          <Doodle kind={it.kind} size={it.size ?? 40} color={it.color} />
        </div>
      ))}
    </div>
  );
}

// ─── SPEECH BUBBLE ───────────────────────────
export function SpeechBubble({ children }: { children: ReactNode }) {
  return (
    <div
      className="popin"
      style={{
        position: 'relative',
        background: '#ffffff',
        border: 'var(--stroke-thick) solid var(--line)',
        borderRadius: 'var(--r-md)',
        padding: '12px 16px',
        fontWeight: 700,
        fontSize: 14,
        lineHeight: 1.4,
        color: 'var(--ink)',
        boxShadow: 'var(--plush-sm)',
      }}
    >
      {children}
      <svg style={{ position: 'absolute', left: -16, top: 20 }} width="20" height="22" viewBox="0 0 20 22">
        <path d="M 20 4 L 2 12 L 20 18 Z" fill="#ffffff" stroke="var(--line)" strokeWidth="3.5" strokeLinejoin="round" />
        <line x1="20" y1="4" x2="20" y2="18" stroke="#ffffff" strokeWidth="4" />
      </svg>
    </div>
  );
}
