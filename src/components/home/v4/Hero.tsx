import Link from 'next/link';
import { Search } from 'lucide-react';
import HomeHeroForm, { type NextBatchStrip } from '@/components/home/HomeHeroForm';
import GoogleRatingBadge from '@/components/GoogleRatingBadge';
import type { GoogleRating } from '@/lib/google-places';
import { DESIGN_HEADLINE, DESIGN_SUBTEXT, HERO_POPULAR, HERO_STATS } from '@/lib/home-v4';

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
      className="on-dark relative overflow-hidden bg-gradient-to-br from-[#0a3d4a] via-[#005663] to-[#00707f] [background-size:100%_100%]">
      <span aria-hidden="true" className="pointer-events-none absolute inset-0 [background-image:radial-gradient(rgba(255,255,255,0.08)_1px,transparent_1.5px)] [background-size:20px_20px] lg:[background-size:24px_24px]" />
      <span aria-hidden="true" className="pointer-events-none absolute -right-[90px] -top-[90px] h-[240px] w-[240px] rounded-full border-[50px] border-white/[0.05] lg:-left-40 lg:-top-40 lg:right-auto lg:h-[460px] lg:w-[460px] lg:border-[80px]" />
      <span aria-hidden="true" className="pointer-events-none absolute -bottom-[120px] left-[38%] hidden h-[280px] w-[280px] rounded-full bg-[#f3a57a]/[0.18] lg:block" />
      <div className="relative mx-auto flex max-w-[1280px] flex-col gap-0 px-4 pt-[26px] lg:flex-row lg:items-center lg:gap-10 lg:px-8 lg:pb-16 lg:pt-14">
        <div className="flex min-w-0 flex-col gap-4 lg:flex-[999_1_520px] lg:gap-[22px]">
          <p className="inline-flex items-center gap-2 self-start rounded-full border border-white/25 bg-white/10 px-3 py-[7px] font-sans text-sm font-semibold text-white lg:px-3.5 lg:py-2">
            <span aria-hidden="true" className="h-[7px] w-[7px] rounded-full bg-[#f3a57a] lg:h-2 lg:w-2" />
            IT training in Hyderabad since 2010
          </p>
          <h1 className="font-heading text-[35px] font-extrabold leading-[1.1] text-white lg:text-[58px] lg:leading-[1.06] lg:tracking-[-0.01em]">
            {customHeadline ? (
              headline
            ) : (
              <>
                Launch your IT career with <span className="on-dark-accent">live, hands-on</span> training
              </>
            )}
          </h1>
          <p className="max-w-[560px] on-dark-sub font-sans text-base leading-[1.6] lg:text-[19px]">
            {customSubtext ? subtext : DESIGN_SUBTEXT}
          </p>

          <form action="/courses" method="get" role="search" aria-label="Find a course" className="hidden max-w-[580px] items-center gap-2 rounded-2xl border-[1.5px] border-white/30 bg-white/10 py-1.5 pl-[18px] pr-1.5 lg:flex">
            <Search className="h-5 w-5 shrink-0 text-white/80" aria-hidden="true" />
            <label htmlFor="hero-course-search" className="sr-only">
              Search courses
            </label>
            <input
              id="hero-course-search"
              type="search"
              name="q"
              placeholder="Try AWS DevOps, Data Science, Python…"
              autoComplete="off"
              className="field-bare min-h-[46px] min-w-0 flex-1 border-0 bg-transparent font-sans text-base text-white outline-none placeholder:text-white/75"
            />
            <button type="submit" className="flex min-h-[46px] shrink-0 items-center rounded-xl bg-[#b8531c] px-[22px] font-sans text-[15px] font-bold text-white hover:bg-[#8f3f14]">
              Search
            </button>
          </form>
          {/* System font (font-sans): these flowing chips would shift when the web font swaps in. */}
          <div className="hidden flex-wrap items-center gap-2 font-sans lg:flex">
            <span className="on-dark-sub mr-0.5 text-sm">Popular:</span>
            {HERO_POPULAR.map((term) => (
              <Link
                key={term}
                href={`/courses?q=${encodeURIComponent(term)}`}
                data-cta="popular_search"
                data-loc="hero_search"
                className="inline-flex min-h-11 items-center rounded-full border border-white/30 bg-white/10 px-3.5 text-sm font-medium text-white hover:bg-white/20"
              >
                {term}
              </Link>
            ))}
          </div>

          <ul className="grid grid-cols-2 gap-2 lg:mt-1.5 lg:max-w-[620px] lg:grid-cols-4 lg:gap-3">
            {HERO_STATS.map((s) => (
              <li key={s.label} className="flex items-center gap-2.5 rounded-2xl border border-white/20 bg-white/10 p-3 lg:block lg:px-3.5 lg:pb-4 lg:pt-3.5">
                <span aria-hidden="true" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/15 text-[#f3a57a]">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d={s.icon} />
                  </svg>
                </span>
                <span className="lg:mt-2.5 lg:block">
                  <span className="block font-heading text-[19px] font-extrabold text-white lg:text-2xl">{s.value}</span>
                  <span className="on-dark-sub font-sans text-sm lg:mt-0.5 lg:block">{s.label}</span>
                </span>
              </li>
            ))}
          </ul>

          {rating?.mapsUri && (
            <p className="flex items-center gap-2 font-sans text-sm text-white">
              <span aria-hidden="true" className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[#e3eaec] bg-white text-[13px] font-bold text-[#005663]">
                G
              </span>
              <GoogleRatingBadge rating={rating} className="inline-flex min-h-[44px] items-center font-bold text-white underline-offset-2 hover:underline" />
            </p>
          )}
        </div>

        {/* Banner + form */}
        <div id="enroll-form" className="relative -mx-4 mt-[22px] scroll-mt-40 px-4 pb-7 pt-[70px] lg:mx-0 lg:mt-0 lg:max-w-[580px] lg:flex-[1_1_520px] lg:px-0 lg:pb-0 lg:pt-0">
          <div className="relative z-[2] lg:mb-[92px] lg:ml-[108px] lg:mr-10 lg:mt-[92px]">
            <HomeHeroForm nextBatch={nextBatch} />
          </div>
        </div>
      </div>
    </section>
  );
}
