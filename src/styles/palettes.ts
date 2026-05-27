export type PaletteName = 'sunshine' | 'candy' | 'forest';

const PALETTES: Record<PaletteName, Record<string, string>> = {
  sunshine: {
    '--cream': '#f8fafc', '--cream-2': '#ffffff',
    '--peach': '#0284c7', '--peach-deep': '#0369a1',
    '--butter': '#ea580c', '--butter-deep': '#c2410c',
    '--mint': '#0d9488', '--mint-deep': '#0f766e',
    '--sky': '#06b6d4', '--sky-deep': '#0891b2',
    '--rose': '#e11d48', '--rose-deep': '#be123c',
    '--paper': '#f1f5f9',
  },
  candy: {
    '--cream': '#faf5f8', '--cream-2': '#ffffff',
    '--peach': '#d946ef', '--peach-deep': '#c084fc',
    '--butter': '#ea580c', '--butter-deep': '#c2410c',
    '--mint': '#0d9488', '--mint-deep': '#0f766e',
    '--sky': '#06b6d4', '--sky-deep': '#0891b2',
    '--rose': '#e11d48', '--rose-deep': '#be123c',
    '--paper': '#f3e8ff',
  },
  forest: {
    '--cream': '#f4fbf7', '--cream-2': '#ffffff',
    '--peach': '#10b981', '--peach-deep': '#059669',
    '--butter': '#ea580c', '--butter-deep': '#c2410c',
    '--mint': '#10b981', '--mint-deep': '#047857',
    '--sky': '#0ea5e9', '--sky-deep': '#0369a1',
    '--rose': '#e11d48', '--rose-deep': '#be123c',
    '--paper': '#d1fae5',
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
