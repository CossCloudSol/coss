// Run with: npm test. JSON-LD builders (item 9): src/lib/structured-data.ts.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { registerHooks } from 'node:module';
import { pathToFileURL } from 'node:url';

registerHooks({
  resolve(spec, ctx, next) {
    if (spec.startsWith('@/')) return next(pathToFileURL(path.resolve('src', `${spec.slice(2)}.ts`)).href, ctx);
    return next(spec, ctx);
  },
});
const sd = await import('../../src/lib/structured-data.ts');
const { ORG_ID, SITE_URL } = sd;

// Batch.schedule values on production (7 Oct): every one must parse.
const LIVE_SCHEDULES = [
  'Mon to Friday 2PM TO 4PM', 'Mon-Sat 7PM-8PM', 'Mon-Sat 7AM To 8AM', 'Weekdays 6PM–9PM', 'WeekDays 5PM TO 6PM',
  'Mon To Fri 10AM TO 12PM', 'Mon to Sat - 07AM TO 08AM', 'Weekdays 6PM To 7PM', 'Mon-Sat 5pm to 6pm',
  'Mon-Friday 10AM TO 11AM', 'Mon-Sat 5PM-6PM', 'Mon-Sat 10AM TO 11AM', 'Mon-Sat 11AM TO 12PM', 'Mon-Fri 4PM TO 5PM', 'Mon-Sat 10AM-11AM',
];

test('parseBatchSchedule: every live schedule parses', () => {
  for (const s of LIVE_SCHEDULES) assert.ok(sd.parseBatchSchedule(s), s);
  assert.deepEqual(sd.parseBatchSchedule('Mon to Friday 2PM TO 4PM'), {
    byDay: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], startTime: '14:00', endTime: '16:00', minutes: 120,
  });
  assert.deepEqual(sd.parseBatchSchedule('Mon-Sat 11AM TO 12PM'), {
    byDay: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'], startTime: '11:00', endTime: '12:00', minutes: 60,
  });
  assert.equal(sd.parseBatchSchedule('Weekdays 6PM–9PM').minutes, 180);
  assert.equal(sd.parseBatchSchedule('Weekend 10:30AM-1:30PM').startTime, '10:30');
});

test('parseBatchSchedule: unreadable input gives null, never a guess', () => {
  for (const s of ['', null, 'Flexible timings', 'Mon-Sat', '7PM-8PM', 'Mon-Sat 8PM-7PM', 'Sat-Mon 7PM-8PM', 'Mon-Sat 13PM-14PM']) {
    assert.equal(sd.parseBatchSchedule(s), null, String(s));
  }
});

