import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { PageBanner, ResponsivePageStyles } from '@/components/shared';
import CallLink from '@/components/CallLink';
import { buildPageMetadata } from '@/lib/get-page-seo';

export const revalidate = 86400;
export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata('refund-cancellation-policy');
}

const bodyStyle = { color: 'var(--text-muted)', fontSize: '14.5px', lineHeight: '1.85', paddingLeft: '38px' };
const labelStyle = { color: 'var(--text)' };

type Section = { title: string; content: ReactNode };

const sections: Section[] = [
  {
    title: '1. Student Cancellation Before Course Commencement',
    content: (
      <>
        <p style={{ margin: '0 0 10px' }}>A student may submit a cancellation and refund request when both of the following conditions are met:</p>
        <ul style={{ margin: '0 0 12px', paddingLeft: '20px' }}>
          <li style={{ marginBottom: '6px' }}>The request is submitted within seven calendar days of enrolment</li>
          <li style={{ marginBottom: 0 }}>The request is received before the scheduled commencement of the course or batch</li>
        </ul>
        <p style={{ margin: '0 0 10px' }}>Eligible requests will be reviewed individually. If approved, the refund may be subject to deduction of the payment gateway and bank charges actually incurred on the original transaction, any non-recoverable third-party expenses already committed on the student&apos;s behalf, and a documented administrative charge. Any deduction will be stated to the student in writing before the refund is processed.</p>
        <p style={{ margin: 0 }}>Submitting a request does not automatically guarantee approval.</p>
      </>
    ),
  },
  {
    title: '2. Cancellation After Course Commencement',
    content: (
      <>
        <p style={{ margin: '0 0 10px' }}>Course fees are non-refundable once the course has commenced.</p>
        <p style={{ margin: '0 0 10px' }}>A course will be considered commenced when any one of the following has occurred:</p>
        <ul style={{ margin: '0 0 12px', paddingLeft: '20px' }}>
          <li style={{ marginBottom: '6px' }}>The first scheduled classroom or live online session has been conducted</li>
          <li style={{ marginBottom: '6px' }}>The student has attended or accessed a training session</li>
          <li style={{ marginBottom: '6px' }}>Learning portal, recorded class or digital course access has been activated</li>
          <li style={{ marginBottom: 0 }}>Course materials, software licences, lab credentials or study resources have been provided</li>
        </ul>
        <p style={{ margin: 0 }}>Refunds will not be provided for missed classes, irregular attendance, personal schedule changes, relocation, change of mind, employment changes or failure to complete the course.</p>
      </>
    ),
  },
  {
    title: '3. Registration and Third-Party Charges',
    content: (
      <>
        <p style={{ margin: '0 0 10px' }}>The following charges are non-refundable once they have been processed, activated or issued:</p>
        <ul style={{ margin: '0 0 12px', paddingLeft: '20px' }}>
          <li style={{ marginBottom: '6px' }}>Registration or admission charges separately identified at enrolment</li>
          <li style={{ marginBottom: '6px' }}>Examination and certification fees</li>
          <li style={{ marginBottom: '6px' }}>Exam vouchers</li>
          <li style={{ marginBottom: '6px' }}>Software, cloud-lab or platform licences</li>
          <li style={{ marginBottom: '6px' }}>Books, printed materials and learning kits</li>
          <li style={{ marginBottom: '6px' }}>Third-party subscription or service charges</li>
          <li style={{ marginBottom: 0 }}>Payment gateway, bank or EMI-processing charges</li>
        </ul>
        <p style={{ margin: 0 }}>Students will be informed wherever a course fee includes a non-refundable third-party component.</p>
      </>
    ),
  },
  {
    title: '4. Batch Cancellation by Coss Cloud Solutions',
    content: (
      <>
        <p style={{ margin: '0 0 10px' }}>If Coss Cloud Solutions cancels a course or batch and cannot provide a suitable alternative, the affected student may choose either:</p>
        <ul style={{ margin: '0 0 12px', paddingLeft: '20px' }}>
          <li style={{ marginBottom: '6px' }}>Transfer to another available batch or equivalent course</li>
          <li style={{ marginBottom: 0 }}>A full refund of the eligible course fee paid</li>
        </ul>
        <p style={{ margin: 0 }}>Approved refunds will be limited to the amount received by Coss Cloud Solutions. The institute will not be responsible for travel, accommodation, loss of income or other personal expenses incurred by the student.</p>
      </>
    ),
  },
  {
    title: '5. Batch Rescheduling and Trainer Changes',
    content: 'Coss Cloud Solutions may change a trainer, classroom, batch timing, course schedule or delivery method when reasonably necessary. Where a batch is rescheduled, students will be offered a suitable alternative batch. A minor scheduling change, trainer replacement or temporary interruption will not ordinarily qualify for a refund when the course continues to be delivered. If a material change prevents the student from attending and no reasonable alternative can be provided, the institute may offer a course transfer, credit adjustment or refund after reviewing the circumstances.',
  },
  {
    title: '6. Course or Batch Transfer',
    content: (
      <>
        <p style={{ margin: '0 0 10px' }}>Requests to change a batch, learning mode or course must be submitted before the original course commences.</p>
        <p style={{ margin: '0 0 10px' }}>Transfers are:</p>
        <ul style={{ margin: '0 0 12px', paddingLeft: '20px' }}>
          <li style={{ marginBottom: '6px' }}>Subject to seat and trainer availability</li>
          <li style={{ marginBottom: '6px' }}>Subject to any difference in course fees</li>
          <li style={{ marginBottom: '6px' }}>Normally permitted only once</li>
          <li style={{ marginBottom: 0 }}>Not transferable to another person without written approval</li>
        </ul>
        <p style={{ margin: 0 }}>Once training has commenced, transfer requests may be considered only in exceptional circumstances and remain subject to management approval.</p>
      </>
    ),
  },
  {
    title: '7. Medical and Exceptional Circumstances',
    content: 'In the event of a serious medical condition or genuine emergency, the student may submit supporting documents and request a batch deferment or course transfer. Such requests will be reviewed compassionately on a case-by-case basis. They do not create an automatic right to a cash refund.',
  },
  {
    title: '8. Duplicate or Excess Payments',
    content: 'If a student is charged more than once for the same transaction, the duplicate amount will be refunded after verification. For unsuccessful transactions where the amount has been debited, students should first check with their bank or payment provider. If Coss Cloud Solutions has received the amount, we will assist with verification and refund processing.',
  },
  {
    title: '9. How to Request a Cancellation or Refund',
    content: (
      <>
        <p style={{ margin: '0 0 6px' }}>Refund or cancellation requests must be submitted in writing to:</p>
        <p style={{ margin: '0 0 10px' }}>
          <strong style={labelStyle}>Email:</strong> info@cosscloudsol.com
          <br />
          <strong style={labelStyle}>Phone:</strong> +91 88851 66007
        </p>
        <p style={{ margin: '0 0 10px' }}>The request should include:</p>
        <ul style={{ margin: '0 0 12px', paddingLeft: '20px' }}>
          <li style={{ marginBottom: '6px' }}>Student&apos;s full name</li>
          <li style={{ marginBottom: '6px' }}>Registered mobile number and email address</li>
          <li style={{ marginBottom: '6px' }}>Course and batch name</li>
          <li style={{ marginBottom: '6px' }}>Enrolment and payment date</li>
          <li style={{ marginBottom: '6px' }}>Amount paid</li>
          <li style={{ marginBottom: '6px' }}>Transaction ID or receipt number</li>
          <li style={{ marginBottom: '6px' }}>Reason for cancellation</li>
          <li style={{ marginBottom: 0 }}>Supporting documents, where applicable</li>
        </ul>
        <p style={{ margin: 0 }}>Requests made only through verbal communication, trainers or social media may not be treated as formal refund requests.</p>
      </>
    ),
  },
  {
    title: '10. Refund Processing',
    content: (
      <>
        <p style={{ margin: '0 0 10px' }}>Once a request is received, Coss Cloud Solutions will verify the enrolment, attendance, access and payment records.</p>
        <p style={{ margin: '0 0 10px' }}>If the refund is approved:</p>
        <ul style={{ margin: '0 0 12px', paddingLeft: '20px' }}>
          <li style={{ marginBottom: '6px' }}>The student will be informed by email or registered contact number</li>
          <li style={{ marginBottom: '6px' }}>The refund will normally be initiated within 7–10 business days</li>
          <li style={{ marginBottom: '6px' }}>Payment will be returned through the original payment method wherever possible</li>
          <li style={{ marginBottom: 0 }}>Cash payments may be refunded through a verified bank account or another approved method</li>
        </ul>
        <p style={{ margin: 0 }}>The time taken for the amount to appear in the student&apos;s account may vary depending on the bank, UPI provider, card issuer or payment gateway.</p>
      </>
    ),
  },
  {
    title: '11. EMI and Instalment Payments',
    content: 'Cancellation of enrolment does not automatically cancel an EMI or financing arrangement. Where payment has been made through a third-party lender, card issuer or EMI provider, the student must also comply with that provider\'s cancellation and foreclosure terms. Interest, processing charges and other financing costs charged by third parties are not controlled or refundable by Coss Cloud Solutions.',
  },
  {
    title: '12. Disciplinary Termination',
    content: (
      <>
        <p style={{ margin: '0 0 10px' }}>No refund will be issued when a student&apos;s enrolment is suspended or terminated due to:</p>
        <ul style={{ margin: 0, paddingLeft: '20px' }}>
          <li style={{ marginBottom: '6px' }}>Abusive, threatening or disruptive behaviour</li>
          <li style={{ marginBottom: '6px' }}>Harassment of trainers, staff or other students</li>
          <li style={{ marginBottom: '6px' }}>Sharing login credentials or course access</li>
          <li style={{ marginBottom: '6px' }}>Unauthorised copying or distribution of course materials</li>
          <li style={{ marginBottom: '6px' }}>Fraudulent information or payment activity</li>
          <li style={{ marginBottom: 0 }}>Violation of the institute&apos;s Terms and Conditions</li>
        </ul>
      </>
    ),
  },
  {
    title: '13. Policy Changes',
    content: 'Coss Cloud Solutions may update this policy to reflect operational, legal or regulatory changes. The revised version will become effective when published on the website. Changes will not unfairly reduce a refund right that had already been confirmed in writing before the revised policy became effective.',
  },
  {
    title: '14. Applicable Terms and Law',
    content: 'This policy should be read together with the Coss Cloud Solutions Terms and Conditions and any course-specific written agreement provided at enrolment. Nothing in this policy limits any rights or remedies that cannot legally be excluded under applicable Indian law. Any dispute will be governed by the laws of India and subject to the jurisdiction stated in the Coss Cloud Solutions Terms and Conditions.',
  },
  {
    title: '15. Contact Us',
    content: 'For questions about cancellations, course transfers or refunds, please contact us before enrolling: Coss Cloud Solutions, Flat No. 109, Eastern Home, C.B, Srinagar Colony, Kamala Nagar, Dilsukhnagar, Hyderabad, Telangana 500060. Email: info@cosscloudsol.com | Phone: +91 88851 66007',
  },
];

