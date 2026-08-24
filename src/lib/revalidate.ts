import { revalidatePath as nextRevalidatePath } from 'next/cache';
import { SLUG_MAP } from '@/lib/get-landing-page-data';

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

  return results;
}

interface CourseRevalidationInput {
  slug: string;
  categorySlug?: string | null;
}

/** All public paths a single course occupies — see src/lib/course-url.ts for the canonical-URL logic this mirrors. */
export function getCourseRevalidationPaths(course: CourseRevalidationInput): string[] {
  const paths = ['/courses/' + course.slug, '/courses', '/'];

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

interface BlogRevalidationInput {
  slug: string;
}

/** All public paths a single DB-backed blog post occupies. Filesystem MDX posts are not admin-editable and are out of scope. */
export function getBlogRevalidationPaths(post: BlogRevalidationInput): string[] {
  return ['/blog/' + post.slug, '/blog', '/'];
}
