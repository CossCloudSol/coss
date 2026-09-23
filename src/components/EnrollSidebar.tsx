import Link from 'next/link';
import DemoSidebarForm from '@/components/DemoSidebarForm';
import CallLink from '@/components/CallLink';
import { COURSE_GROUPS } from '@/data/course-options';

/**
 * Demo-class form + contact card sidebar.
 *
 * Lives in its own module (not in shared.tsx) on purpose: App Router ships
 * every client component a server module imports, rendered or not. While this
 * sat in shared.tsx, every page importing PageBanner/HeroBanner from there
 * also downloaded DemoSidebarForm's zod + react-hook-form (~38 kB gzipped)
 * without rendering a form.
 */
export default function EnrollSidebar() {
  return (
    <div style={{ position: 'sticky', top: '80px' }}>
      <DemoSidebarForm courseGroups={COURSE_GROUPS} />

      <div style={{ background: 'var(--bg-alt)', borderRadius: '12px', padding: '20px', border: '1px solid var(--border)' }}>
        <h4 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '14px', color: 'var(--text)', marginBottom: '12px' }}>📞 Talk to Us</h4>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.9' }}>
          <CallLink number="+918885166007" style={{ color: 'var(--primary)', fontWeight: 600 }}>+91 88851 66007</CallLink><br />
          <CallLink number="+917780727374" style={{ color: 'var(--primary)', fontWeight: 600 }}>+91 77807 27374</CallLink><br />
          <a href="mailto:info@cosscloudsol.com" style={{ color: 'var(--text-muted)', fontSize: '12px' }}>info@cosscloudsol.com</a>
        </p>
        <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--border)' }}>
          <p style={{ fontSize: '12px', color: 'var(--text-light)', marginBottom: '8px' }}>📍 Dilsukhnagar &amp; Ameerpet, Hyderabad</p>
          <Link href="/contact-us/" style={{ fontSize: '13px', color: 'var(--primary)', fontWeight: 600 }}>Get Directions →</Link>
        </div>
      </div>
    </div>
  );
}
