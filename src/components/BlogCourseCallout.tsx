import Link from 'next/link'
import type { CalloutTarget } from '@/lib/blog-course-callout'

export default function BlogCourseCallout({ target }: { target: CalloutTarget }) {
  return (
    <div style={{ background: 'var(--bg-alt)', border: '1px solid var(--border)', borderRadius: '14px', padding: '24px', marginTop: '32px' }}>
      <p style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '12px', letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--primary)', marginBottom: '8px' }}>
        Recommended Course
      </p>
      <h3 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '17px', color: 'var(--text)', marginBottom: '6px' }}>
        {target.title}
      </h3>
      <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '14px', lineHeight: 1.6 }}>
        {target.description}
      </p>
      <Link href={target.href} style={{ display: 'inline-block', background: 'var(--primary)', color: '#fff', padding: '10px 22px', borderRadius: '6px', fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '13px' }}>
        View Course Details
      </Link>
    </div>
  )
}
