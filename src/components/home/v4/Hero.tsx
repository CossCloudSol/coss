import Link from 'next/link';
import { Monitor, Search } from 'lucide-react';
import HomeHeroForm, { type NextBatchStrip } from '@/components/home/HomeHeroForm';
import GoogleRatingBadge from '@/components/GoogleRatingBadge';
import type { GoogleRating } from '@/lib/google-places';
import { MENU_ICON_COLORS, MENU_ICON_PATHS } from '@/lib/menu-icons';
import { DESIGN_HEADLINE, DESIGN_SUBTEXT, HERO_POPULAR, HERO_STATS, ORBIT } from '@/lib/home-v4';

interface Props {
  headline: string;
  subtext: string;
  rating: GoogleRating | null;
  nextBatch: NextBatchStrip | null;
}

// The admin Homepage manager can still change these; the design copy shows while the stored text is the old default.
const OLD_DEFAULT_HEADLINE = 'Launch Your IT Career in Hyderabad';
const OLD_DEFAULT_SUBTEXT = 'Expert-led courses. Real-world projects. Job-ready skills to launch your dream career in Hyderabad.';

/**
 * Hero (Design v4, Main.dc.html + Mobile.dc.html): pill, headline, search, popular chips, four stat
 * cards, the live Google rating line, and the illustrated banner with the demo form on it.
 * Server HTML; only the form is a client component.
 */
