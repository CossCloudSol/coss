// Run with: npm test. WhatsApp ref codes: first-touch channel, code format, and the prefilled text per page type.
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

const read = (f) => fs.readFileSync(f, 'utf8');

test('channel: paid, AI assistant, Google organic, social, other referral, direct', () => {
  const own = 'cosscloudsol.com';
  assert.equal(w.channelFromTouch({ gclid: 'abc' }, own), 'P');
  assert.equal(w.channelFromTouch({ utmSource: 'google', utmMedium: 'cpc' }, own), 'P');
  assert.equal(w.channelFromTouch({ utmMedium: 'ppc' }, own), 'P');
  for (const r of ['https://chatgpt.com/', 'https://claude.ai/chat/1', 'https://www.perplexity.ai/search', 'https://gemini.google.com/app', 'https://copilot.microsoft.com/']) {
    assert.equal(w.channelFromTouch({ referrer: r }, own), 'A', r);
  }
  assert.equal(w.channelFromTouch({ utmSource: 'chatgpt.com' }, own), 'A');
  assert.equal(w.channelFromTouch({ referrer: 'https://www.google.com/' }, own), 'G');
  assert.equal(w.channelFromTouch({ referrer: 'https://www.google.co.in/search?q=x' }, own), 'G');
  assert.equal(w.channelFromTouch({ referrer: 'https://l.instagram.com/?u=x' }, own), 'S');
  assert.equal(w.channelFromTouch({ referrer: 'https://www.linkedin.com/' }, own), 'S');
  assert.equal(w.channelFromTouch({ fbclid: 'x' }, own), 'S');
  assert.equal(w.channelFromTouch({ referrer: 'https://some-blog.example/post' }, own), 'R');
  assert.equal(w.channelFromTouch({ utmSource: 'newsletter' }, own), 'R');
  assert.equal(w.channelFromTouch({ referrer: 'https://cosscloudsol.com/about' }, own), 'D');
  assert.equal(w.channelFromTouch({ referrer: null }, own), 'D');
  assert.equal(w.channelFromTouch(null, own), 'D');
});

test('code format: W-<COURSE>-<CH>, GEN for anything else', () => {
  assert.equal(w.refCode('AWSDEVOPS', 'G'), 'W-AWSDEVOPS-G');
  assert.equal(w.refCode(undefined, 'D'), 'W-GEN-D');
  assert.deepEqual(w.REF_COURSES.map((c) => c.code), ['AWSDEVOPS', 'AZDEVOPS', 'GENAI', 'DS', 'DA', 'LINUX', 'CYBER', 'DM']);
  assert.deepEqual(w.REF_CHANNELS.map((c) => c.code).sort(), ['A', 'D', 'G', 'P', 'R', 'S']);
  assert.equal(w.refCourseFor('aws-devops-training-in-hyderabad').code, 'AWSDEVOPS');
  assert.equal(w.refCourseFor('azure-devops-course').code, 'AZDEVOPS');
  assert.equal(w.refCourseFor('generative-ai-llm-engineering').code, 'GENAI');
  assert.equal(w.refCourseFor('data-science-course').code, 'DS');
  assert.equal(w.refCourseFor('Data Analytics Training').code, 'DA');
  assert.equal(w.refCourseFor('linux-administration').code, 'LINUX');
  assert.equal(w.refCourseFor('cyber-security-course').code, 'CYBER');
  assert.equal(w.refCourseFor('digital-marketing').code, 'DM');
  assert.equal(w.refCourseFor('python-full-stack'), null);
  assert.equal(w.refCourseByCode('awsdevops').label, 'AWS DevOps');
});

