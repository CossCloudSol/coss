import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { ResponsivePageStyles } from '@/components/shared';
import { formatBatchDate, getBatchStatusBadge } from '@/lib/batch-utils';
import { buildWhatsAppUrl, batchBookingMessage } from '@/lib/whatsapp';
import { sanitizeDescription } from '@/lib/sanitizeDescription';
import { buildPageMetadataWithFallback, getPageSchemaMarkup } from '@/lib/get-page-seo';
import { getCourseInCategory } from '@/lib/course-queries';
import { findBatches } from '@/lib/batch-queries';
import { getRelatedCourses } from '@/lib/related-courses';
import RelatedCourses from '@/components/RelatedCourses';
import { prisma } from '@/lib/db';

export const revalidate = 300;

export async function generateStaticParams() {
  try {
    const courses = await prisma.course.findMany({
      where: { status: 'published', categorySlug: { not: null } },
      select: { slug: true, categorySlug: true },
    });
    return courses
      .filter((c): c is { slug: string; categorySlug: string } => c.categorySlug !== null)
      .map((c) => ({ slug: c.categorySlug, courseSlug: c.slug }));
  } catch {
    return [];
  }
}

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

async function getCourse(categorySlug: string, slug: string): Promise<CourseDetail | null> {
  const course = await getCourseInCategory(categorySlug, slug);
  return course as unknown as CourseDetail | null;
}

interface BatchItem2 {
  id: string; batchName: string; mode: string; centre: string | null;
  startDate: string; schedule: string; totalSeats: number | null;
  seatsAvailable: number | null; status: string;
}

async function getCourseBatches2(courseId: string): Promise<BatchItem2[]> {
  const batches = await findBatches({ courseId });
  return batches.slice(0, 3) as unknown as BatchItem2[];
}

export async function generateMetadata({ params }: { params: { slug: string; courseSlug: string } }): Promise<Metadata> {
  const course = await getCourse(params.slug, params.courseSlug);
  if (!course) return { title: 'Course Not Found' };
  const fallback: Metadata = {
    title: course.seoTitle ?? course.title,
    description: course.seoDesc ?? course.excerpt,
    openGraph: course.thumbnail ? { images: [{ url: course.thumbnail }] } : undefined,
  };
  return buildPageMetadataWithFallback(`courses/${params.slug}/${params.courseSlug}`, fallback);
}

