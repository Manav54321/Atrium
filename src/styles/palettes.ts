export type PaletteName = 'sunshine' | 'candy' | 'forest';

const PALETTES: Record<PaletteName, Record<string, string>> = {
  sunshine: {
    '--cream': '#FFF8F5',
    '--cream-2': '#FFF0E8',
    '--paper': '#FFFFFF',
    
    '--peach': '#FFA07A',
    '--peach-lt': '#FFD4C2',
    '--peach-deep': '#E07A57',
    
    '--butter': '#FFD166',
    '--butter-lt': '#FFF0B3',
    '--butter-deep': '#B38600',
    
    '--mint': '#4ECDC4',
    '--mint-lt': '#A8EDE9',
    '--mint-deep': '#2BB5AB',
    
    '--sky': '#45B7D1',
    '--sky-lt': '#B3E5F0',
    '--sky-deep': '#2896B5',
    
    '--rose': '#FF8FA3',
    '--rose-lt': '#FFD4DC',
    '--rose-deep': '#E0607A',

    '--coral': '#FF6B6B',
    '--coral-lt': '#FFBEBE',
    '--coral-deep': '#E84E4E',

    '--lav': '#9B89FF',
    '--lav-lt': '#D8D1FF',
    '--lav-deep': '#7660F5',

    '--ink': '#1A1A2E',
    '--ink-2': '#4A4A6A',
    '--ink-soft': '#8E8EAA',
    '--line': 'rgba(74, 74, 106, 0.12)',
    '--shadow': 'rgba(26, 26, 46, 0.06)',
  },
  candy: {
    '--cream': '#FCF6FC',
    '--cream-2': '#F7ECF7',
    '--paper': '#FFFFFF',
    
    '--peach': '#FF7597',
    '--peach-lt': '#FFD4DF',
    '--peach-deep': '#D63E63',
    
    '--butter': '#FFD375',
    '--butter-lt': '#FFEAB5',
    '--butter-deep': '#B2831E',
    
    '--mint': '#70D6BC',
    '--mint-lt': '#C5F2E6',
    '--mint-deep': '#2E997D',
    
    '--sky': '#92A8D1',
    '--sky-lt': '#D0DBEE',
    '--sky-deep': '#4F679B',
    
    '--rose': '#FF7597',
    '--rose-lt': '#FFD4DF',
    '--rose-deep': '#D63E63',

    '--coral': '#FF6B6B',
    '--coral-lt': '#FFBEBE',
    '--coral-deep': '#E84E4E',

    '--lav': '#9B89FF',
    '--lav-lt': '#D8D1FF',
    '--lav-deep': '#7660F5',

    '--ink': '#332733',
    '--ink-2': '#665266',
    '--ink-soft': '#948294',
    '--line': 'rgba(90, 69, 90, 0.12)',
    '--shadow': 'rgba(44, 30, 44, 0.06)',
  },
  forest: {
    '--cream': '#F4F8F4',
    '--cream-2': '#E3EEE3',
    '--paper': '#FFFFFF',
    
    '--peach': '#81B214',
    '--peach-lt': '#D4E9A4',
    '--peach-deep': '#4E7805',
    
    '--butter': '#FDE24F',
    '--butter-lt': '#FFF3B8',
    '--butter-deep': '#A28A07',
    
    '--mint': '#5EAAA8',
    '--mint-lt': '#C9E3E2',
    '--mint-deep': '#2C7573',
    
    '--sky': '#8FA7DC',
    '--sky-lt': '#D1DCF2',
    '--sky-deep': '#4964A1',
    
    '--rose': '#E98B8B',
    '--rose-lt': '#F8DADA',
    '--rose-deep': '#AD4343',

    '--coral': '#FF6B6B',
    '--coral-lt': '#FFBEBE',
    '--coral-deep': '#E84E4E',

    '--lav': '#9B89FF',
    '--lav-lt': '#D8D1FF',
    '--lav-deep': '#7660F5',

    '--ink': '#243124',
    '--ink-2': '#4D5C4D',
    '--ink-soft': '#7D8D7D',
    '--line': 'rgba(94, 170, 168, 0.12)',
    '--shadow': 'rgba(26, 40, 26, 0.06)',
  },
};

export function applyPalette(name: PaletteName) {
  const p = PALETTES[name] ?? PALETTES.sunshine;
  const root = document.documentElement;
  for (const [k, v] of Object.entries(p)) root.style.setProperty(k, v);
}

export function applyIntensity(intensity: number) {
  const root = document.documentElement;
  root.style.setProperty('--stroke', intensity >= 1.5 ? '2px' : intensity <= 0.6 ? '0.5px' : '1px');
  root.style.setProperty('--stroke-thick', intensity >= 1.5 ? '3px' : intensity <= 0.6 ? '1.5px' : '2px');
}

