// Run with: npm test   (Node's built-in runner; Node 24 imports .ts directly)
// One URL per course (A4): src/lib/flat-url.ts + the real SLUG_MAP (src/lib/slug-map.ts).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  canonicalCoursePath,
  canonicalCourseHref,
  flatSlugForCourse,
  sitemapCoursePaths,
  FLAT_PAGES_NOT_CANONICAL,
} from '../../src/lib/flat-url.ts';
import { SLUG_MAP } from '../../src/lib/slug-map.ts';

// The 23-row table (4 Oct), after A4: flat page → the course it renders → that course's canonical.
// Rows 1–5, 7–20, 22, 23: the flat URL. #6: remapped to the AWS DevOps record. #21 CCNA: unchanged.
const ROWS = [
  [1, 'artificial-intelligence-training-institute-in-hyderabad', 'artificial-intelligence-ai-training-hyderabad'],
  [2, 'azure-devops-training-institute-in-hyderabad', 'azure-devops-training-in-hyderabad'],
  [3, 'digital-marketing-training-institute-in-hyderabad', 'digital-marketing-training-in-hyderabad'],
  [4, 'power-bi-training-institute-in-hyderabad', 'power-bi-training-in-hyderabad'],
  [5, 'aws-training-institute-in-hyderabad', 'aws-solutions-architect-training-in-hyderabad'],
  [6, 'aws-devops-training-institute-in-hyderabad', 'aws-devops-training-institute-in-hyderabad'],
  [7, 'azure-training-institute-in-hyderabad', 'azure-administrator-training-in-hyderabad'],
  [8, 'big-data-training-institute-in-hyderabad', 'apache-spark-training-in-hyderabad'],
  [9, 'communication-skills-training-in-hyderabad', 'business-communication-english-training-in-hyderabad'],
  [10, 'data-engineering-training-institute-in-hyderabad', 'data-engineering-python-training-in-hyderabad'],
  [11, 'google-cloud-training-institute-in-hyderabad', 'google-cloud-engineer-training-in-hyderabad'],
  [12, 'java-training-institute-in-hyderabad', 'full-stack-java-developer-training-in-hyderabad'],
  [13, 'python-training-institute-in-hyderabad', 'python-programming-training-in-hyderabad'],
  [14, 'sql-training-institute-in-hyderabad', 'sql-data-analytics-training-hyderabad'],
  [15, 'ms-office-training-institute-in-hyderabad', 'ms-office-advanced-excel'],
  [16, 'soft-skills-training-institute-in-hyderabad', 'soft-skills-personality-development'],
  [17, 'spoken-english-training-institute-in-hyderabad', 'spoken-english-communication'],
  [18, 'tally-erp-training-institute-in-hyderabad', 'tally-erp-prime-accounting'],
  [19, 'linux-administration-training-institute-in-hyderabad', 'linux-shell-scripting-training-in-hyderabad'],
  [20, 'azure-data-engineer-training-institute-in-hyderabad', 'azure-data-factory-training-in-hyderabad'],
  [21, 'ccna-training-institute-in-hyderabad', 'network-security-training-in-hyderabad'],
  [22, 'python-full-stack-training-institute-in-hyderabad', 'full-stack-python-training-in-hyderabad'],
  [23, 'salesforce-training-institute-in-hyderabad', 'salesforce-admin-developer-training-in-hyderabad'],
];

test('SLUG_MAP: every flat page renders a different course record (one flat page per course)', () => {
  const targets = Object.values(SLUG_MAP);
  assert.equal(new Set(targets).size, targets.length, 'two flat pages render the same course');
  assert.equal(Object.keys(SLUG_MAP).length, 30);
});

