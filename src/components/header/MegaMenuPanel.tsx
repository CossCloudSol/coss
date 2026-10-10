import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import type { MenuIconKey } from '@/lib/menu-icons';
import type { MenuData } from '@/lib/menu-data';
import type { StartingSoonBatch } from '@/lib/starting-soon';
import { IconTile, MenuCourseCard, batchDateBlock } from './menu-parts';
import MegaMenuCallback from './MegaMenuCallback';

const POPULAR = 'popular';

/**
 * Explore Courses mega-menu content (v4). A server component: every
 * category and course link is in the server HTML (crawlable) whether or not
 * the menu is open. The header's client code only toggles it and sets
 * data-active; the matching course list and rail highlight come from the
 * CSS rules generated below. Opens on Popular courses.
 */
export default function MegaMenuPanel({ data, soon }: { data: MenuData; soon: StartingSoonBatch[] }): JSX.Element {
  const categories = data.groups.flatMap((g) => g.categories);
  // Slugs are DB values: only plain slugs go into CSS.
  const rules = [POPULAR, ...categories.map((c) => c.slug)]
    .filter((slug) => /^[a-z0-9-]+$/.test(slug))
    .map(
      (slug) =>
        `[data-mega][data-active="${slug}"] [data-mega-list="${slug}"]{display:block}` +
        `[data-mega][data-active="${slug}"] [data-mega-cat="${slug}"]{background:#fff;box-shadow:0 4px 14px rgba(10,61,74,.14);font-weight:700;color:#0a3d4a}` +
        `[data-mega][data-active="${slug}"] [data-mega-cat="${slug}"] .mm-n{background:#fdf0e8;color:#8f3f14}`,
    )
    .join('');

  return (
    // Height: at most the viewport below the header; each column scrolls on its own.
    <div data-mega="" data-active={POPULAR} className="grid h-[min(720px,calc(100vh-150px))] grid-cols-[290px_minmax(0,1fr)_300px]">
      {/* dangerouslySetInnerHTML, not a text child: React escapes quotes in <style>
          text on the server (&quot;), which broke these selectors and made every
          page fail hydration (React #425/#418/#423), which also wiped the theme class. */}
      <style dangerouslySetInnerHTML={{ __html: rules }} />

      {/* Rail */}
      <div aria-label="Course categories" role="group" className="flex min-h-0 flex-col gap-2.5 overflow-y-auto overscroll-contain border-r border-[#e3eaec] bg-[#f6f9fa] px-3 py-4 dark:border-slate-700 dark:bg-slate-800">
        <button type="button" data-mega-cat={POPULAR} aria-current="true" className="mm-pop">
          <span className="mm-tile" style={{ width: 40, height: 40, borderRadius: 12, background: '#b8531c', color: '#fff' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.07-2.14-.22-4.05 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.15.43-2.29 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
            </svg>
          </span>
          <span className="flex flex-1 flex-col gap-0.5 text-left">
            <span>Popular courses</span>
            <span className="text-xs font-medium text-[#4a5c61]">Our featured courses</span>
          </span>
          <span className="mm-n">{data.popular.length}</span>
        </button>
        {data.groups.map((g) => (
          <div key={g.group} className="flex flex-col gap-0.5">
            <span className="px-2.5 pb-1 pt-1.5 text-[11px] font-bold uppercase tracking-[0.1em] text-[#4a5c61] dark:text-slate-400">{g.title}</span>
            {g.categories.map((c) => (
              <Link key={c.slug} href={`/courses/${c.slug}`} data-mega-cat={c.slug} className="mm-cat">
                <IconTile icon={c.icon} size={36} radius={10} iconSize={18} />
                <span className="flex-1 text-left">{c.name}</span>
                <span className="mm-n">{c.count}</span>
              </Link>
            ))}
          </div>
        ))}
      </div>

      {/* Course cards */}
      <div className="min-h-0 overflow-y-auto overscroll-contain px-[26px] py-6">
        <div data-mega-list={POPULAR}>
          <ListHead icon="popular" name="Popular courses" blurb="A short list to start with. Every course has a free demo class." allHref="/courses" allLabel="Browse all courses" />
          <div className="mm-grid">
            {data.popular.map((p) => (
              <MenuCourseCard key={p.label} card={{ href: p.href, label: p.label, icon: p.icon, track: p.track, chips: p.chips, nextBatch: p.nextBatch }} />
            ))}
          </div>
        </div>
        {categories.map((c) => (
          <div key={c.slug} data-mega-list={c.slug}>
            <ListHead icon={c.icon} name={c.name} blurb={c.blurb} allHref={`/courses/${c.slug}`} allLabel={`View all ${c.count}`} />
            <div className="mm-grid">
              {c.courses.map((k) => (
                <MenuCourseCard key={k.id} card={{ href: k.href, label: k.label, icon: c.icon, nextBatch: k.nextBatch, popular: k.popular }} />
              ))}
            </div>
          </div>
        ))}
        <div className="mt-[18px] flex items-center gap-3.5 rounded-[14px] bg-[#fdf0e8] px-4 py-3 dark:bg-slate-800">
          <span aria-hidden="true" className="flex h-[38px] w-[38px] flex-none items-center justify-center rounded-[11px] bg-white text-[#b8531c]">
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="m16 8-6 2-2 6 6-2z" />
            </svg>
          </span>
          <span className="flex-1 text-sm leading-snug text-[#17262a] dark:text-slate-200">
            <strong>Not sure where to start?</strong> Talk to a counsellor and get a suggested course.
          </span>
          <Link href="/free-demo-class" className="flex min-h-[44px] items-center whitespace-nowrap text-sm font-bold text-[#8f3f14] hover:underline dark:text-[#f3a57a]">
            Book a free demo <ArrowRight className="ml-1 h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </div>

      {/* Callback + starting soon */}
      <div className="flex min-h-0 flex-col overflow-y-auto overscroll-contain border-l border-[#e3eaec] dark:border-slate-700">
        <MegaMenuCallback />
        {soon.length > 0 && (
          <div className="flex flex-col gap-2.5 p-[18px]">
            <div className="flex items-baseline justify-between">
              <span className="font-heading text-base font-extrabold text-[#0a3d4a] dark:text-white">Starting soon</span>
              <Link href="/batches" className="flex min-h-[44px] items-center text-[13px] font-bold text-[#b8531c] hover:text-[#8f3f14] dark:text-[#f3a57a]">
                All batches
              </Link>
            </div>
            {soon.map((b) => {
              const d = batchDateBlock(b.startDate);
              return (
                <Link key={b.id} href={b.href} className="mm-soon">
                  <span className="mm-date" aria-hidden="true">
                    <span className="text-[9px] font-bold tracking-[0.06em] text-[#f3a57a]">{d.dow}</span>
                    <span className="my-0.5 font-heading text-[19px] font-extrabold">{d.day}</span>
                    <span className="text-[9px] font-bold tracking-[0.06em]">{d.mon}</span>
                  </span>
                  <span className="flex min-w-0 flex-col gap-0.5">
                    <span className="text-sm font-bold text-[#17262a] dark:text-slate-100">{b.course}</span>
                    <span className="text-[12.5px] text-[#4a5c61] dark:text-slate-300">
                      <span className="sr-only">Starts {d.dow} {d.day} {d.mon}. </span>
                      {b.where}
                      {b.time ? ` · ${b.time}` : ''}
                    </span>
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function ListHead({ icon, name, blurb, allHref, allLabel }: { icon: MenuIconKey; name: string; blurb: string; allHref: string; allLabel: string }): JSX.Element {
  return (
    <div className="mb-[18px] flex items-center justify-between gap-4">
      <div className="flex items-center gap-3.5">
        <IconTile icon={icon} size={54} radius={16} iconSize={26} />
        <div>
          <h3 className="m-0 font-heading text-2xl font-extrabold text-[#0a3d4a] dark:text-white">{name}</h3>
          {blurb && <p className="mt-1 text-sm text-[#4a5c61] dark:text-slate-300">{blurb}</p>}
        </div>
      </div>
      <Link href={allHref} className="flex h-[42px] flex-none items-center gap-1.5 rounded-[11px] border-[1.5px] border-[#cfe0e3] px-4 text-sm font-bold text-[#005663] hover:border-[#005663] dark:border-slate-600 dark:text-[#5ef0c8]">
        {allLabel} <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </Link>
    </div>
  );
}
