import type { CSSProperties } from 'react';

export interface MascotProps {
  size?: number;
  mood?: 'neutral' | 'happy' | 'sad' | 'sick' | 'worried' | 'shocked' | 'curious' | 'surprised' | 'tired' | 'nervous' | 'relieved';
  style?: CSSProperties;
  className?: string;
}

// ─── MOOD EXPRESSION NORMALIZATION ─────────────────────────────────
export type ChibiMood = 'curious' | 'worried' | 'surprised' | 'tired' | 'nervous' | 'relieved';

export function normalizeMood(mood?: string): ChibiMood {
  if (!mood) return 'curious';
  const m = mood.toLowerCase();
  if (m === 'happy' || m === 'relieved') return 'relieved';
  if (m === 'sad' || m === 'worried') return 'worried';
  if (m === 'shocked' || m === 'surprised') return 'surprised';
  if (m === 'sick' || m === 'tired') return 'tired';
  if (m === 'nervous') return 'nervous';
  return 'curious';
}

// ─── SHARED CUTE CHIBI FACE ELEMENT GENERATOR ──────────────────────
// Generates eyes, eyebrows, blush, sweat, and mouth elements dynamically.
// Head Center is assumed at (100, 80)
function ChibiFaceElements({ mood, eyeY = 82, eyeGap = 22 }: { mood: ChibiMood; eyeY?: number; eyeGap?: number }) {
  const leftX = 100 - eyeGap;
  const rightX = 100 + eyeGap;
  const stroke = '#000000';

  // Blush Cheeks (Always visible for maximum cute idle charm)
  const blushY = eyeY + 12;
  const blushXGap = eyeGap + 12;
  const blushLeftX = 100 - blushXGap;
  const blushRightX = 100 + blushXGap;

  switch (mood) {
    case 'relieved': // Happy closed crescent eyes, open tongue smile
      return (
        <>
          {/* Blush Cheeks */}
          <circle cx={blushLeftX} cy={blushY} r="9" fill="#FF8FAB" opacity="0.85" />
          <circle cx={blushRightX} cy={blushY} r="9" fill="#FF8FAB" opacity="0.85" />
          {/* Eyes: Happy Curved Arcs */}
          <path d={`M ${leftX - 10} ${eyeY} Q ${leftX} ${eyeY - 8} ${leftX + 10} ${eyeY}`} stroke={stroke} strokeWidth="5" fill="none" strokeLinecap="round" />
          <path d={`M ${rightX - 10} ${eyeY} Q ${rightX} ${eyeY - 8} ${rightX + 10} ${eyeY}`} stroke={stroke} strokeWidth="5" fill="none" strokeLinecap="round" />
          {/* Eyebrows */}
          <path d={`M ${leftX - 8} ${eyeY - 14} Q ${leftX} ${eyeY - 20} ${leftX + 8} ${eyeY - 14}`} stroke={stroke} strokeWidth="4.5" fill="none" strokeLinecap="round" />
          <path d={`M ${rightX - 8} ${eyeY - 14} Q ${rightX} ${eyeY - 20} ${rightX + 8} ${eyeY - 14}`} stroke={stroke} strokeWidth="4.5" fill="none" strokeLinecap="round" />
          {/* Mouth: Big open tongue smile */}
          <path d="M 88 98 Q 100 116 112 98 Z" fill="#D94B4B" stroke={stroke} strokeWidth="4" strokeLinejoin="round" />
          <path d="M 94 106 Q 100 101 106 106 C 106 112 94 112 94 106 Z" fill="#FF8FAB" />
        </>
      );

    case 'worried': // Distressed eyebrows, trembling small pupils, squiggly mouth
      return (
        <>
          {/* Blush Cheeks */}
          <circle cx={blushLeftX} cy={blushY} r="7" fill="#FF8FAB" opacity="0.6" />
          <circle cx={blushRightX} cy={blushY} r="7" fill="#FF8FAB" opacity="0.6" />
          {/* Eyes: White circles, small pupils */}
          <circle cx={leftX} cy={eyeY} r="11" fill="#ffffff" stroke={stroke} strokeWidth="4.5" />
          <circle cx={leftX} cy={eyeY + 2} r="4.5" fill={stroke} />
          <circle cx={rightX} cy={eyeY} r="11" fill="#ffffff" stroke={stroke} strokeWidth="4.5" />
          <circle cx={rightX} cy={eyeY + 2} r="4.5" fill={stroke} />
          {/* Eyebrows: Curved up and in */}
          <path d={`M ${leftX - 10} ${eyeY - 15} Q ${leftX} ${eyeY - 11} ${leftX + 8} ${eyeY - 17}`} stroke={stroke} strokeWidth="4.5" fill="none" strokeLinecap="round" />
          <path d={`M ${rightX + 10} ${eyeY - 15} Q ${rightX} ${eyeY - 11} ${rightX - 8} ${eyeY - 17}`} stroke={stroke} strokeWidth="4.5" fill="none" strokeLinecap="round" />
          {/* Mouth: Squiggly line */}
          <path d="M 90 102 Q 95 97 100 102 T 110 98" stroke={stroke} strokeWidth="4.5" fill="none" strokeLinecap="round" />
        </>
      );

    case 'surprised': // Huge white circles, tiny dot pupils, O mouth
      return (
        <>
          {/* Blush Cheeks */}
          <circle cx={blushLeftX} cy={blushY} r="8" fill="#FF8FAB" opacity="0.7" />
          <circle cx={blushRightX} cy={blushY} r="8" fill="#FF8FAB" opacity="0.7" />
          {/* Eyes: Huge circles */}
          <circle cx={leftX} cy={eyeY} r="14" fill="#ffffff" stroke={stroke} strokeWidth="4.5" />
          <circle cx={leftX} cy={eyeY} r="4" fill={stroke} />
          <circle cx={rightX} cy={eyeY} r="14" fill="#ffffff" stroke={stroke} strokeWidth="4.5" />
          <circle cx={rightX} cy={eyeY} r="4" fill={stroke} />
          {/* Eyebrows: High arched */}
          <path d={`M ${leftX - 8} ${eyeY - 22} Q ${leftX} ${eyeY - 26} ${leftX + 8} ${eyeY - 22}`} stroke={stroke} strokeWidth="4.5" fill="none" strokeLinecap="round" />
          <path d={`M ${rightX - 8} ${eyeY - 22} Q ${rightX} ${eyeY - 26} ${rightX + 8} ${eyeY - 22}`} stroke={stroke} strokeWidth="4.5" fill="none" strokeLinecap="round" />
          {/* Mouth: Circle O */}
          <circle cx="100" cy="106" r="8" fill="#D94B4B" stroke={stroke} strokeWidth="4" />
        </>
      );

    case 'tired': // Sleepy droopy half-closed eyes, sweat, flat mouth
      return (
        <>
          {/* Blush Cheeks */}
          <circle cx={blushLeftX} cy={blushY + 2} r="8" fill="#FF8FAB" opacity="0.9" />
          <circle cx={blushRightX} cy={blushY + 2} r="8" fill="#FF8FAB" opacity="0.9" />
          {/* Eyes: Half closed */}
          <circle cx={leftX} cy={eyeY} r="11" fill="#ffffff" stroke={stroke} strokeWidth="4.5" />
          <path d={`M ${leftX - 12} ${eyeY - 3} H ${leftX + 12}`} stroke={stroke} strokeWidth="4.5" fill="none" />
          <path d={`M ${leftX - 11} ${eyeY - 3} A 11 11 0 0 0 ${leftX + 11} ${eyeY - 3} Z`} fill={stroke} />
          <circle cx={rightX} cy={eyeY} r="11" fill="#ffffff" stroke={stroke} strokeWidth="4.5" />
          <path d={`M ${rightX - 12} ${eyeY - 3} H ${rightX + 12}`} stroke={stroke} strokeWidth="4.5" fill="none" />
          <path d={`M ${rightX - 11} ${eyeY - 3} A 11 11 0 0 0 ${rightX + 11} ${eyeY - 3} Z`} fill={stroke} />
          {/* Eyebrows: flat droopy */}
          <path d={`M ${leftX - 8} ${eyeY - 15} H ${leftX + 8}`} stroke={stroke} strokeWidth="4" fill="none" strokeLinecap="round" />
          <path d={`M ${rightX - 8} ${eyeY - 15} H ${rightX + 8}`} stroke={stroke} strokeWidth="4" fill="none" strokeLinecap="round" />
          {/* Sweat drop on forehead */}
          <path d="M 64 52 C 60 52 58 56 60 60 C 62 64 66 64 68 60 C 70 56 68 52 64 52 Z" fill="#74CFFF" stroke={stroke} strokeWidth="2.5" />
          {/* Mouth: Straight flat line */}
          <path d="M 90 102 H 110" stroke={stroke} strokeWidth="4.5" strokeLinecap="round" />
        </>
      );

    case 'nervous': // Looking sideways, sweat drop, forced crooked smile
      return (
        <>
          {/* Blush Cheeks */}
          <circle cx={blushLeftX} cy={blushY} r="8" fill="#FF8FAB" opacity="0.75" />
          <circle cx={blushRightX} cy={blushY} r="8" fill="#FF8FAB" opacity="0.75" />
          {/* Eyes: looking sideways left */}
          <circle cx={leftX} cy={eyeY} r="11" fill="#ffffff" stroke={stroke} strokeWidth="4.5" />
          <circle cx={leftX - 4} cy={eyeY} r="5" fill={stroke} />
          <circle cx={leftX - 5} cy={eyeY - 1} r="1.5" fill="#ffffff" />
          <circle cx={rightX} cy={eyeY} r="11" fill="#ffffff" stroke={stroke} strokeWidth="4.5" />
          <circle cx={rightX - 4} cy={eyeY} r="5" fill={stroke} />
          <circle cx={rightX - 5} cy={eyeY - 1} r="1.5" fill="#ffffff" />
          {/* Eyebrows: nervous tilt */}
          <path d={`M ${leftX - 8} ${eyeY - 16} L ${leftX + 8} ${eyeY - 13}`} stroke={stroke} strokeWidth="4.5" fill="none" strokeLinecap="round" />
          <path d={`M ${rightX - 8} ${eyeY - 13} L ${rightX + 8} ${eyeY - 16}`} stroke={stroke} strokeWidth="4.5" fill="none" strokeLinecap="round" />
          {/* Sweat drop on temple */}
          <path d="M 136 60 C 132 60 130 64 132 68 C 134 72 138 72 140 68 C 142 64 140 60 136 60 Z" fill="#74CFFF" stroke={stroke} strokeWidth="2.5" />
          {/* Mouth: forced squiggly smile */}
          <path d="M 90 102 Q 96 97 100 104 T 110 100" stroke={stroke} strokeWidth="4.5" fill="none" strokeLinecap="round" />
        </>
      );

    case 'curious': // Default wide shiny eyes, cute small smile, one brow up
    default:
      return (
        <>
          {/* Blush Cheeks */}
          <circle cx={blushLeftX} cy={blushY} r="9" fill="#FF8FAB" opacity="0.8" />
          <circle cx={blushRightX} cy={blushY} r="9" fill="#FF8FAB" opacity="0.8" />
          {/* Eyes: Huge shiny double highlighted */}
          <circle cx={leftX} cy={eyeY} r="11" fill={stroke} />
          <circle cx={leftX - 3} cy={eyeY - 3} r="3.5" fill="#ffffff" />
          <circle cx={leftX + 3} cy={eyeY + 3} r="1.5" fill="#ffffff" />
          <circle cx={rightX} cy={eyeY} r="11" fill={stroke} />
          <circle cx={rightX - 3} cy={eyeY - 3} r="3.5" fill="#ffffff" />
          <circle cx={rightX + 3} cy={eyeY + 3} r="1.5" fill="#ffffff" />
          {/* Eyebrows: One raised curious */}
          <path d={`M ${leftX - 8} ${eyeY - 17} Q ${leftX} ${eyeY - 21} ${leftX + 8} ${eyeY - 17}`} stroke={stroke} strokeWidth="4.5" fill="none" strokeLinecap="round" />
          <path d={`M ${rightX - 8} ${eyeY - 14} Q ${rightX} ${eyeY - 17} ${rightX + 8} ${eyeY - 14}`} stroke={stroke} strokeWidth="4.5" fill="none" strokeLinecap="round" />
          {/* Mouth: Cute tiny smile */}
          <path d="M 92 98 Q 100 106 108 98" stroke={stroke} strokeWidth="4.5" fill="none" strokeLinecap="round" />
        </>
      );
  }
}

