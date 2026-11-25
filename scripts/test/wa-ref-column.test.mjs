// Run with: npm test. The WhatsApp ref code column: the full code the browser stores with each click, and where it travels.
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
const w = await import('../../src/lib/wa-ref.ts');
const pc = await import('../../src/lib/page-course.ts');
const il = await import('../../src/lib/intent-listener.ts');
const log = await import('../../src/lib/contact-click-log.ts');

const read = (f) => fs.readFileSync(f, 'utf8');
const BASE = 'https://wa.me/919999999999';

test('a ref code is W-<COURSE>-<CH>, nothing looser', () => {
  for (const ok of ['W-AWSDEVOPS-G', 'W-AZDEVOPS-A', 'W-GENAI-P', 'W-DS-S', 'W-DA-R', 'W-LINUX-D', 'W-CYBER-D', 'W-DM-G', 'W-GEN-D']) {
    assert.equal(w.isRefCode(ok), true, ok);
  }
  for (const bad of ['', 'W-GEN', 'W-GEN-X', 'w-gen-d', 'W-G-D', 'W-ABCDEFGHIJKLM-D', 'W-GEN-DD', 'X-GEN-D', ' W-GEN-D', 'W-GEN-D\n', 'W-GEN-D; x', null, undefined, 5]) {
    assert.equal(w.isRefCode(bad), false, String(bad));
  }
  // every code in the map with every channel is storable
  for (const course of [...w.REF_COURSES.map((c) => c.code), w.GENERIC_COURSE_CODE]) {
    for (const ch of w.REF_CHANNELS) assert.equal(w.isRefCode(w.refCode(course, ch.code)), true, `${course}-${ch.code}`);
  }
});

test('the code is read back from the text the chat opens with, paid (gclid) included', () => {
  const paid = w.channelFromTouch({ gclid: 'abc' }, 'www.cosscloudsol.com');
  assert.equal(paid, 'P');
  const dsPaid = w.waHrefWithRef(BASE, { pathname: '/', courseName: 'Data Science Training', courseSlug: 'data-science-training-institute-in-hyderabad', channel: paid });
  assert.equal(w.refCodeFromHref(dsPaid), 'W-DS-P');
  for (const ch of w.REF_CHANNELS) {
    const href = w.waHrefWithRef(BASE, { pathname: '/x', courseName: 'AWS DevOps', channel: ch.code });
    assert.equal(w.refCodeFromHref(href), `W-AWSDEVOPS-${ch.code}`);
  }
  // the general text carries a code too
  assert.equal(w.refCodeFromHref(w.waHrefWithRef(BASE, { pathname: '/contact-us', channel: 'G' })), 'W-GEN-G');
  // the click-time channel swap changes the code that is read back
  const ssr = w.waHrefWithRef(BASE, { pathname: '/', courseName: 'Linux Training', channel: 'D' });
  assert.equal(w.refCodeFromHref(ssr), 'W-LINUX-D');
  assert.equal(w.refCodeFromHref(w.waHrefWithRef(ssr, { pathname: '/', channel: 'A' })), 'W-LINUX-A');
  // no code in the link
  for (const none of [BASE, `${BASE}?text=${encodeURIComponent('Hi there')}`, `${BASE}?text=${encodeURIComponent('Hi (ref W-gen-d)')}`, '', null, undefined]) {
    assert.equal(w.refCodeFromHref(none), null, String(none));
  }
  assert.equal(w.refCodeFromText("Hi, I'd like fees and next batch dates for X (ref W-DA-S)"), 'W-DA-S');
  assert.equal(w.refCodeFromText('no code here'), null);
  assert.equal(w.refCodeFromText(undefined), null);
});

test('the click row payload carries the ref code, only when it is a real one', () => {
  const params = { pathname: '/courses/x/y', ctaType: 'hero', phoneNumber: '+919999999999', hadPrefill: true, location: 'hero' };
  assert.equal(log.buildWhatsAppClickPayload({ ...params, refCode: 'W-DS-P' }).refCode, 'W-DS-P');
  for (const bad of [undefined, null, '', 'W-GEN', 'not a code', 'W-GEN-D; x']) {
    assert.equal('refCode' in log.buildWhatsAppClickPayload({ ...params, refCode: bad }), false, String(bad));
  }
});

// A stand-in for the clicked anchor: closest() gives itself, setAttribute keeps the href.
function fakeAnchor(href) {
  const attrs = { href };
  const a = {
    tagName: 'A',
    parentElement: null,
    getAttribute: (n) => attrs[n] ?? null,
    hasAttribute: (n) => n in attrs,
    setAttribute: (n, v) => { attrs[n] = v; },
    closest: () => a,
  };
  return a;
}

test('click listener path: the code stored is the one the link now carries, paid first touch included', () => {
  const general = `${BASE}?text=${encodeURIComponent("Hi, I'd like to know about courses and batches (ref W-GEN-D)")}`;
  const first = { gclid: 'abc', referrer: null, landingPage: '/', capturedAt: 'x' };
  globalThis.window = { localStorage: { getItem: () => JSON.stringify(first) }, location: { host: 'www.cosscloudsol.com', search: '' } };
  pc.setPageCourse({ name: 'Data Science Training', slug: 'data-science-training-institute-in-hyderabad' });
  try {
    const a = fakeAnchor(general);
    il.applyWaRef(a, '/courses/data-science-training-institute-in-hyderabad');
    const intent = il.resolveIntent(a);
    assert.equal(intent.kind, 'whatsapp');
    assert.equal(w.refCodeFromHref(intent.href), 'W-DS-P', 'the paid code, with the course of the page');
  } finally {
    pc.setPageCourse(null);
    delete globalThis.window;
  }
  // no first touch in a plain node run: direct
  const b = fakeAnchor(general);
  il.applyWaRef(b, '/blog/x');
  assert.equal(w.refCodeFromHref(il.resolveIntent(b).href), 'W-GEN-D');
});

test('wiring: schema, SQL, API, the three browser paths and the admin list', () => {
  const schema = read('prisma/schema.prisma');
  const start = schema.indexOf('model WhatsAppClick {');
  const model = schema.slice(start, schema.indexOf('\n}', start));
  assert.match(model, /refCode\s+String\?/);
  assert.match(read('prisma/migrations/manual/2026-11-26-whatsapp-click-refcode.sql'), /ADD COLUMN "refCode" TEXT;/);

  const route = read('src/app/api/whatsapp-clicks/route.ts');
  assert.match(route, /refCode: z\.unknown\(\)\.optional\(\)/); // a bad code is never a reason to refuse the click
  assert.match(route, /refCode: isRefCode\(data\.refCode\) \? data\.refCode : null/);

  assert.match(read('src/components/WhatsAppLink.tsx'), /refCode: refCodeFromHref\(opened\)/);
  const widget = read('src/components/WhatsAppWidget.tsx');
  assert.equal((widget.match(/refCode: refCodeFromText\(opening\)/g) ?? []).length, 2, 'the widget sends it on both send and skip');
  assert.match(read('src/lib/intent-listener.ts'), /refCode: refCodeFromHref\(intent\.href\)/);

  const adminApi = read('src/app/api/admin/whatsapp-clicks/route.ts');
  assert.match(adminApi, /refCode: true/);
  assert.match(adminApi, /refCode: r\.refCode/);
  assert.match(read('src/app/admin/whatsapp-clicks/page.tsx'), /row\.refCode/);
});
