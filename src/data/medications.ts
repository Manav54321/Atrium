/**
 * Medication catalog for the polyclinic prescription workflow.
 *
 * Each entry lists the diagnosis IDs (from `polyclinicPatients.ts` /
 * `patients.ts`) for which the drug is clinically appropriate, plus an
 * explicit contraindications list when the drug would be dangerous or
 * medically inappropriate.  Grading uses these lists to award bonuses for
 * correct prescribing and penalties for wrong/dangerous choices.
 *
 * This is a TRAINING catalogue — doses and indications reflect common
 * real-world outpatient practice but must NOT be used as clinical guidance
 * outside the simulator.
 */

import type { ClinicId } from '../game/clinic';

/**
 * High-level therapeutic category used to group the prescription pad.
 * Finer-grained `class` (e.g. "SSRI", "ACE inhibitor") nests under this.
 */
export type MedicationCategory =
  | 'antibiotic'
  | 'antiviral'
  | 'antifungal'
  | 'cardiovascular'
  | 'antiplatelet-anticoagulant'
  | 'lipid-lowering'
  | 'endocrine'
  | 'analgesic'
  | 'gastrointestinal'
  | 'respiratory'
  | 'allergy'
  | 'neurology'
  | 'psychiatry'
  | 'rheumatology'
  | 'dermatology'
  | 'ophthalmic'
  | 'urology'
  | 'obgyn'
  | 'hematology-nutrition';

export interface Medication {
  id: string;
  name: string;
  form: 'tablet' | 'capsule' | 'solution' | 'cream' | 'spray' | 'injection';
  category: MedicationCategory;
  class: string;
  defaultDose: string;
  defaultDuration: string;
  /** Diagnosis IDs for which this drug is an appropriate outpatient choice. */
  indications: string[];
  /** Diagnosis IDs where this drug is explicitly wrong / dangerous. */
  contraindications?: string[];
}

/* ------------------------------------------------------------------ */
/*  Catalog                                                            */
/* ------------------------------------------------------------------ */

