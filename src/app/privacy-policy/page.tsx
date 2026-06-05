import type { Metadata } from 'next';
import { PageBanner, ResponsivePageStyles } from '@/components/shared';
import { buildPageMetadata } from '@/lib/get-page-seo';

export const dynamic = 'force-dynamic';
export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata('privacy-policy');
}

const sections = [
  { title: 'Information We Collect', content: 'We collect information you provide directly to us, such as your name, phone number, email address, and course preferences when you fill out our enrollment form, contact form, or subscribe to our newsletter. We may also collect information automatically when you visit our website, including your IP address, browser type, and pages visited.' },
  { title: 'How We Use Your Information', content: 'We use the information we collect to: process your enrollment and provide training services; communicate with you about courses, schedules, and promotions; send you educational content and career guidance; respond to your inquiries and provide customer support; improve our website and training programs; and comply with legal obligations.' },
  { title: 'Information Sharing', content: 'We do not sell, trade, or rent your personal information to third parties. We may share your information with our hiring partners and placement companies only with your consent to help you find suitable employment opportunities. We may also share information with service providers who assist us in operating our website and business.' },
  { title: 'Data Security', content: 'We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the internet or electronic storage is 100% secure.' },
  { title: 'Cookies', content: 'We use cookies and similar tracking technologies to track activity on our website and hold certain information. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent. However, if you do not accept cookies, you may not be able to use some portions of our website.' },
  { title: 'Your Rights', content: 'You have the right to access, correct, or delete your personal information. You may also withdraw consent for us to process your data at any time. To exercise these rights, please contact us at info@cosscloudsol.com.' },
  { title: 'Contact Us', content: 'If you have any questions about this Privacy Policy, please contact us at: Coss Cloud Solutions, Dilsukhnagar, Hyderabad – 500060. Email: info@cosscloudsol.com | Phone: +91 88851 66007' },
];

export default function PrivacyPolicyPage() {
  return (
    <>
      <ResponsivePageStyles />
      <PageBanner title="Privacy Policy" breadcrumb={[{ label: 'Privacy Policy', href: '/privacy-policy/' }]} />
      <div style={{ maxWidth: '860px', margin: '0 auto', padding: '56px 20px' }}>
        <div style={{ background: '#fff3f0', borderRadius: '12px', padding: '18px 22px', marginBottom: '36px', borderLeft: '4px solid #e8401c' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', lineHeight: '1.7' }}>
            <strong style={{ color: '#e8401c' }}>Last Updated: January 2025.</strong> This Privacy Policy describes how Coss Cloud Solutions collects, uses, and protects your personal information when you use our services.
          </p>
        </div>
        {sections.map(s => (
          <div key={s.title} style={{ marginBottom: '32px' }}>
            <h2 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '18px', color: 'var(--text)', marginBottom: '10px', paddingLeft: '14px', borderLeft: '3px solid #e8401c' }}>
              {s.title}
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '14.5px', lineHeight: '1.8' }}>{s.content}</p>
          </div>
        ))}
      </div>
    </>
  );
}