// ─── 1. GP DOCTOR MASCOT (CHIBI REDESIGN) ──────────────────────────
export function GPMascot({ size = 200, style, className }: MascotProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" fill="none" style={style} className={`${className} floaty`}>
      {/* Background Badge circle */}
      <circle cx="100" cy="100" r="86" fill="var(--mint-lt)" stroke="#000000" strokeWidth="4" />
      
      {/* Tiny Stubby Body & White Lab Coat */}
      <path d="M70 145 C70 128 80 124 100 124 C120 124 130 128 130 145 C130 162 135 174 130 180 H70 C65 174 70 162 70 145 Z" fill="#ffffff" stroke="#000000" strokeWidth="4" strokeLinejoin="round" />
      <path d="M88 124 L100 144 L112 124 Z" fill="#FF8A5B" stroke="#000000" strokeWidth="4" />
      <path d="M100 124 V180" stroke="#000000" strokeWidth="4" />

      {/* Tiny Stubby Hands holding clipboard */}
      <rect x="84" y="146" width="32" height="24" rx="4" fill="#FFD166" stroke="#000000" strokeWidth="3" />
      <rect x="92" y="142" width="16" height="6" fill="#000000" />
      <circle cx="70" cy="154" r="7" fill="#FFE0BD" stroke="#000000" strokeWidth="3" />
      <circle cx="130" cy="154" r="7" fill="#FFE0BD" stroke="#000000" strokeWidth="3" />

      {/* Stethoscope */}
      <path d="M 80 128 C 80 144 120 144 120 128" stroke="#000000" strokeWidth="4" fill="none" />

      {/* Huge Chibi Head (Head size > 60% of vertical body projection) */}
      <circle cx="100" cy="74" r="52" fill="#FFE0BD" stroke="#000000" strokeWidth="4" />

      {/* Hair (Short neat brown hair) */}
      <path d="M48 76 C48 42 66 22 100 22 C134 22 152 42 152 76 C152 76 136 56 100 56 C64 56 48 76 48 76 Z" fill="#5A3A22" stroke="#000000" strokeWidth="4" strokeLinejoin="round" />

      {/* Round Glasses */}
      <circle cx="78" cy="76" r="17" stroke="#000000" strokeWidth="4.5" fill="rgba(255,255,255,0.2)" />
      <circle cx="122" cy="76" r="17" stroke="#000000" strokeWidth="4.5" fill="rgba(255,255,255,0.2)" />
      <path d="M95 76 H105" stroke="#000000" strokeWidth="4.5" />

      {/* Expressive Eyes & Blush */}
      <ChibiFaceElements mood="curious" eyeY={76} eyeGap={22} />

      {/* Doctor's Reflector Cap */}
      <rect x="88" y="14" width="24" height="8" rx="4" fill="#FF6B6B" stroke="#000000" strokeWidth="4" />
      <circle cx="100" cy="18" r="10" fill="#45B7D1" stroke="#000000" strokeWidth="4" />
      <circle cx="100" cy="18" r="3" fill="#ffffff" />
    </svg>
  );
}