export const MEDICATIONS: Medication[] = [
  // ─────────── Antibiotics ───────────
  {
    id: 'amoxicillin-clavulanate-1g',
    name: 'Amoxicillin/Clavulanate 1g',
    form: 'tablet',
    category: 'antibiotic',
    class: 'Penicillin + β-lactamase inhibitor',
    defaultDose: '1 tab, 2×1, PO',
    defaultDuration: '7 days',
    indications: [
      'acute-sinusitis-bacterial',
      'otitis-media-adult',
      'acute-otitis-media-child',
      'community-acquired-pna',
      'pneumonia',
      'cellulitis-non-limb-threatening',
      'dental-abscess',
      'pid-outpatient',
    ],
    contraindications: ['drug-allergy-penicillin', 'viral-uri', 'viral-gastroenteritis'],
  },
  {
    id: 'azithromycin-500',
    name: 'Azithromycin 500mg',
    form: 'tablet',
    category: 'antibiotic',
    class: 'Macrolide antibiotic',
    defaultDose: '1 tab, 1×1, PO (day 1: 2 tb)',
    defaultDuration: '5 days',
    indications: [
      'community-acquired-pna',
      'pneumonia',
      'chronic-bronchitis',
      'pid-outpatient',
      'pid-gonococcal',
    ],
    contraindications: ['viral-uri'],
  },
  {
    id: 'ciprofloxacin-500',
    name: 'Ciprofloxacin 500mg',
    form: 'tablet',
    category: 'antibiotic',
    class: 'Fluoroquinolone antibiotic',
    defaultDose: '1 tab, 2×1, PO',
    defaultDuration: '7 days',
    indications: [
      'uti-uncomplicated',
      'recurrent-uti-female',
      'uti',
      'pyelonephritis',
      'prostatitis-chronic',
      'brucellosis',
    ],
    contraindications: ['viral-uri', 'viral-gastroenteritis', 'atopic-dermatitis'],
  },
  {
    id: 'cefuroxime-500',
    name: 'Cefuroxime Axetil 500mg',
    form: 'tablet',
    category: 'antibiotic',
    class: '2nd-gen cephalosporin',
    defaultDose: '1 tab, 2×1, PO',
    defaultDuration: '7 days',
    indications: [
      'acute-sinusitis-bacterial',
      'otitis-media-adult',
      'community-acquired-pna',
      'cellulitis-non-limb-threatening',
    ],
  },
  {
    id: 'doxycycline-100',
    name: 'Doxycycline 100mg',
    form: 'tablet',
    category: 'antibiotic',
    class: 'Tetracycline antibiotic',
    defaultDose: '1 tab, 2×1, PO',
    defaultDuration: '14 days',
    indications: [
      'acne-vulgaris',
      'rosacea',
      'lyme-disease',
      'brucellosis',
      'pid-outpatient',
      'chronic-bronchitis',
      'community-acquired-pna',
    ],
    contraindications: ['normal-pregnancy-2nd-tri', 'gestational-dm'],
  },
  {
    id: 'penicillin-v-500',
    name: 'Penicillin V 500mg',
    form: 'tablet',
    category: 'antibiotic',
    class: 'Natural penicillin',
    defaultDose: '1 tab,4×1, PO',
    defaultDuration: '10 days',
    indications: ['tonsillitis-strep', 'strep-pharyngitis-child'],
    contraindications: ['drug-allergy-penicillin', 'viral-uri'],
  },
  {
    id: 'metronidazole-500',
    name: 'Metronidazole 500mg',
    form: 'tablet',
    category: 'antibiotic',
    class: 'Nitroimidazole antibiotic',
    defaultDose: '1 tab, 2×1, PO',
    defaultDuration: '7 days',
    indications: ['bacterial-vaginosis', 'pid-outpatient', 'trichomoniasis'],
    contraindications: ['alcohol-use-disorder'],
  },
  {
    id: 'nitrofurantoin-100',
    name: 'Nitrofurantoin 100mg',
    form: 'capsule',
    category: 'antibiotic',
    class: 'Urinary antibiotic',
    defaultDose: '1 cap, 2×1, PO',
    defaultDuration: '5 days',
    indications: ['uti-uncomplicated', 'recurrent-uti-female', 'uti'],
    contraindications: ['ckd-stage3a', 'pyelonephritis', 'diabetic-nephropathy'],
  },
  {
    id: 'tmp-smx-ds',
    name: 'Trimethoprim/Sulfamethoxazole DS',
    form: 'tablet',
    category: 'antibiotic',
    class: 'Folate-antagonist antibiotic',
    defaultDose: '1 tab, 2×1, PO',
    defaultDuration: '5 days',
    indications: ['uti-uncomplicated', 'recurrent-uti-female', 'prostatitis-chronic'],
    contraindications: ['ckd-stage3a', 'normal-pregnancy-2nd-tri'],
  },
  {
    id: 'clotrimazole-vag',
    name: 'Clotrimazole Vaginal Cream',
    form: 'cream',
    category: 'antifungal',
    class: 'Topical azole antifungal',
    defaultDose: '1 applicator at bedtime',
    defaultDuration: '7 days',
    indications: ['candida-vulvovaginitis'],
  },
  {
    id: 'acyclovir-800',
    name: 'Acyclovir 800mg',
    form: 'tablet',
    category: 'antiviral',
    class: 'Antiviral (nucleoside analog)',
    defaultDose: '1 tab,5×1, PO',
    defaultDuration: '7 days',
    indications: ['shingles', 'herpes-simplex-keratitis', 'varicella'],
  },

  // ─────────── Antihypertensives ───────────
  {
    id: 'amlodipine-5',
    name: 'Amlodipine 5mg',
    form: 'tablet',
    category: 'cardiovascular',
    class: 'Calcium channel blocker',
    defaultDose: '1 tab, 1×1, PO',
    defaultDuration: 'ongoing',
    indications: [
      'essential-hypertension',
      'htn-uncontrolled',
      'hypertensive-nephrosclerosis',
      'stable-angina',
      'renal-artery-stenosis',
    ],
    contraindications: ['orthostatic-hypotension', 'chf-nyha2'],
  },
  {
    id: 'ramipril-5',
    name: 'Ramipril 5mg',
    form: 'tablet',
    category: 'cardiovascular',
    class: 'ACE inhibitor',
    defaultDose: '1 tab, 1×1, PO',
    defaultDuration: 'ongoing',
    indications: [
      'essential-hypertension',
      'htn-uncontrolled',
      'chf-nyha2',
      'chf',
      'diabetic-nephropathy',
      'iga-nephropathy',
      'ckd-stage3a',
      'type2-diabetes',
      'type2-dm-uncontrolled',
      'hypertensive-nephrosclerosis',
    ],
    contraindications: [
      'hereditary-angioedema',
      'angioedema-ace',
      'renal-artery-stenosis',
      'normal-pregnancy-2nd-tri',
      'aki-pre-renal',
    ],
  },
  {
    id: 'losartan-50',
    name: 'Losartan 50mg',
    form: 'tablet',
    category: 'cardiovascular',
    class: 'Angiotensin-receptor blocker',
    defaultDose: '1 tab, 1×1, PO',
    defaultDuration: 'ongoing',
    indications: [
      'essential-hypertension',
      'htn-uncontrolled',
      'diabetic-nephropathy',
      'chf-nyha2',
      'hypertensive-nephrosclerosis',
    ],
    contraindications: ['normal-pregnancy-2nd-tri', 'aki-pre-renal'],
  },
  {
    id: 'metoprolol-50',
    name: 'Metoprolol Succinate 50mg',
    form: 'tablet',
    category: 'cardiovascular',
    class: 'Cardioselective β-blocker',
    defaultDose: '1 tab, 1×1, PO',
    defaultDuration: 'ongoing',
    indications: [
      'paroxysmal-afib',
      'stable-angina',
      'chf-nyha2',
      'chf',
      'ventricular-pvcs',
      'hcm',
      'essential-hypertension',
      'htn-uncontrolled',
    ],
    contraindications: ['asthma-chronic', 'asthma-allergic', 'copd-gold2'],
  },
  {
    id: 'bisoprolol-5',
    name: 'Bisoprolol 5mg',
    form: 'tablet',
    category: 'cardiovascular',
    class: 'Cardioselective β-blocker',
    defaultDose: '1 tab, 1×1, PO',
    defaultDuration: 'ongoing',
    indications: [
      'chf-nyha2',
      'chf',
      'paroxysmal-afib',
      'stable-angina',
      'essential-hypertension',
    ],
    contraindications: ['asthma-chronic', 'asthma-allergic'],
  },
  {
    id: 'hctz-25',
    name: 'Hydrochlorothiazide 25mg',
    form: 'tablet',
    category: 'cardiovascular',
    class: 'Thiazide diuretic',
    defaultDose: '1 tab, 1×1, PO',
    defaultDuration: 'ongoing',
    indications: ['essential-hypertension', 'htn-uncontrolled'],
    contraindications: ['gout', 'nephrolithiasis-recurrent'],
  },
  {
    id: 'indapamide-15',
    name: 'Indapamide SR 1.5mg',
    form: 'tablet',
    category: 'cardiovascular',
    class: 'Thiazide-like diuretic',
    defaultDose: '1 tab, 1×1, PO',
    defaultDuration: 'ongoing',
    indications: ['essential-hypertension', 'htn-uncontrolled'],
    contraindications: ['gout'],
  },
  {
    id: 'spironolactone-25',
    name: 'Spironolactone 25mg',
    form: 'tablet',
    category: 'cardiovascular',
    class: 'Aldosterone antagonist',
    defaultDose: '1 tab, 1×1, PO',
    defaultDuration: 'ongoing',
    indications: ['chf-nyha2', 'chf', 'htn-uncontrolled', 'pcos', 'pcos-obgyn'],
    contraindications: ['ckd-stage3a', 'aki-pre-renal'],
  },

  // ─────────── Antidiabetics ───────────
  {
    id: 'metformin-500',
    name: 'Metformin 500mg',
    form: 'tablet',
    category: 'endocrine',
    class: 'Biguanide',
    defaultDose: '1 tab, 2×1, PO (with food)',
    defaultDuration: 'ongoing',
    indications: [
      'type2-diabetes',
      'type2-dm-uncontrolled',
      'pcos',
      'pcos-obgyn',
      'gestational-dm',
    ],
    contraindications: ['ckd-stage3a', 'aki-pre-renal', 'type1-dm-new'],
  },
  {
    id: 'gliclazide-30',
    name: 'Gliclazide MR 30mg',
    form: 'tablet',
    category: 'endocrine',
    class: 'Sulfonylurea',
    defaultDose: '1 tab, 1×1, PO',
    defaultDuration: 'ongoing',
    indications: ['type2-diabetes', 'type2-dm-uncontrolled'],
    contraindications: ['type1-dm-new', 'hypoglycemia'],
  },
  {
    id: 'empagliflozin-10',
    name: 'Empagliflozin 10mg',
    form: 'tablet',
    category: 'endocrine',
    class: 'SGLT2 inhibitor',
    defaultDose: '1 tab, 1×1, PO',
    defaultDuration: 'ongoing',
    indications: [
      'type2-diabetes',
      'type2-dm-uncontrolled',
      'chf-nyha2',
      'chf',
      'diabetic-nephropathy',
    ],
    contraindications: ['type1-dm-new', 'aki-pre-renal'],
  },
  {
    id: 'insulin-glargine',
    name: 'Insulin Glargine (basal)',
    form: 'injection',
    category: 'endocrine',
    class: 'Long-acting basal insulin',
    defaultDose: '10 IU at night SC',
    defaultDuration: 'ongoing',
    indications: [
      'type1-dm-new',
      'type2-dm-uncontrolled',
      'gestational-dm',
      'diabetic-nephropathy',
    ],
  },
  {
    id: 'insulin-aspart',
    name: 'Insulin Aspart (bolus)',
    form: 'injection',
    category: 'endocrine',
    class: 'Rapid-acting prandial insulin',
    defaultDose: '4-6 IU before meal SC',
    defaultDuration: 'ongoing',
    indications: ['type1-dm-new', 'type2-dm-uncontrolled'],
  },

  // ─────────── Analgesics / NSAIDs ───────────
  {
    id: 'paracetamol-500',
    name: 'Paracetamol 500mg',
    form: 'tablet',
    category: 'analgesic',
    class: 'Analgesic / antipyretic',
    defaultDose: '1-2 tb, 3×1, PO',
    defaultDuration: '5 days',
    indications: [
      'tension-headache',
      'migraine-without-aura',
      'osteoarthritis-knee',
      'osteoarthritis-hand',
      'hip-oa-moderate',
      'viral-uri',
      'viral-gastroenteritis',
      'febrile-seizure',
      'hand-foot-mouth',
      'varicella',
      'influenza',
      'plantar-fasciitis',
      'lateral-epicondylitis',
      'frozen-shoulder',
      'tmj-dysfunction',
    ],
    contraindications: ['chronic-hepatitis-b', 'chronic-hepatitis-c', 'alcoholic-hepatitis'],
  },
  {
    id: 'ibuprofen-400',
    name: 'Ibuprofen 400mg',
    form: 'tablet',
    category: 'analgesic',
    class: 'NSAID',
    defaultDose: '1 tab, 3×1, PO',
    defaultDuration: '5 days',
    indications: [
      'tension-headache',
      'migraine-without-aura',
      'osteoarthritis-knee',
      'hip-oa-moderate',
      'lateral-epicondylitis',
      'plantar-fasciitis',
      'achilles-tendinopathy',
      'ankle-sprain-gr2',
      'subacromial-bursitis',
      'menorrhagia-fibroids',
      'pericarditis',
      'gout',
    ],
    contraindications: [
      'peptic-ulcer-disease',
      'ckd-stage3a',
      'chf-nyha2',
      'gerd',
      'aki-pre-renal',
      'asthma-allergic',
    ],
  },
  {
    id: 'naproxen-500',
    name: 'Naproxen 500mg',
    form: 'tablet',
    category: 'analgesic',
    class: 'NSAID',
    defaultDose: '1 tab, 2×1, PO',
    defaultDuration: '10 days',
    indications: [
      'gout',
      'ankylosing-spondylitis',
      'rheumatoid-arthritis-early',
      'osteoarthritis-knee',
      'hip-oa-moderate',
      'migraine-without-aura',
      'meniscal-tear',
      'pericarditis',
    ],
    contraindications: ['peptic-ulcer-disease', 'ckd-stage3a', 'chf-nyha2', 'gerd'],
  },
  {
    id: 'diclofenac-75',
    name: 'Diclofenac 75mg',
    form: 'tablet',
    category: 'analgesic',
    class: 'NSAID',
    defaultDose: '1 tab, 2×1, PO',
    defaultDuration: '7 days',
    indications: [
      'kidney-stone-5mm',
      'nephrolithiasis-recurrent',
      'kidney-stone',
      'gallstones-biliary-colic',
      'gallstones-cholelithiasis',
      'lumbar-disc-herniation',
      'sciatica-l5',
      'gout',
    ],
    contraindications: ['peptic-ulcer-disease', 'ckd-stage3a'],
  },
  {
    id: 'tramadol-50',
    name: 'Tramadol 50mg',
    form: 'capsule',
    category: 'analgesic',
    class: 'Weak opioid analgesic',
    defaultDose: '1 cap, 3×1, PO',
    defaultDuration: '5 days',
    indications: [
      'hip-oa-moderate',
      'osteoarthritis-knee',
      'lumbar-disc-herniation',
      'meniscal-tear',
      'sciatica-l5',
    ],
    contraindications: [
      'mdd-moderate',
      'ptsd',
      'alcohol-use-disorder',
      'insomnia-chronic',
      'epilepsy',
    ],
  },
  {
    id: 'colchicine-05',
    name: 'Colchicine 0.5mg',
    form: 'tablet',
    category: 'analgesic',
    class: 'Anti-gout agent',
    defaultDose: '1 tab,2-3×1, PO',
    defaultDuration: '7 days',
    indications: ['gout', 'pericarditis'],
    contraindications: ['ckd-stage3a'],
  },
  {
    id: 'allopurinol-300',
    name: 'Allopurinol 300mg',
    form: 'tablet',
    category: 'analgesic',
    class: 'Xanthine oxidase inhibitor',
    defaultDose: '1 tab, 1×1, PO',
    defaultDuration: 'ongoing',
    indications: ['gout'],
  },

  // ─────────── PPIs / antacids / GI ───────────
  {
    id: 'pantoprazole-40',
    name: 'Pantoprazole 40mg',
    form: 'tablet',
    category: 'gastrointestinal',
    class: 'Proton pump inhibitor',
    defaultDose: '1 tab, 1×1, PO (30 min before breakfast)',
    defaultDuration: '8 weeks',
    indications: [
      'gerd',
      'peptic-ulcer-disease',
      'laryngopharyngeal-reflux',
      'eosinophilic-esophagitis',
      'gerd-infant',
    ],
  },
  {
    id: 'esomeprazole-40',
    name: 'Esomeprazole 40mg',
    form: 'tablet',
    category: 'gastrointestinal',
    class: 'Proton pump inhibitor',
    defaultDose: '1 tab, 1×1, PO',
    defaultDuration: '8 weeks',
    indications: ['gerd', 'peptic-ulcer-disease', 'laryngopharyngeal-reflux'],
  },
  {
    id: 'famotidine-40',
    name: 'Famotidine 40mg',
    form: 'tablet',
    category: 'gastrointestinal',
    class: 'H2 receptor antagonist',
    defaultDose: '1 tab, at night, PO',
    defaultDuration: '4 weeks',
    indications: ['gerd', 'peptic-ulcer-disease'],
  },
  {
    id: 'loperamide-2',
    name: 'Loperamide 2mg',
    form: 'capsule',
    category: 'gastrointestinal',
    class: 'Opioid-receptor antidiarrheal',
    defaultDose: '1-2 caps at onset, then 1 cap after each bowel movement',
    defaultDuration: '2 days',
    indications: ['viral-gastroenteritis', 'ibs-c'],
    contraindications: ['crohns-disease', 'ulcerative-colitis'],
  },
  {
    id: 'ondansetron-8',
    name: 'Ondansetron 8mg',
    form: 'tablet',
    category: 'gastrointestinal',
    class: '5-HT3 antagonist',
    defaultDose: '1 tab, 2×1, PO',
    defaultDuration: '3 days',
    indications: ['viral-gastroenteritis', 'migraine-without-aura'],
  },
  {
    id: 'metoclopramide-10',
    name: 'Metoclopramide 10mg',
    form: 'tablet',
    category: 'gastrointestinal',
    class: 'Dopamine antagonist antiemetic',
    defaultDose: '1 tab, 3×1, PO',
    defaultDuration: '5 days',
    indications: ['viral-gastroenteritis', 'migraine-without-aura', 'gerd'],
    contraindications: ['idiopathic-parkinsons-early', 'essential-tremor'],
  },
  {
    id: 'lactulose-syrup',
    name: 'Lactulose Syrup',
    form: 'solution',
    category: 'gastrointestinal',
    class: 'Osmotic laxative',
    defaultDose: '15 mL, 2×1, PO',
    defaultDuration: '14 days',
    indications: ['ibs-c', 'constipation-functional', 'hemorrhoids', 'hemorrhoids-grade2'],
  },
  {
    id: 'mesalazine-1g',
    name: 'Mesalazine 1g',
    form: 'tablet',
    category: 'gastrointestinal',
    class: '5-ASA',
    defaultDose: '1 tab, 3×1, PO',
    defaultDuration: 'ongoing',
    indications: ['ulcerative-colitis', 'crohns-disease'],
  },

  // ─────────── Antihistamines ───────────
  {
    id: 'cetirizine-10',
    name: 'Cetirizine 10mg',
    form: 'tablet',
    category: 'allergy',
    class: '2nd-gen H1 antihistamine',
    defaultDose: '1 tab, 1×1, PO',
    defaultDuration: '30 days',
    indications: [
      'allergic-rhinitis-seasonal',
      'allergic-rhinitis-ent',
      'allergic-rhinitis-asthma',
      'urticaria-chronic',
      'chronic-urticaria',
      'atopic-dermatitis',
      'atopic-dermatitis-child',
      'contact-dermatitis',
    ],
  },
  {
    id: 'levocetirizine-5',
    name: 'Levocetirizine 5mg',
    form: 'tablet',
    category: 'allergy',
    class: '2nd-gen H1 antihistamine',
    defaultDose: '1 tab, 1×1, PO',
    defaultDuration: '30 days',
    indications: [
      'allergic-rhinitis-seasonal',
      'allergic-rhinitis-ent',
      'chronic-urticaria',
      'urticaria-chronic',
    ],
  },
  {
    id: 'desloratadine-5',
    name: 'Desloratadine 5mg',
    form: 'tablet',
    category: 'allergy',
    class: '2nd-gen H1 antihistamine',
    defaultDose: '1 tab, 1×1, PO',
    defaultDuration: '30 days',
    indications: ['allergic-rhinitis-seasonal', 'urticaria-chronic', 'chronic-urticaria'],
  },
  {
    id: 'fexofenadine-180',
    name: 'Fexofenadine 180mg',
    form: 'tablet',
    category: 'allergy',
    class: '2nd-gen H1 antihistamine',
    defaultDose: '1 tab, 1×1, PO',
    defaultDuration: '30 days',
    indications: [
      'allergic-rhinitis-seasonal',
      'allergic-rhinitis-ent',
      'chronic-urticaria',
      'urticaria-chronic',
    ],
  },

  // ─────────── Asthma / COPD ───────────
  {
    id: 'salbutamol-inh',
    name: 'Salbutamol Inhaler 100mcg',
    form: 'spray',
    category: 'respiratory',
    class: 'Short-acting β2 agonist',
    defaultDose: '2 puffs, as needed',
    defaultDuration: 'ongoing',
    indications: [
      'asthma-chronic',
      'asthma-allergic',
      'pediatric-asthma-exacerbation',
      'asthma-exacerbation',
      'copd-gold2',
      'chronic-bronchitis',
    ],
  },
  {
    id: 'budesonide-inh',
    name: 'Budesonide Inhaler 200mcg',
    form: 'spray',
    category: 'respiratory',
    class: 'Inhaled corticosteroid',
    defaultDose: '2 puff, 2×1',
    defaultDuration: 'ongoing',
    indications: [
      'asthma-chronic',
      'asthma-allergic',
      'pediatric-asthma-exacerbation',
      'allergic-rhinitis-asthma',
    ],
  },
  {
    id: 'formoterol-budesonide-inh',
    name: 'Formoterol/Budesonide Inhaler',
    form: 'spray',
    category: 'respiratory',
    class: 'LABA + ICS',
    defaultDose: '2 puff, 2×1',
    defaultDuration: 'ongoing',
    indications: ['asthma-chronic', 'asthma-allergic', 'copd-gold2'],
  },
  {
    id: 'tiotropium-inh',
    name: 'Tiotropium Inhaler 18mcg',
    form: 'spray',
    category: 'respiratory',
    class: 'Long-acting muscarinic antagonist',
    defaultDose: '1 inh, 1×1',
    defaultDuration: 'ongoing',
    indications: ['copd-gold2', 'chronic-bronchitis'],
  },
  {
    id: 'montelukast-10',
    name: 'Montelukast 10mg',
    form: 'tablet',
    category: 'respiratory',
    class: 'Leukotriene receptor antagonist',
    defaultDose: '1 tab, at night, PO',
    defaultDuration: 'ongoing',
    indications: [
      'asthma-chronic',
      'asthma-allergic',
      'allergic-rhinitis-asthma',
      'allergic-rhinitis-seasonal',
    ],
  },
  {
    id: 'fluticasone-nasal',
    name: 'Fluticasone Nasal Spray',
    form: 'spray',
    category: 'respiratory',
    class: 'Intranasal corticosteroid',
    defaultDose: '2 puffs each nostril, 1×1',
    defaultDuration: 'ongoing',
    indications: [
      'allergic-rhinitis-seasonal',
      'allergic-rhinitis-ent',
      'allergic-rhinitis-asthma',
      'nasal-polyps',
      'chronic-rhinosinusitis',
    ],
  },

  // ─────────── Thyroid ───────────
  {
    id: 'levothyroxine-50',
    name: 'Levothyroxine 50mcg',
    form: 'tablet',
    category: 'endocrine',
    class: 'Thyroid hormone',
    defaultDose: '1 tab, 1×1, PO, on empty stomach',
    defaultDuration: 'ongoing',
    indications: ['hypothyroidism-hashimoto'],
    contraindications: ['graves-disease'],
  },
  {
    id: 'methimazole-5',
    name: 'Methimazole 5mg',
    form: 'tablet',
    category: 'endocrine',
    class: 'Antithyroid (thioamide)',
    defaultDose: '2 tb, 3×1, PO',
    defaultDuration: '18 months',
    indications: ['graves-disease'],
    contraindications: ['hypothyroidism-hashimoto'],
  },
  {
    id: 'propylthiouracil-50',
    name: 'Propylthiouracil 50mg',
    form: 'tablet',
    category: 'endocrine',
    class: 'Antithyroid (thioamide)',
    defaultDose: '2 tb, 3×1, PO',
    defaultDuration: '12 months',
    indications: ['graves-disease'],
    contraindications: ['hypothyroidism-hashimoto'],
  },

  // ─────────── Statins / Lipids ───────────
  {
    id: 'atorvastatin-20',
    name: 'Atorvastatin 20mg',
    form: 'tablet',
    category: 'lipid-lowering',
    class: 'HMG-CoA reductase inhibitor',
    defaultDose: '1 tab, at night, PO',
    defaultDuration: 'ongoing',
    indications: [
      'stable-angina',
      'type2-diabetes',
      'type2-dm-uncontrolled',
      'diabetic-nephropathy',
      'essential-hypertension',
      'ckd-stage3a',
    ],
    contraindications: ['statin-myalgia', 'chronic-hepatitis-b', 'chronic-hepatitis-c'],
  },
  {
    id: 'rosuvastatin-10',
    name: 'Rosuvastatin 10mg',
    form: 'tablet',
    category: 'lipid-lowering',
    class: 'HMG-CoA reductase inhibitor',
    defaultDose: '1 tab, at night, PO',
    defaultDuration: 'ongoing',
    indications: ['stable-angina', 'type2-diabetes', 'essential-hypertension'],
    contraindications: ['statin-myalgia'],
  },
  {
    id: 'simvastatin-20',
    name: 'Simvastatin 20mg',
    form: 'tablet',
    category: 'lipid-lowering',
    class: 'HMG-CoA reductase inhibitor',
    defaultDose: '1 tab, at night, PO',
    defaultDuration: 'ongoing',
    indications: ['stable-angina', 'type2-diabetes'],
    contraindications: ['statin-myalgia'],
  },
  {
    id: 'ezetimibe-10',
    name: 'Ezetimibe 10mg',
    form: 'tablet',
    category: 'lipid-lowering',
    class: 'Cholesterol absorption inhibitor',
    defaultDose: '1 tab, 1×1, PO',
    defaultDuration: 'ongoing',
    indications: ['stable-angina', 'statin-myalgia', 'type2-diabetes'],
  },

  // ─────────── Cardiology (other) ───────────
  {
    id: 'aspirin-100',
    name: 'Aspirin 100mg',
    form: 'tablet',
    category: 'antiplatelet-anticoagulant',
    class: 'Antiplatelet',
    defaultDose: '1 tab, 1×1, PO',
    defaultDuration: 'ongoing',
    indications: ['stable-angina', 'stemi', 'ischemic-stroke', 'paroxysmal-afib'],
    contraindications: ['peptic-ulcer-disease', 'hemorrhagic-stroke', 'warfarin-bleeding-workup'],
  },
  {
    id: 'clopidogrel-75',
    name: 'Clopidogrel 75mg',
    form: 'tablet',
    category: 'antiplatelet-anticoagulant',
    class: 'Antiplatelet (P2Y12 inhibitor)',
    defaultDose: '1 tab, 1×1, PO',
    defaultDuration: 'ongoing',
    indications: ['stable-angina', 'stemi', 'ischemic-stroke'],
    contraindications: ['peptic-ulcer-disease', 'hemorrhagic-stroke'],
  },
  {
    id: 'apixaban-5',
    name: 'Apixaban 5mg',
    form: 'tablet',
    category: 'antiplatelet-anticoagulant',
    class: 'Direct oral anticoagulant (Xa)',
    defaultDose: '1 tab, 2×1, PO',
    defaultDuration: 'ongoing',
    indications: ['paroxysmal-afib', 'dvt'],
    contraindications: ['peptic-ulcer-disease', 'hemorrhagic-stroke', 'warfarin-bleeding-workup'],
  },
  {
    id: 'nitroglycerin-sl',
    name: 'Nitroglycerin Sublingual 0.4mg',
    form: 'spray',
    category: 'cardiovascular',
    class: 'Nitrate',
    defaultDose: '1 puff sublingual, as needed',
    defaultDuration: 'ongoing',
    indications: ['stable-angina'],
  },
  {
    id: 'furosemide-40',
    name: 'Furosemide 40mg',
    form: 'tablet',
    category: 'cardiovascular',
    class: 'Loop diuretic',
    defaultDose: '1 tab, 1×1, PO',
    defaultDuration: 'ongoing',
    indications: ['chf-nyha2', 'chf', 'pleural-effusion-parapneumonic'],
    contraindications: ['aki-pre-renal', 'orthostatic-hypotension'],
  },

  // ─────────── Antidepressants / anxiolytics ───────────
  {
    id: 'sertraline-50',
    name: 'Sertraline 50mg',
    form: 'tablet',
    category: 'psychiatry',
    class: 'SSRI',
    defaultDose: '1 tab, 1×1, PO (morning)',
    defaultDuration: 'ongoing',
    indications: [
      'mdd-moderate',
      'generalized-anxiety',
      'panic-disorder',
      'ptsd',
      'ocd-moderate',
      'social-anxiety',
      'postpartum-depression',
    ],
    contraindications: ['bipolar-2-hypomanic', 'bipolar-1'],
  },
  {
    id: 'escitalopram-10',
    name: 'Escitalopram 10mg',
    form: 'tablet',
    category: 'psychiatry',
    class: 'SSRI',
    defaultDose: '1 tab, 1×1, PO',
    defaultDuration: 'ongoing',
    indications: [
      'mdd-moderate',
      'generalized-anxiety',
      'panic-disorder',
      'social-anxiety',
      'menopause-vasomotor',
    ],
    contraindications: ['bipolar-2-hypomanic', 'bipolar-1'],
  },
  {
    id: 'fluoxetine-20',
    name: 'Fluoxetine 20mg',
    form: 'capsule',
    category: 'psychiatry',
    class: 'SSRI',
    defaultDose: '1 cap, 1×1, PO',
    defaultDuration: 'ongoing',
    indications: ['mdd-moderate', 'ocd-moderate', 'panic-disorder'],
    contraindications: ['bipolar-2-hypomanic'],
  },
  {
    id: 'mirtazapine-30',
    name: 'Mirtazapine 30mg',
    form: 'tablet',
    category: 'psychiatry',
    class: 'Atypical antidepressant',
    defaultDose: '1 tab, at night, PO',
    defaultDuration: 'ongoing',
    indications: ['mdd-moderate', 'insomnia-chronic'],
  },
  {
    id: 'lorazepam-1',
    name: 'Lorazepam 1mg',
    form: 'tablet',
    category: 'psychiatry',
    class: 'Benzodiazepine',
    defaultDose: '1 tab, as needed (max 3×/day)',
    defaultDuration: '14 days',
    indications: ['generalized-anxiety', 'panic-disorder'],
    contraindications: [
      'alcohol-use-disorder',
      'obstructive-sleep-apnea',
      'insomnia-chronic',
      'copd-gold2',
    ],
  },
  {
    id: 'quetiapine-25',
    name: 'Quetiapine 25mg',
    form: 'tablet',
    category: 'psychiatry',
    class: 'Atypical antipsychotic',
    defaultDose: '1 tab, at night, PO',
    defaultDuration: 'ongoing',
    indications: ['bipolar-2-hypomanic', 'bipolar-1'],
  },
  {
    id: 'methylphenidate-18',
    name: 'Methylphenidate OROS 18mg',
    form: 'tablet',
    category: 'psychiatry',
    class: 'CNS stimulant',
    defaultDose: '1 tab, morning, PO',
    defaultDuration: 'ongoing',
    indications: ['adhd-adult'],
    contraindications: ['generalized-anxiety', 'panic-disorder', 'insomnia-chronic'],
  },
  {
    id: 'zolpidem-10',
    name: 'Zolpidem 10mg',
    form: 'tablet',
    category: 'psychiatry',
    class: 'Non-benzodiazepine hypnotic',
    defaultDose: '1 tab, at night, PO',
    defaultDuration: '14 days',
    indications: ['insomnia-chronic'],
    contraindications: ['obstructive-sleep-apnea', 'alcohol-use-disorder'],
  },

  // ─────────── Migraine / Neuro ───────────
  {
    id: 'propranolol-40',
    name: 'Propranolol 40mg',
    form: 'tablet',
    category: 'cardiovascular',
    class: 'Non-selective β-blocker',
    defaultDose: '1 tab, 2×1, PO',
    defaultDuration: 'ongoing',
    indications: ['migraine-without-aura', 'essential-tremor', 'graves-disease'],
    contraindications: ['asthma-chronic', 'asthma-allergic', 'copd-gold2'],
  },
  {
    id: 'topiramate-50',
    name: 'Topiramate 50mg',
    form: 'tablet',
    category: 'neurology',
    class: 'Antiepileptic / migraine prophylaxis',
    defaultDose: '1 tab, 2×1, PO',
    defaultDuration: 'ongoing',
    indications: ['migraine-without-aura', 'cluster-headache', 'epilepsy'],
    contraindications: ['nephrolithiasis-recurrent'],
  },
  {
    id: 'sumatriptan-50',
    name: 'Sumatriptan 50mg',
    form: 'tablet',
    category: 'neurology',
    class: '5-HT1B/1D agonist (triptan)',
    defaultDose: '1 tab at onset',
    defaultDuration: 'as needed',
    indications: ['migraine-without-aura', 'cluster-headache'],
    contraindications: ['stable-angina', 'stemi', 'ischemic-stroke', 'htn-uncontrolled'],
  },
  {
    id: 'amitriptyline-25',
    name: 'Amitriptyline 25mg',
    form: 'tablet',
    category: 'neurology',
    class: 'Tricyclic antidepressant',
    defaultDose: '1 tab, at night, PO',
    defaultDuration: 'ongoing',
    indications: [
      'tension-headache',
      'migraine-without-aura',
      'fibromyalgia',
      'insomnia-chronic',
    ],
    contraindications: ['bph-moderate', 'primary-open-angle-glaucoma'],
  },
  {
    id: 'gabapentin-300',
    name: 'Gabapentin 300mg',
    form: 'capsule',
    category: 'neurology',
    class: 'Anticonvulsant / neuropathic',
    defaultDose: '1 cap, 3×1, PO',
    defaultDuration: 'ongoing',
    indications: [
      'sciatica-l5',
      'trigeminal-neuralgia',
      'carpal-tunnel',
      'lumbar-disc-herniation',
      'fibromyalgia',
      'shingles',
    ],
  },
  {
    id: 'carbamazepine-200',
    name: 'Carbamazepine 200mg',
    form: 'tablet',
    category: 'neurology',
    class: 'Anticonvulsant',
    defaultDose: '1 tab, 2×1, PO',
    defaultDuration: 'ongoing',
    indications: ['trigeminal-neuralgia', 'epilepsy'],
  },
  {
    id: 'levodopa-carbidopa',
    name: 'Levodopa/Carbidopa 100/25',
    form: 'tablet',
    category: 'neurology',
    class: 'Dopamine precursor',
    defaultDose: '1 tab, 3×1, PO',
    defaultDuration: 'ongoing',
    indications: ['idiopathic-parkinsons-early'],
  },
  {
    id: 'donepezil-5',
    name: 'Donepezil 5mg',
    form: 'tablet',
    category: 'neurology',
    class: 'Cholinesterase inhibitor',
    defaultDose: '1 tab, at night, PO',
    defaultDuration: 'ongoing',
    indications: ['mild-cognitive-impairment'],
  },
  {
    id: 'prednisone-burst',
    name: 'Prednisone 1mg/kg',
    form: 'tablet',
    category: 'endocrine',
    class: 'Systemic corticosteroid',
    defaultDose: 'Gradual taper — start 60mg/day',
    defaultDuration: '10 days',
    indications: [
      'bells-palsy',
      'cluster-headache',
      'polymyalgia-rheumatica',
      'asthma-exacerbation',
      'pediatric-asthma-exacerbation',
      'sarcoidosis-stage2',
      'lupus-nephritis',
      'nephrotic-syndrome-membranous',
      'ulcerative-colitis',
      'crohns-disease',
      'sle',
    ],
    contraindications: ['peptic-ulcer-disease', 'type2-dm-uncontrolled'],
  },

  // ─────────── Dermatology ───────────
  {
    id: 'hydrocortisone-1-cr',
    name: 'Hydrocortisone 1% Cream',
    form: 'cream',
    category: 'dermatology',
    class: 'Topical corticosteroid (low potency)',
    defaultDose: 'To affected area 2×/day',
    defaultDuration: '14 days',
    indications: [
      'atopic-dermatitis',
      'atopic-dermatitis-child',
      'contact-dermatitis',
      'seborrheic-dermatitis',
    ],
  },
  {
    id: 'mometasone-01-cr',
    name: 'Mometasone 0.1% Cream',
    form: 'cream',
    category: 'dermatology',
    class: 'Topical corticosteroid (mid-potency)',
    defaultDose: 'To affected area 1×/day',
    defaultDuration: '14 days',
    indications: [
      'atopic-dermatitis',
      'contact-dermatitis',
      'plaque-psoriasis',
      'psoriasis-guttate',
      'alopecia-areata',
    ],
  },
  {
    id: 'clotrimazole-1-cr',
    name: 'Clotrimazole 1% Cream',
    form: 'cream',
    category: 'dermatology',
    class: 'Topical azole antifungal',
    defaultDose: 'To affected area 2×/day',
    defaultDuration: '14 days',
    indications: ['tinea-corporis', 'candida-vulvovaginitis'],
  },
  {
    id: 'adapalene-01-gel',
    name: 'Adapalene 0.1% Gel',
    form: 'cream',
    category: 'dermatology',
    class: 'Topical retinoid',
    defaultDose: 'To face at night',
    defaultDuration: 'ongoing',
    indications: ['acne-vulgaris'],
    contraindications: ['normal-pregnancy-2nd-tri', 'gestational-dm'],
  },
  {
    id: 'benzoyl-peroxide-5',
    name: 'Benzoyl Peroxide 5% Gel',
    form: 'cream',
    category: 'dermatology',
    class: 'Topical keratolytic',
    defaultDose: 'To face at night',
    defaultDuration: 'ongoing',
    indications: ['acne-vulgaris'],
  },
  {
    id: 'metronidazole-gel',
    name: 'Metronidazole 0.75% Gel',
    form: 'cream',
    category: 'dermatology',
    class: 'Topical antibacterial',
    defaultDose: 'To affected area 2×/day',
    defaultDuration: '30 days',
    indications: ['rosacea'],
  },
  {
    id: 'tacrolimus-01-oint',
    name: 'Tacrolimus 0.1% Ointment',
    form: 'cream',
    category: 'dermatology',
    class: 'Topical calcineurin inhibitor',
    defaultDose: 'To affected area 2×/day',
    defaultDuration: 'ongoing',
    indications: ['atopic-dermatitis', 'atopic-dermatitis-child'],
  },
  {
    id: 'calcipotriol-oint',
    name: 'Calcipotriol Ointment',
    form: 'cream',
    category: 'dermatology',
    class: 'Topical vitamin D analog',
    defaultDose: 'To affected plaques 2×/day',
    defaultDuration: 'ongoing',
    indications: ['plaque-psoriasis', 'psoriasis-guttate'],
  },
  {
    id: 'permethrin-5-cream',
    name: 'Permethrin 5% Cream',
    form: 'cream',
    category: 'dermatology',
    class: 'Topical scabicide',
    defaultDose: 'Whole body 8-14 hrs',
    defaultDuration: 'single dose',
    indications: ['scabies'],
  },
  {
    id: 'ketoconazole-shampoo',
    name: 'Ketoconazole 2% Shampoo',
    form: 'solution',
    category: 'dermatology',
    class: 'Topical azole antifungal',
    defaultDose: '2× per week',
    defaultDuration: 'ongoing',
    indications: ['seborrheic-dermatitis'],
  },

  // ─────────── Ophthalmic / ENT drops ───────────
  {
    id: 'timolol-eye-drops',
    name: 'Timolol 0.5% Eye Drops',
    form: 'solution',
    category: 'ophthalmic',
    class: 'Topical β-blocker',
    defaultDose: '1 drop, 2×1, both eyes',
    defaultDuration: 'ongoing',
    indications: ['primary-open-angle-glaucoma'],
    contraindications: ['asthma-chronic', 'copd-gold2'],
  },
  {
    id: 'latanoprost-eye-drops',
    name: 'Latanoprost 0.005% Eye Drops',
    form: 'solution',
    category: 'ophthalmic',
    class: 'Prostaglandin analog',
    defaultDose: '1 drop, at night, both eyes',
    defaultDuration: 'ongoing',
    indications: ['primary-open-angle-glaucoma'],
  },
  {
    id: 'artificial-tears',
    name: 'Artificial Tears',
    form: 'solution',
    category: 'ophthalmic',
    class: 'Ocular lubricant',
    defaultDose: '1 drop, as needed',
    defaultDuration: 'ongoing',
    indications: ['dry-eye', 'blepharitis', 'sjogrens'],
  },

  // ─────────── Urology ───────────
  {
    id: 'tamsulosin-04',
    name: 'Tamsulosin 0.4mg',
    form: 'capsule',
    category: 'urology',
    class: 'α1-adrenergic blocker',
    defaultDose: '1 cap, 1×1, PO',
    defaultDuration: 'ongoing',
    indications: ['bph-moderate', 'kidney-stone-5mm', 'nephrolithiasis-recurrent'],
    contraindications: ['orthostatic-hypotension'],
  },
  {
    id: 'finasteride-5',
    name: 'Finasteride 5mg',
    form: 'tablet',
    category: 'urology',
    class: '5α-reductase inhibitor',
    defaultDose: '1 tab, 1×1, PO',
    defaultDuration: 'ongoing',
    indications: ['bph-moderate'],
  },
  {
    id: 'sildenafil-50',
    name: 'Sildenafil 50mg',
    form: 'tablet',
    category: 'urology',
    class: 'PDE5 inhibitor',
    defaultDose: '1 tab, 1 hr before intercourse',
    defaultDuration: 'as needed',
    indications: ['erectile-dysfunction-organic'],
    contraindications: ['stable-angina'],
  },
  {
    id: 'solifenacin-5',
    name: 'Solifenacin 5mg',
    form: 'tablet',
    category: 'urology',
    class: 'Anticholinergic (M3 selective)',
    defaultDose: '1 tab, 1×1, PO',
    defaultDuration: 'ongoing',
    indications: ['overactive-bladder'],
    contraindications: ['bph-moderate'],
  },

  // ─────────── Rheumatology / bone ───────────
  {
    id: 'methotrexate-15',
    name: 'Methotrexate 15mg',
    form: 'tablet',
    category: 'rheumatology',
    class: 'DMARD',
    defaultDose: '1 tab, once weekly, PO',
    defaultDuration: 'ongoing',
    indications: [
      'rheumatoid-arthritis-early',
      'plaque-psoriasis',
      'crohns-disease',
      'ulcerative-colitis',
      'sle',
    ],
    contraindications: ['chronic-hepatitis-b', 'chronic-hepatitis-c'],
  },
  {
    id: 'hydroxychloroquine-200',
    name: 'Hydroxychloroquine 200mg',
    form: 'tablet',
    category: 'rheumatology',
    class: 'Antimalarial DMARD',
    defaultDose: '1 tab, 2×1, PO',
    defaultDuration: 'ongoing',
    indications: ['sle', 'rheumatoid-arthritis-early', 'sjogrens'],
  },
  {
    id: 'alendronate-70',
    name: 'Alendronate 70mg',
    form: 'tablet',
    category: 'rheumatology',
    class: 'Bisphosphonate',
    defaultDose: '1 tab, once weekly, on empty stomach',
    defaultDuration: 'ongoing',
    indications: ['osteoporosis-postmenopausal'],
    contraindications: ['gerd', 'peptic-ulcer-disease'],
  },
  {
    id: 'calcium-vitd',
    name: 'Calcium 500 + Vit D3 1000IU',
    form: 'tablet',
    category: 'hematology-nutrition',
    class: 'Mineral / vitamin',
    defaultDose: '1 tab, 2×1, PO',
    defaultDuration: 'ongoing',
    indications: [
      'osteoporosis-postmenopausal',
      'vit-d-deficiency',
      'hyperparathyroidism-primary',
    ],
  },

  // ─────────── Vitamins / hematinics ───────────
  {
    id: 'ferrous-sulfate-325',
    name: 'Ferrous Sulfate 325mg',
    form: 'tablet',
    category: 'hematology-nutrition',
    class: 'Oral iron',
    defaultDose: '1 tab, 1×1, PO (with vitamin C)',
    defaultDuration: '90 days',
    indications: [
      'iron-deficiency-anemia',
      'iron-deficiency',
      'iron-deficiency-infant',
      'thalassemia-trait',
    ],
    contraindications: ['hereditary-hemochromatosis'],
  },
  {
    id: 'vitamin-b12-im',
    name: 'Vitamin B12 1000mcg',
    form: 'injection',
    category: 'hematology-nutrition',
    class: 'Cobalamin',
    defaultDose: '1 ampule IM, weekly',
    defaultDuration: '8 weeks',
    indications: ['b12-deficiency', 'b12-pernicious'],
  },
  {
    id: 'vitamin-d3-50k',
    name: 'Vitamin D3 50.000 IU',
    form: 'capsule',
    category: 'hematology-nutrition',
    class: 'Cholecalciferol',
    defaultDose: '1 cap, weekly, PO',
    defaultDuration: '8 weeks',
    indications: ['vit-d-deficiency', 'osteoporosis-postmenopausal'],
  },
  {
    id: 'folic-acid-5',
    name: 'Folic Acid 5mg',
    form: 'tablet',
    category: 'hematology-nutrition',
    class: 'Vitamin B9',
    defaultDose: '1 tab, 1×1, PO',
    defaultDuration: 'ongoing',
    indications: [
      'b12-deficiency',
      'b12-pernicious',
      'iron-deficiency-anemia',
      'normal-pregnancy-2nd-tri',
      'thalassemia-trait',
    ],
  },
  {
    id: 'thiamine-100',
    name: 'Thiamine 100mg',
    form: 'tablet',
    category: 'hematology-nutrition',
    class: 'Vitamin B1',
    defaultDose: '1 tab, 1×1, PO',
    defaultDuration: 'ongoing',
    indications: ['alcohol-use-disorder', 'chronic-fatigue'],
  },

  // ─────────── OB-GYN / menopause ───────────
  {
    id: 'combined-ocp',
    name: 'Combined Oral Contraceptive',
    form: 'tablet',
    category: 'obgyn',
    class: 'Estrogen + progestin',
    defaultDose: '1 tab, 1×1, PO (28-day cycle)',
    defaultDuration: 'ongoing',
    indications: ['pcos', 'pcos-obgyn', 'endometriosis', 'menorrhagia-fibroids'],
    contraindications: ['normal-pregnancy-2nd-tri', 'dvt'],
  },
  {
    id: 'tranexamic-acid-500',
    name: 'Tranexamic Acid 500mg',
    form: 'tablet',
    category: 'obgyn',
    class: 'Antifibrinolytic',
    defaultDose: '2 tab, 3×1, PO (during menses)',
    defaultDuration: '5 days',
    indications: ['menorrhagia-fibroids'],
    contraindications: ['dvt'],
  },
  {
    id: 'estradiol-patch',
    name: 'Estradiol Transdermal 50mcg/day',
    form: 'cream',
    category: 'obgyn',
    class: 'Estrogen replacement',
    defaultDose: '1 patch, 2×/week',
    defaultDuration: 'ongoing',
    indications: ['menopause-vasomotor'],
    contraindications: ['normal-pregnancy-2nd-tri', 'dvt'],
  },
];

