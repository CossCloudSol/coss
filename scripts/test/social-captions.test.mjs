// Run with: npm test   (Node's built-in runner; Node 24 imports .ts directly)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildCaption,
  checkPost,
  findClaimViolations,
  normalizeHashtags,
  parseChannels,
  ruleErrors,
  stripLinks,
  utmCampaign,
  withUtm,
  IG_CTA,
} from '../../src/lib/social-captions.ts';

const base = { content: 'New AWS DevOps batch starts Monday.', channels: ['linkedin'], hasCourse: false };

test('parseChannels keeps known channels in a fixed order', () => {
  assert.deepEqual(parseChannels('instagram, linkedin,,twitter,FACEBOOK'), ['linkedin', 'facebook', 'instagram']);
  assert.deepEqual(parseChannels(''), []);
  assert.deepEqual(parseChannels(null), []);
});

test('UTM tags go on our own links only, replacing any existing ones', () => {
  const u = new URL(withUtm('https://www.cosscloudsol.com/courses/devops/aws?ref=x&utm_source=old', 'facebook', 'aws'));
  assert.equal(u.searchParams.get('utm_source'), 'facebook');
  assert.equal(u.searchParams.get('utm_medium'), 'social');
  assert.equal(u.searchParams.get('utm_campaign'), 'aws');
  assert.equal(u.searchParams.get('ref'), 'x');
  assert.equal(withUtm('https://example.com/a', 'linkedin', 'a'), 'https://example.com/a');
  assert.equal(withUtm('not a url', 'linkedin', 'a'), 'not a url');
  assert.equal(utmCampaign('aws-devops'), 'aws-devops');
  assert.equal(utmCampaign(null, 'https://www.cosscloudsol.com/blog/Kubernetes-Guide/'), 'kubernetes-guide');
  assert.equal(utmCampaign(null, null), 'social');
});

test('hashtags are normalised and deduplicated', () => {
  assert.deepEqual(normalizeHashtags('#AWS, devops  #DevOps cloud-computing ##k8s'), ['#AWS', '#devops', '#cloudcomputing', '#k8s']);
  assert.deepEqual(normalizeHashtags(''), []);
});

test('Instagram caption: links removed, CTA, at most 10 hashtags; others unchanged', () => {
  const content = 'Learn Terraform hands-on.\nDetails: https://www.cosscloudsol.com/courses/x?utm_source=a and www.cosscloudsol.com';
  const tags = Array.from({ length: 12 }, (_, i) => `tag${i}`).join(' ');
  const ig = buildCaption('instagram', { content, hashtags: tags });
  assert.ok(!/https?:|www\./.test(ig), ig);
  assert.ok(ig.startsWith('Learn Terraform hands-on.'));
  assert.ok(!ig.includes('Details:'), 'the label introducing the removed link goes too');
  const [, cta, hashtagLine] = ig.split('\n\n');
  assert.equal(cta, IG_CTA);
  assert.equal(hashtagLine.split(' ').length, 10);
  assert.equal(buildCaption('instagram', { content: 'Hi', hashtags: '' }), `Hi\n\n${IG_CTA}`);
  assert.equal(buildCaption('linkedin', { content: `  ${content}  `, hashtags: tags }), content);
  assert.equal(buildCaption('facebook', { content }), content);
  assert.equal(stripLinks('a  https://x.y/z  b'), 'a b');
});

test('approved claims pass', () => {
  for (const ok of [
    'Training IT professionals in Hyderabad since 2010.',
    '5,000+ students trained and 50+ hiring partners.',
    '5000+ students trained',
    'Includes 1-year LMS access.',
    'A 6-month course with placement assistance.',
  ]) {
    assert.deepEqual(findClaimViolations(ok), [], ok);
  }
});

test('banned claims are caught', () => {
  for (const bad of [
    'Placement guaranteed!',
    '100% job guarantee',
    'Assured placement after the course',
    '95% placement record',
    'Ranked #1 institute in Hyderabad',
    'The best institute in Ameerpet',
    'Top-rated DevOps training',
    'Lifetime LMS access',
    'Life-time support',
    '#getlifetimeaccess',
    '10,000+ students trained',
    '200+ hiring partners',
    '1500 students placed',
    'Since 2008',
    '15 years of experience',
  ]) {
    assert.ok(findClaimViolations(bad).length > 0, bad);
  }
});