export default function Hero({ headline, subtext, rating, nextBatch }: Props) {
  const customHeadline = headline && headline !== OLD_DEFAULT_HEADLINE && headline !== DESIGN_HEADLINE;
  const customSubtext = subtext && subtext !== OLD_DEFAULT_SUBTEXT && subtext !== DESIGN_SUBTEXT;
  return (
    <section
      aria-label="Book a free demo class"
      className="relative overflow-hidden bg-[#eaf4f5] [background-image:radial-gradient(rgba(0,86,99,0.12)_1px,transparent_1.5px)] [background-size:20px_20px] lg:[background-size:24px_24px] dark:bg-[#0a3d4a] dark:[background-image:radial-gradient(rgba(255,255,255,0.08)_1px,transparent_1.5px)]"
    >
      <span aria-hidden="true" className="pointer-events-none absolute -right-[90px] -top-[90px] h-[240px] w-[240px] rounded-full border-[50px] border-[#005663]/5 lg:-left-40 lg:-top-40 lg:right-auto lg:h-[460px] lg:w-[460px] lg:border-[80px]" />
      <span aria-hidden="true" className="pointer-events-none absolute -bottom-[120px] left-[38%] hidden h-[280px] w-[280px] rounded-full bg-[#f3a57a]/[0.18] lg:block" />
      <div className="relative mx-auto flex max-w-[1280px] flex-col gap-0 px-4 pt-[26px] lg:flex-row lg:items-center lg:gap-10 lg:px-8 lg:pb-16 lg:pt-14">
        <div className="flex min-w-0 flex-col gap-4 lg:flex-[999_1_520px] lg:gap-[22px]">
          <p className="inline-flex items-center gap-2 self-start rounded-full border border-[#cfe0e3] bg-white px-3 py-[7px] font-sans text-[13px] font-semibold text-[#005663] lg:px-3.5 lg:py-2 lg:text-sm lg:shadow-[0_6px_16px_-12px_rgba(10,61,74,0.5)]">
            <span aria-hidden="true" className="h-[7px] w-[7px] rounded-full bg-[#b8531c] lg:h-2 lg:w-2" />
            IT training in Hyderabad since 2010
          </p>
          <h1 className="font-heading text-[35px] font-extrabold leading-[1.1] text-[#0a3d4a] lg:text-[58px] lg:leading-[1.06] lg:tracking-[-0.01em] dark:text-white">
            {customHeadline ? (
              headline
            ) : (
              <>
                Launch your IT career with <span className="text-[#b8531c] dark:text-[#f3a57a]">live, hands-on</span> training
              </>
            )}
          </h1>
          <p className="max-w-[560px] font-sans text-base leading-[1.6] text-[#26383d] lg:text-[19px] dark:text-white/85">
            {customSubtext ? subtext : DESIGN_SUBTEXT}
          </p>

          <form action="/courses" method="get" role="search" aria-label="Find a course" className="hidden max-w-[580px] items-center gap-2 rounded-2xl border-[1.5px] border-[#cfdadd] bg-white py-1.5 pl-[18px] pr-1.5 shadow-[0_18px_40px_-26px_rgba(10,61,74,0.6)] lg:flex">
            <Search className="h-5 w-5 shrink-0 text-[#4a5c61]" aria-hidden="true" />
            <label htmlFor="hero-course-search" className="sr-only">
              Search courses
            </label>
            <input
              id="hero-course-search"
              type="search"
              name="q"
              placeholder="Try AWS DevOps, Data Science, Python…"
              autoComplete="off"
              className="field-bare min-h-[46px] min-w-0 flex-1 border-0 bg-transparent font-sans text-base text-[#17262a] outline-none placeholder:text-[#5e6f74]"
            />
            <button type="submit" className="flex min-h-[46px] shrink-0 items-center rounded-xl bg-[#005663] px-[22px] font-sans text-[15px] font-bold text-white hover:bg-[#0a3d4a]">
              Search
            </button>
          </form>
          {/* System font (font-sans): these flowing chips would shift when the web font swaps in. */}
          <div className="hidden flex-wrap items-center gap-2 font-sans lg:flex">
            <span className="mr-0.5 text-sm text-[#4a5c61] dark:text-white/70">Popular:</span>
            {HERO_POPULAR.map((term) => (
              <Link
                key={term}
                href={`/courses?q=${encodeURIComponent(term)}`}
                data-cta="popular_search"
                data-loc="hero_search"
                className="light-surface inline-flex min-h-9 items-center rounded-full border border-[#cfdadd] bg-white px-3.5 text-sm font-medium text-[#26383d] hover:border-[#005663] hover:text-[#005663]"
              >
                {term}
              </Link>
            ))}
          </div>

          <ul className="grid grid-cols-2 gap-2 lg:mt-1.5 lg:max-w-[620px] lg:grid-cols-4 lg:gap-3">
            {HERO_STATS.map((s) => (
              <li key={s.label} className="light-surface flex items-center gap-2.5 rounded-[14px] border border-[#e3eaec] bg-white p-3 lg:block lg:rounded-2xl lg:px-3.5 lg:pb-4 lg:pt-3.5 lg:shadow-[0_10px_24px_-20px_rgba(10,61,74,0.6)]">
                <span aria-hidden="true" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] bg-[#eaf4f5] text-[#005663] lg:h-[34px] lg:w-[34px] lg:rounded-[10px]">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d={s.icon} />
                  </svg>
                </span>
                <span className="lg:mt-2.5 lg:block">
                  <span className="block font-heading text-[19px] font-extrabold text-[#0a3d4a] lg:text-2xl">{s.value}</span>
                  <span className="font-sans text-xs text-[#4a5c61] lg:mt-0.5 lg:block lg:text-[13px]">{s.label}</span>
                </span>
              </li>
            ))}
          </ul>

          {rating?.mapsUri && (
            <p className="flex items-center gap-2 font-sans text-sm text-[#26383d] dark:text-white/85">
              <span aria-hidden="true" className="light-surface flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[#e3eaec] bg-white text-[13px] font-bold text-[#005663]">
                G
              </span>
              <GoogleRatingBadge rating={rating} className="inline-flex min-h-[44px] items-center font-bold text-[#0a3d4a] underline-offset-2 hover:underline dark:text-white" />
            </p>
          )}
        </div>

        {/* Banner + form */}
        <div id="enroll-form" className="relative -mx-4 mt-[22px] scroll-mt-40 px-4 pb-7 pt-[70px] lg:mx-0 lg:mt-0 lg:max-w-[580px] lg:flex-[1_1_520px] lg:px-0 lg:pb-0 lg:pt-0">
          <div aria-hidden="true" className="absolute inset-x-0 bottom-0 top-[30px] overflow-hidden rounded-t-[30px] bg-gradient-to-br from-[#00707f] via-[#005663] to-[#0a3d4a] lg:inset-x-auto lg:bottom-0 lg:left-11 lg:right-0 lg:top-0 lg:rounded-[36px]">
            <span className="absolute -right-20 -top-20 h-[260px] w-[260px] rounded-full border-[1.5px] border-white/[0.14] lg:-right-[90px] lg:-top-[90px] lg:h-[360px] lg:w-[360px]" />
            <span className="absolute -right-[30px] -top-[30px] hidden h-[240px] w-[240px] rounded-full border-[1.5px] border-white/[0.12] lg:block" />
            <span className="absolute -bottom-[60px] -left-[90px] h-[280px] w-[280px] rounded-full border-[1.5px] border-white/10 lg:-bottom-[140px] lg:-left-[120px] lg:h-[420px] lg:w-[420px]" />
            <span className="absolute -bottom-20 left-[30%] hidden h-[260px] w-[260px] rounded-full bg-[radial-gradient(circle,rgba(243,165,122,0.45),rgba(243,165,122,0)_70%)] lg:block" />
            <span className="absolute inset-0 [background-image:radial-gradient(rgba(255,255,255,0.1)_1px,transparent_1.5px)] [background-size:16px_16px] lg:[background-size:18px_18px]" />
          </div>
          {ORBIT.map((o) => {
            const [, ink] = MENU_ICON_COLORS[o.icon];
            return (
              <span key={o.icon}>
                <span
                  aria-hidden="true"
                  className={`absolute z-[3] flex h-[50px] w-[50px] items-center justify-center rounded-[15px] bg-white shadow-[0_12px_24px_-10px_rgba(5,30,36,0.55)] lg:hidden ${o.mobile}`}
                  style={{ color: ink }}
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d={MENU_ICON_PATHS[o.icon]} />
                  </svg>
                </span>
                <span
                  aria-hidden="true"
                  className={`absolute z-[3] hidden h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-[0_14px_28px_-12px_rgba(5,30,36,0.55)] lg:flex ${o.desktop}`}
                  style={{ color: ink }}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d={MENU_ICON_PATHS[o.icon]} />
                  </svg>
                </span>
              </span>
            );
          })}
          <div className="relative z-[2] lg:mb-[92px] lg:ml-[108px] lg:mr-10 lg:mt-[92px]">
            <HomeHeroForm nextBatch={nextBatch} />
          </div>
          <div className="light-surface absolute bottom-11 left-0 z-[3] hidden items-center gap-2.5 rounded-[14px] bg-white px-3.5 py-2.5 font-sans text-[13px] font-semibold text-[#0a3d4a] shadow-[0_16px_30px_-18px_rgba(5,30,36,0.6)] lg:flex">
            <span aria-hidden="true" className="flex h-[30px] w-[30px] items-center justify-center rounded-[9px] bg-[#eaf4f5] text-[#005663]">
              <Monitor className="h-4 w-4" />
            </span>
            Classroom or live online
          </div>
        </div>
      </div>
    </section>
  );
}
