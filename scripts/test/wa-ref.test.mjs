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
const pc = await import('../../src/lib/page-course.ts');
const il = await import('../../src/lib/intent-listener.ts');

const read = (f) => fs.readFileSync(f, 'utf8');
const textOf = (href) => decodeURIComponent(href.split('text=')[1]);

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
  // A course page's path gives the code, never a name: the name is the course page's own (see the page-course tests).
  assert.equal(
    w.buildWaText({ pathname: '/data-science-course-in-hyderabad-by-coss-cloud-solutions', channel: 'A' }),
    "Hi, I'd like to know about courses and batches (ref W-DS-A)",
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

test('GENAI: the Artificial Intelligence and AI Foundation courses and the AI keywords', () => {
  const genai = [
    // the three published courses (slug / title)
    'artificial-intelligence-ai-training-hyderabad', 'Artificial Intelligence (AI) Course',
    'artificial-intelligence-training-institute-in-hyderabad', 'Artificial Intelligence (AI) Training',
    'ai-foundation-training-in-hyderabad', 'AI Foundation',
    // the keywords, in slugs and in names
    'generative-ai-course', 'Generative AI Bootcamp', 'genai-for-developers', 'Gen AI Training', 'gen-ai-hyderabad',
    'llm-engineering', 'Build LLM Apps', 'agentic-ai-workflows', 'Agentic Systems', 'prompt-engineering-masterclass', 'Prompt Engineering',
  ];
  for (const t of genai) assert.equal(w.refCourseFor(t)?.code, 'GENAI', t);
  // slug and name are looked at together
  assert.equal(w.refCourseFor('ai-foundation-training-in-hyderabad', 'AI Foundation').code, 'GENAI');
  // not swept up
  for (const t of ['Machine Learning Training', 'machine-learning-training-institute-in-hyderabad', 'Python Full Stack', 'Email Marketing', 'Hyderabad Training', 'Kubernetes & Docker Training']) {
    assert.equal(w.refCourseFor(t), null, t);
  }
  // the other codes are unchanged, and an earlier code still wins
  assert.equal(w.refCourseFor('Data Science Training').code, 'DS');
  assert.equal(w.refCourseFor('Python for Data Analysis Training').code, 'DA');
  assert.equal(w.refCourseFor('AWS DevOps with Generative AI').code, 'AWSDEVOPS');
  assert.equal(w.refCourseByCode('genai').note, 'also the Artificial Intelligence and AI Foundation courses');
  assert.match(read('src/components/admin/TrackingReport.tsx'), /c\.note/);
});

test('page course store: set, clear, notify once per change', () => {
  let calls = 0;
  const off = pc.subscribePageCourse(() => { calls += 1; });
  try {
    assert.equal(pc.getPageCourse(), null);
    pc.setPageCourse({ name: '  Kubernetes & Docker Training ', slug: 'kubernetes-docker-devops-training-in-hyderabad' });
    assert.deepEqual(pc.getPageCourse(), { name: 'Kubernetes & Docker Training', slug: 'kubernetes-docker-devops-training-in-hyderabad' });
    pc.setPageCourse({ name: 'Kubernetes & Docker Training', slug: 'kubernetes-docker-devops-training-in-hyderabad' });
    assert.equal(calls, 1, 'same value: no notification');
    pc.setPageCourse(null);
    assert.equal(pc.getPageCourse(), null);
    assert.equal(calls, 2);
    pc.setPageCourse({ name: '   ' });
    assert.equal(pc.getPageCourse(), null, 'a blank name is no course');
    assert.equal(calls, 2);
  } finally {
    off();
    pc.setPageCourse(null);
  }
});

test('a course page: header, footer, sticky bar and widget name the page course, also when the code is GEN', () => {
  const kube = {
    pathname: '/courses/devops-multi-cloud/kubernetes-docker-devops-training-in-hyderabad',
    courseName: 'Kubernetes & Docker Training',
    courseSlug: 'kubernetes-docker-devops-training-in-hyderabad',
  };
  assert.equal(w.buildWaText({ ...kube, channel: 'D' }), "Hi, I'd like fees and next batch dates for Kubernetes & Docker Training (ref W-GEN-D)");
  const ai = { pathname: '/courses/artificial-intelligence-training/ai-foundation-training-in-hyderabad', courseName: 'AI Foundation', courseSlug: 'ai-foundation-training-in-hyderabad' };
  assert.equal(w.buildWaText({ ...ai, channel: 'G' }), "Hi, I'd like fees and next batch dates for AI Foundation (ref W-GENAI-G)");
  const aiFlat = { pathname: '/artificial-intelligence-training-institute-in-hyderabad', courseName: 'Artificial Intelligence (AI) Training', courseSlug: 'artificial-intelligence-training-institute-in-hyderabad' };
  assert.equal(w.buildWaText({ ...aiFlat, channel: 'D' }), "Hi, I'd like fees and next batch dates for Artificial Intelligence (AI) Training (ref W-GENAI-D)");

  // Rendered before the page has said which course it is (the general text), then named: course form, same code.
  const general = w.waHrefWithRef('https://wa.me/919999999999', { pathname: kube.pathname, channel: 'D' });
  assert.equal(textOf(general), "Hi, I'd like to know about courses and batches (ref W-GEN-D)");
  assert.equal(textOf(w.waHrefWithRef(general, { ...kube, channel: 'A' })), "Hi, I'd like fees and next batch dates for Kubernetes & Docker Training (ref W-GEN-A)");
  // A link that already names a course keeps it; only the channel changes.
  const batchCard = w.waHrefWithRef('https://wa.me/919999999999', { pathname: '/batches', courseName: 'Python Full Stack', channel: 'D' });
  assert.equal(textOf(w.waHrefWithRef(batchCard, { ...kube, channel: 'S' })), "Hi, I'd like fees and next batch dates for Python Full Stack (ref W-GEN-S)");
  // Off a course page nothing is named.
  assert.equal(textOf(w.waHrefWithRef(general, { pathname: '/blog/x', channel: 'R' })), "Hi, I'd like to know about courses and batches (ref W-GEN-R)");
  assert.equal(w.isGeneralWaText("Hi, I'd like to know about courses and batches (ref W-GEN-D)"), true);
  assert.equal(w.isGeneralWaText("Hi, I'd like fees and next batch dates for X (ref W-GEN-D)"), false);
});

// A stand-in for the clicked element: closest() gives the link, which keeps its href.
function fakeLink(href, attrs = {}) {
  const link = {
    href,
    getAttribute: (n) => (n === 'href' ? link.href : attrs[n] ?? null),
    setAttribute: (n, v) => { if (n === 'href') link.href = v; },
  };
  return { link, target: { closest: () => link } };
}

test('click listener: plain wa.me links on a course page name the course; links that name one keep it', () => {
  const path = '/courses/devops-multi-cloud/kubernetes-docker-devops-training-in-hyderabad';
  const base = 'https://wa.me/919999999999?text=';
  const generalText = "Hi, I'd like to know about courses and batches (ref W-GEN-D)";
  const ownText = "Hi, I'd like fees and next batch dates for Python Full Stack (ref W-GEN-D)";

  pc.setPageCourse({ name: 'Kubernetes & Docker Training', slug: 'kubernetes-docker-devops-training-in-hyderabad' });
  try {
    const plain = fakeLink(base + encodeURIComponent(generalText));
    il.applyWaRef(plain.target, path);
    assert.equal(textOf(plain.link.href), "Hi, I'd like fees and next batch dates for Kubernetes & Docker Training (ref W-GEN-D)");

    const named = fakeLink(base + encodeURIComponent(ownText));
    il.applyWaRef(named.target, path);
    assert.equal(textOf(named.link.href), ownText);

    const tagged = fakeLink(base + encodeURIComponent(generalText), { 'data-wa-course': 'Azure DevOps Training', 'data-course': 'azure-devops-training' });
    il.applyWaRef(tagged.target, path);
    assert.equal(textOf(tagged.link.href), "Hi, I'd like fees and next batch dates for Azure DevOps Training (ref W-AZDEVOPS-D)");
  } finally {
    pc.setPageCourse(null);
  }
  // Not on a course page: the general text stays general.
  const off = fakeLink(base + encodeURIComponent(generalText));
  il.applyWaRef(off.target, '/blog/how-to-choose');
  assert.equal(textOf(off.link.href), generalText);
});

test('wiring: every wa.me builder uses the standard text; mobile hero button; schema names', () => {
  assert.match(read('src/components/WhatsAppLink.tsx'), /waHrefWithRef\(/);
  assert.match(read('src/components/WhatsAppLink.tsx'), /usePageCourse\(\)/);
  assert.match(read('src/lib/intent-listener.ts'), /applyWaRef\(/);
  assert.match(read('src/lib/intent-listener.ts'), /getPageCourse\(\)/);
  assert.match(read('src/components/WhatsAppWidget.tsx'), /buildWaText\(/);
  assert.match(read('src/components/WhatsAppWidget.tsx'), /getPageCourse\(\)/);
  // every course page type says which course it is, and the legacy /courses/<slug> page has the hero button too
  for (const f of ['src/components/LandingPageTemplate.tsx', 'src/app/courses/[slug]/[courseSlug]/page.tsx', 'src/app/courses/[slug]/page.tsx']) {
    assert.match(read(f), /<PageCourse name=\{course\.title\} slug=\{course\.slug\} \/>/, f);
    assert.match(read(f), /<MobileWaFees courseName=\{course\.title\} courseSlug=\{course\.slug\} \/>/, f);
  }
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