export default function RefundCancellationPolicyPage() {
  return (
    <>
      <ResponsivePageStyles />
      <PageBanner title="Refund and Cancellation Policy" breadcrumb={[{ label: 'Refund and Cancellation Policy', href: '/refund-cancellation-policy' }]} />

      <div style={{ maxWidth: '860px', margin: '0 auto', padding: '56px 20px' }}>
        {/* Intro box */}
        <div style={{ background: '#fff3f0', borderRadius: '12px', padding: '18px 22px', marginBottom: '36px', borderLeft: '4px solid #e8401c' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', lineHeight: '1.7' }}>
            <strong style={{ color: '#e8401c' }}>Last Updated: September 2026.</strong> At Coss Cloud Solutions, we want every student to make an informed decision before enrolling. We encourage students to attend a free demo class, review the course curriculum, confirm the batch schedule and clarify all questions before making payment. This Refund and Cancellation Policy applies to classroom, online, hybrid, weekday, weekend and fast-track training programmes offered by Coss Cloud Solutions.
          </p>
        </div>

        {/* Sections */}
        {sections.map((s, i) => (
          <div key={s.title} style={{ marginBottom: '30px', paddingBottom: '28px', borderBottom: i < sections.length - 1 ? '1px solid #f0f0f0' : 'none' }}>
            <h2 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '17px', color: 'var(--text)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span aria-hidden="true" style={{ background: '#e8401c', color: '#fff', width: '28px', height: '28px', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 800, flexShrink: 0 }}>{i + 1}</span>{' '}
              {s.title.replace(/^\d+\.\s/, '')}
            </h2>
            {typeof s.content === 'string'
              ? <p style={bodyStyle}>{s.content}</p>
              : <div style={bodyStyle}>{s.content}</div>}
          </div>
        ))}

        {/* Agreement box */}
        <div style={{ background: 'linear-gradient(135deg, #1a1a2e, #0f3460)', borderRadius: '14px', padding: '28px', color: '#fff', textAlign: 'center', marginTop: '16px' }}>
          <h3 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '18px', marginBottom: '10px' }}>Have Questions?</h3>
          <p style={{ color: '#ccc', fontSize: '14px', marginBottom: '18px' }}>Our team is happy to clarify any of these terms before you enroll.</p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <CallLink number="+918885166007" pageType="static" style={{ background: '#e8401c', color: '#fff', padding: '11px 24px', borderRadius: '6px', fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '14px' }}>
              📞 Call Us
            </CallLink>
            <a href="mailto:info@cosscloudsol.com" style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', padding: '11px 24px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.3)', fontFamily: 'Poppins, sans-serif', fontWeight: 600, fontSize: '14px' }}>
              ✉ Email Us
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
