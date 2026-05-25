import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { ResponsivePageStyles } from '@/components/shared';
import { getCourseUrl } from '@/lib/course-url';

export const dynamic = 'force-dynamic';

interface SyllabusItem { week?: string; topic?: string; details?: string; module?: string; topics?: string[] }

interface CourseDetail {
  id: string;
  title: string;
  slug: string;
  description: string;
  excerpt: string;
  category: string;
  duration: string;
  mode: string;
  level: string;
  price: number | null;
  originalPrice: number | null;
  badge: string | null;
  thumbnail: string | null;
  syllabus: SyllabusItem[];
  highlights: string[];
  tools: string[];
  seoTitle: string | null;
  seoDesc: string | null;
  urlType: string;
  categorySlug: string | null;
}

interface CategoryDetail {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  seoTitle: string | null;
  seoDesc: string | null;
  courses: CourseDetail[];
}

async function getBaseUrl() {
  const headerList = headers();
  const host = headerList.get('host') ?? 'localhost:3000';
  const proto = headerList.get('x-forwarded-proto') ?? (host.startsWith('localhost') ? 'http' : 'https');
  return `${proto}://${host}`;
}

async function getCourse(slug: string): Promise<CourseDetail | null> {
  const base = await getBaseUrl();
  try {
    const res = await fetch(`${base}/api/courses/${slug}`, { cache: 'no-store' });
    if (!res.ok) return null;
    const data = await res.json();
    // The /api/courses/[slug] endpoint returns { courses: [] } when the slug
    // matches a category rather than a course — ignore those responses here.
    if (!data?.title) return null;
    return data;
  } catch {
    return null;
  }
}

async function getCategory(slug: string): Promise<CategoryDetail | null> {
  const base = await getBaseUrl();
  try {
    const res = await fetch(`${base}/api/categories/${slug}`, { cache: 'no-store' });
    if (!res.ok) return null;
    const data = await res.json();
    return data.category ?? null;
  } catch {
    return null;
  }
}

async function getRelated(category: string, excludeSlug: string): Promise<Array<{ id: string; title: string; slug: string; duration: string; urlType: string; categorySlug: string | null }>> {
  const base = await getBaseUrl();
  try {
    const res = await fetch(`${base}/api/courses?category=${encodeURIComponent(category)}`, { cache: 'no-store' });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.courses ?? []).filter((c: { slug: string }) => c.slug !== excludeSlug).slice(0, 3);
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const course = await getCourse(params.slug);
  if (course) {
    return {
      title: course.seoTitle ?? `${course.title} | COSS Cloud Solutions`,
      description: course.seoDesc ?? course.excerpt,
    };
  }
  const category = await getCategory(params.slug);
  if (category) {
    return {
      title: category.seoTitle ?? `${category.name} Training in Hyderabad | COSS`,
      description: category.seoDesc ?? category.description ?? undefined,
    };
  }
  return { title: 'Not Found' };
}

export default async function CourseOrCategoryPage({ params }: { params: { slug: string } }) {
  // Check course first (legacy URLs), then category for new dynamic categories
  const course = await getCourse(params.slug);
  if (course) {
    return <CourseDetailView course={course} />;
  }

  const category = await getCategory(params.slug);
  if (category) {
    return <CategoryLandingView category={category} />;
  }

  notFound();
}

// ─── Course Detail View ────────────────────────────────────────────────────────

