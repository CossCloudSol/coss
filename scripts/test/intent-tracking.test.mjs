// Run with: npm test. Click tracking (PR B): kind inference, the site-wide listener's untagged
// fallback, no double counting, the 30-minute last-click memory, the /admin/tracking IST
// range, production-only click rows, and the untagged-CTA sweep.
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

/* ------------------------------ a tiny browser ----------------------------- */
const store = new Map();
const gaEvents = [];
const beacons = [];
globalThis.window = {
  location: { pathname: '/courses/aws', search: '?utm_campaign=tracking-check' },
  sessionStorage: {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
  },
  gtag: (_cmd, name, params) => gaEvents.push({ name, params }),
  matchMedia: () => ({ matches: false }),
};
globalThis.document = { referrer: '' };
Object.defineProperty(globalThis, 'navigator', {
  value: { sendBeacon: (url, blob) => { beacons.push({ url, blob }); return true; } },
  configurable: true,
});
const reset = () => { store.clear(); gaEvents.length = 0; beacons.length = 0; };

const it = await import('../../src/lib/intent-tracking.ts');
const listener = await import('../../src/lib/intent-listener.ts');
const { parseTrackingRange } = await import('../../src/lib/tracking-range.ts');
const { savesClickRows } = await import('../../src/lib/click-rows.ts');

/** Fake element: tag, attributes, parent. */
function el(tagName, attrs = {}, parent = null) {
  return {
    tagName,
    id: attrs.id,
    parentElement: parent,
    getAttribute: (n) => (n in attrs ? attrs[n] : null),
    hasAttribute: (n) => n in attrs,
  };
}

test('kind inference from the href', () => {
  assert.equal(it.inferIntentKind('/free-demo-class'), 'demo');
  assert.equal(it.inferIntentKind('/free-demo-class?course=aws'), 'demo');
  assert.equal(it.inferIntentKind('https://www.cosscloudsol.com/free-demo-class'), 'demo');
  assert.equal(it.inferIntentKind('https://res.cloudinary.com/x/aws-syllabus.pdf'), 'syllabus');
  assert.equal(it.inferIntentKind('/courses/aws#brochure'), 'syllabus');
  assert.equal(it.inferIntentKind('https://wa.me/918885166007?text=hi'), 'whatsapp');
  assert.equal(it.inferIntentKind('tel:+918885166007'), 'call');
  assert.equal(it.inferIntentKind('/enroll-now-with-coss'), 'enroll');
  assert.equal(it.inferIntentKind('/courses'), null);
  assert.equal(it.inferIntentKind('#enroll-form'), null);
  assert.equal(it.INTENT_GA_EVENT.demo, 'demo_click');
  assert.equal(it.INTENT_GA_EVENT.syllabus, 'syllabus_click');
  assert.equal(it.INTENT_GA_EVENT.brochure_download, 'brochure_download');
  assert.equal(it.INTENT_GA_EVENT.call, 'contact_click');
  assert.equal(it.INTENT_GA_EVENT.whatsapp, 'contact_click');
  assert.equal(it.INTENT_GA_EVENT.enroll, 'cta_click');
});

test('GA4 parameters are snake_case and carry no query string', () => {
  const p = it.intentGaParams({ kind: 'whatsapp', ctaId: 'batch_whatsapp', location: 'batch_card', destination: 'https://wa.me/918885166007?text=My%20name%20is%20Ravi', courseSlug: 'aws' }, '/courses/aws');
  assert.deepEqual(Object.keys(p).sort(), ['course_slug', 'cta_id', 'destination', 'location', 'method', 'page_path', 'page_type']);
  assert.equal(p.destination, 'https://wa.me/918885166007');
  assert.equal(p.method, 'whatsapp');
  assert.equal(it.toTrackingId('Enroll-Form'), 'enroll_form');
  assert.equal(it.toTrackingId(''), 'page');
});

test('tagged elements: data-cta / data-loc / data-kind, else the kind from the href', () => {
  const section = el('section', { id: 'faq' });
  const tagged = el('a', { href: '#enroll-form', 'data-cta': 'book_demo', 'data-loc': 'sticky_bar', 'data-kind': 'demo' }, section);
  const span = el('span', {}, tagged);
  assert.deepEqual(
    (({ kind, ctaId, location, destination }) => ({ kind, ctaId, location, destination }))(listener.resolveIntent(span)),
    { kind: 'demo', ctaId: 'book_demo', location: 'sticky_bar', destination: '#enroll-form' },
  );
  const noLoc = el('a', { href: '/free-demo-class', 'data-cta': 'book_demo' }, section);
  assert.equal(listener.resolveIntent(noLoc).location, 'faq');
  const button = el('button', { 'data-cta': 'brochure', 'data-loc': 'course_sidebar', 'data-kind': 'syllabus', 'data-course': 'aws' });
  const b = listener.resolveIntent(button);
  assert.equal(b.kind, 'syllabus');
  assert.equal(b.courseSlug, 'aws');
});

test('untagged fallback: demo, syllabus/brochure and wa.me only, location = nearest section', () => {
  const page = el('main');
  const named = el('div', { 'data-section': 'pricing' }, page);
  const r = listener.resolveIntent(el('a', { href: '/free-demo-class' }, named));
  assert.equal(r.ctaId, 'untagged');
  assert.equal(r.location, 'pricing');
  assert.equal(listener.resolveIntent(el('a', { href: 'https://wa.me/918885166007' }, page)).location, 'page');
  assert.equal(listener.resolveIntent(el('a', { href: '/x/syllabus.pdf' }, el('footer'))).location, 'footer');
  assert.equal(listener.resolveIntent(el('a', { href: '/courses' }, page)), null, 'plain links are not counted');
  assert.equal(listener.resolveIntent(el('a', { href: 'tel:+918885166007' }, page)), null, 'tel: is not in the safety net');
  assert.equal(listener.resolveIntent(el('a', { href: '/enroll-now-with-coss' }, page)), null);
});

