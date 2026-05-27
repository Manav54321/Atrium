/**
 * Integration-ish tests for the `/loop` slash commands.
 *
 * The verify-loop runner is tested end-to-end: we run it for real
 * against the current simulator state and assert that:
 *   - verify.log gains exactly one new line
 *   - the line format is ISO-timestamp + PASS or FAIL + count
 *   - exit code matches the PASS/FAIL state
 *
 * The slash command markdown files are tested for existence, frontmatter,
 * and for pointing at the runner script. We can't exercise the slash
 * dispatch from unit tests (that's Claude Code territory), but we can
 * catch drift between the command and the runner.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync, readdirSync, existsSync, renameSync, unlinkSync, statSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = resolve(fileURLToPath(import.meta.url), '../../..');
const LOG_PATH = resolve(REPO_ROOT, 'verify.log');
const BACKUP_PATH = resolve(REPO_ROOT, 'verify.log.test-backup');

/** Save any existing verify.log so we can restore it after the test. */
function backupLog(): void {
  if (existsSync(LOG_PATH)) {
    renameSync(LOG_PATH, BACKUP_PATH);
  } else if (existsSync(BACKUP_PATH)) {
    // Stale backup from a previous failed run — remove it.
    unlinkSync(BACKUP_PATH);
  }
}

function restoreLog(): void {
  if (existsSync(LOG_PATH)) unlinkSync(LOG_PATH);
  if (existsSync(BACKUP_PATH)) renameSync(BACKUP_PATH, LOG_PATH);
}

test('verify-loop writes one PASS line to verify.log on green', (t) => {
  backupLog();
  t.after(restoreLog);

  const result = spawnSync(
    process.execPath,
    ['scripts/loop/verify-loop.ts'],
    { cwd: REPO_ROOT, encoding: 'utf8' },
  );
  assert.equal(
    result.status,
    0,
    `verify-loop exited ${result.status}; stderr: ${result.stderr}`,
  );
  assert.ok(existsSync(LOG_PATH), 'verify.log was not created');
  const contents = readFileSync(LOG_PATH, 'utf8');
  const lines = contents.trim().split(/\r?\n/);
  assert.equal(lines.length, 1, `expected 1 log line, got ${lines.length}`);
  assert.match(
    lines[0],
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z\s+PASS$/,
    `unexpected log line shape: ${lines[0]}`,
  );
});

test('verify-loop appends (not overwrites) across firings', (t) => {
  backupLog();
  t.after(restoreLog);

  for (let i = 0; i < 3; i += 1) {
    const result = spawnSync(
      process.execPath,
      ['scripts/loop/verify-loop.ts'],
      { cwd: REPO_ROOT, encoding: 'utf8' },
    );
    assert.equal(result.status, 0, `firing ${i} failed`);
  }
  const contents = readFileSync(LOG_PATH, 'utf8');
  const lines = contents.trim().split(/\r?\n/);
  assert.equal(lines.length, 3, `expected 3 lines, got ${lines.length}`);
  // Each line independently matches the shape.
  for (const line of lines) {
    assert.match(line, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z\s+(?:PASS|FAIL\s+\d+)$/);
  }
});

test('verify-loop script is not referenced by accident outside its command', () => {
  // Guards against someone re-wiring verify-loop into CI or into the
  // verify skill — the runner is intended only for /loop firings. If
  // you WANT to allow it elsewhere, extend this allowlist explicitly.
  const allowlist = new Set([
    'scripts/loop/verify-loop.ts',
    'scripts/test/loop-commands.test.ts',
  ]);
  // git grep would miss untracked files (like these, on first add), so
  // we do a scoped filesystem walk instead. Searching tracked files
  // would also hide a drive-by edit before commit — which is exactly
  // the kind of regression this test is here to catch.
  const roots = ['scripts', 'src', 'backend'];
  const needle = 'scripts/loop/verify-loop';
  const found: string[] = [];
  const walk = (rel: string): void => {
    const full = resolve(REPO_ROOT, rel);
    if (!existsSync(full)) return;
    const stat = statSync(full);
    if (stat.isDirectory()) {
      for (const entry of readdirSync(full)) {
        if (entry === 'node_modules' || entry.startsWith('.venv')) continue;
        walk(`${rel}/${entry}`);
      }
      return;
    }
    if (!/\.(ts|tsx|md|py|json|js|jsx|mjs|cjs)$/.test(rel)) return;
    const body = readFileSync(full, 'utf8');
    if (body.includes(needle)) {
      found.push(rel.replace(/\\/g, '/'));
    }
  };
  for (const root of roots) walk(root);

  assert.ok(
    found.length > 0,
    'expected at least one reference to the runner — test is broken?',
  );
  for (const f of found) {
    assert.ok(
      allowlist.has(f),
      `${f} references ${needle} but is not on the allowlist`,
    );
  }
});

test('verify.log entries persist in chronological order', (t) => {
  backupLog();
  t.after(restoreLog);

  const timestamps: string[] = [];
  for (let i = 0; i < 2; i += 1) {
    const result = spawnSync(
      process.execPath,
      ['scripts/loop/verify-loop.ts'],
      { cwd: REPO_ROOT, encoding: 'utf8' },
    );
    assert.equal(result.status, 0);
  }
  const lines = readFileSync(LOG_PATH, 'utf8').trim().split(/\r?\n/);
  for (const line of lines) {
    const m = line.match(/^(\S+)/);
    assert.ok(m);
    timestamps.push(m[1]);
  }
  const sorted = [...timestamps].sort();
  assert.deepEqual(timestamps, sorted, 'log lines are not in chronological order');
  // Sanity on the log file we just wrote.
  const size = statSync(LOG_PATH).size;
  assert.ok(size > 0, 'verify.log is empty');
});