// ─── 2. EMERGENCY DOCTOR MASCOT (CHIBI REDESIGN) ───────────────────
export function EmergencyMascot({ size = 200, style, className }: MascotProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" fill="none" style={style} className={`${className} floaty`}>
      {/* Background Badge circle */}
      <circle cx="100" cy="100" r="86" fill="var(--rose-lt)" stroke="#000000" strokeWidth="4" />

      {/* Tiny Stubby Scrubs Body */}
      <path d="M70 145 C70 128 80 124 100 124 C120 124 130 128 130 145 C130 162 135 174 130 180 H70 C65 174 70 162 70 145 Z" fill="#FF8A5B" stroke="#000000" strokeWidth="4" strokeLinejoin="round" />
      <path d="M88 124 L100 142 L112 124 Z" fill="#FFEADB" stroke="#000000" strokeWidth="4" />

      {/* Hands to Cheeks in panic */}
      <path d="M 52 110 Q 56 94 48 84" stroke="#000000" strokeWidth="4" fill="none" />
      <path d="M 148 110 Q 144 94 152 84" stroke="#000000" strokeWidth="4" fill="none" />

      {/* Huge Chibi Head */}
      <circle cx="100" cy="76" r="50" fill="#FFD0B0" stroke="#000000" strokeWidth="4" />

      {/* Spiky hair flying up in panic */}
      <path d="M50 64 L 42 34 L 66 28 L 80 12 L 100 20 L 120 12 L 134 28 L 158 34 L 150 64 Z" fill="#FFD166" stroke="#000000" strokeWidth="4" strokeLinejoin="round" />

      {/* Face elements: Shocked / Surprised */}
      <ChibiFaceElements mood="surprised" eyeY={76} eyeGap={20} />

      {/* Panicked Sweat flying off */}
      <path d="M30 45 Q 24 50 28 56 Z" fill="#74CFFF" stroke="#000000" strokeWidth="2" />
      <path d="M170 50 Q 176 55 172 62 Z" fill="#74CFFF" stroke="#000000" strokeWidth="2" />
    </svg>
  );
}

