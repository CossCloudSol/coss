import type { Metadata } from 'next';
import Link from 'next/link';
import { CorporateHeroBanner, CtaBanner, ResponsivePageStyles } from '@/components/shared';
import CorporateForm from '@/components/CorporateForm';
import { prisma } from '@/lib/db';

import { buildPageMetadata } from '@/lib/get-page-seo';

export const dynamic = 'force-dynamic';
export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata('corporate-training');
}

const features = [
  { icon: '👨‍🏫', title: 'Certified Expert Trainers', desc: 'Industry professionals with 10+ years of real-world experience delivering corporate training.' },
  { icon: '🎯', title: 'Customized Curriculum', desc: 'Training programs tailored to your organization\'s specific technology stack and business needs.' },
  { icon: '📅', title: 'Flexible Scheduling', desc: 'Weekday, weekend, morning, and evening batches. Online and offline options available.' },
  { icon: '🏢', title: 'On-site & Online', desc: 'We deliver training at your office premises or through our virtual classroom platform.' },
  { icon: '📊', title: 'Progress Tracking', desc: 'Regular assessments, reports, and feedback to track employee learning progress.' },
  { icon: '🏆', title: 'Recognized Certifications', desc: 'Globally recognized certificates that add real value to your employees\' profiles.' },
  { icon: '💰', title: 'Cost-Effective', desc: 'Premium quality corporate training at competitive pricing with volume discounts.' },
  { icon: '🔄', title: 'Post-Training Support', desc: 'Access to study materials, recordings, and trainer support after the training program.' },
];

const trainingAreas = [
  { name: 'Cloud Computing', icon: '☁️', topics: ['AWS', 'Azure', 'Google Cloud', 'Multi-Cloud'] },
  { name: 'DevOps & Automation', icon: '⚙️', topics: ['Docker', 'Kubernetes', 'Jenkins', 'Terraform'] },
  { name: 'Data Science & AI', icon: '📊', topics: ['Python', 'Machine Learning', 'Power BI', 'Tableau'] },
  { name: 'Cyber Security', icon: '🔒', topics: ['Ethical Hacking', 'SOC', 'Network Security', 'VAPT'] },
  { name: 'Full Stack Development', icon: '💻', topics: ['Java', 'Python', 'React', 'Node.js'] },
  { name: 'ERP & CRM', icon: '🏢', topics: ['SAP', 'Salesforce', 'Oracle HCM', 'MS Dynamics'] },
];

const process = [
  { step: '01', title: 'Requirement Analysis', desc: 'We understand your workforce skill gaps through a detailed needs analysis.' },
  { step: '02', title: 'Curriculum Design', desc: 'Custom training plan is designed based on your technology needs and team level.' },
  { step: '03', title: 'Trainer Assignment', desc: 'Subject-matter expert trainers are assigned with industry project experience.' },
  { step: '04', title: 'Training Delivery', desc: 'Instructor-led sessions with hands-on labs, case studies and projects.' },
  { step: '05', title: 'Assessment & Report', desc: 'Regular assessments and a detailed post-training progress report.' },
  { step: '06', title: 'Certification', desc: 'Employees receive recognized certificates upon successful completion.' },
];

