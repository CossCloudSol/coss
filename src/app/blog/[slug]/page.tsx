import { getPostBySlug, getAllPosts } from '@/lib/posts';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { ResponsivePageStyles } from '@/components/shared';
import { buildPageMetadataWithFallback } from '@/lib/get-page-seo';
import { stripBrandFragments } from '@/lib/build-title';
import { headers } from 'next/headers';
import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// The page already renders its own <h1>{title}</h1> above the article —
// demote any h1 markdown content produces to h2 so there's only ever one H1.
const MARKDOWN_COMPONENTS: Components = {
  h1: ({ node, ...props }) => <h2 {...props} />,
};

/**
 * Normalises a frontmatter value to a safe display string.
 * Guards against both actual JS objects AND the literal string
 * "[object Object]" that WP exporters sometimes write into YAML.
 */
function tagToString(value: unknown): string {
  if (typeof value === 'string') {
    if (value === '[object Object]') return '';
    return value;
  }
  if (value !== null && typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    if (typeof obj.name === 'string') return obj.name;
    if (typeof obj.title === 'string') return obj.title;
    if (typeof obj.label === 'string') return obj.label;
    if (typeof obj.slug === 'string') return obj.slug;
  }
  if (value === null || value === undefined) return '';
  return String(value);
}

/**
 * Truncates to maxLen without cutting mid-word — trims back to the last
 * space instead of leaving a half-cut word at the boundary.
 */
function capAtWordBoundary(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  const truncated = text.slice(0, maxLen);
  const lastSpace = truncated.lastIndexOf(' ');
  return (lastSpace > 0 ? truncated.slice(0, lastSpace) : truncated).trim();
}

import { getBlogImageUrl } from '@/lib/cloudinary';

export async function generateStaticParams() {
  const posts = await getAllPosts();
  return posts.map(p => ({ slug: p.slug }));
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.cosscloudsol.com';

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  // Try DB post first
  let dbPost = null;
  try {
    dbPost = await prisma.blogPost.findFirst({ where: { slug: params.slug, status: 'published' } });
  } catch {
    // DB error — fall through to file system
  }
  if (dbPost) {
    const canonicalUrl = `${SITE_URL}/blog/${params.slug}`;
    const description = dbPost.seoDesc ?? dbPost.excerpt;
    const ogImage = dbPost.thumbnail ?? getBlogImageUrl(params.slug, 1200, 630);
    const fallback: Metadata = {
      title: dbPost.seoTitle ?? dbPost.title,
      description,
      alternates: { canonical: canonicalUrl },
      openGraph: {
        title: dbPost.title,
        description,
        url: canonicalUrl,
        type: 'article',
        images: ogImage ? [{ url: ogImage }] : undefined,
      },
    };
    return buildPageMetadataWithFallback(`blog/${params.slug}`, fallback);
  }

  const post = await getPostBySlug(params.slug);
  if (!post) return { title: 'Not Found' };

  const titleStr = tagToString(post.frontmatter.title) || params.slug;
  // Frontmatter excerpt is often WP shortcode garbage — use a clean fallback
  const rawExcerpt = tagToString(post.frontmatter.excerpt);
  const isCleanExcerpt = rawExcerpt.length > 20 && !rawExcerpt.includes('[vc_');
  const description = isCleanExcerpt
    ? rawExcerpt.slice(0, 158)
    : capAtWordBoundary(
        `${stripBrandFragments(titleStr)} — Expert IT training insights from COSS Cloud Solutions, Hyderabad's leading IT institute.`,
        160,
      );

  const canonicalUrl = `${SITE_URL}/blog/${params.slug}/`;
  const ogImage = getBlogImageUrl(params.slug, 1200, 630);

  const fallback: Metadata = {
    title: titleStr,
    description,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title: titleStr,
      description,
      url: canonicalUrl,
      siteName: 'COSS Cloud Solutions',
      type: 'article',
      images: ogImage ? [{ url: ogImage }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: titleStr,
      description,
    },
  };

  return buildPageMetadataWithFallback(`blog/${params.slug}`, fallback);
}

