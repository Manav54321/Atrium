/**
 * One-shot runner for every verification script. Exits with code 1 if any
 * check returns violations. Used by the atrium-verify-simulation skill and
 * (eventually) by the /loop routine.
 */

import { verifyDataIntegrity } from './data-integrity.ts';
import { verifyTriagePriority } from './triage-priority.ts';
import { verifyThreeScene } from './three-scene.ts';
import { verifyRubricCitations } from './rubric-smoke.ts';

type Violation = { case: string; rule: string; detail: string };

const checks: Array<{ name: string; run: () => Violation[] }> = [
  { name: 'data-integrity', run: verifyDataIntegrity },
  { name: 'triage-priority', run: verifyTriagePriority },
  { name: 'three-scene', run: verifyThreeScene },
  { name: 'rubric-citations', run: verifyRubricCitations },
];

let totalViolations = 0;
for (const c of checks) {
  const violations = c.run();
  totalViolations += violations.length;
  if (violations.length === 0) {
    console.log(`PASS  ${c.name}`);
    continue;
  }
  console.log(`FAIL  ${c.name}  (${violations.length})`);
  for (const v of violations) {
    console.log(`      [${v.case}] ${v.rule}: ${v.detail}`);
  }
}

if (totalViolations > 0) {
  console.log(`\n${totalViolations} violation(s) across ${checks.length} check(s).`);
  process.exit(1);
}
console.log(`\nAll ${checks.length} checks passed.`);
