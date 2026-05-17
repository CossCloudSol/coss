import type { Metadata } from 'next';
import Link from 'next/link';
import { HeroBanner, ResponsivePageStyles } from '@/components/shared';

import { buildPageMetadata } from '@/lib/get-page-seo';

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata('contact');
}

const contactInfo = [
  { icon: '📍', title: 'Dilsukhnagar Branch', lines: ['Flat No. 109, C.B Eastern Homes,', 'Above Bank of Maharashtra, Srinagar Colony,', 'Opposite Chai Vaai Cafe, Beside Anjana Function Hall,', 'Dilsukhnagar, Hyderabad – 500060'] },
  { icon: '📍', title: 'Ameerpet Branch', lines: ['#502, Sree Swathi Ankur Building,', 'Besides Aditya Trade Center,', 'Ameerpet, Hyderabad – 500038'] },
  { icon: '📞', title: 'Phone Numbers', lines: ['+91 88851 66007', '+91 77807 27374'] },
  { icon: '✉️', title: 'Email Address', lines: ['info@cosscloudsol.com'] },
];

const timings = [
  { day: 'Monday – Friday', time: '8:00 AM – 8:00 PM' },
  { day: 'Saturday', time: '8:00 AM – 6:00 PM' },
  { day: 'Sunday', time: '10:00 AM – 4:00 PM' },
];

