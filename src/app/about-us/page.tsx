import type { Metadata } from 'next';
import { HeroBanner, CtaBanner, ResponsivePageStyles } from '@/components/shared';

import { buildPageMetadata } from '@/lib/get-page-seo';

export const dynamic = 'force-dynamic';
export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata('about');
}

const milestones = [
  { year: '2010', event: 'Founded in Dilsukhnagar, Hyderabad with a mission to make quality IT education accessible.' },
  { year: '2016', event: 'Opened the Ameerpet branch to serve more students across Hyderabad.' },
  { year: '2018', event: 'Crossed 1,000 students placed milestone. Launched Cloud Computing programs.' },
  { year: '2020', event: 'Launched online training platform to serve students across India during COVID-19.' },
  { year: '2022', event: 'Introduced AI, Machine Learning and Data Science programs. 3,000+ students milestone.' },
  { year: '2024', event: 'Expanded to 30+ courses. 5,000+ students trained, 50+ hiring partners.' },
];

const team = [
  { name: 'Mr. Naresh K.', role: 'Founder & CEO', exp: '15+ years in IT Training', initials: 'NK' },
  { name: 'Ms. Kavitha R.', role: 'Head of Training', exp: 'AWS & Azure Certified', initials: 'KR' },
  { name: 'Mr. Srinivas M.', role: 'Lead Trainer – DevOps', exp: '12+ years in DevOps', initials: 'SM' },
  { name: 'Ms. Preethi L.', role: 'Placement Coordinator', exp: '8+ years in HR & Placement', initials: 'PL' },
];

const values = [
  { icon: '🎯', title: 'Excellence', desc: 'We maintain the highest standards in training quality, curriculum design and student outcomes.' },
  { icon: '🤝', title: 'Commitment', desc: 'We are committed to every student\'s success — from enrollment to placement.' },
  { icon: '💡', title: 'Innovation', desc: 'We continuously update our curriculum to match the rapidly evolving IT industry.' },
  { icon: '❤️', title: 'Student First', desc: 'Every decision we make is guided by what\'s best for our students\' career growth.' },
];