/* ------------------------------------------------------------------ */
/*  Lookups                                                            */
/* ------------------------------------------------------------------ */

const MED_BY_ID: Record<string, Medication> = Object.fromEntries(
  MEDICATIONS.map((m) => [m.id, m]),
);

export function medicationById(id: string): Medication | undefined {
  return MED_BY_ID[id];
}

/** All therapeutic classes currently represented, in the canonical catalog
 *  order. Useful for grouping the picker list. */
export function medicationClasses(): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const m of MEDICATIONS) {
    if (!seen.has(m.class)) {
      seen.add(m.class);
      out.push(m.class);
    }
  }
  return out;
}

/** Human-readable label for each high-level therapeutic category. */
export const CATEGORY_LABELS: Record<MedicationCategory, string> = {
  antibiotic: 'Antibiotics',
  antiviral: 'Antivirals',
  antifungal: 'Antifungals',
  cardiovascular: 'Cardiovascular',
  'antiplatelet-anticoagulant': 'Antiplatelet / Anticoagulant',
  'lipid-lowering': 'Lipid-Lowering',
  endocrine: 'Endocrine & Diabetes',
  analgesic: 'Analgesic & NSAID',
  gastrointestinal: 'Gastrointestinal',
  respiratory: 'Asthma & COPD',
  allergy: 'Allergy & Antihistamine',
  neurology: 'Neurology',
  psychiatry: 'Psychiatry',
  rheumatology: 'Rheumatology & Bone',
  dermatology: 'Dermatology',
  ophthalmic: 'Ophthalmic',
  urology: 'Urology',
  obgyn: 'OB-GYN',
  'hematology-nutrition': 'Hematology & Vitamins',
};