test('LinkedIn rules are unchanged: one of image or link, alt text with an image', () => {
  assert.deepEqual(ruleErrors(checkPost(base)), []);
  assert.deepEqual(ruleErrors(checkPost({ ...base, linkUrl: 'https://www.cosscloudsol.com/x' })), []);
  assert.match(ruleErrors(checkPost({ ...base, imageUrl: 'https://i/x.png', imageAltText: 'x', linkUrl: 'https://l' })).join(), /can’t both be set/);
  assert.match(ruleErrors(checkPost({ ...base, imageUrl: 'https://i/x.png' })).join(), /Alt text is required/);
});

test('Facebook needs a course or a link', () => {
  const fb = { ...base, channels: ['facebook'] };
  assert.match(ruleErrors(checkPost(fb)).join(), /Facebook: Choose a course/);
  assert.deepEqual(ruleErrors(checkPost({ ...fb, hasCourse: true })), []);
  assert.deepEqual(ruleErrors(checkPost({ ...fb, linkUrl: 'https://www.cosscloudsol.com/x' })), []);
});

test('Instagram needs an image: a course (with a hook) or an image with alt text', () => {
  const ig = { ...base, channels: ['instagram'] };
  assert.match(ruleErrors(checkPost(ig)).join(), /Instagram needs an image/);
  assert.match(ruleErrors(checkPost({ ...ig, hasCourse: true })).join(), /hook line/);
  assert.match(ruleErrors(checkPost({ ...ig, hasCourse: true, hook: 'x'.repeat(81) })).join(), /keep it to 80/);
  assert.deepEqual(ruleErrors(checkPost({ ...ig, hasCourse: true, hook: 'Build pipelines that ship.' })), []);
  assert.match(ruleErrors(checkPost({ ...ig, imageUrl: 'https://i/x.png' })).join(), /Alt text/);
  assert.deepEqual(ruleErrors(checkPost({ ...ig, imageUrl: 'https://i/x.png', imageAltText: 'Banner' })), []);
});

test('Instagram limits: 2,200 characters and 10 hashtags', () => {
  const ig = { ...base, channels: ['instagram'], hasCourse: true, hook: 'Ship faster.' };
  assert.match(ruleErrors(checkPost({ ...ig, content: 'x'.repeat(2200) })).join(), /Instagram: Caption is .* limit is 2,200/);
  assert.match(ruleErrors(checkPost({ ...ig, hashtags: Array.from({ length: 11 }, (_, i) => `t${i}`).join(' ') })).join(), /11 hashtags/);
  // The same long text is fine on LinkedIn (3,000).
  assert.deepEqual(ruleErrors(checkPost({ ...base, content: 'x'.repeat(2500) })), []);
});

test('claims are checked in the text, hook, hashtags and alt text', () => {
  assert.match(ruleErrors(checkPost({ ...base, content: 'Placement guaranteed' })).join(), /Post text: no guarantees/);
  const ig = { ...base, channels: ['instagram'], hasCourse: true };
  assert.match(ruleErrors(checkPost({ ...ig, hook: 'Lifetime access' })).join(), /Hook: no "lifetime"/);
  assert.match(ruleErrors(checkPost({ ...ig, hook: 'Ship it', hashtags: '#100percentplacement' })).join(), /Hashtags: no percentages/);
  assert.match(ruleErrors(checkPost({ ...base, channels: [] })).join(), /at least one channel/);
});

