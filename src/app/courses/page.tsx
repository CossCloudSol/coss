import type { Metadata } from 'next';
import Link from 'next/link';
import { headers } from 'next/headers';
import { HeroBanner, CtaBanner, ResponsivePageStyles } from '@/components/shared';
import { buildPageMetadata } from '@/lib/get-page-seo';
import { getCourseUrl } from '@/lib/course-url';

export const dynamic = 'force-dynamic';

interface DbCourse {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  category: string;
  duration: string;
  mode: string;
  level: string;
  price: number | null;
  badge: string | null;
  featured: boolean;
  urlType: string;
  categorySlug: string | null;
}

interface DbCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  color: string | null;
  _count: { courses: number };
}

async function getDbCourses(): Promise<DbCourse[]> {
  const headerList = headers();
  const host = headerList.get('host') ?? 'localhost:3000';
  const proto = headerList.get('x-forwarded-proto') ?? (host.startsWith('localhost') ? 'http' : 'https');
  try {
    const res = await fetch(`${proto}://${host}/api/courses`, { cache: 'no-store' });
    if (!res.ok) return [];
    const data = await res.json();
    return data.courses ?? [];
  } catch {
    return [];
  }
}

async function getDbCategories(): Promise<DbCategory[]> {
  const headerList = headers();
  const host = headerList.get('host') ?? 'localhost:3000';
  const proto = headerList.get('x-forwarded-proto') ?? (host.startsWith('localhost') ? 'http' : 'https');
  try {
    const res = await fetch(`${proto}://${host}/api/categories`, { cache: 'no-store' });
    if (!res.ok) return [];
    const data = await res.json();
    return data.categories ?? [];
  } catch {
    return [];
  }
}

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata('courses');
}

const highlights = [
  { icon: '👨‍🏫', label: 'Expert Trainers' },
  { icon: '🛠️', label: 'Hands-on Labs' },
  { icon: '🏆', label: 'Certification' },
  { icon: '🚀', label: '100% Placement' },
  { icon: '📅', label: 'Flexible Batches' },
  { icon: '💰', label: 'Affordable Fees' },
];

const CATEGORY_EMOJIS: Record<string, string> = {
  'data-analytics-bi': '📊',
  'cloud-computing': '☁️',
  'devops-multi-cloud': '⚙️',
  'programming-full-stack': '💻',
  'data-engineering': '🔧',
  'cyber-security': '🔒',
  'erp-crm-enterprise-tools': '🏢',
  'software-testing-os': '🧪',
  'digital-design': '🎨',
  'professional-soft-skills': '🎯',
};

