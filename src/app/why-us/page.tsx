import type { Metadata } from 'next';
import { HeroBanner, CtaBanner, ResponsivePageStyles } from '@/components/shared';
import { buildPageMetadata } from '@/lib/get-page-seo';

export const revalidate = 3600;
export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata('why-us');
}

const reasons = [
  { icon: '👨‍🏫', title: 'Industry Expert Trainers', desc: 'All our trainers are certified professionals with 10+ years of real-world IT experience. They don\'t just teach — they mentor you through the same challenges you\'ll face in the industry.', highlight: '10+ Years of Industry Experience' },
  { icon: '🛠️', title: 'Practical & Hands-on Learning', desc: 'Theory alone won\'t get you hired. Every course includes extensive lab sessions, real-world projects, and case studies on actual industry tools and platforms.', highlight: 'Real Labs. Real Projects. Real Tools.' },
  { icon: '📅', title: 'Flexible Batch Options', desc: 'We offer morning, evening, weekend and online batches to accommodate working professionals, students and career changers. You choose the schedule that works for you.', highlight: 'Weekday, Weekend & Online Options' },
  { icon: '💰', title: 'Affordable, Quality Training', desc: 'Premium IT education shouldn\'t break the bank. Our course fees are among the most competitive in Hyderabad, with EMI options and group discounts available.', highlight: 'Lowest Fees, Highest Quality' },
  { icon: '🏆', title: 'Industry-Recognized Certifications', desc: 'Our courses are aligned with globally recognized certifications from AWS, Microsoft, Google, CompTIA, and more — giving your resume a competitive edge.', highlight: 'AWS, Azure, Google & More' },
  { icon: '🚀', title: '100% Placement Assistance', desc: 'We take your career seriously. Our dedicated placement team provides resume building, mock interviews, company referrals, and interview coaching until you land your dream job.', highlight: '5000+ Students Placed' },
  { icon: '🔄', title: 'Updated Curriculum', desc: 'The IT industry evolves fast. Our curriculum is updated every quarter to include the latest technologies, tools, and industry best practices — so you always learn what\'s in demand.', highlight: 'Always Up-to-Date Content' },
  { icon: '👥', title: 'Small Batch Sizes', desc: 'We maintain small batch sizes (10–20 students) to ensure every student gets personal attention from the trainer and can ask questions freely without feeling lost in a crowd.', highlight: 'Personal Attention for Every Student' },
  { icon: '🌐', title: 'Online & Offline Training', desc: 'Can\'t attend in person? Join our live online sessions from anywhere in India. All online sessions are interactive with real-time Q&A and recorded for review.', highlight: 'Learn from Anywhere in India' },
];

const comparisons = [
  { feature: 'Industry Expert Trainers', coss: true, others: false },
  { feature: 'Hands-on Lab Access', coss: true, others: 'Partial' },
  { feature: '100% Placement Support', coss: true, others: false },
  { feature: 'Flexible Batch Schedules', coss: true, others: 'Partial' },
  { feature: 'Updated Curriculum', coss: true, others: false },
  { feature: 'Small Batch Sizes', coss: true, others: false },
  { feature: 'Affordable Pricing', coss: true, others: false },
  { feature: 'Mock Interviews', coss: true, others: 'Partial' },
  { feature: 'Online + Offline Modes', coss: true, others: false },
  { feature: 'Post-Course Support', coss: true, others: false },
];

