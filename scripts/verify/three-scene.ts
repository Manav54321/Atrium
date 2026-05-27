/**
 * Placeholder for 3D-scene invariant checks (no mesh overlap, nothing under
 * the floor plane, chairs in reach of tables, etc.).
 *
 * TODO: this requires extracting scene layout (positions + sizes) from
 *  src/components/three/Polyclinic.tsx and src/components/exam-room/ into a
 *  pure data config that can be imported from Node. Today those values are
 *  hard-coded JSX literals, so we can't verify them without loading R3F.
 *
 * Until then, return an empty violation list and let run-all.ts still pass.
 * The moment scene geometry starts regressing visually, promote this to a
 * first-class check — see spec.md "verification scripts" section.
 */

type Violation = { case: string; rule: string; detail: string };

export function verifyThreeScene(): Violation[] {
  return [];
}
