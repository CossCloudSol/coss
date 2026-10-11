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
