// Builds the [debrief request] payload sent to the atrium-attending Managed
// Agent at end-of-encounter. The agent's system prompt (DEBRIEF MODE in
// backend/server.py) declares the exact contract: case_id, rubric,
// registry_slice, encounter_log. This module produces that JSON from the
// in-memory PatientCase + ActivePatient.

import type {
  ActivePatient,
  CaseRubric,
  PatientCase,
  RubricCriterion,
} from '../game/types.ts';
import { getRubricFor } from '../data/autoRubric.ts';
import {
  GUIDELINES,
  getGuideline,
  type Guideline,
  type GuidelineRecommendation,
} from '../data/guidelines.ts';
import { TESTS } from '../data/tests.ts';
import { TREATMENTS } from '../data/treatments.ts';

export interface DebriefRequest {
  case_id: string;
  case_summary: {
    chief_complaint: string;
    correct_diagnosis_id: string;
    diagnosis_options: string[];
    severity: string;
    age: number;
    gender: 'M' | 'F';
  };
  rubric: CaseRubric;
  /** Subset of GUIDELINES containing only entries cited by the rubric.
   *  The agent is instructed to use ONLY recIds from this slice, so the
   *  payload acts as both context and an allowlist. */
  registry_slice: Array<{
    id: string;
    body: string;
    year: number;
    region: string;
    title: string;
    url: string;
    recommendations: GuidelineRecommendation[];
    notes?: string;
  }>;
  encounter_log: {
    arrived_at_iso: string;
    ended_at_iso: string;
    elapsed_seconds: number;
    history_questions_asked: Array<{
      id: string;
      question: string;
      answer_shown_to_trainee: string;
      relevant_per_case: boolean;
    }>;
    tests_ordered: Array<{
      test_id: string;
      test_name: string;
      ordered_at_seconds_from_arrival: number | null;
      result_shown_to_trainee: string | null;
      abnormal: boolean | null;
    }>;
    treatments_given: Array<{
      treatment_id: string;
      treatment_name: string;
      was_critical: boolean;
    }>;
    prescriptions: Array<{
      medication_id: string;
      dose: string;
      duration: string;
    }>;
    submitted_diagnosis_id: string | null;
    diagnosis_was_correct: boolean | null;
    voice_transcript?: string[];
  };
}

export function buildDebriefRequest(
  c: PatientCase,
  patient: ActivePatient,
  endedAt: number = Date.now(),
): DebriefRequest {
  const rubric = getRubricFor(c);
  const registry_slice = collectRegistrySlice(rubric);

  const askedById = new Map(c.anamnesis.map((q) => [q.id, q]));
  const history_questions_asked = patient.askedQuestionIds
    .map((id) => askedById.get(id))
    .filter((q): q is NonNullable<typeof q> => Boolean(q))
    .map((q) => ({
      id: q.id,
      question: q.question,
      answer_shown_to_trainee: q.answer,
      relevant_per_case: q.relevant,
    }));

  const testById = new Map(TESTS.map((t) => [t.id, t]));
  const resultByTest = new Map(c.testResults.map((r) => [r.testId, r]));
  const tests_ordered = patient.orderedTestIds.map((tid) => {
    const t = testById.get(tid);
    const result = resultByTest.get(tid);
    const orderedAt = patient.testOrderedAt[tid];
    return {
      test_id: tid,
      test_name: t?.name ?? tid,
      ordered_at_seconds_from_arrival:
        typeof orderedAt === 'number'
          ? Math.round((orderedAt - patient.arrivedAt) / 1000)
          : null,
      result_shown_to_trainee: result?.result ?? null,
      abnormal: result?.abnormal ?? null,
    };
  });

  const treatmentById = new Map(TREATMENTS.map((t) => [t.id, t]));
  const criticalSet = new Set(c.criticalTreatmentIds);
  const treatments_given = patient.givenTreatmentIds.map((tid) => ({
    treatment_id: tid,
    treatment_name: treatmentById.get(tid)?.name ?? tid,
    was_critical: criticalSet.has(tid),
  }));

  const prescriptions = (patient.prescriptions ?? []).map((p) => ({
    medication_id: p.medicationId,
    dose: p.dose,
    duration: p.duration,
  }));

  return {
    case_id: c.id,
    case_summary: {
      chief_complaint: c.chiefComplaint,
      correct_diagnosis_id: c.correctDiagnosisId,
      diagnosis_options: c.diagnosisOptions,
      severity: c.severity,
      age: c.age,
      gender: c.gender,
    },
    rubric,
    registry_slice,
    encounter_log: {
      arrived_at_iso: new Date(patient.arrivedAt).toISOString(),
      ended_at_iso: new Date(endedAt).toISOString(),
      elapsed_seconds: Math.round((endedAt - patient.arrivedAt) / 1000),
      history_questions_asked,
      tests_ordered,
      treatments_given,
      prescriptions,
      submitted_diagnosis_id: patient.submittedDiagnosisId,
      diagnosis_was_correct:
        patient.submittedDiagnosisId === null
          ? null
          : patient.submittedDiagnosisId === c.correctDiagnosisId,
      voice_transcript: patient.voiceTranscript ?? [],
    },
  };
}