/* ------------------------------------------------------------------ */
/*  Specialty scope — which therapeutic categories each polyclinic     */
/*  branch is allowed to prescribe from. Mirrors typical outpatient    */
/*  practice: internal medicine writes broadly, psychiatry writes      */
/*  psych drugs only, ophthalmology writes eye drops, etc.             */
/* ------------------------------------------------------------------ */

const ALL_CATEGORIES: MedicationCategory[] = [
  'antibiotic',
  'antiviral',
  'antifungal',
  'cardiovascular',
  'antiplatelet-anticoagulant',
  'lipid-lowering',
  'endocrine',
  'analgesic',
  'gastrointestinal',
  'respiratory',
  'allergy',
  'neurology',
  'psychiatry',
  'rheumatology',
  'dermatology',
  'ophthalmic',
  'urology',
  'obgyn',
  'hematology-nutrition',
];

export const SPECIALTY_MEDICATION_CATEGORIES: Record<ClinicId, MedicationCategory[]> = {
  'all-specialties': ALL_CATEGORIES,
  'internal-medicine': [
    'antibiotic', 'antiviral', 'antifungal', 'cardiovascular',
    'antiplatelet-anticoagulant', 'lipid-lowering', 'endocrine', 'analgesic',
    'gastrointestinal', 'respiratory', 'allergy', 'rheumatology', 'hematology-nutrition',
  ],
  cardiology: ['cardiovascular', 'antiplatelet-anticoagulant', 'lipid-lowering', 'analgesic'],
  neurology: ['neurology', 'analgesic', 'psychiatry'],
  neurosurgery: ['analgesic', 'antibiotic'],
  dermatology: ['dermatology', 'antifungal', 'antibiotic', 'allergy'],
  endocrinology: ['endocrine', 'lipid-lowering', 'cardiovascular', 'hematology-nutrition'],
  gastroenterology: ['gastrointestinal', 'antibiotic', 'analgesic'],
  pulmonology: ['respiratory', 'antibiotic', 'allergy', 'analgesic'],
  nephrology: ['cardiovascular', 'endocrine', 'hematology-nutrition', 'analgesic'],
  rheumatology: ['rheumatology', 'analgesic', 'antibiotic'],
  hematology: ['hematology-nutrition', 'antiplatelet-anticoagulant', 'antibiotic'],
  oncology: ['analgesic', 'antibiotic', 'antiviral', 'antifungal'],
  'infectious-disease': ['antibiotic', 'antiviral', 'antifungal'],
  'allergy-immunology': ['allergy', 'respiratory', 'dermatology'],
  psychiatry: ['psychiatry', 'neurology'],
  obgyn: ['obgyn', 'antibiotic', 'allergy', 'analgesic', 'hematology-nutrition'],
  urology: ['urology', 'antibiotic', 'analgesic'],
  ophthalmology: ['ophthalmic', 'antibiotic', 'allergy'],
  ent: ['antibiotic', 'allergy', 'analgesic', 'respiratory'],
  orthopedics: ['analgesic', 'rheumatology', 'antibiotic'],
  pmr: ['analgesic', 'rheumatology', 'neurology'],
  pediatrics: [
    'antibiotic', 'antiviral', 'respiratory', 'allergy',
    'gastrointestinal', 'analgesic', 'dermatology', 'hematology-nutrition',
  ],
  'general-surgery': ['antibiotic', 'analgesic', 'gastrointestinal', 'antiplatelet-anticoagulant'],
  'cardiothoracic-vascular-surgery': [
    'cardiovascular', 'antiplatelet-anticoagulant', 'antibiotic', 'analgesic', 'lipid-lowering',
  ],
};

