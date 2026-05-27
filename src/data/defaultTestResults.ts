// Default full-text reports for tests that come back with no case-specific
// finding (i.e., clinically normal). Shown in the TestReportCard and on the
// result toast when the player expands the result.

export const DEFAULT_RESULTS: Record<string, string> = {
  // ───────── Bedside ─────────
  glucose: `FINGERSTICK GLUCOSE
Value: 102 mg/dL
Reference: 70–140 mg/dL
Interpretation: Euglycemic.`,

  'peak-flow': `PEAK EXPIRATORY FLOW
Best of 3: 480 L/min
Predicted: 460 L/min  (104% predicted)
Interpretation: No obstructive airflow limitation.`,

  'urine-hcg': `URINE β-hCG
Result: Negative
Interpretation: Pregnancy not detected.`,

  ecg: `ECG — 12-LEAD
Rate 72 bpm · Rhythm: Normal sinus
PR 160 ms · QRS 94 ms · QT/QTc 380/412 ms
Axis: Normal (+30°)
ST segments isoelectric · T waves upright in I, II, V2–V6
No Q waves, no ischemic changes.
Interpretation: Normal sinus rhythm. No acute ST-T changes.`,

  'strep-radt': `RAPID STREP ANTIGEN
Result: Negative
Interpretation: No group A Streptococcus detected.`,

  'flu-swab': `RAPID INFLUENZA A/B
Influenza A: Negative
Influenza B: Negative`,

  'covid-swab': `RAPID SARS-CoV-2 ANTIGEN
Result: Negative`,

  pocus: `POCUS — Bedside Ultrasound
FAST exam: No free fluid in Morison's pouch, spleno-renal recess, or pelvis. No pericardial effusion.
Cardiac parasternal long axis: LV contractility preserved. No pericardial effusion.
Lung: A-lines bilaterally. No B-line consolidation. Normal lung sliding.
IVC: ~2 cm, ≥50% collapsibility with inspiration (euvolemic).
Interpretation: POCUS unremarkable.`,

  // ───────── Lab — hematology / chemistry ─────────
  abg: `ARTERIAL BLOOD GAS (room air)
pH 7.40   pCO₂ 40   pO₂ 95   HCO₃⁻ 24   BE 0
SaO₂ 97%   Lactate 1.2 mmol/L
Interpretation: Normal acid-base and oxygenation.`,

  lactate: `LACTATE
Value: 1.1 mmol/L
Reference: <2.0
Interpretation: Normal. No tissue hypoperfusion.`,

  cbc: `COMPLETE BLOOD COUNT with differential
WBC   7.2 K/µL   (ref 4.0–11.0)
  Neutrophils 58% · Lymphs 32% · Monos 7% · Eos 2% · Basos 1%
  Absolute neutrophil count 4.2 K/µL
Hgb    14.1 g/dL  (ref 12.0–17.5)
Hct    42%         (ref 36–52)
MCV    88 fL · MCH 29.6 pg · MCHC 33.5 g/dL · RDW 13.2%
Platelets  245 K/µL  (ref 150–400)
Peripheral smear: Normocytic, normochromic RBCs. No schistocytes, no blasts.
Interpretation: All parameters within normal limits.`,

  bmp: `BASIC METABOLIC PANEL
Na⁺  140 mEq/L   (136–145)
K⁺   4.0 mEq/L   (3.5–5.0)
Cl⁻  103 mEq/L   (98–107)
CO₂  24 mEq/L    (22–30)
BUN  14 mg/dL    (7–20)
Creatinine  0.9 mg/dL  (0.6–1.2)
eGFR >60 mL/min/1.73 m²
Glucose  95 mg/dL
Calcium  9.4 mg/dL
Anion gap 13
Interpretation: Electrolytes, renal function, glucose all normal.`,

  lft: `LIVER FUNCTION TESTS
AST   22 U/L   (ref <40)
ALT   18 U/L   (ref <45)
ALP   78 U/L   (ref 40–130)
GGT   22 U/L
Total bilirubin  0.6 mg/dL   (direct 0.2)
Albumin  4.2 g/dL
Total protein  7.0 g/dL
Interpretation: Hepatic synthetic and excretory function normal.`,

  lipase: `LIPASE
Value: 32 U/L
Reference: <60 U/L
Interpretation: Within normal limits. No biochemical evidence of pancreatitis.`,

  coag: `COAGULATION PANEL
PT   12.8 s     (ref 11.0–13.5)
INR  1.02       (ref 0.8–1.1)
PTT  30 s       (ref 25–35)
Fibrinogen  310 mg/dL
Interpretation: Coagulation parameters within normal limits.`,

  bnp: `BNP
Value: 42 pg/mL
Reference: <100 pg/mL
Interpretation: Below cutoff for acute decompensated heart failure.`,

  dimer: `D-DIMER
Value: 240 ng/mL FEU
Reference: <500 ng/mL FEU
Interpretation: Negative. Low likelihood of VTE in a low-pretest-probability patient.`,

  troponin: `HIGH-SENSITIVITY TROPONIN I
Value: 0.01 ng/mL
Reference (99th percentile): <0.04 ng/mL
Interpretation: Below threshold for myocardial injury. Consider serial trend per chest-pain pathway.`,

  tsh: `THYROID-STIMULATING HORMONE
TSH: 2.1 µIU/mL   (ref 0.4–4.0)
Interpretation: Euthyroid.`,

  'type-screen': `TYPE & SCREEN
ABO/Rh: O Positive
Antibody screen: Negative
Interpretation: No unexpected antibodies. Blood products crossmatch-compatible if needed.`,

  urine: `URINALYSIS — dipstick + micro
Color yellow · Clarity clear · SG 1.015 · pH 6.0
Protein neg · Glucose neg · Ketones neg
Blood neg · Leukocyte esterase neg · Nitrite neg
Micro: 0–2 WBC/hpf · 0–2 RBC/hpf · No casts · No bacteria
Interpretation: Unremarkable. No evidence of UTI or hematuria.`,

  'urine-cx': `URINE CULTURE (preliminary)
Gram stain: Few squamous epithelial cells. No organisms seen.
48-hour result pending. Preliminary: no growth at 24h.`,

  'blood-cx': `BLOOD CULTURES (×2 sets, preliminary)
Set 1 (aerobic + anaerobic): No growth at incubation time.
Set 2 (aerobic + anaerobic): No growth at incubation time.
Final result at 48–72 h.`,

  utox: `URINE TOXICOLOGY SCREEN
Amphetamines: negative
Benzodiazepines: negative
Cannabinoids: negative
Cocaine: negative
Opiates: negative
Barbiturates: negative
PCP: negative
Interpretation: No detectable substances on standard panel.`,

  // ───────── Imaging — X-ray ─────────
  cxr: `CHEST X-RAY — PA / Lateral
Cardiac silhouette: Normal size and contour. CT ratio <0.5.
Mediastinum: Normal width. No mass.
Lungs: Clear bilaterally. No focal opacity, effusion, or pneumothorax.
Hila: Symmetric, no adenopathy.
Pleura unremarkable.
Bones / soft tissues: No acute osseous abnormality.
Interpretation: No acute cardiopulmonary findings.`,

  kub: `ABDOMINAL X-RAY (KUB)
Non-specific bowel gas pattern. No free intraperitoneal air.
No dilated loops of small or large bowel. No definite air-fluid levels.
No radio-opaque calculi along the urinary tract.
Osseous structures: unremarkable.
Interpretation: Unremarkable KUB.`,

  'xr-extrem': `EXTREMITY X-RAY
No acute fracture or dislocation.
Joint spaces preserved. No significant degenerative change.
Soft tissues unremarkable.
Interpretation: Negative for acute osseous injury.`,

  'xr-spine': `SPINE X-RAY
Alignment preserved. Vertebral body heights maintained.
No acute fracture. Disc spaces preserved.
Interpretation: No acute osseous abnormality.`,

  'xr-pelvis': `PELVIS X-RAY
Pelvic ring intact. No fracture of the iliac, ischial, or pubic rami.
Hips: Femoral heads well-seated. Joint spaces preserved.
Interpretation: No acute pelvic fracture.`,

  'us-abdomen': `ABDOMINAL ULTRASOUND
Liver: Normal contour and echogenicity. No focal lesion.
Gallbladder: Thin-walled, no stones, no sonographic Murphy sign.
CBD: 4 mm. No biliary dilation.
Pancreas: Partially obscured by bowel gas; visualized portions unremarkable.
Spleen: Normal size (10.5 cm).
Kidneys: Bilateral normal size, no hydronephrosis, no stones.
Aorta: Normal caliber to bifurcation. No aneurysm.
Interpretation: Normal abdominal ultrasound.`,

  'us-pelvis': `PELVIC ULTRASOUND (transabdominal ± transvaginal)
Uterus: Normal size and echogenicity. Endometrium 6 mm.
Ovaries: Bilateral normal size. No cysts or mass.
No free pelvic fluid.
Interpretation: Unremarkable pelvic ultrasound.`,

  echo: `CARDIAC ECHO — Transthoracic
LV size: Normal. LVEF visually 55–60%.
Wall motion: Normal. No regional wall-motion abnormality.
RV size and function: Normal.
Valves: Trace tricuspid regurgitation (physiologic). No stenosis. No vegetation.
Pericardium: No effusion.
IVC: Normal caliber, >50% collapse with sniff (RAP ≤3 mmHg).
Interpretation: Normal LV systolic function. No structural abnormality.`,

  'ct-head': `CT HEAD — non-contrast
No intracranial hemorrhage.
No mass effect or midline shift.
Gray-white matter differentiation preserved.
Ventricles normal for age. Basal cisterns patent.
No extra-axial collection. No skull fracture.
Paranasal sinuses and mastoid air cells clear.
Interpretation: No acute intracranial abnormality.`,

  'ct-chest': `CT CHEST — with / without contrast
Lungs: Clear. No pulmonary nodules, masses, infiltrates, or effusions.
Airways: Patent.
Mediastinum: Normal vessels and lymph nodes. No mass.
Heart: Normal size, no pericardial effusion.
Pleura: Unremarkable.
Osseous structures: No acute findings.
Interpretation: No acute cardiopulmonary pathology.`,

  'ct-angio': `CT ANGIOGRAM — Chest / Pulmonary
No filling defects in the main, lobar, segmental, or sub-segmental pulmonary arteries.
No evidence of acute pulmonary embolism.
Aorta normal caliber without dissection or aneurysm.
Lungs and pleura: No acute abnormality.
Interpretation: No pulmonary embolism. No aortic dissection.`,

  'ct-abdomen': `CT ABDOMEN / PELVIS — with IV contrast
Liver, spleen, pancreas, adrenals: Unremarkable.
Gallbladder: Thin-walled. No stones.
Kidneys / ureters: No hydronephrosis, no stones.
Bowel: Normal caliber and wall thickness. No obstruction. No free air.
Appendix: Normal caliber (5 mm). No peri-appendiceal fat stranding.
Aorta / vasculature: Normal. No aneurysm or dissection.
Pelvic organs: Unremarkable.
Bladder: Unremarkable.
No free fluid. No lymphadenopathy.
Interpretation: No acute intra-abdominal pathology.`,

  'ct-cspine': `CT CERVICAL SPINE — non-contrast
Alignment preserved. Vertebral body heights maintained.
No acute fracture from C1 through T1.
Facet joints and disc spaces preserved.
No prevertebral soft-tissue swelling.
Interpretation: No acute cervical spine injury.`,

  'mri-brain': `MRI BRAIN (DWI / FLAIR / T1 / T2 / GRE)
No diffusion restriction. No acute infarct.
No FLAIR hyperintensity outside chronic microvascular changes age-appropriate.
No mass, hemorrhage, or midline shift.
Ventricles and cisterns normal.
Vascular flow voids preserved.
Interpretation: No acute intracranial abnormality on MRI.`,

  'mri-cspine': `MRI CERVICAL SPINE
Alignment preserved. No acute fracture.
Discs: Mild age-appropriate desiccation. No significant herniation.
Spinal cord: Normal caliber and signal. No cord compression.
Neural foramina patent bilaterally.
Interpretation: No acute cord or nerve-root compression.`,

  'mri-lspine': `MRI LUMBAR SPINE
Alignment preserved. Vertebral body heights maintained.
Discs: Mild degenerative desiccation at L4-5 and L5-S1. No significant herniation.
Thecal sac / conus: Normal. No cord or cauda compression.
Interpretation: Mild multilevel degenerative changes; no acute cord compression.`,

  'mri-abd': `MRI ABDOMEN with MRCP
Liver, spleen, pancreas, kidneys, adrenals: Unremarkable.
Biliary tree: Normal caliber without obstruction, filling defect, or stricture.
Pancreatic duct: Normal caliber.
No free fluid.
Interpretation: Normal abdominal MRI / MRCP.`,

  // ───────── Endocrine / metabolic ─────────
  hba1c: `HEMOGLOBIN A1c
Result: 5.4 %
Reference: <5.7 % (normal); 5.7–6.4 % prediabetes; ≥6.5 % diabetes
Interpretation: Normal glycemic control over the last 3 months.`,

  lipid: `LIPID PANEL (fasting)
Total cholesterol: 178 mg/dL  (<200)
LDL-C:           102 mg/dL  (<100 optimal, <130 near-optimal)
HDL-C:            54 mg/dL  (>40 M / >50 F)
Triglycerides:   120 mg/dL  (<150)
Non-HDL-C:       124 mg/dL
Interpretation: Lipid profile within reference range.`,

  'vit-d': `VITAMIN D, 25-HYDROXY
Result: 38 ng/mL
Reference: 30–80 ng/mL
Interpretation: Sufficient.`,

  b12: `VITAMIN B12 / FOLATE
Vitamin B12: 540 pg/mL  (200–900)
Folate (serum): 12 ng/mL  (>4)
Interpretation: B12 and folate within reference range.`,

  iron: `IRON STUDIES
Serum iron:        88 µg/dL   (60–170)
TIBC:             310 µg/dL   (250–450)
Transferrin sat.:  28 %       (20–50)
Ferritin:         110 ng/mL   (30–300 M / 15–200 F)
Interpretation: Iron stores adequate. No evidence of iron-deficiency anemia.`,

  ferritin: `FERRITIN
Result: 95 ng/mL
Reference: 30–300 (M) / 15–200 (F)
Interpretation: Within reference range.`,

  'free-t4': `THYROID FREE HORMONES
Free T4: 1.2 ng/dL  (0.8–1.8)
Free T3: 3.0 pg/mL  (2.3–4.2)
Interpretation: Free thyroid hormones within reference range.`,

  cortisol: `MORNING CORTISOL (8 AM)
Result: 14 µg/dL
Reference: 6–23 µg/dL (AM)
Interpretation: Adequate adrenal cortisol production. No evidence of adrenal insufficiency.`,

  'beta-hcg-q': `β-hCG, QUANTITATIVE SERUM
Result: <2 mIU/mL
Reference: <5 mIU/mL (non-pregnant)
Interpretation: Negative for pregnancy.`,

  psa: `PROSTATE-SPECIFIC ANTIGEN
Result: 1.2 ng/mL
Reference (age-adjusted): <2.5 (40–49) / <3.5 (50–59) / <4.5 (60–69) / <6.5 (70+)
Interpretation: Within reference range for age.`,

  // ───────── Inflammation / infection ─────────
  crp: `C-REACTIVE PROTEIN
Result: 2.1 mg/L
Reference: <5 mg/L
Interpretation: No evidence of significant systemic inflammation.`,

  esr: `ERYTHROCYTE SEDIMENTATION RATE
Result: 8 mm/hr
Reference: <20 (M) / <30 (F)
Interpretation: Within reference range.`,

  procal: `PROCALCITONIN
Result: 0.05 ng/mL
Reference: <0.10 (low risk for bacterial infection)
Interpretation: Low probability of bacterial sepsis.`,

  hiv: `HIV 4th-GENERATION Ag/Ab COMBO
HIV-1/2 Ab: Non-reactive
HIV-1 p24 Ag: Non-reactive
Interpretation: Negative. No serologic evidence of HIV infection.`,

  'hep-b': `HEPATITIS B SEROLOGY
HBsAg: Negative
Anti-HBs: Positive (immune)
Anti-HBc total: Negative
Interpretation: Immune to hepatitis B (vaccine response). No active or past infection.`,

  'hep-c': `HEPATITIS C ANTIBODY
Anti-HCV: Non-reactive
Interpretation: No serologic evidence of HCV exposure.`,

  rpr: `RPR / VDRL (SYPHILIS)
Result: Non-reactive
Interpretation: No serologic evidence of syphilis.`,

  // ───────── Autoimmune ─────────
  ana: `ANTINUCLEAR ANTIBODY (ANA)
Titer: <1:80  (Negative)
Pattern: N/A
Interpretation: No detectable ANA at screening dilution.`,

  rf: `RHEUMATOID FACTOR
Result: <14 IU/mL
Reference: <14 IU/mL
Interpretation: Negative.`,

  'anti-ccp': `ANTI-CYCLIC CITRULLINATED PEPTIDE (CCP)
Result: <20 U/mL
Reference: <20 U/mL
Interpretation: Negative.`,

  dsdna: `ANTI-DOUBLE-STRANDED DNA
Result: <10 IU/mL
Reference: <30 IU/mL
Interpretation: Negative.`,

  'c3-c4': `COMPLEMENT
C3: 110 mg/dL  (90–180)
C4: 28 mg/dL  (10–40)
Interpretation: Complement levels within reference range.`,

  // ───────── Stool ─────────
  'stool-cx': `STOOL CULTURE
Result: No Salmonella, Shigella, Campylobacter, or E. coli O157 isolated.
Interpretation: Negative for routine enteric pathogens.`,

  fobt: `FECAL OCCULT BLOOD (FIT)
Result: Negative
Interpretation: No detectable hemoglobin in stool.`,

  calpro: `FECAL CALPROTECTIN
Result: 32 µg/g
Reference: <50 µg/g
Interpretation: Below threshold suggestive of intestinal inflammation.`,

  'h-pylori': `H. PYLORI STOOL ANTIGEN
Result: Negative
Interpretation: No active H. pylori infection detected.`,

  // ───────── Psych drug levels ─────────
  lithium: `LITHIUM LEVEL
Result: 0.7 mmol/L
Therapeutic: 0.6–1.2 mmol/L (acute) / 0.4–0.8 (maintenance)
Interpretation: Within therapeutic range.`,

  valproate: `VALPROATE LEVEL
Result: 75 µg/mL
Therapeutic: 50–100 µg/mL
Interpretation: Within therapeutic range.`,

  // ───────── Specialty imaging / functional ─────────
  dexa: `DEXA BONE DENSITY
Lumbar spine T-score: −0.4
Femoral neck T-score: −0.6
Interpretation: Normal bone density (T-score > −1.0). No osteopenia or osteoporosis.`,

  mammogram: `MAMMOGRAM (BI-RADS)
Bilateral screening views unremarkable. Symmetric fibroglandular tissue.
No suspicious mass, calcifications, or architectural distortion.
BI-RADS Category: 1 (negative).
Interpretation: Negative. Routine screening recommended.`,

  oct: `OCT — RETINA / OPTIC NERVE
Macula: Foveal contour preserved. No subretinal fluid, drusen, or pigment-epithelial detachment.
Retinal nerve fiber layer: Symmetric, age-appropriate thickness.
Interpretation: Normal macular and RNFL anatomy.`,

  'visual-field': `VISUAL FIELD (Humphrey 24-2)
Mean deviation: 0 dB. Pattern standard deviation: within normal limits.
No reproducible scotomas, hemianopias, or constriction.
Interpretation: Full visual fields bilaterally.`,

  fundoscopy: `DILATED FUNDOSCOPY
Optic discs: Sharp margins. Cup-to-disc ratio 0.3 bilaterally.
Vessels: Normal caliber and ratio.
Macula: Foveal light reflex preserved. No exudate, hemorrhage, or drusen.
Periphery: Flat, no tears, no detachment.
Interpretation: Normal fundoscopic exam.`,

  audiometry: `PURE-TONE AUDIOMETRY
Right: 250–8000 Hz thresholds 5–15 dB.
Left:  250–8000 Hz thresholds 5–15 dB.
Speech reception threshold: 10 dB bilaterally. Discrimination 100 %.
Interpretation: Normal hearing bilaterally.`,

  eeg: `EEG (routine, awake + drowsy)
Background: well-organized 9–10 Hz posterior dominant rhythm, reactive to eye opening.
No focal slowing. No epileptiform discharges. Photic and hyperventilation activation unremarkable.
Interpretation: Normal awake and drowsy EEG.`,

  'emg-ncs': `EMG / NERVE CONDUCTION
Motor and sensory NCS in the upper and lower extremities: amplitudes, latencies, conduction velocities within normal limits.
Needle EMG: no spontaneous activity, normal motor unit morphology and recruitment.
Interpretation: Normal EMG / NCS. No electrodiagnostic evidence of neuropathy, radiculopathy, or myopathy.`,

  spirometry: `PULMONARY FUNCTION TESTS
FEV1: 3.6 L (96 % predicted)
FVC:  4.5 L (98 % predicted)
FEV1/FVC: 80 %  (>0.70)
DLCO: 92 % predicted
Interpretation: Normal spirometry. No obstructive or restrictive defect.`,

  'pap-smear': `PAP / HPV CO-TEST
Cytology: Negative for intraepithelial lesion or malignancy (NILM).
HPV high-risk panel: Negative.
Interpretation: Negative. Routine screening interval.`,

  'skin-biopsy': `SKIN BIOPSY (punch / shave)
Histology: Specimen pending — preliminary impression consistent with benign inflammatory dermatosis.
No atypical melanocytes. No malignancy.
Interpretation: No malignant features on preliminary review.`,
};

export function getTestReport(
  testId: string,
  caseSpecific: string | undefined,
  abnormal: boolean
): { text: string; abnormal: boolean } {
  if (caseSpecific) return { text: caseSpecific, abnormal };
  const defaultText = DEFAULT_RESULTS[testId] ?? 'Study completed. No significant findings.';
  return { text: defaultText, abnormal: false };
}
