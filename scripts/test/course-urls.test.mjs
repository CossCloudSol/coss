// Run with: npm test
// One URL per course: no internal link, canonical or sitemap entry is a URL that 308s, a retired
// alias row is not listed next to the page it redirects to, and a flat page that redirects does not
// loop back through its own canonical (Ethical Hacking, found 11 Oct 2026).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { finalHref, settlePath, finalPath } from '../../src/lib/redirect-resolve.ts';
import { canonicalCourseHref, onePerPage } from '../../src/lib/flat-url.ts';
import { SLUG_MAP } from '../../src/lib/slug-map.ts';
import { POPULAR_COURSES } from '../../src/lib/popular-courses.ts';
import { REDIRECTS } from '../../redirects.config.mjs';

const fixture = JSON.parse(fs.readFileSync(new URL('./fixtures/course-index.json', import.meta.url), 'utf8'));
const canon = (p) => canonicalCourseHref(p, SLUG_MAP);
const isSource = (p) => REDIRECTS.some((r) => !r.has && r.source.replace(/\/$/, '') === p.replace(/\/$/, ''));
const rows = fixture.courses.map((c) => ({ item: { slug: c.slug, url: finalHref(c.url, REDIRECTS) }, settled: settlePath(c.url, REDIRECTS, canon) }));
const listed = onePerPage(rows, SLUG_MAP);
const listedSlugs = new Set(listed.map((l) => l.slug));

test('settlePath: a duplicate row settles on the page of the course it redirects to', () => {
  // linux-shell-scripting-training-hyderabad -> nested linux-...-in-hyderabad -> its flat canonical page
  const settled = settlePath('/courses/software-testing-os/linux-shell-scripting-training-hyderabad', REDIRECTS, canon);
  assert.equal(settled, '/linux-administration-training-institute-in-hyderabad');
});

test('Ethical Hacking: flat page -> /courses form settles there and does not loop', () => {
  assert.ok(isSource('/ethical-hacking-training-institute-in-hyderabad'), 'fixture: the flat page redirects');
  const settled = settlePath('/ethical-hacking-training-institute-in-hyderabad', REDIRECTS, canon);
  assert.equal(settled, '/courses/ethical-hacking-training-institute-in-hyderabad');
  assert.ok(!isSource(settled), 'the settled page is not a redirect source');
  assert.notEqual(finalPath(settled, REDIRECTS), null);
});

test('one row per page: no listed course URL redirects, no page is listed twice', () => {
  assert.ok(listed.length > 50 && listed.length < fixture.courses.length, `listed ${listed.length} of ${fixture.courses.length}`);
  const pages = new Set();
  for (const l of listed) {
    assert.ok(!isSource(l.url), `${l.slug}: ${l.url} is a redirect source`);
    const settled = settlePath(l.url, REDIRECTS, canon);
    assert.ok(!pages.has(settled), `${settled} listed twice`);
    pages.add(settled);
  }
});

test('aliases are dropped, the pages they point to are kept (known groups, 11 Oct 2026)', () => {
  const expected = [
    ['linux-shell-scripting-training-in-hyderabad', 'linux-shell-scripting-training-hyderabad'],
    ['digital-marketing-training-in-hyderabad', 'digital-marketing-training-institute-in-hyderabad'],
    ['artificial-intelligence-ai-training-hyderabad', 'artificial-intelligence-training-institute-in-hyderabad'],
    ['full-stack-java-developer-training-in-hyderabad', 'full-stack-java-training-in-hyderabad'],
    ['full-stack-java-developer-training-in-hyderabad', 'full-stack-java-developer-bootcamp'],
    ['aws-cloud-practitioner-certification', 'aws-cloud-practitioner-training-in-hyderabad'],
    ['hr-recruitment-training-in-hyderabad', 'hr-recruitment'],
    ['interview-prep-resume-building-hyderabad', 'interview-prep-resume-building-training-in-hyderabad'],
    ['ethical-hacking-training-institute-in-hyderabad', 'ethical-hacking-ceh-training-hyderabad'],
  ];
  for (const [kept, alias] of expected) {
    assert.ok(listedSlugs.has(kept), `${kept} is listed`);
    assert.ok(!listedSlugs.has(alias), `${alias} is not listed`);
  }
});

test('every Popular course is still listed', () => {
  for (const e of POPULAR_COURSES) if (e.kind === 'course') assert.ok(listedSlugs.has(e.slug), `${e.slug} must stay in the catalogue`);
});

test('the canonical resolver, search index and sitemap run URLs through the redirect rules', () => {
  const read = (p) => fs.readFileSync(new URL(p, import.meta.url), 'utf8');
  assert.match(read('../../src/lib/course-canonical.ts'), /finalHref\(canonicalCoursePath\(/);
  assert.match(read('../../src/lib/course-search-index.ts'), /onePerPage\(/);
  assert.match(read('../../src/app/sitemap.ts'), /toFinalSitemap\(canonicalise\(toFinalSitemap\(all, BASE_URL, REDIRECTS\)\), BASE_URL, REDIRECTS\)/);
});
