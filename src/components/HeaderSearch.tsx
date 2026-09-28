'use client';

import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, Folder, ImageIcon, Search, X } from 'lucide-react';
import {
  formatNextBatch,
  loadSearchIndex,
  searchCourses,
  topCategories,
  type SearchHit,
  type SearchIndex,
} from '@/lib/course-search';
import { trackSearch, trackSearchSelect } from '@/lib/click-tracking';
import NoResultsLead from '@/components/search/NoResultsLead';

export const SEARCH_PLACEHOLDER = 'Search courses: AWS, Python, Cyber Security…';

/** The mobile overlay's element id (the header ignores outside-clicks inside it). */
export const MOBILE_SEARCH_ID = 'mobile-search';

const POPULAR_SEARCHES = ['AWS DevOps', 'Python', 'Data Science', 'Ethical Hacking', 'Azure', 'Salesforce'] as const;
const MAX_COURSES = 4;
const MAX_CATEGORIES = 2;
const DEMO_HREF = '/free-demo-class';

function coursesHref(term: string): string {
  return `/courses?q=${encodeURIComponent(term)}`;
}

interface Option {
  id: string;
  href: string;
}

/** Search state shared by the desktop dropdown and the mobile overlay. */
function useCourseSearch(location: string) {
  const [index, setIndex] = useState<SearchIndex | null>(null);
  const [failed, setFailed] = useState(false);
  const [query, setQuery] = useState('');
  const lastTracked = useRef('');
  const term = query.trim();

  const load = useCallback(() => {
    setFailed(false);
    loadSearchIndex().then(setIndex, () => setFailed(true));
  }, []);

  const hits: SearchHit[] = useMemo(
    () => (index && term.length >= 2 ? searchCourses(index.courses, term) : []),
    [index, term],
  );
  const categories = useMemo(() => (index ? topCategories(hits, index.categories, MAX_CATEGORIES) : []), [hits, index]);

  // GA4 search / search_no_results once typing pauses on a term.
  useEffect(() => {
    if (!index || term.length < 2) return;
    const t = setTimeout(() => {
      if (lastTracked.current === term) return;
      lastTracked.current = term;
      trackSearch(term, hits.length, location);
    }, 1000);
    return () => clearTimeout(t);
  }, [index, term, hits.length, location]);

  return { index, failed, load, query, setQuery, term, hits, categories };
}

function Highlighted({ title, range }: { title: string; range: [number, number] | null }): JSX.Element {
  if (!range) return <>{title}</>;
  return (
    <>
      {title.slice(0, range[0])}
      <mark className="rounded-sm bg-[#fdf0e8] px-px text-[#8f3f14]">{title.slice(range[0], range[1])}</mark>
      {title.slice(range[1])}
    </>
  );
}

const THUMB_FILLS = ['#0a3d4a', '#123f55', '#005663', '#5a3a26'] as const;