export function isCategoryAllowedForSpecialty(
  category: MedicationCategory,
  specialty: ClinicId,
): boolean {
  return SPECIALTY_MEDICATION_CATEGORIES[specialty].includes(category);
}

/** Canonical display order for the top-level therapeutic categories. */
const CATEGORY_ORDER: MedicationCategory[] = [
  'antibiotic',
  'antiviral',
  'antifungal',
  'cardiovascular',
  'antiplatelet-anticoagulant',
  'lipid-lowering',
  'endocrine',
  'analgesic',
  'gastrointestinal',
  'respiratory',
  'allergy',
  'neurology',
  'psychiatry',
  'rheumatology',
  'dermatology',
  'ophthalmic',
  'urology',
  'obgyn',
  'hematology-nutrition',
];

/** Categories that actually appear in MEDICATIONS, in canonical display order. */
export function medicationCategories(): MedicationCategory[] {
  const present = new Set<MedicationCategory>(MEDICATIONS.map((m) => m.category));
  return CATEGORY_ORDER.filter((c) => present.has(c));
}

/** Suggest the single most specific drug for a diagnosis — used by the
 *  grader to tell the doctor what they missed if they submitted nothing. */
function suggestFor(diagnosisId: string): Medication | undefined {
  // Prefer drugs whose indications list this diagnosis AND which are NOT a
  // generic analgesic/antihistamine so we steer the user to specific Rx.
  const specific = MEDICATIONS.find(
    (m) =>
      m.indications.includes(diagnosisId) &&
      !['Analgesic / antipyretic', 'NSAID', '2nd-gen H1 antihistamine'].includes(m.class),
  );
  if (specific) return specific;
  return MEDICATIONS.find((m) => m.indications.includes(diagnosisId));
}