/** Encode the request as a single chat-message text block. The agent
 *  reads it from the user.message it receives — no separate channel
 *  exists in the Managed Agents API, so we prefix a stable header to
 *  make the trigger unambiguous in the system prompt's DEBRIEF MODE. */
export function debriefRequestToUserMessage(req: DebriefRequest): string {
  return [
    '[debrief request]',
    'The trainee has ended the encounter. Grade against the rubric and',
    'emit exactly one render_case_evaluation tool use. Use ONLY recIds',
    'from registry_slice.recommendations[].recId.',
    '',
    '```json',
    JSON.stringify(req, null, 2),
    '```',
  ].join('\n');
}

function collectRegistrySlice(rubric: CaseRubric): DebriefRequest['registry_slice'] {
  const wanted = new Map<string, Set<string>>();
  const allCriteria: RubricCriterion[] = [
    ...rubric.data_gathering,
    ...rubric.clinical_management,
    ...rubric.interpersonal,
  ];
  for (const cr of allCriteria) {
    if (!cr.guideline_ref) continue;
    const [gid, rid] = cr.guideline_ref.split(':');
    if (!gid || !rid) continue;
    if (!wanted.has(gid)) wanted.set(gid, new Set());
    wanted.get(gid)!.add(rid);
  }
  if (rubric.safety_netting?.guideline_ref) {
    const [gid, rid] = rubric.safety_netting.guideline_ref.split(':');
    if (gid && rid) {
      if (!wanted.has(gid)) wanted.set(gid, new Set());
      wanted.get(gid)!.add(rid);
    }
  }

  const out: DebriefRequest['registry_slice'] = [];
  for (const [gid, rids] of wanted) {
    const g: Guideline | null = getGuideline(gid);
    if (!g) continue;
    const recs = g.recommendations.filter((r) => rids.has(r.recId));
    if (recs.length === 0) continue;
    out.push({
      id: g.id,
      body: g.body,
      year: g.year,
      region: g.region,
      title: g.title,
      url: g.url,
      recommendations: recs,
      notes: g.notes,
    });
  }
  return out;
}

/** For dev tools / debug overlays. Lets the UI show "evaluating against
 *  N guidelines (M recs)" without re-walking the rubric. */
export function summariseRequest(req: DebriefRequest): {
  guideline_count: number;
  rec_count: number;
  criterion_count: number;
} {
  const rec_count = req.registry_slice.reduce((n, g) => n + g.recommendations.length, 0);
  const criterion_count =
    req.rubric.data_gathering.length +
    req.rubric.clinical_management.length +
    req.rubric.interpersonal.length;
  return {
    guideline_count: req.registry_slice.length,
    rec_count,
    criterion_count,
  };
}

// Used by the smoke test to sanity-check that GUIDELINES is loaded; not
// imported elsewhere in the runtime path.
export function totalGuidelinesAvailable(): number {
  return GUIDELINES.length;
}