/** Suggestions for a settled term: courses, categories, "See all". */
function Suggestions({
  listId,
  term,
  hits,
  categories,
  activeId,
  onSelect,
  showKeys,
}: {
  listId: string;
  term: string;
  hits: SearchHit[];
  categories: SearchIndex['categories'];
  activeId: string | null;
  onSelect: (href: string, position: number) => void;
  showKeys: boolean;
}): JSX.Element {
  const rowBase = 'flex items-center gap-3.5 px-4 py-2.5 md:px-5';
  return (
    <div id={listId} role="listbox" aria-label="Search suggestions">
      <p className="px-4 pb-1.5 pt-3.5 text-xs font-bold tracking-[1.2px] text-[#6b7d82] md:px-5">COURSES</p>
      {hits.slice(0, MAX_COURSES).map((h, i) => {
        const id = `${listId}-c${i}`;
        const date = formatNextBatch(h.course.nextBatch);
        const meta = [h.course.duration, h.course.mode, date ? `Next batch ${date}` : null].filter(Boolean).join(' · ');
        return (
          <div key={h.course.id} id={id} role="option" aria-selected={activeId === id} className={`${rowBase} min-h-[72px] ${activeId === id ? 'bg-[#f4f7f8]' : 'hover:bg-[#f4f7f8]'}`}>
            <Link
              href={h.course.url}
              tabIndex={-1}
              onClick={(e) => {
                e.preventDefault();
                onSelect(h.course.url, i + 1);
              }}
              className="flex min-w-0 flex-1 items-center gap-3.5"
            >
              <span className="relative flex h-[52px] w-[52px] shrink-0 items-center justify-center overflow-hidden rounded-[10px] text-white/80" style={{ background: THUMB_FILLS[i % THUMB_FILLS.length] }}>
                {h.course.thumbnail ? (
                  <Image src={h.course.thumbnail} alt="" fill sizes="52px" className="object-cover" />
                ) : (
                  <ImageIcon className="h-[22px] w-[22px]" aria-hidden="true" />
                )}
              </span>
              <span className="flex min-w-0 flex-col gap-0.5">
                <span className="truncate text-[15px] font-bold text-[#17262a] md:text-base">
                  <Highlighted title={h.course.title} range={h.highlight} />
                </span>
                <span className="truncate text-[13px] text-[#4a5c61]">{meta}</span>
              </span>
            </Link>
            <Link
              href={DEMO_HREF}
              tabIndex={-1}
              onClick={(e) => {
                e.preventDefault();
                onSelect(DEMO_HREF, i + 1);
              }}
              className="flex shrink-0 items-center gap-1 text-[13px] font-bold text-[#b8531c] hover:text-[#8f3f14]"
            >
              Book demo <ArrowRight className="h-[15px] w-[15px]" aria-hidden="true" />
            </Link>
          </div>
        );
      })}
      {categories.length > 0 && (
        <>
          <p className="border-t border-[#eef2f3] px-4 pb-1.5 pt-3.5 text-xs font-bold tracking-[1.2px] text-[#6b7d82] md:px-5">CATEGORIES</p>
          <div className="flex flex-wrap gap-2 px-4 pb-3.5 pt-1.5 md:px-5">
            {categories.map((cat, i) => {
              const id = `${listId}-k${i}`;
              const href = `/courses/${cat.slug}`;
              return (
                <Link
                  key={cat.slug}
                  id={id}
                  role="option"
                  aria-selected={activeId === id}
                  href={href}
                  tabIndex={-1}
                  onClick={(e) => {
                    e.preventDefault();
                    onSelect(href, MAX_COURSES + i + 1);
                  }}
                  className={`flex items-center gap-1.5 rounded-[10px] px-3 py-2 text-sm font-bold text-[#005663] ${activeId === id ? 'bg-[#cfe3e5]' : 'bg-[#e6f0f1] hover:bg-[#d8e9eb]'}`}
                >
                  <Folder className="h-[15px] w-[15px]" aria-hidden="true" />
                  {cat.name} · {cat.count} {cat.count === 1 ? 'course' : 'courses'}
                </Link>
              );
            })}
          </div>
        </>
      )}
      <Link
        id={`${listId}-all`}
        role="option"
        aria-selected={activeId === `${listId}-all`}
        href={coursesHref(term)}
        tabIndex={-1}
        onClick={(e) => {
          e.preventDefault();
          onSelect(coursesHref(term), 0);
        }}
        className={`flex items-center justify-between gap-3 border-t border-[#e3eaec] px-4 py-3.5 text-sm font-bold text-[#005663] md:px-5 ${activeId === `${listId}-all` ? 'bg-[#e6f0f1]' : 'bg-[#f4f7f8] hover:bg-[#eaf1f2]'}`}
      >
        <span>
          See all {hits.length} {hits.length === 1 ? 'result' : 'results'} for &ldquo;{term}&rdquo;
        </span>
        {showKeys && (
          <span className="hidden items-center gap-2 text-xs font-medium text-[#6b7d82] lg:flex">
            <kbd className="rounded-[5px] border border-[#cfdadd] bg-white px-1.5 font-sans">↑↓</kbd>to move
            <kbd className="rounded-[5px] border border-[#cfdadd] bg-white px-1.5 font-sans">Enter</kbd>to open
          </span>
        )}
      </Link>
    </div>
  );
}

