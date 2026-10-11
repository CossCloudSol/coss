// Run with: npm test
// Homepage "Explore by track" and "Find your course": every link points at a published page (checked
// against the catalogue fixture), nothing is invented, and the finder promises nothing about outcomes.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { TRACKS, resolveTracks, suggestCourse, finderSuggestions, FINDER_QUESTIONS } from '../../src/lib/home-tracks.ts';
import { CATEGORY_MENU_STYLE } from '../../src/lib/menu-icons.ts';
import { finalHref } from '../../src/lib/redirect-resolve.ts';
import { REDIRECTS } from '../../redirects.config.mjs';

const raw = JSON.parse(fs.readFileSync(new URL('./fixtures/menu-index.json', import.meta.url), 'utf8'));
// The fixture stores category slugs; the live index has { slug, name }.
const index = { courses: raw.courses, categories: raw.categories.map((slug) => ({ slug, name: slug })) };

test('every track is a category the menu knows, and resolves to a published category page', () => {
  for (const t of TRACKS) assert.ok(CATEGORY_MENU_STYLE[t.category], `${t.label}: ${t.category} has no menu style`);
  const links = resolveTracks(index);
  assert.ok(links.length >= 7, `only ${links.length} tracks resolved`);
  for (const l of links) assert.equal(finalHref(l.href, REDIRECTS), l.href, `${l.href} redirects`);
});

test('a category that is not published is skipped, never linked', () => {
  const trimmed = { ...index, categories: index.categories.filter((c) => c.slug !== 'cyber-security') };
  assert.ok(!resolveTracks(trimmed).some((l) => l.label === 'Cyber Security'));
});

test('suggestions land on a published course, else its category page, else no link', () => {
  const s = finderSuggestions(index);
  for (const [opt, v] of Object.entries(s)) {
    if (v.href) assert.equal(finalHref(v.href, REDIRECTS), v.href, `${opt} -> ${v.href} redirects`);
  }
  const noCourses = { ...index, courses: [] };
  assert.match(suggestCourse('Cloud & DevOps', noCourses).href, /^\/courses\//);
  assert.equal(suggestCourse('Cloud & DevOps', { courses: [], categories: [] }).href, null);
  assert.equal(suggestCourse(undefined, index), null);
});

test('finder copy makes no outcome claims', () => {
  const text = JSON.stringify(FINDER_QUESTIONS) + fs.readFileSync(new URL('../../src/components/home/CourseFinder.tsx', import.meta.url), 'utf8');
  assert.doesNotMatch(text, /guarantee|placement|salary|lifetime|best |No\.\s?1|%/i);
});

/* ── Design v4: server HTML, one tiny script, the widget path for leads ── */
const read = (p) => fs.readFileSync(new URL(`../../${p}`, import.meta.url), 'utf8');

test('the finder, tracks, popular courses and batch band ship no client component', () => {
  for (const f of [
    'src/components/home/CourseFinder.tsx',
    'src/components/home/ExploreTracks.tsx',
    'src/components/home/v4/PopularCourses.tsx',
    'src/components/home/v4/BatchBand.tsx',
    'src/components/home/v4/Lower.tsx',
  ]) {
    assert.doesNotMatch(read(f), /^['"]use client['"]/m, `${f} must stay a server component`);
  }
});

test('"Send me the plan" goes through the WhatsApp widget path (lead saved as whatsapp_widget)', () => {
  const script = read('src/components/home/v4/HomeInteractions.tsx');
  assert.match(script, /coss:open-whatsapp/);
  assert.match(script, /__cossWaReady/);
  const widget = read('src/components/WhatsAppWidget.tsx');
  assert.match(widget, /formType: +'whatsapp_widget'/);
  assert.match(widget, /__cossWaReady/);
  assert.match(widget, /detail\?\.course/);
  // The finder itself never posts a lead: no submitLead import, no fetch.
  const finder = read('src/components/home/CourseFinder.tsx');
  assert.doesNotMatch(finder, /submitLead|fetch\(/);
});

test('the Google rating line is built from the live feed only', () => {
  const hero = read('src/components/home/v4/Hero.tsx');
  assert.match(hero, /<GoogleRatingBadge rating=\{rating\}/);
  assert.match(hero, /rating\?\.mapsUri/);
  for (const f of ['src/app/page.tsx', 'src/components/home/v4/Hero.tsx', 'src/components/home/v4/Lower.tsx']) {
    assert.doesNotMatch(read(f), /\b[1-5]\.\d\s*\/\s*5\b|\bAggregateRating\b/, `${f} hard-codes a rating figure`);
  }
});

test('the FAQ keeps the fees question out', () => {
  assert.doesNotMatch(read('src/app/page.tsx'), /What are the (course )?fees/i);
});
