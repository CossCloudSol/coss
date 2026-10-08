// Run with: npm test. Real blog dates (item 10): content/posts/_dates.json is current with
// git history, and the loader serves those dates instead of invented ones.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { registerHooks } from 'node:module';
import { pathToFileURL } from 'node:url';
import { DATES_FILE, POSTS_DIR, computePostDates, isShallowRepo } from '../lib/post-dates.mjs';

registerHooks({
  resolve(spec, ctx, next) {
    if (spec.startsWith('@/')) return next(pathToFileURL(path.resolve('src', `${spec.slice(2)}.ts`)).href, ctx);
    return next(spec, ctx);
  },
});

const dates = JSON.parse(fs.readFileSync(DATES_FILE, 'utf8'));
const slugs = fs.readdirSync(POSTS_DIR).filter((f) => /\.mdx?$/.test(f)).map((f) => f.replace(/\.mdx?$/, '')).sort();
const ISO = /^\d{4}-\d{2}-\d{2}$/;

test('one entry per post, valid dates, published ≤ modified', () => {
  assert.deepEqual(Object.keys(dates).sort(), slugs);
  for (const [slug, d] of Object.entries(dates)) {
    assert.match(d.published, ISO, slug);
    assert.match(d.modified, ISO, slug);
    assert.ok(d.published <= d.modified, slug);
  }
});

test('the file matches git history (run node scripts/build-post-dates.mjs after editing a post)', { skip: isShallowRepo() && 'shallow clone' }, () => {
  assert.deepEqual(dates, computePostDates());
});

test('a renamed post keeps its first publish date', () => {
  assert.equal(dates['master-aws-devops-in-hyderabad'].published, '2026-05-17');
  assert.equal('77674-2' in dates, false);
});

test('the loader serves the git dates (no invented spread), newest first', async () => {
  const { getAllPosts, getPostBySlug } = await import('../../src/lib/posts.ts');
  const posts = await getAllPosts();
  for (const p of posts) {
    assert.equal(p.frontmatter.date, dates[p.slug].published, p.slug);
    assert.equal(p.frontmatter.dateModified, dates[p.slug].modified, p.slug);
  }
  for (let i = 1; i < posts.length; i++) assert.ok(posts[i - 1].frontmatter.date >= posts[i].frontmatter.date);
  const one = await getPostBySlug('master-aws-devops-in-hyderabad');
  assert.equal(one.frontmatter.date, '2026-05-17');
  assert.equal(one.frontmatter.dateFormatted, '17 May 2026');
});
