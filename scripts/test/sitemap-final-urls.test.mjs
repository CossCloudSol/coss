// Run with: npm test. The sitemap lists final URLs only, never one that redirects (item 10).
// redirects.config.mjs is the list next.config.mjs serves; src/lib/redirect-resolve.ts applies
// it the way Next.js does (first match wins, then follow the chain).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { REDIRECTS } from '../../redirects.config.mjs';
import { finalPath, toFinalSitemap } from '../../src/lib/redirect-resolve.ts';

const BASE = 'https://www.cosscloudsol.com';
const exactSources = REDIRECTS.filter((r) => !r.has && !r.source.includes(':')).map((r) => r.source);

test('next.config.mjs serves exactly this list', async () => {
  const { default: config } = await import('../../next.config.mjs');
  assert.equal(await config.redirects(), REDIRECTS);
});

test('the 9 sitemap URLs that used to 308 resolve to the pages they land on', () => {
  const cases = {
    '/ethical-hacking-training-institute-in-hyderabad': '/courses/ethical-hacking-training-institute-in-hyderabad',
    '/courses/data-analytics-training-institute-in-hyderabad': '/data-analytics-training-institute-in-hyderabad',
    '/courses/full-stack-java-developer-bootcamp': '/courses/programming-full-stack/full-stack-java-developer-training-in-hyderabad',
    '/courses/hr-recruitment': '/courses/human-resource/hr-recruitment-training-in-hyderabad',
    '/courses/software-testing-os/linux-shell-scripting-training-hyderabad': '/courses/software-testing-os/linux-shell-scripting-training-in-hyderabad',
    '/courses/cyber-security/ethical-hacking-ceh-training-hyderabad': '/courses/ethical-hacking-training-institute-in-hyderabad',
    '/courses/full-stack-java-training-in-hyderabad': '/courses/programming-full-stack/full-stack-java-developer-training-in-hyderabad',
    '/courses/professional-soft-skills/interview-prep-resume-building-training-in-hyderabad': '/courses/professional-soft-skills/interview-prep-resume-building-hyderabad',
    '/courses/digital-design/digital-marketing-training-institute-in-hyderabad': '/courses/digital-design/digital-marketing-training-in-hyderabad',
    '/blog/77674-2': '/blog/master-aws-devops-in-hyderabad',
  };
  for (const [from, to] of Object.entries(cases)) assert.equal(finalPath(from, REDIRECTS), to, from);
});

test('wildcards, unmatched paths, the host-only rule', () => {
  assert.equal(finalPath('/category/aws/page/2', REDIRECTS), '/courses');
  assert.equal(finalPath('/blog/feed', REDIRECTS), '/blog');
  assert.equal(finalPath('/courses', REDIRECTS), '/courses');
  assert.equal(finalPath('/', REDIRECTS), '/', 'the bare-domain rule only applies to cosscloudsol.com, never to our own URLs');
});

test('every exact rule ends on a page that does not redirect again (no loops, no chains left)', () => {
  for (const source of exactSources) {
    const final = finalPath(source, REDIRECTS);
    assert.notEqual(final, null, source);
    assert.equal(finalPath(final, REDIRECTS), final, `${source} → ${final}`);
  }
});

test('toFinalSitemap: never outputs a redirecting URL; replaces, de-duplicates, keeps the rest', () => {
  const entries = [
    { url: `${BASE}/courses`, priority: 1 },
    { url: `${BASE}/courses/human-resource/hr-recruitment-training-in-hyderabad`, priority: 0.8 },
    ...exactSources.map((s) => ({ url: `${BASE}${s}`, priority: 0.5 })),
  ];
  const out = toFinalSitemap(entries, BASE, REDIRECTS);
  for (const e of out) {
    const p = e.url.slice(BASE.length) || '/';
    assert.equal(finalPath(p, REDIRECTS), p, `${e.url} redirects`);
  }
  assert.equal(new Set(out.map((e) => e.url)).size, out.length, 'no duplicates');
  // The page already listed keeps its own entry (and priority) instead of the redirected copy.
  assert.equal(out.find((e) => e.url.endsWith('/hr-recruitment-training-in-hyderabad')).priority, 0.8);
  assert.equal(out[0].url, `${BASE}/courses`);
});

test('the sitemap applies it, and both sync scripts write this file with the same header', () => {
  const sitemap = fs.readFileSync('src/app/sitemap.ts', 'utf8');
  assert.match(sitemap, /return toFinalSitemap\(\[/);
  assert.match(sitemap, /from '\.\.\/\.\.\/redirects\.config\.mjs'/);
  const file = fs.readFileSync('redirects.config.mjs', 'utf8');
  for (const script of ['src/lib/sync-redirects.ts', 'scripts/run-sync-redirects.mjs']) {
    const s = fs.readFileSync(script, 'utf8');
    const header = s.match(/const REDIRECTS_FILE_HEADER = `([\s\S]*?)`/)[1];
    assert.ok(file.startsWith(header), `${script}: header differs from redirects.config.mjs`);
    assert.match(s, /'redirects\.config\.mjs'/);
    assert.match(s, /statusCode === 301 \|\| statusCode === 308/, `${script}: 308 rows must stay permanent`);
  }
});
