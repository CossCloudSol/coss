'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import CallLink from './CallLink';
import HeaderSearch, { MOBILE_SEARCH_ID } from './HeaderSearch';
import { CalendarCheck, ChevronDown, LayoutGrid, Menu, Phone, Search, X } from 'lucide-react';
import { useTheme } from '@/components/ThemeProvider';

const PHONE = '+918885166007';
const PHONE_LABEL = '+91 88851 66007';
const DEMO_HREF = '/free-demo-class';
const MENU_ID = 'explore-menu';

// Fixed widths (em, left-aligned text) on the row's text boxes: when the web
// font swaps in for its metric-matched fallback, text widths change by a few
// px, and flexible boxes would move (layout shift). Fixed boxes don't.
const NAV_LINKS = [
  { label: 'Batches', href: '/batches', width: 'w-[3.9em]' },
  { label: 'Corporate', href: '/corporate-training', width: 'w-[4.7em]' },
  { label: 'Reviews', href: '/student-reviews', width: 'w-[4em]' },
  { label: 'Faculty', href: '/faculty', width: 'w-[3.5em]' },
  { label: 'Placements', href: '/placements', width: 'w-[5.6em]' },
] as const;

/** Mobile drawer links: the main nav plus Blog (Blog is not in the desktop row). */
const DRAWER_LINKS = [...NAV_LINKS, { label: 'Blog', href: '/blog' }] as const;

interface SiteHeaderProps {
  /** Course categories with courses, for the mobile drawer's chips. */
  categories: Array<{ name: string; slug: string; count: number }>;
  /** Server-rendered Explore Courses panel (MegaMenuPanel). */
  megaMenu: ReactNode;
}

/**
 * Header v2 main row: logo, Explore Courses, course search, section links,
 * call, Book Free Demo. Sticks at 64px (the 76px row is sticky at top:-12px,
 * so its height never changes and nothing below it moves). The top strip
 * above it is a separate server component that scrolls away.
 *
 * Breakpoints: ≥1280 full; 1100–1279 narrower search; 1024–1099 search icon;
 * <1024 mobile row (logo, search, call, menu) with a drawer.
 */