test('countSessions / endFromDuration', () => {
  const start = new Date('2026-10-05T00:00:00Z'); // a Monday
  assert.equal(sd.countSessions(start, new Date('2026-10-11T00:00:00Z'), ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']), 6);
  assert.equal(sd.countSessions(start, new Date('2026-10-18T00:00:00Z'), ['Saturday', 'Sunday']), 4);
  assert.equal(sd.endFromDuration(start, '2 Months').toISOString().slice(0, 10), '2026-12-05');
  assert.equal(sd.endFromDuration(start, '45 Days').toISOString().slice(0, 10), '2026-11-19');
  assert.equal(sd.endFromDuration(start, '6 weeks').toISOString().slice(0, 10), '2026-11-16');
  assert.equal(sd.endFromDuration(start, 'Self-paced'), null);
});

const CENTRES = {
  dilsukhnagar: { name: 'Coss Cloud Solutions — Dilsukhnagar', streetAddress: 'Flat No. 109', addressLocality: 'Dilsukhnagar, Hyderabad', addressRegion: 'Telangana', postalCode: '500060' },
};

test('courseNode: @id, provider reference, INR price, instances from batches', () => {
  const url = `${SITE_URL}/aws-training-institute-in-hyderabad`;
  const node = sd.courseNode({
    url, name: 'AWS Training', description: 'AWS course.', price: 30000, duration: '2 Months', centres: CENTRES,
    batches: [
      { batchName: 'AWS Oct', mode: 'Classroom', centre: 'Dilsukhnagar', startDate: '2026-10-05T00:00:00Z', endDate: null, schedule: 'Mon-Sat 7PM-8PM' },
      { mode: 'Online', centre: null, startDate: '2026-10-12', endDate: '2026-10-17', schedule: 'Flexible' },
    ],
  });
  assert.equal(node['@id'], `${url}#course`);
  assert.deepEqual(node.provider, { '@id': ORG_ID });
  assert.deepEqual(node.offers, { '@type': 'Offer', category: 'Paid', price: 30000, priceCurrency: 'INR', url });
  const [a, b] = node.hasCourseInstance;
  assert.equal(a.courseMode, 'Onsite');
  assert.equal(a.startDate, '2026-10-05');
  assert.equal(a.endDate, undefined, 'no end date invented: the duration only sizes the schedule');
  assert.equal(a.location.address.postalCode, '500060');
  assert.equal(a.courseSchedule.duration, 'PT1H');
  assert.equal(a.courseSchedule.repeatCount, 54); // Mon–Sat, 5 Oct → 5 Dec 2026: 62 days − 8 Sundays
  assert.equal(a.courseWorkload, 'PT54H');
  assert.equal(b.courseMode, 'Online');
  assert.equal(b.location, undefined);
  assert.equal(b.courseSchedule, undefined, 'unparseable schedule: no schedule');
});

test('courseNode: no price → no price fields; no batches → no hasCourseInstance', () => {
  const node = sd.courseNode({ url: `${SITE_URL}/x`, name: 'X', description: 'd', price: null, batches: [], centres: {} });
  assert.deepEqual(node.offers, { '@type': 'Offer', category: 'Paid', url: `${SITE_URL}/x` });
  assert.equal('hasCourseInstance' in node, false);
});

test('faqPage / breadcrumbList / collectionPage / jsonLdGraph', () => {
  const url = `${SITE_URL}/courses/cloud-computing`;
  assert.equal(sd.faqPage(url, []), null);
  assert.equal(sd.faqPage(url, [{ q: 'Q1', a: 'A1' }, { q: 'Q2', a: 'A2' }]).mainEntity.length, 2);
  const crumbs = sd.breadcrumbList(url, [{ name: 'Home', url: SITE_URL }, { name: 'Courses', url: `${SITE_URL}/courses` }]);
  assert.deepEqual(crumbs.itemListElement.map((i) => i.position), [1, 2]);
  const [page, list] = sd.collectionPage({ url, name: 'Cloud Computing', items: [{ name: 'AWS', url: `${SITE_URL}/aws` }] });
  assert.equal(page['@type'], 'CollectionPage');
  assert.deepEqual(page.mainEntity, { '@id': `${url}#itemlist` });
  assert.equal(list.numberOfItems, 1);
  assert.equal(sd.jsonLdGraph([null, false]), null);
  assert.deepEqual(sd.jsonLdGraph([crumbs, null])['@graph'], [crumbs]);
});

test('blogPosting: image, publisher logo, mainEntityOfPage; no #organization redeclared', () => {
  const url = `${SITE_URL}/blog/x`;
  const node = sd.blogPosting({ url, headline: 'H'.repeat(130), datePublished: '2026-01-01' });
  assert.deepEqual(node.mainEntityOfPage, { '@type': 'WebPage', '@id': url });
  assert.deepEqual(node.image, [`${SITE_URL}/og-image.jpg`]);
  assert.equal(node.publisher.logo.url, `${SITE_URL}/logo.png`);
  assert.equal(node.publisher['@id'], undefined);
  assert.ok(node.headline.length <= 110);
  assert.equal(node.dateModified, '2026-01-01');
});

test('jobPosting: valid employmentType, validThrough, identifier', () => {
  assert.equal(sd.employmentType('Full Time'), 'FULL_TIME');
  assert.equal(sd.employmentType('Part Time'), 'PART_TIME');
  assert.equal(sd.employmentType('Internship'), 'INTERN');
  assert.equal(sd.employmentType('Contract'), 'CONTRACTOR');
  assert.equal(sd.employmentType('Something'), undefined);
  const base = { url: `${SITE_URL}/jobs/x`, id: 'job1', title: 'T', description: 'D', company: 'C', location: 'Hyderabad', type: 'Internship', mode: 'On-site', postedAt: '2026-10-01T00:00:00Z' };
  const job = sd.jobPosting(base);
  assert.equal(job.employmentType, 'INTERN');
  assert.deepEqual(job.identifier, { '@type': 'PropertyValue', name: 'Coss Cloud Solutions', value: 'job1' });
  assert.equal(job.validThrough, '2026-11-30T00:00:00.000Z');
  assert.equal(sd.jobPosting({ ...base, expiresAt: '2026-10-20T00:00:00Z' }).validThrough, '2026-10-20T00:00:00.000Z');
  const remote = sd.jobPosting({ ...base, mode: 'Remote' });
  assert.equal(remote.jobLocationType, 'TELECOMMUTE');
  assert.equal(remote.jobLocation, undefined);
});

// Shapes as seeded in src/lib/seo-seed.ts (bc() → BreadcrumbList).
const bc = (...items) => ({ '@type': 'BreadcrumbList', itemListElement: items.map((x, i) => ({ '@type': 'ListItem', position: i + 1, ...x })) });
const S = SITE_URL;

test('filterSeedSchema: keeps page nodes, drops #organization / Course / Event / FAQ / ratings, untrails URLs', () => {
  const placements = JSON.stringify({ '@context': 'https://schema.org', '@graph': [bc({ name: 'Home', item: `${S}/` }, { name: 'Placements', item: `${S}/placements/` }), { '@type': 'EducationalOrganization', '@id': ORG_ID, name: 'Coss Cloud Solutions' }] });
  const out = sd.filterSeedSchema(placements);
  assert.equal(out['@graph'].length, 1);
  assert.equal(out['@graph'][0]['@type'], 'BreadcrumbList');
  assert.equal(out['@graph'][0].itemListElement[1].item, `${S}/placements`);
  assert.equal(out['@graph'][0].itemListElement[0].item, `${S}/`, 'the home URL keeps its slash');

  const home = JSON.stringify({ '@context': 'https://schema.org', '@graph': [bc({ name: 'Home', item: `${S}/` }), { '@type': 'OfferCatalog', itemListElement: [] }] });
  assert.equal(sd.filterSeedSchema(home), null, 'OfferCatalog dropped; a one-step breadcrumb is not kept');

  const demo = JSON.stringify({ '@graph': [{ '@type': 'Event', name: 'Free Demo' }] });
  assert.equal(sd.filterSeedSchema(demo), null);

  const about = JSON.stringify({ '@context': 'https://schema.org', '@type': 'AboutPage', url: `${S}/about-us/`, breadcrumb: bc({ name: 'Home', item: `${S}/` }, { name: 'About Us', item: `${S}/about-us/` }), mainEntity: { '@id': ORG_ID } });
  const a = sd.filterSeedSchema(about)['@graph'];
  assert.deepEqual(a.map((n) => n['@type']), ['BreadcrumbList', 'AboutPage']);
  assert.equal(a[1].url, `${S}/about-us`);
  assert.equal(a[1].breadcrumb, undefined);

  assert.equal(sd.filterSeedSchema(JSON.stringify({ '@type': 'FAQPage', mainEntity: [] })), null);
  assert.equal(sd.filterSeedSchema(JSON.stringify({ '@type': 'WebPage', aggregateRating: { ratingValue: 5 } })), null);
  assert.equal(sd.filterSeedSchema('{not json'), null);
  assert.equal(sd.filterSeedSchema(''), null);
});
