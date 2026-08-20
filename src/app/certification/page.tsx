import type { Metadata } from 'next';
import Link from 'next/link';
import { HeroBanner, CtaBanner, ResponsivePageStyles } from '@/components/shared';

import { buildPageMetadata } from '@/lib/get-page-seo';

export const revalidate = 3600;
export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata('certification');
}

const certs = [
  { name: 'AWS Certified Solutions Architect', vendor: 'Amazon Web Services', level: 'Associate / Professional', icon: '☁️', color: '#f59e0b' },
  { name: 'Microsoft Azure Fundamentals (AZ-900)', vendor: 'Microsoft', level: 'Beginner', icon: '🔷', color: '#0078d4' },
  { name: 'Microsoft Azure Administrator (AZ-104)', vendor: 'Microsoft', level: 'Associate', icon: '🔷', color: '#0078d4' },
  { name: 'Azure Data Engineer (DP-203)', vendor: 'Microsoft', level: 'Associate', icon: '📊', color: '#0078d4' },
  { name: 'Google Associate Cloud Engineer', vendor: 'Google Cloud', level: 'Associate', icon: '🌐', color: '#4285f4' },
  { name: 'Certified Ethical Hacker (CEH)', vendor: 'EC-Council', level: 'Advanced', icon: '🔒', color: '#e47538' },
  { name: 'Salesforce Certified Administrator', vendor: 'Salesforce', level: 'Associate', icon: '🏢', color: '#00a1e0' },
  { name: 'Certified Kubernetes Administrator (CKA)', vendor: 'CNCF', level: 'Advanced', icon: '⚙️', color: '#326ce5' },
  { name: 'CompTIA Security+', vendor: 'CompTIA', level: 'Intermediate', icon: '🛡️', color: '#c8102e' },
  { name: 'AWS Certified DevOps Engineer', vendor: 'Amazon Web Services', level: 'Professional', icon: '⚙️', color: '#f59e0b' },
  { name: 'Terraform Associate', vendor: 'HashiCorp', level: 'Associate', icon: '🔧', color: '#7b42bc' },
  { name: 'Power BI Data Analyst (PL-300)', vendor: 'Microsoft', level: 'Associate', icon: '📈', color: '#f2c811' },
];

export default function CertificationPage() {
  return (
    <>
      <ResponsivePageStyles />
      <HeroBanner
        badge="GLOBALLY RECOGNISED CERTIFICATIONS"
        titlePre="Crack Your "
        accentText="IT Certification"
        titleLine2="on the First Attempt"
        subtitle="Structured preparation for AWS, Azure, Google Cloud, Salesforce & 12+ more certifications — mock exams, study guides & expert mentoring included."
        stats={[
          { value: '12+',    label: 'CERTIFICATIONS' },
          { value: '95%',    label: 'PASS RATE' },
          { value: '5,000+', label: 'STUDENTS TRAINED' },
        ]}
        ctaText="Exam voucher guidance included · Speak to a counsellor today"
        breadcrumb={[{ label: 'Certification', href: '/certification/' }]}
      />

      <div style={{ background: 'var(--bg-alt)', padding: '48px 20px' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
          <div style={{ display: 'inline-block', background: 'rgba(232,64,28,0.1)', color: '#e8401c', fontSize: '12px', fontWeight: 600, fontFamily: 'Poppins, sans-serif', textTransform: 'uppercase', letterSpacing: '1px', padding: '4px 14px', borderRadius: '20px', marginBottom: '12px' }}>Globally Recognized</div>
          <h2 style={{ fontFamily: 'Poppins, sans-serif', fontSize: 'clamp(22px,4vw,32px)', fontWeight: 700, color: 'var(--text)', marginBottom: '12px' }}>Industry Certification Preparation</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '15px', lineHeight: '1.75' }}>
            Our training programs are aligned with the latest exam objectives of globally recognized certifications. Get certified in your domain and fast-track your IT career with credentials that top companies demand.
          </p>
        </div>
      </div>

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '56px 20px' }}>
        <div className="corp-feat-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
          {certs.map(c => (
            <div key={c.name} style={{ background: 'var(--bg-card)', borderRadius: '12px', padding: '22px', boxShadow: '0 2px 14px rgba(0,0,0,0.08)', border: '1px solid var(--border-card)', borderTop: `4px solid ${c.color}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                <span style={{ fontSize: '26px' }}>{c.icon}</span>
                <div>
                  <span style={{ background: 'var(--bg-alt)', color: 'var(--text-muted)', fontSize: '11px', padding: '2px 8px', borderRadius: '10px', fontFamily: 'Poppins, sans-serif', fontWeight: 500 }}>{c.vendor}</span>
                </div>
              </div>
              <h4 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '14px', color: 'var(--text)', marginBottom: '8px', lineHeight: '1.35' }}>{c.name}</h4>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-light)' }}>Level: {c.level}</span>
                <Link href="/enroll-now-with-coss/" style={{ color: '#e8401c', fontSize: '12px', fontFamily: 'Poppins, sans-serif', fontWeight: 700 }}>Enroll →</Link>
              </div>
            </div>
          ))}
        </div>
        <CtaBanner />
      </div>
    </>
  );
}
