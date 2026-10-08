// Run with: npm test. /jobs and /batches are server-rendered (item 11); one <main> per page.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    return e.isDirectory() ? walk(p) : /\.(tsx|jsx)$/.test(e.name) ? [p] : [];
  });
}

test('/jobs and /batches render on the server with ISR, data from the shared queries', () => {
  for (const [page, query] of [['src/app/jobs/page.tsx', 'findActiveJobs'], ['src/app/batches/page.tsx', 'findBatches']]) {
    const s = fs.readFileSync(page, 'utf8');
    assert.doesNotMatch(s, /^['"]use client['"]/m, `${page} is a client component`);
    assert.match(s, /export const revalidate = \d+/, `${page}: no ISR`);
    assert.match(s, new RegExp(`await ${query}\\(`), `${page}: not using ${query}`);
    assert.match(s, /export async function generateMetadata/, `${page}: no metadata`);
    assert.doesNotMatch(s, /fetch\(['"]\/api\//, `${page}: still fetching the API in the browser`);
  }
});

test('one <main> per page: only the root layout renders it', () => {
  const offenders = walk('src/app')
    .filter((f) => !f.replace(/\\/g, '/').startsWith('src/app/admin/') && !f.replace(/\\/g, '/').endsWith('src/app/layout.tsx'))
    .filter((f) => /<main[\s>]/.test(fs.readFileSync(f, 'utf8')));
  assert.deepEqual(offenders, []);
});

test('the sitemap lists /jobs, /batches and every active job page', () => {
  const s = fs.readFileSync('src/app/sitemap.ts', 'utf8');
  assert.match(s, /\['jobs', 'batches'\]/);
  assert.match(s, /findActiveJobs/);
  assert.match(s, /\.\.\.listingEntries,\s*\.\.\.jobEntries,/);
});
