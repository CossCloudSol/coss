'use client';

import { Fragment, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowRight, ArrowUpDown, Filter, MessageCircle, Search, X } from 'lucide-react';
import CourseTile from '@/components/courses/CourseTile';
import PromoBanner from '@/components/PromoBanner';
import NoResultsLead from '@/components/search/NoResultsLead';
import TrackedCta from '@/components/home/TrackedCta';
import WhatsAppLink from '@/components/WhatsAppLink';
import { COURSE_TABS, MORE_TAB, searchCourses, type CatalogCourse } from '@/lib/course-search';
import { trackFilterApply, trackSearch, trackSearchSelect } from '@/lib/click-tracking';
import type { PromoBanner as PromoBannerData } from '@/lib/promo-banner-schema';

/* ── Filter model (mirrored in the URL: q, cat, mode, dur, level, batch, sort) ── */

const PAGE_SIZE = 12;
const BANNER_AFTER = 6;
const DEMO_HREF = '/free-demo-class';

const MODES = [
  { id: 'dilsukhnagar', label: 'Classroom · Dilsukhnagar', short: 'Dilsukhnagar' },
  { id: 'ameerpet', label: 'Classroom · Ameerpet', short: 'Ameerpet' },
  { id: 'online', label: 'Live online', short: 'Live online' },
] as const;

const DURATIONS = [
  { id: 'short', label: 'Under 2 months', test: (m: number) => m < 2 },
  { id: 'mid', label: '2–3 months', test: (m: number) => m >= 2 && m <= 3 },
  { id: 'long', label: '4+ months', test: (m: number) => m >= 4 },
] as const;

const BATCHES = [
  { id: 'this', label: 'Starting this month', offset: 0 },
  { id: 'next', label: 'Starting next month', offset: 1 },
] as const;

const SORTS = [
  { id: 'popular', label: 'Most popular' },
  { id: 'short', label: 'Shortest first' },
  { id: 'long', label: 'Longest first' },
  { id: 'az', label: 'Name A–Z' },
] as const;

const LEVEL_ORDER = ['beginner', 'beginner to intermediate', 'intermediate', 'advanced', 'beginner to advanced', 'all levels'];

type SortId = (typeof SORTS)[number]['id'];

interface Filters {
  q: string;
  tab: string;
  modes: string[];
  dur: string;
  levels: string[];
  batch: string;
  sort: SortId;
}

const EMPTY: Filters = { q: '', tab: 'all', modes: [], dur: '', levels: [], batch: '', sort: 'popular' };

