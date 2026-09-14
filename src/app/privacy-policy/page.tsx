import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { PageBanner, ResponsivePageStyles } from '@/components/shared';
import { buildPageMetadata } from '@/lib/get-page-seo';

export const revalidate = 86400;
export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata('privacy-policy');
}

const bodyStyle = { color: 'var(--text-muted)', fontSize: '14.5px', lineHeight: '1.8' };
const labelStyle = { color: 'var(--text)' };

type Section = { title: string; content: ReactNode };

const sections: Section[] = [
  {
    title: 'Personal Data We Collect',
    content: (
      <>
        <p style={{ margin: '0 0 8px', fontWeight: 700, color: 'var(--text)' }}>Information you give us directly</p>
        <ul style={{ margin: '0 0 16px', paddingLeft: '20px' }}>
          <li style={{ marginBottom: '6px' }}>Your name, mobile number and email address</li>
          <li style={{ marginBottom: '6px' }}>Your course, batch and centre preference (Dilsukhnagar, Ameerpet or online)</li>
          <li style={{ marginBottom: '6px' }}>The type of enquiry you select and any message you write to us</li>
          <li style={{ marginBottom: '6px' }}>At the time of enrolment: your address, identity and qualification details, and payment or transaction references</li>
          <li style={{ marginBottom: 0 }}>If you choose to use our placement support: your resume, education history and employment history</li>
        </ul>
        <p style={{ margin: '0 0 8px', fontWeight: 700, color: 'var(--text)' }}>Information collected automatically when you use the website</p>
        <ul style={{ margin: '0 0 16px', paddingLeft: '20px' }}>
          <li style={{ marginBottom: '6px' }}>IP address, browser type, device type and operating system</li>
          <li style={{ marginBottom: '6px' }}>Pages viewed, the page that referred you, and how you arrived at the site</li>
          <li style={{ marginBottom: '6px' }}>Clicks on call, WhatsApp and form buttons, which we use to understand which pages help students find us</li>
          <li style={{ marginBottom: 0 }}>Cookie and analytics identifiers</li>
        </ul>
        <p style={{ margin: 0 }}>We do not collect card numbers, UPI PINs or bank credentials on this website. Online payments are handled by third-party payment providers under their own terms.</p>
      </>
    ),
  },
  {
    title: 'How We Use Your Personal Data',
    content: (
      <>
        <p style={{ margin: '0 0 8px' }}>We use your personal data to:</p>
        <ul style={{ margin: '0 0 12px', paddingLeft: '20px' }}>
          <li style={{ marginBottom: '6px' }}>Respond to your enquiry and contact you about the course you asked about, by phone, WhatsApp, SMS or email</li>
          <li style={{ marginBottom: '6px' }}>Schedule and confirm your free demo class or batch seat</li>
          <li style={{ marginBottom: '6px' }}>Process your enrolment, issue receipts, and deliver the training programme</li>
          <li style={{ marginBottom: '6px' }}>Maintain attendance records and issue course completion certificates</li>
          <li style={{ marginBottom: '6px' }}>Provide placement support, where you have asked for it</li>
          <li style={{ marginBottom: '6px' }}>Send you course schedules, batch updates and service messages</li>
          <li style={{ marginBottom: '6px' }}>Improve our website, our course content and our batch planning</li>
          <li style={{ marginBottom: 0 }}>Meet our legal, tax, accounting and regulatory obligations</li>
        </ul>
        <p style={{ margin: 0 }}>Where you have agreed to receive them, we may also send you promotional messages about new courses, batches and offers. You can opt out of these at any time without affecting any training you have already enrolled in.</p>
      </>
    ),
  },
  {
    title: 'Consent and Its Withdrawal',
    content: 'We process your personal data on the basis of the consent you give when you submit a form, message us, or enrol with us, and for the legitimate uses permitted under the DPDP Act. You may withdraw your consent at any time by writing to info@cosscloudsol.com or to our Grievance Officer. Withdrawing consent is as easy as giving it. When you withdraw consent we will stop processing your data for the purposes concerned, unless we are required to retain it by law. Withdrawal does not affect any processing already carried out while your consent was in force.',
  },
  {
    title: 'Who We Share Your Personal Data With',
    content: (
      <>
        <p style={{ margin: '0 0 12px' }}>We do not sell, rent or trade your personal data.</p>
        <p style={{ margin: '0 0 12px' }}><strong style={labelStyle}>Service providers.</strong> We share data with the providers who run our website and business operations, including website hosting, database hosting, media delivery, email delivery, analytics and social media scheduling. They may process your data only on our instructions and only for the purposes described in this policy.</p>
        <p style={{ margin: '0 0 12px' }}><strong style={labelStyle}>Hiring partners.</strong> We share a student&apos;s resume and contact details with hiring partners only where that student is enrolled with us and has separately opted in to placement support at the placement registration stage. Submitting an enquiry or booking a demo class does not result in your details being shared with any employer.</p>
        <p style={{ margin: '0 0 12px' }}><strong style={labelStyle}>Payment providers.</strong> Where you pay online, your payment details are handled directly by the payment provider.</p>
        <p style={{ margin: 0 }}><strong style={labelStyle}>Legal and regulatory.</strong> We may disclose data where required by law, a court, or a government authority, or to establish or defend a legal claim.</p>
      </>
    ),
  },
  {
    title: 'Transfers Outside India',
    content: 'Some of the service providers described above store or process personal data on servers located outside India. Where that happens, the transfer is made in accordance with the DPDP Act, and we do not transfer personal data to any country restricted by the Central Government for this purpose.',
  },
  {
    title: 'How Long We Keep Your Personal Data',
    content: (
      <>
        <p style={{ margin: '0 0 14px' }}>We keep personal data only for as long as it is needed for the purpose it was collected for, or for as long as the law requires.</p>
        <div style={{ overflowX: 'auto', margin: '0 0 14px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '8px 12px', borderBottom: '2px solid #e8401c', color: 'var(--text)', fontWeight: 700 }}>Type of data</th>
                <th style={{ textAlign: 'left', padding: '8px 12px', borderBottom: '2px solid #e8401c', color: 'var(--text)', fontWeight: 700 }}>Retention period</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ padding: '8px 12px', borderBottom: '1px solid #f0f0f0' }}>Enquiry, demo booking and contact form data where you did not enrol</td>
                <td style={{ padding: '8px 12px', borderBottom: '1px solid #f0f0f0' }}>24 months from your last interaction with us</td>
              </tr>
              <tr>
                <td style={{ padding: '8px 12px', borderBottom: '1px solid #f0f0f0' }}>Enrolment, payment, attendance and certification records</td>
                <td style={{ padding: '8px 12px', borderBottom: '1px solid #f0f0f0' }}>8 years, to meet tax, audit and certificate reissue obligations</td>
              </tr>
              <tr>
                <td style={{ padding: '8px 12px', borderBottom: '1px solid #f0f0f0' }}>Resume and placement support data</td>
                <td style={{ padding: '8px 12px', borderBottom: '1px solid #f0f0f0' }}>24 months after course completion, or until you withdraw consent</td>
              </tr>
              <tr>
                <td style={{ padding: '8px 12px' }}>Website analytics data</td>
                <td style={{ padding: '8px 12px' }}>Up to 14 months</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p style={{ margin: 0 }}>After these periods the data is deleted, or anonymised so that it can no longer identify you.</p>
      </>
    ),
  },
  {
    title: 'Your Rights',
    content: (
      <>
        <p style={{ margin: '0 0 8px' }}>Under the DPDP Act you have the right to:</p>
        <ul style={{ margin: '0 0 12px', paddingLeft: '20px' }}>
          <li style={{ marginBottom: '6px' }}><strong style={labelStyle}>Access</strong> a summary of the personal data we hold about you and how we process it</li>
          <li style={{ marginBottom: '6px' }}><strong style={labelStyle}>Correct, complete or update</strong> your personal data where it is inaccurate or incomplete</li>
          <li style={{ marginBottom: '6px' }}><strong style={labelStyle}>Erase</strong> your personal data where it is no longer needed for the purpose it was collected for and we are not required to keep it</li>
          <li style={{ marginBottom: '6px' }}><strong style={labelStyle}>Nominate</strong> another person to exercise these rights on your behalf in the event of your death or incapacity</li>
          <li style={{ marginBottom: '6px' }}><strong style={labelStyle}>Withdraw consent</strong>, as described under Consent and Its Withdrawal</li>
          <li style={{ marginBottom: 0 }}><strong style={labelStyle}>Raise a grievance</strong> with us, by contacting our Grievance Officer below</li>
        </ul>
        <p style={{ margin: 0 }}>To exercise any of these rights, email info@cosscloudsol.com from the email address you registered with us, or contact our Grievance Officer. We may ask you to verify your identity before we act on a request.</p>
      </>
    ),
  },
  {
    title: 'Children and Persons with Disabilities',
    content: 'Our courses and this website are intended for persons aged 18 years and above, and our forms should be completed only by persons aged 18 or above. Where a person under the age of 18 wishes to enrol, we process their personal data only after obtaining verifiable consent from a parent or lawful guardian at our centre, and we process only the data needed to deliver the training. We do not carry out behavioural tracking or monitoring of children, and we do not direct advertising at children. Where a person has a lawful guardian, we process their personal data only with the verifiable consent of that guardian. If you believe a child has given us personal data without the consent of a parent or guardian, contact our Grievance Officer and we will delete it.',
  },
  {
    title: 'Cookies, Analytics and Notifications',
    content: 'We use cookies and similar technologies to keep the website working, remember your preferences, and understand how the site is used. We use Google Analytics to measure website traffic and to see which pages help students find us. Browser push notifications are sent only if you accept the notification prompt in your browser. You can turn them off at any time in your browser settings. You can set your browser to refuse cookies or to alert you when a cookie is being set. Some parts of the website may not work correctly if you refuse cookies.',
  },
  {
    title: 'Security',
    content: 'We use appropriate technical and organisational measures to protect your personal data against unauthorised access, alteration, disclosure or loss, including encrypted connections, access controls on our admin systems, and limiting access to staff who need it. No method of transmitting or storing data can be guaranteed completely secure, and we cannot warrant absolute security.',
  },
  {
    title: 'Personal Data Breach',
    content: 'If a personal data breach occurs, we will notify the Data Protection Board of India and every affected person in the manner and within the timelines required by the DPDP Act and the rules made under it.',
  },
  {
    title: 'Grievance Officer',
    content: (
      <>
        <p style={{ margin: '0 0 14px' }}>If you have a question, concern or complaint about how we handle your personal data, contact our Grievance Officer:</p>
        <div style={{ background: 'rgba(0,0,0,0.03)', borderRadius: '8px', padding: '16px 18px', margin: '0 0 14px' }}>
          <p style={{ margin: '0 0 6px' }}><strong style={labelStyle}>Name:</strong> P. Ramchandra Reddy</p>
          <p style={{ margin: '0 0 6px' }}><strong style={labelStyle}>Designation:</strong> Grievance Officer</p>
          <p style={{ margin: '0 0 6px' }}><strong style={labelStyle}>Email:</strong> support@cosscloudsol.com</p>
          <p style={{ margin: '0 0 6px' }}><strong style={labelStyle}>Phone:</strong> +91 88851 66007</p>
          <p style={{ margin: 0 }}><strong style={labelStyle}>Address:</strong> Flat No. 109, Eastern Home, C.B, Srinagar Colony, Kamala Nagar, Dilsukhnagar, Hyderabad, Telangana 500060</p>
        </div>
        <p style={{ margin: 0 }}>We will acknowledge your grievance within 48 hours of receiving it and aim to resolve it within 30 days.</p>
      </>
    ),
  },
  {
    title: 'Escalating to the Data Protection Board of India',
    content: 'If you have raised a grievance with our Grievance Officer and you are not satisfied with how it was handled, you may make a complaint to the Data Protection Board of India in the manner prescribed under the Digital Personal Data Protection Act, 2023.',
  },
  {
    title: 'Changes to This Policy',
    content: 'We may update this Privacy Policy to reflect changes in our practices or in the law. The updated version takes effect when it is published on this page, and the "Last Updated" date above will change.',
  },
  {
    title: 'Contact Us',
    content: 'Coss Cloud Solutions, Flat No. 109, Eastern Home, C.B, Srinagar Colony, Kamala Nagar, Dilsukhnagar, Hyderabad, Telangana 500060. Email: info@cosscloudsol.com | Phone: +91 88851 66007. This Privacy Policy should be read together with our Terms & Conditions and our Refund and Cancellation Policy.',
  },
];

