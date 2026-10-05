import { getCourseUrl, type CourseUrlParams } from '@/lib/course-url';
import { SLUG_MAP } from '@/lib/slug-map';
import { canonicalCoursePath, canonicalCourseHref } from '@/lib/flat-url';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.cosscloudsol.com';

/**
 * The one URL of a course, and the one resolver every internal course link,
 * canonical tag, og:url, sitemap entry and outbound (social) link goes through:
 * the flat landing page when one renders this course (SLUG_MAP, rule in
 * src/lib/flat-url.ts), otherwise its getCourseUrl() /courses URL. The other
 * /courses form still renders (200) and points here with rel=canonical.
 */
export function courseCanonicalPath(course: CourseUrlParams): string {
  return canonicalCoursePath(course.slug, getCourseUrl(course), SLUG_MAP);
}

export function courseCanonicalUrl(course: CourseUrlParams): string {
  return `${SITE_URL}${courseCanonicalPath(course)}`;
}

/** The same resolver for a hard-coded /courses/... link (static page data). */
export function canonicalCourseLink(path: string): string {
  return canonicalCourseHref(path, SLUG_MAP);
}
