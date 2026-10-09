// Run with: npm test. Item 5: attribution (first + last touch, gclid/fbclid/utm_term/utm_content),
// consent on submit, the optional WhatsApp opt-in, and no IP addresses stored.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { registerHooks } from 'node:module';
import { pathToFileURL } from 'node:url';

registerHooks({
  resolve(spec, ctx, next) {
    if (spec.startsWith('@/')) return next(pathToFileURL(path.resolve('src', `${spec.slice(2)}.ts`)).href, ctx);
    return next(spec, ctx);
  },
});
const { campaignParamsFrom, isExternalReferrer, attributionFrom } = await import('../../src/lib/first-touch.ts');
const { firstTouchData, lastTouchData, consentData } = await import('../../src/lib/attribution.ts');

test('campaign params: utm_* plus gclid and fbclid, trimmed and capped', () => {
  const p = campaignParamsFrom(`?utm_source=google&utm_medium=cpc&utm_campaign=aws&utm_term=aws+course&utm_content=ad1&gclid=${'G'.repeat(600)}&fbclid=%20F1%20&other=x`);
  assert.deepEqual(Object.keys(p).sort(), ['fbclid', 'gclid', 'utmCampaign', 'utmContent', 'utmMedium', 'utmSource', 'utmTerm']);
  assert.equal(p.utmTerm, 'aws course');
  assert.equal(p.gclid.length, 500);
  assert.equal(p.fbclid, 'F1');
  assert.deepEqual(campaignParamsFrom(''), {});
});

test('external referrer: another site only', () => {
  assert.equal(isExternalReferrer('https://www.google.com/', 'www.cosscloudsol.com'), true);
  assert.equal(isExternalReferrer('https://www.cosscloudsol.com/courses', 'www.cosscloudsol.com'), false);
  assert.equal(isExternalReferrer('', 'www.cosscloudsol.com'), false);
  assert.equal(isExternalReferrer('not a url', 'www.cosscloudsol.com'), false);
});

test('attributionFrom: first touch as-is, last touch prefixed', () => {
  const first = { utmSource: 'google', gclid: 'g1', referrer: 'https://google.com/', landingPage: '/', capturedAt: '2026-10-01T00:00:00.000Z' };
  const last = { utmSource: 'facebook', utmTerm: 'devops', fbclid: 'f1', referrer: null, landingPage: '/courses', capturedAt: '2026-10-09T10:00:00.000Z' };
  const a = attributionFrom(first, last);
  assert.equal(a.utmSource, 'google');
  assert.equal(a.gclid, 'g1');
  assert.equal(a.lastUtmSource, 'facebook');
  assert.equal(a.lastUtmTerm, 'devops');
  assert.equal(a.lastFbclid, 'f1');
  assert.equal(a.lastReferrer, undefined);
  assert.equal(a.lastLandingPage, '/courses');
  assert.equal(a.lastTouchAt, '2026-10-09T10:00:00.000Z');
  assert.deepEqual(Object.values(attributionFrom(null, null)).filter((v) => v !== undefined), []);
});

test('server: known keys only, junk dropped (never rejects the lead), long values capped', () => {
  const f = firstTouchData({ utmSource: '  google ', utmTerm: 42, gclid: 'x'.repeat(900), referrer: 'r'.repeat(3000), ip: '1.2.3.4', evil: 'x' });
  assert.equal(f.utmSource, 'google');
  assert.equal(f.utmTerm, null);
  assert.equal(f.gclid.length, 500);
  assert.equal(f.referrer.length, 2048);
  assert.equal('ip' in f, false);
  assert.deepEqual(Object.keys(f).sort(), ['fbclid', 'gclid', 'landingPage', 'referrer', 'utmCampaign', 'utmContent', 'utmMedium', 'utmSource', 'utmTerm']);
  assert.deepEqual(firstTouchData(null), firstTouchData({}));
});

test('server: lastTouchAt only when it is a sane recent date', () => {
  const now = new Date('2026-10-10T12:00:00Z');
  assert.equal(lastTouchData({ lastTouchAt: '2026-10-09T10:00:00Z' }, now).lastTouchAt.toISOString(), '2026-10-09T10:00:00.000Z');
  assert.equal(lastTouchData({ lastTouchAt: '2027-01-01T00:00:00Z' }, now).lastTouchAt, null, 'future');
  assert.equal(lastTouchData({ lastTouchAt: '2020-01-01T00:00:00Z' }, now).lastTouchAt, null, 'too old');
  assert.equal(lastTouchData({ lastTouchAt: 'yesterday' }, now).lastTouchAt, null, 'not a date');
  assert.equal(lastTouchData({ lastGclid: ' g2 ' }, now).lastGclid, 'g2');
});

test('consent: consentAt on every submit; WhatsApp opt-in and its time only when ticked', () => {
  const now = new Date('2026-10-10T12:00:00Z');
  assert.deepEqual(consentData({}, now), { consentAt: now, whatsappOptIn: false, whatsappOptInAt: null });
  assert.deepEqual(consentData({ whatsappOptIn: true }, now), { consentAt: now, whatsappOptIn: true, whatsappOptInAt: now });
  for (const v of ['yes', 'true', 1, 'on', null]) assert.equal(consentData({ whatsappOptIn: v }, now).whatsappOptIn, false, String(v));
});

test('the opt-in box: exact wording, unticked by default, on the lead forms', () => {
  const box = fs.readFileSync('src/components/WhatsAppOptIn.tsx', 'utf8');
  assert.match(box, /'Send me batch updates on WhatsApp \(optional\)'/);
  assert.match(box, /defaultChecked: false/);
  assert.match(box, /minHeight: '44px'/);
  for (const f of ['DemoSidebarForm', 'EnrollFullForm', 'HeroEnrollForm', 'LandingEnrollForm', 'ContactForm', 'home/HomeHeroForm', 'search/NoResultsLead']) {
    const s = fs.readFileSync(`src/components/${f}.tsx`, 'utf8');
    assert.match(s, /<WhatsAppOptIn\b/, f);
    assert.match(s, /whatsappOptIn: (values\.whatsappOptIn === 'yes'|optInFromForm\(e\.currentTarget\))/, f);
  }
});

test('APIs: attribution + consent stored; no IP address stored', () => {
  for (const f of ['src/app/api/leads/route.ts', 'src/app/api/contact/route.ts']) {
    const s = fs.readFileSync(f, 'utf8');
    assert.match(s, /\.\.\.firstTouchData\(body\),\s*\.\.\.lastTouchData\(body\),\s*\.\.\.consentData\(body\),/, f);
  }
  const corp = fs.readFileSync('src/app/api/corporate-leads/route.ts', 'utf8');
  assert.match(corp, /\.\.\.firstTouchData\(body\),\s*consentAt: new Date\(\),/);
  const schema = fs.readFileSync('prisma/schema.prisma', 'utf8');
  for (const model of ['Lead', 'CorporateLead']) {
    const block = schema.slice(schema.indexOf(`model ${model} {`), schema.indexOf('\n}', schema.indexOf(`model ${model} {`)));
    assert.doesNotMatch(block, /\b(ip|ipAddress|clientIp)\b/i, `${model} has no IP column`);
  }
});
