'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
  Moon,
  PenLine,
  Phone,
  Sun,
  Users,
  X,
} from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';
import { useTheme } from '@/components/ThemeProvider';

const aboutLinks = [
  { label: 'About Us',       href: '/about-us/' },
  { label: 'Why Us',         href: '/why-us/' },
  { label: 'Student Reviews', href: '/student-reviews/' },
  { label: 'Blogs',          href: '/blog/' },
];

export default function SiteHeader() {
  const [mobileOpen,  setMobileOpen]  = useState(false);
  const [coursesOpen, setCoursesOpen] = useState(false);
  const [aboutOpen,   setAboutOpen]   = useState(false);
  const [scrolled,    setScrolled]    = useState(false);
  const [courses, setCourses] = useState<Array<{ label: string; href: string }>>([]);

  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();

  const headerRef = useRef<HTMLElement>(null);

  /* ── Scroll-shadow effect ── */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  /* ── Fetch categories from DB ── */
  useEffect(() => {
    fetch('/api/categories')
      .then((r) => (r.ok ? r.json() : { categories: [] }))
      .then((data: { categories?: Array<{ name: string; slug: string }> }) => {
        const cats = data.categories ?? [];
        setCourses(cats.map((c) => ({ label: c.name, href: `/courses/${c.slug}/` })));
      })
      .catch(() => {});
  }, []);

  /* ── Close on outside click ── */
  useEffect(() => {
    function handleOutsideClick(e: MouseEvent) {
      if (headerRef.current && !headerRef.current.contains(e.target as Node)) {
        setMobileOpen(false);
        setCoursesOpen(false);
        setAboutOpen(false);
      }
    }
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  /* ── Escape key closes mobile drawer ── */
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && mobileOpen) {
        setMobileOpen(false);
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [mobileOpen]);

  /* ── Body scroll lock while drawer is open ── */
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  function closeAll() {
    setMobileOpen(false);
    setCoursesOpen(false);
    setAboutOpen(false);
  }

  return (
    <header
      ref={headerRef}
      className={`site-header${scrolled ? ' header-scrolled' : ''}`}
      style={{ zIndex: 9999 }}
    >
      {/* ── Main Header ───────────────────────────────────────────────── */}
      <div className="header-inner">
        {/* Logo */}
        <Link href="/" className="logo-link" onClick={closeAll} aria-label="Coss Cloud Solutions — Home">
          <Image
            src="/logo.png"
            alt="Coss Cloud Solutions"
            width={547}
            height={456}
            style={{ height: '62px', width: 'auto', objectFit: 'contain', display: 'block' }}
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

        {/* Desktop Nav */}
        <nav className="desktop-nav" aria-label="Main navigation">
          <Link href="/" className="nav-item" onClick={closeAll}>
            <Home className="nav-item-icon" aria-hidden="true" />Home
          </Link>

          <div className="nav-dropdown-wrap">
            <Link href="/courses/" className="nav-item nav-has-dropdown">
              <LayoutGrid className="nav-item-icon" aria-hidden="true" />
              Courses <ChevronDown className="nav-chevron" aria-hidden="true" />
            </Link>
            <div className="nav-dropdown">
              <div className="nav-dropdown-header">All Course Categories</div>
              {courses.map(c => (
                <Link key={c.href} href={c.href} className="dropdown-item" onClick={closeAll}>
                  {c.label}
                </Link>
              ))}
            </div>
          </div>

          <Link href="/certification/" className="nav-item" onClick={closeAll}>
            <Award className="nav-item-icon" aria-hidden="true" />Certification
          </Link>

          <Link href="/corporate-training/" className="nav-item" onClick={closeAll}>
            <Building2 className="nav-item-icon" aria-hidden="true" />Corporate
          </Link>

          <Link href="/placements/" className="nav-item" onClick={closeAll}>
            <Briefcase className="nav-item-icon" aria-hidden="true" />Placements
          </Link>

          <Link href="/jobs" className="nav-item" onClick={closeAll}>
            <Briefcase className="nav-item-icon" aria-hidden="true" />Jobs
          </Link>

          <Link href="/batches" className="nav-item" onClick={closeAll}>
            <Calendar className="nav-item-icon" aria-hidden="true" />Batches
          </Link>

          <div className="nav-dropdown-wrap">
            <Link href="/about-us/" className="nav-item nav-has-dropdown">
              <Users className="nav-item-icon" aria-hidden="true" />
              About <ChevronDown className="nav-chevron" aria-hidden="true" />
            </Link>
            <div className="nav-dropdown">
              {aboutLinks.map(l => (
                <Link key={l.href} href={l.href} className="dropdown-item" onClick={closeAll}>
                  {l.label}
                </Link>
              ))}
            </div>
          </div>

          {/* ── Conversion CTAs ── */}
          <div className="nav-cta-group" role="group" aria-label="Quick actions">
            <Link href="/free-demo-class/" className="nav-demo" onClick={closeAll}>
              <CalendarCheck className="w-3.5 h-3.5" aria-hidden="true" />
              Free Demo Class
            </Link>
            <Link href="/enroll-now-with-coss/" className="nav-enroll" onClick={closeAll}>
              <PenLine className="w-3.5 h-3.5" aria-hidden="true" />
              Enroll Now
            </Link>
          </div>

          <ThemeToggle />
        </nav>

        {/* Mobile action buttons — Row 1 right side */}
        <div className="lg:hidden flex items-center gap-2 flex-shrink-0">
          {/* Call button */}
          <a
            href="tel:+918885166007"
            aria-label="Call us"
            className="relative flex items-center justify-center w-10 h-10 rounded-full bg-[#f97316] flex-shrink-0"
          >
            <Phone className="w-4 h-4 text-white" aria-hidden="true" />
            <span className="absolute inset-[-3px] rounded-full border-2 border-[#f97316]/35 animate-ping" aria-hidden="true" />
          </a>

          {/* Enroll Now */}
          <Link
            href="/enroll-now-with-coss/"
            onClick={closeAll}
            className="flex items-center gap-1.5 bg-[#024c57] dark:bg-[#03798a] text-white rounded-[10px] px-3 py-2 text-xs font-medium flex-shrink-0"
          >
            <PenLine className="w-3.5 h-3.5" aria-hidden="true" />
            Enroll now
          </Link>

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            aria-label="Toggle dark mode"
            className="flex items-center justify-center w-9 h-9 rounded-full bg-[#f1f5f9] dark:bg-[#161b22] border border-[#e2e8f0] dark:border-[#30363d] flex-shrink-0"
          >
            {theme === 'dark'
              ? <Sun className="w-4 h-4 text-[#8b949e]" aria-hidden="true" />
              : <Moon className="w-4 h-4 text-[#475569]" aria-hidden="true" />}
          </button>

          {/* Hamburger */}
          <button
            className={`flex items-center justify-center w-[38px] h-[38px] rounded-[9px] bg-[#0f172a] dark:bg-[#21262d] dark:border dark:border-[#30363d] flex-shrink-0${mobileOpen ? ' hamburger--open' : ''}`}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
            aria-controls="mobile-nav"
            onClick={() => setMobileOpen(prev => !prev)}
          >
            {mobileOpen
              ? <X className="w-5 h-5 text-white" />
              : <Menu className="w-5 h-5 text-white" />}
          </button>
        </div>
      </div>

      {/* ── Mobile Menu ───────────────────────────────────────────────── */}
      <nav
        id="mobile-nav"
        className={`mobile-nav${mobileOpen ? ' mobile-nav--open' : ''}`}
        aria-hidden={!mobileOpen}
        aria-label="Mobile navigation"
        inert={!mobileOpen || undefined}
      >
        {/* Phone strip inside mobile menu */}
        <a href="tel:+918885166007" className="mobile-phone-strip">
          <Phone className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>+91 88851 66007 — Call us now!</span>
        </a>

        {/* Home */}
        <Link href="/" className="mobile-nav-item" onClick={closeAll}>
          <span className="mobile-nav-item-inner">
            <Home className="w-4 h-4 shrink-0" aria-hidden="true" />Home
          </span>
        </Link>

        {/* Courses accordion */}
        <button
          className="mobile-nav-item mobile-acc-label"
          aria-expanded={coursesOpen}
          onClick={() => setCoursesOpen(prev => !prev)}
        >
          <span className="mobile-nav-item-inner">
            <LayoutGrid className="w-4 h-4 shrink-0" aria-hidden="true" />Courses
          </span>
          <ChevronDown
            className="mob-chevron w-4 h-4 shrink-0"
            style={{ transform: coursesOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
            aria-hidden="true"
          />
        </button>
        <div className={`mob-acc-body${coursesOpen ? ' mob-acc-body--open' : ''}`}>
          {courses.map(c => (
            <Link key={c.href} href={c.href} className="mobile-sub-item" onClick={closeAll}>
              {c.label}
            </Link>
          ))}
        </div>

        {/* Certification */}
        <Link href="/certification/" className="mobile-nav-item" onClick={closeAll}>
          <span className="mobile-nav-item-inner">
            <Award className="w-4 h-4 shrink-0" aria-hidden="true" />Certification
          </span>
        </Link>

        {/* Corporate Training */}
        <Link href="/corporate-training/" className="mobile-nav-item" onClick={closeAll}>
          <span className="mobile-nav-item-inner">
            <Building2 className="w-4 h-4 shrink-0" aria-hidden="true" />Corporate Training
          </span>
        </Link>

        {/* Placements */}
        <Link href="/placements/" className="mobile-nav-item" onClick={closeAll}>
          <span className="mobile-nav-item-inner">
            <Briefcase className="w-4 h-4 shrink-0" aria-hidden="true" />Placements
          </span>
        </Link>

        {/* Jobs */}
        <Link href="/jobs" className="mobile-nav-item" onClick={closeAll}>
          <span className="mobile-nav-item-inner">
            <Briefcase className="w-4 h-4 shrink-0" aria-hidden="true" />Jobs
          </span>
        </Link>

        {/* Batches */}
        <Link href="/batches" className="mobile-nav-item" onClick={closeAll}>
          <span className="mobile-nav-item-inner">
            <Calendar className="w-4 h-4 shrink-0" aria-hidden="true" />Batches
          </span>
        </Link>

        {/* About Us accordion */}
        <button
          className="mobile-nav-item mobile-acc-label"
          aria-expanded={aboutOpen}
          onClick={() => setAboutOpen(prev => !prev)}
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
          {aboutLinks.map(l => (
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
            {theme === 'dark' ? '☀️ Light' : '🌙 Dark'}
          </button>
        </div>

        {/* CTA group */}
        <div className="flex flex-col gap-3 px-4 py-4 border-t border-white/10">
          <a
            href="/free-demo-class"
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-white text-white font-semibold text-base"
          >
            📅 Book Free Demo Class
          </a>
          <a
            href="/enroll-now-with-coss"
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-orange-500 text-white font-semibold text-base"
          >
            ✏️ Enroll Now →
          </a>
        </div>
      </nav>
    </header>
  );
}