for (const [row, flat, course] of ROWS) {
  test(`row ${row}: /${flat}`, () => {
    assert.equal(SLUG_MAP[flat], course, `row ${row}: the flat page renders ${course}`);
    // Both /courses forms of the record point at one URL.
    const plain = `/courses/${course}`;
    const nested = `/courses/some-category/${course}`;
    if (row === 21) {
      assert.ok(FLAT_PAGES_NOT_CANONICAL.has(flat));
      assert.equal(canonicalCoursePath(course, plain, SLUG_MAP), plain, 'CCNA: the course keeps its own /courses URL');
      return;
    }
    assert.equal(canonicalCoursePath(course, plain, SLUG_MAP), `/${flat}`);
    assert.equal(canonicalCoursePath(course, nested, SLUG_MAP), `/${flat}`);
    assert.equal(canonicalCourseHref(nested, SLUG_MAP), `/${flat}`);
  });
}

test('#6: the AWS DevOps flat page renders the AWS DevOps record; its nested URL points to the flat page', () => {
  const slug = 'aws-devops-training-institute-in-hyderabad';
  assert.equal(SLUG_MAP[slug], slug);
  assert.equal(canonicalCoursePath(slug, `/courses/devops-multi-cloud/${slug}`, SLUG_MAP), `/${slug}`);
  // Kubernetes & Docker no longer has a flat page: canonical at its own /courses URL (the sitemap form).
  const k8s = '/courses/devops-multi-cloud/kubernetes-docker-devops-training-in-hyderabad';
  assert.equal(flatSlugForCourse('kubernetes-docker-devops-training-in-hyderabad', SLUG_MAP), undefined);
  assert.equal(canonicalCoursePath('kubernetes-docker-devops-training-in-hyderabad', k8s, SLUG_MAP), k8s);
});

test('the 7 other same-record flat pages are canonical for their course too (cyber security, software testing, SEO, …)', () => {
  for (const flat of Object.keys(SLUG_MAP).filter((k) => SLUG_MAP[k] === k)) {
    assert.equal(canonicalCoursePath(flat, `/courses/${flat}`, SLUG_MAP), `/${flat}`, flat);
  }
});

test('a course without a flat page keeps its own URL; non-course paths are untouched', () => {
  const own = '/courses/human-resource/hr-recruitment-training-in-hyderabad';
  assert.equal(canonicalCoursePath('hr-recruitment-training-in-hyderabad', own, SLUG_MAP), own);
  assert.equal(canonicalCourseHref(own, SLUG_MAP), own);
  for (const p of ['/courses', '/courses/cloud-computing', '/blog/x', '#', '/courses/a/b/c']) {
    assert.equal(canonicalCourseHref(p, SLUG_MAP), p, p);
  }
});

test('sitemap: no course appears under two URLs', () => {
  // Every SLUG_MAP course plus courses without a flat page, each published under its getCourseUrl() form.
  const courses = [
    ...Object.values(SLUG_MAP).map((slug, i) => ({ slug, own: i % 2 ? `/courses/${slug}` : `/courses/cat/${slug}` })),
    { slug: 'kubernetes-docker-devops-training-in-hyderabad', own: '/courses/devops-multi-cloud/kubernetes-docker-devops-training-in-hyderabad' },
    { slug: 'hr-recruitment-training-in-hyderabad', own: '/courses/human-resource/hr-recruitment-training-in-hyderabad' },
  ];
  const listed = sitemapCoursePaths(courses, (c) => c.own, SLUG_MAP);
  // Group 1 lists every flat page; group 6 lists the /courses URLs.
  const urlsPerCourse = new Map();
  const add = (slug, url) => urlsPerCourse.set(slug, [...(urlsPerCourse.get(slug) ?? []), url]);
  for (const [flat, course] of Object.entries(SLUG_MAP)) if (!FLAT_PAGES_NOT_CANONICAL.has(flat)) add(course, `/${flat}`);
  for (const { course, path } of listed) add(course.slug, path);
  for (const [slug, urls] of urlsPerCourse) assert.equal(urls.length, 1, `${slug}: ${urls.join(', ')}`);
  assert.equal(urlsPerCourse.size, courses.length);
  // The flat-mapped courses are not listed at /courses (except CCNA's network security course).
  assert.deepEqual(listed.map((l) => l.course.slug).filter((s) => Object.values(SLUG_MAP).includes(s)), ['network-security-training-in-hyderabad']);
});
