import Link from 'next/link';
import WpImg from '@/components/WpImg';
import { CategoryIconDisplay } from '@/components/CategoryIconDisplay';
import { PageBanner, EnrollSidebar, CourseSidebarNav, CtaBanner, ResponsivePageStyles } from '@/components/shared';
import type { CourseCategoryData } from '@/lib/courseData';
import { courseCardDataMap } from '@/lib/courseData';
import { wpImages } from '@/lib/wpImages';
import CourseGrid from '@/components/CourseGrid';
import type { CourseCardProps } from '@/components/CourseCard';

const BADGE_MAP: Record<string, string> = {
  'popular': 'Popular',
  'most popular': 'Popular',
  'high demand': 'High Demand',
  'trending': 'Trending',
  'new': 'New',
  'newly added': 'New',
  'bestseller': 'Bestseller',
  'best seller': 'Bestseller',
  'updated 2026': 'Updated',
  'hot': 'Trending',
}

const BADGE_VARIANT_MAP: Record<string, CourseCardProps['badgeVariant']> = {
  'popular': 'orange',
  'most popular': 'orange',
  'high demand': 'rose',
  'trending': 'teal',
  'new': 'green',
  'newly added': 'green',
  'bestseller': 'amber',
  'best seller': 'amber',
  'updated 2026': 'amber',
  'hot': 'teal',
}

const ACCENT_MAP: Record<string, CourseCardProps['accentVariant']> = {
  'human-resource': 'hr',
  'hr': 'hr',
  'cloud-computing': 'cloud',
  'cloud': 'cloud',
  'medical-coding': 'medical',
  'medical': 'medical',
  'devops': 'devops',
  'devops-multi-cloud': 'devops',
  'sap': 'sap',
  'erp-crm-enterprise-tools': 'sap',
  'oracle': 'oracle',
  'data-analytics-bi': 'data',
  'data-engineering': 'data',
  'data': 'data',
  'cyber-security': 'security',
  'security': 'security',
  'programming-full-stack': 'fullstack',
  'full-stack': 'fullstack',
  'fullstack': 'fullstack',
  'digital-marketing': 'digital',
  'digital-design': 'digital',
  'digital': 'digital',
  'professional-soft-skills': 'softskills',
  'soft-skills': 'softskills',
  'quantum-computing': 'quantum',
  'quantum': 'quantum',
}

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

            {/* Upgraded course cards */}
            {(() => {
              const cards = courseCardDataMap[breadcrumbSlug];
              if (cards && cards.length > 0) {
                return (
                  <section className="py-12 px-0 rounded-2xl mb-10">
                    <div className="max-w-7xl mx-auto mb-10 text-center">
                      <h2 className="font-display text-3xl font-bold text-[#0D1B2A] tracking-tight">
                        Courses We Offer
                      </h2>
                      <p className="mt-2 text-slate-500 text-sm">
                        Choose the right programme for your goals
                      </p>
                    </div>
                    <CourseGrid courses={cards} />
                  </section>
                );
              }
              return (
                <section className="py-12 px-4">
                  <div className="max-w-7xl mx-auto mb-10 text-center">
                    <h2 className="font-display text-3xl font-bold text-[#0D1B2A] tracking-tight">
                      Courses We Offer
                    </h2>
                    <p className="mt-2 text-slate-500 text-sm">
                      Choose the right programme for your goals
                    </p>
                  </div>
                  <div className="max-w-7xl mx-auto">
                    <CourseGrid
                      courses={(data.courses ?? []).map((course: any, i: number) => {
                        const badgeKey = String(course.badge ?? course.tag ?? '').toLowerCase()
                        return {
                          title: course.title ?? '',
                          badge: BADGE_MAP[badgeKey] ?? 'Popular',
                          badgeVariant: BADGE_VARIANT_MAP[badgeKey] ?? 'orange',
                          accentVariant: ACCENT_MAP[data.slug] ?? 'hr',
                          duration: course.duration ?? course.months ?? '',
                          mode: course.mode ?? course.delivery ?? 'Classroom',
                          level: course.level ?? course.difficulty ?? 'Beginner',
                          rating: course.rating ?? 4.8,
                          reviewCount: String(course.reviews ?? course.reviewCount ?? '120+'),
                          enrolledCount: String(course.enrolled ?? course.enrolledCount ?? '500+'),
                          description: course.description ?? course.excerpt ?? '',
                          highlights: [
                            course.highlight1 ?? course.highlights?.[0] ?? 'Industry-relevant curriculum',
                            course.highlight2 ?? course.highlights?.[1] ?? 'Placement support included',
                          ] as [string, string],
                          originalPrice: String(course.originalPrice ?? course.mrp ?? ''),
                          discountedPrice: String(course.price ?? course.fee ?? course.discountedPrice ?? ''),
                          emi: course.emi ?? 'Easy EMI available',
                          urgency: course.urgency ?? course.seats ?? 'New batch starting soon · Limited seats',
                          href: course.href ?? course.slug ?? '#',
                          animationIndex: i,
                        }
                      })}
                    />
                  </div>
                </section>
              );
            })()}

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
