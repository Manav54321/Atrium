import type { Treatment } from '../game/types';

export const TREATMENTS: Treatment[] = [
  { id: 'aspirin', name: 'Aspirin 325mg PO', category: 'medication' },
  { id: 'nitro', name: 'Nitroglycerin SL', category: 'medication' },
  { id: 'heparin', name: 'Heparin drip', category: 'medication' },
  { id: 'cath-lab', name: 'Activate cath lab', category: 'procedure' },
  { id: 'tpa', name: 'tPA (alteplase)', category: 'medication' },
  { id: 'epi-im', name: 'Epinephrine 0.3mg IM', category: 'medication' },
  { id: 'antihistamine', name: 'Diphenhydramine IV', category: 'medication' },
  { id: 'steroids-iv', name: 'Methylprednisolone IV', category: 'medication' },
  { id: 'neb-albuterol', name: 'Nebulized albuterol', category: 'medication' },
  { id: 'o2', name: 'Supplemental O2', category: 'procedure' },
  { id: 'iv-fluids', name: 'IV fluids (NS bolus)', category: 'procedure' },
  { id: 'abx-broad', name: 'Broad-spectrum antibiotics', category: 'medication' },
  { id: 'analgesia', name: 'Analgesia (morphine)', category: 'medication' },
  { id: 'ondansetron', name: 'Ondansetron 4mg IV', category: 'medication' },
  { id: 'surgery-consult', name: 'Surgery consult', category: 'disposition' },
  { id: 'admit-icu', name: 'Admit to ICU', category: 'disposition' },
  { id: 'admit-floor', name: 'Admit to floor', category: 'disposition' },
  { id: 'observe', name: 'Observation unit', category: 'disposition' },
  { id: 'discharge', name: 'Discharge home', category: 'disposition' },
  { id: 'insulin-infusion', name: 'Insulin infusion', category: 'medication' },
  { id: 'k-replacement', name: 'Potassium replacement', category: 'medication' },
];

export const treatmentById = (id: string) => TREATMENTS.find((t) => t.id === id);
