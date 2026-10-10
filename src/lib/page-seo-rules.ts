// Small metadata rules shared by src/lib/get-page-seo.ts (item 13).
// Dependency-free (unit-tested in scripts/test/metadata-rules.test.mjs).

/** PageSeo slugs whose page lives at a different path (the default canonical uses the path). */
export const PAGE_SLUG_PATHS: Readonly<Record<string, string>> = {
  about: 'about-us',
  contact: 'contact-us',
};

/**
 * The public path of a PageSeo row, for on-demand revalidation after an admin SEO / schema save
 * (the page reads its PageSeo row at render time, so only a revalidation shows an edit before the
 * page's own timer runs out): 'home' → '/', 'about' → '/about-us', 'blog/x' → '/blog/x',
 * '/foo' or 'foo' → '/foo'. Returns [] for a slug that can't be a concrete path.
 */
export function pageSeoSlugToPaths(pageSlug: string): string[] {
  const slug = pageSlug.trim().replace(/^\/+|\/+$/g, '');
  if (slug === '' || slug === 'home') return ['/'];
  if (/[[\]]/.test(slug)) return [];
  return ['/' + (PAGE_SLUG_PATHS[slug] ?? slug)];
}

/**
 * OG image priority: an admin's own per-page image, then the page's image (course
 * banner, post thumbnail), then the site default. A stored per-page value equal to the
 * site default doesn't count as the admin's own: the SEO seed wrote the default into
 * every row, which would otherwise hide every page's real image.
 */
export function pickOgImage(
  stored: string | null | undefined,
  pageImage: string | undefined,
  siteDefault: string | null | undefined,
  builtInDefault: string,
): string {
  const fallback = siteDefault || builtInDefault;
  const isDefault = (u: string) => u === fallback || u === builtInDefault;
  if (stored && !isDefault(stored)) return stored;
  return pageImage ?? stored ?? fallback;
}
