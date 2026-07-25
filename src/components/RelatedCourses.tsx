import Link from 'next/link'
import { getCourseUrl } from '@/lib/course-url'
import type { RelatedCourseItem } from '@/lib/related-courses'

export default function RelatedCourses({ related }: { related: RelatedCourseItem[] }) {
  if (related.length === 0) return null
  return (
    <div style={{ background: 'var(--bg-card)', borderRadius: '14px', padding: '28px', border: '1px solid var(--border-card)' }}>
      <h2 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '18px', color: 'var(--text)', marginBottom: '16px' }}>Related Courses</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '14px' }}>
        {related.map((r) => (
          <Link key={r.id} href={getCourseUrl(r)} style={{ display: 'block', background: 'var(--bg-alt)', border: '1px solid var(--border)', borderRadius: '10px', padding: '14px', textDecoration: 'none' }}>
            <p style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 600, fontSize: '13px', color: 'var(--text)', marginBottom: '4px' }}>{r.title}</p>
            <p style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{r.duration}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