test('channel payloads: FB links the course with UTM, IG uses the portrait banner, LI unchanged + UTM', async () => {
  const { channelPayload } = await import('../../src/lib/social-captions.ts');
  const post = { ...base, channels: ['linkedin', 'facebook', 'instagram'], hasCourse: true, hook: 'Ship it.', hashtags: '#DevOps', linkUrl: 'https://www.cosscloudsol.com/courses/devops/aws' };
  const ctx = { courseSlug: 'aws', courseTitle: 'AWS DevOps', courseUrl: 'https://www.cosscloudsol.com/courses/devops/aws', igImageUrl: 'https://www.cosscloudsol.com/course-banner/aws?s=ig' };

  const fb = channelPayload('facebook', post, ctx);
  assert.equal(fb.linkUrl, 'https://www.cosscloudsol.com/courses/devops/aws?utm_source=facebook&utm_medium=social&utm_campaign=aws');
  assert.equal(fb.imageUrl, undefined);

  const ig = channelPayload('instagram', post, ctx);
  assert.equal(ig.imageUrl, ctx.igImageUrl);
  assert.equal(ig.linkUrl, undefined);
  assert.match(ig.imageAltText, /AWS DevOps at Coss Cloud Solutions: Ship it\./);
  assert.ok(ig.text.endsWith(`${IG_CTA}\n\n#DevOps`));

  const li = channelPayload('linkedin', post, ctx);
  assert.equal(li.text, post.content);
  assert.equal(li.linkUrl, 'https://www.cosscloudsol.com/courses/devops/aws?utm_source=linkedin&utm_medium=social&utm_campaign=aws');
  assert.deepEqual(channelPayload('linkedin', { ...base, imageUrl: 'https://i/x.png', imageAltText: 'A' }), { text: base.content, imageUrl: 'https://i/x.png', imageAltText: 'A' });
  assert.deepEqual(channelPayload('linkedin', base), { text: base.content });
});

test('Instagram: a label that only introduced the removed link goes too', () => {
  const cases = [
    ['Batch starts Monday. Details: https://www.cosscloudsol.com/x', 'Batch starts Monday.'],
    ['Batch starts Monday.\nLink: https://www.cosscloudsol.com/x', 'Batch starts Monday.'],
    ['Visit: www.cosscloudsol.com', ''],
    ['Seats are limited. Register here: https://forms.gle/abc', 'Seats are limited.'],
    ['Book a free demo class: https://www.cosscloudsol.com/free-demo-class', ''],
    ['New batch!\nRegister here:\nhttps://www.cosscloudsol.com/x\nSee you there.', 'New batch!\nSee you there.'],
    ['Syllabus 👉 https://www.cosscloudsol.com/s', 'Syllabus'],
    ['Learn more - https://www.cosscloudsol.com/x', ''],
    ['Apply now → https://www.cosscloudsol.com/x', ''],
    ['Full details (link: https://www.cosscloudsol.com/x) inside.', 'Full details inside.'],
    // Kept: the word isn't introducing the link.
    ['We share the syllabus https://www.cosscloudsol.com/s on request.', 'We share the syllabus on request.'],
    ['Details matter in DevOps.', 'Details matter in DevOps.'],
  ];
  for (const [input, want] of cases) assert.equal(stripLinks(input), want, input);
  const ig = buildCaption('instagram', { content: 'AWS batch on Monday.\n\nDetails: https://www.cosscloudsol.com/x', hashtags: '#AWS' });
  assert.equal(ig, `AWS batch on Monday.\n\n${IG_CTA}\n\n#AWS`);
});

test('Instagram images are delivered as JPEG from our Cloudinary library', async () => {
  const { cloudinaryJpegUrl } = await import('../../src/lib/social-captions.ts');
  const base = 'https://res.cloudinary.com/dfditihuw/image/upload/';
  assert.equal(cloudinaryJpegUrl(`${base}v1790944861/social/instagram/abc.png`), `${base}f_jpg,q_auto,c_limit,w_1080/v1790944861/social/instagram/abc.jpg`);
  assert.equal(cloudinaryJpegUrl(`${base}f_auto,q_80/v1/x/photo.webp`), `${base}f_jpg,q_auto,c_limit,w_1080/v1/x/photo.jpg`);
  assert.equal(cloudinaryJpegUrl(`${base}social/no-version`), `${base}f_jpg,q_auto,c_limit,w_1080/social/no-version.jpg`);
  assert.equal(cloudinaryJpegUrl('https://example.com/a.png'), 'https://example.com/a.png');
});
