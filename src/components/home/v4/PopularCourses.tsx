import Link from 'next/link';
import CourseTile from '@/components/courses/CourseTile';
import type { CatalogCourse } from '@/lib/course-search';
import SectionHead, { CONTAINER, SECTION_PAD, TONE } from '@/components/home/v4/SectionHead';

/**
 * Popular courses: the 12 courses of the Popular list, in order, on the same course card the site
 * used before (CourseTile). 4 columns from 1280px, 3 from 768px; on phones one column with the
 * first four and a "Show all" button (a checkbox + CSS, no JavaScript). Cards in a row share a height.
 */
export default function PopularCourses({ courses, totalCourses }: { courses: CatalogCourse[]; totalCourses: number }) {
  if (courses.length === 0) return null;
  return (
    <section id="courses" aria-labelledby="popular-title" className={`${TONE.white} ${SECTION_PAD}`}>
      <div className={CONTAINER}>
        <SectionHead
          id="popular-title"
          eyebrow="Popular courses"
          title="Where most students start"
          sub="Trainer-led courses with hands-on labs, in class or live online."
          action={
            <Link
              href="/courses"
              data-cta="all_courses"
              data-loc="popular_courses"
              className="hidden min-h-12 items-center text-[15px] font-bold text-[#b8531c] hover:text-[#8f3f14] md:inline-flex dark:text-[#f3a57a]"
            >
              View all {totalCourses > 0 ? `${totalCourses} ` : ''}courses →
            </Link>
          }
        />

        <input id="pop-more" type="checkbox" className="pop-more peer sr-only" aria-label="Show all courses" />
        <div className="pop-grid mt-8 grid grid-cols-1 gap-5 md:grid-cols-3 md:gap-6 xl:grid-cols-4">
          {courses.map((c, i) => (
            <div key={c.id} className={`${i >= 4 ? 'pop-late' : 'flex'} min-w-0 flex-col [&>article]:flex-1`}>
              <CourseTile course={c} index={i} layout="fill" location="popular_courses" demoHref="#enroll-form" prefillCourse />
            </div>
          ))}
        </div>
        <label
          htmlFor="pop-more"
          className="pop-btn mt-5 flex min-h-12 w-full cursor-pointer items-center justify-center rounded-xl border-[1.5px] border-[#cfdadd] bg-white font-sans text-[15px] font-bold text-[#005663] peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[#005663] md:hidden"
        >
          Show all {courses.length} courses
        </label>
        <Link
          href="/courses"
          data-cta="all_courses"
          data-loc="popular_courses"
          className="mt-3 flex min-h-12 w-full items-center justify-center font-sans text-[15px] font-bold text-[#005663] md:hidden dark:text-[#5ef0c8]"
        >
          Browse all {totalCourses > 0 ? `${totalCourses} ` : ''}courses →
        </Link>
      </div>
    </section>
  );
}
