// Run with: npm test   (Node's built-in runner; Node 24 imports .ts directly)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { forwardBody, forwardConfig, forwardLead, pageUrl, signature } from '../../src/lib/enquify-forward.ts';

const SECRET = 's'.repeat(40);
const ON = { ENQUIFY_FORWARD: '1', ENQUIFY_INTAKE_URL: 'https://hub.example/api/intake?x=1', ENQUIFY_INTAKE_SECRET: SECRET, VERCEL_ENV: 'production' };
const LEAD = { id: 'clead123', name: 'Asha', phone: '9876543210', email: null, course: 'AWS', branch: 'Dilsukhnagar', message: 'Weekend batch?', landingPage: '/aws-training', referrer: 'https://www.google.com/', utmSource: 'google', utmMedium: 'cpc', utmCampaign: 'aws' };

test('off by default and whenever a setting is missing or unsafe', () => {
  assert.equal(forwardConfig({}), null);
  assert.equal(forwardConfig({ ...ON, ENQUIFY_FORWARD: 'true' }), null);
  assert.equal(forwardConfig({ ...ON, ENQUIFY_INTAKE_SECRET: 'short' }), null);
  assert.equal(forwardConfig({ ...ON, ENQUIFY_INTAKE_URL: '' }), null);
  assert.equal(forwardConfig({ ...ON, ENQUIFY_INTAKE_URL: 'http://hub.example/x' }), null);
  assert.deepEqual(forwardConfig(ON), { url: ON.ENQUIFY_INTAKE_URL, secret: SECRET, test: false });
});

test('outside production every post is marked as a test', () => {
  assert.equal(forwardConfig({ ...ON, VERCEL_ENV: 'preview' }).test, true);
  assert.equal(forwardConfig({ ...ON, VERCEL_ENV: undefined }).test, true);
});

test('page is a full URL carrying the first-touch tags', () => {
  const u = new URL(pageUrl(LEAD, 'https://www.cosscloudsol.com'));
  assert.equal(u.origin + u.pathname, 'https://www.cosscloudsol.com/aws-training');
  assert.equal(u.searchParams.get('utm_source'), 'google');
  assert.equal(u.searchParams.get('utm_medium'), 'cpc');
  assert.equal(u.searchParams.get('utm_campaign'), 'aws');
  assert.equal(pageUrl({ ...LEAD, landingPage: null }), null);
  assert.equal(pageUrl({ ...LEAD, landingPage: 'javascript:alert(1)' }), null);
});

test('body has the intake fields and nothing else', () => {
  const b = JSON.parse(forwardBody(LEAD, false, 'https://www.cosscloudsol.com'));
  assert.deepEqual(Object.keys(b).sort(), ['branch', 'course', 'email', 'id', 'message', 'name', 'page', 'phone', 'referrer', 'test']);
  assert.equal(b.id, 'clead123');
  assert.equal(b.branch, 'Dilsukhnagar');
  assert.equal(b.test, false);
});

test('signature is HMAC-SHA256 of "<timestamp>.<raw body>"', () => {
  const want = 'sha256=' + createHmac('sha256', SECRET).update('1700000000.{"a":1}').digest('hex');
  assert.equal(signature(SECRET, '1700000000', '{"a":1}'), want);
});

test('sends one signed post when on', async () => {
  const calls = [];
  const fetchImpl = async (url, init) => { calls.push({ url, init }); return new Response('{}', { status: 200 }); };
  const r = await forwardLead(LEAD, ON, fetchImpl, () => 1_700_000_000_123);
  assert.deepEqual(r, { sent: true, status: 200 });
  assert.equal(calls.length, 1);
  const { url, init } = calls[0];
  assert.equal(url, ON.ENQUIFY_INTAKE_URL);
  assert.equal(init.method, 'POST');
  assert.equal(init.headers['x-enquify-timestamp'], '1700000000');
  assert.equal(init.headers['x-enquify-signature'], signature(SECRET, '1700000000', init.body));
});

test('does nothing when off', async () => {
  let called = false;
  const r = await forwardLead(LEAD, {}, async () => { called = true; return new Response(); });
  assert.deepEqual(r, { sent: false, reason: 'off' });
  assert.equal(called, false);
});

test('retries once on a 5xx or network error, never on a 4xx, and never throws', async () => {
  let n = 0;
  const flaky = async () => { n++; if (n === 1) throw new TypeError('fetch failed'); return new Response('{}', { status: 201 }); };
  assert.deepEqual(await forwardLead(LEAD, ON, flaky), { sent: true, status: 201 });
  assert.equal(n, 2);

  n = 0;
  const down = async () => { n++; return new Response('', { status: 503 }); };
  assert.deepEqual(await forwardLead(LEAD, ON, down), { sent: false, reason: 'status 503' });
  assert.equal(n, 2);

  n = 0;
  const refused = async () => { n++; return new Response('', { status: 401 }); };
  assert.deepEqual(await forwardLead(LEAD, ON, refused), { sent: false, reason: 'status 401' });
  assert.equal(n, 1);
});