export default function PrivacyPolicyPage() {
  return (
    <>
      <ResponsivePageStyles />
      <PageBanner title="Privacy Policy" breadcrumb={[{ label: 'Privacy Policy', href: '/privacy-policy/' }]} />
      <div style={{ maxWidth: '860px', margin: '0 auto', padding: '56px 20px' }}>
        <div style={{ background: '#fff3f0', borderRadius: '12px', padding: '18px 22px', marginBottom: '36px', borderLeft: '4px solid #e8401c' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', lineHeight: '1.7' }}>
            <strong style={{ color: '#e8401c' }}>Last Updated: September 2026.</strong> This Privacy Policy describes how Coss Cloud Solutions collects, uses, shares, stores and protects your personal data, and sets out your rights under the Digital Personal Data Protection Act, 2023.
          </p>
        </div>
        {sections.map(s => (
          <div key={s.title} style={{ marginBottom: '32px' }}>
            <h2 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '18px', color: 'var(--text)', marginBottom: '10px', paddingLeft: '14px', borderLeft: '3px solid #e8401c' }}>
              {s.title}
            </h2>
            {typeof s.content === 'string'
              ? <p style={bodyStyle}>{s.content}</p>
              : <div style={bodyStyle}>{s.content}</div>}
          </div>
        ))}
      </div>
    </>
  );
}
