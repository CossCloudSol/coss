import 'server-only';
import { COURSES } from '@/data/courses-data';

export interface CourseGroup {
  category: string;
  courses: Array<{ shortTitle: string; slug: string }>;
}

/**
 * Course select options grouped by category (categories and courses both
 * alphabetical) for client components such as WhatsAppWidget and
 * DemoSidebarForm.
 *
 * Pass this down as a prop from a server component. Importing courses-data.ts
 * from a 'use client' module bundles the entire catalog — descriptions,
 * curricula, meta tags — into the page JavaScript (it was ~12 kB gzipped on
 * every page via the root layout's WhatsAppWidget).
 */
export const COURSE_GROUPS: CourseGroup[] = (() => {
  const map = new Map<string, Array<{ shortTitle: string; slug: string }>>();
  for (const c of COURSES) {
    if (!map.has(c.category)) map.set(c.category, []);
    map.get(c.category)!.push({ shortTitle: c.shortTitle, slug: c.slug });
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([category, courses]) => ({
      category,
      courses: [...courses].sort((a, b) => a.shortTitle.localeCompare(b.shortTitle)),
    }));
})();
