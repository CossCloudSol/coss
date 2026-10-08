// Run with: npm test. "Related Articles" from shared categories (item 10).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { deriveCategoryFromSlug, relatedPosts } from '../../src/lib/blog-categories.ts';

const pool = [
  { slug: 'a', title: 'AWS one', category: 'Cloud Computing', date: '2026-05-17' },
  { slug: 'b', title: 'Azure two', category: 'Cloud Computing', date: '2026-06-01' },
  { slug: 'c', title: 'Linux', category: 'Linux', date: '2026-09-01' },
  { slug: 'd', title: 'Docker', category: 'DevOps', date: '2026-08-01' },
  { slug: 'e', title: 'GCP', category: 'Cloud & DevOps', date: '2026-04-01' },
  { slug: 'x', title: 'This post', category: 'Cloud Computing', date: '2026-07-01' },
];

test('same category first, newest first; never the post itself', () => {
  const r = relatedPosts({ slug: 'x', category: 'Cloud Computing' }, pool, 3).map((p) => p.slug);
  assert.deepEqual(r, ['b', 'a', 'c']);
});

test('topped up with the newest other posts when the category is small', () => {
  const r = relatedPosts({ slug: 'c', category: 'Linux' }, pool).map((p) => p.slug);
  assert.deepEqual(r, ['d', 'x', 'b', 'a']);
});

test('a DB category like "Cloud & DevOps" still counts as related (loose match)', () => {
  const r = relatedPosts({ slug: 'd', category: 'DevOps' }, pool, 1).map((p) => p.slug);
  assert.deepEqual(r, ['e']);
});

test('deriveCategoryFromSlug', () => {
  assert.equal(deriveCategoryFromSlug('master-aws-devops-in-hyderabad', 'Master AWS DevOps'), 'Cloud Computing');
  assert.equal(deriveCategoryFromSlug('learn-linux-basics', 'Learn Linux'), 'Linux');
  assert.equal(deriveCategoryFromSlug('soft-skills', 'Soft skills'), 'Cloud Computing', 'the default bucket');
});
