/**
 * Tests for the custom-tool permission policy and schema parity between
 * the browser-side Zod registry (`src/agents/customTools.ts`) and the
 * backend JSON list (`backend/server.py`).
 *
 * Runs under Node 22+'s built-in test runner with native TypeScript
 * support — zero extra deps. Invoke via `npm test` (or directly with
 * `node --test scripts/test/custom-tools.test.ts`).
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  CUSTOM_TOOL_NAMES,
  CUSTOM_TOOL_PERMISSIONS,
  customToolSchemas,
  flagCriticalFindingInput,
  getToolPermission,
  parseCustomToolUse,
  type CustomToolName,
} from '../../src/agents/customTools.ts';

const REPO_ROOT = resolve(fileURLToPath(import.meta.url), '../../..');
const BACKEND_SERVER = resolve(REPO_ROOT, 'backend/server.py');

test('every custom tool has a permission entry', () => {
  for (const name of CUSTOM_TOOL_NAMES) {
    const perm = CUSTOM_TOOL_PERMISSIONS[name];
    assert.ok(
      perm === 'auto' || perm === 'confirm',
      `missing or invalid permission for ${name}: ${perm}`,
    );
  }
});

test('every custom tool has a schema', () => {
  for (const name of CUSTOM_TOOL_NAMES) {
    assert.ok(
      customToolSchemas[name as CustomToolName],
      `missing Zod schema for ${name}`,
    );
  }
});

test('render_* tools are auto-allowed', () => {
  for (const name of CUSTOM_TOOL_NAMES) {
    if (name.startsWith('render_')) {
      assert.equal(
        getToolPermission(name),
        'auto',
        `${name} should be auto-allowed`,
      );
    }
  }
});

test('flag_critical_finding requires confirmation', () => {
  assert.equal(getToolPermission('flag_critical_finding'), 'confirm');
});

test('flag_critical_finding input schema accepts a well-formed call', () => {
  const result = flagCriticalFindingInput.safeParse({
    patient_id: 'poly-003',
    severity: 'critical',
    reason: 'systolic BP 70, altered mental status',
  });
  assert.ok(result.success, 'well-formed input should parse');
});

test('flag_critical_finding rejects unknown severity', () => {
  const result = flagCriticalFindingInput.safeParse({
    patient_id: 'poly-003',
    severity: 'maybe-bad',
    reason: 'unclear',
  });
  assert.ok(!result.success);
});

test('flag_critical_finding rejects empty reason', () => {
  const result = flagCriticalFindingInput.safeParse({
    patient_id: 'poly-003',
    severity: 'urgent',
    reason: '',
  });
  assert.ok(!result.success);
});

test('parseCustomToolUse rejects unknown tool name', () => {
  const result = parseCustomToolUse('not_a_tool', {});
  assert.ok(!result.ok);
  if (!result.ok) assert.match(result.error, /unknown tool/);
});

test('parseCustomToolUse surfaces per-field errors', () => {
  const result = parseCustomToolUse('flag_critical_finding', {
    patient_id: '',
    severity: 'critical',
    reason: 'x',
  });
  assert.ok(!result.ok);
  if (!result.ok) assert.match(result.error, /patient_id/);
});

test('backend/server.py exposes every name from CUSTOM_TOOL_NAMES', () => {
  const py = readFileSync(BACKEND_SERVER, 'utf8');
  for (const name of CUSTOM_TOOL_NAMES) {
    const re = new RegExp(`"name":\\s*"${name}"`);
    assert.match(
      py,
      re,
      `backend/server.py is missing a "name": "${name}" entry in ATRIUM_CUSTOM_TOOLS`,
    );
  }
});

test('backend/server.py does not advertise tools missing from the frontend registry', () => {
  const py = readFileSync(BACKEND_SERVER, 'utf8');
  // Extract every "name": "..." inside ATRIUM_CUSTOM_TOOLS. We scope to the
  // list body so we don't pick up unrelated "name": "..." pairs (e.g.
  // AGENT_NAME / ENV_NAME at the top).
  const listStart = py.indexOf('ATRIUM_CUSTOM_TOOLS: list[dict] = [');
  assert.ok(listStart >= 0, 'ATRIUM_CUSTOM_TOOLS list not found in server.py');
  // Tolerate CRLF (Windows checkout) as well as LF.
  const terminator = py.slice(listStart).match(/\r?\n\]\r?\n/);
  assert.ok(
    terminator && terminator.index !== undefined,
    'ATRIUM_CUSTOM_TOOLS list terminator not found',
  );
  const listEnd = listStart + terminator.index;
  const body = py.slice(listStart, listEnd);
  const matches = Array.from(body.matchAll(/"name":\s*"([a-z_]+)"/g));
  const backendNames = new Set(matches.map((m) => m[1]));
  const frontendNames = new Set<string>(CUSTOM_TOOL_NAMES);
  for (const name of backendNames) {
    assert.ok(
      frontendNames.has(name),
      `backend advertises tool "${name}" that the frontend registry doesn't know about`,
    );
  }
  // Also: every frontend name must appear — defense in depth vs the
  // previous test.
  for (const name of frontendNames) {
    assert.ok(
      backendNames.has(name),
      `frontend knows about "${name}" but backend doesn't advertise it`,
    );
  }
});

test('system prompt mentions the confirm-gated tool', () => {
  const py = readFileSync(BACKEND_SERVER, 'utf8');
  assert.match(
    py,
    /flag_critical_finding/,
    'system prompt should mention flag_critical_finding so the agent knows to use it',
  );
  assert.match(
    py,
    /confirm-gated|explicit human confirmation|approve\/decline/,
    'system prompt should explain the confirm-gate semantics',
  );
});
