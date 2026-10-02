// Run with: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';

// Each import gets a fresh module instance (the derived key is cached per module).
let n = 0;
const load = () => import(`../../src/lib/course-banner-sign.ts?fresh=${++n}`);

test('signature is stable, short hex, and changes when the title or category changes', async () => {
  process.env.ADMIN_SESSION_SECRET = 'test-secret-a';
  const { bannerSignature } = await load();
  const a = await bannerSignature('devops', 'DevOps Training', 'DevOps & Multi-Cloud', 'devops-multi-cloud');
  assert.match(a, /^[0-9a-f]{20}$/);
  assert.equal(a, await bannerSignature('devops', 'DevOps Training', 'DevOps & Multi-Cloud', 'devops-multi-cloud'));
  assert.notEqual(a, await bannerSignature('devops', 'DevOps Training!', 'DevOps & Multi-Cloud', 'devops-multi-cloud'));
  assert.notEqual(a, await bannerSignature('devops', 'DevOps Training', 'Cloud Computing', 'cloud-computing'));
});

test('a different secret gives different signatures (key is derived from the secret)', async () => {
  process.env.ADMIN_SESSION_SECRET = 'test-secret-a';
  const one = await (await load()).bannerSignature('x', 'T', 'C', 'c');
  process.env.ADMIN_SESSION_SECRET = 'test-secret-b';
  const two = await (await load()).bannerSignature('x', 'T', 'C', 'c');
  assert.notEqual(one, two);
});

test('banner URLs carry the signed parameters', async () => {
  process.env.ADMIN_SESSION_SECRET = 'test-secret-a';
  const { courseBannerPath, bannerSignature, sameSignature } = await load();
  const path = await courseBannerPath({ slug: 'devops', title: ' DevOps Training ', category: 'DevOps', categorySlug: 'devops-multi-cloud' });
  const url = new URL(path, 'https://example.test');
  assert.equal(url.pathname, '/course-banner/devops');
  assert.equal(url.searchParams.get('t'), 'DevOps Training');
  const expected = await bannerSignature('devops', 'DevOps Training', 'DevOps', 'devops-multi-cloud');
  assert.ok(sameSignature(url.searchParams.get('v'), expected));
  assert.ok(!sameSignature(url.searchParams.get('v').replace(/.$/, (c) => (c === '0' ? '1' : '0')), expected));
});

test('without the secret in production, banners are disabled (no guessable key)', async () => {
  const saved = { secret: process.env.ADMIN_SESSION_SECRET, env: process.env.NODE_ENV };
  delete process.env.ADMIN_SESSION_SECRET;
  process.env.NODE_ENV = 'production';
  const origError = console.error;
  console.error = () => {};
  try {
    const { bannerSignature, courseBannerPath, courseOgImages } = await load();
    assert.equal(await bannerSignature('x', 'T', 'C', 'c'), null);
    assert.equal(await courseBannerPath({ slug: 'x', title: 'T', category: 'C', categorySlug: null }), null);
    assert.deepEqual(await courseOgImages({ slug: 'x', title: 'T', category: 'C', categorySlug: null, thumbnail: null }, 'https://example.test'), []);
  } finally {
    console.error = origError;
    process.env.ADMIN_SESSION_SECRET = saved.secret;
    process.env.NODE_ENV = saved.env;
  }
});