export default async function CorporateTrainingPage() {
  const hiringPartners = await prisma.hiringPartner.findMany({
    where: { isVisible: true },
    orderBy: { sortOrder: 'asc' },
    select: { id: true, name: true, logoUrl: true, altText: true, website: true },
  });
  return (
    <>
      <ResponsivePageStyles />
      <CorporateHeroBanner />

      {/* Hero intro */}
      <div style={{ background: 'var(--bg-alt)', padding: '56px 20px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div className="page-two-col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '56px', alignItems: 'center' }}>
            <div>
              <div style={{ display: 'inline-block', background: 'rgba(232,64,28,0.1)', color: '#e8401c', fontSize: '12px', fontWeight: 600, fontFamily: 'Poppins, sans-serif', textTransform: 'uppercase', letterSpacing: '1px', padding: '4px 14px', borderRadius: '20px', marginBottom: '14px' }}>
                Corporate Training Programs
              </div>
              <h2 style={{ fontFamily: 'Poppins, sans-serif', fontSize: 'clamp(22px,4vw,34px)', fontWeight: 700, color: 'var(--text)', marginBottom: '16px', lineHeight: '1.25' }}>
                Transform Your<br />Workforce Skills
              </h2>
              <p style={{ color: 'var(--text-muted)', lineHeight: '1.8', marginBottom: '16px', fontSize: '15px' }}>
                We deliver top-quality training programs that meet the requirements of client organizations. Our excellent corporate trainers bring real-world IT industry expertise with customized, cost-effective programs.
              </p>
              <ul style={{ listStyle: 'none', padding: 0, marginBottom: '24px' }}>
                {['Highly caliber and experienced faculty', 'Special batches for Hyderabad corporate clients', 'Certified instructor-led training', 'Customized approach to your technology stack', 'Weekend workshops on advanced technologies', 'In-depth needs analysis before course design'].map(item => (
                  <li key={item} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '10px', fontSize: '14px', color: 'var(--text-muted)' }}>
                    <span style={{ color: '#e8401c', fontWeight: 700, flexShrink: 0, marginTop: '2px' }}>✓</span> {item}
                  </li>
                ))}
              </ul>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <Link href="/enroll-now-with-coss/" style={{ background: '#e8401c', color: '#fff', padding: '12px 26px', borderRadius: '6px', fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '14px' }}>Get a Quote</Link>
                <Link href="/contact-us/" style={{ background: '#1a1a2e', color: '#fff', padding: '12px 26px', borderRadius: '6px', fontFamily: 'Poppins, sans-serif', fontWeight: 600, fontSize: '14px' }}>Contact Us</Link>
              </div>
            </div>

            {/* Quick enquiry form */}
            <CorporateForm />
          </div>
        </div>
      </div>

      {/* Features */}
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '56px 20px' }}>
        <div style={{ textAlign: 'center', marginBottom: '44px' }}>
          <div style={{ display: 'inline-block', background: 'rgba(232,64,28,0.1)', color: '#e8401c', fontSize: '12px', fontWeight: 600, fontFamily: 'Poppins, sans-serif', textTransform: 'uppercase', letterSpacing: '1px', padding: '4px 14px', borderRadius: '20px', marginBottom: '12px' }}>Why Choose Us</div>
          <h2 style={{ fontFamily: 'Poppins, sans-serif', fontSize: 'clamp(20px,3.5vw,28px)', fontWeight: 700, color: 'var(--text)' }}>Why Companies Choose Coss Cloud Solutions for Corporate Training</h2>
        </div>
        <div className="corp-feat-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
          {features.map(f => (
            <div
              key={f.title}
              // Tailwind takes ownership of corner radius + shadow + transform
              // so the hover lift actually fires (inline boxShadow would have
              // outranked the hover utility via specificity).
              className="rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-200"
              style={{ background: 'var(--bg-card)', padding: '24px 18px', border: '1px solid var(--border-card)', textAlign: 'center' }}
            >
              <div className="inline-block p-3 rounded-xl mb-3" style={{ fontSize: '32px', lineHeight: 1, background: 'var(--primary-light)' }}>{f.icon}</div>
              <h4 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '14px', color: 'var(--text)', marginBottom: '8px' }}>{f.title}</h4>
              <p style={{ color: 'var(--text-muted)', fontSize: '12.5px', lineHeight: '1.6' }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Training Areas */}
      <div style={{ background: 'var(--bg-alt)', padding: '56px 20px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <div style={{ display: 'inline-block', background: 'rgba(232,64,28,0.1)', color: '#e8401c', fontSize: '12px', fontWeight: 600, fontFamily: 'Poppins, sans-serif', textTransform: 'uppercase', letterSpacing: '1px', padding: '4px 14px', borderRadius: '20px', marginBottom: '12px' }}>Training Domains</div>
            <h2 style={{ fontFamily: 'Poppins, sans-serif', fontSize: 'clamp(20px,3.5vw,28px)', fontWeight: 700, color: 'var(--text)' }}>Areas of Corporate Training</h2>
          </div>
          <div className="corp-feat-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
            {trainingAreas.map(area => (
              <div key={area.name} style={{ background: 'var(--bg-card)', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 14px rgba(0,0,0,0.07)' }}>
                <div style={{ background: 'linear-gradient(135deg, #1a1a2e, #0f3460)', padding: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '28px' }}>{area.icon}</span>
                  <h4 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '15px', color: '#fff' }}>{area.name}</h4>
                </div>
                <div style={{ padding: '16px' }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px' }}>
                    {area.topics.map(t => (
                      <span key={t} style={{ background: 'var(--surface)', color: 'var(--text-muted)', fontSize: '12px', padding: '4px 10px', borderRadius: '12px', fontFamily: 'Poppins, sans-serif', fontWeight: 500, border: '1px solid var(--border)' }}>{t}</span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Process */}
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '56px 20px' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{ display: 'inline-block', background: 'rgba(232,64,28,0.1)', color: '#e8401c', fontSize: '12px', fontWeight: 600, fontFamily: 'Poppins, sans-serif', textTransform: 'uppercase', letterSpacing: '1px', padding: '4px 14px', borderRadius: '20px', marginBottom: '12px' }}>Our Process</div>
          <h2 style={{ fontFamily: 'Poppins, sans-serif', fontSize: 'clamp(20px,3.5vw,28px)', fontWeight: 700, color: 'var(--text)' }}>How Our Corporate Training Works</h2>
        </div>
        <div className="process-steps" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
          {process.map(p => (
            <div key={p.step} style={{ background: 'var(--bg-card)', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 14px rgba(0,0,0,0.07)', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: '-10px', right: '-5px', fontFamily: 'Poppins, sans-serif', fontSize: '60px', fontWeight: 900, color: 'rgba(232,64,28,0.06)', lineHeight: 1 }}>{p.step}</div>
              <div className="w-8 h-8 bg-teal-600 text-white rounded-full flex items-center justify-center font-bold text-sm mb-3" style={{ fontFamily: 'Poppins, sans-serif' }}>{p.step}</div>
              <h4 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '15px', color: 'var(--text)', marginBottom: '8px' }}>{p.title}</h4>
              <p style={{ color: 'var(--text-muted)', fontSize: '13px', lineHeight: '1.6' }}>{p.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Companies */}
      <div style={{ background: 'linear-gradient(135deg, #1a1a2e, #0f3460)', padding: '48px 20px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', textAlign: 'center' }}>
          <h3 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '24px', color: '#fff', marginBottom: '8px' }}>Our Alumni Work At</h3>
          <p style={{ color: '#aaa', fontSize: '14px', marginBottom: '28px' }}>Companies That Hire Our Trained Professionals</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 border border-gray-200 rounded-xl overflow-hidden bg-white">
            {hiringPartners.map((p, i, all) => {
              const total = all.length
              const isLastColMobile  = (i + 1) % 2 === 0
              const isLastColTablet  = (i + 1) % 3 === 0
              const isLastColDesktop = (i + 1) % 5 === 0
              const lastRowStartMobile  = total - (total % 2 || 2)
              const lastRowStartTablet  = total - (total % 3 || 3)
              const lastRowStartDesktop = total - (total % 5 || 5)
              const isLastRowMobile  = i >= lastRowStartMobile
              const isLastRowTablet  = i >= lastRowStartTablet
              const isLastRowDesktop = i >= lastRowStartDesktop
              return (
                <div
                  key={p.id}
                  className={[
                    'flex items-center justify-center p-5 min-h-[80px] bg-white hover:bg-gray-50 transition-colors',
                    'border-r border-b border-gray-200',
                    isLastColMobile  ? 'border-r-0'    : '',
                    isLastColTablet  ? 'sm:border-r-0' : 'sm:border-r',
                    isLastColDesktop ? 'md:border-r-0' : 'md:border-r',
                    isLastRowMobile  ? 'border-b-0'    : '',
                    isLastRowTablet  ? 'sm:border-b-0' : 'sm:border-b',
                    isLastRowDesktop ? 'md:border-b-0' : 'md:border-b',
                  ].filter(Boolean).join(' ')}
                >
                  {p.logoUrl ? (
                    <img
                      src={p.logoUrl}
                      alt={p.altText || p.name}
                      className="max-h-10 max-w-full object-contain"
                      loading="lazy"
                    />
                  ) : (
                    <span className="text-xs font-medium text-gray-500 text-center leading-tight">
                      {p.name}
                    </span>
                  )}
                </div>
              )
            })}
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
