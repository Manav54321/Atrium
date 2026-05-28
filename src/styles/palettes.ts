export type PaletteName = 'sunshine' | 'candy' | 'forest';

const PALETTES: Record<PaletteName, Record<string, string>> = {
  sunshine: {
    '--cream': '#FDFBF7',
    '--cream-2': '#FFF6EE',
    '--paper': '#FFFFFF',
    '--peach': '#FF7B54',
    '--peach-deep': '#FFB26B',
    '--butter': '#FFD56B',
    '--butter-deep': '#FFEBB4',
    '--mint': '#84D2C4',
    '--mint-deep': '#B6ECE2',
    '--sky': '#9CB4CC',
    '--sky-deep': '#D3E4CD',
    '--rose': '#F47A92',
    '--rose-deep': '#FFB5C5',
    '--ink': '#2D2727',
    '--ink-2': '#5F5454',
    '--ink-soft': '#8E8282',
    '--line': 'rgba(255, 123, 84, 0.15)',
    '--shadow': 'rgba(255, 123, 84, 0.08)',
  },
  candy: {
    '--cream': '#FCF6FC',
    '--cream-2': '#F7ECF7',
    '--paper': '#FFFFFF',
    '--peach': '#FF7597',
    '--peach-deep': '#FFB5C5',
    '--butter': '#FFD375',
    '--butter-deep': '#FFEAB5',
    '--mint': '#70D6BC',
    '--mint-deep': '#B5EAD7',
    '--sky': '#92A8D1',
    '--sky-deep': '#C5D3E8',
    '--rose': '#FF7597',
    '--rose-deep': '#FFB5C5',
    '--ink': '#332733',
    '--ink-2': '#665266',
    '--ink-soft': '#948294',
    '--line': 'rgba(255, 117, 151, 0.15)',
    '--shadow': 'rgba(255, 117, 151, 0.08)',
  },
  forest: {
    '--cream': '#F6FAF6',
    '--cream-2': '#EBF3EB',
    '--paper': '#FFFFFF',
    '--peach': '#4E9F3D',
    '--peach-deep': '#81B214',
    '--butter': '#FDE24F',
    '--butter-deep': '#FFF3B3',
    '--mint': '#5EAAA8',
    '--mint-deep': '#A3D2CA',
    '--sky': '#8FA7DC',
    '--sky-deep': '#C7D5F2',
    '--rose': '#E98B8B',
    '--rose-deep': '#F2C4C4',
    '--ink': '#243124',
    '--ink-2': '#4D5C4D',
    '--ink-soft': '#7D8D7D',
    '--line': 'rgba(94, 170, 168, 0.18)',
    '--shadow': 'rgba(94, 170, 168, 0.08)',
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