// ─── 3. LAB SCIENTIST MASCOT (CHIBI REDESIGN) ──────────────────────
export function ScientistMascot({ size = 200, style, className }: MascotProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" fill="none" style={style} className={`${className} floaty`}>
      {/* Background Badge circle */}
      <circle cx="100" cy="100" r="86" fill="var(--lav-lt)" stroke="#000000" strokeWidth="4" />

      {/* Tiny Lab Coat Body */}
      <path d="M70 145 C70 128 80 124 100 124 C120 124 130 128 130 145 L128 180 H72 Z" fill="#ffffff" stroke="#000000" strokeWidth="4" strokeLinejoin="round" />
      <path d="M86 124 L100 144 L114 124 Z" fill="#9B7EDE" stroke="#000000" strokeWidth="4" />

      {/* Steaming flask in hand */}
      <path d="M136 142 L144 165 H170 L178 142 Z" fill="#9B7EDE" stroke="#000000" strokeWidth="3" />
      <rect x="150" y="130" width="14" height="12" fill="#ffffff" stroke="#000000" strokeWidth="3" />
      {/* Steam lines */}
      <path d="M 148 120 Q 152 114 150 124" stroke="#000000" strokeWidth="2.5" fill="none" />
      <path d="M 158 118 Q 162 112 160 122" stroke="#000000" strokeWidth="2.5" fill="none" />

      {/* Huge Chibi Head */}
      <circle cx="100" cy="74" r="50" fill="#FFE0BD" stroke="#000000" strokeWidth="4" />

      {/* Scientist Fluffy hair */}
      <circle cx="50" cy="58" r="18" fill="#E5DACE" stroke="#000000" strokeWidth="4" />
      <circle cx="150" cy="58" r="18" fill="#E5DACE" stroke="#000000" strokeWidth="4" />
      <circle cx="100" cy="26" r="22" fill="#E5DACE" stroke="#000000" strokeWidth="4" />
      <circle cx="72" cy="34" r="20" fill="#E5DACE" stroke="#000000" strokeWidth="4" />
      <circle cx="128" cy="34" r="20" fill="#E5DACE" stroke="#000000" strokeWidth="4" />

      {/* Safety Goggles */}
      <rect x="56" y="62" width="88" height="24" rx="12" fill="rgba(78,205,196,0.35)" stroke="#000000" strokeWidth="4.5" />
      <line x1="100" y1="62" x2="100" y2="86" stroke="#000000" strokeWidth="4.5" />

      {/* Curious/Happy Eyes & Face */}
      <ChibiFaceElements mood="curious" eyeY={74} eyeGap={22} />
    </svg>
  );
}

