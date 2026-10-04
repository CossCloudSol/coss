// Run with: npm test. Database write guard for scripts (scripts/lib/write-guard.cjs).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

// Loading the guard runs its check: point it at a local URL first so it allows this process.
process.env.DATABASE_URL = 'postgresql://u:p@localhost:5432/coss_dev';
const { isLocalDevDatabase, checkWriteAllowed } = createRequire(import.meta.url)('../lib/write-guard.cjs');

test('only a local host counts as the dev database', () => {
  for (const u of ['postgresql://u:p@localhost:5432/db', 'postgresql://u:p@127.0.0.1/db', 'postgresql://u:p@[::1]:5432/db']) assert.equal(isLocalDevDatabase(u), true, u);
  for (const u of ['postgresql://u:p@aws-0-ap-south-1.pooler.supabase.com:6543/postgres', 'postgresql://u:p@db.example.supabase.co:5432/postgres', '', 'not a url']) assert.equal(isLocalDevDatabase(u), false, u);
});

test('writes: dev DB yes; anything else only with ALLOW_PROD_WRITE=1', () => {
  assert.equal(checkWriteAllowed({ DATABASE_URL: 'postgresql://u:p@localhost/db' }), 'dev');
  assert.equal(checkWriteAllowed({ DIRECT_URL: 'postgresql://u:p@db.x.supabase.co/postgres', DATABASE_URL: 'postgresql://u:p@localhost/db' }), 'refused');
  assert.equal(checkWriteAllowed({ DATABASE_URL: 'postgresql://u:p@db.x.supabase.co/postgres' }), 'refused');
  assert.equal(checkWriteAllowed({}), 'refused');
  assert.equal(checkWriteAllowed({ DATABASE_URL: 'postgresql://u:p@db.x.supabase.co/postgres', ALLOW_PROD_WRITE: '1' }), 'allowed');
  assert.equal(checkWriteAllowed({ DATABASE_URL: 'postgresql://u:p@db.x.supabase.co/postgres', ALLOW_PROD_WRITE: 'true' }), 'refused');
});
