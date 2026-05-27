import Link from 'next/link';
import DemoSidebarForm from '@/components/DemoSidebarForm';

/* ── Page Banner ── */
export function PageBanner({ title, breadcrumb }: { title: string; breadcrumb?: { label: string; href: string }[] }) {
  return (
    <div className="page-banner">
      {/* Decorative glow & dot grid */}
      <div className="page-banner-glow" aria-hidden="true" />
      <div className="page-banner-dots" aria-hidden="true" />
      <div className="page-banner-inner">
        <h1 className="page-banner-title">{title}</h1>
        <nav className="page-banner-crumb" aria-label="Breadcrumb">
          <Link href="/">Home</Link>
          {breadcrumb?.map(b => (
            <span key={b.href}>
              <span className="page-banner-crumb-sep" aria-hidden="true"> › </span>
              <Link href={b.href}>{b.label}</Link>
            </span>
          ))}
        </nav>
      </div>
    </div>
  );
}

/* ── Generic Hero Banner (shared across inner pages) ── */
interface HeroBannerStat { value: string; label: string; }
interface HeroBannerProps {
  badge: string;
  titlePre: string;
  accentText: string;
  titlePost?: string;
  titleLine2?: string;
  subtitle: string;
  stats: HeroBannerStat[];
  ctaText: string;
  breadcrumb: { label: string; href: string }[];
  ariaLabel?: string;
}
export function HeroBanner({ badge, titlePre, accentText, titlePost = '', titleLine2, subtitle, stats, ctaText, breadcrumb, ariaLabel }: HeroBannerProps) {
  return (
    <section className="hero-banner" aria-label={ariaLabel ?? `${titlePre}${accentText}${titlePost}`}>
      <div className="page-banner-glow" aria-hidden="true" />
      <div className="page-banner-dots" aria-hidden="true" />
      <div className="hero-banner-inner">
        <nav className="page-banner-crumb hero-banner-crumb" aria-label="Breadcrumb">
          <Link href="/">Home</Link>
          {breadcrumb.map((b, i) => (
            <span key={b.href}>
              <span className="page-banner-crumb-sep" aria-hidden="true"> › </span>
              {i === breadcrumb.length - 1
                ? <span aria-current="page">{b.label}</span>
                : <Link href={b.href}>{b.label}</Link>}
            </span>
          ))}
        </nav>
        <div className="hero-banner-badge" role="note">
          <span className="hero-banner-badge-dot" aria-hidden="true" />
          {badge}
        </div>
        <h1 className="hero-banner-title">
          {titlePre}<span className="hero-banner-accent">{accentText}</span>{titlePost}
          {titleLine2 && <><br />{titleLine2}</>}
        </h1>
        <p className="hero-banner-sub">{subtitle}</p>
        <div className="hero-banner-stats" aria-label="Key statistics">
          {stats.map(s => (
            <div className="hero-banner-stat" key={s.label}>
              <strong>{s.value}</strong>
              <span>{s.label}</span>
            </div>
          ))}
        </div>
        <div className="hero-banner-cta-bar">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          {ctaText}
        </div>
      </div>
    </section>
  );
}

/* ── Corporate Training Hero Banner ── */
export function CorporateHeroBanner() {
  return (
    <HeroBanner
      badge="TRUSTED BY 500+ COMPANIES ACROSS INDIA"
      titlePre="Upskill Your "
      accentText="Workforce"
      titleLine2="with Expert-Led Training"
      subtitle="Customised IT corporate training programs — certified trainers, real-world projects, flexible scheduling & globally recognised certifications. Online & on-site delivery."
      stats={[
        { value: '5,000+', label: 'EMPLOYEES TRAINED' },
        { value: '4.8★',   label: 'GOOGLE RATING' },
        { value: '30+',    label: 'PROGRAMS OFFERED' },
        { value: '15+',    label: 'YEARS OF EXCELLENCE' },
      ]}
      ctaText="Free training proposal · Counsellor responds within 2 hours · Mon–Sat 9 am–7 pm"
      breadcrumb={[{ label: 'Corporate Training', href: '/corporate-training/' }]}
      ariaLabel="Corporate Training Hero"
    />
  );
}

/* ── Enroll Sidebar ── */
export function EnrollSidebar() {
  return (
    <div style={{ position: 'sticky', top: '80px' }}>
      <DemoSidebarForm />

      <div style={{ background: 'var(--bg-alt)', borderRadius: '12px', padding: '20px', border: '1px solid var(--border)' }}>
        <h4 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '14px', color: 'var(--text)', marginBottom: '12px' }}>📞 Talk to Us</h4>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.9' }}>
          <a href="tel:+918885166007" style={{ color: 'var(--primary)', fontWeight: 600 }}>+91 88851 66007</a><br />
          <a href="tel:+917780727374" style={{ color: 'var(--primary)', fontWeight: 600 }}>+91 77807 27374</a><br />
          <a href="mailto:info@cosscloudsol.com" style={{ color: 'var(--text-muted)', fontSize: '12px' }}>info@cosscloudsol.com</a>
        </p>
        <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--border)' }}>
          <p style={{ fontSize: '12px', color: 'var(--text-light)', marginBottom: '8px' }}>📍 Dilsukhnagar &amp; Ameerpet, Hyderabad</p>
          <Link href="/contact-us/" style={{ fontSize: '13px', color: 'var(--primary)', fontWeight: 600 }}>Get Directions →</Link>
        </div>
      </div>
    </div>
  );
}

