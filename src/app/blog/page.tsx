import Link from 'next/link';
import type { Metadata } from 'next';
import { HeroBanner, ResponsivePageStyles } from '@/components/shared';
import { buildPageMetadata } from '@/lib/get-page-seo';
import { getAllPosts } from '@/lib/posts';
import { prisma } from '@/lib/db';

export const revalidate = 86400;

type DBPost = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  category: string;
  publishedAt: Date | null;
  createdAt: Date;
};

type MDXPost = {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  date: string;
  dateFormatted: string;
};

const categories = [
  'All',
  'Cloud Computing',
  'DevOps',
  'Data Science',
  'Cyber Security',
  'Digital Marketing',
  'Linux',
  'Programming',
];

const CARD_GRADIENTS = [
  'linear-gradient(135deg, #0a5260, #0d7a8e)',
  'linear-gradient(135deg, #1a3a5c, #1e5799)',
  'linear-gradient(135deg, #3a1a5c, #6a3a9c)',
  'linear-gradient(135deg, #1a4a2a, #2e7d32)',
  'linear-gradient(135deg, #5c2a0a, #b0552a)',
  'linear-gradient(135deg, #1a3a4a, #0d5c72)',
];

const CATEGORY_KEYWORDS: [string, string[]][] = [
  ['Cloud Computing', ['aws', 'azure', 'gcp', 'cloud', 's3', 'ec2', 'lambda', 'multicloud', 'multi-cloud']],
  ['DevOps', ['devops', 'docker', 'kubernetes', 'k8s', 'jenkins', 'ansible', 'terraform', 'cicd', 'ci-cd', 'devsecops']],
  ['Data Science', ['data-science', 'machine-learning', 'artificial-intelligence', 'ai', 'ml', 'data-analytics', 'data-engineer', 'big-data', 'tableau', 'power-bi']],
  ['Cyber Security', ['cyber', 'security', 'ethical-hacking', 'network-security', 'ceh', 'cissp', 'penetration']],
  ['Digital Marketing', ['digital-marketing', 'seo', 'social-media', 'google-ads', 'ppc']],
  ['Linux', ['linux', 'ubuntu', 'centos', 'redhat', 'rhel', 'shell', 'bash']],
  ['Programming', ['python', 'java', 'javascript', 'react', 'nodejs', 'node-js', 'php', 'programming', 'fullstack', 'full-stack', 'web-development']],
];

function deriveCategoryFromSlug(slug: string, title: string): string {
  const haystack = `${slug} ${title}`.toLowerCase();
  for (const [cat, keywords] of CATEGORY_KEYWORDS) {
    if (keywords.some(kw => haystack.includes(kw))) return cat;
  }
  return 'Cloud Computing';
}

function matchesCategory(postCat: string, activeCategory: string): boolean {
  return (
    postCat.toLowerCase().includes(activeCategory.toLowerCase()) ||
    activeCategory.toLowerCase().includes(postCat.toLowerCase())
  );
}

const POSTS_PER_PAGE = 12;

function BlogCard({
  slug,
  title,
  excerpt,
  category,
  dateLabel,
  badgeColor,
  cardIndex,
}: {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  dateLabel: string;
  badgeColor: 'orange' | 'indigo';
  cardIndex: number;
}) {
  return (
    <article className="blog-card">
      <div className="blog-card-img" style={{ background: CARD_GRADIENTS[cardIndex % CARD_GRADIENTS.length] }}>
        <div
          className="blog-date-badge"
          style={{
            background: badgeColor === 'orange'
              ? 'rgba(249, 115, 22, 0.85)'
              : 'rgba(99, 102, 241, 0.85)',
          }}
        >
          {dateLabel}
        </div>
        <p className="blog-card-brand">COSS CLOUD SOLUTIONS</p>
        <h3 className="blog-card-img-title">{category}</h3>
        <span className="blog-card-pill">Training in Hyderabad</span>
      </div>
      <div className="blog-card-body">
        <h3><Link href={`/blog/${slug}`}>{title}</Link></h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '12px', lineHeight: '1.6', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
          {excerpt}
        </p>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
          <span style={{ color: 'var(--text-light)', fontSize: '11px' }}>📅 {dateLabel}</span>
          <Link href={`/blog/${slug}`} className="blog-read-more">Read More →</Link>
        </div>
      </div>
    </article>
  );
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams?: { page?: string; category?: string; tag?: string };
}): Promise<Metadata> {
  const base = await buildPageMetadata('blog');
  // Filtered views (?category=, ?tag=) are near-duplicates of the clean /blog
  // index — keep them crawlable (follow) so link equity still flows, but
  // pull them out of the index. Canonical already points at clean /blog via
  // buildPageMetadata (defaultCanonical never includes query params).
  const isFiltered = Boolean(searchParams?.category || searchParams?.tag);
  if (!isFiltered) return base;
  return { ...base, robots: { index: false, follow: true } };
}