export default async function NestedCourseDetailPage({ params }: { params: { slug: string; courseSlug: string } }) {
  const course = await getCourse(params.slug, params.courseSlug);
  if (!course) notFound();

  const [related, courseBatches, customSchema] = await Promise.all([
    getRelatedCourses(course.categorySlug, course.id),
    getCourseBatches2(course.id),
    getPageSchemaMarkup(`courses/${params.slug}/${params.courseSlug}`),
  ]);
  const syllabusItems: SyllabusItem[] = Array.isArray(course.syllabus) ? course.syllabus : [];

  return (
    <>
      {customSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(customSchema) }}
        />
      )}
      <ResponsivePageStyles />

      <div style={{ background: 'linear-gradient(135deg, #1a1a2e, #0f3460)', padding: '48px 20px 40px', color: '#fff' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ marginBottom: '12px' }}>
            <Link href="/courses" style={{ color: 'rgba(255,255,255,0.65)', fontSize: '13px' }}>Courses</Link>
            <span style={{ color: 'rgba(255,255,255,0.4)', margin: '0 8px' }}>›</span>
            <Link href={`/courses/${params.slug}`} style={{ color: 'rgba(255,255,255,0.65)', fontSize: '13px' }}>{course.category}</Link>
            <span style={{ color: 'rgba(255,255,255,0.4)', margin: '0 8px' }}>›</span>
            <span style={{ color: 'rgba(255,255,255,0.65)', fontSize: '13px' }}>{course.title}</span>
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
            {sanitizeDescription(course.excerpt)}
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
              <p style={{ color: 'var(--text-muted)', fontSize: '14.5px', lineHeight: '1.8', whiteSpace: 'pre-wrap' }}>{sanitizeDescription(course.description)}</p>
            </div>

            {course.highlights.length > 0 && (
              <div style={{ background: 'var(--bg-card)', borderRadius: '14px', padding: '28px', border: '1px solid var(--border-card)', marginBottom: '24px' }}>
                <h2 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '18px', color: 'var(--text)', marginBottom: '16px' }}>What You Will Learn</h2>
                <ul style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '10px', listStyle: 'none', padding: 0, margin: 0 }}>
                  {course.highlights.map((h, i) => (
                    <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', color: 'var(--text-muted)', fontSize: '13.5px' }}>
                      <span style={{ color: '#0f766e', fontWeight: 700, marginTop: '1px', flexShrink: 0 }}>✓</span> {sanitizeDescription(h)}
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
                        <span style={{ flex: 1 }}>{item.module ?? item.week}{item.topic ? ` — ${item.topic}` : ''}</span>
                        <span style={{ color: 'var(--text-muted)', fontSize: '18px', fontWeight: 400 }}>+</span>
                      </summary>
                      {(item.details || (item.topics && item.topics.length > 0)) && (
                        <div style={{ padding: '0 0 14px 38px', color: 'var(--text-muted)', fontSize: '13.5px', lineHeight: '1.7' }}>
                          {sanitizeDescription(item.details)}
                          {item.topics && item.topics.length > 0 && (
                            <ul style={{ margin: '4px 0 0', paddingLeft: '16px' }}>
                              {item.topics.map((t, ti) => <li key={ti}>{sanitizeDescription(t)}</li>)}
                            </ul>
                          )}
                        </div>
                      )}
                    </details>
                  ))}
                </div>
              </div>
            )}

            {courseBatches.length > 0 && (
              <div style={{ background: 'var(--bg-card)', borderRadius: '14px', padding: '28px', border: '1px solid var(--border-card)', marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <h2 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '18px', color: 'var(--text)', margin: 0 }}>
                    Upcoming Batches for this Course
                  </h2>
                  <Link href="/batches" style={{ fontSize: '13px', color: '#0f766e', fontWeight: 600, textDecoration: 'none' }}>View all →</Link>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {courseBatches.map((b) => {
                    const badge = getBatchStatusBadge(b.status);
                    const dateStr = formatBatchDate(b.startDate);
                    const waMsg = batchBookingMessage({ courseName: course.title, mode: b.mode, startDate: dateStr, centre: b.centre, schedule: b.schedule });
                    const waUrl = buildWhatsAppUrl(waMsg);
                    return (
                      <div key={b.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', padding: '16px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px' }}>
                        <div style={{ flex: 1, minWidth: '180px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>{dateStr}</span>
                            <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '10px', background: badge.color === 'blue' ? '#dbeafe' : badge.color === 'green' ? '#dcfce7' : '#f1f5f9', color: badge.color === 'blue' ? '#1d4ed8' : badge.color === 'green' ? '#15803d' : '#64748b' }}>
                              {badge.label}
                            </span>
                          </div>
                          <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
                            {b.mode}{b.centre ? ` · ${b.centre}` : ''} · {b.schedule}
                          </p>
                        </div>
                        {b.mode !== 'Online' && b.seatsAvailable !== null && (
                          <span style={{ fontSize: '12px', fontWeight: 600, color: b.seatsAvailable <= 3 ? '#dc2626' : b.seatsAvailable <= 6 ? '#d97706' : '#16a34a' }}>
                            {b.seatsAvailable} seats left
                          </span>
                        )}
                        {b.mode === 'Online' && <span style={{ fontSize: '12px', fontWeight: 600, color: '#16a34a' }}>Unlimited</span>}
                        <a href={waUrl} target="_blank" rel="noopener noreferrer" style={{ background: '#e47538', color: '#fff', fontSize: '12px', fontWeight: 700, padding: '8px 16px', borderRadius: '8px', textDecoration: 'none', whiteSpace: 'nowrap' }}>
                          Book Seat
                        </a>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <RelatedCourses related={related} />
          </div>

          <div style={{ position: 'sticky', top: '80px' }}>
            <div style={{ background: 'var(--secondary)', borderRadius: '14px', padding: '24px', color: '#fff', marginBottom: '16px' }}>
              <h3 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '16px', marginBottom: '6px', color: '#fff' }}>
                {course.price != null ? `₹${course.price.toLocaleString()}` : 'Enrol Now'}
              </h3>
              {course.originalPrice && course.price && (
                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px', textDecoration: 'line-through', marginBottom: '4px' }}>₹{course.originalPrice.toLocaleString()}</p>
              )}
              <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '12px', marginBottom: '18px' }}>Start your IT career with Coss Cloud Solutions</p>
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
