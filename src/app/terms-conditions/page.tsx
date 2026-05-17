import type { Metadata } from 'next';
import { PageBanner, ResponsivePageStyles } from '@/components/shared';
import { buildPageMetadata } from '@/lib/get-page-seo';

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata('terms-conditions');
}

const sections = [
  {
    title: '1. Acceptance of Terms',
    content: 'By enrolling in any course or using the services of Coss Cloud Solutions, you agree to be bound by these Terms and Conditions. If you do not agree with any part of these terms, please do not use our services. These terms apply to all students, visitors, and users of our training programs and website.',
  },
  {
    title: '2. Enrollment & Registration',
    content: 'Enrollment in a course is confirmed only upon receipt of the course fee or a confirmed payment arrangement. Coss Cloud Solutions reserves the right to deny enrollment to any individual. Students must provide accurate personal information at the time of registration. Any false information may result in immediate termination of enrollment without refund.',
  },
  {
    title: '3. Course Fees & Payment',
    content: 'Course fees must be paid as agreed at the time of enrollment. Fees are non-refundable once the course has commenced unless otherwise stated in writing. We accept payment via cash, bank transfer, UPI, and online payment gateways. EMI options are available for select courses — please inquire at the time of enrollment.',
  },
  {
    title: '4. Refund Policy',
    content: 'Refund requests made before the course commencement date (within 7 days of enrollment) will be considered on a case-by-case basis with a processing fee deduction. No refunds will be issued once the course has started. In the event that Coss Cloud Solutions cancels a course, a full refund or course transfer will be offered.',
  },
  {
    title: '5. Course Content & Curriculum',
    content: 'Coss Cloud Solutions reserves the right to modify course content, schedules, trainers, or delivery format (online/offline) as needed to maintain quality standards and align with industry requirements. Students will be notified of significant changes. The curriculum is updated regularly to reflect current industry practices.',
  },
  {
    title: '6. Attendance & Conduct',
    content: 'Students are expected to maintain a minimum attendance of 75% to be eligible for course completion certification. Students must conduct themselves professionally and respectfully toward trainers and fellow students. Disruptive behavior, use of abusive language, or any form of harassment will result in immediate termination of enrollment without refund.',
  },
  {
    title: '7. Intellectual Property',
    content: 'All course materials, study notes, recorded sessions, presentations, and content provided by Coss Cloud Solutions are proprietary and protected by intellectual property laws. Students may use these materials for personal learning only. Sharing, reproducing, distributing, or selling course materials in any form without written permission is strictly prohibited.',
  },
  {
    title: '8. Placement Assistance',
    content: 'Coss Cloud Solutions provides placement assistance as a value-added service. While we make every effort to connect students with hiring opportunities, we do not guarantee employment. Placement outcomes depend on individual performance, market conditions, and other factors beyond our control. Resume preparation, mock interviews, and referrals are provided as part of our placement support.',
  },
  {
    title: '9. Certification',
    content: 'Course completion certificates are issued only to students who meet the minimum attendance requirement and successfully complete assessments or projects as defined for each course. Certificates issued by Coss Cloud Solutions are training completion certificates and do not represent employment guarantees or formal academic qualifications.',
  },
  {
    title: '10. Online Training',
    content: 'For online courses, students are responsible for ensuring a stable internet connection and compatible device. Technical issues on the student\'s end do not qualify for refunds or class compensation. Recorded sessions will be made available for a limited period as defined at enrollment. Students must not share login credentials or session links with others.',
  },
  {
    title: '11. Privacy',
    content: 'Your personal information is collected and used in accordance with our Privacy Policy. By enrolling, you consent to the collection and use of your information as described in our Privacy Policy. We may use your testimonials or success stories for marketing purposes with your prior consent.',
  },
  {
    title: '12. Limitation of Liability',
    content: 'Coss Cloud Solutions shall not be liable for any indirect, incidental, special, or consequential damages arising out of or related to your use of our services. Our total liability in any matter related to the services shall not exceed the amount of fees paid by the student for the relevant course.',
  },
  {
    title: '13. Governing Law',
    content: 'These Terms and Conditions shall be governed by and construed in accordance with the laws of India. Any disputes arising from these terms shall be subject to the exclusive jurisdiction of the courts in Hyderabad, Telangana.',
  },
  {
    title: '14. Changes to Terms',
    content: 'Coss Cloud Solutions reserves the right to modify these Terms and Conditions at any time. Changes will be effective immediately upon posting on our website. Continued use of our services after changes constitutes your acceptance of the revised terms.',
  },
  {
    title: '15. Contact Information',
    content: 'For questions regarding these Terms and Conditions, please contact: Coss Cloud Solutions, Flat No. 109, C.B Eastern Homes, Srinagar Colony, Dilsukhnagar, Hyderabad – 500060. Email: info@cosscloudsol.com | Phone: +91 88851 66007',
  },
];

export default function TermsPage() {
  return (
    <>
      <ResponsivePageStyles />
      <PageBanner title="Terms & Conditions" breadcrumb={[{ label: 'Terms & Conditions', href: '/terms-conditions/' }]} />

      <div style={{ maxWidth: '860px', margin: '0 auto', padding: '56px 20px' }}>
        {/* Intro box */}
        <div style={{ background: '#fff3f0', borderRadius: '12px', padding: '18px 22px', marginBottom: '36px', borderLeft: '4px solid #e8401c' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', lineHeight: '1.7' }}>
            <strong style={{ color: '#e8401c' }}>Last Updated: January 2025.</strong> Please read these Terms and Conditions carefully before enrolling in any course or using the services of Coss Cloud Solutions. These terms constitute a legally binding agreement between you and Coss Cloud Solutions.
          </p>
        </div>

        {/* Sections */}
        {sections.map((s, i) => (
          <div key={s.title} style={{ marginBottom: '30px', paddingBottom: '28px', borderBottom: i < sections.length - 1 ? '1px solid #f0f0f0' : 'none' }}>
            <h2 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '17px', color: 'var(--text)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ background: '#e8401c', color: '#fff', width: '28px', height: '28px', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 800, flexShrink: 0 }}>{i + 1}</span>
              {s.title.replace(/^\d+\.\s/, '')}
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '14.5px', lineHeight: '1.85', paddingLeft: '38px' }}>{s.content}</p>
          </div>
        ))}

        {/* Agreement box */}
        <div style={{ background: 'linear-gradient(135deg, #1a1a2e, #0f3460)', borderRadius: '14px', padding: '28px', color: '#fff', textAlign: 'center', marginTop: '16px' }}>
          <h3 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '18px', marginBottom: '10px' }}>Have Questions?</h3>
          <p style={{ color: '#ccc', fontSize: '14px', marginBottom: '18px' }}>Our team is happy to clarify any of these terms before you enroll.</p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="tel:8885166007" style={{ background: '#e8401c', color: '#fff', padding: '11px 24px', borderRadius: '6px', fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '14px' }}>
              📞 Call Us
            </a>
            <a href="mailto:info@cosscloudsol.com" style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', padding: '11px 24px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.3)', fontFamily: 'Poppins, sans-serif', fontWeight: 600, fontSize: '14px' }}>
              ✉ Email Us
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
