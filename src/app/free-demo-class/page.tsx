import type { Metadata } from 'next';
import Link from 'next/link';
import EnrollFullForm from '@/components/EnrollFullForm';
import { ResponsivePageStyles } from '@/components/shared';
import { buildPageMetadata } from '@/lib/get-page-seo';

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata('free-demo-class');
}

const steps = [
  {
    number: '01',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
    title: 'Book Your Slot',
    desc: 'Fill out the form and our counsellor calls you within 2 hours to schedule your demo at a time that suits you.',
    color: '#6366f1',
  },
  {
    number: '02',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    title: 'Attend the Live Demo',
    desc: 'Join a 60-minute live session with a certified trainer — real tools, real labs, and hands-on demonstration.',
    color: '#0ea5e9',
  },
  {
    number: '03',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
      </svg>
    ),
    title: 'Get Your Roadmap',
    desc: 'After the demo our expert creates a personalised learning roadmap + fee structure — zero pressure.',
    color: '#10b981',
  },
];

const whatYouGet = [
  { icon: '🎯', title: 'Live Expert Session', desc: '60-min hands-on class with a Microsoft/AWS-certified trainer' },
  { icon: '🛠️', title: 'Real Tool Access', desc: 'Use industry tools like AWS Console, Azure, Jenkins & more live' },
  { icon: '📋', title: 'Course Roadmap', desc: 'Get a custom learning path tailored to your goal & background' },
  { icon: '💬', title: 'Q&A with Trainer', desc: 'Ask anything — career switch, salary expectations, syllabus scope' },
  { icon: '📊', title: 'Placement Insights', desc: 'See real JDs, salary ranges & companies COSS alumni work at' },
  { icon: '🎁', title: 'Zero Cost', desc: 'Completely FREE — no hidden fee, no commitment, no pressure' },
];

const faqs = [
  {
    q: 'Is the demo class really free?',
    a: 'Yes, 100% free. No credit card, no commitment. You just attend, experience the quality, and decide at your own pace.',
  },
  {
    q: 'Online or offline?',
    a: 'Both options are available. You can attend in-person at our Dilsukhnagar or Ameerpet branch, or join via Zoom/Google Meet.',
  },
  {
    q: 'How long is the demo class?',
    a: 'Approximately 60 minutes — 40 min of live training + 20 min open Q&A with the trainer.',
  },
  {
    q: 'Do I need prior experience?',
    a: 'No background knowledge needed. Demo classes are designed for complete beginners as well as working professionals looking to upskill.',
  },
  {
    q: 'When will I get a callback?',
    a: 'Our counsellors typically call within 2 hours of form submission on working days (Mon–Sat, 9 am–7 pm).',
  },
];

const reviews = [
  {
    name: 'Rahul M.',
    course: 'AWS DevOps',
    text: 'The free demo alone was better than paid classes I tried elsewhere. Got placed in 4 months!',
    rating: 5,
  },
  {
    name: 'Sneha P.',
    course: 'Data Science',
    text: 'I was skeptical about "free demo" but the trainer spent 45 minutes walking through real AWS projects. Enrolled the next day.',
    rating: 5,
  },
  {
    name: 'Kiran T.',
    course: 'Full Stack',
    text: 'The counsellor helped me choose between two courses. No sales pitch — just honest guidance. Great experience.',
    rating: 5,
  },
];

const stats = [
  { number: '5,000+', label: 'Students Trained' },
  { number: '4.8★',   label: 'Google Rating' },
  { number: '36+',    label: 'Courses Offered' },
  { number: '8+',     label: 'Years of Excellence' },
];

