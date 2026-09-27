'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import CallLink from './CallLink';
import HeaderSearch from './HeaderSearch';
import { PLACEMENT_PROVIDERS_CONFIRMED } from '@/lib/career-support';
import {
  Award,
  Briefcase,
  Building2,
  Calendar,
  CalendarCheck,
  ChevronDown,
  Home,
  LayoutGrid,
  Menu,
  MessageSquareQuote,
  Newspaper,
  Phone,
  Search,
  Users,
  X,
} from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';
import { useTheme } from '@/components/ThemeProvider';

const PHONE = '+918885166007';
const PHONE_LABEL = '+91 88851 66007';
const DEMO_HREF = '/free-demo-class';

/** Second-row shortcuts to the four biggest course areas (shown when the category exists). */
const FEATURED_CATEGORIES = [
  { label: 'Cloud & DevOps', slug: 'cloud-computing' },
  { label: 'AI & Data', slug: 'data-analytics-bi' },
  { label: 'Cyber Security', slug: 'cyber-security' },
  { label: 'Full Stack', slug: 'programming-full-stack' },
] as const;

const SECONDARY_LINKS = [
  { label: 'Batches', href: '/batches', icon: Calendar },
  { label: 'Corporate', href: '/corporate-training', icon: Building2 },
  { label: 'Placements', href: '/placements', icon: Briefcase },
  { label: 'Reviews', href: '/student-reviews', icon: MessageSquareQuote },
  { label: 'Blog', href: '/blog', icon: Newspaper },
] as const;

const aboutLinks = [
  { label: 'About Us', href: '/about-us' },
  { label: 'Why Us', href: '/why-us' },
  { label: 'Certification', href: '/certification' },
];

interface SiteHeaderProps {
  /** Published course categories, fetched (cached) by the root layout. */
  categories: Array<{ name: string; slug: string }>;
}

