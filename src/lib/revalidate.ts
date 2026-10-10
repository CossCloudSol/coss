import { revalidatePath as nextRevalidatePath, revalidateTag } from 'next/cache';
import { COURSE_CATALOG_TAG } from '@/lib/course-search';
import { prisma } from '@/lib/db';
import { SLUG_MAP } from '@/lib/get-landing-page-data';
import { pageSeoSlugToPaths } from '@/lib/page-seo-rules';

export interface RevalidateResult {
  path: string;
  ok: boolean;
  error?: string;
}

// Route templates (e.g. '/courses/[slug]/[courseSlug]') use 'layout' semantics
// under the hood and invalidate every page sharing that layout — the opposite
// of the targeted, per-entity invalidation this helper exists for. Only
// concrete resolved paths are accepted; a template is refused, not "handled".
const ROUTE_TEMPLATE_CHARS = /[[\]]/;

/**
 * Revalidates a list of literal, resolved paths. Never throws — every path
 * is attempted independently and failures are logged, not propagated, so a
 * caller mid-request (an admin save) can always safely await this without
 * risking the surrounding write.
 */
export async function revalidatePaths(paths: string[]): Promise<RevalidateResult[]> {
  const results: RevalidateResult[] = [];

  for (const path of paths) {
    if (ROUTE_TEMPLATE_CHARS.test(path)) {
      const error = 'rejected: path looks like a route template, not a resolved path';
      console.error(`[revalidate] Refused "${path}" — ${error}. This would invalidate an entire route segment instead of one page.`);
      results.push({ path, ok: false, error });
      continue;
    }

    try {
      nextRevalidatePath(path);
      results.push({ path, ok: true });
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);
      console.error(`[revalidate] Failed to revalidate "${path}"`, err);
      results.push({ path, ok: false, error });
    }
  }

  // Course and batch writes (their path lists include the search index) also
  // refresh the cached course catalogue behind the header's Explore Courses
  // menu, which every page renders.
  if (paths.includes(SEARCH_INDEX_PATH)) {
    try {
      revalidateTag(COURSE_CATALOG_TAG);
    } catch (err) {
      console.error(`[revalidate] Failed to revalidate tag "${COURSE_CATALOG_TAG}"`, err);
    }
  }

  return results;
}

interface CourseRevalidationInput {
  slug: string;
  categorySlug?: string | null;
}

/** Course search index route (src/app/api/search-index): lists every course and its next batch. */
const SEARCH_INDEX_PATH = '/api/search-index';

/** All public paths a single course occupies — see src/lib/course-url.ts for the canonical-URL logic this mirrors. */
export function getCourseRevalidationPaths(course: CourseRevalidationInput): string[] {
  const paths = ['/courses/' + course.slug, '/courses', '/', SEARCH_INDEX_PATH];

  if (course.categorySlug) {
    paths.push('/courses/' + course.categorySlug + '/' + course.slug);
    paths.push('/courses/' + course.categorySlug);
  }

  const landingSlug = Object.entries(SLUG_MAP).find(([, dbSlug]) => dbSlug === course.slug)?.[0];
  if (landingSlug) {
    paths.push('/' + landingSlug);
  }

  return paths;
}

interface BatchRevalidationInput {
  courseId: string | null;
}

/**
 * All public paths a single batch occupies: the homepage upcoming-batches
 * widget, the placements page, the free demo class page, and every path its
 * course occupies (resolved via getCourseRevalidationPaths). /batches is
 * deliberately excluded — that page fetches client-side and is already
 * always fresh.
 *
 * Never throws: a null courseId, a courseId pointing at a since-deleted
 * course, or a DB error while resolving it all just fall back to the base
 * paths. A revalidation failure must not fail the caller's write.
 */
export async function getBatchRevalidationPaths(batch: BatchRevalidationInput): Promise<string[]> {
  const paths = ['/', '/batches', '/placements', '/free-demo-class', SEARCH_INDEX_PATH];

  if (!batch.courseId) return paths;

  try {
    const course = await prisma.course.findUnique({
      where: { id: batch.courseId },
      select: { slug: true, categorySlug: true },
    });
    if (course) {
      paths.push(...getCourseRevalidationPaths(course));
    }
  } catch (err) {
    console.error(`[revalidate] Failed to resolve course for batch revalidation (courseId="${batch.courseId}")`, err);
  }

  return paths;
}

interface BlogRevalidationInput {
  slug: string;
}

/**
 * Data-cache tag on the DB post list used by the /blog index and its
 * prerendered filter/pagination views (src/app/blog/blog-index.tsx). Those
 * views are not individually revalidated by path, so every admin blog write
 * must also call revalidateTag(BLOG_POSTS_TAG).
 */
export const BLOG_POSTS_TAG = 'blog-posts';

/** All public paths a single DB-backed blog post occupies. Filesystem MDX posts are not admin-editable and are out of scope. */
export function getBlogRevalidationPaths(post: BlogRevalidationInput): string[] {
  return ['/blog/' + post.slug, '/blog', '/'];
}

/** The public path of a PageSeo row (see pageSeoSlugToPaths). */
export function getPageSeoRevalidationPaths(pageSlug: string): string[] {
  return pageSeoSlugToPaths(pageSlug);
}

/** Pages that list testimonials with page-level caching (the course and category pages refresh with the catalogue tag). */
export function getTestimonialRevalidationPaths(): string[] {
  return ['/corporate-training', '/'];
}

/** Pages that list hiring partners with page-level caching. */
export function getHiringPartnerRevalidationPaths(): string[] {
  return ['/corporate-training', '/placements', '/'];
}

/** sitemap.xml itself (PageSeo sitemap include / priority / frequency saves). */
export const SITEMAP_PATH = '/sitemap.xml';

/** The faculty roster has no per-trainer detail page — every write invalidates the same two listing pages. */
export function getTrainerRevalidationPaths(): string[] {
  return ['/faculty', '/about-us'];
}

/** A job's detail page and the listing; old slug too when an edit changed it. */
export function getJobRevalidationPaths(job: { slug: string }, previousSlug?: string | null): string[] {
  const paths = ['/jobs', `/jobs/${job.slug}`];
  if (previousSlug && previousSlug !== job.slug) paths.push(`/jobs/${previousSlug}`);
  return paths;
}
