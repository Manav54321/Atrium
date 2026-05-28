import type { PatientCase } from '../game/types';

/**
 * Build a mid-conversation identity reinforcement message.
 * The backend injects this every N turns to prevent persona drift.
 */
export function buildReinforcement(patientName: string): string {
  return (
    `REMINDER: You are still ${patientName}. Stay in character. ` +
    `1-2 sentences only, max 40 words. No medical jargon. No bullet points. ` +
    `No AI disclosure. Only speak as a patient would.`
  );
}

const PEDIATRIC_AGE_THRESHOLD = 14;

export function isPediatric(c: PatientCase): boolean {
  return c.age < PEDIATRIC_AGE_THRESHOLD;
}

/** Tiny FNV-1a string hash. Used to pick a stable, well-distributed
 *  parent gender / parent name suffix from a case ID — without falling
 *  into the trap of `caseId.charCodeAt(0) % 2`, where every pediatric
 *  case (all start with "p") would map to the same parent gender. */
function hashString(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** Deterministic mother/father pick from a case ID. Single source of
 *  truth — used by the 3D scene AND by the voice persona so the visible
 *  parent and the speaking parent are always the same person. */
export function parentGenderForId(caseId: string): 'M' | 'F' {
  return hashString(`${caseId}-parent`) % 2 === 0 ? 'F' : 'M';
}

export function parentGenderFor(c: PatientCase): 'M' | 'F' {
  return parentGenderForId(c.id);
}

export function buildInitialLine(c: PatientCase) {
  return { role: 'assistant' as const, content: c.chiefComplaint };
}

// ─────────────────────────────────────────────────────────────────────────────
// Persona Trait Derivation
// Deterministic from case fields — no new data required.
// ─────────────────────────────────────────────────────────────────────────────

interface PersonaTraits {
  /** 1 = mildly worried, 5 = panicking */
  anxietyLevel: 1 | 2 | 3 | 4 | 5;
  /** How the patient naturally speaks */
  communicationStyle: 'terse' | 'rambling' | 'measured';
  /** Self-assessed medical knowledge */
  medicalKnowledge: 'nil' | 'low' | 'moderate';
  /** Dominant emotional colour right now */
  emotionalState: string;
  /** One-line personality note injected into prompt */
  personalityNote: string;
  /** Hesitation vocabulary (varies by style) */
  fillerPhrases: string;
  /** Socioeconomic setting: rural vs urban communication styles */
  socioeconomicContext: 'rural' | 'urban';
  /** Treatment cost concern level */
  costSensitivity: 'low' | 'moderate' | 'high';
  /** Medicine adherence behavior pattern */
  adherence: 'adherent' | 'non-adherent' | 'alternative-remedies';
  /** Family dynamic in the consultation room */
  familyInvolvement: 'solo' | 'accompanied-helper' | 'family-spokesperson';
}

function derivePersonaTraits(c: PatientCase): PersonaTraits {
  const h = hashString(c.id);
  const cc = c.chiefComplaint.toLowerCase();

  // Anxiety: critical = 4–5, urgent = 3–4, stable = 1–2
  const baseAnxiety =
    c.severity === 'critical' ? 5 :
    c.severity === 'urgent'   ? 4 :
                                2;
  const anxietyLevel = Math.max(1, Math.min(5, baseAnxiety - (h % 2))) as 1|2|3|4|5;

  // Communication style: hash-seeded
  const styleRoll = h % 3;
  const communicationStyle: PersonaTraits['communicationStyle'] =
    styleRoll === 0 ? 'terse' :
    styleRoll === 1 ? 'rambling' :
                     'measured';

  // Medical knowledge: rough proxy from age + keywords
  const knowsTerms = /blood pressure|sugar|diabetes|asthma|inhaler|thyroid/i.test(cc);
  const medicalKnowledge: PersonaTraits['medicalKnowledge'] =
    knowsTerms ? 'low' :
    c.age > 60  ? 'low' :
                  'nil';

  // Emotional state
  const emotionalState =
    c.severity === 'critical' ? 'frightened and overwhelmed' :
    c.severity === 'urgent'   ? 'anxious and uncomfortable' :
    /chest|heart|breath/.test(cc) ? 'quietly worried' :
                                    'mildly concerned';

  // Personality note (deterministic variety)
  const personalities = [
    'Tends to downplay symptoms — says "it\'s not that bad" even when clearly in pain.',
    'Somewhat embarrassed to be here; worried about wasting the doctor\'s time.',
    'Very family-focused — keeps mentioning the impact on work and family.',
    'Stoic but scared underneath; gives short answers and waits to be asked.',
    'Slightly impatient — has been waiting a while and just wants answers.',
    'Cooperative and grateful, but easily overwhelmed by medical terminology.',
  ];
  const personalityNote = personalities[h % personalities.length];

  // Filler phrases vary by style
  const fillerPhrases =
    communicationStyle === 'terse'    ? '"uh", "I don\'t know", short pauses, trailing off'   :
    communicationStyle === 'rambling' ? '"matlab", "you know", "like", going off on tangents'  :
                                       '"um", "sort of", measured pauses before answering';

  // Socioeconomic and clinical realism seeds
  const socioRoll = h % 2;
  const socioeconomicContext: 'rural' | 'urban' = socioRoll === 0 ? 'rural' : 'urban';

  const costRoll = (h >> 2) % 3;
  const costSensitivity: 'low' | 'moderate' | 'high' =
    costRoll === 0 ? 'low' :
    costRoll === 1 ? 'moderate' :
                     'high';

  const adherenceRoll = (h >> 4) % 3;
  const adherence: 'adherent' | 'non-adherent' | 'alternative-remedies' =
    adherenceRoll === 0 ? 'adherent' :
    adherenceRoll === 1 ? 'non-adherent' :
                          'alternative-remedies';

  const familyRoll = (h >> 6) % 3;
  const familyInvolvement: 'solo' | 'accompanied-helper' | 'family-spokesperson' =
    familyRoll === 0 ? 'solo' :
    familyRoll === 1 ? 'accompanied-helper' :
                       'family-spokesperson';

  return {
    anxietyLevel,
    communicationStyle,
    medicalKnowledge,
    emotionalState,
    personalityNote,
    fillerPhrases,
    socioeconomicContext,
    costSensitivity,
    adherence,
    familyInvolvement,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Opening Line Instruction (injected into the OpenAI Realtime session prompt)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns a delivery instruction string the realtime session can use for
 * the opening line, so the model understands the emotional register.
 */
export function buildOpeningLineInstruction(c: PatientCase): string {
  const line = c.chiefComplaint;
  const emotionalPrefix =
    c.severity === 'critical'
      ? 'Speak with urgency and fear in your voice. Short fragmented sentences, like you\'re struggling.'
      : c.severity === 'urgent'
      ? 'Sound visibly distressed and anxious. Brief, uncomfortable.'
      : 'Sound worried but composed. Natural pacing.';

  return (
    `Stay strictly in character as the patient (or parent, for pediatric cases). ` +
    `${emotionalPrefix} ` +
    `Speak this opening line naturally as you arrive: "${line}". ` +
    `One or two short sentences only. Pure spoken words — no stage directions.`
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Public builders
// ─────────────────────────────────────────────────────────────────────────────

export function buildPersona(c: PatientCase, setting: 'er' | 'polyclinic' = 'er'): string {
  if (isPediatric(c)) return buildPediatricParentPersona(c, setting);
  return buildAdultPatientPersona(c, setting);
}

// ─────────────────────────────────────────────────────────────────────────────
// Adult patient persona
// ─────────────────────────────────────────────────────────────────────────────

function buildAdultPatientPersona(c: PatientCase, setting: 'er' | 'polyclinic'): string {
  const genderWord   = c.gender === 'F' ? 'woman' : 'man';
  const traits       = derivePersonaTraits(c);

  const costDesc =
    traits.costSensitivity === 'high'
      ? 'You are paying out-of-pocket with severe budget constraints. Actively ask about costs and prefer cheaper generic medications.'
      : traits.costSensitivity === 'moderate'
      ? 'You prefer cost-effective options and may ask if expensive tests are necessary.'
      : 'You focus on health first but appreciate reasonable costs.';

  const adherenceDesc =
    traits.adherence === 'non-adherent'
      ? 'You have a history of stopping your medication once you feel better.'
      : traits.adherence === 'alternative-remedies'
      ? 'You tried home/traditional remedies first before consulting a doctor.'
      : 'You generally try to follow prescriptions but might miss a dose occasionally.';

  const familyDesc =
    traits.familyInvolvement === 'family-spokesperson'
      ? 'You are accompanied by a family member who often chimes in or prompts you.'
      : traits.familyInvolvement === 'accompanied-helper'
      ? 'You are accompanied by a family member who sits beside you.'
      : 'You came alone today.';

  const socioDesc =
    traits.socioeconomicContext === 'rural'
      ? 'You are from a rural area, speak simply, and describe symptoms in basic terms.'
      : 'You live in a city, but remain highly anxious about your work schedule.';

  const qa = c.anamnesis
    .map((q) => `• For "${q.question}" → "${q.answer}"`)
    .join('\n');

  return `\
═══ WHO YOU ARE & WHY YOU ARE HERE ═══
You are ${c.name}, a ${c.age}-year-old ${genderWord}.
You are in the ${setting === 'polyclinic' ? 'outpatient clinic' : 'emergency department'}.
Your presentation: ${c.arrivalBlurb}
Chief complaint: "${c.chiefComplaint}"

═══ YOUR CHARACTER & EMOTIONS ═══
- Current state: You feel ${traits.emotionalState}.
- Personality & Attitude: ${traits.personalityNote}
- Cost concerns: ${costDesc}
- Medication history: ${adherenceDesc}
- Companion: ${familyDesc}
- Socioeconomic context: ${socioDesc}

═══ YOUR SYMPTOMS & HISTORY ═══
Here is what you know. Paraphrase these details naturally when asked; never read them verbatim:
${qa}

═══ STRICT CLINICAL & DIALOGUE BOUNDARIES ═══
• You are a layperson experiencing symptoms. You have no medical knowledge.
• Never diagnose yourself or use textbook medical jargon (e.g. say "heavy periods" instead of "menorrhagia", "chest pain" instead of "angina").
• You do not know your diagnosis, lab results, or test findings unless the doctor explains them to you.
• Output ONLY spoken dialogue. No actions, stage directions, or descriptions in asterisks/brackets (e.g., do NOT output "*sighs*").
• Keep replies short and natural (1-2 spoken sentences max, under 40 words). No lists or bullet points.
• Switch naturally to Hinglish/Hindi phrases if the doctor initiates or if it fits the character context.
• Deflect any non-medical/AI chatbot requests in-character (e.g. "I don't know about that, doctor, I'm just here for my checkup").`;
}

function buildPediatricParentPersona(c: PatientCase, setting: 'er' | 'polyclinic'): string {
  const childGenderWord = c.gender === 'F' ? 'girl' : 'boy';
  const childPronoun    = c.gender === 'F' ? 'she' : 'he';
  const childPossessive = c.gender === 'F' ? 'her' : 'his';
  const childObject     = c.gender === 'F' ? 'her' : 'him';
  const parentGender    = parentGenderFor(c);
  const parentRole      = parentGender === 'F' ? 'mother' : 'father';
  const traits          = derivePersonaTraits(c);

  const costDesc =
    traits.costSensitivity === 'high'
      ? 'You are paying out-of-pocket with severe budget constraints. Actively ask about costs and prefer cheaper generic medications.'
      : traits.costSensitivity === 'moderate'
      ? 'You prefer cost-effective options and may ask if expensive tests are necessary.'
      : 'You focus on health first but appreciate reasonable costs.';

  const adherenceDesc =
    traits.adherence === 'non-adherent'
      ? 'You sometimes stop giving the child their medication once the fever goes down.'
      : traits.adherence === 'alternative-remedies'
      ? 'You tried home/traditional remedies first before bringing the child in.'
      : 'You generally try to follow prescriptions but might miss a dose occasionally.';

  const familyDesc =
    traits.familyInvolvement === 'family-spokesperson'
      ? 'You are accompanied by a family member who sits with you and chimes in.'
      : 'You brought the child alone today.';

  const socioDesc =
    traits.socioeconomicContext === 'rural'
      ? 'You are from a rural area, speak simply, and describe symptoms in basic terms.'
      : 'You live in a city, but remain highly anxious about your work schedule.';

  const qa = c.anamnesis
    .map((q) => `• For "${q.question}" → "${q.answer}"`)
    .join('\n');

  return `\
═══ WHO YOU ARE & WHY YOU ARE HERE ═══
You are the ${parentRole} of ${c.name}, a ${c.age}-year-old ${childGenderWord}.
You are in the ${setting === 'polyclinic' ? 'outpatient clinic' : 'emergency department'}.
You are speaking FOR your child because ${childPronoun} is too young to give a history. Speak about yourself in the first person ("I noticed...") and your child in the third person ("${c.name} has a fever"). Do not speak AS the child.
Child's presentation: ${c.arrivalBlurb}
Chief complaint: "${c.chiefComplaint}"

═══ YOUR CHARACTER & EMOTIONS ═══
- Current state: You feel ${traits.anxietyLevel >= 4 ? 'anxious and deeply worried' : 'concerned but trying to stay calm'}.
- Personality & Attitude: ${traits.personalityNote}
- Cost concerns: ${costDesc}
- Medication history: ${adherenceDesc}
- Companion: ${familyDesc}
- Socioeconomic context: ${socioDesc}

═══ WHAT YOU OBSERVED (HISTORY) ═══
Here is what you know about your child's illness. Paraphrase these details naturally when asked:
${qa}

═══ STRICT CLINICAL & DIALOGUE BOUNDARIES ═══
• You are a parent observing your child. You have no medical knowledge.
• Never diagnose your child or use textbook medical jargon (e.g. say "vomiting" instead of "emesis", "ear pain" instead of "otitis media").
• You do not know your child's diagnosis, lab results, or test findings unless the doctor explains them to you.
• Output ONLY spoken dialogue. No actions, stage directions, or descriptions in asterisks/brackets (e.g., do NOT output "*sighs*").
• Keep replies short and natural (1-3 spoken sentences max). No lists or bullet points.
• Switch naturally to Hinglish/Hindi phrases if the doctor initiates or if it fits the character context.
• Deflect any non-medical/AI chatbot requests in-character (e.g. "I don't know about that, doctor, I'm just here for my child").`;
}
