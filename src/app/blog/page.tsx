import Link from 'next/link';
import Image from 'next/image';
import { getAllPosts } from '@/lib/posts';
import type { Post } from '@/lib/posts';
import type { Metadata } from 'next';
import { HeroBanner, ResponsivePageStyles } from '@/components/shared';
import { buildPageMetadata } from '@/lib/get-page-seo';

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

/* ── Category keyword matching ──────────────────────────────────────────── */

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  'Cloud Computing': ['cloud', 'aws', 'azure', 'google cloud', 'gcp', 's3', 'ec2', 'lambda'],
  'DevOps': ['devops', 'docker', 'kubernetes', 'jenkins', 'ansible', 'terraform', 'helm', 'pipeline'],
  'Data Science': ['data science', 'machine learn', 'artificial intelligence', 'deep learn', 'nlp', 'pandas', 'numpy'],
  'Cyber Security': ['cyber', 'security', 'hacking', 'ethical hack', 'penetration', 'firewall', 'vulnerability'],
  'Digital Marketing': ['digital marketing', 'seo', 'social media', 'content market', 'google ads'],
  'Linux': ['linux', 'ubuntu', 'centos', 'shell script', 'bash', 'unix', 'redhat', 'kali'],
  'Programming': ['python', 'java', 'javascript', 'programming', 'coding', 'full stack', 'react', 'node', 'typescript'],
};

function postMatchesCategory(post: Post, category: string): boolean {
  if (category === 'All') return true;
  if (
    post.frontmatter.categories &&
    post.frontmatter.categories.length > 0 &&
    post.frontmatter.categories.some(
      (c) => c.toLowerCase().includes(category.toLowerCase()) || category.toLowerCase().includes(c.toLowerCase())
    )
  ) {
    return true;
  }
  const keywords = CATEGORY_KEYWORDS[category] ?? [];
  const titleLower = post.frontmatter.title.toLowerCase();
  return keywords.some((kw) => titleLower.includes(kw));
}

/* ── Blog card helpers ──────────────────────────────────────────────────── */

const CATEGORY_LABEL_MAP: Array<[string, string]> = [
  ['aws', 'Cloud – AWS'],
  ['azure', 'Cloud – Azure'],
  ['google cloud', 'Cloud – GCP'],
  ['cloud', 'Cloud Computing'],
  ['devops', 'DevOps'],
  ['docker', 'DevOps'],
  ['kubernetes', 'DevOps'],
  ['python', 'Python'],
  ['java', 'Java'],
  ['full stack', 'Full Stack Dev'],
  ['linux', 'Linux'],
  ['cyber', 'Cyber Security'],
  ['hacking', 'Cyber Security'],
  ['security', 'Cyber Security'],
  ['data science', 'Data Science'],
  ['machine learn', 'Machine Learning'],
  ['artificial', 'AI & ML'],
  ['power bi', 'Data Analytics'],
  ['tableau', 'Data Analytics'],
  ['data', 'Data Analytics'],
  ['sql', 'Databases'],
  ['digital', 'Digital Marketing'],
  ['marketing', 'Digital Marketing'],
  ['sap', 'ERP / SAP'],
  ['salesforce', 'CRM / Salesforce'],
  ['oracle', 'Oracle ERP'],
  ['tally', 'Tally ERP'],
  ['ms office', 'MS Office'],
  ['office', 'Office Tools'],
  ['ui', 'UI / UX Design'],
  ['ux', 'UI / UX Design'],
  ['design', 'Digital Design'],
  ['english', 'Spoken English'],
  ['communicat', 'Communication'],
  ['soft skill', 'Soft Skills'],
  ['networking', 'Networking'],
  ['ccna', 'CCNA'],
  ['testing', 'Software Testing'],
];

function getCategoryLabel(title: string): string {
  const lower = title.toLowerCase();
  for (const [key, label] of CATEGORY_LABEL_MAP) {
    if (lower.includes(key)) return label;
  }
  return 'IT Training';
}

const CARD_GRADIENTS = [
  'linear-gradient(135deg, #0a5260, #0d7a8e)',
  'linear-gradient(135deg, #1a3a5c, #1e5799)',
  'linear-gradient(135deg, #3a1a5c, #6a3a9c)',
  'linear-gradient(135deg, #1a4a2a, #2e7d32)',
  'linear-gradient(135deg, #5c2a0a, #b0552a)',
  'linear-gradient(135deg, #1a3a4a, #0d5c72)',
];

/* ── Page ───────────────────────────────────────────────────────────────── */

interface BlogPageProps {
  searchParams: { category?: string };
}

