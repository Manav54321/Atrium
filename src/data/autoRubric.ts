// Fallback rubric derivation for cases that don't ship with an authored
// `rubric` field. The auto-rubric is intentionally minimal and citation-
// free: it gives the atrium-attending agent enough structure to grade
// communication and basic clinical-management coverage, but it cannot
// power the citation-card UX that hero cases get. When a non-hero case
// rolls up with this fallback, the debrief still scores three domains —
// it just won't quote specific society guidelines.

import type { PatientCase, CaseRubric, RubricCriterion } from '../game/types';

const GENERIC_INTERPERSONAL: RubricCriterion[] = [
  {
    criterion_id: 'ip-01',
    label: 'Open with introduction and agenda-setting',
    weight: 1,
    framework: 'SEGUE',
    evidence: 'Greets the patient, introduces self, confirms identity and negotiates the agenda for the visit.',
  },
  {
    criterion_id: 'ip-02',
    label: 'Explore ICE',
    weight: 2,
    framework: 'ICE',
    evidence: 'Elicits the patient\u2019s ideas, concerns and expectations \u2014 not just symptom checklists.',
  },
  {
    criterion_id: 'ip-03',
    label: 'Empathic response',
    weight: 2,
    framework: 'NURSE',
    evidence: 'Names and validates an emotion the patient expresses; avoids dismissing distress.',
  },
  {
    criterion_id: 'ip-04',
    label: 'Jargon-free explanation',
    weight: 1,
    framework: 'PLAB2',
    evidence: 'Explains the working diagnosis and plan in plain English without unexplained medical acronyms.',
  },
  {
    criterion_id: 'ip-05',
    label: 'Summarise and check understanding',
    weight: 1,
    framework: 'SEGUE',
    evidence: 'Summarises the plan at the end and invites the patient to repeat back or ask questions.',
  },
];

export function deriveAutoRubric(c: PatientCase): CaseRubric {
  const data_gathering: RubricCriterion[] = c.anamnesis
    .filter((q) => q.relevant)
    .slice(0, 8)
    .map((q, i) => ({
      criterion_id: `dg-${String(i + 1).padStart(2, '0')}`,
      label: q.question,
      weight: 1,
      framework: 'RCGP',
      evidence: `Asks the patient: "${q.question}" or a clinically equivalent question.`,
    }));

  const clinical_management: RubricCriterion[] = c.criticalTreatmentIds
    .slice(0, 6)
    .map((tid, i) => ({
      criterion_id: `cm-${String(i + 1).padStart(2, '0')}`,
      label: `Deliver critical action: ${tid}`,
      weight: 3,
      framework: 'PLAB2',
      // No guideline_ref \u2014 honest signal to the agent that this is
      // auto-derived. The agent's hard rule is: never fabricate a citation.
      evidence: `Records the treatment/action "${tid}" during the encounter.`,
    }));

  return {
    data_gathering,
    clinical_management,
    interpersonal: GENERIC_INTERPERSONAL,
    safety_netting: {
      required_elements: [
        'Tells the patient what symptoms should prompt urgent return',
        'Names a specific timeframe or trigger for follow-up',
      ],
      weight: 1,
    },
    global_rating: 'borderline-regression',
  };
}

export function getRubricFor(c: PatientCase): CaseRubric {
  return c.rubric ?? deriveAutoRubric(c);
}
