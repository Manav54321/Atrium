export type PaletteName = 'sunshine' | 'candy' | 'forest';

const PALETTES: Record<PaletteName, Record<string, string>> = {
  sunshine: {
    '--cream': '#EFFAFF',
    '--cream-2': '#DDF3FF',
    '--paper': '#FFFFFF',
    
    '--peach': '#FF8A5B',
    '--peach-lt': '#FFEADB',
    '--peach-deep': '#D96232',
    
    '--butter': '#FFD166',
    '--butter-lt': '#FFF5D6',
    '--butter-deep': '#CFA22B',
    
    '--mint': '#4ECDC4',
    '--mint-lt': '#CCF5F1',
    '--mint-deep': '#1CA89E',
    
    '--sky': '#74CFFF',
    '--sky-lt': '#D4F3F8',
    '--sky-deep': '#1D8EA8',
    
    '--rose': '#FF8FAB',
    '--rose-lt': '#FFE5EC',
    '--rose-deep': '#D96281',

    '--coral': '#FF6B6B',
    '--coral-lt': '#FFE3E3',
    '--coral-deep': '#D94B4B',

    '--lav': '#9B7EDE',
    '--lav-lt': '#ECE5FA',
    '--lav-deep': '#7858BF',

    '--ink': '#151B3D',
    '--ink-2': '#2A2F54',
    '--ink-soft': '#575D8F',
    '--line': '#151B3D',
    '--shadow': '#151B3D',
  },
  candy: {
    '--cream': '#FFF5F8',
    '--cream-2': '#FFE5EC',
    '--paper': '#FFFFFF',
    
    '--peach': '#FF8FAB',
    '--peach-lt': '#FFE5EC',
    '--peach-deep': '#D96281',
    
    '--butter': '#FFD166',
    '--butter-lt': '#FFF5D6',
    '--butter-deep': '#CFA22B',
    
    '--mint': '#4ECDC4',
    '--mint-lt': '#CCF5F1',
    '--mint-deep': '#1CA89E',
    
    '--sky': '#9B7EDE',
    '--sky-lt': '#ECE5FA',
    '--sky-deep': '#7858BF',
    
    '--rose': '#FF8FAB',
    '--rose-lt': '#FFE5EC',
    '--rose-deep': '#D96281',

    '--coral': '#FF6B6B',
    '--coral-lt': '#FFE3E3',
    '--coral-deep': '#D94B4B',

    '--lav': '#9B7EDE',
    '--lav-lt': '#ECE5FA',
    '--lav-deep': '#7858BF',

    '--ink': '#151B3D',
    '--ink-2': '#2A2F54',
    '--ink-soft': '#575D8F',
    '--line': '#151B3D',
    '--shadow': '#151B3D',
  },
  forest: {
    '--cream': '#F3F8F3',
    '--cream-2': '#E1F7E4',
    '--paper': '#FFFFFF',
    
    '--peach': '#6BCB77',
    '--peach-lt': '#E1F7E4',
    '--peach-deep': '#41A84D',
    
    '--butter': '#FFD166',
    '--butter-lt': '#FFF5D6',
    '--butter-deep': '#CFA22B',
    
    '--mint': '#4ECDC4',
    '--mint-lt': '#CCF5F1',
    '--mint-deep': '#1CA89E',
    
    '--sky': '#45B7D1',
    '--sky-lt': '#D4F3F8',
    '--sky-deep': '#1D8EA8',
    
    '--rose': '#FF8FAB',
    '--rose-lt': '#FFE5EC',
    '--rose-deep': '#D96281',

    '--coral': '#FF6B6B',
    '--coral-lt': '#FFE3E3',
    '--coral-deep': '#D94B4B',

    '--lav': '#9B7EDE',
    '--lav-lt': '#ECE5FA',
    '--lav-deep': '#7858BF',

    '--ink': '#151B3D',
    '--ink-2': '#2A2F54',
    '--ink-soft': '#575D8F',
    '--line': '#151B3D',
    '--shadow': '#151B3D',
  },
};

export function applyPalette(name: PaletteName) {
  const p = PALETTES[name] ?? PALETTES.sunshine;
  const root = document.documentElement;
  for (const [k, v] of Object.entries(p)) root.style.setProperty(k, v);
}

export function applyIntensity(_intensity: number) {
  const root = document.documentElement;
  // Enforce bold cartoon borders of 4px regardless of intensity slider
  root.style.setProperty('--stroke', '4px');
  root.style.setProperty('--stroke-thick', '4px');
}
