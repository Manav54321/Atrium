import type { Test } from '../game/types';
import type { ClinicId } from '../game/clinic';

export const TESTS: Test[] = [
  // ───────── Bedside ─────────
  { id: 'glucose',    name: 'Bedside Glucose',          category: 'bedside', turnaroundSec: 15 },
  { id: 'peak-flow',  name: 'Peak Flow',                category: 'bedside', turnaroundSec: 15 },
  { id: 'urine-hcg',  name: 'Urine β-hCG (pregnancy)',  category: 'bedside', turnaroundSec: 18 },
  { id: 'ecg',        name: 'ECG (12-lead)',            category: 'bedside', turnaroundSec: 20 },
  { id: 'strep-radt', name: 'Rapid Strep Antigen',      category: 'bedside', turnaroundSec: 20 },
  { id: 'flu-swab',   name: 'Rapid Influenza Swab',     category: 'bedside', turnaroundSec: 25 },
  { id: 'covid-swab', name: 'Rapid COVID-19 Swab',      category: 'bedside', turnaroundSec: 25 },
  { id: 'pocus',      name: 'Bedside Ultrasound (POCUS)', category: 'bedside', turnaroundSec: 30 },

  // ───────── Lab — hematology / chemistry ─────────
  { id: 'abg',        name: 'Arterial Blood Gas',       category: 'lab', turnaroundSec: 20 },
  { id: 'lactate',    name: 'Lactate',                  category: 'lab', turnaroundSec: 25 },
  { id: 'cbc',        name: 'CBC w/ differential',      category: 'lab', turnaroundSec: 30 },
  { id: 'bmp',        name: 'Basic Metabolic Panel',    category: 'lab', turnaroundSec: 30 },
  { id: 'lft',        name: 'Liver Function (LFT)',     category: 'lab', turnaroundSec: 35 },
  { id: 'lipase',     name: 'Lipase',                   category: 'lab', turnaroundSec: 30 },
  { id: 'coag',       name: 'Coagulation (PT/PTT/INR)', category: 'lab', turnaroundSec: 30 },
  { id: 'bnp',        name: 'BNP',                      category: 'lab', turnaroundSec: 35 },
  { id: 'dimer',      name: 'D-Dimer',                  category: 'lab', turnaroundSec: 35 },
  { id: 'troponin',   name: 'High-sensitivity Troponin', category: 'lab', turnaroundSec: 40 },
  { id: 'tsh',        name: 'TSH',                      category: 'lab', turnaroundSec: 45 },
  { id: 'type-screen',name: 'Type & Screen',            category: 'lab', turnaroundSec: 45 },
  { id: 'urine',      name: 'Urinalysis',               category: 'lab', turnaroundSec: 25 },
  { id: 'urine-cx',   name: 'Urine Culture',            category: 'lab', turnaroundSec: 60 },
  { id: 'blood-cx',   name: 'Blood Cultures (×2)',      category: 'lab', turnaroundSec: 75 },
  { id: 'utox',       name: 'Urine Toxicology Screen',  category: 'lab', turnaroundSec: 40 },

  // ───────── Lab — endocrine / metabolic ─────────
  { id: 'hba1c',      name: 'Hemoglobin A1c',           category: 'lab', turnaroundSec: 45 },
  { id: 'lipid',      name: 'Lipid Panel',              category: 'lab', turnaroundSec: 45 },
  { id: 'vit-d',      name: 'Vitamin D (25-OH)',        category: 'lab', turnaroundSec: 50 },
  { id: 'b12',        name: 'Vitamin B12 / Folate',     category: 'lab', turnaroundSec: 50 },
  { id: 'iron',       name: 'Iron Studies (Fe/TIBC/ferritin)', category: 'lab', turnaroundSec: 50 },
  { id: 'ferritin',   name: 'Ferritin',                 category: 'lab', turnaroundSec: 45 },
  { id: 'free-t4',    name: 'Free T4 / Free T3',        category: 'lab', turnaroundSec: 50 },
  { id: 'cortisol',   name: 'Morning Cortisol',         category: 'lab', turnaroundSec: 60 },
  { id: 'beta-hcg-q', name: 'β-hCG (quantitative serum)', category: 'lab', turnaroundSec: 35 },
  { id: 'psa',        name: 'PSA',                      category: 'lab', turnaroundSec: 50 },

  // ───────── Lab — inflammation / infection ─────────
  { id: 'crp',        name: 'CRP',                      category: 'lab', turnaroundSec: 30 },
  { id: 'esr',        name: 'ESR',                      category: 'lab', turnaroundSec: 30 },
  { id: 'procal',     name: 'Procalcitonin',            category: 'lab', turnaroundSec: 40 },
  { id: 'hiv',        name: 'HIV 4th-gen Ag/Ab',        category: 'lab', turnaroundSec: 70 },
  { id: 'hep-b',      name: 'Hepatitis B Serology',     category: 'lab', turnaroundSec: 75 },
  { id: 'hep-c',      name: 'Hepatitis C Antibody',     category: 'lab', turnaroundSec: 75 },
  { id: 'rpr',        name: 'RPR / VDRL (syphilis)',    category: 'lab', turnaroundSec: 60 },

  // ───────── Lab — autoimmune (rheumatology) ─────────
  { id: 'ana',        name: 'ANA',                      category: 'lab', turnaroundSec: 80 },
  { id: 'rf',         name: 'Rheumatoid Factor',        category: 'lab', turnaroundSec: 70 },
  { id: 'anti-ccp',   name: 'Anti-CCP',                 category: 'lab', turnaroundSec: 80 },
  { id: 'dsdna',      name: 'Anti-dsDNA',               category: 'lab', turnaroundSec: 80 },
  { id: 'c3-c4',      name: 'Complement C3 / C4',       category: 'lab', turnaroundSec: 70 },

  // ───────── Lab — stool ─────────
  { id: 'stool-cx',   name: 'Stool Culture',            category: 'lab', turnaroundSec: 70 },
  { id: 'fobt',       name: 'Fecal Occult Blood',       category: 'lab', turnaroundSec: 30 },
  { id: 'calpro',     name: 'Fecal Calprotectin',       category: 'lab', turnaroundSec: 60 },
  { id: 'h-pylori',   name: 'H. pylori Stool Antigen',  category: 'lab', turnaroundSec: 55 },

  // ───────── Lab — psych drug levels ─────────
  { id: 'lithium',    name: 'Lithium Level',            category: 'lab', turnaroundSec: 45 },
  { id: 'valproate',  name: 'Valproate Level',          category: 'lab', turnaroundSec: 45 },

  // ───────── Imaging — X-ray ─────────
  { id: 'cxr',        name: 'Chest X-Ray',              category: 'imaging', turnaroundSec: 40 },
  { id: 'kub',        name: 'Abdominal X-Ray (KUB)',    category: 'imaging', turnaroundSec: 40 },
  { id: 'xr-extrem',  name: 'Extremity X-Ray',          category: 'imaging', turnaroundSec: 35 },
  { id: 'xr-spine',   name: 'Spine X-Ray',              category: 'imaging', turnaroundSec: 40 },
  { id: 'xr-pelvis',  name: 'Pelvis X-Ray',             category: 'imaging', turnaroundSec: 40 },

  // ───────── Imaging — Ultrasound / Echo ─────────
  { id: 'us-abdomen', name: 'Abdominal Ultrasound',      category: 'imaging', turnaroundSec: 50 },
  { id: 'us-pelvis',  name: 'Pelvic Ultrasound',         category: 'imaging', turnaroundSec: 50 },
  { id: 'echo',       name: 'Cardiac Echo (TTE)',        category: 'imaging', turnaroundSec: 70 },

  // ───────── Imaging — CT ─────────
  { id: 'ct-head',    name: 'CT Head (non-contrast)',    category: 'imaging', turnaroundSec: 60 },
  { id: 'ct-chest',   name: 'CT Chest',                  category: 'imaging', turnaroundSec: 65 },
  { id: 'ct-angio',   name: 'CT Angiogram (chest, PE)',  category: 'imaging', turnaroundSec: 70 },
  { id: 'ct-abdomen', name: 'CT Abdomen / Pelvis',       category: 'imaging', turnaroundSec: 75 },
  { id: 'ct-cspine',  name: 'CT Cervical Spine',         category: 'imaging', turnaroundSec: 60 },

  // ───────── Imaging — MRI ─────────
  { id: 'mri-brain',  name: 'MRI Brain',                 category: 'imaging', turnaroundSec: 120 },
  { id: 'mri-cspine', name: 'MRI Cervical Spine',        category: 'imaging', turnaroundSec: 110 },
  { id: 'mri-lspine', name: 'MRI Lumbar Spine',          category: 'imaging', turnaroundSec: 110 },
  { id: 'mri-abd',    name: 'MRI Abdomen (MRCP)',        category: 'imaging', turnaroundSec: 130 },

  // ───────── Imaging / functional — specialty ─────────
  { id: 'dexa',       name: 'DEXA Bone Density',         category: 'imaging', turnaroundSec: 70 },
  { id: 'mammogram',  name: 'Mammogram',                 category: 'imaging', turnaroundSec: 65 },
  { id: 'oct',        name: 'OCT (retina)',              category: 'imaging', turnaroundSec: 50 },
  { id: 'visual-field', name: 'Visual Field Test',       category: 'imaging', turnaroundSec: 55 },
  { id: 'fundoscopy', name: 'Dilated Fundoscopy',        category: 'bedside', turnaroundSec: 30 },
  { id: 'audiometry', name: 'Audiometry',                category: 'bedside', turnaroundSec: 35 },
  { id: 'eeg',        name: 'EEG',                       category: 'bedside', turnaroundSec: 90 },
  { id: 'emg-ncs',    name: 'EMG / Nerve Conduction',    category: 'bedside', turnaroundSec: 80 },
  { id: 'spirometry', name: 'Pulmonary Function (PFT)',  category: 'bedside', turnaroundSec: 50 },
  { id: 'pap-smear',  name: 'Pap / HPV Co-test',         category: 'bedside', turnaroundSec: 60 },
  { id: 'skin-biopsy',name: 'Skin Biopsy',               category: 'bedside', turnaroundSec: 90 },
  { id: 'dengue-ns1', name: 'Dengue NS1 Antigen',        category: 'lab', turnaroundSec: 30 },
  { id: 'dengue-igg-igm', name: 'Dengue IgG/IgM Antibodies', category: 'lab', turnaroundSec: 40 },
];

