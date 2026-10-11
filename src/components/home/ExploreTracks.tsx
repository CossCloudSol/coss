import Link from 'next/link';
import { MENU_ICON_COLORS, MENU_ICON_PATHS } from '@/lib/menu-icons';
import type { TrackLink } from '@/lib/home-tracks';

/**
 * "Explore by track": one tile per published category (Design v4 Main.dc.html). Server component,
 * plain links, no JavaScript. Icon paths and colour pairs are the menu's, so the two stay in step.
 */
export default function ExploreTracks({ tracks }: { tracks: TrackLink[] }) {
  if (tracks.length === 0) return null;
  return (
    <section aria-label="Explore courses by track" className="bg-[#f6f9fa] px-4 pt-6 md:px-8 md:pt-8 dark:bg-slate-950">
      <ul className="mx-auto grid max-w-[1200px] grid-cols-3 gap-2.5 rounded-3xl border border-[#e3eaec] bg-white p-3 shadow-[0_24px_50px_-36px_rgba(10,61,74,0.7)] sm:grid-cols-5 md:p-[22px] lg:grid-cols-9 dark:border-slate-700 dark:bg-slate-900">
        {tracks.map((t) => {
          const [fill, ink] = MENU_ICON_COLORS[t.icon];
          return (
            <li key={t.label}>
              <Link
                href={t.href}
                className="light-surface flex h-full min-h-[44px] flex-col items-center gap-2.5 rounded-[18px] border border-[#e3eaec] bg-white px-2 py-4 text-center text-sm font-semibold text-[#17262a] hover:border-[#005663] hover:text-[#0a3d4a] hover:shadow-[0_12px_26px_-16px_rgba(10,61,74,0.5)]"
              >
                <span aria-hidden="true" className="flex h-[52px] w-[52px] items-center justify-center rounded-2xl" style={{ background: fill, color: ink }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d={MENU_ICON_PATHS[t.icon]} />
                  </svg>
                </span>
                {t.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
