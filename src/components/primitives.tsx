import { Fragment, type CSSProperties, type ReactNode } from 'react';
import { store } from '../game/store';
import { Mascot, getPatientMascot } from './mascots';
import { soundSystem } from '../utils/audioSystem';

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
  skin: _skin = '#FFD8B5',
  hair: _hair = '#3B2A1F',
  size = 120,
  mood = 'neutral',
  accessory: _accessory,
  gender,
  age = 35,
}: PatientFaceProps) {
  
  if (style === 'initials') {
    const initials = name.split(' ').map((s) => s[0]).slice(0, 2).join('');
    return (
      <div
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          background: '#151B3D',
          color: 'white',
          fontWeight: 900,
          fontSize: size * 0.36,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '4px solid #151B3D',
          boxShadow: '3px 3px 0px #151B3D',
          fontFamily: "'Fredoka', sans-serif",
        }}
      >
        {initials}
      </div>
    );
  }

  // Map case properties deterministically to the correct flat-cartoon SVG mascot
  const mascotName = getPatientMascot({
    id: name,
    age,
    sex: gender || 'F',
    complaint: '',
    cond: '',
  });

  return (
    <div 
      style={{ 
        width: size, 
        height: size, 
        display: 'inline-flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        position: 'relative'
      }}
    >
      <Mascot name={mascotName} size={size} mood={mood} />
    </div>
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
  const stroke = '#151B3D';
  const defaultColors: Record<DoodleKind, string> = {
    pill: 'var(--peach)',
    cross: 'var(--coral)',
    heart: 'var(--rose)',
    bandage: 'var(--butter)',
    stetho: 'var(--mint)',
    star: 'var(--butter)',
    sparkle: 'var(--sky)',
    cloud: '#FFFFFF',
    leaf: 'var(--green)',
  };
  const c = color ?? defaultColors[kind];
  switch (kind) {
    case 'pill':
      return (
        <svg width={size} height={size * 0.55} viewBox="0 0 100 55" style={style}>
          <rect x="4" y="4" width="92" height="47" rx="23" fill={c} stroke={stroke} strokeWidth="4" />
          <line x1="50" y1="4" x2="50" y2="51" stroke={stroke} strokeWidth="4" />
          <rect x="4" y="4" width="46" height="47" rx="23" fill="var(--butter)" />
          <line x1="50" y1="4" x2="50" y2="51" stroke={stroke} strokeWidth="4" />
          <rect x="4" y="4" width="92" height="47" rx="23" fill="none" stroke={stroke} strokeWidth="4" />
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
            strokeWidth="5"
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
            strokeWidth="5"
          />
        </svg>
      );
    case 'bandage':
      return (
        <svg width={size} height={size * 0.5} viewBox="0 0 100 50" style={style}>
          <rect x="4" y="4" width="92" height="42" rx="14" fill={c} stroke={stroke} strokeWidth="4" transform="rotate(-8 50 25)" />
          <g transform="rotate(-8 50 25)">
            <circle cx="32" cy="25" r="3" fill={stroke} />
            <circle cx="46" cy="25" r="3" fill={stroke} />
            <circle cx="60" cy="25" r="3" fill={stroke} />
            <circle cx="38" cy="18" r="3" fill={stroke} />
            <circle cx="54" cy="18" r="3" fill={stroke} />
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
            strokeWidth="5"
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
            strokeWidth="4"
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
            strokeWidth="5"
          />
        </svg>
      );
    case 'leaf':
      return (
        <svg width={size} height={size} viewBox="0 0 100 100" style={style}>
          <path d="M 12 88 Q 20 28 88 12 Q 76 76 12 88 Z" fill={c} stroke={stroke} strokeWidth="5" />
          <path d="M 22 78 Q 50 50 80 30" fill="none" stroke={stroke} strokeWidth="4" />
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
  const emojis: Record<string, string> = {
    Polyclinic: '🏥',
    GP: '👨‍⚕️',
    Case: '📁',
    Brief: '📋',
    Encounter: '👤',
    Wrap: '🎬',
    Debrief: '🏆',
    Profile: '👤',
    History: '📚',
  };

  return (
    <div 
      className="breadcrumb" 
      style={{ 
        display: 'flex', 
        gap: 8, 
        alignItems: 'center', 
        background: '#ffffff', 
        border: '4px solid #151B3D', 
        borderRadius: '999px', 
        padding: '6px 16px', 
        boxShadow: '4px 4px 0px #151B3D' 
      }}
    >
      {steps.map((s, i) => {
        const target = LABEL_TO_SCREEN[s];
        const isHere = i === here;
        const clickable = !isHere && !!target;
        const emoji = emojis[s] ?? '✨';

        return (
          <Fragment key={i}>
            {i > 0 && <span className="sep" style={{ color: '#151B3D', fontWeight: 900 }}>→</span>}
            <span
              onMouseEnter={clickable ? (e) => soundSystem.playHover(e.currentTarget) : undefined}
              onClick={clickable ? () => { soundSystem.playClick(); store.setScreen(target); } : undefined}
              style={{
                cursor: clickable ? 'pointer' : 'default',
                fontWeight: 800,
                fontSize: 13,
                color: isHere ? '#ffffff' : '#151B3D',
                background: isHere ? '#FF8A5B' : 'transparent',
                padding: isHere ? '4px 12px' : '0px',
                borderRadius: '999px',
                border: isHere ? '3px solid #151B3D' : 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                fontFamily: "'Fredoka', sans-serif",
                transition: 'all 0.15s ease',
              }}
              className={clickable ? 'tap' : ''}
            >
              <span>{emoji}</span>
              <span>{s}</span>
            </span>
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
        padding: '16px 24px',
        borderBottom: '4px solid #151B3D',
        background: 'var(--cream)',
        position: 'relative',
        zIndex: 10,
        boxShadow: '0 4px 0px rgba(21, 27, 61, 0.05)',
      }}
    >
      <span
        className="tap"
        onMouseEnter={(e) => soundSystem.playHover(e.currentTarget)}
        onClick={() => { soundSystem.playClick(); store.setScreen('splash'); }}
        title="Back to start"
        style={{ display: 'inline-flex', alignItems: 'center', cursor: 'pointer' }}
      >
        <Wordmark size={24} />
      </span>
      <Breadcrumb steps={steps} here={here} />
      {showProfile ? (
        <div
          className="tap"
          onMouseEnter={(e) => soundSystem.playHover(e.currentTarget)}
          onClick={() => { soundSystem.playClick(); store.setScreen('home'); }}
          title="Open profile"
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 10, 
            cursor: 'pointer',
            background: '#ffffff',
            border: '3px solid #151B3D',
            borderRadius: '999px',
            padding: '4px 12px',
            boxShadow: '2px 2px 0px #151B3D',
          }}
        >
          <span
            style={{
              fontFamily: "'Fredoka', sans-serif",
              fontWeight: 700,
              fontSize: 14,
              color: 'var(--ink)',
            }}
          >
            Dr. Desai
          </span>
          <div
            style={{
              width: 30,
              height: 30,
              borderRadius: '50%',
              background: 'var(--mint)',
              border: '2px solid #151B3D',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: "'Fredoka', sans-serif",
              fontWeight: 900,
              fontSize: 14,
              color: '#ffffff',
            }}
          >
            D
          </div>
        </div>
      ) : (
        <div style={{ width: 100 }} />
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
        fontFamily: "'Fredoka', sans-serif",
        fontWeight: 800,
        fontSize: size,
        letterSpacing: '-0.02em',
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
        border: '4px solid #151B3D',
        borderRadius: 'var(--r-md)',
        padding: '16px 20px',
        fontWeight: 700,
        fontSize: 15,
        lineHeight: 1.45,
        color: 'var(--ink)',
        boxShadow: '4px 4px 0px #151B3D',
        fontFamily: "'Fredoka', sans-serif",
      }}
    >
      {children}
      <svg style={{ position: 'absolute', left: -18, top: 20 }} width="20" height="22" viewBox="0 0 20 22">
        <path d="M 20 4 L 2 12 L 20 18 Z" fill="#ffffff" stroke="#151B3D" strokeWidth="4" strokeLinejoin="round" />
        <line x1="20" y1="4" x2="20" y2="18" stroke="#ffffff" strokeWidth="5" />
      </svg>
    </div>
  );
}
