import Link from 'next/link';
import { MENU_ICON_COLORS, MENU_ICON_PATHS } from '@/lib/menu-icons';
import type { TrackLink } from '@/lib/home-tracks';

/**
 * "Explore by track" (Design v4): on desktop one white strip that overlaps the hero's bottom edge
 * (Main.dc.html), on mobile a titled 3-column grid (Mobile.dc.html). Server component, plain links.
 * Icon paths and colour pairs are the menu's, so the two stay in step.
 */
export default function ExploreTracks({ tracks }: { tracks: TrackLink[] }) {
  if (tracks.length === 0) return null;
  return (
    <section aria-labelledby="tracks-title" className="relative z-[2] mx-auto max-w-[1280px] px-4 pt-7 lg:-mt-7 lg:px-8 lg:pt-0">
      <h2 id="tracks-title" className="mb-3.5 font-heading text-[22px] font-extrabold text-[#0a3d4a] lg:sr-only dark:text-white">
        Explore by track
      </h2>
      <ul className="light-surface grid grid-cols-3 gap-2 lg:grid-cols-[repeat(auto-fit,minmax(112px,1fr))] lg:gap-2.5 lg:rounded-3xl lg:border lg:border-[#e3eaec] lg:bg-white lg:p-[22px] lg:shadow-[0_24px_50px_-36px_rgba(10,61,74,0.7)]">
        {tracks.map((t) => {
          const [fill, ink] = MENU_ICON_COLORS[t.icon];
          return (
            <li key={t.label}>
              <Link
                href={t.href}
                data-cta="explore_track"
                data-loc="explore_tracks"
                className="flex h-full min-h-[44px] flex-col items-center gap-2 rounded-2xl border border-[#e3eaec] bg-white px-1 py-3.5 text-center font-sans text-[13px] font-semibold text-[#17262a] hover:border-[#005663] hover:text-[#0a3d4a] hover:shadow-[0_12px_26px_-16px_rgba(10,61,74,0.5)] lg:gap-2.5 lg:rounded-[18px] lg:px-2 lg:py-[18px] lg:text-sm"
              >
                <span aria-hidden="true" className="flex h-[46px] w-[46px] items-center justify-center rounded-[14px] lg:h-[52px] lg:w-[52px] lg:rounded-2xl" style={{ background: fill, color: ink }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d={MENU_ICON_PATHS[t.icon]} />
                  </svg>
                </span>
                {t.short ? (
                  <>
                    <span className="lg:hidden">{t.short}</span>
                    <span className="hidden lg:inline">{t.label}</span>
                  </>
                ) : (
                  t.label
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
