import Link from 'next/link';
import type { Metadata } from 'next';
import { HeroBanner, ResponsivePageStyles } from '@/components/shared';
import { buildPageMetadata } from '@/lib/get-page-seo';
import { headers } from 'next/headers';
import { getAllPosts } from '@/lib/posts';

export const dynamic = 'force-dynamic';

interface DbPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  category: string;
  thumbnail: string | null;
  author: string;
  readTime: string | null;
  featured: boolean;
  publishedAt: string | null;
}

interface UnifiedPost {
  key: string;
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  dateIso: string;
  isDB: boolean;
}

async function getDbPosts(): Promise<DbPost[]> {
  const headerList = headers();
  const host = headerList.get('host') ?? 'localhost:3000';
  const proto = headerList.get('x-forwarded-proto') ?? (host.startsWith('localhost') ? 'http' : 'https');
  try {
    const res = await fetch(`${proto}://${host}/api/blog?limit=50`, { cache: 'no-store' });
    if (!res.ok) return [];
    const data = await res.json();
    return data.posts ?? [];
  } catch {
    return [];
  }
}

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata('blog');
}

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

interface BlogPageProps {
  searchParams: { category?: string };
}

export default async function BlogPage({ searchParams }: BlogPageProps) {
  const rawCat = searchParams?.category ?? 'All';
  const activeCategory = categories.includes(rawCat) ? rawCat : 'All';

  const [dbPosts, mdxPosts] = await Promise.all([
    getDbPosts(),
    getAllPosts(),
  ]);

  const allPosts: UnifiedPost[] = [
    ...dbPosts.map(p => ({
      key: `db-${p.slug}`,
      slug: p.slug,
      title: p.title,
      excerpt: p.excerpt ?? '',
      category: p.category ?? 'General',
      dateIso: p.publishedAt ?? new Date().toISOString(),
      isDB: true,
    })),
    ...mdxPosts.map(p => ({
      key: `mdx-${p.slug}`,
      slug: p.slug,
      title: p.frontmatter.title,
      excerpt: p.frontmatter.excerpt ?? '',
      category: deriveCategoryFromSlug(p.slug, p.frontmatter.title),
      dateIso: p.frontmatter.date,
      isDB: false,
    })),
  ];

  const filteredPosts = activeCategory === 'All'
    ? allPosts
    : allPosts.filter(p =>
        p.category.toLowerCase().includes(activeCategory.toLowerCase()) ||
        activeCategory.toLowerCase().includes(p.category.toLowerCase())
      );

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

        {/* ── Category filter pills ─────────────────────────────────────── */}
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

        <div className="page-with-sidebar" style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '36px', alignItems: 'start' }}>

          {/* ── Posts grid ──────────────────────────────────────────────── */}
          <div>
            {activeCategory !== 'All' && (
              <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <span style={{ fontFamily: 'Poppins, sans-serif', fontSize: '14px', color: 'var(--text-muted)' }}>
                  Showing{' '}
                  <strong style={{ color: 'var(--text)' }}>{filteredPosts.length}</strong>{' '}
                  post{filteredPosts.length !== 1 ? 's' : ''} in
                </span>
                <span style={{ background: 'var(--primary)', color: '#fff', padding: '3px 12px', borderRadius: '12px', fontSize: '13px', fontFamily: 'Poppins, sans-serif', fontWeight: 600 }}>
                  {activeCategory}
                </span>
                <Link href="/blog" style={{ fontSize: '12px', color: 'var(--text-muted)', textDecoration: 'underline' }}>
                  Clear filter
                </Link>
              </div>
            )}

            {filteredPosts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
                <h3 style={{ fontSize: '20px', marginBottom: '8px' }}>No Posts Found</h3>
                <p style={{ marginBottom: '16px' }}>No articles in &ldquo;{activeCategory}&rdquo; yet. Check back soon!</p>
                <Link href="/blog" style={{ display: 'inline-block', background: 'var(--primary)', color: '#fff', padding: '9px 22px', borderRadius: '6px', fontFamily: 'Poppins, sans-serif', fontWeight: 600, fontSize: '13px', textDecoration: 'none' }}>
                  View All Posts
                </Link>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '24px' }} className="course-list-grid">
                {filteredPosts.map((p, idx) => {
                  const date = new Date(p.dateIso);
                  const isValidDate = !isNaN(date.getTime());
                  return (
                    <article key={p.key} className="blog-card">
                      <div className="blog-card-img" style={{ background: CARD_GRADIENTS[idx % CARD_GRADIENTS.length] }}>
                        {isValidDate && (
                          <div className="blog-date-badge">
                            <span className="blog-date-day">{date.getDate()}</span>
                            <span className="blog-date-mon">{date.toLocaleString('en', { month: 'short' }).toUpperCase()}</span>
                          </div>
                        )}
                        <p className="blog-card-brand">COSS CLOUD SOLUTIONS</p>
                        <h3 className="blog-card-img-title">{p.category}</h3>
                        <span className="blog-card-pill">Training in Hyderabad</span>
                      </div>
                      <div className="blog-card-body">
                        <h3><Link href={`/blog/${p.slug}`}>{p.title}</Link></h3>
                        <p style={{ color: 'var(--text-muted)', fontSize: '12px', lineHeight: '1.6', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{p.excerpt}</p>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                          {isValidDate && (
                            <span style={{ color: 'var(--text-light)', fontSize: '11px' }}>
                              📅 {date.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                            </span>
                          )}
                          <Link href={`/blog/${p.slug}`} className="blog-read-more">Read More →</Link>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── Sidebar ───────────────────────────────────────────────── */}
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