export default function WhyUsPage() {
  return (
    <>
      <ResponsivePageStyles />
      <HeroBanner
        badge="WHY 5,000+ STUDENTS CHOOSE COSS CLOUD SOLUTIONS"
        titlePre="The "
        accentText="Smarter Choice"
        titleLine2="for IT Training in Hyderabad"
        subtitle="Small batches, real-project training, certified trainers with 10+ years of experience & 100% placement support — see what sets Coss Cloud Solutions apart."
        stats={[
          { value: '5,000+', label: 'STUDENTS TRAINED' },
          { value: '15+',    label: 'YEARS EXPERIENCE' },
          { value: '50+',    label: 'HIRING PARTNERS' },
          { value: '100%',   label: 'PLACEMENT SUPPORT' },
        ]}
        ctaText="Book a free demo class · No fees, no pressure"
        breadcrumb={[{ label: 'About Us', href: '/about-us/' }, { label: 'Why Us', href: '/why-us/' }]}
      />

      {/* Reasons */}
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '56px 20px' }}>
        <div style={{ textAlign: 'center', marginBottom: '44px' }}>
          <div style={{ display: 'inline-block', background: 'rgba(228,117,56,0.1)', color: '#e8401c', fontSize: '12px', fontWeight: 600, fontFamily: 'Poppins, sans-serif', textTransform: 'uppercase', letterSpacing: '1px', padding: '4px 14px', borderRadius: '20px', marginBottom: '12px' }}>9 Strong Reasons</div>
          <h2 style={{ fontFamily: 'Poppins, sans-serif', fontSize: 'clamp(20px,3.5vw,30px)', fontWeight: 700, color: 'var(--text)' }}>Why 5000+ Students Choose Coss Cloud Solutions</h2>
        </div>
        <div className="why-feature-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '22px' }}>
          {reasons.map((r, i) => (
            <div
              key={r.title}
              // Removed inline border so Tailwind's hover:border-teal-200 can
              // actually swap the border color on hover (inline border would
              // have outranked the hover utility).
              className="border border-gray-100 hover:border-teal-200 transition-colors"
              style={{ background: 'var(--bg-card)', borderRadius: '14px', padding: '28px 22px', boxShadow: '0 3px 18px rgba(0,0,0,0.08)', position: 'relative', overflow: 'hidden' }}
            >
              <div style={{ position: 'absolute', top: '-12px', right: '-8px', fontFamily: 'Poppins, sans-serif', fontSize: '72px', fontWeight: 900, color: 'rgba(232,64,28,0.04)', lineHeight: 1 }}>{String(i + 1).padStart(2, '0')}</div>
              <div className="p-3 bg-teal-50 rounded-xl inline-flex mb-3" style={{ fontSize: '32px', lineHeight: 1 }}>{r.icon}</div>
              <div style={{ background: '#fff3f0', color: '#e8401c', fontSize: '11px', fontFamily: 'Poppins, sans-serif', fontWeight: 600, padding: '3px 10px', borderRadius: '12px', marginBottom: '10px', display: 'inline-block' }}>{r.highlight}</div>
              <h4 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '15px', color: 'var(--text)', marginBottom: '8px' }}>{r.title}</h4>
              <p style={{ color: 'var(--text-muted)', fontSize: '13.5px', lineHeight: '1.65' }}>{r.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Comparison Table */}
      <div style={{ background: 'var(--bg-alt)', padding: '56px 20px' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '36px' }}>
            <div style={{ display: 'inline-block', background: 'rgba(228,117,56,0.1)', color: '#e8401c', fontSize: '12px', fontWeight: 600, fontFamily: 'Poppins, sans-serif', textTransform: 'uppercase', letterSpacing: '1px', padding: '4px 14px', borderRadius: '20px', marginBottom: '12px' }}>Comparison</div>
            <h2 style={{ fontFamily: 'Poppins, sans-serif', fontSize: 'clamp(20px,3.5vw,28px)', fontWeight: 700, color: 'var(--text)' }}>Coss Cloud Solutions vs Other Institutes</h2>
          </div>
          <div style={{ background: 'var(--bg-card)', borderRadius: '14px', overflow: 'hidden', boxShadow: '0 3px 18px rgba(0,0,0,0.08)' }}>
            {/* Header */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', background: '#1a1a2e', color: '#fff', fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '14px' }}>
              <div style={{ padding: '14px 20px' }}>Feature</div>
              <div style={{ padding: '14px 20px', textAlign: 'center', background: '#e47538' }}>Coss Cloud Solutions</div>
              <div style={{ padding: '14px 20px', textAlign: 'center' }}>Other Institutes</div>
            </div>
            {comparisons.map((c, i) => (
              <div key={c.feature} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', background: i % 2 === 0 ? 'var(--bg-card)' : 'var(--bg-alt)', borderBottom: '1px solid var(--border)' }}>
                <div style={{ padding: '13px 20px', fontSize: '13.5px', color: 'var(--text)', fontWeight: 500 }}>{c.feature}</div>
                <div style={{ padding: '13px 20px', textAlign: 'center', color: '#22c55e', fontSize: '18px', background: 'rgba(232,64,28,0.03)' }}>✓</div>
                <div style={{ padding: '13px 20px', textAlign: 'center', color: c.others === true ? '#22c55e' : c.others === 'Partial' ? '#f59e0b' : '#e47538', fontSize: c.others === true ? '18px' : '13px', fontWeight: c.others === 'Partial' ? 600 : 400 }}>
                  {c.others === true ? '✓' : c.others === 'Partial' ? 'Partial' : '✗'}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '48px 20px 0' }}>
        <CtaBanner />
      </div>
      <div style={{ height: '48px' }} />
    </>
  );
}