/* ------------------------------------------------------------------ */
/*  Grading                                                            */
/* ------------------------------------------------------------------ */

export interface PrescriptionGrade {
  /** Net points awarded / penalised. */
  score: number;
  /** Medication IDs that were clinically appropriate. */
  correct: string[];
  /** Medication IDs that were either contraindicated or unrelated. */
  wrong: string[];
  /** Human-readable suggestion of one key drug they should have prescribed. */
  missingSuggestion?: string;
  /** Human-readable feedback lines, one per point. */
  notes: string[];
}

/**
 * Grade a prescription:
 *   +30 per correctly-indicated drug (capped at +60)
 *   −20 per contraindicated drug
 *    −5 per unrelated drug (not indicated, not explicitly bad)
 *     0 if nothing prescribed (but mention what they missed)
 */
export function gradePrescription(
  diagnosisId: string,
  prescribedIds: string[],
): PrescriptionGrade {
  const correct: string[] = [];
  const wrong: string[] = [];
  const notes: string[] = [];

  // Deduplicate — if the user accidentally added the same drug twice, count
  // it once. Preserves the first-seen order.
  const unique: string[] = [];
  const seen = new Set<string>();
  for (const id of prescribedIds) {
    if (!seen.has(id)) {
      seen.add(id);
      unique.push(id);
    }
  }

  if (unique.length === 0) {
    const suggestion = suggestFor(diagnosisId);
    return {
      score: 0,
      correct: [],
      wrong: [],
      missingSuggestion: suggestion?.id,
      notes: suggestion
        ? [`No prescription issued. Consider ${suggestion.name} for this diagnosis.`]
        : ['No prescription issued. Nothing indicated for this diagnosis either.'],
    };
  }

  let correctCount = 0;
  let contraindicatedCount = 0;
  let unrelatedCount = 0;

  for (const id of unique) {
    const med = medicationById(id);
    if (!med) {
      // Unknown ID — treat as unrelated and note it.
      unrelatedCount += 1;
      wrong.push(id);
      notes.push(`Unknown medication "${id}" — ignored from a therapeutic standpoint.`);
      continue;
    }
    const isContraindicated = med.contraindications?.includes(diagnosisId) ?? false;
    const isIndicated = med.indications.includes(diagnosisId);

    if (isContraindicated) {
      contraindicatedCount += 1;
      wrong.push(id);
      notes.push(`⚠ ${med.name} is CONTRAINDICATED for this diagnosis. −20`);
    } else if (isIndicated) {
      correctCount += 1;
      correct.push(id);
      notes.push(`✓ ${med.name} — appropriate choice. +30`);
    } else {
      unrelatedCount += 1;
      wrong.push(id);
      notes.push(`~ ${med.name} is not indicated for this diagnosis. −5`);
    }
  }

  // Apply score with the +60 cap on correct credit.
  const correctPoints = Math.min(correctCount, 2) * 30;
  const contraPenalty = contraindicatedCount * 20;
  const unrelatedPenalty = unrelatedCount * 5;
  const score = correctPoints - contraPenalty - unrelatedPenalty;

  if (correctCount > 2) {
    notes.push(
      `(Bonus capped: ${correctCount} appropriate drugs but only the first 2 contribute +30 each.)`,
    );
  }

  // If they prescribed nothing correct, nudge them toward a canonical drug.
  let missingSuggestion: string | undefined;
  if (correctCount === 0) {
    const suggestion = suggestFor(diagnosisId);
    if (suggestion && !unique.includes(suggestion.id)) {
      missingSuggestion = suggestion.id;
      notes.push(`Consider ${suggestion.name} for this diagnosis.`);
    }
  }

  return { score, correct, wrong, missingSuggestion, notes };
}
