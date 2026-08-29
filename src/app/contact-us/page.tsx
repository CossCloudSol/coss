import type { Metadata } from 'next';
import Link from 'next/link';
import { HeroBanner, ResponsivePageStyles } from '@/components/shared';
import ContactForm from '@/components/ContactForm';
import CallLink from '@/components/CallLink';
import WhatsAppLink from '@/components/WhatsAppLink';

import { buildPageMetadata } from '@/lib/get-page-seo';

export const revalidate = 86400;
export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata('contact');
}

const contactInfo = [
  { icon: '📍', title: 'Dilsukhnagar Branch', lines: ['Flat No. 109, C.B Eastern Homes,', 'Above Bank of Maharashtra, Srinagar Colony,', 'Opposite Chai Vaai Cafe, Beside Anjana Function Hall,', 'Dilsukhnagar, Hyderabad – 500060'] },
  { icon: '📍', title: 'Ameerpet Branch', lines: ['#502, Sree Swathi Ankur Building,', 'Besides Aditya Trade Center,', 'Ameerpet, Hyderabad – 500016'] },
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

            <ContactForm />
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
                📞 For urgent queries, call us directly at <CallLink number="+918885166007" pageType="static" style={{ color: 'var(--primary)', fontWeight: 600 }}>+91 88851 66007</CallLink>
              </div>
            </div>

            {/* WhatsApp */}
            <div style={{ background: '#25D366', borderRadius: '14px', padding: '22px', color: '#fff', textAlign: 'center', marginBottom: '20px' }}>
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>💬</div>
              <h4 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '16px', marginBottom: '6px' }}>Chat on WhatsApp</h4>
              <p style={{ fontSize: '13px', opacity: 0.9, marginBottom: '14px' }}>Get instant answers to your queries</p>
              <WhatsAppLink
                ctaType="contact_page"
                pageType="static"
                message="Hi Coss Cloud Solutions Team, I'd like to know more about your courses. Could you help me?"
                style={{ display: 'block', background: 'var(--bg-card)', color: '#25D366', padding: '10px', borderRadius: '8px', fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '14px' }}
              >
                Chat Now on WhatsApp
              </WhatsAppLink>
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
              { title: 'Dilsukhnagar Branch', src: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3807.916716367894!2d78.5283118!3d17.3677756!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bcb99fcaf898051%3A0xa63d61bd6b7fd4e2!2sCoss%20Cloud%20Solutions!5e0!3m2!1sen!2sin!4v1779166538650!5m2!1sen!2sin' },
              { title: 'Ameerpet Branch', src: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3200.84840352847!2d78.44696155635079!3d17.43712331254024!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bcb9127c03edcaf%3A0x8415d2ae07b161f8!2sCoss%20Cloud%20Solutions%20-%20Data%20Science%20%7C%20Digital%20Marketing%20%7C%20Cyber%20Security%20Course%20%7C%20Software%20Training%20Institute%20in%20Ameerpet!5e0!3m2!1sen!2sin!4v1779166650074!5m2!1sen!2sin' },
            ].map(b => (
              <div key={b.title} style={{ background: 'var(--bg-card)', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 14px rgba(0,0,0,0.08)' }}>
                <div style={{ background: '#1a1a2e', padding: '14px 18px' }}>
                  <h4 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '14px', color: '#fff' }}>{b.title}</h4>
                </div>
                <iframe
                  src={b.src}
                  width="100%" height="220" style={{ border: 0, display: 'block' }}
                  allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            ))}
          </div>
        </div>

        {/* ── Pay Course Fee Online ── */}
        <div style={{ marginTop: '56px' }}>
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <div style={{ display: 'inline-block', background: 'rgba(249,115,22,0.12)', color: '#F97316', fontSize: '12px', fontWeight: 600, fontFamily: 'Poppins, sans-serif', textTransform: 'uppercase', letterSpacing: '1px', padding: '4px 14px', borderRadius: '20px', marginBottom: '12px' }}>Online Payment</div>
            <h2 style={{ fontFamily: 'Poppins, sans-serif', fontSize: 'clamp(22px,3.5vw,30px)', fontWeight: 700, color: 'var(--text)', marginBottom: '8px' }}>Pay Course Fee Online</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '15px' }}>Secure payment via Razorpay — pay anytime, anywhere</p>
          </div>

          <div style={{ maxWidth: '560px', margin: '0 auto' }}>
            <div style={{ background: 'linear-gradient(135deg, #0f3460 0%, #1a1a2e 100%)', borderRadius: '20px', padding: '40px 36px', boxShadow: '0 8px 32px rgba(0,0,0,0.18)', border: '1px solid rgba(249,115,22,0.25)', textAlign: 'center' }}>
              {/* Lock icon */}
              <div style={{ fontSize: '40px', marginBottom: '18px' }}>🔒</div>

              {/* CTA button */}
              <a
                href="https://razorpay.me/@cosscloudsolutions"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '8px',
                  background: '#F97316', color: '#fff',
                  padding: '16px 36px', borderRadius: '10px',
                  fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '17px',
                  textDecoration: 'none', marginBottom: '22px',
                  boxShadow: '0 4px 18px rgba(249,115,22,0.45)',
                  transition: 'transform 0.15s',
                }}
              >
                Pay Now via Razorpay →
              </a>

              {/* Accepted methods */}
              <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '12.5px', marginBottom: '14px' }}>
                Accepted: UPI, Credit/Debit Card, Net Banking, EMI
              </p>

              {/* Payment method badges */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center', marginBottom: '22px' }}>
                {['UPI', 'Visa', 'Mastercard', 'Net Banking', 'EMI'].map(m => (
                  <span key={m} style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', fontSize: '11.5px', padding: '5px 12px', borderRadius: '6px', fontFamily: 'Poppins, sans-serif', fontWeight: 500 }}>{m}</span>
                ))}
              </div>

              {/* Trust line */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', color: 'rgba(255,255,255,0.5)', fontSize: '12px' }}>
                <span>✅</span>
                <span>100% Secure</span>
                <span style={{ opacity: 0.4 }}>·</span>
                <span>SSL Encrypted</span>
                <span style={{ opacity: 0.4 }}>·</span>
                <span>Instant Confirmation</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

