import type { Metadata } from 'next';
import { buildPageMetadata } from '@/lib/get-page-seo';
import { BlogIndexView } from './blog-index';
import PageSchema from '@/components/PageSchema';

export const revalidate = 604800; // 7 days; admin saves revalidate on demand (usage plan, 10 Oct)

// Static: this route no longer reads searchParams. Filtered and paginated
// views (/blog?category=…, /blog?page=…) are rewritten in next.config.mjs to
// the prerendered /blog/filter/[category]/[page] route.
export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata('blog');
}

export default function BlogPage() {
  return (
    <>
      <PageSchema slug="blog" />
      <BlogIndexView activeCategory="All" currentPage={1} />
    </>
  );
}