/* ── Course Sidebar Nav ── */
export function CourseSidebarNav({ active }: { active?: string }) {
  const links = [
    { label: 'Data, Analytics & BI',         href: '/courses/data-analytics-bi/' },
    { label: 'Cloud Computing',               href: '/courses/cloud-computing/' },
    { label: 'DevOps & Multi-Cloud',          href: '/courses/devops-multi-cloud/' },
    { label: 'Programming & Full Stack',       href: '/courses/programming-full-stack/' },
    { label: 'Data Engineering',              href: '/courses/data-engineering/' },
    { label: 'Cyber Security & Networking',   href: '/courses/cyber-security/' },
    { label: 'ERP, CRM & Enterprise Tools',   href: '/courses/erp-crm-enterprise-tools/' },
    { label: 'Software Testing & OS',         href: '/courses/software-testing-os/' },
    { label: 'Digital & Design',              href: '/courses/digital-design/' },
    { label: 'Professional & Soft Skills',    href: '/courses/professional-soft-skills/' },
  ];

  return (
    <div style={{ background: 'var(--bg-card)', borderRadius: '12px', overflow: 'hidden', boxShadow: 'var(--shadow-sm)', marginBottom: '20px', border: '1px solid var(--border-card)' }}>
      <div style={{ background: 'var(--primary)', padding: '14px 18px' }}>
        <h4 style={{ color: '#fff', fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '15px' }}>All Course Categories</h4>
      </div>
      {links.map(l => (
        <Link key={l.href} href={l.href} style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '11px 18px', fontSize: '13px',
          color: l.label === active ? 'var(--primary)' : 'var(--text)',
          borderBottom: '1px solid var(--border)',
          background: l.label === active ? 'var(--primary-light)' : 'transparent',
          fontWeight: l.label === active ? 600 : 400,
        }}>
          {l.label} <span style={{ color: 'var(--primary)' }}>›</span>
        </Link>
      ))}
    </div>
  );
}

/* ── CTA Banner ── */
export function CtaBanner() {
  return (
    <div style={{ background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)', borderRadius: '14px', padding: '40px 32px', textAlign: 'center', color: '#fff', margin: '48px 0 0' }}>
      <h3 style={{ fontFamily: 'Poppins, sans-serif', fontSize: 'clamp(18px,4vw,26px)', fontWeight: 800, marginBottom: '10px', color: '#fff' }}>Ready to Start Your Journey?</h3>
      <p style={{ opacity: 0.9, marginBottom: '22px', fontSize: '15px', color: 'rgba(255,255,255,0.9)' }}>Book a free demo class today. No commitment required.</p>
      <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
        <Link href="/free-demo-class/" style={{ background: '#fff', color: 'var(--primary)', padding: '12px 28px', borderRadius: '6px', fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '14px' }}>
          Book Free Demo Class
        </Link>
        <Link href="/contact-us/" style={{ background: 'transparent', color: '#fff', padding: '11px 27px', borderRadius: '6px', border: '2px solid rgba(255,255,255,0.7)', fontFamily: 'Poppins, sans-serif', fontWeight: 600, fontSize: '14px' }}>
          Contact Us
        </Link>
      </div>
    </div>
  );
}

/* ── Responsive style tag ── */
export function ResponsivePageStyles() {
  return (
    <style suppressHydrationWarning>{`
      @media (max-width: 768px) {
        .page-with-sidebar { grid-template-columns: 1fr !important; }
        .page-with-sidebar > div:last-child { display: none !important; }
        .course-feat-grid { grid-template-columns: repeat(2,1fr) !important; }
        .course-list-grid { grid-template-columns: 1fr !important; }
        .page-two-col { grid-template-columns: 1fr !important; gap: 24px !important; }
        .placement-stats { grid-template-columns: repeat(2,1fr) !important; }
        .review-grid { grid-template-columns: 1fr !important; }
        .contact-grid { grid-template-columns: 1fr !important; }
        .contact-cards { grid-template-columns: repeat(2,1fr) !important; }
        .why-feature-grid { grid-template-columns: 1fr 1fr !important; }
        .process-steps { grid-template-columns: 1fr !important; }
        .corp-feat-grid { grid-template-columns: 1fr 1fr !important; }
        .enroll-form-grid { grid-template-columns: 1fr !important; }
      }
      @media (max-width: 480px) {
        .course-list-grid { grid-template-columns: 1fr !important; }
        .corp-feat-grid { grid-template-columns: 1fr !important; }
        .why-feature-grid { grid-template-columns: 1fr !important; }
        .contact-cards { grid-template-columns: 1fr !important; }
      }
    `}</style>
  );
}