export default function FreeDemoClassPage() {
  return (
    <>
      <ResponsivePageStyles />
      <style>{`
        /* ── Page-specific styles ── */
        .fdc-hero {
          background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0c4a6e 100%);
          padding: 72px 24px 80px;
          text-align: center;
          position: relative;
          overflow: hidden;
        }
        .fdc-hero::before {
          content: '';
          position: absolute;
          inset: 0;
          background: radial-gradient(ellipse 80% 60% at 50% 0%, rgba(14,165,233,0.18) 0%, transparent 70%);
          pointer-events: none;
        }
        .fdc-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(16,185,129,0.15);
          border: 1px solid rgba(16,185,129,0.4);
          color: #34d399;
          padding: 5px 14px;
          border-radius: 99px;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          margin-bottom: 22px;
        }
        .fdc-hero-title {
          font-family: 'Poppins', sans-serif;
          font-size: clamp(28px, 5vw, 52px);
          font-weight: 900;
          color: #fff;
          line-height: 1.12;
          margin-bottom: 18px;
        }
        .fdc-hero-title span { color: #38bdf8; }
        .fdc-hero-sub {
          font-size: clamp(15px, 2vw, 18px);
          color: rgba(255,255,255,0.75);
          max-width: 640px;
          margin: 0 auto 32px;
          line-height: 1.7;
        }
        .fdc-trust-row {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          justify-content: center;
          margin-bottom: 36px;
        }
        .fdc-trust-pill {
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.15);
          border-radius: 8px;
          padding: 10px 20px;
          color: #fff;
          text-align: center;
        }
        .fdc-trust-pill strong {
          display: block;
          font-family: 'Poppins', sans-serif;
          font-size: 20px;
          font-weight: 800;
          color: #38bdf8;
        }
        .fdc-trust-pill span {
          font-size: 11px;
          color: rgba(255,255,255,0.6);
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }
        .fdc-urgency {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(228,117,56,0.15);
          border: 1px solid rgba(228,117,56,0.35);
          color: #fb923c;
          border-radius: 8px;
          padding: 10px 18px;
          font-size: 13px;
          font-weight: 600;
        }
        /* ── Main layout ── */
        .fdc-body {
          background: var(--bg-alt);
          padding: 64px 0 80px;
        }
        .fdc-body-inner {
          max-width: 1100px;
          margin: 0 auto;
          padding: 0 24px;
          display: grid;
          grid-template-columns: 1fr 420px;
          gap: 48px;
          align-items: start;
        }
        /* ── Form col ── */
        .fdc-form-label-tag {
          display: inline-block;
          background: var(--primary-light);
          color: var(--primary);
          padding: 4px 12px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          margin-bottom: 12px;
        }
        .fdc-form-heading {
          font-family: 'Poppins', sans-serif;
          font-size: clamp(22px, 3vw, 30px);
          font-weight: 800;
          color: var(--text);
          margin-bottom: 8px;
          line-height: 1.2;
        }
        .fdc-form-sub {
          color: var(--text-muted);
          font-size: 14px;
          line-height: 1.7;
          margin-bottom: 20px;
        }
        .fdc-social-proof {
          display: flex;
          align-items: center;
          gap: 12px;
          background: var(--bg-card);
          border: 1px solid var(--border-card);
          border-radius: 10px;
          padding: 12px 16px;
          margin-bottom: 24px;
        }
        .fdc-avatars { display: flex; }
        .fdc-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: var(--secondary);
          color: #fff;
          font-size: 12px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid var(--bg-card);
          margin-left: -6px;
          font-family: 'Poppins', sans-serif;
        }
        .fdc-avatar:first-child { margin-left: 0; }
        .fdc-social-text { font-size: 13px; color: var(--text-muted); line-height: 1.4; }
        .fdc-social-text strong { color: var(--text); }
        .fdc-assurance {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          margin-top: 16px;
        }
        .fdc-assurance-item {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 12px;
          color: var(--text-muted);
        }
        /* ── Right col ── */
        .fdc-steps-box {
          background: var(--bg-card);
          border: 1px solid var(--border-card);
          border-radius: 16px;
          padding: 28px;
          margin-bottom: 20px;
          box-shadow: var(--shadow-sm);
        }
        .fdc-steps-title {
          font-family: 'Poppins', sans-serif;
          font-weight: 700;
          font-size: 16px;
          color: var(--text);
          margin-bottom: 22px;
          padding-bottom: 12px;
          border-bottom: 2px solid var(--primary);
          display: inline-block;
        }
        .fdc-step {
          display: flex;
          gap: 14px;
          align-items: flex-start;
          margin-bottom: 18px;
        }
        .fdc-step:last-child { margin-bottom: 0; }
        .fdc-step-num {
          flex-shrink: 0;
          width: 40px;
          height: 40px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Poppins', sans-serif;
          font-weight: 800;
          font-size: 13px;
          color: #fff;
        }
        .fdc-step-title {
          font-family: 'Poppins', sans-serif;
          font-weight: 700;
          font-size: 14px;
          color: var(--text);
          margin-bottom: 3px;
        }
        .fdc-step-desc {
          font-size: 13px;
          color: var(--text-muted);
          line-height: 1.55;
        }
        .fdc-contact-box {
          background: var(--bg-card);
          border: 1px solid var(--border-card);
          border-radius: 16px;
          padding: 22px;
          box-shadow: var(--shadow-sm);
        }
        .fdc-contact-title {
          font-family: 'Poppins', sans-serif;
          font-weight: 700;
          font-size: 14px;
          color: var(--text);
          margin-bottom: 12px;
        }
        .fdc-contact-link {
          color: var(--primary);
          font-weight: 600;
          font-size: 14px;
          text-decoration: none;
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 6px;
        }
        /* ── What you get section ── */
        .fdc-wyg-section {
          background: var(--bg);
          padding: 72px 24px;
        }
        .fdc-section-inner { max-width: 1100px; margin: 0 auto; }
        .fdc-section-eyebrow {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--primary);
          margin-bottom: 8px;
          text-align: center;
        }
        .fdc-section-title {
          font-family: 'Poppins', sans-serif;
          font-size: clamp(22px, 3.5vw, 34px);
          font-weight: 800;
          color: var(--text);
          text-align: center;
          margin-bottom: 10px;
        }
        .fdc-section-sub {
          text-align: center;
          color: var(--text-muted);
          font-size: 15px;
          margin-bottom: 48px;
        }
        .fdc-wyg-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
        }
        .fdc-wyg-card {
          background: var(--bg-card);
          border: 1px solid var(--border-card);
          border-radius: 14px;
          padding: 24px 20px;
          box-shadow: var(--shadow-sm);
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .fdc-wyg-card:hover {
          transform: translateY(-3px);
          box-shadow: var(--shadow-md);
        }
        .fdc-wyg-icon {
          font-size: 28px;
          margin-bottom: 12px;
          display: block;
        }
        .fdc-wyg-title {
          font-family: 'Poppins', sans-serif;
          font-weight: 700;
          font-size: 15px;
          color: var(--text);
          margin-bottom: 6px;
        }
        .fdc-wyg-desc {
          font-size: 13px;
          color: var(--text-muted);
          line-height: 1.6;
        }
        /* ── Reviews ── */
        .fdc-reviews-section {
          background: var(--bg-alt);
          padding: 72px 24px;
        }
        .fdc-reviews-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
        }
        .fdc-review-card {
          background: var(--bg-card);
          border: 1px solid var(--border-card);
          border-radius: 14px;
          padding: 24px;
          box-shadow: var(--shadow-sm);
        }
        .fdc-stars {
          color: #f59e0b;
          font-size: 15px;
          margin-bottom: 12px;
          letter-spacing: 2px;
        }
        .fdc-review-text {
          font-size: 14px;
          color: var(--text-muted);
          line-height: 1.65;
          margin-bottom: 16px;
          font-style: italic;
        }
        .fdc-review-name {
          font-family: 'Poppins', sans-serif;
          font-weight: 700;
          font-size: 13px;
          color: var(--text);
        }
        .fdc-review-course {
          font-size: 12px;
          color: var(--primary);
          font-weight: 600;
        }
        /* ── FAQ ── */
        .fdc-faq-section {
          background: var(--bg);
          padding: 72px 24px;
        }
        .fdc-faq-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          max-width: 860px;
          margin: 0 auto;
        }
        .fdc-faq-item {
          background: var(--bg-card);
          border: 1px solid var(--border-card);
          border-radius: 12px;
          padding: 20px;
          box-shadow: var(--shadow-sm);
        }
        .fdc-faq-q {
          font-family: 'Poppins', sans-serif;
          font-weight: 700;
          font-size: 14px;
          color: var(--text);
          margin-bottom: 8px;
          display: flex;
          align-items: flex-start;
          gap: 8px;
        }
        .fdc-faq-q::before {
          content: 'Q';
          flex-shrink: 0;
          background: var(--primary);
          color: #fff;
          width: 20px;
          height: 20px;
          border-radius: 4px;
          font-size: 11px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-top: 1px;
        }
        .fdc-faq-a {
          font-size: 13px;
          color: var(--text-muted);
          line-height: 1.65;
          padding-left: 28px;
        }
        /* ── Bottom CTA ── */
        .fdc-bottom-cta {
          background: linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0c4a6e 100%);
          padding: 80px 24px;
          text-align: center;
        }
        .fdc-bottom-cta-title {
          font-family: 'Poppins', sans-serif;
          font-size: clamp(24px, 4vw, 40px);
          font-weight: 900;
          color: #fff;
          margin-bottom: 14px;
          line-height: 1.15;
        }
        .fdc-bottom-cta-title span { color: #38bdf8; }
        .fdc-bottom-cta-sub {
          color: rgba(255,255,255,0.7);
          font-size: 16px;
          margin-bottom: 36px;
          max-width: 520px;
          margin-left: auto;
          margin-right: auto;
        }
        .fdc-cta-btns {
          display: flex;
          gap: 14px;
          justify-content: center;
          flex-wrap: wrap;
          margin-bottom: 20px;
        }
        .fdc-btn-primary {
          background: linear-gradient(135deg, #e47538 0%, #f5a623 100%);
          color: #fff;
          padding: 16px 36px;
          border-radius: 10px;
          font-family: 'Poppins', sans-serif;
          font-weight: 800;
          font-size: 16px;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          box-shadow: 0 6px 24px rgba(228,117,56,0.45);
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .fdc-btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 30px rgba(228,117,56,0.55);
        }
        .fdc-btn-secondary {
          background: transparent;
          color: #fff;
          padding: 15px 28px;
          border-radius: 10px;
          border: 2px solid rgba(255,255,255,0.4);
          font-family: 'Poppins', sans-serif;
          font-weight: 600;
          font-size: 15px;
          text-decoration: none;
          transition: background 0.2s, border-color 0.2s;
        }
        .fdc-btn-secondary:hover {
          background: rgba(255,255,255,0.08);
          border-color: rgba(255,255,255,0.7);
        }
        /* ── Responsive ── */
        @media (max-width: 900px) {
          .fdc-body-inner { grid-template-columns: 1fr; }
          .fdc-wyg-grid { grid-template-columns: 1fr 1fr; }
          .fdc-reviews-grid { grid-template-columns: 1fr; }
          .fdc-faq-grid { grid-template-columns: 1fr; }
        }
        @media (max-width: 600px) {
          .fdc-body-inner { padding: 0 16px; }
          .fdc-wyg-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      {/* ── HERO ───────────────────────────────────────────────────── */}
      <section className="fdc-hero">
        <nav style={{ maxWidth: 1100, margin: '0 auto 24px', textAlign: 'left', fontSize: 13, color: 'rgba(255,255,255,0.5)' }} aria-label="Breadcrumb">
          <Link href="/" style={{ color: 'rgba(255,255,255,0.5)', textDecoration: 'none' }}>Home</Link>
          <span style={{ margin: '0 8px' }} aria-hidden="true">›</span>
          <span style={{ color: 'rgba(255,255,255,0.85)' }}>Free Demo Class</span>
        </nav>

        <div className="fdc-badge">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="4" fill="#0f172a" /></svg>
          Live Sessions Available
        </div>

        <h1 className="fdc-hero-title">
          Attend a <span>Free Demo Class</span><br />Before You Enroll
        </h1>
        <p className="fdc-hero-sub">
          Experience real training with certified experts — no fees, no pressure, no commitment. Walk away with a personalised career roadmap.
        </p>

        <div className="fdc-trust-row">
          {stats.map(s => (
            <div key={s.label} className="fdc-trust-pill">
              <strong>{s.number}</strong>
              <span>{s.label}</span>
            </div>
          ))}
        </div>

        <div className="fdc-urgency">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
          Counsellor calls back within 2 hours · Mon–Sat 9 am–7 pm
        </div>
      </section>

      {/* ── FORM + STEPS ───────────────────────────────────────────── */}
      <section className="fdc-body">
        <div className="fdc-body-inner">

          {/* Left — Form */}
          <div>
            <div className="fdc-form-label-tag">Book Your Free Seat</div>
            <h2 className="fdc-form-heading">Reserve Your Free Demo Class</h2>
            <p className="fdc-form-sub">
              Fill out the form and our counsellor will call you within <strong>2 hours</strong> to schedule your free demo at a time that suits you.
            </p>

            <div className="fdc-social-proof">
              <div className="fdc-avatars">
                {['R','S','P','A','K'].map(l => (
                  <span key={l} className="fdc-avatar">{l}</span>
                ))}
              </div>
              <span className="fdc-social-text">
                <strong>1,200+ students</strong> enrolled this year — join them!
              </span>
            </div>

            <EnrollFullForm />

            <div className="fdc-assurance">
              <span className="fdc-assurance-item">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                100% Secure & Private
              </span>
              <span className="fdc-assurance-item">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
                No Spam, No Pressure
              </span>
              <span className="fdc-assurance-item">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                Response within 2 hrs
              </span>
            </div>
          </div>

          {/* Right — Steps + Contact */}
          <div>
            <div className="fdc-steps-box">
              <div className="fdc-steps-title">How It Works</div>
              {steps.map(s => (
                <div key={s.number} className="fdc-step">
                  <div className="fdc-step-num" style={{ background: s.color }}>
                    {s.number}
                  </div>
                  <div>
                    <div className="fdc-step-title">{s.title}</div>
                    <div className="fdc-step-desc">{s.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="fdc-contact-box">
              <div className="fdc-contact-title">📞 Prefer to Call?</div>
              <a href="tel:+918885166007" className="fdc-contact-link">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12.7 19.79 19.79 0 0 1 1.62 4.08 2 2 0 0 1 3.6 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                +91 88851 66007
              </a>
              <a href="tel:+917780727374" className="fdc-contact-link">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12.7 19.79 19.79 0 0 1 1.62 4.08 2 2 0 0 1 3.6 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                +91 77807 27374
              </a>
              <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)', fontSize: 12, color: 'var(--text-muted)' }}>
                📍 Dilsukhnagar &amp; Ameerpet, Hyderabad
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ── WHAT YOU GET ───────────────────────────────────────────── */}
      <section className="fdc-wyg-section">
        <div className="fdc-section-inner">
          <p className="fdc-section-eyebrow">Included in Every Demo</p>
          <h2 className="fdc-section-title">What You Get in the Free Demo Class</h2>
          <p className="fdc-section-sub">No slides, no sales pitch — a genuine hands-on session run by certified industry experts.</p>

          <div className="fdc-wyg-grid">
            {whatYouGet.map(item => (
              <div key={item.title} className="fdc-wyg-card">
                <span className="fdc-wyg-icon">{item.icon}</span>
                <div className="fdc-wyg-title">{item.title}</div>
                <div className="fdc-wyg-desc">{item.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── STUDENT REVIEWS ────────────────────────────────────────── */}
      <section className="fdc-reviews-section">
        <div className="fdc-section-inner">
          <p className="fdc-section-eyebrow">Student Voices</p>
          <h2 className="fdc-section-title">What Students Say After Their Demo</h2>
          <p className="fdc-section-sub">Real words from real students — no scripts.</p>

          <div className="fdc-reviews-grid" style={{ marginTop: 40 }}>
            {reviews.map(r => (
              <div key={r.name} className="fdc-review-card">
                <div className="fdc-stars">{'★'.repeat(r.rating)}</div>
                <p className="fdc-review-text">&quot;{r.text}&quot;</p>
                <div className="fdc-review-name">{r.name}</div>
                <div className="fdc-review-course">{r.course} Batch</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ────────────────────────────────────────────────────── */}
      <section className="fdc-faq-section">
        <div className="fdc-section-inner">
          <p className="fdc-section-eyebrow">Common Questions</p>
          <h2 className="fdc-section-title">Frequently Asked Questions</h2>
          <p className="fdc-section-sub" style={{ marginBottom: 40 }}>Everything you need to know before booking.</p>

          <div className="fdc-faq-grid">
            {faqs.map(f => (
              <div key={f.q} className="fdc-faq-item">
                <div className="fdc-faq-q">{f.q}</div>
                <div className="fdc-faq-a">{f.a}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── BOTTOM CTA ─────────────────────────────────────────────── */}
      <section className="fdc-bottom-cta">
        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#34d399', marginBottom: 14 }}>
          Limited Seats Per Batch
        </p>
        <h2 className="fdc-bottom-cta-title">
          Your IT Career Starts with<br /><span>One Free Class</span>
        </h2>
        <p className="fdc-bottom-cta-sub">
          Join 5,000+ students who took that first step. No fees, no risk — just real training that gets you hired.
        </p>
        <div className="fdc-cta-btns">
          <a href="#top" className="fdc-btn-primary">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            Book My Free Demo Class
          </a>
          <a href="https://wa.me/918885166007" target="_blank" rel="noopener noreferrer" className="fdc-btn-secondary">
            Chat on WhatsApp →
          </a>
        </div>
        <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12 }}>
          Prefer to browse courses first?{' '}
          <Link href="/courses/" style={{ color: '#38bdf8', textDecoration: 'none', fontWeight: 600 }}>View All Courses →</Link>
        </p>
      </section>
    </>
  );
}