export default function SiteHeader({ categories }: SiteHeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [coursesOpen, setCoursesOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const courses = categories.map((c) => ({ label: c.name, href: `/courses/${c.slug}` }));
  const categorySlugs = new Set(categories.map((c) => c.slug));
  const featured = FEATURED_CATEGORIES.filter((c) => categorySlugs.has(c.slug));

  const { theme, toggleTheme } = useTheme();
  const headerRef = useRef<HTMLElement>(null);

  /* ── Scroll-shadow effect ── */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  /* ── Close on outside click ── */
  useEffect(() => {
    function handleOutsideClick(e: MouseEvent) {
      if (headerRef.current && !headerRef.current.contains(e.target as Node)) {
        setMobileOpen(false);
        setSearchOpen(false);
        setCoursesOpen(false);
        setAboutOpen(false);
      }
    }
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  /* ── Escape closes the mobile drawer and search ── */
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setMobileOpen(false);
        setSearchOpen(false);
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  /* ── Body scroll lock while drawer is open ── */
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  function closeAll() {
    setMobileOpen(false);
    setSearchOpen(false);
    setCoursesOpen(false);
    setAboutOpen(false);
  }

  const iconButton =
    'flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] border border-[#cfdadd] bg-white text-[#005663] dark:border-slate-700 dark:bg-slate-900 dark:text-[#5ef0c8]';
  const rowLink = 'whitespace-nowrap text-[15px] font-medium text-[#17262a] hover:text-[#b8531c] dark:text-slate-200 dark:hover:text-[#f3a57a]';

  return (
    <header
      ref={headerRef}
      className={`site-header${scrolled ? ' header-scrolled' : ''}`}
      style={{ zIndex: 9999 }}
    >
      {/* ── Row 1: logo, search, phone, Book Free Demo ─────────────────── */}
      <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between gap-4 px-4 lg:h-[76px]">
        <Link href="/" className="logo-link" onClick={closeAll} aria-label="Coss Cloud Solutions — Home">
          {/* width/height match the rendered size (547:456 aspect) so next/image's
              srcset stays 96w/256w. priority: on mobile the logo is often the LCP
              element and was lazy-loaded before (PSI: 1.3 s load delay). */}
          <Image
            src="/logo.png"
            alt="Coss Cloud Solutions"
            width={74}
            height={62}
            priority
            className="h-[52px] w-auto lg:h-[62px]"
            style={{ objectFit: 'contain', display: 'block' }}
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              const fb = e.currentTarget.nextElementSibling as HTMLElement | null;
              if (fb) fb.style.display = 'flex';
            }}
          />
          {/* Text fallback */}
          <span style={{ display: 'none', alignItems: 'center', gap: '8px' }}>
            <span className="logo-icon">C</span>
            <span className="logo-text">
              <span className="logo-name">Coss</span>
              <span className="logo-sub">Cloud Solutions</span>
            </span>
          </span>
        </Link>

        <HeaderSearch className="mx-4 hidden max-w-[520px] flex-1 lg:flex" />

        <div className="hidden shrink-0 items-center gap-3 lg:flex">
          <CallLink
            number={PHONE}
            className="flex h-11 items-center gap-2 rounded-[10px] border border-[#cfdadd] px-4 text-[15px] font-bold text-[#005663] hover:border-[#005663] dark:border-slate-700 dark:text-[#5ef0c8]"
          >
            <Phone className="h-[18px] w-[18px]" aria-hidden="true" />
            {PHONE_LABEL}
          </CallLink>
          <Link
            href={DEMO_HREF}
            onClick={closeAll}
            className="flex h-11 items-center gap-2 rounded-[10px] bg-[#b8531c] px-[18px] text-[15px] font-bold text-white hover:bg-[#8f3f14]"
          >
            <CalendarCheck className="h-[18px] w-[18px]" aria-hidden="true" />
            Book Free Demo
          </Link>
          <ThemeToggle />
        </div>

        {/* Mobile: search, call, menu */}
        <div className="flex shrink-0 items-center gap-2 lg:hidden">
          <button
            type="button"
            className={iconButton}
            aria-label={searchOpen ? 'Close search' : 'Search courses'}
            aria-expanded={searchOpen}
            aria-controls="mobile-search"
            onClick={() => {
              setMobileOpen(false);
              setSearchOpen((v) => !v);
            }}
          >
            {searchOpen ? <X className="h-5 w-5" aria-hidden="true" /> : <Search className="h-5 w-5" aria-hidden="true" />}
          </button>
          <CallLink number={PHONE} aria-label="Call us" className={iconButton}>
            <Phone className="h-5 w-5" aria-hidden="true" />
          </CallLink>
          <button
            type="button"
            className={`${iconButton} !text-[#17262a] dark:!text-slate-100`}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
            aria-controls="mobile-nav"
            onClick={() => {
              setSearchOpen(false);
              setMobileOpen((v) => !v);
            }}
          >
            {mobileOpen ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
          </button>
        </div>
      </div>

      {/* ── Row 2 (desktop): course areas, then site sections ──────────── */}
      <nav aria-label="Main navigation" className="hidden border-t border-[#e3eaec] dark:border-slate-800 lg:block">
        <div className="mx-auto flex h-[50px] max-w-[1200px] items-center gap-7 px-4">
          <div className="nav-dropdown-wrap">
            <Link href="/courses" className="flex items-center gap-1.5 whitespace-nowrap text-[15px] font-bold text-[#005663] dark:text-[#5ef0c8]">
              <Menu className="h-[18px] w-[18px]" aria-hidden="true" />
              All Courses
              <ChevronDown className="nav-chevron h-4 w-4" aria-hidden="true" />
            </Link>
            <div className="nav-dropdown">
              <div className="nav-dropdown-header">All Course Categories</div>
              {courses.map((c) => (
                <Link key={c.href} href={c.href} className="dropdown-item" onClick={closeAll}>
                  {c.label}
                </Link>
              ))}
              <Link href="/courses" className="dropdown-item font-bold" onClick={closeAll}>
                View all courses →
              </Link>
            </div>
          </div>
          {featured.map((c) => (
            <Link key={c.slug} href={`/courses/${c.slug}`} className={rowLink} onClick={closeAll}>
              {c.label}
            </Link>
          ))}
          <span className="flex-1" />
          {SECONDARY_LINKS.map((l) => (
            <Link key={l.href} href={l.href} className={rowLink} onClick={closeAll}>
              {l.label}
            </Link>
          ))}
        </div>
      </nav>

      {/* ── Mobile search ─────────────────────────────────────────────── */}
      {searchOpen && (
        <div id="mobile-search" className="border-t border-[#e3eaec] bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900 lg:hidden">
          <HeaderSearch autoFocus shortcut={false} className="w-full" />
        </div>
      )}

      {/* ── Mobile Menu ───────────────────────────────────────────────── */}
      <nav
        id="mobile-nav"
        className={`mobile-nav lg:hidden${mobileOpen ? ' mobile-nav--open' : ''}`}
        aria-hidden={!mobileOpen}
        aria-label="Mobile navigation"
        inert={!mobileOpen || undefined}
      >
        <CallLink number={PHONE} className="mobile-phone-strip">
          <Phone className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>{PHONE_LABEL} — Call us now!</span>
        </CallLink>

        <Link href="/" className="mobile-nav-item" onClick={closeAll}>
          <span className="mobile-nav-item-inner">
            <Home className="w-4 h-4 shrink-0" aria-hidden="true" />Home
          </span>
        </Link>

        {/* Courses accordion */}
        <button
          className="mobile-nav-item mobile-acc-label"
          aria-expanded={coursesOpen}
          onClick={() => setCoursesOpen((prev) => !prev)}
        >
          <span className="mobile-nav-item-inner">
            <LayoutGrid className="w-4 h-4 shrink-0" aria-hidden="true" />All Courses
          </span>
          <ChevronDown
            className="mob-chevron w-4 h-4 shrink-0"
            style={{ transform: coursesOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
            aria-hidden="true"
          />
        </button>
        <div className={`mob-acc-body${coursesOpen ? ' mob-acc-body--open' : ''}`}>
          <Link href="/courses" className="mobile-sub-item" onClick={closeAll}>
            View all courses
          </Link>
          {courses.map((c) => (
            <Link key={c.href} href={c.href} className="mobile-sub-item" onClick={closeAll}>
              {c.label}
            </Link>
          ))}
        </div>

        {SECONDARY_LINKS.map(({ label, href, icon: Icon }) => (
          <Link key={href} href={href} className="mobile-nav-item" onClick={closeAll}>
            <span className="mobile-nav-item-inner">
              <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />{label}
            </span>
          </Link>
        ))}

        {/* Jobs — hidden until hiring partners are confirmed */}
        {PLACEMENT_PROVIDERS_CONFIRMED && (
          <Link href="/jobs" className="mobile-nav-item" onClick={closeAll}>
            <span className="mobile-nav-item-inner">
              <Briefcase className="w-4 h-4 shrink-0" aria-hidden="true" />Jobs
            </span>
          </Link>
        )}

        {/* About accordion */}
        <button
          className="mobile-nav-item mobile-acc-label"
          aria-expanded={aboutOpen}
          onClick={() => setAboutOpen((prev) => !prev)}
        >
          <span className="mobile-nav-item-inner">
            <Users className="w-4 h-4 shrink-0" aria-hidden="true" />About Us
          </span>
          <ChevronDown
            className="mob-chevron w-4 h-4 shrink-0"
            style={{ transform: aboutOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
            aria-hidden="true"
          />
        </button>
        <div className={`mob-acc-body${aboutOpen ? ' mob-acc-body--open' : ''}`}>
          {aboutLinks.map((l) => (
            <Link key={l.href} href={l.href} className="mobile-sub-item" onClick={closeAll}>
              {l.label}
            </Link>
          ))}
        </div>

        {/* Theme toggle (mobile) */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-white/10">
          <span className="text-sm font-medium text-white/70">Theme</span>
          <button
            onClick={toggleTheme}
            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white text-sm px-3 py-1.5 rounded-lg transition"
          >
            {theme === 'dark' ? 'Light mode' : 'Dark mode'}
          </button>
        </div>

        {/* CTA group */}
        <div className="flex flex-col gap-3 px-4 py-4 border-t border-white/10">
          <Link
            href={DEMO_HREF}
            onClick={closeAll}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#b8531c] text-white font-semibold text-base"
          >
            <CalendarCheck className="h-5 w-5" aria-hidden="true" />
            Book Free Demo
          </Link>
          <Link
            href="/enroll-now-with-coss"
            onClick={closeAll}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-white text-white font-semibold text-base"
          >
            <Award className="h-5 w-5" aria-hidden="true" />
            Enroll Now
          </Link>
        </div>
      </nav>
    </header>
  );
}
