// Run with: npm test. Item 16: local scripts default to the dev database; production only on
// purpose; the dev seed never runs against anything but the local dev DB.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';

// Loading the helpers runs their checks on this process: give it a local DB first.
process.env.DATABASE_URL = 'postgresql://u:p@localhost:5432/coss_dev';
const require = createRequire(import.meta.url);
const { parseEnv, loadDevEnv } = require('../lib/dev-env.cjs');
const { devOnlyVerdict } = require('../lib/dev-only.cjs');

test('parseEnv: quotes, comments, export, = in values', () => {
  const e = parseEnv('# c\nA=1\nexport B="two words"\nC=\'x=y\'\nD=plain # note\n\nbad line\n');
  assert.deepEqual(e, { A: '1', B: 'two words', C: 'x=y', D: 'plain' });
});

test('loadDevEnv: loads the dev file without overriding, honours COSS_DB=prod and a preset DATABASE_URL', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'devenv-'));
  fs.writeFileSync(path.join(dir, '.env.development.local'), 'DATABASE_URL=postgresql://u:p@localhost/dev\nDIRECT_URL=postgresql://u:p@localhost/dev\nKEEP=dev\n');
  const env1 = { KEEP: 'mine' };
  assert.equal(loadDevEnv(env1, dir), 'dev');
  assert.equal(env1.DATABASE_URL, 'postgresql://u:p@localhost/dev');
  assert.equal(env1.KEEP, 'mine', 'never overrides a value already set');
  assert.equal(env1.COSS_DB, 'dev');
  const env2 = { COSS_DB: 'prod' };
  assert.equal(loadDevEnv(env2, dir), 'prod');
  assert.equal(env2.DATABASE_URL, undefined);
  assert.equal(loadDevEnv({ DATABASE_URL: 'postgresql://u:p@localhost/x' }, dir), 'preset');
  assert.equal(loadDevEnv({}, fs.mkdtempSync(path.join(os.tmpdir(), 'nodev-'))), 'missing');
});

test('dev seed: only the local dev DB, never production even with the opt-ins', () => {
  const local = 'postgresql://u:p@localhost:5432/dev', prod = 'postgresql://u:p@db.x.supabase.co:5432/postgres';
  assert.equal(devOnlyVerdict({ DATABASE_URL: local, DIRECT_URL: local }), 'dev');
  assert.match(devOnlyVerdict({ DATABASE_URL: local, DIRECT_URL: prod }), /^refused/);
  assert.match(devOnlyVerdict({ DATABASE_URL: prod, ALLOW_PROD_WRITE: '1' }), /^refused/);
  assert.match(devOnlyVerdict({ DATABASE_URL: local, COSS_DB: 'prod' }), /^refused/);
  assert.match(devOnlyVerdict({}), /^refused/);
});

test('every script that uses Prisma loads dev-env or the write-guard first', () => {
  // tracked files only (untracked local scratch scripts are not part of the repo)
  const files = execFileSync('git', ['ls-files', 'scripts', 'src/scripts'], { encoding: 'utf8' })
    .split('\n').filter((f) => /\.(m?js|cjs|ts)$/.test(f) && !/^scripts\/(test|lib)\//.test(f));
  const missing = files.filter((f) => {
    const s = fs.readFileSync(f, 'utf8');
    if (!/@prisma\/client|from '@\/lib\/db'|lib\/db'/.test(s)) return false;
    return !/lib\/(dev-env|write-guard)\.cjs/.test(s);
  });
  assert.deepEqual(missing, []);
});

test('npm scripts: build unchanged; build:local and seed:dev exist; sync script needs COSS_DB=prod', () => {
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  assert.equal(pkg.scripts.build, 'prisma generate && next build');
  assert.equal(pkg.scripts['build:local'], 'node scripts/build-local.mjs');
  assert.equal(pkg.scripts['seed:dev'], 'node scripts/seed-dev.mjs');
  assert.match(fs.readFileSync('scripts/run-sync-redirects.mjs', 'utf8'), /process\.env\.COSS_DB !== 'prod'/);
  assert.match(fs.readFileSync('scripts/seed-dev.mjs', 'utf8'), /assertDevOnly/);
});
