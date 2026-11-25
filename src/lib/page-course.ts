/* -------------------------------------------------------------------------- */
/*  The course the visitor is looking at, for the WhatsApp links that live in  */
/*  the site chrome (header, footer, sticky bar, widget) and so cannot be told */
/*  by the page. A course page renders <PageCourse>, which sets it on mount    */
/*  and clears it on unmount; those links then name the course in their        */
/*  prefill, whether or not the course has its own ref code (GEN).             */
/*                                                                             */
/*  Browser-only state; no React here so it is unit-tested directly            */
/*  (scripts/test/wa-ref.test.mjs). The hook is lib/use-page-course.           */
/* -------------------------------------------------------------------------- */

export interface PageCourseInfo {
  /** The course's own name, as the page's buttons use it. */
  name: string;
  slug?: string;
}

let current: PageCourseInfo | null = null;
const listeners = new Set<() => void>();

/** Sets (or, with null, clears) the course page being viewed. */
export function setPageCourse(next: PageCourseInfo | null): void {
  const clean = next && next.name.trim() ? { name: next.name.trim(), slug: next.slug || undefined } : null;
  if (clean?.name === current?.name && clean?.slug === current?.slug) return;
  current = clean;
  listeners.forEach((l) => l());
}

export function getPageCourse(): PageCourseInfo | null {
  return current;
}

export function subscribePageCourse(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