function CourseDetailView({ course }: { course: CourseDetail }) {
  const syllabusItems: SyllabusItem[] = Array.isArray(course.syllabus) ? course.syllabus : [];

  return (
    <>
      <ResponsivePageStyles />
      <div style={{ background: 'linear-gradient(135deg, #1a1a2e, #0f3460)', padding: '48px 20px 40px', color: '#fff' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ marginBottom: '12px' }}>
            <Link href="/courses" style={{ color: 'rgba(255,255,255,0.65)', fontSize: '13px' }}>Courses</Link>
            <span style={{ color: 'rgba(255,255,255,0.4)', margin: '0 8px' }}>›</span>
            <span style={{ color: 'rgba(255,255,255,0.65)', fontSize: '13px' }}>{course.category}</span>
          </div>
          {course.badge && (
            <div style={{ display: 'inline-block', background: '#e47538', color: '#fff', fontSize: '11px', fontWeight: 700, padding: '3px 12px', borderRadius: '12px', marginBottom: '12px', fontFamily: 'Poppins, sans-serif', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {course.badge}
            </div>
          )}
          <h1 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: 'clamp(24px, 4vw, 38px)', color: '#fff', marginBottom: '14px', lineHeight: 1.2 }}>
            {course.title}
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '15px', lineHeight: '1.75', maxWidth: '700px', marginBottom: '24px' }}>
            {course.excerpt}
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
            {[
              { label: course.duration, icon: '⏱' },
              { label: course.mode, icon: '🏫' },
              { label: course.level, icon: '📈' },
            ].map((item) => (
              <span key={item.label} style={{ background: 'rgba(255,255,255,0.12)', color: '#fff', fontSize: '13px', padding: '6px 14px', borderRadius: '6px', fontFamily: 'Poppins, sans-serif' }}>
                {item.icon} {item.label}
              </span>
            ))}
            {course.price != null && (
              <span style={{ background: '#e47538', color: '#fff', fontSize: '13px', fontWeight: 700, padding: '6px 14px', borderRadius: '6px', fontFamily: 'Poppins, sans-serif' }}>
                {course.originalPrice && <span style={{ textDecoration: 'line-through', opacity: 0.7, marginRight: '6px', fontWeight: 400 }}>₹{course.originalPrice.toLocaleString()}</span>}
                ₹{course.price.toLocaleString()}
              </span>
            )}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '40px 20px' }}>
        <div className="page-with-sidebar" style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '36px', alignItems: 'start' }}>
          <div>
            <div style={{ background: 'var(--bg-card)', borderRadius: '14px', padding: '28px', border: '1px solid var(--border-card)', marginBottom: '24px' }}>
              <h2 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '18px', color: 'var(--text)', marginBottom: '14px' }}>Course Overview</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '14.5px', lineHeight: '1.8', whiteSpace: 'pre-wrap' }}>{course.description}</p>
            </div>

            {course.highlights.length > 0 && (
              <div style={{ background: 'var(--bg-card)', borderRadius: '14px', padding: '28px', border: '1px solid var(--border-card)', marginBottom: '24px' }}>
                <h2 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '18px', color: 'var(--text)', marginBottom: '16px' }}>What You Will Learn</h2>
                <ul style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '10px', listStyle: 'none', padding: 0, margin: 0 }}>
                  {course.highlights.map((h, i) => (
                    <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', color: 'var(--text-muted)', fontSize: '13.5px' }}>
                      <span style={{ color: '#0f766e', fontWeight: 700, marginTop: '1px', flexShrink: 0 }}>✓</span> {h}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {course.tools.length > 0 && (
              <div style={{ background: 'var(--bg-card)', borderRadius: '14px', padding: '28px', border: '1px solid var(--border-card)', marginBottom: '24px' }}>
                <h2 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '18px', color: 'var(--text)', marginBottom: '14px' }}>Tools & Technologies</h2>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {course.tools.map((t) => (
                    <span key={t} style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: '12px', padding: '5px 12px', borderRadius: '20px', fontFamily: 'Poppins, sans-serif', fontWeight: 500 }}>
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {syllabusItems.length > 0 && (
              <div style={{ background: 'var(--bg-card)', borderRadius: '14px', padding: '28px', border: '1px solid var(--border-card)', marginBottom: '24px' }}>
                <h2 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '18px', color: 'var(--text)', marginBottom: '16px' }}>Syllabus</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                  {syllabusItems.map((item, i) => (
                    <details key={i} style={{ borderBottom: '1px solid var(--border)', padding: '0' }}>
                      <summary style={{ padding: '14px 0', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', listStyle: 'none', fontFamily: 'Poppins, sans-serif', fontWeight: 600, fontSize: '14px', color: 'var(--text)' }}>
                        <span style={{ background: '#0f766e', color: '#fff', width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', flexShrink: 0 }}>{i + 1}</span>
                        <span style={{ flex: 1 }}>{item.module ?? item.week}{(item.topic) ? ` — ${item.topic}` : ''}</span>
                        <span style={{ color: 'var(--text-muted)', fontSize: '18px', fontWeight: 400 }}>+</span>
                      </summary>
                      {(item.details || (item.topics && item.topics.length > 0)) && (
                        <div style={{ padding: '0 0 14px 38px', color: 'var(--text-muted)', fontSize: '13.5px', lineHeight: '1.7' }}>
                          {item.details}
                          {item.topics && item.topics.length > 0 && (
                            <ul style={{ margin: '4px 0 0', paddingLeft: '16px' }}>
                              {item.topics.map((t, ti) => <li key={ti}>{t}</li>)}
                            </ul>
                          )}
                        </div>
                      )}
                    </details>
                  ))}
                </div>
              </div>
            )}

            <RelatedCourses category={course.category} excludeSlug={course.slug} />
          </div>

          <div style={{ position: 'sticky', top: '80px' }}>
            <EnquirySidebar price={course.price} originalPrice={course.originalPrice} />
          </div>
        </div>
      </div>
    </>
  );
}

async function RelatedCourses({ category, excludeSlug }: { category: string; excludeSlug: string }) {
  const related = await getRelated(category, excludeSlug);
  if (related.length === 0) return null;
  return (
    <div style={{ background: 'var(--bg-card)', borderRadius: '14px', padding: '28px', border: '1px solid var(--border-card)' }}>
      <h2 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '18px', color: 'var(--text)', marginBottom: '16px' }}>Related Courses</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '14px' }}>
        {related.map((r) => (
          <Link key={r.id} href={getCourseUrl(r)} style={{ display: 'block', background: 'var(--bg-alt)', border: '1px solid var(--border)', borderRadius: '10px', padding: '14px', textDecoration: 'none' }}>
            <p style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 600, fontSize: '13px', color: 'var(--text)', marginBottom: '4px' }}>{r.title}</p>
            <p style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{r.duration}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

function EnquirySidebar({ price, originalPrice }: { price: number | null; originalPrice: number | null }) {
  return (
    <>
      <div style={{ background: 'var(--secondary)', borderRadius: '14px', padding: '24px', color: '#fff', marginBottom: '16px' }}>
        <h3 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '16px', marginBottom: '6px', color: '#fff' }}>
          {price != null ? `₹${price.toLocaleString()}` : 'Enrol Now'}
        </h3>
        {originalPrice && price && (
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px', textDecoration: 'line-through', marginBottom: '4px' }}>₹{originalPrice.toLocaleString()}</p>
        )}
        <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '12px', marginBottom: '18px' }}>Start your IT career with COSS</p>
        <input type="text" placeholder="Full Name" style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.1)', color: '#fff', fontSize: '13px', marginBottom: '10px', outline: 'none', boxSizing: 'border-box' }} />
        <input type="tel" placeholder="Mobile Number" style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.1)', color: '#fff', fontSize: '13px', marginBottom: '14px', outline: 'none', boxSizing: 'border-box' }} />
        <Link href="/free-demo-class/" style={{ display: 'block', textAlign: 'center', background: '#e47538', color: '#fff', padding: '12px', borderRadius: '6px', fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '13px', textDecoration: 'none' }}>
          Book Free Demo Class
        </Link>
      </div>
      <div style={{ background: 'var(--bg-card)', borderRadius: '12px', padding: '18px', border: '1px solid var(--border-card)' }}>
        <h4 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '13px', color: 'var(--text)', marginBottom: '10px' }}>Contact Us</h4>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.9' }}>
          <a href="tel:8885166007" style={{ color: '#e47538', fontWeight: 600 }}>+91 88851 66007</a><br />
          <a href="mailto:info@cosscloudsol.com" style={{ color: 'var(--text-muted)', fontSize: '12px' }}>info@cosscloudsol.com</a>
        </p>
      </div>
    </>
  );
}