// ─── 4. NURSE MASCOT (CHIBI REDESIGN) ──────────────────────────────
export function NurseMascot({ size = 200, style, className }: MascotProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" fill="none" style={style} className={`${className} floaty`}>
      {/* Background Badge circle */}
      <circle cx="100" cy="100" r="86" fill="var(--rose-lt)" stroke="#000000" strokeWidth="4" />

      {/* Tiny Scrubs Body */}
      <path d="M70 145 C70 128 80 124 100 124 C120 124 130 128 130 145 L128 180 H72 Z" fill="#FF8FAB" stroke="#000000" strokeWidth="4" strokeLinejoin="round" />
      <path d="M86 124 L100 140 L114 124 Z" fill="#FFE5EC" stroke="#000000" strokeWidth="4" />

      {/* Huge Chibi Head */}
      <circle cx="100" cy="74" r="50" fill="#FFE0BD" stroke="#000000" strokeWidth="4" />

      {/* Nurse Buns & Hair */}
      <circle cx="58" cy="36" r="16" fill="#1F1410" stroke="#000000" strokeWidth="4" />
      <circle cx="142" cy="36" r="16" fill="#1F1410" stroke="#000000" strokeWidth="4" />
      <path d="M50 72 C50 44 68 34 100 34 C132 34 150 44 150 72 Z" fill="#1F1410" stroke="#000000" strokeWidth="4" />

      {/* Nurse Cap */}
      <path d="M78 34 L122 34 L114 16 L86 16 Z" fill="#ffffff" stroke="#000000" strokeWidth="4" strokeLinejoin="round" />
      <path d="M94 24 H106 M100 18 V30" stroke="#FF6B6B" strokeWidth="3" />

      {/* Relieved/Happy Warm Face */}
      <ChibiFaceElements mood="relieved" eyeY={76} eyeGap={22} />
    </svg>
  );
}

