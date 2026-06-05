import type { Metadata } from 'next';
import { HeroBanner, CtaBanner, ResponsivePageStyles } from '@/components/shared';
import CountUp from '@/components/CountUp';

import { buildPageMetadata } from '@/lib/get-page-seo';

export const dynamic = 'force-dynamic';
export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata('placements');
}

const stats = [
  { n: '5000+', label: 'Students Placed', icon: '🎓' },
  { n: '50+', label: 'Hiring Partners', icon: '🏢' },
  { n: '100%', label: 'Placement Assistance', icon: '🚀' },
  { n: '₹3–25L', label: 'Salary Packages', icon: '💰' },
];

const placementProcess = [
  { step: '01', icon: '📝', title: 'Resume Building', desc: 'Our career experts help you craft a professional, ATS-optimized resume that gets shortlisted.' },
  { step: '02', icon: '🎤', title: 'Mock Interviews', desc: 'Practice with real interview scenarios — technical rounds, HR rounds, and group discussions.' },
  { step: '03', icon: '💻', title: 'Technical Preparation', desc: 'Domain-specific technical preparation including coding tests, aptitude, and case studies.' },
  { step: '04', icon: '🤝', title: 'Job Referrals', desc: 'We connect you directly with our network of 50+ hiring partners and IT companies.' },
  { step: '05', icon: '📊', title: 'Interview Coaching', desc: 'One-on-one coaching sessions to build confidence and sharpen your interview skills.' },
  { step: '06', icon: '🏆', title: 'Offer Negotiation', desc: 'Guidance on evaluating and negotiating job offers to maximize your package.' },
];

const placedRoles = [
  { role: 'Cloud Engineer', company: 'Amazon / AWS', package: '₹8–18 LPA' },
  { role: 'DevOps Engineer', company: 'TCS / Infosys / HCL', package: '₹6–15 LPA' },
  { role: 'Data Scientist', company: 'Deloitte / Capgemini', package: '₹8–25 LPA' },
  { role: 'Full Stack Developer', company: 'Wipro / Tech Mahindra', package: '₹5–12 LPA' },
  { role: 'Cyber Security Analyst', company: 'IBM / Accenture', package: '₹6–14 LPA' },
  { role: 'SAP Consultant', company: 'Cognizant / Infosys', package: '₹6–18 LPA' },
  { role: 'Python Developer', company: 'Startups / MNCs', package: '₹4–10 LPA' },
  { role: 'Power BI Developer', company: 'KPMG / EY / PwC', package: '₹5–12 LPA' },
];

const companies = ['Amazon', 'TCS', 'Infosys', 'Wipro', 'HCL', 'Tech Mahindra', 'Accenture', 'IBM', 'Capgemini', 'Cognizant', 'Deloitte', 'Microsoft', 'Google', 'Oracle', 'SAP', 'Salesforce', 'KPMG', 'EY', 'PwC', 'Freshworks'];

const testimonials = [
  { name: 'Rahul K.', role: 'Cloud Engineer at Amazon', review: 'Coss Cloud Solutions completely transformed my career. Their AWS training and placement support helped me land a role at Amazon with a 12 LPA package!', initials: 'RK' },
  { name: 'Priya M.', role: 'DevOps Engineer at TCS', review: 'The mock interviews and resume building sessions were incredibly helpful. I cleared 5 rounds at TCS thanks to their preparation guidance.', initials: 'PM' },
  { name: 'Santhosh R.', role: 'Data Scientist at Deloitte', review: 'From zero to Deloitte in 6 months! The data science curriculum and placement team are outstanding. Highly recommended!', initials: 'SR' },
  { name: 'Divya L.', role: 'Full Stack Developer at Wipro', review: 'The Java Full Stack training gave me both technical skills and interview confidence. Got placed within 2 weeks of completing the course!', initials: 'DL' },
];

