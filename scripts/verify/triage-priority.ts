/**
 * Verify that each ER PatientCase's severity label isn't blatantly wrong.
 * NOT a formal ESI implementation — ESI keys off chief complaint and resources
 * needed, not just vitals, so a STEMI can have near-normal vitals and still
 * be correctly 'critical'. We therefore only flag the asymmetric cases:
 *
 * - severity='stable' → flag if ANY vital is unstable (HR>130, SpO2<88, SBP<80).
 *   A stable-labelled patient with shock vitals is definitely an authoring bug.
 * - severity='critical' → we do NOT flag on "calm-looking" vitals; too many
 *   false positives (MI, stroke, DKA can present with modest derangement).
 *
 * Polyclinic cases are skipped — outpatient, no ER triage semantics.
 */

import { PATIENT_CASES } from '../../src/data/patients.ts';
import type { PatientCase } from '../../src/game/types.ts';

type Violation = { case: string; rule: string; detail: string };

function sbp(bp: string): number | null {
  const m = /^(\d+)\s*\/\s*\d+/.exec(bp.trim());
  return m ? Number(m[1]) : null;
}

function stableViolations(p: PatientCase): string[] {
  const v = p.vitals;
  const s = sbp(v.bp);
  const hit: string[] = [];
  if (v.hr > 130) hit.push(`HR ${v.hr}>130`);
  if (v.spo2 < 88) hit.push(`SpO2 ${v.spo2}<88`);
  if (s !== null && s < 80) hit.push(`SBP ${s}<80`);
  return hit;
}

export function verifyTriagePriority(): Violation[] {
  const violations: Violation[] = [];
  for (const p of PATIENT_CASES) {
    if (p.severity === 'stable') {
      const reasons = stableViolations(p);
      if (reasons.length > 0) {
        violations.push({
          case: p.id,
          rule: 'severity=stable but one or more vitals are unstable',
          detail: reasons.join(', '),
        });
      }
    }
  }
  return violations;
}
