import Link from 'next/link';
import WpImg from '@/components/WpImg';
import { CategoryIconDisplay } from '@/components/CategoryIconDisplay';
import { CourseCardThumb } from '@/components/CourseCardThumb';
import { PageBanner, EnrollSidebar, CourseSidebarNav, CtaBanner, ResponsivePageStyles } from '@/components/shared';
import type { CourseCategoryData } from '@/lib/courseData';
import { wpImages } from '@/lib/wpImages';

export default function CourseCategoryPage({ data, breadcrumbSlug }: { data: CourseCategoryData; breadcrumbSlug: string }) {
  const imgs = wpImages[breadcrumbSlug];

  return (
    <>
      <ResponsivePageStyles />
      <PageBanner
        title={`${data.name} Training in Hyderabad`}
        breadcrumb={[{ label: 'Courses', href: '/courses/' }, { label: data.name, href: '#' }]}
      />

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '48px 20px' }}>
        <div className="page-with-sidebar" style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '36px', alignItems: 'start' }}>

          {/* ── Main Content ─────────────────────── */}
          <div>

            {/* Intro */}
            <div style={{ marginBottom: '36px' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', background: 'rgba(232,64,28,0.08)', padding: '5px 14px', borderRadius: '20px', marginBottom: '14px' }}>
                <CategoryIconDisplay slug={breadcrumbSlug} size={22} color="#e8401c" />
                <span style={{ color: '#e8401c', fontSize: '12px', fontWeight: 600, fontFamily: 'Poppins, sans-serif', textTransform: 'uppercase', letterSpacing: '1px' }}>{data.tagline}</span>
              </div>
              <h2 style={{ fontFamily: 'Poppins, sans-serif', fontSize: 'clamp(20px,3.5vw,28px)', fontWeight: 700, color: 'var(--text)', marginBottom: '12px' }}>
                {data.name} Training in Hyderabad
              </h2>
              <p style={{ color: 'var(--text-muted)', lineHeight: '1.8', fontSize: '15px' }}>{data.description}</p>
            </div>

            {/* Quick stats */}
            <div className="course-feat-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '12px', marginBottom: '40px' }}>
              {[
                { icon: '👨‍🏫', label: 'Expert Trainers', val: '10+ Yrs Exp' },
                { icon: '🛠️', label: 'Hands-on Labs',   val: 'Real Tools' },
                { icon: '🏆', label: 'Certifications',  val: 'Recognized' },
                { icon: '🚀', label: 'Placement',       val: '100% Support' },
              ].map(s => (
                <div key={s.label} style={{ background: 'var(--bg-alt)', borderRadius: '10px', padding: '14px 10px', textAlign: 'center', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '22px', marginBottom: '5px' }}>{s.icon}</div>
                  <div style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '11px', color: 'var(--text)', marginBottom: '2px' }}>{s.label}</div>
                  <div style={{ fontSize: '10px', color: 'var(--text-light)' }}>{s.val}</div>
                </div>
              ))}
            </div>

            {/* Sub-courses with REAL WP images */}
            {imgs?.subcourses?.length > 0 && (
              <div style={{ marginBottom: '40px' }}>
                <h3 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '20px', color: 'var(--text)', marginBottom: '20px', paddingBottom: '10px', borderBottom: '2px solid var(--border)' }}>
                  📚 Courses We Offer
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '18px' }} className="course-list-grid">
                  {imgs.subcourses.map(sub => (
                    <Link key={sub.href} href={sub.href} style={{ textDecoration: 'none', background: 'var(--bg-card)', borderRadius: '12px', overflow: 'hidden', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-card)', display: 'block' }}>
                      <div style={{ position: 'relative', height: '165px', overflow: 'hidden', background: 'linear-gradient(135deg,#1a1a2e,#0f3460)' }}>
                        <CourseCardThumb
                          thumbnail={sub.image}
                          title={sub.name}
                          categoryName={data.name}
                          categorySlug={breadcrumbSlug}
                        />
                      </div>
                      <div style={{ padding: '14px 16px' }}>
                        <h4 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '14px', color: 'var(--text)', marginBottom: '8px' }}>{sub.name}</h4>
                        <span style={{ color: '#e8401c', fontSize: '12px', fontFamily: 'Poppins, sans-serif', fontWeight: 600 }}>View Course →</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Course details */}
            <h3 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '20px', color: 'var(--text)', marginBottom: '20px', paddingBottom: '10px', borderBottom: '2px solid var(--border)' }}>
              📋 Course Details
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '40px' }}>
              {data.courses.map((course, i) => (
                <div key={i} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-card)', borderRadius: '12px', padding: '20px 22px', boxShadow: 'var(--shadow-sm)', borderLeft: '4px solid var(--primary)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
                    <h4 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '16px', color: 'var(--text)' }}>{course.name}</h4>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{ background: 'var(--primary-light)', color: 'var(--primary)', fontSize: '11px', padding: '3px 10px', borderRadius: '12px', fontFamily: 'Poppins, sans-serif', fontWeight: 600 }}>⏱ {course.duration}</span>
                      <span style={{ background: 'var(--surface)', color: 'var(--text-muted)', fontSize: '11px', padding: '3px 10px', borderRadius: '12px', fontFamily: 'Poppins, sans-serif', fontWeight: 500 }}>📈 {course.level}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '12px' }}>
                    {course.highlights.map(h => (
                      <span key={h} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '13px', color: 'var(--text-muted)' }}>
                        <span style={{ color: '#e8401c', fontWeight: 700 }}>✓</span> {h}
                      </span>
                    ))}
                  </div>
                  <Link href="/enroll-now-with-coss/" style={{ display: 'inline-flex', background: '#e47538', color: '#fff', padding: '8px 18px', borderRadius: '6px', fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '12px' }}>
                    Enroll Now →
                  </Link>
                </div>
              ))}
            </div>

            {/* Why Learn */}
            <div style={{ background: 'linear-gradient(135deg,#1a1a2e,#0f3460)', borderRadius: '14px', padding: '28px', marginBottom: '36px', color: '#fff' }}>
              <h3 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '18px', marginBottom: '16px' }}>💡 Why Learn {data.name}?</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                {data.whyLearn.map(w => (
                  <div key={w} style={{ display: 'flex', gap: '8px', fontSize: '13.5px', color: '#ccc', lineHeight: '1.5' }}>
                    <span style={{ color: '#e8401c', fontWeight: 700, flexShrink: 0 }}>✓</span><span>{w}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Tools */}
            <div style={{ marginBottom: '36px' }}>
              <h3 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '18px', color: 'var(--text)', marginBottom: '14px' }}>🔨 Tools & Technologies</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                {data.tools.map(t => (
                  <span key={t} style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: '13px', padding: '7px 16px', borderRadius: '20px', fontFamily: 'Poppins, sans-serif', fontWeight: 500 }}>{t}</span>
                ))}
              </div>
            </div>

            {/* Real company logos */}
            {imgs?.companyLogos?.length > 0 && (
              <div style={{ marginBottom: '36px' }}>
                <h3 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '18px', color: 'var(--text)', marginBottom: '16px' }}>🏢 Companies That Hire Our Graduates</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
                  {imgs.companyLogos.map((logo, i) => (
                    <div key={i} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '10px', padding: '10px 16px', boxShadow: 'var(--shadow-sm)', minWidth: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <WpImg src={logo} alt="Hiring company" style={{ height: '32px', width: 'auto', maxWidth: '90px', objectFit: 'contain' }} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Careers */}
            <div style={{ marginBottom: '36px' }}>
              <h3 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '18px', color: 'var(--text)', marginBottom: '14px' }}>🚀 Career Opportunities</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                {data.careers.map(c => (
                  <span key={c} style={{ background: 'var(--primary-light)', border: '1px solid rgba(228,117,56,0.3)', color: 'var(--primary)', fontSize: '13px', padding: '7px 16px', borderRadius: '20px', fontFamily: 'Poppins, sans-serif', fontWeight: 600 }}>{c}</span>
                ))}
              </div>
            </div>

            {/* FAQs */}
            <div style={{ marginBottom: '36px' }}>
              <h3 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '18px', color: 'var(--text)', marginBottom: '16px' }}>❓ Frequently Asked Questions</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {data.faqs.map((faq, i) => (
                  <div key={i} style={{ background: 'var(--bg-alt)', borderRadius: '10px', padding: '18px 20px', border: '1px solid var(--border)' }}>
                    <h4 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '14px', color: 'var(--text)', marginBottom: '8px' }}>Q: {faq.q}</h4>
                    <p style={{ color: 'var(--text-muted)', fontSize: '13.5px', lineHeight: '1.65' }}>A: {faq.a}</p>
                  </div>
                ))}
              </div>
            </div>

            <CtaBanner />
          </div>

          {/* Sidebar */}
          <div>
            <CourseSidebarNav active={data.name} />
            <EnrollSidebar />
          </div>
        </div>
      </div>
    </>
  );
}
