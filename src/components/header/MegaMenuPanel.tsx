import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, CalendarCheck, MessageCircle } from 'lucide-react';
import { formatNextBatch, type SearchIndex } from '@/lib/course-search';
import { squareBannerPath } from '@/lib/course-banner';

/** Courses listed per category before "All N … courses". */
const COURSES_PER_CATEGORY = 8;

/**
 * Explore Courses mega-menu content. A server component: every category and
 * course link is in the server HTML (crawlable) whether or not the menu is
 * open. The header's client code only toggles it and sets data-active; the
 * matching course list is shown by the CSS rules generated below.
 */
export default function MegaMenuPanel({ index }: { index: SearchIndex }): JSX.Element {
  const categories = index.categories;
  const first = categories[0]?.slug ?? '';
  // Slugs are DB values: only plain slugs go into CSS.
  const rules = categories
    .filter((c) => /^[a-z0-9-]+$/.test(c.slug))
    .map(
      (c) =>
        `[data-mega][data-active="${c.slug}"] [data-mega-list="${c.slug}"]{display:block}` +
        `[data-mega][data-active="${c.slug}"] [data-mega-cat="${c.slug}"]{background:#e6f0f1;color:#005663;font-weight:700}` +
        `[data-mega][data-active="${c.slug}"] [data-mega-cat="${c.slug}"] small{color:#005663}`,
    )
    .join('');

  return (
    // Height: at most the viewport below the header (38px strip + 76px row at
    // rest, plus a margin); each column scrolls on its own.
    <div data-mega="" data-active={first} className="grid h-[min(680px,calc(100vh-130px))] grid-cols-[260px_minmax(0,1fr)_260px] gap-0">
      {/* dangerouslySetInnerHTML, not a text child: React escapes quotes in <style>
          text on the server (&quot;), which broke these selectors and made every
          page fail hydration (React #425/#418/#423), which also wiped the theme class. */}
      <style dangerouslySetInnerHTML={{ __html: rules }} />
      <ul aria-label="Course categories" className="min-h-0 overflow-y-auto overscroll-contain border-r border-[#e3eaec] p-3 dark:border-slate-700">
        {categories.map((c) => (
          <li key={c.slug}>
            <Link href={`/courses/${c.slug}`} data-mega-cat={c.slug} className="mm-cat">
              {c.name}
              <small>{c.count} ›</small>
            </Link>
          </li>
        ))}
      </ul>

      <div className="min-h-0 overflow-y-auto overscroll-contain p-5">
        {categories.map((c) => {
          const courses = index.courses.filter((x) => x.categorySlug === c.slug);
          return (
            <div key={c.slug} data-mega-list={c.slug}>
              <p className="mb-3 text-xs font-bold uppercase tracking-[1.2px] text-[#5f7075] dark:text-slate-400">
                {c.name} · {c.count} {c.count === 1 ? 'course' : 'courses'}
              </p>
              <ul className="grid grid-cols-2 gap-x-4 gap-y-1">
                {courses.slice(0, COURSES_PER_CATEGORY).map((course) => {
                  const date = formatNextBatch(course.nextBatch);
                  return (
                    <li key={course.id}>
                      <Link href={course.url} className="mm-course">
                        {/* Lazy: only the shown category's thumbnails ever load. */}
                        {(course.thumbnail || course.banner) && (
                          <Image src={course.thumbnail ?? squareBannerPath(course.banner as string)} alt="" width={40} height={40} sizes="40px" />
                        )}
                        <span>
                          <b>{course.title}</b>
                          <small>{[course.duration, date ? `Next batch ${date}` : null].filter(Boolean).join(' · ')}</small>
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
              <Link href={`/courses/${c.slug}`} className="mt-3 inline-flex items-center gap-1 px-3 text-sm font-bold text-[#b8531c] hover:text-[#8f3f14] dark:text-[#f3a57a]">
                All {c.name} courses <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          );
        })}
      </div>

      <div className="flex min-h-0 flex-col gap-3 overflow-y-auto overscroll-contain border-l border-[#e3eaec] bg-[#f4f7f8] p-5 dark:border-slate-700 dark:bg-slate-800">
        <div className="flex flex-col gap-2.5 rounded-2xl bg-[#005663] p-5 text-white">
          <MessageCircle className="h-6 w-6" aria-hidden="true" />
          <p className="font-heading text-lg font-extrabold">Free career counselling</p>
          <p className="text-sm leading-relaxed text-white/85">Not sure which course fits? A counsellor matches it to your background and goal.</p>
          <Link href="/free-demo-class" className="mt-1 flex h-11 items-center justify-center gap-2 rounded-[10px] bg-[#b8531c] text-sm font-bold text-white hover:bg-[#8f3f14]">
            <CalendarCheck className="h-4 w-4" aria-hidden="true" />
            Book Free Demo
          </Link>
        </div>
        <Link href="/courses" className="flex min-h-[44px] items-center gap-1 px-1 text-sm font-bold text-[#005663] hover:text-[#0a3d4a] dark:text-[#5ef0c8]">
          Browse all {index.courses.length} courses <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}
