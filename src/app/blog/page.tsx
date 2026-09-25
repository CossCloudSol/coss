import type { Metadata } from 'next';
import { buildPageMetadata } from '@/lib/get-page-seo';
import { BlogIndexView } from './blog-index';

export const revalidate = 86400;

// Static: this route no longer reads searchParams. Filtered and paginated
// views (/blog?category=…, /blog?page=…) are rewritten in next.config.mjs to
// the prerendered /blog/filter/[category]/[page] route.
export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata('blog');
}

export default function BlogPage() {
  return <BlogIndexView activeCategory="All" currentPage={1} />;
}
