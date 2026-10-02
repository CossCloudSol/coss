// Run with: npm test   (Node's built-in runner; Node 24 imports .ts directly)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolveDbThenFile } from '../../src/lib/resolve-content.ts';

const dbDown = () => Promise.reject(new Error("Can't reach database server"));

test('a DB row wins and the file is not read', async () => {
  let fileRead = false;
  const r = await resolveDbThenFile(async () => ({ slug: 'a' }), async () => { fileRead = true; return { slug: 'file' }; });
  assert.deepEqual(r, { source: 'db', value: { slug: 'a' } });
  assert.equal(fileRead, false);
});

test('no DB row falls back to the file', async () => {
  const r = await resolveDbThenFile(async () => null, async () => ({ slug: 'file' }));
  assert.deepEqual(r, { source: 'file', value: { slug: 'file' } });
});

test('null only when the post truly does not exist (DB null and no file)', async () => {
  assert.equal(await resolveDbThenFile(async () => null, async () => null), null);
  assert.equal(await resolveDbThenFile(async () => null), null);
});

test('a DB error throws (never null, so the page never calls notFound)', async () => {
  let fileRead = false;
  await assert.rejects(
    resolveDbThenFile(dbDown, async () => { fileRead = true; return { slug: 'file' }; }),
    /reach database/,
  );
  await assert.rejects(resolveDbThenFile(dbDown), /reach database/);
  assert.equal(fileRead, false, 'a DB outage must not quietly serve an older MDX copy either');
});

// The page code must not swallow DB errors before the helper sees them.
test('blog and landing course lookups have no error-swallowing catch', () => {
  const blog = readFileSync(new URL('../../src/app/blog/[slug]/page.tsx', import.meta.url), 'utf8');
  assert.match(blog, /resolveDbThenFile\(\(\) => getPublishedDbPost/);
  assert.doesNotMatch(blog, /DB error — fall through/);

  const landing = readFileSync(new URL('../../src/lib/get-landing-page-data.ts', import.meta.url), 'utf8');
  const fn = landing.slice(landing.indexOf('export async function getLandingPageCourse'));
  assert.doesNotMatch(fn.slice(0, fn.indexOf('\n}\n')), /\bcatch\s*[({]/);
});
