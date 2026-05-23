import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { ResponsivePageStyles } from '@/components/shared';

export const dynamic = 'force-dynamic';

interface SyllabusItem { week: string; topic: string; details: string }

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
}

async function getCourse(slug: string): Promise<CourseDetail | null> {
  const headerList = headers();
  const host = headerList.get('host') ?? 'localhost:3000';
  const proto = headerList.get('x-forwarded-proto') ?? (host.startsWith('localhost') ? 'http' : 'https');

  try {
    const res = await fetch(`${proto}://${host}/api/courses/${slug}`, { cache: 'no-store' });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

async function getRelated(category: string, excludeSlug: string): Promise<Array<{ id: string; title: string; slug: string; duration: string }>> {
  const headerList = headers();
  const host = headerList.get('host') ?? 'localhost:3000';
  const proto = headerList.get('x-forwarded-proto') ?? (host.startsWith('localhost') ? 'http' : 'https');

  try {
    const res = await fetch(`${proto}://${host}/api/courses?category=${encodeURIComponent(category)}`, { cache: 'no-store' });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.courses ?? []).filter((c: { slug: string }) => c.slug !== excludeSlug).slice(0, 3);
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const course = await getCourse(params.slug);
  if (!course) return { title: 'Course Not Found' };
  return {
    title: course.seoTitle ?? `${course.title} | COSS Cloud Solutions`,
    description: course.seoDesc ?? course.excerpt,
  };
}

export default async function CourseDetailPage({ params }: { params: { slug: string } }) {
  const course = await getCourse(params.slug);
  if (!course) notFound();

  const related = await getRelated(course.category, course.slug);
  const syllabusItems: SyllabusItem[] = Array.isArray(course.syllabus) ? course.syllabus : [];

  return (
    <>
      <ResponsivePageStyles />

      {/* Hero */}
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

          {/* Main */}
          <div>
            {/* Description */}
            <div style={{ background: 'var(--bg-card)', borderRadius: '14px', padding: '28px', border: '1px solid var(--border-card)', marginBottom: '24px' }}>
              <h2 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '18px', color: 'var(--text)', marginBottom: '14px' }}>Course Overview</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '14.5px', lineHeight: '1.8', whiteSpace: 'pre-wrap' }}>{course.description}</p>
            </div>

            {/* Highlights */}
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

            {/* Tools */}
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

            {/* Syllabus */}
            {syllabusItems.length > 0 && (
              <div style={{ background: 'var(--bg-card)', borderRadius: '14px', padding: '28px', border: '1px solid var(--border-card)', marginBottom: '24px' }}>
                <h2 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '18px', color: 'var(--text)', marginBottom: '16px' }}>Syllabus</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                  {syllabusItems.map((item, i) => (
                    <details key={i} style={{ borderBottom: '1px solid var(--border)', padding: '0' }}>
                      <summary style={{ padding: '14px 0', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', listStyle: 'none', fontFamily: 'Poppins, sans-serif', fontWeight: 600, fontSize: '14px', color: 'var(--text)' }}>
                        <span style={{ background: '#0f766e', color: '#fff', width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', flexShrink: 0 }}>{i + 1}</span>
                        <span style={{ flex: 1 }}>{item.week}{item.topic ? ` — ${item.topic}` : ''}</span>
                        <span style={{ color: 'var(--text-muted)', fontSize: '18px', fontWeight: 400 }}>+</span>
                      </summary>
                      {item.details && (
                        <div style={{ padding: '0 0 14px 38px', color: 'var(--text-muted)', fontSize: '13.5px', lineHeight: '1.7' }}>
                          {item.details}
                        </div>
                      )}
                    </details>
                  ))}
                </div>
              </div>
            )}

            {/* Related Courses */}
            {related.length > 0 && (
              <div style={{ background: 'var(--bg-card)', borderRadius: '14px', padding: '28px', border: '1px solid var(--border-card)' }}>
                <h2 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '18px', color: 'var(--text)', marginBottom: '16px' }}>Related Courses</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '14px' }}>
                  {related.map((r) => (
                    <Link key={r.id} href={`/courses/${r.slug}`} style={{ display: 'block', background: 'var(--bg-alt)', border: '1px solid var(--border)', borderRadius: '10px', padding: '14px', textDecoration: 'none' }}>
                      <p style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 600, fontSize: '13px', color: 'var(--text)', marginBottom: '4px' }}>{r.title}</p>
                      <p style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{r.duration}</p>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar enquiry form */}
          <div style={{ position: 'sticky', top: '80px' }}>
            <div style={{ background: 'var(--secondary)', borderRadius: '14px', padding: '24px', color: '#fff', marginBottom: '16px' }}>
              <h3 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '16px', marginBottom: '6px', color: '#fff' }}>
                {course.price != null ? `₹${course.price.toLocaleString()}` : 'Enrol Now'}
              </h3>
              {course.originalPrice && course.price && (
                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px', textDecoration: 'line-through', marginBottom: '4px' }}>₹{course.originalPrice.toLocaleString()}</p>
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
          </div>

        </div>
      </div>
    </>
  );
}