function BrowseLinks(): JSX.Element {
  return (
    <p className="text-xs text-[#6b7d82]">
      Or browse: <Link href="/courses?cat=ai-data" className="font-bold text-[#b8531c]">AI &amp; Data</Link> ·{' '}
      <Link href="/courses?cat=cloud-devops" className="font-bold text-[#b8531c]">Cloud</Link> ·{' '}
      <Link href="/courses" className="font-bold text-[#b8531c]">All courses</Link>
    </p>
  );
}

/**
 * Header course search. Desktop: an inline box with a suggestions dropdown
 * (Ctrl K / ⌘K focuses it). Mobile: a full-screen overlay opened from the
 * header's search icon. The index loads on first focus; the form still
 * submits to /courses?q= without JavaScript.
 */
export default function HeaderSearch({
  variant = 'desktop',
  onClose,
  className = '',
}: {
  variant?: 'desktop' | 'overlay';
  /** Overlay only: close it. */
  onClose?: () => void;
  className?: string;
}): JSX.Element {
  const overlay = variant === 'overlay';
  const location = overlay ? 'header_mobile' : 'header';
  const router = useRouter();
  const listId = useId().replace(/:/g, '');
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [focused, setFocused] = useState(false);
  const [active, setActive] = useState(-1);
  const [isMac, setIsMac] = useState(false);
  const { index, failed, load, query, setQuery, term, hits, categories } = useCourseSearch(location);

  const options: Option[] = useMemo(() => {
    if (term.length < 2 || hits.length === 0) return [];
    return [
      ...hits.slice(0, MAX_COURSES).map((h, i) => ({ id: `${listId}-c${i}`, href: h.course.url })),
      ...categories.map((c, i) => ({ id: `${listId}-k${i}`, href: `/courses/${c.slug}` })),
      { id: `${listId}-all`, href: coursesHref(term) },
    ];
  }, [hits, categories, term, listId]);

  useEffect(() => setActive(-1), [term]);

  // Overlay: focus the box, load the index and lock page scroll.
  useEffect(() => {
    if (!overlay) return;
    inputRef.current?.focus();
    load();
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [overlay, load]);

  // Desktop: Ctrl K / ⌘K focuses the box; clicks outside close the dropdown.
  useEffect(() => {
    if (overlay) return;
    setIsMac(/Mac|iPhone|iPad/.test(navigator.platform));
    function onKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }
    }
    function onMouseDown(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setFocused(false);
    }
    window.addEventListener('keydown', onKeyDown);
    document.addEventListener('mousedown', onMouseDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('mousedown', onMouseDown);
    };
  }, [overlay]);

  function go(href: string, position: number) {
    if (term) trackSearchSelect(term, href, position, location);
    setFocused(false);
    inputRef.current?.blur();
    onClose?.();
    router.push(href);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      if (options.length === 0) return;
      e.preventDefault();
      setActive((a) => {
        const next = e.key === 'ArrowDown' ? a + 1 : a - 1;
        return next < -1 ? options.length - 1 : next >= options.length ? -1 : next;
      });
    } else if (e.key === 'Escape') {
      if (overlay) onClose?.();
      else {
        setFocused(false);
        inputRef.current?.blur();
      }
    } else if (e.key === 'Enter' && active >= 0 && options[active]) {
      e.preventDefault();
      const opt = options[active];
      go(opt.href, opt.id.endsWith('-all') ? 0 : active + 1);
    }
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (term.length === 0) return;
    if (index) {
      trackSearch(term, hits.length, location);
    }
    go(coursesHref(term), 0);
  }

  const activeId = active >= 0 ? options[active]?.id ?? null : null;
  const open = overlay || (focused && term.length >= 2);

  const results =
    term.length < 2 ? null : !index ? (
      <p className="px-5 py-6 text-sm text-[#4a5c61]" role="status">
        {failed ? 'Search is unavailable right now. Press Enter to see all courses.' : 'Loading courses…'}
      </p>
    ) : hits.length === 0 ? (
      <div className="p-5">
        <NoResultsLead term={term} formId={`${location}_no_results`} compact>
          <BrowseLinks />
        </NoResultsLead>
      </div>
    ) : (
      <Suggestions listId={listId} term={term} hits={hits} categories={categories} activeId={activeId} onSelect={go} showKeys={!overlay} />
    );

  const input = (
    <input
      ref={inputRef}
      type="search"
      name="q"
      role="combobox"
      aria-label="Search courses"
      aria-expanded={open && results !== null}
      aria-controls={listId}
      aria-autocomplete="list"
      aria-activedescendant={activeId ?? undefined}
      placeholder={SEARCH_PLACEHOLDER}
      autoComplete="off"
      value={query}
      onChange={(e) => setQuery(e.target.value)}
      onFocus={() => {
        setFocused(true);
        load();
      }}
      onKeyDown={onKeyDown}
      className="field-bare min-w-0 flex-1 border-0 bg-transparent text-base text-[#17262a] outline-none placeholder:text-[#6b7d82] lg:text-[15px] dark:text-slate-100"
    />
  );

  const clearButton = query && (
    <button
      type="button"
      aria-label="Clear search"
      onClick={() => {
        setQuery('');
        inputRef.current?.focus();
      }}
      className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-lg bg-[#f4f7f8] text-[#4a5c61] hover:bg-[#e3eaec]"
    >
      <X className="h-4 w-4" aria-hidden="true" />
    </button>
  );

  if (overlay) {
    // Portalled to <body>: inside the sticky header's stacking context the
    // site's sticky bottom bar and WhatsApp button would sit on top of it.
    return createPortal(
      <div id={MOBILE_SEARCH_ID} role="dialog" aria-modal="true" aria-label="Search courses" className="fixed inset-0 z-[10001] flex flex-col bg-white lg:hidden dark:bg-slate-900">
        <form action="/courses" method="get" role="search" onSubmit={onSubmit} className="flex h-16 shrink-0 items-center gap-2 border-b border-[#e3eaec] px-3 dark:border-slate-800">
          <button type="button" onClick={onClose} aria-label="Close search" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] text-[#17262a] dark:text-slate-100">
            <ArrowLeft className="h-5 w-5" aria-hidden="true" />
          </button>
          <div className="flex h-12 min-w-0 flex-1 items-center gap-2 rounded-xl border-2 border-[#005663] pl-3 pr-1.5 text-[#005663]">
            <Search className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
            {input}
            {clearButton}
          </div>
        </form>
        <div ref={wrapRef} className="flex-1 overflow-y-auto">
          {results ?? (
            <div className="flex flex-col gap-3 p-4">
              <p className="text-xs font-bold tracking-[1.2px] text-[#6b7d82]">POPULAR SEARCHES</p>
              <div className="flex flex-wrap gap-2">
                {POPULAR_SEARCHES.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => {
                      setQuery(t);
                      inputRef.current?.focus();
                    }}
                    className="h-10 rounded-full border border-[#cfdadd] px-4 text-sm text-[#26383d] dark:border-slate-700 dark:text-slate-200"
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>,
      document.body,
    );
  }

  return (
    <div ref={wrapRef} className={`relative ${className}`}>
      <form
        action="/courses"
        method="get"
        role="search"
        aria-label="Search courses"
        onSubmit={onSubmit}
        className={`flex h-[46px] w-full items-center gap-2.5 rounded-xl border bg-[#f4f7f8] pl-4 pr-1.5 text-[#6b7d82] dark:bg-slate-800 dark:text-slate-400 ${
          open ? 'border-2 border-[#005663] bg-white dark:bg-slate-900' : 'border-[#cfdadd] dark:border-slate-700'
        }`}
      >
        <Search className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
        {input}
        {clearButton || (
          <kbd className="hidden shrink-0 rounded-md border border-[#cfdadd] bg-white px-1.5 py-0.5 font-sans text-[11px] font-bold text-[#6b7d82] xl:inline dark:border-slate-600 dark:bg-slate-900">
            {isMac ? '⌘K' : 'Ctrl K'}
          </kbd>
        )}
      </form>
      {open && results && (
        <div className="absolute left-0 top-[calc(100%+8px)] z-50 w-[min(640px,calc(100vw-32px))] overflow-hidden rounded-2xl bg-white shadow-[0_24px_60px_rgba(0,0,0,0.25)] ring-1 ring-black/5">
          {results}
        </div>
      )}
    </div>
  );
}
