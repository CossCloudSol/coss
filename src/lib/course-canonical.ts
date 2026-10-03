import { getCourseUrl, type CourseUrlParams } from '@/lib/course-url';
import { SLUG_MAP } from '@/lib/get-landing-page-data';
import { canonicalCoursePath } from '@/lib/flat-url';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.cosscloudsol.com';

/**
 * The URL a course is canonical at: its own /courses URL, or the flat landing
 * page when that page renders this same course record (e.g. legacy
 * /courses/cyber-security-training-institute-in-hyderabad →
 * /cyber-security-training-institute-in-hyderabad). Used for the course
 * pages' rel=canonical and for links that leave the site (social posts).
 */
export function courseCanonicalPath(course: CourseUrlParams): string {
  return canonicalCoursePath(course.slug, getCourseUrl(course), SLUG_MAP);
}

export function courseCanonicalUrl(course: CourseUrlParams): string {
  return `${SITE_URL}${courseCanonicalPath(course)}`;
}
