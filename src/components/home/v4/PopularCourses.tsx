import Link from 'next/link';
import { formatNextBatch, type CatalogCourse } from '@/lib/course-search';
import { POPULAR_GROUPS, bannerStyle, courseLook, groupKeyOf, ICON } from '@/lib/home-v4';

/**
 * Popular courses (Design v4): category tabs, then course cards with a dot-grid banner, tag chips,
 * duration / next batch / mode, and Book free demo + Syllabus. The tabs are radio inputs that the
 * `.home-tabs` rules in globals.css filter with :has(), so there is no client JavaScript here.
 * "All" shows the first six (design); a category tab shows that category's popular courses.
 */
export default function PopularCourses({ courses, totalCourses }: { courses: CatalogCourse[]; totalCourses: number }) {
  if (courses.length === 0) return null;
  const groupsPresent = POPULAR_GROUPS.filter((g) => courses.some((c) => groupKeyOf(c.categorySlug) === g.key));
  return (
    <section id="courses" aria-labelledby="popular-title" className="home-tabs mx-auto max-w-[1280px] px-4 pb-6 pt-10 lg:px-8 lg:pb-6 lg:pt-[88px]">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-sans text-xs font-bold uppercase tracking-[0.1em] text-[#b8531c] lg:text-[13px] dark:text-[#f3a57a]">Popular courses</p>
          <h2 id="popular-title" className="mt-1.5 font-heading text-[27px] font-extrabold leading-[1.15] text-[#0a3d4a] lg:mt-2 lg:text-[42px] dark:text-white">
            Where most students start
          </h2>
        </div>
        <Link
          href="/courses"
          data-cta="all_courses"
          data-loc="popular_courses"
          className="light-surface hidden min-h-12 items-center justify-center rounded-xl border-[1.5px] border-[#cfdadd] bg-white px-[22px] font-sans text-[15px] font-bold text-[#005663] hover:border-[#005663] lg:inline-flex"
        >
          Browse all courses →
        </Link>
      </div>

      {groupsPresent.length > 0 && (
        <div role="radiogroup" aria-label="Course categories" className="-mx-4 mt-4 flex gap-2 overflow-x-auto px-4 pb-1 lg:mx-0 lg:mt-[26px] lg:flex-wrap lg:overflow-visible lg:px-0 lg:pb-0">
          {[{ key: 'all', label: 'All' }, ...groupsPresent].map((g, i) => (
            <label key={g.key} className="cursor-pointer">
              <input type="radio" name="pop-cat" value={g.key} defaultChecked={i === 0} className="peer sr-only" />
              <span className="light-surface flex min-h-11 items-center whitespace-nowrap rounded-full border border-[#cfdadd] bg-white px-4 font-sans text-sm font-medium text-[#26383d] peer-checked:border-[#005663] peer-checked:bg-[#005663] peer-checked:font-bold peer-checked:text-white peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[#005663] lg:px-[18px] lg:text-[15px]">
                {g.label}
              </span>
            </label>
          ))}
        </div>
      )}

      <div className="mt-3.5 flex flex-col gap-4 lg:mt-[26px] lg:grid lg:grid-cols-[repeat(auto-fill,minmax(360px,1fr))] lg:gap-[22px]">
        {courses.map((c, i) => {
          const look = courseLook(c.categorySlug);
          const date = formatNextBatch(c.nextBatch);
          const tags = c.keywords.slice(0, 3);
          const group = groupKeyOf(c.categorySlug);
          const external = /^https?:\/\//.test(c.syllabusHref);
          return (
            <article
              key={c.id}
              data-group={group}
              data-late={i >= 6 ? '' : undefined}
              data-mobile-late={i >= 3 ? '' : undefined}
              className="light-surface flex flex-col overflow-hidden rounded-[20px] border border-[#e3eaec] bg-white shadow-[0_16px_34px_-28px_rgba(10,61,74,0.7)] lg:rounded-[22px] lg:shadow-[0_18px_40px_-32px_rgba(10,61,74,0.7)]"
            >
              <div className="relative h-24 lg:h-32" style={bannerStyle(look.ink, 14)}>
                <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.16)" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" className="absolute -right-3.5 -top-3 h-[110px] w-[110px] lg:-right-[18px] lg:-top-3.5 lg:h-[150px] lg:w-[150px]">
                  <path d={look.path} />
                </svg>
                <span className="absolute left-4 top-3.5 font-sans text-[11px] font-bold uppercase tracking-[0.08em] text-white lg:left-5 lg:top-[18px] lg:text-xs">{c.category}</span>
                <span className="absolute right-[18px] top-3.5 hidden rounded-full bg-white/[0.92] px-2.5 py-[5px] font-sans text-xs font-bold text-[#8f3f14] lg:block">Popular</span>
                <span aria-hidden="true" className="absolute -bottom-6 left-4 flex h-[52px] w-[52px] items-center justify-center rounded-2xl bg-white shadow-[0_10px_20px_-10px_rgba(5,30,36,0.5)] lg:-bottom-7 lg:left-5 lg:h-[60px] lg:w-[60px] lg:rounded-[18px] lg:shadow-[0_12px_24px_-10px_rgba(5,30,36,0.45)]" style={{ color: look.ink }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d={look.path} />
                  </svg>
                </span>
              </div>
              <div className="flex flex-1 flex-col gap-2.5 px-4 pb-4 pt-8 lg:gap-3 lg:px-[22px] lg:pb-[22px] lg:pt-[38px]">
                <h3 className="font-heading text-xl font-extrabold leading-tight text-[#0a3d4a] lg:text-[22px]">
                  <Link href={c.url} className="hover:text-[#b8531c]">
                    {c.title}
                  </Link>
                </h3>
                {tags.length > 0 && (
                  <ul className="flex flex-wrap gap-1.5 font-sans">
                    {tags.map((t) => (
                      <li key={t} className="rounded-full px-[9px] py-[5px] text-[12.5px] font-semibold capitalize lg:px-2.5 lg:text-[13px]" style={{ background: look.tint, color: look.ink }}>
                        {t}
                      </li>
                    ))}
                  </ul>
                )}
                <p className="mt-auto flex flex-wrap gap-x-[18px] gap-y-2 border-t border-[#eef2f3] pt-3 font-sans text-[13.5px] text-[#26383d] lg:text-sm">
                  {c.duration && (
                    <span className="inline-flex items-center gap-1.5">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#005663" strokeWidth="2" aria-hidden="true"><path d={ICON.clock} /></svg>
                      {c.duration}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1.5">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#005663" strokeWidth="2" aria-hidden="true"><path d={ICON.cal} /></svg>
                    {date ? `Next: ${date}` : 'Ask for dates'}
                  </span>
                  <span className="hidden items-center gap-1.5 lg:inline-flex">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#005663" strokeWidth="2" aria-hidden="true"><path d={ICON.monitor} /></svg>
                    {c.mode || 'Classroom + Online'}
                  </span>
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <a
                    href="#enroll-form"
                    data-cta="book_demo"
                    data-loc="popular_courses"
                    data-prefill={c.title}
                    className="inline-flex min-h-12 items-center justify-center rounded-xl bg-[#b8531c] px-2 font-sans text-[15px] font-bold text-white shadow-[0_8px_20px_-10px_rgba(184,83,28,0.8)] hover:bg-[#8f3f14] lg:px-2.5"
                  >
                    <span className="lg:hidden">Free demo</span>
                    <span className="hidden lg:inline">Book free demo</span>
                  </a>
                  <a
                    href={c.syllabusHref}
                    {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                    data-cta="get_syllabus"
                    data-loc="popular_courses"
                    className="inline-flex min-h-12 items-center justify-center rounded-xl border-[1.5px] border-[#cfdadd] bg-white px-2 font-sans text-[15px] font-bold text-[#005663] hover:border-[#005663] lg:px-2.5"
                  >
                    <span className="lg:hidden">Syllabus</span>
                    <span className="hidden lg:inline">View syllabus</span>
                  </a>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      <Link
        href="/courses"
        data-cta="all_courses"
        data-loc="popular_courses"
        className="light-surface mt-4 flex min-h-12 w-full items-center justify-center rounded-xl border-[1.5px] border-[#cfdadd] bg-white font-sans text-[15px] font-bold text-[#005663] lg:hidden"
      >
        See all {totalCourses > 0 ? `${totalCourses} ` : ''}courses
      </Link>
    </section>
  );
}