export default function AboutUsPage() {
  return (
    <>
      <ResponsivePageStyles />
      <HeroBanner
        badge="LEADING IT INSTITUTE IN HYDERABAD SINCE 2010"
        titlePre="15+ Years of Building "
        accentText="IT Careers"
        titleLine2="in Hyderabad"
        subtitle="COSS Cloud Solutions has trained 5,000+ students across Cloud, DevOps, Data Science & more — with industry-certified trainers & guaranteed placement support."
        stats={[
          { value: '2010',   label: 'ESTABLISHED' },
          { value: '5,000+', label: 'STUDENTS TRAINED' },
          { value: '30+',    label: 'COURSES OFFERED' },
          { value: '200+',   label: 'HIRING PARTNERS' },
        ]}
        ctaText="2 Branches in Hyderabad · Dilsukhnagar & Ameerpet"
        breadcrumb={[{ label: 'About Us', href: '/about-us/' }]}
      />

      {/* Who We Are */}
      <div style={{ background: 'var(--bg-alt)', padding: '60px 20px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div className="page-two-col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '56px', alignItems: 'center' }}>
            <div>
              <div style={{ display: 'inline-block', background: 'rgba(232,64,28,0.1)', color: '#e8401c', fontSize: '12px', fontWeight: 600, fontFamily: 'Poppins, sans-serif', textTransform: 'uppercase', letterSpacing: '1px', padding: '4px 14px', borderRadius: '20px', marginBottom: '14px' }}>
                Who We Are
              </div>
              <h2 style={{ fontFamily: 'Poppins, sans-serif', fontSize: 'clamp(22px,3.5vw,32px)', fontWeight: 700, color: 'var(--text)', marginBottom: '16px' }}>
                Leading IT Training Institute in Hyderabad
              </h2>
              <p style={{ color: 'var(--text-muted)', lineHeight: '1.85', marginBottom: '16px', fontSize: '15px' }}>
                Coss Cloud Solutions stands among the best software training institutes in Dilsukhnagar and Ameerpet, Hyderabad. Since 2010, we have been on a mission to make quality IT education accessible to every aspiring technology professional.
              </p>
              <p style={{ color: 'var(--text-muted)', lineHeight: '1.85', marginBottom: '20px', fontSize: '15px' }}>
                Our programs include Artificial Intelligence, Data Science, Cloud Computing, DevOps, Cyber Security, Full Stack Development, SAP, Digital Marketing, and 40+ more courses — all designed to make you job-ready from day one.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px' }}>
                {[{ n: '15+', l: 'Years Experience' }, { n: '5000+', l: 'Students Trained' }, { n: '30+', l: 'Courses Offered' }, { n: '200+', l: 'Hiring Partners' }].map(s => (
                  <div key={s.l} style={{ background: 'var(--bg-card)', borderRadius: '10px', padding: '16px', textAlign: 'center', boxShadow: '0 2px 10px rgba(0,0,0,0.06)', border: '1px solid var(--border-card)' }}>
                    <div style={{ fontFamily: 'Poppins, sans-serif', fontSize: '24px', fontWeight: 800, color: '#e8401c' }}>{s.n}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>{s.l}</div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div style={{ background: 'linear-gradient(135deg, #1a1a2e, #0f3460)', borderRadius: '16px', padding: '32px', color: '#fff' }}>
                <h3 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '20px', marginBottom: '16px', color: '#fff' }}>Our Mission & Vision</h3>
                <div style={{ marginBottom: '20px', paddingBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                  <div style={{ color: '#e8401c', fontFamily: 'Poppins, sans-serif', fontWeight: 600, fontSize: '13px', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>🎯 Our Mission</div>
                  <p style={{ color: '#ccc', fontSize: '14px', lineHeight: '1.7' }}>To equip every learner with real-time skills, practical exposure, and placement assistance so they can confidently step into the IT industry and build rewarding careers.</p>
                </div>
                <div>
                  <div style={{ color: '#e8401c', fontFamily: 'Poppins, sans-serif', fontWeight: 600, fontSize: '13px', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>🌟 Our Vision</div>
                  <p style={{ color: '#ccc', fontSize: '14px', lineHeight: '1.7' }}>To become the most trusted IT training institute in South India, known for transforming careers through quality education, innovation, and unwavering student support.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Values */}
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '56px 20px' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{ display: 'inline-block', background: 'rgba(232,64,28,0.1)', color: '#e8401c', fontSize: '12px', fontWeight: 600, fontFamily: 'Poppins, sans-serif', textTransform: 'uppercase', letterSpacing: '1px', padding: '4px 14px', borderRadius: '20px', marginBottom: '12px' }}>Our Values</div>
          <h2 style={{ fontFamily: 'Poppins, sans-serif', fontSize: 'clamp(20px,3.5vw,28px)', fontWeight: 700, color: 'var(--text)' }}>What We Stand For</h2>
        </div>
        <div className="corp-feat-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
          {values.map(v => (
            <div key={v.title} style={{ background: 'var(--bg-card)', borderRadius: '12px', padding: '28px 20px', boxShadow: '0 2px 14px rgba(0,0,0,0.07)', textAlign: 'center', border: '1px solid var(--border-card)' }}>
              <div style={{ fontSize: '36px', marginBottom: '12px' }}>{v.icon}</div>
              <h4 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '16px', color: 'var(--text)', marginBottom: '8px' }}>{v.title}</h4>
              <p style={{ color: 'var(--text-muted)', fontSize: '13px', lineHeight: '1.6' }}>{v.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Timeline */}
      <div style={{ background: 'var(--bg-alt)', padding: '56px 20px' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <div style={{ display: 'inline-block', background: 'rgba(232,64,28,0.1)', color: '#e8401c', fontSize: '12px', fontWeight: 600, fontFamily: 'Poppins, sans-serif', textTransform: 'uppercase', letterSpacing: '1px', padding: '4px 14px', borderRadius: '20px', marginBottom: '12px' }}>Our Journey</div>
            <h2 style={{ fontFamily: 'Poppins, sans-serif', fontSize: 'clamp(20px,3.5vw,28px)', fontWeight: 700, color: 'var(--text)' }}>15+ Years of Excellence</h2>
          </div>
          <div style={{ position: 'relative', paddingLeft: '30px' }}>
            <div style={{ position: 'absolute', left: '0', top: '0', bottom: '0', width: '2px', background: 'var(--border)' }} />
            {milestones.map((m) => (
              <div key={m.year} style={{ position: 'relative', paddingBottom: '28px', paddingLeft: '28px' }}>
                <div style={{ position: 'absolute', left: '-9px', top: '2px', width: '20px', height: '20px', background: '#e8401c', borderRadius: '50%', border: '3px solid var(--bg-alt)', boxShadow: '0 0 0 2px #e8401c' }} />
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', background: 'var(--bg-card)', borderRadius: '10px', padding: '16px 20px', boxShadow: '0 2px 10px rgba(0,0,0,0.06)', border: '1px solid var(--border-card)' }}>
                  <span style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: '18px', color: '#e8401c', flexShrink: 0 }}>{m.year}</span>
                  <p style={{ color: 'var(--text-muted)', fontSize: '14px', lineHeight: '1.6' }}>{m.event}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Team */}
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '56px 20px' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{ display: 'inline-block', background: 'rgba(232,64,28,0.1)', color: '#e8401c', fontSize: '12px', fontWeight: 600, fontFamily: 'Poppins, sans-serif', textTransform: 'uppercase', letterSpacing: '1px', padding: '4px 14px', borderRadius: '20px', marginBottom: '12px' }}>Our Team</div>
          <h2 style={{ fontFamily: 'Poppins, sans-serif', fontSize: 'clamp(20px,3.5vw,28px)', fontWeight: 700, color: 'var(--text)' }}>Meet Our Experts</h2>
        </div>
        <div className="corp-feat-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
          {team.map(t => (
            <div key={t.name} style={{ background: 'var(--bg-card)', borderRadius: '14px', padding: '28px 20px', boxShadow: '0 3px 18px rgba(0,0,0,0.08)', textAlign: 'center', border: '1px solid var(--border-card)' }}>
              <div style={{ width: '72px', height: '72px', background: 'linear-gradient(135deg, #e8401c, #c93415)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: '22px', margin: '0 auto 14px' }}>{t.initials}</div>
              <h4 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '15px', color: 'var(--text)', marginBottom: '4px' }}>{t.name}</h4>
              <div style={{ color: '#e8401c', fontSize: '12px', fontWeight: 600, fontFamily: 'Poppins, sans-serif', marginBottom: '6px' }}>{t.role}</div>
              <div style={{ color: 'var(--text-light)', fontSize: '12px' }}>{t.exp}</div>
            </div>
          ))}
        </div>
        <CtaBanner />
      </div>
    </>
  );
}
