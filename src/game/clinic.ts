// Polyclinic (outpatient) specialty identifiers.
//
// These IDs key both patient rosters (`POLYCLINIC_CASES`) and UI labels.
// Kept in a separate module so the store, 3D scene, HUD view, and the
// patient-data file (owned by another agent) can all import from a
// single location without a circular dependency.

export type ClinicId =
  | 'all-specialties'
  | 'internal-medicine'
  | 'cardiology'
  | 'neurology'
  | 'neurosurgery'
  | 'dermatology'
  | 'endocrinology'
  | 'gastroenterology'
  | 'pulmonology'
  | 'nephrology'
  | 'rheumatology'
  | 'hematology'
  | 'oncology'
  | 'infectious-disease'
  | 'allergy-immunology'
  | 'psychiatry'
  | 'obgyn'
  | 'urology'
  | 'ophthalmology'
  | 'ent'
  | 'orthopedics'
  | 'pmr'
  | 'pediatrics'
  | 'general-surgery'
  | 'cardiothoracic-vascular-surgery';

/** Display order — also used by the specialty selector UI. The first entry
 *  is the "mixed" option that pulls cases from every specialty, so the
 *  doctor sees a rapid variety of demographics (kids, elderly, men, women)
 *  without having to switch clinics manually. */
export const CLINIC_IDS: ClinicId[] = [
  'all-specialties',
  'internal-medicine',
  'cardiology',
  'neurology',
  'neurosurgery',
  'dermatology',
  'endocrinology',
  'gastroenterology',
  'pulmonology',
  'nephrology',
  'rheumatology',
  'hematology',
  'oncology',
  'infectious-disease',
  'allergy-immunology',
  'psychiatry',
  'obgyn',
  'urology',
  'ophthalmology',
  'ent',
  'orthopedics',
  'pmr',
  'pediatrics',
  'general-surgery',
  'cardiothoracic-vascular-surgery',
];

/** English display labels for each specialty. */
export const CLINIC_LABELS: Record<ClinicId, string> = {
  'all-specialties': 'All Specialties (mixed)',
  'internal-medicine': 'Internal Medicine',
  cardiology: 'Cardiology',
  neurology: 'Neurology',
  neurosurgery: 'Neurosurgery',
  dermatology: 'Dermatology',
  endocrinology: 'Endocrinology',
  gastroenterology: 'Gastroenterology',
  pulmonology: 'Pulmonology',
  nephrology: 'Nephrology',
  rheumatology: 'Rheumatology',
  hematology: 'Hematology',
  oncology: 'Oncology',
  'infectious-disease': 'Infectious Disease',
  'allergy-immunology': 'Allergy & Immunology',
  psychiatry: 'Psychiatry',
  obgyn: 'OB/GYN',
  urology: 'Urology',
  ophthalmology: 'Ophthalmology',
  ent: 'ENT',
  orthopedics: 'Orthopedics',
  pmr: 'Physical Medicine & Rehab',
  pediatrics: 'Pediatrics',
  'general-surgery': 'General Surgery',
  'cardiothoracic-vascular-surgery': 'Cardiothoracic & Vascular Surgery',
};

export const DEFAULT_CLINIC: ClinicId = 'internal-medicine';
