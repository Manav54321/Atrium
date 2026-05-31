export type PaletteName = 'sunshine' | 'candy' | 'forest';

const PALETTES: Record<PaletteName, Record<string, string>> = {
  sunshine: {
    '--cream': '#DFF5FF',
    '--cream-2': '#E3F7FF',
    '--paper': '#FFFFFF',
    
    '--peach': '#FF8A5B',
    '--peach-lt': '#FFF0ED',
    '--peach-deep': '#D96232',
    
    '--butter': '#FFD84D',
    '--butter-lt': '#FFF5CC',
    '--butter-deep': '#CFA22B',
    
    '--mint': '#20C9D2',
    '--mint-lt': '#DFFBE6',
    '--mint-deep': '#1CA89E',
    
    '--sky': '#74CFFF',
    '--sky-lt': '#DFF5FF',
    '--sky-deep': '#1D8EA8',
    
    '--rose': '#FF8FB1',
    '--rose-lt': '#FFE5EC',
    '--rose-deep': '#D96281',

    '--coral': '#FF6B6B',
    '--coral-lt': '#FFF0E8',
    '--coral-deep': '#D94B4B',

    '--lav': '#A978FF',
    '--lav-lt': '#F3E8FF',
    '--lav-deep': '#7858BF',

    '--ink': '#000000',
    '--ink-2': '#000000',
    '--ink-soft': '#000000',
    '--line': '#000000',
    '--shadow': '#000000',
  },
  candy: {
    '--cream': '#F4FCFF',
    '--cream-2': '#F0FAFF',
    '--paper': '#FFFFFF',
    
    '--peach': '#FF8FAB',
    '--peach-lt': '#FFE5EC',
    '--peach-deep': '#D96281',
    
    '--butter': '#FFD44D',
    '--butter-lt': '#FFFCE8',
    '--butter-deep': '#CFA22B',
    
    '--mint': '#20C9D2',
    '--mint-lt': '#E9FFF6',
    '--mint-deep': '#1CA89E',
    
    '--sky': '#A978FF',
    '--sky-lt': '#F3EDFF',
    '--sky-deep': '#7858BF',
    
    '--rose': '#FF8FAB',
    '--rose-lt': '#FFE5EC',
    '--rose-deep': '#D96281',

    '--coral': '#FF6B6B',
    '--coral-lt': '#FFF0ED',
    '--coral-deep': '#D94B4B',

    '--lav': '#A978FF',
    '--lav-lt': '#F3EDFF',
    '--lav-deep': '#7858BF',

    '--ink': '#000000',
    '--ink-2': '#000000',
    '--ink-soft': '#000000',
    '--line': '#000000',
    '--shadow': '#000000',
  },
  forest: {
    '--cream': '#F4FCFF',
    '--cream-2': '#F0FAFF',
    '--paper': '#FFFFFF',
    
    '--peach': '#7EE3B5',
    '--peach-lt': '#E9FFF6',
    '--peach-deep': '#41A84D',
    
    '--butter': '#FFD44D',
    '--butter-lt': '#FFFCE8',
    '--butter-deep': '#CFA22B',
    
    '--mint': '#20C9D2',
    '--mint-lt': '#E9FFF6',
    '--mint-deep': '#1CA89E',
    
    '--sky': '#BDEEFF',
    '--sky-lt': '#F4FCFF',
    '--sky-deep': '#1D8EA8',
    
    '--rose': '#FF8FAB',
    '--rose-lt': '#FFE5EC',
    '--rose-deep': '#D96281',

    '--coral': '#FF6B6B',
    '--coral-lt': '#FFF0ED',
    '--coral-deep': '#D94B4B',

    '--lav': '#A978FF',
    '--lav-lt': '#F3EDFF',
    '--lav-deep': '#7858BF',

    '--ink': '#000000',
    '--ink-2': '#000000',
    '--ink-soft': '#000000',
    '--line': '#000000',
    '--shadow': '#000000',
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