// ─── 5. ELDERLY PATIENT MASCOT (SUPER CUTE CHIBI REDESIGN) ─────────
export function ElderlyPatientMascot({ size = 200, mood = 'neutral', style, className }: MascotProps) {
  const cleanMood = normalizeMood(mood);
  const stroke = '#000000';
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" fill="none" style={style} className={`${className} floaty`}>
      {/* Background Badge circle */}
      <circle cx="100" cy="100" r="86" fill="var(--peach-lt)" stroke={stroke} strokeWidth="4" />

      {/* Tiny Body & Cozy Green Striped Sweater */}
      <path d="M72 145 C72 128 82 124 100 124 C118 124 128 128 128 145 L126 180 H74 Z" fill="#6BCB77" stroke={stroke} strokeWidth="4" strokeLinejoin="round" />
      {/* Striped Sweater detailing */}
      <path d="M74 150 H126 M74 162 H126 M74 174 H126" stroke={stroke} strokeWidth="3" />

      {/* Cozy warm scarf wrapped around neck */}
      <rect x="74" y="120" width="52" height="14" rx="7" fill="#9B7EDE" stroke={stroke} strokeWidth="4" />
      <path d="M112 134 V158" stroke={stroke} strokeWidth="4" strokeLinecap="round" />

      {/* Huge Chibi Head (>60% ratio) */}
      <circle cx="100" cy="74" r="52" fill="#FFE6CC" stroke={stroke} strokeWidth="4" />

      {/* Bald cute scalp with side grey hair buns */}
      <circle cx="48" cy="70" r="14" fill="#E5DACE" stroke={stroke} strokeWidth="4" />
      <circle cx="152" cy="70" r="14" fill="#E5DACE" stroke={stroke} strokeWidth="4" />
      <path d="M 82 46 Q 100 42 118 46" stroke={stroke} strokeWidth="3.5" fill="none" strokeLinecap="round" opacity="0.4" />

      {/* Reading Spectacles (Large round cute frames) */}
      <circle cx="76" cy="76" r="18" stroke={stroke} strokeWidth="4" fill="rgba(255,255,255,0.25)" />
      <circle cx="124" cy="76" r="18" stroke={stroke} strokeWidth="4" fill="rgba(255,255,255,0.25)" />
      <path d="M94 76 H106" stroke={stroke} strokeWidth="4" />

      {/* Expression Face System */}
      <ChibiFaceElements mood={cleanMood} eyeY={76} eyeGap={24} />
    </svg>
  );
}

// ─── 6. CHILD PATIENT MASCOT (SUPER CUTE CHIBI REDESIGN) ───────────
export function ChildPatientMascot({ size = 200, mood = 'neutral', style, className }: MascotProps) {
  const cleanMood = normalizeMood(mood);
  const stroke = '#000000';
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" fill="none" style={style} className={`${className} floaty`}>
      {/* Background Badge circle */}
      <circle cx="100" cy="100" r="86" fill="var(--butter-lt)" stroke={stroke} strokeWidth="4" />

      {/* Tiny Chibi Body (Oversized backpack straps) */}
      <path d="M72 145 C72 130 82 125 100 125 C118 125 128 130 128 145 L126 180 H74 Z" fill="#74CFFF" stroke={stroke} strokeWidth="4" strokeLinejoin="round" />
      {/* Red Backpack straps on body */}
      <path d="M 78 125 V 158 M 122 125 V 158" stroke="#FF6B6B" strokeWidth="4" strokeLinecap="round" />

      {/* Tiny hand holding a giant striped lollipop */}
      <path d="M136 150 V174" stroke={stroke} strokeWidth="4.5" strokeLinecap="round" />
      <circle cx="136" cy="140" r="12" fill="#FF8FAB" stroke={stroke} strokeWidth="3.5" />
      <path d="M130 140 Q 136 146 142 140" stroke="#ffffff" strokeWidth="2.5" fill="none" />

      {/* Huge Chibi Head */}
      <circle cx="100" cy="78" r="48" fill="#FFD8B5" stroke={stroke} strokeWidth="4" />

      {/* Propeller Hat / Star Clip */}
      <path d="M62 48 C62 30 76 20 100 20 C124 20 138 30 138 48 Z" fill="#FF6B6B" stroke={stroke} strokeWidth="4" />
      <rect x="97" y="6" width="6" height="14" rx="2" fill="#FFD166" stroke={stroke} strokeWidth="2.5" />
      <path d="M80 6 H120" stroke={stroke} strokeWidth="3.5" strokeLinecap="round" />

      {/* Expression Face System */}
      <ChibiFaceElements mood={cleanMood} eyeY={78} eyeGap={20} />
    </svg>
  );
}

