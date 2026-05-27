import type { FaceAccessory, FaceMood } from '../components/primitives';
import type { PatientCase } from '../game/types';
import type { ClinicId } from '../game/clinic';
import { CLINIC_LABELS } from '../game/clinic';
import { POLYCLINIC_CASES, POLYCLINIC_DIAGNOSIS_LABELS } from './polyclinicPatients';

/** Cute-cartoon face descriptor for the case library. Derived deterministically
 *  from the underlying `PatientCase` so the same patient always renders the
 *  same face across screens. */
export interface Case {
  id: string;
  name: string;
  age: number;
  sex: 'M' | 'F';
  complaint: string;
  tags: string[];
  guideline: string;
  skin: string;
  hair: string;
  mood: FaceMood;
  cond: string;
  attempted?: boolean;
  score?: string;
  accessory?: FaceAccessory;
  /** The clinic / specialty this patient belongs to, so the library can filter
   *  by specialty as well as by condition. */
  clinic: ClinicId;
}

// ── deterministic palette pickers ─────────────────────────────────────
//
// We derive the cartoon face from `id + age + gender` so faces stay stable
// across reloads (no random Math.random() at module init).

const SKIN_TONES = [
  '#FFE0BD', // pale cream
  '#FFD8B5', // light peach
  '#FFD0B0', // warm beige
  '#E8B68F', // tan
  '#D89B6E', // medium
  '#B47148', // deep tan
  '#7B4F2E', // brown
  '#4A2E1C', // dark brown
];

const HAIR_TONES = [
  '#1F1410', // black
  '#2B1810', // dark brown
  '#3B2A1F', // brown
  '#5A3A22', // chestnut
  '#A8855E', // light brown
  '#D9B380', // dirty blonde
  '#E5DACE', // grey
  '#9F9F9F', // silver
];

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function pickSkin(p: PatientCase): string {
  return SKIN_TONES[hash(p.id + 'skin') % SKIN_TONES.length];
}

function pickHair(p: PatientCase): string {
  // Older patients lean grey/silver.
  if (p.age >= 65) return HAIR_TONES[6 + (hash(p.id) % 2)];
  return HAIR_TONES[hash(p.id + 'hair') % 6];
}

function pickMood(p: PatientCase): FaceMood {
  if (p.severity === 'critical') return 'sad';
  if (p.severity === 'urgent') return 'sick';
  // Mild anxiety hint based on chief complaint keywords.
  const cc = p.chiefComplaint.toLowerCase();
  if (/(pain|chest|headache|bleed)/.test(cc)) return 'worried';
  if (/(fever|cough|nausea|vomit|sore)/.test(cc)) return 'sick';
  return 'neutral';
}

function diagLabel(id: string): string {
  return POLYCLINIC_DIAGNOSIS_LABELS[id] ?? id.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function tagsFor(p: PatientCase, clinic: ClinicId): string[] {
  const out: string[] = [];
  if (p.severity === 'critical') out.push('red flag');
  else if (p.severity === 'urgent') out.push('urgent');
  out.push(CLINIC_LABELS[clinic].toLowerCase());
  return out;
}

function toCase(p: PatientCase, clinic: ClinicId): Case {
  return {
    id: p.id,
    name: p.name,
    age: p.age,
    sex: p.gender,
    complaint: p.chiefComplaint,
    tags: tagsFor(p, clinic),
    guideline: 'Polyclinic',
    skin: pickSkin(p),
    hair: pickHair(p),
    mood: pickMood(p),
    cond: diagLabel(p.correctDiagnosisId),
    clinic,
  };
}

// ── Build the library deterministically from POLYCLINIC_CASES ────────

const BY_ID = new Map<string, { p: PatientCase; clinic: ClinicId }>();
const ALL_CASES_RAW: Case[] = [];

for (const [clinic, list] of Object.entries(POLYCLINIC_CASES) as Array<[ClinicId, PatientCase[]]>) {
  if (clinic === 'all-specialties') continue; // skip the synthetic mixed bucket
  for (const p of list) {
    if (BY_ID.has(p.id)) continue;
    BY_ID.set(p.id, { p, clinic });
    ALL_CASES_RAW.push(toCase(p, clinic));
  }
}

export const CASES: Case[] = ALL_CASES_RAW;

/** All distinct condition labels in the catalogue, plus a couple of fixed
 *  filter chips ('All', 'Red-flag only'). */
const conditionSet = new Set(CASES.map((c) => c.cond));
export const CONDITION_FILTERS: string[] = ['All', ...Array.from(conditionSet).slice(0, 8), 'Red-flag only'];

/** Stable colour per condition for chips and ribbons — picks from the
 *  cozy-cartoon palette using a hash. */
const PALETTE_VARS = ['var(--rose)', 'var(--peach)', 'var(--mint)', 'var(--sky)', 'var(--butter)'];
function colourFor(label: string): string {
  return PALETTE_VARS[hash(label) % PALETTE_VARS.length];
}
export const CONDITION_COLORS: Record<string, string> = Object.fromEntries(
  Array.from(conditionSet).map((c) => [c, colourFor(c)]),
);

/** Lookup by id — used by every screen that needs the current case. */
export function getCase(id: string): Case {
  const found = CASES.find((c) => c.id === id);
  if (found) return found;
  return CASES[0];
}

/** Look up the underlying medical PatientCase (anamnesis, vitals,
 *  diagnosis options, test results, etc.) — used by the encounter /
 *  brief / debrief screens that need more than the cartoon face. */
export function getPatientCase(id: string): PatientCase | undefined {
  return BY_ID.get(id)?.p;
}

/** Which clinic does this case belong to? */
export function getCaseClinic(id: string): ClinicId | undefined {
  return BY_ID.get(id)?.clinic;
}
