import Link from 'next/link';
import type { MenuData } from '@/lib/menu-data';
import { MenuCourseCard } from './menu-parts';
import DrawerCourseTabs from './DrawerCourseTabs';

/**
 * Mobile drawer course list: the same icons and cards as the desktop panel,
 * one column. Popular tab = the 12 popular courses; All tab = one card per
 * category, linking to its page. Server component, so every link is in the
 * HTML.
 */
export default function MobileMenuCourses({ data }: { data: MenuData }): JSX.Element {
  const categories = data.groups.flatMap((g) => g.categories);
  const popular = (
    <div className="mm-grid">
      {data.popular.map((p) => (
        <MenuCourseCard key={p.label} card={{ href: p.href, label: p.label, icon: p.icon, track: p.track, chips: p.chips, nextBatch: p.nextBatch }} />
      ))}
    </div>
  );
  const all = (
    <div className="flex flex-col gap-4">
      {data.groups.map((g) => (
        <div key={g.group}>
          <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.1em] text-[#4a5c61] dark:text-slate-400">{g.title}</p>
          <div className="mm-grid">
            {g.categories.map((c) => (
              <MenuCourseCard key={c.slug} card={{ href: `/courses/${c.slug}`, label: c.name, icon: c.icon, track: `${c.count} ${c.count === 1 ? 'course' : 'courses'}` }} />
            ))}
          </div>
        </div>
      ))}
      <Link href="/courses" className="flex min-h-[44px] items-center justify-center rounded-xl bg-[#eaf4f5] text-sm font-bold text-[#005663] dark:bg-slate-800 dark:text-[#5ef0c8]">
        Browse all courses
      </Link>
    </div>
  );
  return <DrawerCourseTabs popular={popular} all={all} popularCount={data.popular.length} allCount={categories.length} />;
}