// ─── 7. OFFICE WORKER PATIENT MASCOT (SUPER CUTE CHIBI REDESIGN) ───
export function OfficeWorkerPatientMascot({ size = 200, mood = 'neutral', style, className }: MascotProps) {
  const cleanMood = normalizeMood(mood);
  const stroke = '#000000';
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" fill="none" style={style} className={`${className} floaty`}>
      {/* Background Badge circle */}
      <circle cx="100" cy="100" r="86" fill="var(--sky-lt)" stroke={stroke} strokeWidth="4" />

      {/* Tiny Collared Body & Messy Tie */}
      <path d="M72 145 C72 130 82 125 100 125 C118 125 128 130 128 145 L126 180 H74 Z" fill="#ffffff" stroke={stroke} strokeWidth="4" strokeLinejoin="round" />
      <path d="M92 125 L100 138 L108 125 Z" fill="#FFE0BD" stroke={stroke} strokeWidth="3.5" />
      <path d="M97 132 L100 162 L103 132 Z" fill="#9B7EDE" stroke={stroke} strokeWidth="3.5" />

      {/* Steaming Coffee Mug held by tiny hand */}
      <rect x="134" y="138" width="22" height="24" rx="4" fill="#FF8FAB" stroke={stroke} strokeWidth="3.5" />
      <path d="M 156 144 C 160 144 162 148 162 150 C 162 152 160 156 156 156" stroke={stroke} strokeWidth="3.5" fill="none" />
      {/* Steam */}
      <path d="M140 128 Q 144 122 142 132" stroke={stroke} strokeWidth="2" fill="none" />
      <path d="M148 128 Q 152 122 150 132" stroke={stroke} strokeWidth="2" fill="none" />

      {/* Huge Chibi Head */}
      <circle cx="100" cy="74" r="50" fill="#FFE0BD" stroke={stroke} strokeWidth="4" />

      {/* Messy spiky hair (stressed office worker) */}
      <path d="M50 72 C50 40 64 26 100 26 C136 26 150 40 150 72 C150 72 140 48 130 52 C120 48 110 54 100 48 C90 54 80 48 70 52 C60 48 50 72 50 72 Z" fill="#1F1410" stroke={stroke} strokeWidth="4" strokeLinejoin="round" />

      {/* Expression Face System */}
      <ChibiFaceElements mood={cleanMood} eyeY={74} eyeGap={22} />
    </svg>
  );
}

// ─── 8. ATHLETE PATIENT MASCOT (SUPER CUTE CHIBI REDESIGN) ─────────
export function AthletePatientMascot({ size = 200, mood = 'neutral', style, className }: MascotProps) {
  const cleanMood = normalizeMood(mood);
  const stroke = '#000000';
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" fill="none" style={style} className={`${className} floaty`}>
      {/* Background Badge circle */}
      <circle cx="100" cy="100" r="86" fill="var(--mint-lt)" stroke={stroke} strokeWidth="4" />

      {/* Tiny Active Body & Athletic Tank Top */}
      <path d="M72 145 C72 130 82 125 100 125 C118 125 128 130 128 145 L126 180 H74 Z" fill="#FFEADB" stroke={stroke} strokeWidth="4" />
      <path d="M78 132 L84 180 H116 L122 132 Z" fill="#74CFFF" stroke={stroke} strokeWidth="4" strokeLinejoin="round" />

      {/* Huge Chibi Head */}
      <circle cx="100" cy="74" r="50" fill="#FFEADB" stroke={stroke} strokeWidth="4" />

      {/* Athletic Spiky yellow hair */}
      <path d="M50 50 Q 34 26 62 30 Q 80 10 100 24 Q 120 10 138 30 Q 166 26 150 50 Z" fill="#FFD166" stroke={stroke} strokeWidth="4" strokeLinejoin="round" />

      {/* Sports sweat headband */}
      <rect x="52" y="44" width="96" height="15" fill="#FF8FAB" stroke={stroke} strokeWidth="4" />
      <path d="M84 44 V59 M116 44 V59" stroke={stroke} strokeWidth="3" />

      {/* Bandage (band-aid) on cheek */}
      <rect x="112" y="90" width="18" height="8" rx="2" fill="#FFD166" stroke={stroke} strokeWidth="2.5" transform="rotate(-15 121 94)" />

      {/* Expression Face System */}
      <ChibiFaceElements mood={cleanMood} eyeY={76} eyeGap={22} />
    </svg>
  );
}

