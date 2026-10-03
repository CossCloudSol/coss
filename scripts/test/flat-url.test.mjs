// Run with: npm test   (Node's built-in runner; Node 24 imports .ts directly)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { canonicalCoursePath, NESTED_CANONICAL_OVERRIDES } from '../../src/lib/flat-url.ts';

// The real SLUG_MAP (flat slug → DB course slug), read as text so this test
// doesn't import Prisma: a future edit to the map is checked against these rules.
const source = readFileSync(new URL('../../src/lib/get-landing-page-data.ts', import.meta.url), 'utf8');
const mapBody = source.slice(source.indexOf('export const SLUG_MAP'), source.indexOf('\n}\n', source.indexOf('export const SLUG_MAP')));
const SLUG_MAP = Object.fromEntries([...mapBody.matchAll(/'([a-z0-9-]+)':\s*'([a-z0-9-]+)'/g)].map((m) => [m[1], m[2]]));

test('SLUG_MAP was read', () => {
  assert.ok(Object.keys(SLUG_MAP).length > 20, `parsed ${Object.keys(SLUG_MAP).length} entries`);
});

test('the 3 same-record /courses duplicates are canonical at their flat page', () => {
  for (const slug of ['cyber-security-training-institute-in-hyderabad', 'software-testing-training-institute-in-hyderabad', 'seo-training-institute-in-hyderabad']) {
    assert.equal(SLUG_MAP[slug], slug, `${slug}: the flat page renders this same course record`);
    assert.equal(canonicalCoursePath(slug, `/courses/${slug}`, SLUG_MAP), `/${slug}`);
  }
});

test('LOCKED: the AWS DevOps course keeps its own /courses URL (its flat namesake renders the Kubernetes/Docker course)', () => {
  const slug = 'aws-devops-training-institute-in-hyderabad';
  const own = '/courses/devops-multi-cloud/aws-devops-training-institute-in-hyderabad';
  assert.equal(SLUG_MAP[slug], 'kubernetes-docker-devops-training-in-hyderabad', 'if this mapping changes, revisit this canonical deliberately');
  // Canonical tag and the social-post link builder both use this.
  assert.equal(canonicalCoursePath(slug, own, SLUG_MAP), own);
});

test('a course whose flat namesake renders a different record keeps its own URL; non-flat courses too', () => {
  for (const [flat, rendered] of Object.entries(SLUG_MAP)) {
    if (rendered === flat) continue;
    assert.equal(canonicalCoursePath(flat, `/courses/x/${flat}`, SLUG_MAP), `/courses/x/${flat}`, flat);
  }
  // The course a flat page renders under another slug is a separate page (the 23-page question, unchanged here).
  assert.equal(
    canonicalCoursePath('full-stack-java-developer-training-in-hyderabad', '/courses/programming-full-stack/full-stack-java-developer-training-in-hyderabad', SLUG_MAP),
    '/courses/programming-full-stack/full-stack-java-developer-training-in-hyderabad',
  );
  assert.equal(canonicalCoursePath('hr-recruitment-training-in-hyderabad', '/courses/human-resource/hr-recruitment-training-in-hyderabad', SLUG_MAP), '/courses/human-resource/hr-recruitment-training-in-hyderabad');
});

test('the nested-canonical allowlist wins when it applies, and stays exactly one slug', () => {
  assert.equal(Object.keys(NESTED_CANONICAL_OVERRIDES).length, 1);
  const slug = 'digital-marketing-training-institute-in-hyderabad';
  assert.equal(canonicalCoursePath(slug, `/courses/digital-design/${slug}`, { [slug]: slug }), NESTED_CANONICAL_OVERRIDES[slug]);
});
