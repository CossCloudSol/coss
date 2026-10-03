// Single source of truth for flat-legacy landing page URLs
// (e.g. /aws-training-institute-in-hyderabad). Used by the flat-legacy
// sibling strip, the blog-to-course callout and course canonicals.
// Dependency-free (unit-tested in scripts/test/flat-url.test.mjs).
export function getFlatCourseUrl(flatSlug: string): string {
  return `/${flatSlug}`
}

// Nested canonical override allowlist — EXACTLY this 1 flat slug. Each entry
// requires GSC Performance + URL Inspection evidence that the nested URL
// matches or beats the flat URL. Do NOT key this off urlType/categorySlug —
// that predicate matches 12 pages, 10 of which are unreviewed in GSC.
// ui-ux removed 2026-09-09: flat URL ranks 24.6 vs nested 36.2 (GSC, 4mo).
// The nested URL now 308s to flat, so a nested canonical would contradict it.
export const NESTED_CANONICAL_OVERRIDES: Record<string, string> = {
  'digital-marketing-training-institute-in-hyderabad':
    '/courses/digital-design/digital-marketing-training-in-hyderabad',
}

/**
 * Canonical path of a course page. Only a true duplicate moves to the flat
 * URL: the flat landing page /<slug> must render THIS course record
 * (slugMap[slug] === slug, slugMap = SLUG_MAP: flat slug → DB course slug).
 * A flat page with the same slug that renders a different record (e.g.
 * /aws-devops-training-institute-in-hyderabad renders the Kubernetes/Docker
 * course) is a different page, and the course keeps its own /courses URL.
 * NESTED_CANONICAL_OVERRIDES: the nested page is canonical (the flat page
 * points to it).
 */
export function canonicalCoursePath(slug: string, ownPath: string, slugMap: Readonly<Record<string, string>>): string {
  if (slugMap[slug] !== slug) return ownPath
  return NESTED_CANONICAL_OVERRIDES[slug] ?? getFlatCourseUrl(slug)
}