export default function SiteHeader({ categories, megaMenu }: SiteHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();
  const headerRef = useRef<HTMLElement>(null);
  const exploreRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const focusFirstOnOpen = useRef(false);

  // Close everything on navigation.
  useEffect(() => {
    setMenuOpen(false);
    setDrawerOpen(false);
    setSearchOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 38);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      const target = e.target as Element;
      if (target.closest?.(`#${MOBILE_SEARCH_ID}`)) return;
      if (headerRef.current && !headerRef.current.contains(target)) {
        setMenuOpen(false);
        setDrawerOpen(false);
      }
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setDrawerOpen(false);
        setSearchOpen(false);
        setMenuOpen((open) => {
          if (open && headerRef.current?.contains(document.activeElement)) exploreRef.current?.focus();
          return false;
        });
      }
      // Ctrl K / ⌘K where the search box is an icon (1024–1099 and phones).
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        const box = headerRef.current?.querySelector<HTMLInputElement>('[data-header-search] input');
        if (!box || box.offsetParent === null) {
          e.preventDefault();
          setSearchOpen(true);
        }
      }
    }
    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  useEffect(() => {
    document.body.style.overflow = drawerOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [drawerOpen]);

  // ArrowDown on the button: focus the first category once the panel is shown.
  useEffect(() => {
    if (menuOpen && focusFirstOnOpen.current) {
      focusFirstOnOpen.current = false;
      categoryLinks()[0]?.focus();
    }
  }, [menuOpen]);

  /* ── Explore Courses menu: hover/focus picks a category; arrows move ── */
  function categoryLinks(): HTMLAnchorElement[] {
    return Array.from(panelRef.current?.querySelectorAll<HTMLAnchorElement>('[data-mega-cat]') ?? []);
  }
  function activate(el: Element | null) {
    const cat = el?.closest<HTMLElement>('[data-mega-cat]')?.dataset.megaCat;
    const root = panelRef.current?.querySelector<HTMLElement>('[data-mega]');
    if (cat && root) root.dataset.active = cat;
  }
  function closeMenu(returnFocus: boolean) {
    setMenuOpen(false);
    if (returnFocus) exploreRef.current?.focus();
  }
  function panelFocusables(): HTMLElement[] {
    return Array.from(panelRef.current?.querySelectorAll<HTMLElement>('a[href], button, input') ?? []).filter((el) => el.offsetParent !== null);
  }
  /** The first focusable after the Explore button that isn't inside the panel. */
  function focusAfterPanel() {
    const all = Array.from(headerRef.current?.querySelectorAll<HTMLElement>('a[href], button, input') ?? []).filter(
      (el) => el.offsetParent !== null && !panelRef.current?.contains(el),
    );
    const i = all.indexOf(exploreRef.current as HTMLElement);
    all[i + 1]?.focus();
  }
  function onExploreKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      focusFirstOnOpen.current = true;
      setMenuOpen(true);
    } else if (e.key === 'Tab' && !e.shiftKey && menuOpen) {
      // The panel sits later in the DOM: Tab goes into it, not past it.
      e.preventDefault();
      categoryLinks()[0]?.focus();
    }
  }
  function onPanelKeyDown(e: React.KeyboardEvent) {
    const target = e.target as HTMLElement;
    if (e.key === 'Escape') {
      e.preventDefault();
      closeMenu(true);
      return;
    }
    if (e.key === 'Tab') {
      const items = panelFocusables();
      if (e.shiftKey && target === items[0]) {
        e.preventDefault();
        exploreRef.current?.focus();
      } else if (!e.shiftKey && target === items[items.length - 1]) {
        e.preventDefault();
        setMenuOpen(false);
        focusAfterPanel();
      }
      return;
    }
    const cats = categoryLinks();
    const i = cats.indexOf(target as HTMLAnchorElement);
    if (i === -1) return;
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      cats[(i + (e.key === 'ArrowDown' ? 1 : cats.length - 1)) % cats.length].focus();
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      panelRef.current?.querySelector<HTMLAnchorElement>(`[data-mega-list="${target.dataset.megaCat}"] a`)?.focus();
    }
  }

  const iconButton =
    'flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] border border-[#cfdadd] bg-white text-[#005663] hover:border-[#005663] dark:border-slate-700 dark:bg-slate-900 dark:text-[#5ef0c8]';

  return (
    <header
      ref={headerRef}
      className={`sticky top-0 z-[1000] border-b border-[#e3eaec] lg:top-[-12px] dark:border-slate-800 ${scrolled ? 'shadow-[0_4px_24px_rgba(0,86,99,0.16)]' : ''}`}
    >
      <div className="relative h-16 bg-white lg:h-[76px] lg:pt-3 dark:bg-slate-950">
        {/* The 64px content box: centred in the 76px row at rest, flush once stuck. */}
        <div className={`mx-auto flex h-16 max-w-[1280px] items-center gap-3 px-4 transition-transform duration-200 xl:gap-4 ${scrolled ? '' : 'lg:-translate-y-1.5'}`}>
          <Link href="/" className="logo-link shrink-0" aria-label="Coss Cloud Solutions — Home">
            {/* priority: on mobile the logo is often the LCP element. */}
            <Image
              src="/logo.png"
              alt="Coss Cloud Solutions"
              width={74}
              height={62}
              priority
              className="h-[48px] w-auto lg:h-[54px]"
              style={{ objectFit: 'contain', display: 'block' }}
            />
          </Link>

          {/* Explore Courses (≥1024) */}
          <button
            ref={exploreRef}
            type="button"
            aria-expanded={menuOpen}
            aria-controls={MENU_ID}
            onClick={() => setMenuOpen((v) => !v)}
            onKeyDown={onExploreKeyDown}
            className="hidden h-11 w-[134px] shrink-0 items-center gap-2 rounded-[10px] bg-[#e6f0f1] px-3 text-[15px] font-bold text-[#005663] hover:bg-[#d8e9eb] lg:flex min-[1100px]:w-[190px] dark:bg-slate-800 dark:text-[#5ef0c8]"
          >
            <LayoutGrid className="h-[18px] w-[18px]" aria-hidden="true" />
            <span className="min-[1100px]:hidden">Courses</span>
            <span className="hidden min-[1100px]:inline">Explore Courses</span>
            <ChevronDown className={`ml-auto h-4 w-4 transition-transform ${menuOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
          </button>

          {/* Search box (≥1100) */}
          <div data-header-search="" className="hidden min-w-[150px] flex-1 min-[1100px]:block">
            <HeaderSearch placeholder="Search course" className="w-full" />
          </div>

          <nav aria-label="Main navigation" className="ml-auto hidden items-center gap-2.5 lg:flex xl:ml-2 xl:gap-3.5">
            {NAV_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                aria-current={pathname === l.href ? 'page' : undefined}
                className={`${l.width} whitespace-nowrap text-[14px] font-medium text-[#17262a] hover:text-[#b8531c] aria-[current=page]:text-[#b8531c] xl:text-[15px] dark:text-slate-200`}
              >
                {l.label}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex shrink-0 items-center gap-2 lg:ml-0 xl:gap-3">
            {/* Search icon: 1024–1099 and phones */}
            <button
              type="button"
              className={`${iconButton} min-[1100px]:hidden`}
              aria-label="Search courses"
              aria-expanded={searchOpen}
              aria-controls={MOBILE_SEARCH_ID}
              onClick={() => {
                setDrawerOpen(false);
                setSearchOpen(true);
              }}
            >
              <Search className="h-5 w-5" aria-hidden="true" />
            </button>
            <CallLink number={PHONE} aria-label={`Call ${PHONE_LABEL}`} className={iconButton}>
              <Phone className="h-5 w-5" aria-hidden="true" />
              <span className="sr-only">{PHONE_LABEL}</span>
            </CallLink>
            <Link
              href={DEMO_HREF}
              className="hidden h-11 w-[174px] items-center gap-2 whitespace-nowrap rounded-[10px] bg-[#b8531c] px-4 text-[15px] font-bold text-white hover:bg-[#8f3f14] lg:flex"
            >
              <CalendarCheck className="h-[18px] w-[18px]" aria-hidden="true" />
              Book Free Demo
            </Link>
            <button
              type="button"
              className={`${iconButton} !text-[#17262a] lg:hidden dark:!text-slate-100`}
              aria-label={drawerOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={drawerOpen}
              aria-controls="mobile-nav"
              onClick={() => {
                setSearchOpen(false);
                setDrawerOpen((v) => !v);
              }}
            >
              {drawerOpen ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
            </button>
          </div>
        </div>

        {/* ── Explore Courses panel (links always in the HTML) ── */}
        <div
          id={MENU_ID}
          ref={panelRef}
          hidden={!menuOpen}
          onMouseOver={(e) => activate(e.target as Element)}
          onFocus={(e) => activate(e.target as Element)}
          onKeyDown={onPanelKeyDown}
          onBlur={(e) => {
            const next = e.relatedTarget as Node | null;
            if (next && !panelRef.current?.contains(next) && next !== exploreRef.current) setMenuOpen(false);
          }}
          // No display classes here: they would override the hidden attribute.
          className="absolute inset-x-0 top-full px-4"
        >
          <div className="mx-auto max-w-[1248px] overflow-hidden rounded-b-2xl border border-t-0 border-[#e3eaec] bg-white shadow-[0_24px_60px_rgba(0,0,0,0.18)]">
            {megaMenu}
          </div>
        </div>

        {/* ── Mobile drawer ── */}
        <nav
          id="mobile-nav"
          aria-label="Mobile navigation"
          hidden={!drawerOpen}
          className="absolute inset-x-0 top-full max-h-[calc(100dvh-64px)] overflow-y-auto border-t border-[#e3eaec] bg-white shadow-[0_24px_40px_rgba(0,0,0,0.15)] lg:hidden dark:border-slate-800 dark:bg-slate-950"
        >
          <div className="flex flex-col gap-5 p-4 pb-24 md:pb-4">
            <form action="/courses" method="get" role="search" className="flex h-12 items-center gap-2 rounded-xl border border-[#cfdadd] bg-[#f4f7f8] pl-3 pr-1.5 text-[#6b7d82] focus-within:border-[#005663] dark:border-slate-700 dark:bg-slate-900">
              <Search className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
              <label htmlFor="drawer-search" className="sr-only">Search courses</label>
              <input id="drawer-search" type="search" name="q" placeholder="Search course" autoComplete="off" className="field-bare min-w-0 flex-1 border-0 bg-transparent text-base text-[#17262a] outline-none dark:text-slate-100" />
            </form>

            <div>
              <p className="mb-2.5 text-xs font-bold uppercase tracking-[1.2px] text-[#6b7d82]">Explore courses</p>
              <div className="flex flex-wrap gap-2">
                {categories.map((c) => (
                  <Link key={c.slug} href={`/courses/${c.slug}`} className="flex min-h-[44px] items-center rounded-full border border-[#cfdadd] px-4 text-sm text-[#26383d] dark:border-slate-700 dark:text-slate-200">
                    {c.name}
                  </Link>
                ))}
                <Link href="/courses" className="flex min-h-[44px] items-center rounded-full bg-[#e6f0f1] px-4 text-sm font-bold text-[#005663]">
                  All courses
                </Link>
              </div>
            </div>

            <ul className="border-t border-[#eef2f3] dark:border-slate-800">
              {DRAWER_LINKS.map((l) => (
                <li key={l.href} className="border-b border-[#eef2f3] dark:border-slate-800">
                  <Link href={l.href} className="flex min-h-[48px] items-center text-base font-medium text-[#17262a] dark:text-slate-100">
                    {l.label}
                  </Link>
                </li>
              ))}
              <li className="border-b border-[#eef2f3] dark:border-slate-800">
                <button type="button" onClick={toggleTheme} className="flex min-h-[48px] w-full items-center text-base font-medium text-[#17262a] dark:text-slate-100">
                  {theme === 'dark' ? 'Light mode' : 'Dark mode'}
                </button>
              </li>
            </ul>

            <div className="grid grid-cols-2 gap-2.5">
              <CallLink number={PHONE} className="flex h-12 items-center justify-center gap-2 rounded-xl border border-[#cfdadd] font-bold text-[#005663] dark:border-slate-700 dark:text-[#5ef0c8]">
                <Phone className="h-5 w-5" aria-hidden="true" />
                Call
              </CallLink>
              <Link href={DEMO_HREF} className="flex h-12 items-center justify-center gap-2 rounded-xl bg-[#b8531c] font-bold text-white">
                <CalendarCheck className="h-5 w-5" aria-hidden="true" />
                Book Free Demo
              </Link>
            </div>
          </div>
        </nav>
      </div>

      {searchOpen && <HeaderSearch variant="overlay" onClose={() => setSearchOpen(false)} />}
    </header>
  );
}