function slug(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function parseFilters(search: string, levelSlugs: Set<string>, tabIds: Set<string>): Filters {
  const p = new URLSearchParams(search);
  const list = (k: string) => (p.get(k) ?? '').split(',').map((v) => v.trim()).filter(Boolean);
  const sort = p.get('sort') ?? '';
  return {
    q: (p.get('q') ?? '').slice(0, 100),
    tab: tabIds.has(p.get('cat') ?? '') ? (p.get('cat') as string) : 'all',
    modes: list('mode').filter((m) => MODES.some((x) => x.id === m)),
    dur: DURATIONS.some((d) => d.id === p.get('dur')) ? (p.get('dur') as string) : '',
    levels: list('level').filter((l) => levelSlugs.has(l)),
    batch: BATCHES.some((b) => b.id === p.get('batch')) ? (p.get('batch') as string) : '',
    sort: SORTS.some((s) => s.id === sort) ? (sort as SortId) : 'popular',
  };
}

function serializeFilters(f: Filters): string {
  const p = new URLSearchParams();
  if (f.q.trim()) p.set('q', f.q.trim());
  if (f.tab !== 'all') p.set('cat', f.tab);
  if (f.modes.length) p.set('mode', f.modes.join(','));
  if (f.dur) p.set('dur', f.dur);
  if (f.levels.length) p.set('level', f.levels.join(','));
  if (f.batch) p.set('batch', f.batch);
  if (f.sort !== 'popular') p.set('sort', f.sort);
  const s = p.toString();
  return s ? `?${s}` : '';
}

/** Year and month (IST) of an ISO date, as a comparable number. */
function monthKey(d: Date): number {
  const ist = new Date(d.getTime() + 5.5 * 3600 * 1000);
  return ist.getUTCFullYear() * 12 + ist.getUTCMonth();
}

function toggle(list: string[], v: string): string[] {
  return list.includes(v) ? list.filter((x) => x !== v) : [...list, v];
}

/** Reads the URL (first load, back/forward, header search on this page) into the filters. */
function UrlWatcher({ onChange }: { onChange: (search: string) => void }): null {
  const params = useSearchParams();
  const search = params.toString();
  useEffect(() => onChange(search), [search, onChange]);
  return null;
}

/* ── Component ─────────────────────────────────────────────────────────── */

interface Props {
  courses: CatalogCourse[];
  banner: PromoBannerData | null;
}

/**
 * /courses: every course is in the server HTML (cards past the first page
 * are hidden, not omitted); search, tabs, filters, sort and "Load more" run
 * on the client, with the state kept in the URL.
 */
export default function CoursesExplorer({ courses, banner }: Props): JSX.Element {
  const [f, setF] = useState<Filters>(EMPTY);
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [sheetOpen, setSheetOpen] = useState(false);
  const pendingEvent = useRef<{ type: string; value: string } | null>(null);
  const lastSearch = useRef('');
  const fromUrl = useRef(false);

  const levels = useMemo(() => {
    const seen = new Map<string, string>();
    for (const c of courses) if (c.level) seen.set(slug(c.level), c.level);
    return Array.from(seen.entries())
      .map(([id, label]) => ({ id, label }))
      .sort((a, b) => {
        const ia = LEVEL_ORDER.indexOf(a.label.toLowerCase());
        const ib = LEVEL_ORDER.indexOf(b.label.toLowerCase());
        return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib) || a.label.localeCompare(b.label);
      });
  }, [courses]);

  const tabs = useMemo(() => {
    const used = new Set(courses.map((c) => c.tab));
    return [...COURSE_TABS, MORE_TAB].filter((t) => used.has(t.id)).map((t) => ({ id: t.id, label: t.label }));
  }, [courses]);

  /* URL → state */
  const applySearch = useCallback(
    (search: string) => {
      const next = parseFilters(search, new Set(levels.map((l) => l.id)), new Set(tabs.map((t) => t.id)));
      setF((prev) => {
        if (serializeFilters(prev) === serializeFilters(next)) return prev;
        fromUrl.current = true; // don't echo this change back into the URL
        return next;
      });
      const root = document.documentElement;
      if (root.classList.contains('courses-pending')) {
        // First load of a filtered URL: the results were hidden before paint
        // (inline script in the page). Hold their height until the visitor
        // interacts, so the shorter filtered list doesn't shift the page.
        const results = document.getElementById('courses-results');
        if (results) results.style.minHeight = `${results.offsetHeight}px`;
        root.classList.remove('courses-pending');
        const release = () => {
          if (results) results.style.minHeight = '';
          window.removeEventListener('pointerdown', release);
          window.removeEventListener('keydown', release);
        };
        window.addEventListener('pointerdown', release);
        window.addEventListener('keydown', release);
      }
    },
    [levels, tabs],
  );

  /* state → URL (replaceState keeps Next's router in sync) */
  useEffect(() => {
    if (fromUrl.current) {
      fromUrl.current = false;
      return;
    }
    const t = setTimeout(() => {
      const url = `${window.location.pathname}${serializeFilters(f)}`;
      if (url !== `${window.location.pathname}${window.location.search}`) window.history.replaceState(window.history.state, '', url);
    }, 300);
    return () => clearTimeout(t);
  }, [f]);

  function update(patch: Partial<Filters>, event?: { type: string; value: string }) {
    setF((prev) => ({ ...prev, ...patch }));
    setVisible(PAGE_SIZE);
    if (event) pendingEvent.current = event;
  }

  function clearAll() {
    update({ q: '', tab: 'all', modes: [], dur: '', levels: [], batch: '' }, { type: 'clear_all', value: 'all' });
  }

  /* Filtering */
  const q = f.q.trim();
  const searched = useMemo(() => (q.length >= 2 ? searchCourses(courses, q).map((h) => h.course) : courses), [courses, q]);

  const filteredExceptTab = useMemo(() => {
    const now = monthKey(new Date());
    return searched.filter((c) => {
      if (f.modes.length && !f.modes.some((m) => c.modes.includes(m))) return false;
      if (f.dur) {
        const d = DURATIONS.find((x) => x.id === f.dur);
        if (!d || c.months == null || !d.test(c.months)) return false;
      }
      if (f.levels.length && !f.levels.includes(slug(c.level))) return false;
      if (f.batch) {
        const b = BATCHES.find((x) => x.id === f.batch);
        if (!b || !c.nextBatch || monthKey(new Date(c.nextBatch)) !== now + b.offset) return false;
      }
      return true;
    });
  }, [searched, f.modes, f.dur, f.levels, f.batch]);

  const tabCounts = useMemo(() => {
    const counts = new Map<string, number>([['all', filteredExceptTab.length]]);
    for (const c of filteredExceptTab) counts.set(c.tab, (counts.get(c.tab) ?? 0) + 1);
    return counts;
  }, [filteredExceptTab]);

  const list = useMemo(() => {
    const inTab = f.tab === 'all' ? filteredExceptTab : filteredExceptTab.filter((c) => c.tab === f.tab);
    const byMonths = (dir: 1 | -1) => (a: CatalogCourse, b: CatalogCourse) =>
      a.months == null ? 1 : b.months == null ? -1 : (a.months - b.months) * dir || a.rank - b.rank;
    if (f.sort === 'short') return [...inTab].sort(byMonths(1));
    if (f.sort === 'long') return [...inTab].sort(byMonths(-1));
    if (f.sort === 'az') return [...inTab].sort((a, b) => a.title.localeCompare(b.title));
    return inTab; // popular: catalogue order, or best match when searching
  }, [filteredExceptTab, f.tab, f.sort]);

  // Courses that don't match stay in the HTML (hidden) so every course link is always there.
  const rest = useMemo(() => {
    const shown = new Set(list.map((c) => c.id));
    return courses.filter((c) => !shown.has(c.id));
  }, [courses, list]);

  /* GA4 */
  useEffect(() => {
    if (!pendingEvent.current) return;
    trackFilterApply(pendingEvent.current.type, pendingEvent.current.value, list.length);
    pendingEvent.current = null;
  }, [list.length, f]);

  useEffect(() => {
    if (q.length < 2) return;
    const t = setTimeout(() => {
      if (lastSearch.current === q) return;
      lastSearch.current = q;
      trackSearch(q, list.length, 'courses_page');
    }, 1000);
    return () => clearTimeout(t);
  }, [q, list.length]);

  function onGridClick(e: React.MouseEvent) {
    if (q.length < 2) return;
    const a = (e.target as HTMLElement).closest('a');
    const card = (e.target as HTMLElement).closest<HTMLElement>('[data-pos]');
    if (a && card) trackSearchSelect(q, a.getAttribute('href') ?? '', Number(card.dataset.pos), 'courses_page');
  }

  /* Mobile sheet: lock page scroll */
  useEffect(() => {
    if (!sheetOpen) return;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setSheetOpen(false);
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [sheetOpen]);

  const activeChips: Array<{ key: string; label: string; remove: () => void }> = [
    ...(f.tab !== 'all' ? [{ key: 'tab', label: tabs.find((t) => t.id === f.tab)?.label ?? f.tab, remove: () => update({ tab: 'all' }, { type: 'category', value: 'all' }) }] : []),
    ...f.modes.map((m) => ({ key: `m-${m}`, label: MODES.find((x) => x.id === m)?.short ?? m, remove: () => update({ modes: toggle(f.modes, m) }, { type: 'mode', value: m }) })),
    ...(f.dur ? [{ key: 'dur', label: DURATIONS.find((d) => d.id === f.dur)?.label ?? f.dur, remove: () => update({ dur: '' }, { type: 'duration', value: '' }) }] : []),
    ...f.levels.map((l) => ({ key: `l-${l}`, label: levels.find((x) => x.id === l)?.label ?? l, remove: () => update({ levels: toggle(f.levels, l) }, { type: 'level', value: l }) })),
    ...(f.batch ? [{ key: 'batch', label: BATCHES.find((b) => b.id === f.batch)?.label ?? f.batch, remove: () => update({ batch: '' }, { type: 'next_batch', value: '' }) }] : []),
  ];
  const filterCount = f.modes.length + (f.dur ? 1 : 0) + f.levels.length + (f.batch ? 1 : 0);
  const noResultsTerm = q || activeChips.map((c) => c.label).join(', ') || 'your filters';

  /* ── Filter controls (sidebar on desktop, sheet on mobile) ── */
  const chip = (selected: boolean) =>
    `min-h-[40px] rounded-[10px] px-3.5 text-sm ${selected ? 'border-2 border-[#b8531c] bg-[#fdf0e8] font-bold text-[#8f3f14]' : 'border border-[#cfdadd] text-[#26383d] hover:border-[#005663] dark:border-slate-700 dark:text-slate-200'}`;
  const legend = 'mb-2.5 p-0 text-xs font-bold uppercase tracking-[1px] text-[#4a5c61] md:text-[13px] dark:text-slate-400';

  const filterGroups = (asChips: boolean) => (
    <>
      <fieldset className="m-0 border-0 p-0">
        <legend className={legend}>How you learn</legend>
        <div className={asChips ? 'flex flex-wrap gap-2' : 'flex flex-col gap-1'}>
          {MODES.map((m) => {
            const on = f.modes.includes(m.id);
            return asChips ? (
              <button key={m.id} type="button" aria-pressed={on} className={chip(on)} onClick={() => update({ modes: toggle(f.modes, m.id) }, { type: 'mode', value: m.id })}>
                {m.short}
              </button>
            ) : (
              <label key={m.id} className="flex min-h-[32px] cursor-pointer items-center gap-2.5 text-[15px] text-[#26383d] dark:text-slate-200">
                <input type="checkbox" checked={on} onChange={() => update({ modes: toggle(f.modes, m.id) }, { type: 'mode', value: m.id })} className="h-[18px] w-[18px] accent-[#b8531c]" />
                {m.label}
              </label>
            );
          })}
        </div>
      </fieldset>
      <fieldset className="m-0 border-0 border-t border-[#eef2f3] p-0 pt-4 dark:border-slate-800">
        <legend className={`${legend} float-left w-full`}>Duration</legend>
        <div className="clear-both flex flex-wrap gap-2">
          {DURATIONS.map((d) => {
            const on = f.dur === d.id;
            return (
              <button key={d.id} type="button" aria-pressed={on} className={chip(on)} onClick={() => update({ dur: on ? '' : d.id }, { type: 'duration', value: on ? '' : d.id })}>
                {d.label}
              </button>
            );
          })}
        </div>
      </fieldset>
      <fieldset className="m-0 border-0 border-t border-[#eef2f3] p-0 pt-4 dark:border-slate-800">
        <legend className={`${legend} float-left w-full`}>Level</legend>
        <div className={`clear-both ${asChips ? 'flex flex-wrap gap-2' : 'flex flex-col gap-1'}`}>
          {levels.map((l) => {
            const on = f.levels.includes(l.id);
            return asChips ? (
              <button key={l.id} type="button" aria-pressed={on} className={chip(on)} onClick={() => update({ levels: toggle(f.levels, l.id) }, { type: 'level', value: l.id })}>
                {l.label}
              </button>
            ) : (
              <label key={l.id} className="flex min-h-[32px] cursor-pointer items-center gap-2.5 text-[15px] text-[#26383d] dark:text-slate-200">
                <input type="checkbox" checked={on} onChange={() => update({ levels: toggle(f.levels, l.id) }, { type: 'level', value: l.id })} className="h-[18px] w-[18px] accent-[#b8531c]" />
                {l.label}
              </label>
            );
          })}
        </div>
      </fieldset>
      <fieldset className="m-0 border-0 border-t border-[#eef2f3] p-0 pt-4 dark:border-slate-800">
        <legend className={`${legend} float-left w-full`}>Next batch</legend>
        <div className="clear-both flex flex-wrap gap-2">
          {BATCHES.map((b) => {
            const on = f.batch === b.id;
            return (
              <button key={b.id} type="button" aria-pressed={on} className={chip(on)} onClick={() => update({ batch: on ? '' : b.id }, { type: 'next_batch', value: on ? '' : b.id })}>
                {b.label}
              </button>
            );
          })}
        </div>
      </fieldset>
    </>
  );

  const sortSelect = (id: string, className: string) => (
    <select
      id={id}
      value={f.sort}
      onChange={(e) => update({ sort: e.target.value as SortId }, { type: 'sort', value: e.target.value })}
      className={className}
    >
      {SORTS.map((s) => (
        <option key={s.id} value={s.id}>{s.label}</option>
      ))}
    </select>
  );

  const counselling = (
    <div className="flex flex-col gap-3 rounded-2xl bg-[#005663] p-5 text-white md:p-[22px]">
      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/[0.12]">
        <MessageCircle className="h-[22px] w-[22px]" aria-hidden="true" />
      </span>
      <h2 className="font-heading text-lg font-extrabold text-white md:text-[19px]">Not sure which course fits?</h2>
      <p className="text-sm leading-[1.55] text-white/85">Get a free counselling call. We match the course to your background and goal.</p>
      <WhatsAppLink
        ctaType="hero"
        pageType="static"
        message="Hi, I'd like a free counselling call to choose a course."
        className="flex h-[46px] items-center justify-center gap-1.5 rounded-[10px] bg-white text-sm font-bold text-[#005663] hover:bg-[#e6f0f1]"
      >
        Free counselling call <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </WhatsAppLink>
    </div>
  );

  const shownCount = Math.min(visible, list.length);

  return (
    <>
      <Suspense fallback={null}>
        <UrlWatcher onChange={applySearch} />
      </Suspense>

      {/* ── Page band: search and category tabs ── */}
      <section className="bg-[#0a3d4a] px-4 py-5 md:px-8 md:pb-7 md:pt-8">
        <div className="mx-auto flex max-w-[1200px] flex-col gap-3 md:gap-4">
          <nav aria-label="Breadcrumb" className="hidden text-[13px] text-white/70 md:block">
            <Link href="/" className="text-white/85 hover:text-white">Home</Link> / Courses
          </nav>
          <h1 className="font-heading text-[26px] font-extrabold text-white md:text-[40px]">IT Courses in Hyderabad</h1>
          <p className="hidden text-base text-white/85 md:block">
            {courses.length} courses · Classrooms in Dilsukhnagar and Ameerpet · Live online · Free demo class for every course
          </p>
          <form
            role="search"
            onSubmit={(e) => e.preventDefault()}
            className="flex h-[52px] max-w-[760px] items-center gap-2.5 rounded-xl bg-white pl-3.5 pr-1.5 text-[#5f7075] md:h-[60px] md:rounded-[14px] md:pl-5 md:pr-2"
          >
            <Search className="h-5 w-5 shrink-0" aria-hidden="true" />
            <label htmlFor="courses-q" className="sr-only">Search courses</label>
            <input
              id="courses-q"
              type="search"
              value={f.q}
              onChange={(e) => update({ q: e.target.value })}
              placeholder="Search by course, tool or skill: AWS, Python, CEH…"
              autoComplete="off"
              className="field-bare min-w-0 flex-1 border-0 bg-transparent text-base text-[#17262a] outline-none placeholder:text-[#5f7075] md:text-[17px]"
            />
            {f.q && (
              <button type="button" onClick={() => update({ q: '' })} aria-label="Clear search" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-[#f4f7f8] text-[#4a5c61]">
                <X className="h-[18px] w-[18px]" aria-hidden="true" />
              </button>
            )}
          </form>
          <div data-pending-hide="" className="-mx-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:flex-wrap md:overflow-visible md:px-0" aria-label="Course categories" role="group">
            {[{ id: 'all', label: 'All' }, ...tabs].map((t) => {
              const count = tabCounts.get(t.id) ?? 0;
              if (t.id !== 'all' && count === 0 && f.tab !== t.id) return null;
              const on = f.tab === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => update({ tab: t.id }, { type: 'category', value: t.id })}
                  className={`flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-[13px] font-bold md:h-[38px] md:px-4 md:text-sm ${
                    on ? 'bg-white text-[#0a3d4a]' : 'border border-white/35 text-white hover:border-white/70'
                  }`}
                >
                  {t.label} <span className="font-medium opacity-70">{count}</span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Mobile: Filters / Sort bar ── */}
      <div data-pending-hide="" className="sticky top-16 z-20 grid grid-cols-2 gap-2 border-b border-[#e3eaec] bg-white px-4 py-2.5 md:hidden dark:border-slate-800 dark:bg-slate-900">
        <button
          type="button"
          onClick={() => setSheetOpen(true)}
          aria-haspopup="dialog"
          className="flex h-11 items-center justify-center gap-1.5 rounded-[10px] border border-[#cfdadd] text-sm font-bold text-[#17262a] dark:border-slate-700 dark:text-slate-100"
        >
          <Filter className="h-[17px] w-[17px]" aria-hidden="true" />
          Filters
          {filterCount > 0 && <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#b8531c] px-1 text-[11px] text-white">{filterCount}</span>}
        </button>
        <label className="relative flex h-11 items-center justify-center gap-1.5 rounded-[10px] border border-[#cfdadd] text-sm font-bold text-[#17262a] dark:border-slate-700 dark:text-slate-100">
          <ArrowUpDown className="h-[17px] w-[17px]" aria-hidden="true" />
          <span aria-hidden="true">{SORTS.find((s) => s.id === f.sort)?.label}</span>
          <span className="sr-only">Sort courses</span>
          {sortSelect('courses-sort-mobile', 'absolute inset-0 h-full w-full cursor-pointer opacity-0')}
        </label>
      </div>

      {/* ── Body ── */}
      <div className="bg-[#f4f7f8] px-4 pb-12 pt-3 dark:bg-slate-950 md:px-8 md:pb-14 md:pt-8">
        <div className="mx-auto grid max-w-[1200px] items-start gap-8 lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside aria-label="Filters" className="hidden flex-col gap-5 lg:flex">
            <div className="flex flex-col gap-4 rounded-2xl border border-[#e3eaec] bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
              <div className="flex items-center justify-between">
                <p className="flex items-center gap-2 font-heading text-lg font-extrabold text-[#0a3d4a] dark:text-white">
                  <Filter className="h-[18px] w-[18px]" aria-hidden="true" />
                  Filters
                </p>
                <button type="button" onClick={clearAll} className="text-sm font-bold text-[#b8531c] hover:text-[#8f3f14] dark:text-[#f3a57a]">Clear all</button>
              </div>
              {filterGroups(false)}
            </div>
            {counselling}
          </aside>

          <div id="courses-results" className="flex min-w-0 flex-col gap-4 md:gap-5">
            <div data-pending-hide="" className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2 md:gap-2.5">
                <p className="text-sm text-[#26383d] md:text-base dark:text-slate-200" aria-live="polite">
                  <strong>{list.length}</strong> {list.length === 1 ? 'course' : 'courses'}
                </p>
                {activeChips.map((c) => (
                  <button
                    key={c.key}
                    type="button"
                    onClick={c.remove}
                    aria-label={`Remove filter: ${c.label}`}
                    className="flex h-[30px] items-center gap-1.5 rounded-full border border-[#cfdadd] bg-white pl-3 pr-2 text-[13px] text-[#26383d] hover:border-[#b8531c] md:h-[34px] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                  >
                    {c.label}
                    <X className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                ))}
              </div>
              <label htmlFor="courses-sort" className="hidden items-center gap-2 text-sm text-[#4a5c61] md:flex dark:text-slate-400">
                Sort by
                {sortSelect('courses-sort', 'h-[42px] rounded-[10px] border border-[#cfdadd] bg-white px-3 text-sm text-[#17262a] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100')}
              </label>
            </div>

            {list.length === 0 && (
              <div className="rounded-2xl border border-dashed border-[#cfdadd] bg-white p-6 md:p-10 dark:border-slate-700 dark:bg-slate-900">
                <NoResultsLead term={noResultsTerm} formId="courses_page_no_results">
                  <button type="button" onClick={clearAll} className="text-sm font-bold text-[#005663] hover:underline">Clear filters</button>
                </NoResultsLead>
              </div>
            )}

            <div onClickCapture={onGridClick} className="grid gap-3 md:grid-cols-2 md:gap-5 xl:grid-cols-3">
              {list.slice(0, visible).map((c, i) => (
                <Fragment key={c.id}>
                  {i === BANNER_AFTER && (
                    <div className="md:col-span-2 xl:col-span-3">
                      <PromoBanner placement="course-grid" banner={banner} />
                    </div>
                  )}
                  <div data-pos={i + 1} className="contents">
                    <CourseTile course={c} index={i} layout="grid" location="courses_page" demoHref={DEMO_HREF} priority={i < 3} />
                  </div>
                </Fragment>
              ))}
            </div>

            {/* Every course link stays in the HTML: the ones past "Load more" or
                outside the current filters, as plain hidden links. */}
            <ul hidden>
              {[...list.slice(visible), ...rest].map((c) => (
                <li key={c.id}>
                  <a href={c.url}>{c.title}</a>
                </li>
              ))}
            </ul>

            {list.length > shownCount && (
              <button
                type="button"
                onClick={() => setVisible((v) => v + PAGE_SIZE)}
                className="mt-2 h-[50px] self-center rounded-xl border border-[#cfdadd] bg-white px-7 text-[15px] font-bold text-[#005663] hover:border-[#005663] dark:border-slate-700 dark:bg-slate-900 dark:text-[#5ef0c8]"
              >
                Load more courses ({list.length - shownCount} more)
              </button>
            )}

            <div className="lg:hidden">{counselling}</div>

            <p className="text-center text-sm text-[#4a5c61] dark:text-slate-400">
              Can&apos;t decide?{' '}
              <TrackedCta href={DEMO_HREF} ctaId="book_demo" location="courses_page_footer" className="font-bold text-[#b8531c] hover:underline dark:text-[#f3a57a]">
                Book a free demo class
              </TrackedCta>{' '}
              and meet the trainer first.
            </p>
          </div>
        </div>
      </div>

      {/* ── Mobile filter sheet ── */}
      {sheetOpen && (
        <div className="fixed inset-0 z-[10001] flex items-end bg-[#0d1b1e]/60 md:hidden" onClick={() => setSheetOpen(false)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="filters-title"
            onClick={(e) => e.stopPropagation()}
            className="flex max-h-[88vh] w-full flex-col rounded-t-[20px] bg-white dark:bg-slate-900"
          >
            <div className="flex justify-center pt-2"><span className="h-1 w-10 rounded bg-[#cfdadd]" /></div>
            <div className="flex items-center justify-between border-b border-[#eef2f3] px-4 py-3 dark:border-slate-800">
              <h2 id="filters-title" className="font-heading text-xl font-extrabold text-[#0a3d4a] dark:text-white">Filters</h2>
              <div className="flex items-center gap-2">
                <button type="button" onClick={clearAll} className="text-sm font-bold text-[#b8531c]">Clear all</button>
                <button type="button" onClick={() => setSheetOpen(false)} aria-label="Close filters" className="flex h-11 w-11 items-center justify-center rounded-[10px] text-[#17262a] dark:text-slate-100">
                  <X className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>
            </div>
            <div className="flex flex-1 flex-col gap-5 overflow-y-auto p-4">
              {filterGroups(true)}
              <fieldset className="m-0 border-0 border-t border-[#eef2f3] p-0 pt-4 dark:border-slate-800">
                <legend className={`${legend} float-left w-full`}>Sort by</legend>
                <div className="clear-both flex flex-wrap gap-2">
                  {SORTS.map((s) => {
                    const on = f.sort === s.id;
                    return (
                      <button key={s.id} type="button" aria-pressed={on} className={chip(on)} onClick={() => update({ sort: s.id }, { type: 'sort', value: s.id })}>
                        {s.label}
                      </button>
                    );
                  })}
                </div>
              </fieldset>
            </div>
            <div className="border-t border-[#eef2f3] px-4 pb-5 pt-3 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setSheetOpen(false)}
                className="h-[52px] w-full rounded-xl bg-[#b8531c] font-heading text-base font-extrabold text-white"
              >
                Show {list.length} {list.length === 1 ? 'course' : 'courses'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