test('prefill per page type', () => {
  assert.equal(
    w.buildWaText({ pathname: '/courses/cloud-devops/aws-devops-training', courseName: 'AWS DevOps Training', channel: 'G' }),
    "Hi, I'd like fees and next batch dates for AWS DevOps Training (ref W-AWSDEVOPS-G)",
  );
  assert.equal(
    w.buildWaText({ pathname: '/data-science-course-in-hyderabad-by-coss-cloud-solutions', channel: 'A' }),
    "Hi, I'd like fees and next batch dates for Data Science (ref W-DS-A)",
  );
  assert.equal(
    w.buildWaText({ pathname: '/batches', courseName: 'Python Full Stack', channel: 'D' }),
    "Hi, I'd like fees and next batch dates for Python Full Stack (ref W-GEN-D)",
  );
  for (const p of ['/', '/contact-us', '/blog/how-to-choose', '/locations/dilsukhnagar', '/courses']) {
    assert.equal(w.buildWaText({ pathname: p, channel: 'R' }), "Hi, I'd like to know about courses and batches (ref W-GEN-R)", p);
  }
  assert.match(w.buildWaText({ pathname: '/blog/aws-devops-roadmap', channel: 'G' }), /courses and batches \(ref W-GEN-G\)/);
});

test('href: standard text, channel swapped at click time', () => {
  const base = 'https://wa.me/919999999999';
  const ssr = w.waHrefWithRef(base, { pathname: '/aws-devops-course', channel: 'D' });
  assert.match(decodeURIComponent(ssr), /\(ref W-AWSDEVOPS-D\)$/);
  const clicked = w.waHrefWithRef(ssr, { pathname: '/aws-devops-course', channel: 'A' });
  assert.match(decodeURIComponent(clicked), /\(ref W-AWSDEVOPS-A\)$/);
  const legacy = w.waHrefWithRef(`${base}?text=${encodeURIComponent('Hi Coss team please call')}`, { pathname: '/', channel: 'G' });
  assert.equal(decodeURIComponent(legacy), "https://wa.me/919999999999?text=Hi, I'd like to know about courses and batches (ref W-GEN-G)");
  assert.equal(w.isWaHref('https://wa.me/91999'), true);
  assert.equal(w.isWaHref('/free-demo-class'), false);
});

test('wiring: every wa.me builder uses the standard text; mobile hero button; schema names', () => {
  assert.match(read('src/components/WhatsAppLink.tsx'), /waHrefWithRef\(/);
  assert.match(read('src/lib/intent-listener.ts'), /applyWaRef\(/);
  assert.match(read('src/components/WhatsAppWidget.tsx'), /buildWaText\(/);
  assert.match(read('src/lib/whatsapp.ts'), /buildWaText\(/);
  assert.match(read('src/lib/promo-banners.ts'), /buildWaText\(/);
  assert.match(read('src/components/home/v4/BatchBand.tsx'), /buildWaText\(/);
  const m = read('src/components/MobileWaFees.tsx');
  assert.match(m, /Ask fees &amp; batch dates on WhatsApp/);
  assert.match(m, /md:hidden/);
  assert.match(m, /HERO_WA_FEES_CTA = 'hero_whatsapp_fees'/);
  assert.match(read('src/components/LandingPageTemplate.tsx'), /<MobileWaFees /);
  assert.match(read('src/app/courses/[slug]/[courseSlug]/page.tsx'), /<MobileWaFees /);
  const g = read('src/lib/global-schemas.ts');
  assert.match(g, /legalName: 'Coss Cloud Solutions'/);
  assert.match(g, /alternateName: \['Coss', 'Complete Open Source Solutions'\]/);
});

test('"Red Hat" is never written; the alternate name stays out of visible text', () => {
  for (const f of ['src/lib/wa-ref.ts', 'src/components/MobileWaFees.tsx', 'src/components/admin/TrackingReport.tsx']) {
    assert.doesNotMatch(read(f), /red hat/i, f);
  }
  for (const f of ['src/components/MobileWaFees.tsx', 'src/components/admin/TrackingReport.tsx', 'src/components/Footer.tsx']) {
    assert.doesNotMatch(read(f), /Complete Open Source/, f);
  }
});
