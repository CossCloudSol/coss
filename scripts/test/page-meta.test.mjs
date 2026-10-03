// Run with: npm test   (Node's built-in runner; Node 24 imports .ts directly)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkLinkedPages, linkPreviewFields, linkPreviewViolation } from '../../src/lib/page-meta.ts';
import { findClaimMatches } from '../../src/lib/social-captions.ts';

const page = ({ title = 'Cyber Security Training in Hyderabad | Coss Cloud Solutions', desc = 'Ethical hacking, SOC and VAPT with hands-on labs. 1-year LMS access.', ogTitle = title, ogDesc = desc } = {}) =>
  `<!doctype html><html><head><title>${title}</title>
  <meta name="description" content="${desc}"/>
  <meta property="og:title" content="${ogTitle}"/><meta content="${ogDesc}" property="og:description"/>
  </head><body><h1>x</h1></body></html>`;

// The live page behind the 3 Oct Cyber Security post (production HTML, 3 Oct 2026).
const LIVE_3_OCT = page({
  desc: 'Get top Cyber Security Training in Hyderabad. Land high-paying jobs as Security Analyst or Ethical Hacker with Coss Cloud Solutions&#x27; placement support.',
});

const fetchFrom = (pages) => async (url) => {
  const html = pages[url];
  if (html instanceof Error) throw html;
  return html === undefined ? new Response('nope', { status: 404 }) : new Response(html, { status: 200 });
};

test('link-preview fields are read in either attribute order, entities decoded', () => {
  const f = linkPreviewFields(LIVE_3_OCT);
  assert.equal(f.title, 'Cyber Security Training in Hyderabad | Coss Cloud Solutions');
  assert.match(f['meta description'], /Coss Cloud Solutions' placement support\.$/);
  assert.equal(f['og:description'], f['meta description']);
});

test('the 3 Oct Cyber Security page is caught on its meta description', () => {
  const hit = linkPreviewViolation(LIVE_3_OCT, findClaimMatches);
  assert.equal(hit.field, 'meta description');
  assert.match(hit.phrase, /top Cyber Security Training|high-paying|Land high-paying jobs/);
});

test('each field is checked: title, og:title, og:description', () => {
  assert.equal(linkPreviewViolation(page({ title: 'Best DevOps Institute in Hyderabad' }), findClaimMatches).field, 'title');
  assert.equal(linkPreviewViolation(page({ ogTitle: 'Placement Guaranteed DevOps' }), findClaimMatches).field, 'og:title');
  assert.equal(linkPreviewViolation(page({ ogDesc: 'Lifetime access to recordings' }), findClaimMatches).field, 'og:description');
  assert.equal(linkPreviewViolation(page(), findClaimMatches), null);
});

test('checkLinkedPages: banned claim blocks with the exact message; clean pages pass', async () => {
  const A = 'https://www.cosscloudsol.com/courses/cyber-security-training-institute-in-hyderabad?utm_source=facebook';
  const B = 'https://www.cosscloudsol.com/courses/clean';
  const bad = await checkLinkedPages([B, A], { fetch: fetchFrom({ [A]: LIVE_3_OCT, [B]: page() }), findClaims: findClaimMatches });
  assert.deepEqual(bad.ok, false);
  assert.equal(bad.retryable, false);
  assert.match(bad.error, /^Linked page metadata contains a banned claim: .+ \(meta description\)$/);
  assert.deepEqual(await checkLinkedPages([B, B, ''], { fetch: fetchFrom({ [B]: page() }), findClaims: findClaimMatches }), { ok: true });
  assert.deepEqual(await checkLinkedPages([], { fetch: fetchFrom({}), findClaims: findClaimMatches }), { ok: true });
});

test('a page that cannot be fetched is not sent unchecked (retryable)', async () => {
  const U = 'https://www.cosscloudsol.com/x';
  const notFound = await checkLinkedPages([U], { fetch: fetchFrom({}), findClaims: findClaimMatches });
  assert.equal(notFound.ok, false);
  assert.equal(notFound.retryable, true);
  assert.match(notFound.error, /HTTP 404\); not sent\.$/);
  const down = await checkLinkedPages([U], { fetch: fetchFrom({ [U]: new Error('ECONNRESET') }), findClaims: findClaimMatches });
  assert.equal(down.retryable, true);
  assert.match(down.error, /ECONNRESET/);
});
