import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { buildPageMetadata } from '@/lib/get-page-seo';
import { BLOG_CATEGORIES, BlogIndexView, blogPageCount, getBlogIndexData } from '../../../blog-index';

/**
 * Internal target of the /blog query-string rewrites in next.config.mjs:
 *   /blog?category=DevOps&page=2 → /blog/filter/DevOps/2
 *   /blog?category=DevOps        → /blog/filter/DevOps/1
 *   /blog?page=2                 → /blog/filter/All/2
 * Visitors and crawlers only ever see the /blog?… URLs. Every combination is
 * prerendered here, so these views are served from cache instead of rendering
 * on each request as the old searchParams-based /blog did.
 */
export const revalidate = 86400;

type Params = { category: string; page: string };

function decodeParam(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function resolve(params: Params): { category: string; page: number } | null {
  const category = decodeParam(params.category);
  if (!BLOG_CATEGORIES.includes(category)) return null;
  if (!/^\d{1,3}$/.test(params.page)) return null;
  const page = Number(params.page);
  if (page < 1) return null;
  return { category, page };
}

export async function generateStaticParams(): Promise<Params[]> {
  try {
    const data = await getBlogIndexData();
    return BLOG_CATEGORIES.flatMap((category) =>
      Array.from({ length: blogPageCount(data, category) }, (_, i) => ({
        category,
        page: String(i + 1),
      })),
    );
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const base = await buildPageMetadata('blog');
  const resolved = resolve(params);
  // Category-filtered views are near-duplicates of /blog: crawlable (follow)
  // but not indexed. Canonical is already the clean /blog (buildPageMetadata
  // never includes query params). Page-only views keep the /blog defaults,
  // exactly as before.
  if (resolved && resolved.category !== 'All') {
    return { ...base, robots: { index: false, follow: true } };
  }
  return base;
}

export default async function BlogFilterPage({ params }: { params: Params }) {
  const resolved = resolve(params);
  if (!resolved) notFound();
  const data = await getBlogIndexData();
  if (resolved.page > blogPageCount(data, resolved.category)) notFound();
  return <BlogIndexView activeCategory={resolved.category} currentPage={resolved.page} />;
}
