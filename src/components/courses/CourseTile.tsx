import Image from 'next/image';
import Link from 'next/link';
import { BarChart3, CalendarCheck, CalendarDays, Clock, FileText, Monitor } from 'lucide-react';
import TrackedCta from '@/components/home/TrackedCta';
import { formatNextBatch, type CatalogCourse } from '@/lib/course-search';
import { BANNER_SQUARE, BANNER_WIDE, squareBannerPath } from '@/lib/course-banner';

/** Brand fills for course banners without an image. */
export const BANNER_FILLS = ['#0a3d4a', '#1f3a44', '#123f55', '#5a3a26', '#005663', '#26383d'] as const;

interface Props {
  course: CatalogCourse;
  /** Position in the list, for the banner fill. */
  index: number;
  /**
   * carousel: the homepage's swipe row (a vertical card at every width).
   * grid: /courses (a compact row on phones, a vertical card from md up).
   */
  layout: 'carousel' | 'grid';
  /** GA4 cta_click location. */
  location: string;
  /** "Book demo" target; with prefill, the homepage hero form gets the course. */
  demoHref: string;
  prefillCourse?: boolean;
  /** First row above the fold: load eagerly with high priority. */
  priority?: boolean;
}

/**
 * Course card from the approved mockup: image banner (Cloudinary thumbnail
 * or a coded brand banner) with category chip and tag, duration / mode /
 * level, next batch, then Book demo and Syllabus.
 */