export default function PlacementsPage() {
  return (
    <>
      <ResponsivePageStyles />
      <HeroBanner
        badge="100% PLACEMENT ASSISTANCE"
        titlePre="Land Your "
        accentText="Dream IT Job"
        titleLine2="with Guaranteed Support"
        subtitle="Dedicated placement cell, 50+ hiring partners, resume building & mock interviews — 5,000+ students placed with packages up to ₹25 LPA."
        stats={[
          { value: '5,000+',   label: 'STUDENTS PLACED' },
          { value: '50+',      label: 'HIRING PARTNERS' },
          { value: '₹25 LPA',  label: 'HIGHEST PACKAGE' },
          { value: '₹5.8 LPA', label: 'AVERAGE PACKAGE' },
        ]}
        ctaText="Free placement counselling · Mon–Sat 9 am–7 pm"
        breadcrumb={[{ label: 'Placements', href: '/placements/' }]}
      />

      {/* Stats */}
      <div style={{ background: '#e47538', padding: '36px 20px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div className="placement-stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', textAlign: 'center' }}>
            {stats.map(s => (
              <div key={s.label}>
                <div style={{ fontSize: '28px', marginBottom: '6px' }}>{s.icon}</div>
                {/* CountUp animates the leading number on scroll-in. Color is
                    kept #fff because this whole row sits on an orange band —
                    spec'd text-teal-600 would be invisible here. */}
                <CountUp
                  value={s.n}
                  style={{ fontFamily: 'Poppins, sans-serif', fontSize: '30px', fontWeight: 800, color: '#fff', lineHeight: 1, display: 'inline-block' }}
                />
                <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: '13px', marginTop: '4px' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Intro */}
      <div style={{ background: 'var(--bg-alt)', padding: '56px 20px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div className="page-two-col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '56px', alignItems: 'center' }}>
            <div>
              <div style={{ display: 'inline-block', background: 'rgba(228,117,56,0.1)', color: '#e8401c', fontSize: '12px', fontWeight: 600, fontFamily: 'Poppins, sans-serif', textTransform: 'uppercase', letterSpacing: '1px', padding: '4px 14px', borderRadius: '20px', marginBottom: '14px' }}>
                Our Placement Program
              </div>
              <h2 style={{ fontFamily: 'Poppins, sans-serif', fontSize: 'clamp(22px,3.5vw,30px)', fontWeight: 700, color: 'var(--text)', marginBottom: '14px' }}>
                100% Placement Support for Every Student
              </h2>
              <p style={{ color: 'var(--text-muted)', lineHeight: '1.8', marginBottom: '20px', fontSize: '15px' }}>
                At Coss Cloud Solutions, we don&apos;t just train you — we take responsibility for your placement. Our dedicated placement team works round the clock to connect you with the right opportunities.
              </p>
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {[
                  'Professional resume writing & LinkedIn optimization',
                  'Mock technical & HR interviews with expert feedback',
                  'Direct referrals to 50+ partner companies',
                  'Interview scheduling and follow-up support',
                  'Soft skills and communication training',
                  'Salary negotiation guidance',
                ].map(item => (
                  <li key={item} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '10px', fontSize: '14px', color: 'var(--text-muted)' }}>
                    <span style={{ color: '#e8401c', fontWeight: 700, flexShrink: 0 }}>✓</span> {item}
                  </li>
                ))}
              </ul>
            </div>
            <div style={{ background: '#1a1a2e', borderRadius: '16px', padding: '28px', color: '#fff' }}>
              <h3 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '18px', marginBottom: '18px', color: '#fff' }}>🎓 Our Placement Stats</h3>
              {[
                { label: 'Students placed in 2024', value: '1200+' },
                { label: 'Average salary package', value: '₹5.8 LPA' },
                { label: 'Highest package offered', value: '₹25 LPA' },
                { label: 'Time to placement (avg)', value: '45–60 days' },
                { label: 'Companies that hired', value: '50+' },
                { label: 'Repeat hiring companies', value: '85%' },
              ].map(s => (
                <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.08)', fontSize: '13px' }}>
                  <span style={{ color: '#bbb' }}>{s.label}</span>
                  <span className="text-teal-400 font-bold text-base" style={{ fontFamily: 'Poppins, sans-serif' }}>{s.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Placement Process */}
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '56px 20px' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{ display: 'inline-block', background: 'rgba(228,117,56,0.1)', color: '#e8401c', fontSize: '12px', fontWeight: 600, fontFamily: 'Poppins, sans-serif', textTransform: 'uppercase', letterSpacing: '1px', padding: '4px 14px', borderRadius: '20px', marginBottom: '12px' }}>Our Process</div>
          <h2 style={{ fontFamily: 'Poppins, sans-serif', fontSize: 'clamp(20px,3.5vw,28px)', fontWeight: 700, color: 'var(--text)' }}>How Our Placement Process Works</h2>
        </div>
        <div className="process-steps" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
          {placementProcess.map(p => (
            <div key={p.step} style={{ background: 'var(--bg-card)', borderRadius: '12px', padding: '26px 20px', boxShadow: '0 2px 14px rgba(0,0,0,0.07)', border: '1px solid var(--border-card)', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: '-8px', right: '10px', fontFamily: 'Poppins, sans-serif', fontSize: '56px', fontWeight: 900, color: 'rgba(232,64,28,0.06)', lineHeight: 1 }}>{p.step}</div>
              <div style={{ fontSize: '28px', marginBottom: '10px' }}>{p.icon}</div>
              <h4 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '15px', color: 'var(--text)', marginBottom: '8px' }}>{p.title}</h4>
              <p style={{ color: 'var(--text-muted)', fontSize: '13px', lineHeight: '1.6' }}>{p.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Placed Roles */}
      <div style={{ background: 'var(--bg-alt)', padding: '56px 20px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '36px' }}>
            <div style={{ display: 'inline-block', background: 'rgba(228,117,56,0.1)', color: '#e8401c', fontSize: '12px', fontWeight: 600, fontFamily: 'Poppins, sans-serif', textTransform: 'uppercase', letterSpacing: '1px', padding: '4px 14px', borderRadius: '20px', marginBottom: '12px' }}>Success Stories</div>
            <h2 style={{ fontFamily: 'Poppins, sans-serif', fontSize: 'clamp(20px,3.5vw,28px)', fontWeight: 700, color: 'var(--text)' }}>Our Students Are Working At</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px', marginBottom: '36px' }} className="course-list-grid">
            {placedRoles.map(r => (
              <div key={r.role} style={{ background: 'var(--bg-card)', borderRadius: '10px', padding: '18px 20px', boxShadow: '0 2px 10px rgba(0,0,0,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', borderLeft: '4px solid #e8401c' }}>
                <div>
                  <div style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '14px', color: 'var(--text)' }}>{r.role}</div>
                  <div style={{ color: '#777', fontSize: '12px', marginTop: '2px' }}>{r.company}</div>
                </div>
                <span style={{ background: '#fff3f0', color: '#e8401c', fontSize: '12px', padding: '4px 12px', borderRadius: '12px', fontFamily: 'Poppins, sans-serif', fontWeight: 600 }}>{r.package}</span>
              </div>
            ))}
          </div>
          {/* Company logos strip — same white-card treatment as homepage */}
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {companies.map(c => (
              <div
                key={c}
                title={c}
                className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4 flex items-center justify-center h-20 grayscale hover:grayscale-0 transition-all duration-300 text-gray-400 dark:text-gray-400 font-medium text-sm text-center"
                style={{ fontFamily: 'Poppins, sans-serif' }}
              >
                {c}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Fee Structure ── */}
      <div style={{ background: '#0f1e3d', padding: '64px 20px' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '36px' }}>
            <div style={{ display: 'inline-block', background: 'rgba(249,115,22,0.15)', color: '#F97316', fontSize: '12px', fontWeight: 600, fontFamily: 'Poppins, sans-serif', textTransform: 'uppercase', letterSpacing: '1px', padding: '4px 14px', borderRadius: '20px', marginBottom: '14px' }}>Pricing</div>
            <h2 style={{ fontFamily: 'Poppins, sans-serif', fontSize: 'clamp(24px,4vw,34px)', fontWeight: 700, color: '#fff', marginBottom: '10px' }}>Fee Structure</h2>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '15px' }}>Transparent pricing with flexible payment options</p>
          </div>

          {/* Two-column cards */}
          <div className="placement-fee-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>

            {/* LEFT — Pre-Placement */}
            <div style={{ background: '#fff', borderRadius: '16px', padding: '32px 28px', boxShadow: '0 4px 24px rgba(0,0,0,0.18)' }}>
              <h3 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '18px', color: '#1a1a2e', marginBottom: '6px' }}>Pre-Placement Fee</h3>
              <div style={{ fontFamily: 'Poppins, sans-serif', fontSize: '36px', fontWeight: 800, color: '#F97316', marginBottom: '6px', lineHeight: 1.1 }}>₹7,000 <span style={{ fontSize: '16px', fontWeight: 600, color: '#555' }}>+ GST</span></div>
              <p style={{ color: '#666', fontSize: '14px', marginBottom: '14px', fontStyle: 'italic' }}>One-time non-refundable fee</p>
              <div style={{ background: '#fff8f5', border: '1px solid #fdd6b8', borderRadius: '10px', padding: '14px 16px' }}>
                <p style={{ color: '#7c4a1e', fontSize: '13.5px', lineHeight: '1.7', margin: 0 }}>
                  Covers registration, training materials &amp; placement assistance
                </p>
              </div>
            </div>

            {/* RIGHT — Post-Placement */}
            <div style={{ background: '#fff', borderRadius: '16px', padding: '32px 28px', boxShadow: '0 4px 24px rgba(0,0,0,0.18)' }}>
              <h3 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '18px', color: '#1a1a2e', marginBottom: '20px' }}>Post-Placement Fee</h3>
              {[
                { label: 'Fresher', amount: '₹30,000', note: '+ GST (Payable After Placement)' },
                { label: 'Experienced (5.1 – 10 LPA)', amount: '₹50,000', note: '+ GST (Payable After Placement)' },
                { label: 'Experienced (10.1 – 25 LPA)', amount: 'One Month Salary', note: '+ GST (Payable After Placement)' },
              ].map((tier, i, arr) => (
                <div
                  key={tier.label}
                  style={{
                    paddingTop: i === 0 ? 0 : '16px',
                    paddingBottom: i === arr.length - 1 ? 0 : '16px',
                    borderBottom: i === arr.length - 1 ? 'none' : '1px solid #eee',
                  }}
                >
                  <div style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 600, fontSize: '13.5px', color: '#333', marginBottom: '4px' }}>{tier.label}</div>
                  <div style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: '22px', color: '#F97316', lineHeight: 1.1, marginBottom: '2px' }}>{tier.amount}</div>
                  <div style={{ color: '#888', fontSize: '12px' }}>{tier.note}</div>
                </div>
              ))}
            </div>
          </div>

          {/* GST note + CTA */}
          <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '12.5px', textAlign: 'center', marginBottom: '24px' }}>
            * All fees are subject to GST as applicable
          </p>
          <div style={{ textAlign: 'center' }}>
            <a href="/contact-us/" style={{ display: 'inline-block', background: '#F97316', color: '#fff', padding: '14px 36px', borderRadius: '10px', fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '15px', textDecoration: 'none', boxShadow: '0 4px 18px rgba(249,115,22,0.4)' }}>
              Apply for Placement Program →
            </a>
          </div>
        </div>

        {/* Mobile stack override */}
        <style>{`@media(max-width:640px){.placement-fee-grid{grid-template-columns:1fr!important;}}`}</style>
      </div>

      {/* Testimonials */}
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '56px 20px' }}>
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <div style={{ display: 'inline-block', background: 'rgba(228,117,56,0.1)', color: '#e8401c', fontSize: '12px', fontWeight: 600, fontFamily: 'Poppins, sans-serif', textTransform: 'uppercase', letterSpacing: '1px', padding: '4px 14px', borderRadius: '20px', marginBottom: '12px' }}>Testimonials</div>
          <h2 style={{ fontFamily: 'Poppins, sans-serif', fontSize: 'clamp(20px,3.5vw,28px)', fontWeight: 700, color: 'var(--text)' }}>Hear From Our Placed Students</h2>
        </div>
        <div className="review-grid grid grid-cols-1 md:grid-cols-2 gap-5">
          {testimonials.map(t => (
            <div
              key={t.name}
              className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6"
            >
              <span aria-hidden="true" className="text-5xl text-orange-400 font-serif leading-none block mb-2">&ldquo;</span>
              <div className="text-orange-400 text-sm mb-3">★★★★★</div>
              <p className="text-gray-600 dark:text-gray-300 italic text-sm leading-relaxed mb-4">&ldquo;{t.review}&rdquo;</p>
              <div className="flex items-center gap-3">
                <div className="bg-teal-600 text-white rounded-full w-10 h-10 flex items-center justify-center font-semibold text-sm shrink-0" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  {t.initials}
                </div>
                <div className="min-w-0">
                  <span className="block font-semibold text-gray-900 dark:text-gray-100" style={{ fontFamily: 'Poppins, sans-serif' }}>{t.name}</span>
                  <span className="block text-sm text-gray-500 dark:text-gray-400">{t.role}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
        <CtaBanner />
      </div>
    </>
  );
}
