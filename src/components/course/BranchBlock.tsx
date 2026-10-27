import Link from 'next/link';
import { getAllBranchSettings } from '@/lib/get-branch-settings';
import { getBranchHours } from '@/lib/branch-hours';

/* -------------------------------------------------------------------------- */
/*  "Train at our Dilsukhnagar or Ameerpet branch" block for course pages.    */
/*  Links every course page to both /locations pages (the Ameerpet page       */
/*  ranks far below Dilsukhnagar and gets almost no internal links), with     */
/*  each centre's area and opening hours from BranchSettings, plus a tagged   */
/*  demo CTA. Server-rendered: the links are plain tagged anchors counted by  */
/*  the site-wide click listener (lib/intent-listener), so no client JS.      */
/* -------------------------------------------------------------------------- */

export const BRANCH_BLOCK_LOCATION = 'course_branch_block';

const FONT = 'var(--font-poppins), Poppins, sans-serif';

export interface BranchBlockProps {
  courseTitle: string;
  courseSlug: string;
}

export default async function BranchBlock({ courseTitle, courseSlug }: BranchBlockProps): Promise<JSX.Element> {
  const branches = await getAllBranchSettings();
  const withHours = await Promise.all(
    branches.map(async (b) => ({ branch: b, hours: await getBranchHours(b).catch(() => null) })),
  );

  return (
    <section
      data-section={BRANCH_BLOCK_LOCATION}
      aria-labelledby="branch-block-title"
      style={{ background: 'var(--bg-card)', borderRadius: '14px', padding: '28px', border: '1px solid var(--border-card)', marginBottom: '24px' }}
    >
      <h2 id="branch-block-title" style={{ fontFamily: FONT, fontWeight: 700, fontSize: '18px', color: 'var(--text)', marginBottom: '6px' }}>
        Train at our Dilsukhnagar or Ameerpet branch
      </h2>
      <p style={{ color: 'var(--text-muted)', fontSize: '14px', lineHeight: 1.7, margin: '0 0 16px' }}>
        {courseTitle} runs in classrooms at both centres and live online. Pick the branch nearest to you.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', marginBottom: '16px' }}>
        {withHours.map(({ branch, hours }) => {
          const area = branch.branchKey === 'ameerpet' ? 'Ameerpet' : 'Dilsukhnagar';
          const firstGroup = hours?.groups[0];
          return (
            <div key={branch.branchKey} style={{ border: '1px solid var(--border)', borderRadius: '12px', padding: '16px', background: 'var(--surface)' }}>
              <p style={{ fontFamily: FONT, fontWeight: 700, fontSize: '15px', color: 'var(--text)', margin: '0 0 4px' }}>{area} branch</p>
              <p style={{ color: 'var(--text-muted)', fontSize: '13px', lineHeight: 1.6, margin: '0 0 4px' }}>
                {[branch.addressLine2, branch.city].filter(Boolean).join(', ')}
              </p>
              {firstGroup && (
                <p style={{ color: 'var(--text-muted)', fontSize: '13px', lineHeight: 1.6, margin: '0 0 10px' }}>
                  {firstGroup.days}: {firstGroup.time}
                </p>
              )}
              <Link
                href={`/locations/${branch.branchKey}`}
                data-cta={`branch_${branch.branchKey}`}
                data-loc={BRANCH_BLOCK_LOCATION}
                data-kind="other"
                data-course={courseSlug}
                className="text-[#8f3f14] dark:text-[#f3a57a]"
                style={{ fontFamily: FONT, fontWeight: 700, fontSize: '14px', textDecoration: 'underline', display: 'inline-flex', minHeight: '44px', alignItems: 'center' }}
              >
                {area} branch: timings &amp; directions
              </Link>
            </div>
          );
        })}
      </div>
      <a
        href={`/free-demo-class?course=${courseSlug}`}
        data-cta="book_demo"
        data-loc={BRANCH_BLOCK_LOCATION}
        data-kind="demo"
        data-course={courseSlug}
        style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minHeight: '44px', padding: '0 18px', borderRadius: '999px', background: '#b8531c', color: '#fff', fontFamily: FONT, fontWeight: 700, fontSize: '14px', textDecoration: 'none' }}
      >
        Book a free demo at your nearest branch
      </a>
    </section>
  );
}
