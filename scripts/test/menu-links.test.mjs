// Run with: npm test
// Explore Courses menu: links point at the final URL (no 308 hop) and batch times
// read the same everywhere.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { finalHref, finalPath } from '../../src/lib/redirect-resolve.ts';
import { formatBatchTime } from '../../src/lib/batch-time.ts';
import { POPULAR_COURSES } from '../../src/lib/popular-courses.ts';
import { CATEGORY_MENU_STYLE } from '../../src/lib/menu-icons.ts';
import { REDIRECTS } from '../../redirects.config.mjs';

const fixture = JSON.parse(fs.readFileSync(new URL('./fixtures/menu-index.json', import.meta.url), 'utf8'));
const sources = new Set(REDIRECTS.filter((r) => !r.has).map((r) => r.source.replace(/\/$/, '')));
const isSource = (p) => sources.has(p.replace(/\/$/, '') || '/');

test('finalHref follows the redirect rules to the page a visitor lands on', () => {
  // A catalogue URL that 308s today (observed on production, 11 Oct 2026).
  const raw = '/courses/data-analytics-training-institute-in-hyderabad';
  assert.ok(isSource(raw), 'fixture: this URL is a redirect source');
  assert.equal(finalHref(raw, REDIRECTS), '/data-analytics-training-institute-in-hyderabad');
  // A URL that is not a source stays as it is.
  assert.equal(finalHref('/courses', REDIRECTS), '/courses');
  // Unresolvable chains fall back to the original path.
  assert.equal(finalHref('/x', [{ source: '/x', destination: '/y' }, { source: '/y', destination: '/x' }]), '/x');
});

test('no popular or category link in the menu config is a redirect source (after resolving)', () => {
  const bySlug = new Map(fixture.courses.map((c) => [c.slug, c.url]));
  const hrefs = [];
  for (const e of POPULAR_COURSES) {
    if (e.kind === 'category') hrefs.push(`/courses/${e.slug}`);
    else {
      assert.ok(bySlug.has(e.slug), `${e.slug} is in the fixture (update scripts/test/fixtures/menu-index.json if the list changed)`);
      hrefs.push(bySlug.get(e.slug));
    }
  }
  for (const slug of [...Object.keys(CATEGORY_MENU_STYLE), ...fixture.categories]) hrefs.push(`/courses/${slug}`);
  // Static links in the menu and header.
  hrefs.push('/courses', '/batches', '/free-demo-class', '/corporate-training', '/student-reviews', '/faculty', '/placements');

  for (const href of hrefs) {
    const final = finalHref(href, REDIRECTS);
    assert.notEqual(finalPath(href, REDIRECTS), null, `${href} resolves`);
    assert.ok(!isSource(final), `${href} -> ${final} is itself a redirect source`);
  }
});

test('the menu data and "Starting soon" run every href through finalHref', () => {
  const read = (p) => fs.readFileSync(new URL(p, import.meta.url), 'utf8');
  const data = read('../../src/lib/menu-data.ts');
  assert.match(data, /finalHref\(path, REDIRECTS\)/);
  for (const needle of ['popular = resolvePopular(index).items.map((p) => ({ ...p, href: final(p.href) }))', 'href: final(`/courses/${c.slug}`)', 'href: final(x.url)']) {
    assert.ok(data.includes(needle), `menu-data.ts: ${needle}`);
  }
  assert.match(read('../../src/lib/starting-soon.ts'), /href: finalHref\(courseCanonicalPath\(b\.course\), REDIRECTS\)/);
});

test('batch times read "10–11 AM", whatever the admin typed', () => {
  assert.equal(formatBatchTime('10AM TO 11AM'), '10–11 AM');
  assert.equal(formatBatchTime('Mon To Fri 10AM TO 12PM'), '10 AM–12 PM');
  assert.equal(formatBatchTime('Mon-Fri 10:00 AM - 11:30 AM'), '10–11:30 AM');
  assert.equal(formatBatchTime('9:30 am to 11 am'), '9:30–11 AM');
  assert.equal(formatBatchTime('Weekdays 7PM-8:30PM'), '7–8:30 PM');
  assert.equal(formatBatchTime('Sat 10 AM'), '10 AM');
  assert.equal(formatBatchTime('Weekends'), '');
  assert.equal(formatBatchTime(''), '');
  assert.equal(formatBatchTime(null), '');
});
