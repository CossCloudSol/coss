import { getCourseUrl, type CourseUrlParams } from '@/lib/course-url';
import { SLUG_MAP } from '@/lib/slug-map';
import { canonicalCoursePath, canonicalCourseHref } from '@/lib/flat-url';
import { finalHref, settlePath } from '@/lib/redirect-resolve';
import { REDIRECTS } from '../../redirects.config.mjs';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.cosscloudsol.com';

/**
 * The one URL of a course, and the one resolver every internal course link,
 * canonical tag, og:url, sitemap entry and outbound (social) link goes through:
 * the flat landing page when one renders this course (SLUG_MAP, rule in
 * src/lib/flat-url.ts), otherwise its getCourseUrl() /courses URL. The other
 * /courses form still renders (200) and points here with rel=canonical.
 */
export function courseCanonicalPath(course: CourseUrlParams): string {
  // Followed through the redirect rules: a canonical (or an internal link) must never be a URL
  // that 308s, and must not loop back through one (Ethical Hacking: flat page -> /courses form ->
  // canonical = flat page).
  return finalHref(canonicalCoursePath(course.slug, getCourseUrl(course), SLUG_MAP), REDIRECTS);
}

/**
 * The path a course's URL settles on after redirects and flat/nested mapping. Two catalogue rows
 * with the same settled path are one page: a retired alias row and the course it redirects to.
 */
export function courseSettledPath(course: CourseUrlParams): string {
  return settlePath(canonicalCoursePath(course.slug, getCourseUrl(course), SLUG_MAP), REDIRECTS, (p) => canonicalCourseHref(p, SLUG_MAP));
}

export function courseCanonicalUrl(course: CourseUrlParams): string {
  return `${SITE_URL}${courseCanonicalPath(course)}`;
}

/** The same resolver for a hard-coded /courses/... link (static page data). */
export function canonicalCourseLink(path: string): string {
  return canonicalCourseHref(path, SLUG_MAP);
}