test('no double count: data-tracked elements (CallLink, WhatsAppLink, TrackedCta, PromoBanner) are skipped', () => {
  const link = el('a', { href: 'tel:+918885166007', 'data-tracked': '', 'data-cta': 'call' });
  assert.equal(listener.resolveIntent(el('svg', {}, link)), null);
  for (const f of ['src/components/CallLink.tsx', 'src/components/WhatsAppLink.tsx', 'src/components/home/TrackedCta.tsx', 'src/components/PromoBanner.tsx']) {
    assert.match(fs.readFileSync(f, 'utf8'), /\[TRACKED_ATTR\]: ''/, `${f} doesn't set data-tracked`);
  }
  // One click on a tagged demo link: one GA event, one CtaClick beacon.
  reset();
  listener.countIntent(listener.resolveIntent(el('a', { href: '/free-demo-class', 'data-cta': 'book_demo', 'data-loc': 'header' })), '/courses/aws');
  assert.deepEqual(gaEvents.map((e) => e.name), ['demo_click']);
  assert.deepEqual(beacons.map((b) => b.url), ['/api/cta-clicks']);
  // A server-rendered wa.me link: one contact_click and one WhatsAppClick row, no CtaClick row.
  reset();
  listener.countIntent(listener.resolveIntent(el('a', { href: 'https://wa.me/918885166007?text=hi', 'data-cta': 'batch_whatsapp', 'data-loc': 'upcoming_batches', 'data-wa-type': 'batch' })), '/');
  assert.deepEqual(gaEvents.map((e) => [e.name, e.params.method]), [['contact_click', 'whatsapp']]);
  assert.deepEqual(beacons.map((b) => b.url), ['/api/whatsapp-clicks']);
  // Only one listener: a single PublicChrome in the layout installs it.
  const layout = fs.readFileSync('src/app/layout.tsx', 'utf8');
  assert.equal(layout.match(/<PublicChrome clickTracking>/g)?.length, 1);
  const home = fs.readFileSync('src/components/home/v4/HomeInteractions.tsx', 'utf8');
  assert.doesNotMatch(home, /gtag/, 'HomeInteractions still sends GA');
});

test('last click is remembered for 30 minutes; a form submit keeps the source button', () => {
  reset();
  const t0 = Date.parse('2026-10-21T10:00:00+05:30');
  it.rememberLastClick({ kind: 'demo', ctaId: 'book_demo', location: 'header', path: '/courses/aws' }, t0);
  assert.deepEqual(it.leadSourceFields(t0 + 29 * 60 * 1000), { sourceCta: 'book_demo', sourceLocation: 'header', sourcePath: '/courses/aws' });
  assert.deepEqual(it.leadSourceFields(t0 + 31 * 60 * 1000), {});
  store.set(it.LAST_CLICK_KEY, '{not json');
  assert.equal(it.readLastClick(t0), null);
  // Storage that throws (private mode): no error reaches the caller.
  const saved = window.sessionStorage;
  window.sessionStorage = { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('blocked'); } };
  assert.doesNotThrow(() => it.rememberLastClick({ kind: 'demo', ctaId: 'x', location: 'y', path: '/' }));
  assert.equal(it.readLastClick(), null);
  window.sessionStorage = saved;
  // data-keep-source: the demo form's submit counts as a demo click but keeps "header".
  reset();
  it.rememberLastClick({ kind: 'demo', ctaId: 'book_demo', location: 'header', path: '/' });
  listener.countIntent(listener.resolveIntent(el('button', { 'data-cta': 'demo_form_submit', 'data-loc': 'demo_sidebar', 'data-kind': 'demo', 'data-keep-source': '' })), '/');
  assert.equal(it.readLastClick().ctaId, 'book_demo');
});

test('/admin/tracking range: inclusive IST days', () => {
  const now = new Date('2026-10-21T00:30:00+05:30'); // still 20 Oct in UTC
  const today = parseTrackingRange('2026-10-21', '2026-10-21', now);
  assert.equal(today.days, 1);
  assert.equal(today.start.toISOString(), '2026-10-20T18:30:00.000Z');
  assert.equal(today.end.toISOString(), '2026-10-21T18:30:00.000Z');
  const week = parseTrackingRange(null, null, now);
  assert.deepEqual([week.from, week.to, week.days], ['2026-10-15', '2026-10-21', 7]);
  assert.equal(parseTrackingRange('2026-10-22', '2026-10-21', now), null);
  assert.equal(parseTrackingRange('2024-01-01', '2026-10-21', now), null, 'over 366 days');
});

test('click rows are saved only on the production deployment', () => {
  assert.equal(savesClickRows('production'), true);
  assert.equal(savesClickRows('preview'), false);
  assert.equal(savesClickRows(undefined), false);
  for (const f of ['src/app/api/cta-clicks/route.ts', 'src/app/api/call-clicks/route.ts', 'src/app/api/whatsapp-clicks/route.ts']) {
    const s = fs.readFileSync(f, 'utf8');
    const gate = s.indexOf('if (!savesClickRows()) return new NextResponse(null, { status: 204 });');
    assert.ok(gate > 0 && gate < s.indexOf('.create({'), `${f}: no production gate before the insert`);
  }
});

test('every public demo / syllabus / brochure / tel: / wa.me link is tagged', async () => {
  const { untaggedCtas } = await import('../check-untagged-ctas.mjs');
  assert.deepEqual(untaggedCtas(), []);
});