const RELATED = [
  { title: 'SOC Analyst Course Training in Dilsukhnagar',  href: '/blog/soc-analyst-training-hyderabad' },
  { title: 'AWS DevOps Multi-Cloud Certification Course',   href: '/blog/aws-devops-multi-cloud-course-dilsukhnagar' },
  { title: 'Cyber Security Course Training in Hyderabad',  href: '/blog/cyber-security-training-dilsukhnagar-hyderabad' },
  { title: 'Digital Marketing Course Training',             href: '/blog/digital-marketing-course-training-dilsukhnagar-hyderabad' },
];

export default async function BlogPostPage({ params }: { params: { slug: string } }) {
  // Try DB post first — renders with react-markdown
  let dbPost = null;
  try {
    dbPost = await prisma.blogPost.findFirst({ where: { slug: params.slug, status: 'published' } });
  } catch {
    // DB error — fall through to file system
  }
  if (dbPost) {
    // Increment views (fire-and-forget)
    void prisma.blogPost.update({ where: { id: dbPost.id }, data: { views: { increment: 1 } } });

    const dbDateIso = dbPost.publishedAt
      ? new Date(dbPost.publishedAt).toISOString().split('T')[0]
      : new Date(dbPost.createdAt).toISOString().split('T')[0];

    return (
      <>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'BlogPosting',
              headline: dbPost.title,
              datePublished: dbDateIso,
              dateModified: dbDateIso,
              author: { '@type': 'Organization', name: 'COSS Cloud Solutions' },
              publisher: { '@type': 'Organization', name: 'COSS Cloud Solutions', url: SITE_URL },
              url: `${SITE_URL}/blog/${params.slug}/`,
            }),
          }}
        />
        <ResponsivePageStyles />
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 20px 0' }}>
          <Link href="/blog" style={{ fontSize: '13px', color: 'var(--primary)', fontWeight: 600 }}>
            &larr; Back to Blog
          </Link>
          <h1 style={{ fontFamily: 'Poppins, sans-serif', fontSize: 'clamp(24px, 4.5vw, 36px)', fontWeight: 700, color: 'var(--text)', marginTop: '12px', lineHeight: 1.25 }}>
            {dbPost.title}
          </h1>
        </div>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 20px 48px' }}>
          <div className="page-with-sidebar" style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '36px', alignItems: 'start' }}>
            <article>
              <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '24px', padding: '12px 18px', background: 'var(--bg-alt)', borderRadius: '10px', fontSize: '13px', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
                {dbPost.publishedAt && <span>{new Date(dbPost.publishedAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</span>}
                {dbPost.readTime && <span>{dbPost.readTime}</span>}
                <span style={{ background: 'var(--primary)', color: '#fff', padding: '2px 10px', borderRadius: '12px', fontSize: '11px', fontFamily: 'Poppins, sans-serif', fontWeight: 600 }}>{dbPost.category}</span>
                <span style={{ marginLeft: 'auto', fontSize: '12px' }}>by {dbPost.author}</span>
              </div>
              <div className="prose-content" style={{ fontSize: '15px', lineHeight: '1.85' }}>
                <ReactMarkdown remarkPlugins={[remarkGfm]} components={MARKDOWN_COMPONENTS}>{dbPost.content}</ReactMarkdown>
              </div>
              {dbPost.tags.length > 0 && (
                <div style={{ marginTop: '28px', paddingTop: '20px', borderTop: '1px solid var(--border)' }} className="flex flex-wrap items-center gap-2">
                  <span style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 600, fontSize: '13px', color: 'var(--text-muted)' }}>Tags:</span>
                  {dbPost.tags.map((tag) => (
                    <Link key={tag} href={`/blog?tag=${encodeURIComponent(tag)}`} className="text-xs px-3 py-1 rounded-full border bg-gray-100 text-gray-700 border-gray-200 dark:bg-slate-700 dark:text-gray-300 dark:border-slate-600 hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors">
                      {tag}
                    </Link>
                  ))}
                </div>
              )}
              <div style={{ background: 'linear-gradient(135deg, var(--secondary), #004d5c)', borderRadius: '14px', padding: '28px', marginTop: '36px', color: '#fff', textAlign: 'center' }}>
                <h3 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '20px', marginBottom: '8px', color: '#fff' }}>Interested in this topic?</h3>
                <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '14px', marginBottom: '18px' }}>Join our expert-led training at Coss Cloud Solutions, Hyderabad</p>
                <Link href="/free-demo-class/" style={{ background: 'var(--primary)', color: '#fff', padding: '12px 28px', borderRadius: '6px', fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '14px', display: 'inline-block' }}>
                  Book Free Demo Class
                </Link>
              </div>
            </article>
            <div>
              <div style={{ background: 'var(--secondary)', borderRadius: '12px', padding: '24px', color: '#fff', marginBottom: '20px' }}>
                <h3 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '16px', marginBottom: '6px', color: '#fff' }}>Enroll Now</h3>
                <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '12px', marginBottom: '16px' }}>Start your IT career with Coss Cloud Solutions</p>
                <Link href="/free-demo-class/" style={{ display: 'block', textAlign: 'center', background: 'var(--primary)', color: '#fff', padding: '11px', borderRadius: '6px', fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '13px' }}>
                  Book Free Demo Class
                </Link>
              </div>
              <div style={{ background: 'var(--bg-alt)', borderRadius: '12px', padding: '20px', border: '1px solid var(--border)' }}>
                <h4 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '14px', color: 'var(--text)', marginBottom: '10px' }}>Contact Us</h4>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.9' }}>
                  <a href="tel:8885166007" style={{ color: 'var(--primary)', fontWeight: 600 }}>+91 88851 66007</a><br />
                  <a href="mailto:info@cosscloudsol.com" style={{ color: 'var(--text-muted)', fontSize: '12px' }}>info@cosscloudsol.com</a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Fall back to file-system post
  const post = await getPostBySlug(params.slug);
  if (!post) notFound();

  // Use spread date from getAllPosts so the post page matches the blog grid
  const allMdxPosts = await getAllPosts();
  const mdxMeta = allMdxPosts.find(p => p.slug === params.slug);

  const cldImage = getBlogImageUrl(params.slug, 1200, 450);

  const titleStr   = tagToString(post.frontmatter.title) || params.slug;
  const dateStr    = mdxMeta?.frontmatter.dateFormatted ?? tagToString(post.frontmatter.date);
  const readingStr = tagToString(post.frontmatter.readingTime);
  const categories = Array.isArray(post.frontmatter.categories)
    ? post.frontmatter.categories
    : [];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BlogPosting',
            headline: titleStr,
            datePublished: mdxMeta?.frontmatter.date ?? '',
            dateModified: mdxMeta?.frontmatter.date ?? '',
            author: { '@type': 'Organization', name: 'COSS Cloud Solutions' },
            publisher: { '@type': 'Organization', name: 'COSS Cloud Solutions', url: SITE_URL },
            url: `${SITE_URL}/blog/${params.slug}/`,
          }),
        }}
      />
      <ResponsivePageStyles />

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 20px 0' }}>
        <Link
          href="/blog"
          style={{ fontSize: '13px', color: 'var(--primary)', fontWeight: 600 }}
        >
          &larr; Back to Blog
        </Link>
        <h1
          style={{
            fontFamily: 'Poppins, sans-serif',
            fontSize: 'clamp(24px, 4.5vw, 36px)',
            fontWeight: 700,
            color: 'var(--text)',
            marginTop: '12px',
            lineHeight: 1.25,
          }}
        >
          {titleStr}
        </h1>
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 20px 48px' }}>
        <div className="page-with-sidebar" style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '36px', alignItems: 'start' }}>

          <article>
            {/* Meta row */}
            <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '24px', padding: '12px 18px', background: 'var(--bg-alt)', borderRadius: '10px', fontSize: '13px', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
              {dateStr ? <span>{dateStr}</span> : null}
              {readingStr ? <span>{readingStr}</span> : null}
              {categories.map((c, i) => {
                const label = tagToString(c);
                if (label === '') return null;
                return (
                  <span
                    key={`cat-${i}-${label}`}
                    style={{
                      background: 'var(--primary)',
                      color: '#fff',
                      padding: '2px 10px',
                      borderRadius: '12px',
                      fontSize: '11px',
                      fontFamily: 'Poppins, sans-serif',
                      fontWeight: 600,
                    }}
                  >
                    {label}
                  </span>
                );
              })}
            </div>

            

            {/* Content */}
            <div className="prose-content" style={{ fontSize: '15px', lineHeight: '1.85' }}>
              {post.contentHtml ? (
                <div dangerouslySetInnerHTML={{ __html: post.contentHtml }} />
              ) : (
                <div style={{ whiteSpace: 'pre-wrap' }}>{post.content}</div>
              )}
            </div>

            {/* Tags — gray pills, dark-mode aware, clickable */}
            {Array.isArray(post.frontmatter.tags) && post.frontmatter.tags.length > 0 ? (
              <div style={{ marginTop: '28px', paddingTop: '20px', borderTop: '1px solid var(--border)' }} className="flex flex-wrap items-center gap-2">
                <span style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 600, fontSize: '13px', color: 'var(--text-muted)' }}>
                  Tags:
                </span>
                {post.frontmatter.tags.map((tag, i) => {
                  const label = tagToString(tag);
                  if (label === '') return null;
                  return (
                    <Link
                      key={`tag-${i}-${label}`}
                      href={`/blog?tag=${encodeURIComponent(label)}`}
                      className="text-xs px-3 py-1 rounded-full border bg-gray-100 text-gray-700 border-gray-200 dark:bg-slate-700 dark:text-gray-300 dark:border-slate-600 hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
                    >
                      {label}
                    </Link>
                  );
                })}
              </div>
            ) : null}

            {/* CTA */}
            <div style={{ background: 'linear-gradient(135deg, var(--secondary), #004d5c)', borderRadius: '14px', padding: '28px', marginTop: '36px', color: '#fff', textAlign: 'center' }}>
              <h3 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '20px', marginBottom: '8px', color: '#fff' }}>Interested in this topic?</h3>
              <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '14px', marginBottom: '18px' }}>Join our expert-led training at Coss Cloud Solutions, Hyderabad</p>
              <Link href="/free-demo-class/" style={{ background: 'var(--primary)', color: '#fff', padding: '12px 28px', borderRadius: '6px', fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '14px', display: 'inline-block' }}>
                Book Free Demo Class
              </Link>
            </div>
          </article>

          {/* Sidebar */}
          <div>
            <div style={{ background: 'var(--secondary)', borderRadius: '12px', padding: '24px', color: '#fff', marginBottom: '20px' }}>
              <h3 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '16px', marginBottom: '6px', color: '#fff' }}>Enroll Now</h3>
              <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '12px', marginBottom: '16px' }}>Start your IT career with Coss Cloud Solutions</p>
              <input type="text" placeholder="Full Name" style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.1)', color: '#fff', fontSize: '13px', marginBottom: '10px', outline: 'none' }} />
              <input type="tel" placeholder="Mobile Number" style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.1)', color: '#fff', fontSize: '13px', marginBottom: '14px', outline: 'none' }} />
              <Link href="/free-demo-class/" style={{ display: 'block', textAlign: 'center', background: 'var(--primary)', color: '#fff', padding: '11px', borderRadius: '6px', fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '13px' }}>
                Book Free Demo Class
              </Link>
            </div>

            <div style={{ background: 'var(--bg-card)', borderRadius: '12px', padding: '20px', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-card)', marginBottom: '20px' }}>
              <h4 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '14px', color: 'var(--text)', marginBottom: '14px', paddingBottom: '8px', borderBottom: '2px solid var(--primary)', display: 'inline-block' }}>
                Related Articles
              </h4>
              <div style={{ marginTop: '10px' }}>
                {RELATED.map(p => (
                  <Link key={p.href} href={p.href} style={{ display: 'block', padding: '10px 0', borderBottom: '1px solid var(--border)', fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                    &rsaquo; {p.title}
                  </Link>
                ))}
              </div>
            </div>

            <div style={{ background: 'var(--bg-alt)', borderRadius: '12px', padding: '20px', border: '1px solid var(--border)' }}>
              <h4 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '14px', color: 'var(--text)', marginBottom: '10px' }}>Contact Us</h4>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.9' }}>
                <a href="tel:8885166007" style={{ color: 'var(--primary)', fontWeight: 600 }}>+91 88851 66007</a><br />
                <a href="mailto:info@cosscloudsol.com" style={{ color: 'var(--text-muted)', fontSize: '12px' }}>info@cosscloudsol.com</a>
              </p>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