export default async function BlogPage({ searchParams }: BlogPageProps) {
  const rawCat = searchParams?.category ?? 'All';
  const activeCategory = categories.includes(rawCat) ? rawCat : 'All';

  const allPosts = await getAllPosts();
  const posts = allPosts.filter((p) => postMatchesCategory(p, activeCategory));

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
          { value: '36+',   label: 'COURSES COVERED' },
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
                  <strong style={{ color: 'var(--text)' }}>{posts.length}</strong>{' '}
                  post{posts.length !== 1 ? 's' : ''} in
                </span>
                <span style={{ background: 'var(--primary)', color: '#fff', padding: '3px 12px', borderRadius: '12px', fontSize: '13px', fontFamily: 'Poppins, sans-serif', fontWeight: 600 }}>
                  {activeCategory}
                </span>
                <Link href="/blog" style={{ fontSize: '12px', color: 'var(--text-muted)', textDecoration: 'underline' }}>
                  Clear filter
                </Link>
              </div>
            )}

            {posts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
                <h3 style={{ fontSize: '20px', marginBottom: '8px' }}>No Posts Found</h3>
                <p style={{ marginBottom: '16px' }}>No articles in &ldquo;{activeCategory}&rdquo; yet. Check back soon!</p>
                <Link href="/blog" style={{ display: 'inline-block', background: 'var(--primary)', color: '#fff', padding: '9px 22px', borderRadius: '6px', fontFamily: 'Poppins, sans-serif', fontWeight: 600, fontSize: '13px', textDecoration: 'none' }}>
                  View All Posts
                </Link>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '24px' }} className="course-list-grid">
                {posts.map((post, idx) => (
                  <article
                    key={post.slug}
                    style={{ background: 'var(--bg-card)', borderRadius: '14px', overflow: 'hidden', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-card)', display: 'flex', flexDirection: 'column' }}
                  >
                    {/* Thumbnail */}
                    <div className="blog-card__image" style={{ position: 'relative', height: '160px', overflow: 'hidden' }}>
                      {post.frontmatter.featuredImage ? (
                        <Image
                          src={post.frontmatter.featuredImage}
                          alt={post.frontmatter.title}
                          fill
                          sizes="(max-width: 768px) 100vw, 400px"
                          style={{ objectFit: 'cover' }}
                        />
                      ) : (
                        <div style={{ background: CARD_GRADIENTS[idx % CARD_GRADIENTS.length], height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '16px' }}>
                          <span style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '13px', color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                            COSS Cloud Solutions
                          </span>
                          <span style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: '16px', color: '#fff', textAlign: 'center', lineHeight: 1.3 }}>
                            {getCategoryLabel(post.frontmatter.title)}
                          </span>
                          <span style={{ display: 'inline-block', marginTop: '4px', padding: '3px 10px', borderRadius: '12px', background: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.9)', fontSize: '11px', fontFamily: 'Open Sans, sans-serif' }}>
                            Training in Hyderabad
                          </span>
                        </div>
                      )}
                      {post.frontmatter.date && (
                        <div style={{ position: 'absolute', top: '12px', left: '12px', background: 'var(--primary)', color: '#fff', borderRadius: '6px', padding: '5px 9px', textAlign: 'center', fontFamily: 'Poppins, sans-serif' }}>
                          <span style={{ display: 'block', fontSize: '18px', fontWeight: 700, lineHeight: 1 }}>
                            {new Date(post.frontmatter.date).getDate() || '-'}
                          </span>
                          <span style={{ fontSize: '10px', textTransform: 'uppercase' }}>
                            {post.frontmatter.date.split(' ')[1]?.substring(0, 3) ?? ''}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Body */}
                    <div style={{ padding: '18px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                      {(post.frontmatter.categories?.length ?? 0) > 0 && (
                        <span style={{ color: 'var(--primary)', fontSize: '11px', fontFamily: 'Poppins, sans-serif', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>
                          {post.frontmatter.categories?.[0]}
                        </span>
                      )}
                      <h2 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '14px', color: 'var(--text)', lineHeight: '1.45', marginBottom: '10px', flex: 1 }}>
                        <Link href={`/blog/${post.slug}`} style={{ color: 'var(--text)' }}>
                          {post.frontmatter.title}
                        </Link>
                      </h2>
                      {post.frontmatter.excerpt && (
                        <p style={{ color: 'var(--text-muted)', fontSize: '13px', lineHeight: '1.6', marginBottom: '12px', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                          {post.frontmatter.excerpt}
                        </p>
                      )}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                        {post.frontmatter.date && (
                          <span style={{ color: 'var(--text-light)', fontSize: '12px' }}>
                            {'📅'} {post.frontmatter.date}
                          </span>
                        )}
                        <Link href={`/blog/${post.slug}`} style={{ color: 'var(--primary)', fontSize: '12px', fontFamily: 'Poppins, sans-serif', fontWeight: 700 }}>
                          Read More {'→'}
                        </Link>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>

          {/* ── Sidebar ───────────────────────────────────────────────── */}
          <div>
            <div style={{ background: 'var(--secondary)', borderRadius: '12px', padding: '22px', color: '#fff', marginBottom: '20px' }}>
              <h4 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '15px', marginBottom: '10px', color: '#fff' }}>About COSS</h4>
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

            {/* Popular Categories - now proper clickable links */}
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
