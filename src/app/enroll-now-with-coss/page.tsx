import type { Metadata } from 'next';
import Link from 'next/link';
import { ResponsivePageStyles } from '@/components/shared';
import EnrollFullForm from '@/components/EnrollFullForm';
import { buildPageMetadata } from '@/lib/get-page-seo';

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata('enroll-now-with-coss');
}

const whyEnroll = [
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
    ),
    title: 'Free Demo Class',
    desc: 'Attend a free session before you commit — experience our training quality firsthand.',
    color: '#10b981',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
    ),
    title: 'Expert Trainers',
    desc: 'Certified industry professionals with 10+ years of hands-on real-world experience.',
    color: '#6366f1',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8m-4-4v4"/></svg>
    ),
    title: 'Hands-on Training',
    desc: 'Practical labs, capstone projects, and real-world scenarios in every course.',
    color: '#0ea5e9',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></svg>
    ),
    title: 'Industry Certifications',
    desc: 'Globally recognized certificates from AWS, Microsoft, Google & more.',
    color: '#f59e0b',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
    ),
    title: 'Flexible Batches',
    desc: 'Weekday, weekend, morning & evening batches — learn at your own pace.',
    color: '#e47538',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6 6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 14h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 21"/></svg>
    ),
    title: '100% Placement Support',
    desc: 'Resume building, mock interviews & dedicated job portal access until you\'re placed.',
    color: '#005663',
  },
];

const stats = [
  { number: '1200+', label: 'Students Placed' },
  { number: '4.8★',  label: 'Google Rating' },
  { number: '36+',   label: 'Courses Offered' },
  { number: '8+',    label: 'Years of Excellence' },
];

export default function EnrollPage() {
  return (
    <>
      <ResponsivePageStyles />

      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <section className="enroll-hero">
        {/* Decorative layers */}
        <div className="enroll-hero-glow" aria-hidden="true" />
        <div className="enroll-hero-dots" aria-hidden="true" />

        <div className="enroll-hero-inner">
          {/* Breadcrumb */}
          <nav className="enroll-breadcrumb" aria-label="Breadcrumb">
            <Link href="/">Home</Link>
            <span aria-hidden="true"> › </span>
            <span>Enroll Now</span>
          </nav>

          <h1 className="enroll-hero-title">
            Launch Your <span className="enroll-hero-accent">IT Career</span> in Hyderabad
          </h1>
          <p className="enroll-hero-sub">
            Book a free demo — no commitment. Our expert counsellors will guide you to the right course and help you land your dream job.
          </p>

          {/* Trust badges */}
          <div className="enroll-trust-row">
            {stats.map(s => (
              <div key={s.label} className="enroll-trust-pill">
                <strong>{s.number}</strong>
                <span>{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── MAIN CONTENT ──────────────────────────────────────────────────── */}
      <section className="enroll-body">
        <div className="enroll-body-inner">

          {/* ── LEFT: Form ── */}
          <div className="enroll-form-col">
            <div className="enroll-form-label-tag">Start Your IT Career</div>
            <h2 className="enroll-form-heading">Enroll or Book a Free Demo</h2>
            <p className="enroll-form-sub">
              Fill out the form and our counsellor will call you within <strong>2 hours</strong> to guide you toward the right course.
            </p>

            {/* Social proof strip above form */}
            <div className="enroll-social-proof">
              <div className="enroll-avatars">
                {['R','S','P','A','K'].map(l => (
                  <span key={l} className="enroll-avatar">{l}</span>
                ))}
              </div>
              <span className="enroll-social-text">
                <strong>1,200+ students</strong> enrolled this year — join them!
              </span>
            </div>

            <EnrollFullForm />

            {/* Assurance badges */}
            <div className="enroll-assurance">
              <span className="enroll-assurance-item">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                100% Secure & Private
              </span>
              <span className="enroll-assurance-item">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
                No Spam, No Pressure
              </span>
              <span className="enroll-assurance-item">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                Response within 2 hrs
              </span>
            </div>
          </div>

          {/* ── RIGHT: Why + Contact ── */}
          <div className="enroll-info-col">

            {/* Why Enroll */}
            <div className="enroll-why-box">
              <h3 className="enroll-why-title">Why Choose COSS?</h3>
              <div className="enroll-why-grid">
                {whyEnroll.map(w => (
                  <div key={w.title} className="enroll-why-card">
                    <span className="enroll-why-icon" style={{ color: w.color, background: `${w.color}18` }}>
                      {w.icon}
                    </span>
                    <div>
                      <div className="enroll-why-card-title">{w.title}</div>
                      <div className="enroll-why-card-desc">{w.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Branch Locations */}
            <div className="enroll-branches">
              <h4 className="enroll-branches-title">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                Our Branch Locations
              </h4>

              <div className="enroll-branch-cards">
                <div className="enroll-branch-card">
                  <div className="enroll-branch-name">Dilsukhnagar Branch</div>
                  <p className="enroll-branch-addr">
                    Flat 109, C.B Eastern Homes, Srinagar Colony, Opposite Chai Vaai Cafe, Dilsukhnagar, Hyderabad – 500060
                  </p>
                </div>
                <div className="enroll-branch-card">
                  <div className="enroll-branch-name">Ameerpet Branch</div>
                  <p className="enroll-branch-addr">
                    #502, Sree Swathi Ankur Building, Besides Aditya Trade Center, Ameerpet, Hyderabad – 500038
                  </p>
                </div>
              </div>

              <div className="enroll-contact-row">
                <a href="tel:+918885166007" className="enroll-contact-link">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12.7 19.79 19.79 0 0 1 1.62 4.08 2 2 0 0 1 3.6 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                  +91 88851 66007
                </a>
                <span className="enroll-contact-sep">•</span>
                <a href="tel:+917780727374" className="enroll-contact-link">77807 27374</a>
                <span className="enroll-contact-sep">•</span>
                <a href="mailto:info@cosscloudsol.com" className="enroll-contact-link enroll-contact-email">
                  info@cosscloudsol.com
                </a>
              </div>
            </div>

          </div>
        </div>
      </section>
    </>
  );
}
