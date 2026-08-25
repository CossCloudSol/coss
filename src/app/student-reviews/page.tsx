import type { Metadata } from 'next';
import { HeroBanner, CtaBanner, ResponsivePageStyles } from '@/components/shared';
import { buildPageMetadata } from '@/lib/get-page-seo';
import { GBP_SAME_AS } from '@/lib/get-branch-settings';

export const revalidate = 86400;
export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata('student-reviews');
}

export default function StudentReviewsPage() {
  return (
    <>
      <ResponsivePageStyles />
      <HeroBanner
        badge="STUDENT REVIEWS"
        titlePre=""
        accentText="Our Reviews"
        titleLine2="Live on Google"
        subtitle="We don't publish reviews on this page. Read what our students say directly on our Dilsukhnagar and Ameerpet Google Business Profile listings."
        stats={[
          { value: '5,000+', label: 'STUDENTS TRAINED' },
        ]}
        ctaText="Join 5,000+ students who trained with us"
        breadcrumb={[{ label: 'About Us', href: '/about-us/' }, { label: 'Student Reviews', href: '/student-reviews/' }]}
      />

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '48px 20px 0', textAlign: 'center' }}>
        <div style={{ display: 'inline-block', background: 'var(--primary-light)', color: 'var(--primary)', fontSize: '12px', fontWeight: 600, fontFamily: 'Poppins, sans-serif', textTransform: 'uppercase', letterSpacing: '1px', padding: '4px 14px', borderRadius: '20px', marginBottom: '12px' }}>Where to find them</div>
        <h2 style={{ fontFamily: 'Poppins, sans-serif', fontSize: 'clamp(20px,3.5vw,28px)', fontWeight: 700, color: 'var(--text)', marginBottom: '14px' }}>Our Reviews Live on Google</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '15px', lineHeight: '1.8', maxWidth: '620px', margin: '0 auto 32px' }}>
          Every review for Coss Cloud Solutions is posted by students directly on Google, tied to their own Google account — we don&apos;t write, edit, or select which ones appear. Read them on either centre&apos;s listing below.
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'center', marginBottom: '8px' }}>
          <a href={GBP_SAME_AS.dilsukhnagar} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'var(--bg-card)', border: '2px solid var(--primary)', color: 'var(--primary)', padding: '14px 28px', borderRadius: '8px', fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '14px' }}>
            📍 Dilsukhnagar Centre Reviews
          </a>
          <a href={GBP_SAME_AS.ameerpet} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'var(--bg-card)', border: '2px solid var(--primary)', color: 'var(--primary)', padding: '14px 28px', borderRadius: '8px', fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '14px' }}>
            📍 Ameerpet Centre Reviews
          </a>
        </div>
      </div>

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '40px 20px 0' }}>
        <CtaBanner />
      </div>
      <div style={{ height: '48px' }} />
    </>
  );
}