// ─── Category Landing View ─────────────────────────────────────────────────────

function CategoryLandingView({ category }: { category: CategoryDetail }) {
  return (
    <>
      <ResponsivePageStyles />
      <div style={{ background: 'linear-gradient(135deg, #1a1a2e, #0f3460)', padding: '48px 20px 40px', color: '#fff' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ marginBottom: '12px' }}>
            <Link href="/courses" style={{ color: 'rgba(255,255,255,0.65)', fontSize: '13px' }}>Courses</Link>
            <span style={{ color: 'rgba(255,255,255,0.4)', margin: '0 8px' }}>›</span>
            <span style={{ color: 'rgba(255,255,255,0.65)', fontSize: '13px' }}>{category.name}</span>
          </div>
          <h1 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: 'clamp(24px, 4vw, 38px)', color: '#fff', marginBottom: '14px', lineHeight: 1.2 }}>
            {category.name} Training in Hyderabad
          </h1>
          {category.description && (
            <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '15px', lineHeight: '1.75', maxWidth: '700px', marginBottom: '16px' }}>
              {category.description}
            </p>
          )}
          <span style={{ background: 'rgba(255,255,255,0.12)', color: '#fff', fontSize: '13px', padding: '6px 14px', borderRadius: '6px', fontFamily: 'Poppins, sans-serif' }}>
            {category.courses.length} course{category.courses.length !== 1 ? 's' : ''} available
          </span>
        </div>
      </div>

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '48px 20px' }}>
        {category.courses.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
            <p style={{ fontSize: '16px' }}>No courses in this category yet. Check back soon.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
            {category.courses.map((course) => (
              <div key={course.id} style={{ background: 'var(--bg-card)', borderRadius: '14px', overflow: 'hidden', boxShadow: '0 3px 18px rgba(0,0,0,0.08)', border: '1px solid var(--border-card)', display: 'flex', flexDirection: 'column' }}>
                <div style={{ background: 'linear-gradient(135deg, #1a1a2e, #0f3460)', padding: '20px 20px 16px' }}>
                  {course.badge && (
                    <span style={{ display: 'inline-block', background: '#e47538', color: '#fff', fontSize: '11px', fontWeight: 700, padding: '2px 10px', borderRadius: '10px', fontFamily: 'Poppins, sans-serif', marginBottom: '8px' }}>{course.badge}</span>
                  )}
                  <h3 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '16px', color: '#fff', marginBottom: '8px', lineHeight: 1.3 }}>{course.title}</h3>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ background: 'rgba(255,255,255,0.1)', color: '#ddd', fontSize: '11px', padding: '3px 10px', borderRadius: '12px' }}>⏱ {course.duration}</span>
                    <span style={{ background: 'rgba(255,255,255,0.1)', color: '#ddd', fontSize: '11px', padding: '3px 10px', borderRadius: '12px' }}>📈 {course.level}</span>
                  </div>
                </div>
                <div style={{ padding: '16px 20px', flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <p style={{ color: 'var(--text-muted)', fontSize: '13px', lineHeight: '1.65', flex: 1 }}>{course.excerpt}</p>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    {course.price != null && (
                      <span style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '15px', color: 'var(--text)' }}>₹{course.price.toLocaleString()}</span>
                    )}
                    <Link
                      href={getCourseUrl(course)}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#e47538', color: '#fff', padding: '8px 18px', borderRadius: '6px', fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '13px', marginLeft: 'auto', textDecoration: 'none' }}
                    >
                      View Details →
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