// ─── 9. PREGNANT PATIENT MASCOT (SUPER CUTE CHIBI REDESIGN) ────────
export function PregnantPatientMascot({ size = 200, mood = 'neutral', style, className }: MascotProps) {
  const cleanMood = normalizeMood(mood);
  const stroke = '#000000';
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" fill="none" style={style} className={`${className} floaty`}>
      {/* Background Badge circle */}
      <circle cx="100" cy="100" r="86" fill="var(--rose-lt)" stroke={stroke} strokeWidth="4" />

      {/* Tiny Body & Cozy Pink Sweater over big round pregnant belly */}
      <path d="M72 145 C72 130 82 125 100 125 C118 125 128 130 128 145 L126 180 H74 Z" fill="#FFE5EC" stroke={stroke} strokeWidth="4" />
      {/* Giant cute round baby belly */}
      <circle cx="100" cy="166" r="32" fill="#FF8FAB" stroke={stroke} strokeWidth="4" />
      {/* Tiny hands holding the belly */}
      <path d="M74 154 Q 100 172 126 154" stroke={stroke} strokeWidth="4" fill="none" strokeLinecap="round" />

      {/* Huge Chibi Head */}
      <circle cx="100" cy="74" r="50" fill="#FFE0BD" stroke={stroke} strokeWidth="4" />

      {/* Soft brown hair */}
      <path d="M50 72 C50 42 66 28 100 28 C134 28 150 42 150 72 C150 94 156 122 150 128 C144 118 144 80 100 80 C56 80 56 118 50 128 C44 122 50 94 50 72 Z" fill="#5A3A22" stroke={stroke} strokeWidth="4" strokeLinejoin="round" />

      {/* Floral hair crown or cute flower accessory */}
      <circle cx="134" cy="46" r="8" fill="#FFF5D6" stroke={stroke} strokeWidth="2.5" />
      <circle cx="142" cy="46" r="4" fill="#FF6B6B" stroke={stroke} strokeWidth="1.5" />
      <circle cx="126" cy="46" r="4" fill="#FF6B6B" stroke={stroke} strokeWidth="1.5" />

      {/* Expression Face System */}
      <ChibiFaceElements mood={cleanMood} eyeY={74} eyeGap={22} />
    </svg>
  );
}

// ─── GENERAL MASCOT WRAPPER COMPONENT ──────────────────────────────
interface GeneralMascotProps extends MascotProps {
  name: string;
}

export function Mascot({ name, size = 200, mood = 'neutral', style, className }: GeneralMascotProps) {
  const enhancedStyle = {
    ...style,
    filter: `${style?.filter || ''} saturate(1.25) drop-shadow(4px 4px 0px rgba(17, 27, 87, 0.125))`,
  };

  switch (name) {
    case 'gp':
      return <GPMascot size={size} style={enhancedStyle} className={className} />;
    case 'emergency':
      return <EmergencyMascot size={size} style={enhancedStyle} className={className} />;
    case 'scientist':
      return <ScientistMascot size={size} style={enhancedStyle} className={className} />;
    case 'nurse':
      return <NurseMascot size={size} style={enhancedStyle} className={className} />;
    case 'elderly':
      return <ElderlyPatientMascot size={size} mood={mood} style={enhancedStyle} className={className} />;
    case 'child':
      return <ChildPatientMascot size={size} mood={mood} style={enhancedStyle} className={className} />;
    case 'pregnant':
      return <PregnantPatientMascot size={size} mood={mood} style={enhancedStyle} className={className} />;
    case 'athlete':
      return <AthletePatientMascot size={size} mood={mood} style={enhancedStyle} className={className} />;
    case 'officeWorker':
    default:
      return <OfficeWorkerPatientMascot size={size} mood={mood} style={enhancedStyle} className={className} />;
  }
}

// ─── CASE-TO-MASCOT SELECTOR UTILITY ───────────────────────────────
export function getPatientMascot(c: { id: string; age: number; sex: 'M' | 'F'; complaint: string; cond: string }) {
  const cc = (c.complaint || '').toLowerCase();
  const condName = (c.cond || '').toLowerCase();
  const idStr = (c.id || '').toLowerCase();

  if (c.age >= 65) return 'elderly';
  if (c.age < 14) return 'child';

  // Pregnant mom check
  if (c.sex === 'F' && c.age >= 18 && c.age <= 45 && (
    cc.includes('pregnan') || cc.includes('baby') || cc.includes('womb') ||
    condName.includes('pregnan') || condName.includes('gestational') || idStr.includes('obgyn')
  )) {
    return 'pregnant';
  }

  // Athlete check
  if (
    condName.includes('asthma') || condName.includes('sprain') || condName.includes('injury') ||
    condName.includes('fracture') || cc.includes('run') || cc.includes('exercise') ||
    cc.includes('sport') || cc.includes('athlete') || cc.includes('gym')
  ) {
    return 'athlete';
  }

  // Default office worker fallback
  return 'officeWorker';
}