export default async function BlogPage({
  searchParams,
}: {
  searchParams?: { page?: string; category?: string; tag?: string };
}) {
  const rawCat = searchParams?.category ?? 'All';
  const activeCategory = categories.includes(rawCat) ? rawCat : 'All';
  const currentPage = Number(searchParams?.page ?? 1);

  const dbPostsRaw = await prisma.blogPost.findMany({
    where: { status: 'published' },
    orderBy: { publishedAt: 'desc' },
    select: {
      id: true,
      title: true,
      slug: true,
      excerpt: true,
      category: true,
      publishedAt: true,
      createdAt: true,
    },
  });

  const mdxPostsRaw = await getAllPosts();

  const dbPosts: DBPost[] = dbPostsRaw.map(p => ({
    ...p,
    excerpt: p.excerpt ?? '',
    category: p.category ?? 'General',
  }));

  const mdxPosts: MDXPost[] = mdxPostsRaw.map(p => ({
    slug: p.slug,
    title: p.frontmatter.title,
    excerpt: p.frontmatter.excerpt ?? '',
    category: deriveCategoryFromSlug(p.slug, p.frontmatter.title),
    date: p.frontmatter.date,
    dateFormatted: p.frontmatter.dateFormatted ?? p.frontmatter.date,
  }));

  const filteredDbPosts = activeCategory === 'All'
    ? dbPosts
    : dbPosts.filter(p => matchesCategory(p.category, activeCategory));

  const filteredMdxPosts = activeCategory === 'All'
    ? mdxPosts
    : mdxPosts.filter(p => matchesCategory(p.category, activeCategory));

  const mdxStart = (currentPage - 1) * POSTS_PER_PAGE;
  const paginatedMdxPosts = filteredMdxPosts.slice(mdxStart, mdxStart + POSTS_PER_PAGE);
  const totalMdxPages = Math.ceil(filteredMdxPosts.length / POSTS_PER_PAGE);

  const bothEmpty = filteredDbPosts.length === 0 && filteredMdxPosts.length === 0;

  const catParam = activeCategory !== 'All' ? `&category=${encodeURIComponent(activeCategory)}` : '';

  return (
    <>
      <ResponsivePageStyles />
      <HeroBanner
        badge="IT CAREER INSIGHTS & TUTORIALS"
        titlePre="Expert Tips, Guides & "
        accentText="IT Career"
        titlePost=" Advice"
        titleLine2="from Industry-Certified Trainers"
        subtitle="In-depth articles on Cloud Computing, DevOps, Data Science, Cyber Security & more — written by certified trainers to help you upskill faster."
        stats={[
          { value: '8+',    label: 'TOPIC CATEGORIES' },
          { value: 'Weekly',label: 'NEW ARTICLES' },
          { value: 'Free',  label: 'ALL RESOURCES' },
          { value: '30+',   label: 'COURSES COVERED' },
        ]}
        ctaText="New articles published weekly · Bookmark your favourites"
        breadcrumb={[{ label: 'Blog', href: '/blog/' }]}
      />

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '48px 20px' }}>

        {/* ── Category filter pills ── */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '40px', justifyContent: 'center' }}>
          {categories.map((c) => {
            const isActive = c === activeCategory;
            const href = c === 'All' ? '/blog' : `/blog?category=${encodeURIComponent(c)}`;
            return (
              <Link
                key={c}
                href={href}
                style={{
                  padding: '7px 18px',
                  borderRadius: '20px',
                  fontSize: '13px',
                  fontFamily: 'Poppins, sans-serif',
                  fontWeight: 500,
                  cursor: 'pointer',
                  textDecoration: 'none',
                  display: 'inline-block',
                  background: isActive ? 'var(--primary)' : 'var(--surface)',
                  color: isActive ? '#fff' : 'var(--text-muted)',
                  border: `1px solid ${isActive ? 'var(--primary)' : 'var(--border)'}`,
                  transition: 'all 0.2s ease',
                }}
              >
                {c}
              </Link>
            );
          })}
        </div>

        {activeCategory !== 'All' && (
          <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <span style={{ fontFamily: 'Poppins, sans-serif', fontSize: '14px', color: 'var(--text-muted)' }}>
              Showing{' '}
              <strong style={{ color: 'var(--text)' }}>{filteredDbPosts.length + filteredMdxPosts.length}</strong>{' '}
              post{(filteredDbPosts.length + filteredMdxPosts.length) !== 1 ? 's' : ''} in
            </span>
            <span style={{ background: 'var(--primary)', color: '#fff', padding: '3px 12px', borderRadius: '12px', fontSize: '13px', fontFamily: 'Poppins, sans-serif', fontWeight: 600 }}>
              {activeCategory}
            </span>
            <Link href="/blog" style={{ fontSize: '12px', color: 'var(--text-muted)', textDecoration: 'underline' }}>
              Clear filter
            </Link>
          </div>
        )}

        <div className="page-with-sidebar" style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '36px', alignItems: 'start' }}>

          {/* ── Posts area ── */}
          <div>
            {bothEmpty ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
                <h3 style={{ fontSize: '20px', marginBottom: '8px' }}>No Posts Found</h3>
                <p style={{ marginBottom: '16px' }}>No articles in &ldquo;{activeCategory}&rdquo; yet. Check back soon!</p>
                <Link href="/blog" style={{ display: 'inline-block', background: 'var(--primary)', color: '#fff', padding: '9px 22px', borderRadius: '6px', fontFamily: 'Poppins, sans-serif', fontWeight: 600, fontSize: '13px', textDecoration: 'none' }}>
                  View All Posts
                </Link>
              </div>
            ) : (
              <>
                {/* ── Section 1: Latest Articles (DB posts) ── */}
                {filteredDbPosts.length > 0 && (
                  <div className="mb-2">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-orange-500 flex-shrink-0" />
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          Latest articles
                        </span>
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400">
                          {filteredDbPosts.length} posts · 2026
                        </span>
                      </div>
                      <span className="text-xs text-gray-400">Posted by admin</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '24px', padding: '16px 0' }} className="course-list-grid">
                      {filteredDbPosts.map((post, idx) => (
                        <BlogCard
                          key={post.slug}
                          slug={post.slug}
                          title={post.title}
                          excerpt={post.excerpt}
                          category={post.category}
                          dateLabel={new Date(post.publishedAt ?? post.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric', month: 'short', year: 'numeric',
                          })}
                          badgeColor="orange"
                          cardIndex={idx}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* ── Section 2: Previous Articles (MDX posts) ── */}
                {filteredMdxPosts.length > 0 && (
                  <div className="mt-4">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700 border-t border-t-gray-100 dark:border-t-gray-800">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-indigo-500 flex-shrink-0" />
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          Previous articles
                        </span>
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400">
                          {filteredMdxPosts.length} posts · 2026–2023
                        </span>
                      </div>
                      <span className="text-xs text-gray-400">Legacy content archive</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '24px', padding: '16px 0' }} className="course-list-grid">
                      {paginatedMdxPosts.map((post, idx) => (
                        <BlogCard
                          key={post.slug}
                          slug={post.slug}
                          title={post.title}
                          excerpt={post.excerpt}
                          category={post.category}
                          dateLabel={post.dateFormatted}
                          badgeColor="indigo"
                          cardIndex={idx}
                        />
                      ))}
                    </div>

                    {totalMdxPages > 1 && (
                      <div className="flex items-center justify-center gap-2 py-6 border-t border-gray-100 dark:border-gray-800">
                        {currentPage > 1 && (
                          <a
                            href={`/blog?page=${currentPage - 1}${catParam}`}
                            className="px-3 py-1.5 text-xs border border-gray-200 dark:border-gray-700 rounded-md text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                          >
                            ← Previous
                          </a>
                        )}
                        {Array.from({ length: Math.min(totalMdxPages, 8) }, (_, i) => i + 1).map(p => (
                          <a
                            key={p}
                            href={`/blog?page=${p}${catParam}`}
                            className={`px-3 py-1.5 text-xs rounded-md ${
                              p === currentPage
                                ? 'bg-indigo-500 text-white'
                                : 'border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                            }`}
                          >
                            {p}
                          </a>
                        ))}
                        {totalMdxPages > 8 && (
                          <span className="text-xs text-gray-400">…{totalMdxPages}</span>
                        )}
                        {currentPage < totalMdxPages && (
                          <a
                            href={`/blog?page=${currentPage + 1}${catParam}`}
                            className="px-3 py-1.5 text-xs border border-gray-200 dark:border-gray-700 rounded-md text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                          >
                            Next →
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          {/* ── Sidebar ── */}
          <div>
            <div style={{ background: 'var(--secondary)', borderRadius: '12px', padding: '22px', color: '#fff', marginBottom: '20px' }}>
              <h4 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '15px', marginBottom: '10px', color: '#fff' }}>About Coss Cloud Solutions</h4>
              <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '13px', lineHeight: '1.7', marginBottom: '14px' }}>
                Leading IT training institute in Dilsukhnagar &amp; Ameerpet, Hyderabad.
              </p>
              <Link href="/about-us/" style={{ color: 'var(--primary)', fontSize: '13px', fontWeight: 600 }}>Learn More {'→'}</Link>
            </div>

            <div style={{ background: 'var(--primary-light)', borderRadius: '12px', padding: '22px', border: '1px solid rgba(228,117,56,0.2)', marginBottom: '20px' }}>
              <h4 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '15px', color: 'var(--text)', marginBottom: '8px' }}>
                {'🎓'} Enroll Now
              </h4>
              <p style={{ color: 'var(--text-muted)', fontSize: '12px', lineHeight: '1.6', marginBottom: '14px' }}>Book a free demo class and start your IT career today.</p>
              <Link href="/free-demo-class/" style={{ display: 'block', textAlign: 'center', background: 'var(--primary)', color: '#fff', padding: '11px', borderRadius: '6px', fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '13px' }}>
                Book Free Demo Class
              </Link>
            </div>

            <div style={{ background: 'var(--bg-card)', borderRadius: '12px', padding: '20px', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-card)' }}>
              <h4 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '15px', color: 'var(--text)', marginBottom: '14px', paddingBottom: '8px', borderBottom: '2px solid var(--primary)', display: 'inline-block' }}>
                Popular Categories
              </h4>
              <div style={{ marginTop: '10px' }}>
                {categories.slice(1).map((cat) => {
                  const isActive = cat === activeCategory;
                  return (
                    <Link
                      key={cat}
                      href={`/blog?category=${encodeURIComponent(cat)}`}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '9px 6px',
                        borderBottom: '1px solid var(--border)',
                        fontSize: '13px',
                        textDecoration: 'none',
                        color: isActive ? 'var(--primary)' : 'var(--text-muted)',
                        fontWeight: isActive ? 600 : 400,
                        fontFamily: 'Poppins, sans-serif',
                        transition: 'color 0.15s ease',
                      }}
                    >
                      <span>{'›'} {cat}</span>
                      {isActive && (
                        <span style={{ background: 'var(--primary)', color: '#fff', borderRadius: '10px', padding: '1px 8px', fontSize: '11px', fontWeight: 600 }}>
                          active
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