export default function ContactUsPage() {
  return (
    <>
      <ResponsivePageStyles />
      <HeroBanner
        badge="GET IN TOUCH — WE RESPOND IN 2 HOURS"
        titlePre="Talk to a "
        accentText="Training Expert"
        titleLine2="We'll Call You Back"
        subtitle="Have questions about courses, fees, or batch schedules? Our counsellors are available Mon–Sat, 9 am–7 pm across 2 branches in Hyderabad."
        stats={[
          { value: '2',       label: 'BRANCHES IN HYD' },
          { value: '<2 hrs',  label: 'RESPONSE TIME' },
          { value: 'Free',    label: 'COUNSELLING' },
          { value: 'Mon–Sat', label: '9 AM – 7 PM' },
        ]}
        ctaText="Dilsukhnagar & Ameerpet, Hyderabad · Free career counselling"
        breadcrumb={[{ label: 'Contact Us', href: '/contact-us/' }]}
      />

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '56px 20px' }}>

        {/* Contact cards */}
        <div className="contact-cards" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '18px', marginBottom: '52px' }}>
          {contactInfo.map(c => (
            <div key={c.title} style={{ background: 'var(--bg-card)', borderRadius: '12px', padding: '22px', boxShadow: '0 2px 14px rgba(0,0,0,0.08)', border: '1px solid var(--border-card)', textAlign: 'center' }}>
              <div style={{ fontSize: '28px', marginBottom: '10px' }}>{c.icon}</div>
              <h4 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '14px', color: 'var(--text)', marginBottom: '10px' }}>{c.title}</h4>
              {c.lines.map((line, i) => (
                <p key={i} style={{ color: 'var(--text-muted)', fontSize: '12.5px', lineHeight: '1.7' }}>{line}</p>
              ))}
            </div>
          ))}
        </div>

        {/* Main grid */}
        <div className="contact-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', alignItems: 'start' }}>
          {/* Form */}
          <div>
            <h2 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 'clamp(20px,3.5vw,26px)', color: 'var(--text)', marginBottom: '8px' }}>Send Us a Message</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '24px' }}>Our team will get back to you within 24 hours.</p>

            <div style={{ background: 'var(--bg-card)', borderRadius: '16px', padding: '32px', boxShadow: '0 4px 24px rgba(0,0,0,0.08)', border: '1px solid var(--border-card)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div>
                  <label style={labelStyle}>Full Name *</label>
                  <input type="text" placeholder="Your full name" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Mobile Number *</label>
                  <input type="tel" placeholder="+91 XXXXX XXXXX" style={inputStyle} />
                </div>
              </div>
              <div style={{ marginBottom: '14px' }}>
                <label style={labelStyle}>Email Address</label>
                <input type="email" placeholder="your@email.com" style={inputStyle} />
              </div>
              <div style={{ marginBottom: '14px' }}>
                <label style={labelStyle}>Subject</label>
                <select style={inputStyle}>
                  <option value="">Select Subject</option>
                  <option>Course Enquiry</option>
                  <option>Demo Class Request</option>
                  <option>Corporate Training</option>
                  <option>Placement Query</option>
                  <option>Fee & Schedule</option>
                  <option>Other</option>
                </select>
              </div>
              <div style={{ marginBottom: '14px' }}>
                <label style={labelStyle}>Preferred Branch</label>
                <div style={{ display: 'flex', gap: '20px', marginTop: '4px' }}>
                  {['Dilsukhnagar', 'Ameerpet', 'Online'].map(b => (
                    <label key={b} style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '14px', color: 'var(--text)' }}>
                      <input type="radio" name="branch" value={b} style={{ accentColor: '#e8401c' }} /> {b}
                    </label>
                  ))}
                </div>
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={labelStyle}>Message *</label>
                <textarea placeholder="Write your message here..." rows={4} style={{ ...inputStyle, resize: 'vertical' }} />
              </div>
              <Link href="#" style={{ display: 'block', textAlign: 'center', background: '#e8401c', color: '#fff', padding: '14px', borderRadius: '8px', fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '15px' }}>
                Send Message →
              </Link>
            </div>
          </div>

          {/* Right info */}
          <div>
            {/* Timings */}
            <div style={{ background: '#1a1a2e', borderRadius: '14px', padding: '28px', color: '#fff', marginBottom: '20px' }}>
              <h3 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '18px', marginBottom: '18px' }}>🕐 Training Timings</h3>
              {timings.map(t => (
                <div key={t.day} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.08)', fontSize: '13px' }}>
                  <span style={{ color: '#ccc' }}>{t.day}</span>
                  <span style={{ color: '#e8401c', fontFamily: 'Poppins, sans-serif', fontWeight: 600 }}>{t.time}</span>
                </div>
              ))}
              <div style={{ marginTop: '16px', padding: '12px', background: 'rgba(232,64,28,0.1)', borderRadius: '8px', fontSize: '12px', color: '#aaa', lineHeight: '1.6' }}>
                📞 For urgent queries, call us directly at <a href="tel:+918885166007" style={{ color: 'var(--primary)', fontWeight: 600 }}>+91 88851 66007</a>
              </div>
            </div>

            {/* WhatsApp */}
            <div style={{ background: '#25D366', borderRadius: '14px', padding: '22px', color: '#fff', textAlign: 'center', marginBottom: '20px' }}>
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>💬</div>
              <h4 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '16px', marginBottom: '6px' }}>Chat on WhatsApp</h4>
              <p style={{ fontSize: '13px', opacity: 0.9, marginBottom: '14px' }}>Get instant answers to your queries</p>
              <a href="https://wa.me/918885166007" target="_blank" rel="noopener noreferrer" style={{ display: 'block', background: 'var(--bg-card)', color: '#25D366', padding: '10px', borderRadius: '8px', fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '14px' }}>
                Chat Now on WhatsApp
              </a>
            </div>

            {/* Quick links */}
            <div style={{ background: 'var(--bg-alt)', borderRadius: '14px', padding: '22px' }}>
              <h4 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '15px', color: 'var(--text)', marginBottom: '14px' }}>Quick Links</h4>
              {[
                { label: '📚 View All Courses', href: '/courses/' },
                { label: '🎓 Enroll Now', href: '/enroll-now-with-coss/' },
                { label: '💼 Placement Info', href: '/placements/' },
                { label: '🏢 Corporate Training', href: '/corporate-training/' },
                { label: '⭐ Student Reviews', href: '/student-reviews/' },
              ].map(l => (
                <Link key={l.href} href={l.href} style={{ display: 'block', padding: '9px 0', fontSize: '13.5px', color: 'var(--text)', borderBottom: '1px solid var(--border)', fontWeight: 500 }}>
                  {l.label} <span style={{ float: 'right', color: '#e8401c' }}>›</span>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Maps */}
        <div style={{ marginTop: '48px' }}>
          <h3 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '22px', color: 'var(--text)', marginBottom: '20px', textAlign: 'center' }}>Find Our Branches</h3>
          <div className="contact-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            {[
              { title: 'Dilsukhnagar Branch', q: 'Coss+Cloud+Solutions+Dilsukhnagar' },
              { title: 'Ameerpet Branch', q: 'Coss+Cloud+Solutions+Ameerpet' },
            ].map(b => (
              <div key={b.title} style={{ background: 'var(--bg-card)', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 14px rgba(0,0,0,0.08)' }}>
                <div style={{ background: '#1a1a2e', padding: '14px 18px' }}>
                  <h4 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '14px', color: '#fff' }}>{b.title}</h4>
                </div>
                <iframe
                  src={`https://www.google.com/maps?q=${b.q}&output=embed`}
                  width="100%" height="220" style={{ border: 0, display: 'block' }}
                  allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

// CSS vars: theme-aware form element styles — works in both light and dark mode
const labelStyle: React.CSSProperties = { display: 'block', fontSize: '13px', fontFamily: 'Poppins, sans-serif', fontWeight: 600, color: 'var(--text)', marginBottom: '6px' };
const inputStyle: React.CSSProperties = { width: '100%', padding: '11px 13px', borderRadius: '8px', border: '1.5px solid var(--border)', background: 'var(--bg-alt)', color: 'var(--text)', fontSize: '14px', outline: 'none', fontFamily: 'Open Sans, sans-serif' };
