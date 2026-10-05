// Single source of truth for flat-legacy landing page URLs
// (e.g. /aws-training-institute-in-hyderabad) and for the one canonical URL of
// every course. Used by course canonicals, JSON-LD, the sitemap and every
// internal course link (through src/lib/course-canonical.ts).
// Dependency-free (unit-tested in scripts/test/flat-url.test.mjs).
export function getFlatCourseUrl(flatSlug: string): string {
  return `/${flatSlug}`
}

/**
 * Flat pages that are NOT the canonical URL of the course they render: the
 * course keeps its own /courses URL and the flat page stays a separate,
 * self-canonical page. /ccna-training-institute-in-hyderabad renders the
 * Network Security course, which isn't a CCNA course (row 21, kept as it is).
 */
export const FLAT_PAGES_NOT_CANONICAL = new Set<string>(['ccna-training-institute-in-hyderabad'])

/**
 * The flat landing page that is the canonical URL of a course: the SLUG_MAP
 * key (flat slug → DB course slug) that renders this course record, unless
 * that flat page is listed in FLAT_PAGES_NOT_CANONICAL. Undefined: the course
 * has no flat page and is canonical at its own /courses URL.
 */
export function flatSlugForCourse(courseSlug: string, slugMap: Readonly<Record<string, string>>): string | undefined {
  for (const [flat, rendered] of Object.entries(slugMap)) {
    if (rendered === courseSlug && !FLAT_PAGES_NOT_CANONICAL.has(flat)) return flat
  }
  return undefined
}

/**
 * Canonical path of a course: its flat landing page when there is one
 * (one URL per course: /courses/<slug> and /courses/<cat>/<slug> both point
 * there), otherwise ownPath (the getCourseUrl() form, the one in the sitemap).
 */
export function canonicalCoursePath(slug: string, ownPath: string, slugMap: Readonly<Record<string, string>>): string {
  const flat = flatSlugForCourse(slug, slugMap)
  return flat ? getFlatCourseUrl(flat) : ownPath
}

/**
 * For hard-coded course links (static page data): a /courses/<slug> or
 * /courses/<cat>/<slug> path whose course has a flat canonical becomes that
 * flat URL; any other path is returned unchanged.
 */
export function canonicalCourseHref(path: string, slugMap: Readonly<Record<string, string>>): string {
  const m = path.match(/^\/courses\/(?:[a-z0-9-]+\/)?([a-z0-9-]+)\/?$/)
  if (!m) return path
  const flat = flatSlugForCourse(m[1], slugMap)
  return flat ? getFlatCourseUrl(flat) : path
}

/**
 * The /courses URLs the sitemap lists: one per course, at its canonical path;
 * a course whose canonical is a flat page is left out here (the flat page is
 * listed with the other SLUG_MAP pages).
 */
export function sitemapCoursePaths<T extends { slug: string }>(
  courses: ReadonlyArray<T>,
  ownPath: (course: T) => string,
  slugMap: Readonly<Record<string, string>>,
): Array<{ course: T; path: string }> {
  return courses
    .map((course) => ({ course, path: canonicalCoursePath(course.slug, ownPath(course), slugMap) }))
    .filter(({ path }) => path.startsWith('/courses/'))
}