export const testById = (id: string) => TESTS.find((t) => t.id === id);

// Convenience panels — fire several tests with one click.
//
// `clinicIds` scopes a panel to the polyclinic view. ED panels omit it and
// therefore only appear in the ER flow (`PatientPanel.tsx`). Polyclinic
// panels list every specialty they apply to; the polyclinic view filters
// `TEST_PANELS` by the current clinic.
export interface TestPanel {
  id: string;
  label: string;
  description: string;
  testIds: string[];
  clinicIds?: ClinicId[];
}

export const TEST_PANELS: TestPanel[] = [
  // ───────── ED panels (no clinicIds → ER-only) ─────────
  {
    id: 'routine-labs',
    label: 'Routine Labs',
    description: 'CBC, BMP, Coagulation',
    testIds: ['cbc', 'bmp', 'coag'],
  },
  {
    id: 'chest-pain',
    label: 'Chest Pain Workup',
    description: 'ECG, Troponin, CXR, D-Dimer, BMP, CBC',
    testIds: ['ecg', 'troponin', 'cxr', 'dimer', 'bmp', 'cbc'],
  },
  {
    id: 'sepsis',
    label: 'Sepsis Workup',
    description: 'CBC, BMP, Lactate, Blood cultures, UA, UCx',
    testIds: ['cbc', 'bmp', 'lactate', 'blood-cx', 'urine', 'urine-cx'],
  },
  {
    id: 'abdominal',
    label: 'Abdominal Workup',
    description: 'CBC, BMP, LFT, Lipase, UA, US abdomen',
    testIds: ['cbc', 'bmp', 'lft', 'lipase', 'urine', 'us-abdomen'],
  },
  {
    id: 'stroke',
    label: 'Stroke Workup',
    description: 'CT Head, ECG, CBC, BMP, Coag, Glucose',
    testIds: ['ct-head', 'ecg', 'cbc', 'bmp', 'coag', 'glucose'],
  },
  {
    id: 'trauma',
    label: 'Trauma Panel',
    description: 'CBC, BMP, Coag, Type & Screen, Lactate, CXR, Pelvis',
    testIds: ['cbc', 'bmp', 'coag', 'type-screen', 'lactate', 'cxr', 'xr-pelvis'],
  },

  // ───────── Polyclinic — shared across multiple specialties ─────────
  {
    id: 'basic-metabolic-workup',
    label: 'Basic Metabolic Workup',
    description: 'CBC, BMP, TSH',
    testIds: ['cbc', 'bmp', 'tsh'],
    clinicIds: ['internal-medicine', 'endocrinology', 'nephrology', 'hematology', 'psychiatry', 'pediatrics'],
  },
  {
    id: 'general-screening-labs',
    label: 'General Screening Labs',
    description: 'CBC, BMP, LFT, TSH, Urinalysis',
    testIds: ['cbc', 'bmp', 'lft', 'tsh', 'urine'],
    clinicIds: ['internal-medicine', 'endocrinology', 'rheumatology'],
  },
  {
    id: 'uti-workup',
    label: 'UTI Workup',
    description: 'Urinalysis, Urine culture',
    testIds: ['urine', 'urine-cx'],
    clinicIds: ['internal-medicine', 'urology', 'nephrology', 'obgyn', 'infectious-disease', 'pediatrics'],
  },
  {
    id: 'preop-clearance',
    label: 'Pre-Op Clearance',
    description: 'CBC, BMP, Coag, Type & Screen, ECG, CXR',
    testIds: ['cbc', 'bmp', 'coag', 'type-screen', 'ecg', 'cxr'],
    clinicIds: ['general-surgery', 'orthopedics', 'urology', 'obgyn', 'cardiology'],
  },

  // ───────── Internal Medicine ─────────
  {
    id: 'im-annual-physical',
    label: 'Annual Physical Labs',
    description: 'CBC, BMP, LFT, Lipase, TSH, Urinalysis',
    testIds: ['cbc', 'bmp', 'lft', 'lipase', 'tsh', 'urine'],
    clinicIds: ['internal-medicine'],
  },
  {
    id: 'im-fatigue-workup',
    label: 'Fatigue Workup',
    description: 'CBC, BMP, TSH, LFT, Glucose',
    testIds: ['cbc', 'bmp', 'tsh', 'lft', 'glucose'],
    clinicIds: ['internal-medicine'],
  },

  // ───────── Cardiology ─────────
  {
    id: 'cards-new-patient',
    label: 'Cardiology New Patient',
    description: 'ECG, BNP, Troponin, BMP, CBC',
    testIds: ['ecg', 'bnp', 'troponin', 'bmp', 'cbc'],
    clinicIds: ['cardiology'],
  },
  {
    id: 'cards-heart-failure',
    label: 'Heart Failure Workup',
    description: 'BNP, Echo, ECG, BMP, CXR',
    testIds: ['bnp', 'echo', 'ecg', 'bmp', 'cxr'],
    clinicIds: ['cardiology'],
  },
  {
    id: 'cards-chest-pain-outpt',
    label: 'Outpatient Chest Pain',
    description: 'ECG, Troponin, CXR, Echo',
    testIds: ['ecg', 'troponin', 'cxr', 'echo'],
    clinicIds: ['cardiology', 'internal-medicine'],
  },

  // ───────── Neurology ─────────
  {
    id: 'neuro-headache-workup',
    label: 'Headache Workup',
    description: 'MRI Brain, CBC, BMP',
    testIds: ['mri-brain', 'cbc', 'bmp'],
    clinicIds: ['neurology'],
  },
  {
    id: 'neuro-back-pain',
    label: 'Back / Radiculopathy',
    description: 'MRI L-spine, X-ray spine',
    testIds: ['mri-lspine', 'xr-spine'],
    clinicIds: ['neurology', 'orthopedics'],
  },
  {
    id: 'neuro-neck-pain',
    label: 'Neck / Cervical Workup',
    description: 'MRI C-spine, X-ray spine',
    testIds: ['mri-cspine', 'xr-spine'],
    clinicIds: ['neurology', 'orthopedics'],
  },

  // ───────── Dermatology ─────────
  {
    id: 'derm-systemic-rash',
    label: 'Systemic Rash Workup',
    description: 'CBC, LFT, BMP',
    testIds: ['cbc', 'lft', 'bmp'],
    clinicIds: ['dermatology'],
  },

  // ───────── Endocrinology ─────────
  {
    id: 'endo-diabetes-followup',
    label: 'Diabetes Follow-Up',
    description: 'Glucose, BMP, Urinalysis',
    testIds: ['glucose', 'bmp', 'urine'],
    clinicIds: ['endocrinology', 'internal-medicine'],
  },
  {
    id: 'endo-thyroid-workup',
    label: 'Thyroid Workup',
    description: 'TSH, CBC, BMP',
    testIds: ['tsh', 'cbc', 'bmp'],
    clinicIds: ['endocrinology'],
  },

  // ───────── Gastroenterology ─────────
  {
    id: 'gi-abdominal-workup',
    label: 'Abdominal Workup',
    description: 'CBC, BMP, LFT, Lipase, US abdomen',
    testIds: ['cbc', 'bmp', 'lft', 'lipase', 'us-abdomen'],
    clinicIds: ['gastroenterology', 'general-surgery'],
  },
  {
    id: 'gi-liver-workup',
    label: 'Liver Workup',
    description: 'LFT, Coag, CBC, US abdomen, MRCP',
    testIds: ['lft', 'coag', 'cbc', 'us-abdomen', 'mri-abd'],
    clinicIds: ['gastroenterology'],
  },

  // ───────── Pulmonology ─────────
  {
    id: 'pulm-dyspnea-workup',
    label: 'Dyspnea Workup',
    description: 'CXR, Peak flow, ABG, BNP, CBC',
    testIds: ['cxr', 'peak-flow', 'abg', 'bnp', 'cbc'],
    clinicIds: ['pulmonology'],
  },
  {
    id: 'pulm-chronic-cough',
    label: 'Chronic Cough Workup',
    description: 'CXR, CT chest, CBC, Peak flow',
    testIds: ['cxr', 'ct-chest', 'cbc', 'peak-flow'],
    clinicIds: ['pulmonology'],
  },

  // ───────── Nephrology ─────────
  {
    id: 'neph-renal-workup',
    label: 'Renal Workup',
    description: 'BMP, CBC, Urinalysis, US abdomen',
    testIds: ['bmp', 'cbc', 'urine', 'us-abdomen'],
    clinicIds: ['nephrology'],
  },
  {
    id: 'neph-stone-workup',
    label: 'Kidney Stone Workup',
    description: 'BMP, Urinalysis, KUB, CT abdomen',
    testIds: ['bmp', 'urine', 'kub', 'ct-abdomen'],
    clinicIds: ['nephrology', 'urology'],
  },

  // ───────── Rheumatology ─────────
  {
    id: 'rheum-joint-workup',
    label: 'Joint / Arthritis Workup',
    description: 'CBC, BMP, LFT, Urinalysis, X-ray extremity',
    testIds: ['cbc', 'bmp', 'lft', 'urine', 'xr-extrem'],
    clinicIds: ['rheumatology'],
  },
  {
    id: 'rheum-systemic-workup',
    label: 'Systemic Disease Workup',
    description: 'CBC, BMP, LFT, Urinalysis, CXR',
    testIds: ['cbc', 'bmp', 'lft', 'urine', 'cxr'],
    clinicIds: ['rheumatology'],
  },

  // ───────── Hematology ─────────
  {
    id: 'heme-anemia-workup',
    label: 'Anemia Workup',
    description: 'CBC, BMP, LFT',
    testIds: ['cbc', 'bmp', 'lft'],
    clinicIds: ['hematology'],
  },
  {
    id: 'heme-coag-workup',
    label: 'Coagulopathy Workup',
    description: 'CBC, Coag, LFT, Type & Screen',
    testIds: ['cbc', 'coag', 'lft', 'type-screen'],
    clinicIds: ['hematology'],
  },

  // ───────── Infectious Disease ─────────
  {
    id: 'id-fever-workup',
    label: 'Fever Workup',
    description: 'CBC, BMP, LFT, Blood cx, Urinalysis, Urine cx, CXR',
    testIds: ['cbc', 'bmp', 'lft', 'blood-cx', 'urine', 'urine-cx', 'cxr'],
    clinicIds: ['infectious-disease'],
  },
  {
    id: 'id-respiratory-viral',
    label: 'Respiratory Viral Panel',
    description: 'Flu swab, COVID swab, Strep RADT, CXR',
    testIds: ['flu-swab', 'covid-swab', 'strep-radt', 'cxr'],
    clinicIds: ['infectious-disease', 'internal-medicine', 'pediatrics'],
  },

  // ───────── Allergy / Immunology ─────────
  {
    id: 'allergy-baseline',
    label: 'Allergy Baseline Labs',
    description: 'CBC, Peak flow',
    testIds: ['cbc', 'peak-flow'],
    clinicIds: ['allergy-immunology'],
  },

  // ───────── Psychiatry ─────────
  {
    id: 'psych-med-baseline',
    label: 'Psych Med Baseline',
    description: 'CBC, BMP, TSH, LFT',
    testIds: ['cbc', 'bmp', 'tsh', 'lft'],
    clinicIds: ['psychiatry'],
  },
  {
    id: 'psych-altered-mental',
    label: 'Altered Mental Status',
    description: 'BMP, TSH, Glucose, Urine tox',
    testIds: ['bmp', 'tsh', 'glucose', 'utox'],
    clinicIds: ['psychiatry'],
  },

  // ───────── OB/GYN ─────────
  {
    id: 'obgyn-pregnancy-workup',
    label: 'Pregnancy Workup',
    description: 'Urine β-hCG, CBC, BMP, Pelvic US',
    testIds: ['urine-hcg', 'cbc', 'bmp', 'us-pelvis'],
    clinicIds: ['obgyn'],
  },
  {
    id: 'obgyn-pelvic-pain',
    label: 'Pelvic Pain Workup',
    description: 'Urine β-hCG, Urinalysis, Pelvic US, CBC',
    testIds: ['urine-hcg', 'urine', 'us-pelvis', 'cbc'],
    clinicIds: ['obgyn'],
  },

  // ───────── Urology ─────────
  {
    id: 'uro-hematuria-workup',
    label: 'Hematuria Workup',
    description: 'Urinalysis, Urine cx, BMP, CT abdomen',
    testIds: ['urine', 'urine-cx', 'bmp', 'ct-abdomen'],
    clinicIds: ['urology'],
  },
  {
    id: 'uro-prostate-workup',
    label: 'Prostate / LUTS Workup',
    description: 'Urinalysis, BMP, CBC',
    testIds: ['urine', 'bmp', 'cbc'],
    clinicIds: ['urology'],
  },

  // ───────── Ophthalmology ─────────
  {
    id: 'ophth-vision-workup',
    label: 'Vision Loss Workup',
    description: 'Glucose, BMP, MRI Brain',
    testIds: ['glucose', 'bmp', 'mri-brain'],
    clinicIds: ['ophthalmology'],
  },

  // ───────── ENT ─────────
  {
    id: 'ent-sore-throat',
    label: 'Sore Throat Workup',
    description: 'Strep RADT, Flu swab, COVID swab, CBC',
    testIds: ['strep-radt', 'flu-swab', 'covid-swab', 'cbc'],
    clinicIds: ['ent'],
  },
  {
    id: 'ent-neck-mass',
    label: 'Neck Mass Workup',
    description: 'CBC, TSH, CT chest, US abdomen',
    testIds: ['cbc', 'tsh', 'ct-chest', 'us-abdomen'],
    clinicIds: ['ent'],
  },

  // ───────── Orthopedics ─────────
  {
    id: 'ortho-extremity-injury',
    label: 'Extremity Injury',
    description: 'X-ray extremity, CBC',
    testIds: ['xr-extrem', 'cbc'],
    clinicIds: ['orthopedics'],
  },
  {
    id: 'ortho-joint-pain',
    label: 'Joint Pain Workup',
    description: 'X-ray extremity, CBC, BMP',
    testIds: ['xr-extrem', 'cbc', 'bmp'],
    clinicIds: ['orthopedics'],
  },

  // ───────── Pediatrics ─────────
  {
    id: 'peds-fever',
    label: 'Pediatric Fever',
    description: 'CBC, BMP, Urinalysis, Strep RADT, Flu swab',
    testIds: ['cbc', 'bmp', 'urine', 'strep-radt', 'flu-swab'],
    clinicIds: ['pediatrics'],
  },
  {
    id: 'peds-wheeze',
    label: 'Pediatric Wheeze',
    description: 'Peak flow, CXR, COVID swab, Flu swab',
    testIds: ['peak-flow', 'cxr', 'covid-swab', 'flu-swab'],
    clinicIds: ['pediatrics'],
  },

  // ───────── General Surgery ─────────
  {
    id: 'surg-rlq-workup',
    label: 'RLQ / Appendicitis Workup',
    description: 'CBC, BMP, Urinalysis, Urine β-hCG, CT abdomen',
    testIds: ['cbc', 'bmp', 'urine', 'urine-hcg', 'ct-abdomen'],
    clinicIds: ['general-surgery'],
  },
  {
    id: 'surg-hernia-workup',
    label: 'Hernia / Mass Workup',
    description: 'CBC, BMP, US abdomen',
    testIds: ['cbc', 'bmp', 'us-abdomen'],
    clinicIds: ['general-surgery'],
  },
];