export default function CourseTile({ course: c, index, layout, location, demoHref, prefillCourse = false, priority = false }: Props): JSX.Element {
  const grid = layout === 'grid';
  const date = formatNextBatch(c.nextBatch);
  const fill = BANNER_FILLS[index % BANNER_FILLS.length];

  return (
    <article
      className={`flex flex-col overflow-hidden rounded-2xl border border-[#e3eaec] bg-white shadow-[0_2px_8px_rgba(10,61,74,0.06)] dark:border-slate-700 dark:bg-slate-900 ${
        grid ? 'rounded-[14px] md:rounded-2xl' : 'w-[300px] shrink-0 snap-start md:w-auto'
      }`}
    >
      <div className={grid ? 'flex gap-3 p-3 md:block md:p-0' : ''}>
        <Link
          href={c.url}
          tabIndex={-1}
          aria-hidden="true"
          className={`relative block shrink-0 overflow-hidden ${grid ? 'h-[88px] w-[88px] rounded-[10px] md:h-[150px] md:w-full md:rounded-none' : 'h-40 md:h-[190px]'}`}
          style={{ background: fill }}
        >
          {c.thumbnail ? (
            <Image
              src={c.thumbnail}
              alt={`${c.title} course`}
              fill
              priority={priority}
              sizes={grid ? '(min-width: 1024px) 300px, (min-width: 768px) 50vw, 88px' : '(min-width: 1024px) 384px, (min-width: 768px) 50vw, 300px'}
              className="object-cover"
            />
          ) : c.banner ? (
            <>
              {/* Generated, category-branded banner (admin thumbnail wins when set). */}
              <Image
                src={c.banner}
                alt={`${c.title}: ${c.category} course banner`}
                width={BANNER_WIDE.width}
                height={BANNER_WIDE.height}
                priority={priority}
                sizes={grid ? '(min-width: 1024px) 300px, 50vw' : '(min-width: 1024px) 384px, (min-width: 768px) 50vw, 300px'}
                className={`h-full w-full object-cover ${grid ? 'hidden md:block' : ''}`}
              />
              {grid && (
                <Image
                  src={squareBannerPath(c.banner)}
                  alt={`${c.title}: ${c.category} course banner`}
                  width={BANNER_SQUARE.width}
                  height={BANNER_SQUARE.height}
                  priority={priority}
                  sizes="88px"
                  className="h-full w-full object-cover md:hidden"
                />
              )}
            </>
          ) : (
            <span className={`absolute inset-0 flex items-center justify-center px-5 text-center font-heading font-extrabold leading-tight text-white/90 ${grid ? 'hidden text-xl md:flex' : 'text-2xl'}`}>
              {c.title}
            </span>
          )}
          {/* The generated banner has its own category chip and COSS mark. */}
          {!c.banner && (
            <span className={`absolute left-3 top-3 max-w-[70%] truncate rounded-full bg-white/[0.92] px-2.5 py-1 text-[11px] font-bold text-[#0a3d4a] ${grid ? 'hidden md:block' : 'md:left-3.5 md:top-3.5 md:text-xs'}`}>
              {c.category}
            </span>
          )}
          {c.badge && (
            <span
              className={`absolute rounded-full bg-[#b8531c] px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.5px] text-white ${
                c.banner ? 'bottom-3 right-3' : 'right-3 top-3 md:right-3.5 md:top-3.5'
              } ${grid ? 'hidden md:block' : ''}`}
            >
              {c.badge}
            </span>
          )}
        </Link>
        <div className={`flex min-w-0 flex-col gap-1 ${grid ? 'md:gap-2.5 md:px-4 md:pt-4' : 'gap-2.5 px-4 pt-4 md:gap-3 md:px-5 md:pt-5'}`}>
          {grid && <span className="text-[11px] font-bold uppercase tracking-[0.8px] text-[#005663] md:hidden dark:text-[#5ef0c8]">{c.category}</span>}
          <h3 className={`font-heading font-extrabold leading-snug text-[#17262a] dark:text-white ${grid ? 'text-base md:text-lg' : 'text-lg md:text-xl'}`}>
            <Link href={c.url} className="hover:text-[#b8531c]">{c.title}</Link>
          </h3>
          {grid && (
            <span className="text-xs text-[#4a5c61] md:hidden dark:text-slate-400">
              {[c.duration, c.level, date ? `Next ${date}` : null].filter(Boolean).join(' · ')}
            </span>
          )}
          <p className={`flex-wrap gap-x-3.5 gap-y-1 text-xs text-[#4a5c61] md:text-[13px] dark:text-slate-400 ${grid ? 'hidden md:flex' : 'flex'}`}>
            {c.duration && <span className="inline-flex items-center gap-1"><Clock className="h-[15px] w-[15px]" aria-hidden="true" />{c.duration}</span>}
            {c.mode && <span className="inline-flex items-center gap-1"><Monitor className="h-[15px] w-[15px]" aria-hidden="true" />{c.mode}</span>}
            {c.level && <span className="inline-flex items-center gap-1"><BarChart3 className="h-[15px] w-[15px]" aria-hidden="true" />{c.level}</span>}
          </p>
          <p className={`items-center gap-1.5 text-xs font-medium text-[#005663] md:text-[13px] dark:text-[#5ef0c8] ${grid ? 'hidden md:flex' : 'flex'}`}>
            <CalendarDays className="h-[15px] w-[15px] shrink-0" aria-hidden="true" />
            {date ? `Next batch: ${date}` : 'Ask for the next batch date'} · 1-year LMS access
          </p>
        </div>
      </div>
      <div className={`mt-auto grid grid-cols-2 gap-2 ${grid ? 'px-3 pb-3 md:mx-4 md:mt-3 md:border-t md:border-[#eef2f3] md:px-0 md:pb-4 md:pt-3' : 'mx-4 mb-4 mt-3 border-t border-[#eef2f3] pt-3 md:mx-5 md:mb-5 md:gap-2.5 md:pt-3.5'} dark:border-slate-800`}>
        <TrackedCta
          href={demoHref}
          ctaId="book_demo"
          location={location}
          prefillCourse={prefillCourse ? c.title : undefined}
          className="flex h-[42px] items-center justify-center gap-1.5 rounded-[10px] bg-[#b8531c] text-sm font-bold text-white hover:bg-[#8f3f14] md:h-11"
        >
          <CalendarCheck className="h-4 w-4" aria-hidden="true" />
          Book demo
        </TrackedCta>
        <TrackedCta
          href={c.syllabusHref}
          ctaId="get_syllabus"
          location={location}
          className="flex h-[42px] items-center justify-center gap-1.5 rounded-[10px] border border-[#cfdadd] text-sm font-bold text-[#005663] hover:border-[#005663] md:h-11 dark:border-slate-700 dark:text-[#5ef0c8]"
        >
          <FileText className="h-4 w-4" aria-hidden="true" />
          Syllabus
        </TrackedCta>
      </div>
    </article>
  );
}