export default async function CoursesPage() {
  const [dbCourses, dbCategories] = await Promise.all([getDbCourses(), getDbCategories()]);

  return (
    <>
      <ResponsivePageStyles />
      <HeroBanner
        badge="30+ INDUSTRY-FOCUSED IT COURSES"
        titlePre="Master In-Demand "
        accentText="IT Skills"
        titleLine2="That Get You Hired"
        subtitle="Explore 30+ hands-on courses in Cloud Computing, DevOps, Data Science, Cyber Security & Full Stack — taught by certified industry experts in Hyderabad."
        stats={[
          { value: '30+',    label: 'COURSES OFFERED' },
          { value: '5,000+', label: 'STUDENTS TRAINED' },
          { value: '4.8★',   label: 'GOOGLE RATING' },
          { value: '100%',   label: 'PLACEMENT SUPPORT' },
        ]}
        ctaText="New batches every week · Register now to reserve your seat"
        breadcrumb={[{ label: 'Courses', href: '/courses/' }]}
      />

      {/* Highlights strip */}
      <div style={{ background: '#e47538', padding: '14px 0' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px', display: 'flex', gap: '10px', justifyContent: 'space-between', flexWrap: 'wrap' }}>
          {highlights.map(h => (
            <div key={h.label} style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#fff', fontSize: '13px', fontFamily: 'Poppins, sans-serif', fontWeight: 500, padding: '2px 0' }}>
              <span>{h.icon}</span> {h.label}
            </div>
          ))}
        </div>
      </div>

      {/* Intro */}
      <div style={{ background: 'var(--bg-alt)', padding: '44px 20px' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
          <div style={{ display: 'inline-block', background: 'rgba(228,117,56,0.1)', color: '#e8401c', fontSize: '12px', fontWeight: 600, fontFamily: 'Poppins, sans-serif', textTransform: 'uppercase', letterSpacing: '1px', padding: '4px 14px', borderRadius: '20px', marginBottom: '12px' }}>
            AI, Cloud, DevOps & More
          </div>
          <h2 style={{ fontFamily: 'Poppins, sans-serif', fontSize: 'clamp(22px,4vw,32px)', fontWeight: 700, color: 'var(--text)', marginBottom: '12px' }}>
            Industry-Leading IT Training in Hyderabad
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '15px', lineHeight: '1.75' }}>
            Coss Cloud Solutions offers 30+ industry-focused courses with practical lab sessions, expert trainers and 100% placement support. All programs are designed to make you job-ready from day one.
          </p>
        </div>
      </div>

      {/* DB-Driven Courses */}
      {dbCourses.length > 0 && (
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '48px 20px 0' }}>
          <div style={{ marginBottom: '28px', textAlign: 'center' }}>
            <div style={{ display: 'inline-block', background: 'rgba(15,118,110,0.1)', color: '#0f766e', fontSize: '12px', fontWeight: 600, fontFamily: 'Poppins, sans-serif', textTransform: 'uppercase', letterSpacing: '1px', padding: '4px 14px', borderRadius: '20px', marginBottom: '8px' }}>
              Available Now
            </div>
            <h2 style={{ fontFamily: 'Poppins, sans-serif', fontSize: 'clamp(20px,3.5vw,28px)', fontWeight: 700, color: 'var(--text)' }}>
              Enrollable Courses
            </h2>
          </div>
          <div className="course-list-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px', marginBottom: '48px' }}>
            {dbCourses.map((course) => (
              <div key={course.id} style={{ background: 'var(--bg-card)', borderRadius: '14px', overflow: 'hidden', boxShadow: '0 3px 18px rgba(0,0,0,0.08)', border: '1px solid var(--border-card)', display: 'flex', flexDirection: 'column' }}>
                <div style={{ background: 'linear-gradient(135deg, #1a1a2e, #0f3460)', padding: '20px 20px 16px' }}>
                  {course.badge && (
                    <span style={{ display: 'inline-block', background: '#e47538', color: '#fff', fontSize: '11px', fontWeight: 700, padding: '2px 10px', borderRadius: '10px', fontFamily: 'Poppins, sans-serif', marginBottom: '8px' }}>{course.badge}</span>
                  )}
                  <h3 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '16px', color: '#fff', marginBottom: '8px', lineHeight: 1.3 }}>{course.title}</h3>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ background: 'rgba(255,255,255,0.1)', color: '#ddd', fontSize: '11px', padding: '3px 10px', borderRadius: '12px' }}>⏱ {course.duration}</span>
                    <span style={{ background: 'rgba(255,255,255,0.1)', color: '#ddd', fontSize: '11px', padding: '3px 10px', borderRadius: '12px' }}>🏫 {course.mode}</span>
                    <span style={{ background: 'rgba(255,255,255,0.1)', color: '#ddd', fontSize: '11px', padding: '3px 10px', borderRadius: '12px' }}>📈 {course.level}</span>
                  </div>
                </div>
                <div style={{ padding: '16px 20px', flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <p style={{ color: 'var(--text-muted)', fontSize: '13px', lineHeight: '1.65', flex: 1 }}>{course.excerpt}</p>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    {course.price != null && (
                      <span style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '16px', color: 'var(--text)' }}>₹{course.price.toLocaleString()}</span>
                    )}
                    <Link href={getCourseUrl(course)} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#e47538', color: '#fff', padding: '8px 18px', borderRadius: '6px', fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '13px', marginLeft: 'auto', textDecoration: 'none' }}>
                      View Details →
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Course Categories — DB-driven */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '56px 20px' }}>
        <div className="course-list-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '28px' }}>
          {dbCategories.map((cat) => (
            <div key={cat.slug} style={{ background: 'var(--bg-card)', borderRadius: '14px', overflow: 'hidden', boxShadow: '0 3px 18px rgba(0,0,0,0.08)', border: '1px solid var(--border-card)', display: 'flex', flexDirection: 'column' }}>
              <div style={{ background: 'linear-gradient(135deg, #1a1a2e, #0f3460)', padding: '24px 24px 20px', position: 'relative' }}>
                <div style={{ position: 'absolute', top: '16px', right: '16px', background: cat.color ?? '#0f766e', borderRadius: '8px', width: '44px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px' }}>
                  {CATEGORY_EMOJIS[cat.slug] ?? '📚'}
                </div>
                <h3 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '18px', color: '#fff', marginBottom: '6px', paddingRight: '56px' }}>{cat.name}</h3>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  <span style={{ background: 'rgba(255,255,255,0.1)', color: '#ddd', fontSize: '11px', padding: '3px 10px', borderRadius: '12px' }}>
                    📚 {cat._count.courses} course{cat._count.courses !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
              <div style={{ padding: '20px 24px', flex: 1 }}>
                {cat.description && (
                  <p style={{ color: 'var(--text-muted)', fontSize: '13.5px', lineHeight: '1.65', marginBottom: '20px' }}>{cat.description}</p>
                )}
                <Link href={`/courses/${cat.slug}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#e47538', color: '#fff', padding: '10px 22px', borderRadius: '6px', fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '13px' }}>
                  View Courses →
                </Link>
              </div>
            </div>
          ))}
        </div>
        <CtaBanner />
      </div>
    </>
  );
}
