import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { buildPageMetadata } from '@/lib/get-page-seo';
import { prisma } from '@/lib/db';
import { getHomepageSettings } from '@/lib/get-homepage-settings';
import { getCourseUrl } from '@/lib/course-url';
import { excerptDescription } from '@/lib/sanitizeDescription';
import { getBranchSettings } from '@/lib/get-branch-settings';
import {
  Award,
  BadgeCheck,
  BarChart2,
  BookOpen,
  BrainCircuit,
  Briefcase,
  Building,
  Calendar,
  Clock,
  Cloud,
  Code2,
  GraduationCap,
  IndianRupee,
  MessageSquare,
  Monitor,
  Rocket,
  Settings,
  Shield,
  TestTube,
  TrendingUp,
  Users,
  Wifi,
  type LucideIcon,
} from 'lucide-react';
import WpImg from '@/components/WpImg';
import HeroEnrollForm from '@/components/HeroEnrollForm';
import HeroLaptopComposition from '@/components/HeroLaptopComposition';
import CategoryGrid from '@/components/CategoryGrid';
import { siteImages } from '@/lib/wpImages';
import { getCategoryIllustration } from '@/lib/category-illustrations';

// Swap this URL to change the category section background
const CATEGORY_SECTION_BG =
  'https://res.cloudinary.com/dfditihuw/image/upload/f_auto,q_auto/v1784106397/tech_background_nvsdzj.png';

function getCategoryAccent(slug: string): string {
  const map: Record<string, string> = {
    'cloud-computing':          'linear-gradient(90deg, #1e40af, #60a5fa)',
    'devops-multi-cloud':       'linear-gradient(90deg, #0f766e, #2dd4bf)',
    'data-analytics-bi':        'linear-gradient(90deg, #7c3aed, #a78bfa)',
    'data-engineering':         'linear-gradient(90deg, #0369a1, #38bdf8)',
    'programming-full-stack':   'linear-gradient(90deg, #b45309, #fbbf24)',
    'cyber-security':           'linear-gradient(90deg, #065f46, #34d399)',
    'erp-crm-enterprise-tools': 'linear-gradient(90deg, #9f1239, #fb7185)',
    'software-testing-os':      'linear-gradient(90deg, #1d4ed8, #93c5fd)',
    'digital-design':           'linear-gradient(90deg, #be185d, #f472b6)',
    'professional-soft-skills': 'linear-gradient(90deg, #92400e, #fcd34d)',
    'human-resource':           'linear-gradient(90deg, #7c3aed, #c4b5fd)',
    'quantum-computing':        'linear-gradient(90deg, #0e7490, #67e8f9)',
    'medical-coding':           'linear-gradient(90deg, #166534, #86efac)',
  }
  return map[slug] ?? 'linear-gradient(90deg, #f97316, #fb923c)'
}

function getCategoryIconBg(slug: string): string {
  const map: Record<string, string> = {
    'cloud-computing':          'rgba(96,165,250,0.15)',
    'devops-multi-cloud':       'rgba(45,212,191,0.15)',
    'data-analytics-bi':        'rgba(167,139,250,0.15)',
    'data-engineering':         'rgba(56,189,248,0.15)',
    'programming-full-stack':   'rgba(251,191,36,0.15)',
    'cyber-security':           'rgba(52,211,153,0.15)',
    'erp-crm-enterprise-tools': 'rgba(251,113,133,0.15)',
    'software-testing-os':      'rgba(147,197,253,0.15)',
    'digital-design':           'rgba(244,114,182,0.15)',
    'professional-soft-skills': 'rgba(252,211,77,0.15)',
    'human-resource':           'rgba(196,181,253,0.15)',
    'quantum-computing':        'rgba(103,232,249,0.15)',
    'medical-coding':           'rgba(134,239,172,0.15)',
  }
  return map[slug] ?? 'rgba(249,115,22,0.15)'
}

function getCategoryAccentSolid(slug: string): string {
  const map: Record<string, string> = {
    'cloud-computing':          '#2563eb',
    'devops-multi-cloud':       '#0f766e',
    'data-analytics-bi':        '#7c3aed',
    'data-engineering':         '#0284c7',
    'programming-full-stack':   '#d97706',
    'cyber-security':           '#059669',
    'erp-crm-enterprise-tools': '#e11d48',
    'software-testing-os':      '#1d4ed8',
    'digital-design':           '#db2777',
    'professional-soft-skills': '#d97706',
    'human-resource':           '#7c3aed',
    'quantum-computing':        '#0891b2',
    'medical-coding':           '#16a34a',
    'certification':            '#7c3aed',
  }
  return map[slug] ?? '#ea580c'
}

function getCategoryAccentDark(slug: string): string {
  const map: Record<string, string> = {
    'cloud-computing':          '#378ADD',
    'devops-multi-cloud':       '#1D9E75',
    'data-analytics-bi':        '#7F77DD',
    'data-engineering':         '#6366f1',
    'programming-full-stack':   '#D85A30',
    'cyber-security':           '#639922',
    'erp-crm-enterprise-tools': '#E24B4A',
    'software-testing-os':      '#22d3ee',
    'digital-design':           '#D4537E',
    'professional-soft-skills': '#EF9F27',
    'human-resource':           '#7F77DD',
    'quantum-computing':        '#97C459',
    'medical-coding':           '#4ade80',
    'certification':            '#7F77DD',
  }
  return map[slug] ?? '#7F77DD'
}

// Hero laptop composition — floating category tiles. Slugs are locked (match
// CATEGORY_ICONS in CategoryGrid.tsx / CATEGORY_SLUG_MAP in course-url.ts).
const HERO_CATEGORY_TILES: {
  slug: string;
  label: string;
  Icon: LucideIcon;
  accent: string;
  pos: 1 | 2 | 3 | 4 | 5 | 6;
  delay: string;
  entranceDelay: string;
  depth: number;
  mobileHidden?: boolean;
}[] = [
  { slug: 'data-analytics-bi',                 label: 'Data & BI',              Icon: BarChart2,    accent: '#60a5fa', pos: 1, delay: '0s',   entranceDelay: '.45s', depth: 34 },
  { slug: 'cloud-computing',                   label: 'Cloud Computing',        Icon: Cloud,        accent: '#38bdf8', pos: 2, delay: '0.4s', entranceDelay: '.55s', depth: 26 },
  { slug: 'devops-multi-cloud',                label: 'DevOps & Multi-Cloud',   Icon: Settings,     accent: '#2dd4bf', pos: 3, delay: '0.8s', entranceDelay: '.65s', depth: 38, mobileHidden: true },
  { slug: 'artificial-intelligence-training',  label: 'Artificial Intelligence', Icon: BrainCircuit, accent: '#fb923c', pos: 4, delay: '1s',   entranceDelay: '.75s', depth: 30 },
  { slug: 'cyber-security',                    label: 'Cyber Security',         Icon: Shield,       accent: '#e879f9', pos: 5, delay: '1.6s', entranceDelay: '.85s', depth: 24 },
  { slug: 'programming-full-stack',            label: 'Full Stack Development', Icon: Code2,        accent: '#818cf8', pos: 6, delay: '2s',   entranceDelay: '.95s', depth: 32, mobileHidden: true },
];

async function getCategories() {
  try {
    return await prisma.courseCategory.findMany({
      where: { status: 'published' },
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: { select: { courses: { where: { status: 'published' } } } },
      },
    });
  } catch {
    return [];
  }
}

interface Testimonial {
  name: string;
  initials: string;
  role: string;
  stars: number;
  review: string;
  course: string;
  avatarBg: string;
  photoUrl?: string;
}

const testimonials: ReadonlyArray<Testimonial> = [
  {
    name: 'Gopi Krishna',
    initials: 'GK',
    role: 'DevOps Engineer',
    stars: 5,
    review: 'Best institute in Dilsukhnagar with 100% placement assistance. The faculty is experienced and the labs are top-notch. I strongly recommend Coss Cloud Solutions to anyone serious about IT.',
    course: 'DevOps & Cloud',
    avatarBg: 'bg-red-500',
  },
  {
    name: 'Jahnavi S.',
    initials: 'JS',
    role: 'Linux Administrator',
    stars: 5,
    review: 'As someone with minimal Linux exposure, I was hesitant — but Coss Cloud Solutions made everything easy. Well-structured from fundamentals to advanced topics. Practical sessions really solidified my knowledge.',
    course: 'Linux Administration',
    avatarBg: 'bg-gray-600',
  },
  {
    name: 'Nagoju Uma',
    initials: 'NU',
    role: 'Power BI Analyst',
    stars: 5,
    review: 'Excellent institution with quality teaching and a genuinely supportive learning environment. The trainers go above and beyond. Highly recommended for analytics and BI careers.',
    course: 'Power BI & Analytics',
    avatarBg: 'bg-green-700',
  },
  {
    name: 'Shiva Rani',
    initials: 'SR',
    role: 'Data Science Graduate',
    stars: 5,
    review: 'Well experienced faculty, feasible lab timings, and overall completely satisfied. The course structure is clear and industry-relevant. Thank you Coss Cloud Solutions — you changed my career trajectory!',
    course: 'Data Science & AI',
    avatarBg: 'bg-purple-500',
  },
];

const BLOG_GRADIENTS = [
  'linear-gradient(135deg,#1a3a5c,#1e5799)',
  'linear-gradient(135deg,#0a5260,#0d7a8e)',
  'linear-gradient(135deg,#5c2a0a,#b0552a)',
  'linear-gradient(135deg,#1a4a2a,#2e7d32)',
];

async function getHiringPartners() {
  try {
    return await prisma.hiringPartner.findMany({
      where: { isVisible: true },
      orderBy: { sortOrder: 'asc' },
      select: { id: true, name: true, logoUrl: true, altText: true },
    });
  } catch { return []; }
}

export const dynamic = 'force-dynamic';
export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata('home');
}

const CORP_FEATURES: Array<{ Icon: LucideIcon; text: string }> = [
  { Icon: Users,         text: 'Highly experienced, industry-certified faculty.' },
  { Icon: Building,      text: 'Dedicated batches for Hyderabad corporate clients.' },
  { Icon: Award,         text: 'Certified instructor-led training.' },
  { Icon: Clock,         text: 'Flexible class timings to suit your teams.' },
  { Icon: Settings,      text: 'Customised approach with weekend workshops on advanced technologies.' },
  { Icon: MessageSquare, text: 'Programs shaped by in-depth training-needs analysis.' },
];

const CORP_BADGES: Array<{ label: string; Icon: LucideIcon }> = [
  { label: 'SKILLS',        Icon: BookOpen     },
  { label: 'GROWTH',        Icon: Rocket       },
  { label: 'SUCCESS',       Icon: Award        },
  { label: 'TRANSFORMATION',Icon: GraduationCap},
];

const CORP_BOTTOM_BAR: Array<{ Icon: LucideIcon; title: string; desc: string }> = [
  { Icon: Award,  title: 'EXPERT TRAINERS',    desc: 'Industry-leading professionals.'   },
  { Icon: Shield, title: 'PROVEN RESULTS',     desc: 'Impactful training that delivers.' },
  { Icon: Users,  title: 'TAILORED SOLUTIONS', desc: 'Programs designed for your goals.' },
];

const CORP_QR_SRC =
  'https://api.qrserver.com/v1/create-qr-code/?size=88x88&data=https%3A%2F%2Fwa.me%2F918885166007&bgcolor=ffffff&color=083344&margin=4';

async function getFeaturedJobs() {
  try {
    const now = new Date();
    return await prisma.job.findMany({
      where: {
        status: 'active',
        featured: true,
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
      orderBy: { postedAt: 'desc' },
      take: 6,
      select: { id: true, title: true, company: true, category: true, salary: true, mode: true },
    });
  } catch { return []; }
}

async function getUpcomingBatches() {
  try {
    // IST = UTC+5:30; startDate must be today or later (IST midnight)
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000;
    const nowIST = new Date(now.getTime() + istOffset);
    const todayMidnightIST = new Date(
      Date.UTC(nowIST.getUTCFullYear(), nowIST.getUTCMonth(), nowIST.getUTCDate()) - istOffset
    );

    const all = await prisma.batch.findMany({
      where: {
        status: { in: ['upcoming', 'ongoing'] },
        featured: true,
        startDate: { gte: todayMidnightIST },
      },
      include: { course: { select: { title: true, categorySlug: true } } },
      orderBy: { startDate: 'asc' },
      take: 20,
    });

    // Deduplicate: one earliest batch per course
    const seen = new Set<string>();
    const deduped: typeof all = [];
    for (const b of all) {
      if (!seen.has(b.courseId)) {
        seen.add(b.courseId);
        deduped.push(b);
      }
    }
    return deduped.slice(0, 3);
  } catch { return []; }
}

async function getBlogPosts() {
  try {
    const posts = await prisma.blogPost.findMany({
      where: { status: 'published' },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        createdAt: true,
        category: true,
      },
    });
    // Guard against junk slugs (e.g. /blog/a) — require slug length >= 4
    return posts.filter(p => p.slug.length >= 4).slice(0, 3);
  } catch { return []; }
}

export default async function HomePage() {
  const [categories, featuredJobs, upcomingBatches, hpSettings, blogPosts, hiringPartners, branch] = await Promise.all([
    getCategories(),
    getFeaturedJobs(),
    getUpcomingBatches(),
    getHomepageSettings(),
    getBlogPosts(),
    getHiringPartners(),
    getBranchSettings('dilsukhnagar'),
  ]);

  const featuredCourses = hpSettings.showFeaturedCourses && hpSettings.featuredCourseIds.length > 0
    ? await prisma.course.findMany({
        where: { id: { in: hpSettings.featuredCourseIds }, status: 'published' },
      }).then(courses =>
        hpSettings.featuredCourseIds
          .map(id => courses.find(c => c.id === id))
          .filter((c): c is NonNullable<typeof c> => c != null)
      )
    : [];

  return (
    <>
      {/* ── Hero ── */}
      <section className="hero-section" aria-label="Hero">

        {/* Decorative orbs rendered via CSS classes */}
        <div className="hero-orb-right" aria-hidden="true" />
        <div className="hero-orb-left"  aria-hidden="true" />
        <div className="hero-bg-sweep"  aria-hidden="true" />

        {/* Circuit / tech line traces — valid SVG coordinates only */}
        <svg
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 w-full h-full"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="xMidYMid slice"
          style={{ opacity: 0.18, zIndex: 0 }}
        >
          <defs>
            <linearGradient id="hg-teal" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#4fd1c5" stopOpacity="0.9"/>
              <stop offset="100%" stopColor="#4fd1c5" stopOpacity="0"/>
            </linearGradient>
            <linearGradient id="hg-orange" x1="100%" y1="0%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#e47538" stopOpacity="0.9"/>
              <stop offset="100%" stopColor="#e47538" stopOpacity="0"/>
            </linearGradient>
          </defs>
          {/* Left-side teal circuit traces */}
          <g stroke="url(#hg-teal)" strokeWidth="1.4" fill="none">
            <polyline points="0,80 90,80 120,50 300,50" />
            <circle cx="300" cy="50" r="4" fill="#4fd1c5" fillOpacity="0.6" stroke="none" />
            <polyline points="0,180 55,180 85,150 210,150 240,120" />
            <circle cx="210" cy="150" r="3" fill="#4fd1c5" fillOpacity="0.5" stroke="none" />
            <polyline points="0,300 42,300 72,270 180,270" />
            <circle cx="180" cy="270" r="3" fill="#4fd1c5" fillOpacity="0.4" stroke="none" />
          </g>
          {/* Right-side orange circuit traces (fixed pixel coords from right edge ~1200px) */}
          <g stroke="url(#hg-orange)" strokeWidth="1.4" fill="none">
            <polyline points="1200,60 1110,60 1080,90 1080,190" />
            <circle cx="1200" cy="60" r="4" fill="#e47538" fillOpacity="0.6" stroke="none" />
            <polyline points="1200,250 1140,250 1110,220 980,220" />
            <circle cx="1200" cy="250" r="3" fill="#e47538" fillOpacity="0.5" stroke="none" />
          </g>
          {/* Hexagonal accent shapes */}
          <g fill="none" strokeWidth="1.2">
            <polygon stroke="#4fd1c5" strokeOpacity="0.25" points="55,28 77,16 99,28 99,52 77,64 55,52" />
            <polygon stroke="#e47538" strokeOpacity="0.2" points="1090,340 1112,328 1134,340 1134,364 1112,376 1090,364" />
          </g>
          {/* Floating accent dots */}
          <circle cx="420" cy="110" r="2.5" fill="#4fd1c5" fillOpacity="0.5" />
          <circle cx="310" cy="290" r="2" fill="#e47538" fillOpacity="0.45" />
          <circle cx="900" cy="80"  r="3" fill="#4fd1c5" fillOpacity="0.3" />
          <circle cx="760" cy="350" r="2" fill="#fff" fillOpacity="0.2" />
        </svg>

        {/* Flowing wave lines — lower band only, echoes the category section's tech background */}
        <svg
          aria-hidden="true"
          className="hero-wave-lines"
          viewBox="0 0 1200 300"
          preserveAspectRatio="none"
        >
          <path d="M0,170 C150,130 300,210 480,180 C660,150 780,220 960,190 C1080,170 1140,200 1200,180" stroke="rgba(59,130,246,.5)" strokeWidth="1.5" fill="none" />
          <path d="M0,210 C180,250 320,170 500,205 C680,240 820,160 1000,195 C1100,215 1150,190 1200,205" stroke="rgba(168,85,247,.45)" strokeWidth="1.5" fill="none" />
          <path d="M0,255 C200,225 360,275 560,245 C760,215 900,265 1080,240 C1130,232 1170,245 1200,238" stroke="rgba(96,165,250,.25)" strokeWidth="1" fill="none" />
        </svg>

        <div className="hero-inner">

          {/* Left: copy + trust indicators + CTAs */}
          <div>
            <div className="hero-badge" role="text">
              <GraduationCap className="hero-badge-icon" aria-hidden="true" />
              Learn Today. <span className="hero-badge-accent">Get Hired Tomorrow.</span>
            </div>

            <h1 className="hero-title">
              <span className="hero-title-white">Industry-Focused</span><br />
              <span className="hero-title-orange">IT Training</span>{' '}
              <span className="hero-title-white">for</span><br />
              <span className="hero-title-white">Your </span>
              <span className="hero-title-blue">Future</span>
            </h1>

            <p className="hero-desc">
              {hpSettings.heroSubtext}
            </p>

            {/* Trust indicators — labels are admin-editable (stat1-4Label), icons/colors are fixed */}
            <div className="hero-trust-row" aria-label="Why choose us">
              {([
                { Icon: Users,       color: 'orange',  label: hpSettings.stat1Label },
                { Icon: BadgeCheck,  color: 'purple',  label: hpSettings.stat2Label },
                { Icon: Briefcase,   color: 'blue',    label: hpSettings.stat3Label },
                { Icon: TrendingUp,  color: 'emerald', label: hpSettings.stat4Label },
              ]).map(({ Icon, color, label }) => (
                <div key={label} className={`hero-trust-item hero-trust-item-${color}`}>
                  <Icon className="hero-trust-icon" aria-hidden="true" />
                  <span className="hero-trust-label">{label}</span>
                </div>
              ))}
            </div>

            {/* Primary + Secondary CTAs — min 48px tap targets. Scroll to the
                relocated enroll form rather than navigating away from the hero. */}
            <div className="hero-btns">
              <a href="#enroll-form" className="btn-primary hero-cta-primary">
                {hpSettings.heroCTAPrimaryText}
              </a>
              <a href="#enroll-form" className="btn-outline-dark hero-cta-secondary">
                {hpSettings.heroCTASecondaryText}
              </a>
            </div>
          </div>

          {/* Right: laptop composition */}
          <HeroLaptopComposition>
            <div className="hero-ring hero-ring-outer" aria-hidden="true" />
            <div className="hero-ring hero-ring-inner" aria-hidden="true" />
            <div className="hero-laptop-parallax" data-depth="18">
              <div className="hero-laptop-float">
                <Image
                  src="https://res.cloudinary.com/dfditihuw/image/upload/f_auto,q_auto/v1784125790/hero-laptop_h1vcqj.png"
                  alt="Coss Cloud Solutions online learning platform"
                  width={768}
                  height={512}
                  priority
                  sizes="(min-width: 1024px) 500px, (min-width: 600px) 560px, calc(100vw - 40px)"
                  className="hero-laptop-img"
                />
              </div>
            </div>
            {HERO_CATEGORY_TILES.map((tile) => (
              <div
                key={tile.slug}
                className={`hero-cat-tile-wrap hero-cat-tile-${tile.pos}`}
                data-depth={tile.depth}
              >
                <Link
                  href={`/courses/${tile.slug}/`}
                  className={`hero-cat-tile flex flex-col items-center gap-1${tile.mobileHidden ? ' hidden lg:flex' : ''}`}
                  style={{ '--tile-accent': tile.accent, animationDelay: `${tile.entranceDelay}, ${tile.delay}` } as React.CSSProperties}
                >
                  <tile.Icon className="hero-cat-tile-icon" aria-hidden="true" />
                  <span className="hero-cat-tile-label">{tile.label}</span>
                </Link>
              </div>
            ))}
          </HeroLaptopComposition>
        </div>
      </section>

      {/* ── Book Your Free Demo Class (relocated hero enroll form) ── */}
      <section id="enroll-form" className="enroll-form-section" aria-label="Book your free demo class">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <span className="text-orange-400 text-xs font-bold uppercase tracking-widest">Get Started</span>
            <h2 className="text-3xl font-bold text-white mt-2">Book Your Free Demo Class</h2>
            <div className="w-16 h-1 bg-gradient-to-r from-orange-500 to-orange-300 rounded-full mx-auto mt-3" />
          </div>
          <HeroEnrollForm />
        </div>
      </section>

      {/* ── Featured Courses ── */}
      {hpSettings.showFeaturedCourses && featuredCourses.length > 0 && (
        <section className="py-16 bg-gray-50 dark:bg-gray-950" aria-label="Featured courses">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10">
              <span className="text-orange-500 dark:text-orange-400 text-xs font-bold uppercase tracking-widest">
                Featured Courses
              </span>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                {hpSettings.featuredSectionTitle}
              </h2>
              <div className="w-16 h-1 bg-gradient-to-r from-orange-500 to-orange-300 rounded-full mx-auto mt-3" />
              {hpSettings.featuredSectionSubtext && (
                <p className="text-gray-500 dark:text-gray-400 mt-3 max-w-2xl mx-auto">
                  {hpSettings.featuredSectionSubtext}
                </p>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredCourses.slice(0, 6).map((course, index) => {
                const isNew = new Date(course.createdAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
                const isFirst = index === 0;
                const badgeText = isFirst ? 'Most Popular' : isNew ? 'Newly Added' : null;
                const courseUrl = getCourseUrl(course);
                const formattedPrice = course.price != null
                  ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(course.price)
                  : null;
                const cardExcerpt = excerptDescription(course.excerpt || course.description);

                return (
                  <div key={course.id} className="rounded-xl overflow-hidden shadow-md border border-gray-100 dark:border-gray-700 flex flex-col hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border-l-4 border-l-transparent hover:border-l-orange-500">
                    {/* Dark navy header */}
                    <div className="bg-gradient-to-br from-[#0f1f3d] to-[#1a3460] p-5 flex flex-col gap-3 min-h-[140px]">
                      {badgeText && (
                        <span className="self-start bg-orange-500 text-white text-xs font-semibold px-3 py-1 rounded-full shadow-sm">
                          {badgeText}
                        </span>
                      )}
                      <h3 className="text-white font-semibold text-lg leading-snug line-clamp-2">
                        {course.title}
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {course.duration && (
                          <span className="bg-white/10 text-white/90 text-xs px-3 py-1 rounded-full flex items-center gap-1">
                            🕐 {course.duration}
                          </span>
                        )}
                        {course.mode && (
                          <span className="bg-white/10 text-white/90 text-xs px-3 py-1 rounded-full flex items-center gap-1">
                            🏛 {course.mode}
                          </span>
                        )}
                        {course.level && (
                          <span className="bg-white/10 text-white/90 text-xs px-3 py-1 rounded-full flex items-center gap-1">
                            📋 {course.level}
                          </span>
                        )}
                      </div>
                    </div>
                    {/* White body */}
                    <div className="bg-white dark:bg-gray-800 p-5 flex flex-col gap-4 flex-1 border-t border-gray-100 dark:border-gray-700">
                      {cardExcerpt && (
                        <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed line-clamp-3 flex-1">
                          {cardExcerpt}
                        </p>
                      )}
                      <div className="flex items-center justify-between mt-auto pt-2">
                        {formattedPrice ? (
                          <span className="text-gray-900 dark:text-white font-bold text-lg">{formattedPrice}</span>
                        ) : (
                          <span className="text-gray-400 text-sm">Price on request</span>
                        )}
                        <a
                          href={courseUrl}
                          className="bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors whitespace-nowrap shadow-sm hover:shadow-md"
                        >
                          View <span className="sr-only">{course.title} </span>Details →
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ── Course Categories ── */}
      <section
        className="py-20 relative overflow-hidden bg-[#05080f]"
        aria-label="Course categories"
      >
        {/* Animated tech-pattern background */}
        <div className="cat-bg-kenburns" aria-hidden="true">
          <Image
            src={CATEGORY_SECTION_BG}
            alt=""
            fill
            loading="lazy"
            quality={60}
            sizes="100vw"
            className="object-cover"
          />
        </div>
        <div className="cat-bg-orb cat-bg-orb-1" aria-hidden="true" />
        <div className="cat-bg-orb cat-bg-orb-2" aria-hidden="true" />
        {/* Light veil — reveals the image's wave lines/glows, still protects contrast */}
        <div className="absolute inset-0 z-0 bg-[rgba(5,8,15,0.35)] pointer-events-none" aria-hidden="true" />
        {/* Radial darkening behind the header only, for extra heading contrast over the image's bright top region */}
        <div className="cat-bg-header-veil" aria-hidden="true" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <div className="text-orange-400 text-xs font-bold uppercase tracking-widest">30+ Courses Available</div>
            <h2 className="text-3xl font-bold text-white mt-2">Build Skills Employers Demand</h2>
            <div className="w-16 h-1 bg-gradient-to-r from-orange-500 to-orange-300 rounded-full mx-auto mt-3" />
            <p className="text-slate-400 mt-3 max-w-2xl mx-auto text-sm">
              Industry-focused training in Hyderabad — practical labs, expert trainers, real placement outcomes
            </p>
          </div>

          <CategoryGrid
            categories={categories.map((cat) => ({
              slug: cat.slug,
              name: cat.name,
              description: cat.description,
              courseCount: cat._count?.courses ?? 0,
              accentGradient: getCategoryAccent(cat.slug),
              accentSolid: getCategoryAccentSolid(cat.slug),
              accentDark: getCategoryAccentDark(cat.slug),
              iconBg: getCategoryIconBg(cat.slug),
              illustration: getCategoryIllustration(cat.slug),
            }))}
          />

          <div className="mt-12 text-center">
            <Link
              href="/courses/"
              className="inline-flex items-center gap-2 px-8 py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl transition-colors shadow-lg shadow-orange-500/25"
            >
              View All 30+ Courses
            </Link>
          </div>
        </div>
      </section>

      {/* ── Upcoming Batches Widget ── */}
      <section className="section section-light" aria-label="Upcoming batches">
        <div className="section-inner">
          <div className="section-header">
            <div className="section-tag">Training Schedule</div>
            <h2 className="section-title">Batches Starting Soon</h2>
            <div className="w-16 h-1 bg-gradient-to-r from-orange-500 to-orange-300 rounded-full mx-auto mt-3" />
            <p className="section-subtitle">Classroom at Dilsukhnagar &amp; Ameerpet · Online via Zoom</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-4xl mx-auto">
            {upcomingBatches.map((batch) => {
              const d = new Date(batch.startDate);
              const day = d.toLocaleDateString('en-IN', { day: 'numeric' });
              const mon = d.toLocaleDateString('en-IN', { month: 'short' }).toUpperCase();
              const seatsOk = batch.seatsAvailable !== null && batch.seatsAvailable !== undefined;
              return (
                <div key={batch.id} className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 flex gap-4 items-start">
                  <div className="shrink-0 flex flex-col items-center justify-center w-12 h-12 rounded-xl text-white" style={{ background: '#0f766e' }}>
                    <span className="text-base font-extrabold leading-none">{day}</span>
                    <span className="text-[10px] font-bold leading-none">{mon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900 dark:text-white text-sm leading-snug mb-1 truncate">{batch.course.title}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{batch.schedule}</p>
                    {batch.mode === 'Online' ? (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-green-600 dark:text-green-400">
                        <Wifi className="w-3 h-3" aria-hidden="true" /> Unlimited
                      </span>
                    ) : seatsOk ? (
                      <span className="text-xs font-bold" style={{ color: (batch.seatsAvailable ?? 0) <= 3 ? '#dc2626' : (batch.seatsAvailable ?? 0) <= 6 ? '#d97706' : '#16a34a' }}>
                        {batch.seatsAvailable} seats left
                      </span>
                    ) : null}
                  </div>
                </div>
              );
            })}
            {/* Fallback card when fewer than 3 upcoming batches */}
            {upcomingBatches.length < 3 && (
              <Link
                href="/batches"
                className="rounded-2xl border-2 border-dashed border-teal-300 dark:border-teal-700 bg-white dark:bg-gray-800 p-5 flex flex-col items-center justify-center gap-2 text-center hover:border-teal-500 transition-colors"
              >
                <Calendar className="w-7 h-7 text-teal-600 dark:text-teal-400" aria-hidden="true" />
                <p className="font-semibold text-gray-800 dark:text-gray-100 text-sm">New batches announced weekly</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Call <strong>+91 88851 66007</strong> to reserve your seat</p>
              </Link>
            )}
          </div>
          <div className="center-btn mt-6">
            <Link href="/batches" className="btn-primary" style={{ display: 'inline-flex' }}>
              View all upcoming batches →
            </Link>
          </div>
        </div>
      </section>

      {/* ── Corporate Training (homepage section) ── */}
      <section className="py-16 px-4 md:px-8 relative overflow-hidden" style={{ background: 'linear-gradient(160deg, #061c26 0%, #083344 55%, #0a3d4f 100%)' }}>

        {/* Section-level decorative glows */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full" style={{ background: 'radial-gradient(circle, rgba(79,209,197,0.12), transparent 70%)' }} />
          <div className="absolute -bottom-40 -left-40 w-[400px] h-[400px] rounded-full" style={{ background: 'radial-gradient(circle, rgba(228,117,56,0.10), transparent 70%)' }} />
          {/* Subtle dot-grid */}
          <svg className="absolute inset-0 w-full h-full opacity-[0.055]" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="corp-dots" width="28" height="28" patternUnits="userSpaceOnUse">
                <circle cx="14" cy="14" r="1.2" fill="#4fd1c5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#corp-dots)" />
          </svg>
        </div>

        <div className="max-w-[1100px] mx-auto relative">
          <div className="grid grid-cols-1 lg:grid-cols-[52%_44%] gap-10 items-center">

            {/* ── LEFT — Professional illustrated card ── */}
            <div
              className="rounded-2xl overflow-hidden flex flex-col"
              style={{ border: '1px solid rgba(79,209,197,0.22)', boxShadow: '0 8px 40px rgba(0,0,0,0.35)' }}
            >
              {/* Visual area — CSS/SVG background, no external image */}
              <div
                className="relative overflow-hidden flex flex-col justify-between p-6"
                style={{
                  minHeight: '340px',
                  background: 'linear-gradient(135deg, #071e28 0%, #0c3a4c 55%, #0e4d63 100%)',
                }}
              >
                {/* Decorative circuit-style SVG */}
                <svg aria-hidden="true" className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
                  {/* Grid lines */}
                  <defs>
                    <pattern id="cg" width="48" height="48" patternUnits="userSpaceOnUse">
                      <path d="M 48 0 L 0 0 0 48" fill="none" stroke="#4fd1c5" strokeWidth="0.6" strokeOpacity="0.12"/>
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#cg)" />
                  {/* Circuit traces */}
                  <g stroke="#4fd1c5" strokeWidth="1.5" strokeOpacity="0.18" fill="none">
                    <polyline points="0,80 60,80 80,60 200,60" />
                    <polyline points="200,60 200,30 260,30" />
                    <circle cx="200" cy="60" r="3" fill="#4fd1c5" fillOpacity="0.3" strokeOpacity="0" />
                    <polyline points="0,160 40,160 60,140 160,140 180,120" />
                    <circle cx="160" cy="140" r="3" fill="#4fd1c5" fillOpacity="0.3" strokeOpacity="0" />
                  </g>
                  {/* Bottom-right circuit */}
                  <g stroke="#e47538" strokeWidth="1.5" strokeOpacity="0.15" fill="none">
                    <polyline points="500,320 420,320 400,300 400,260" />
                  </g>
                  {/* Decorative hexagons */}
                  <g fill="none" stroke="#4fd1c5" strokeOpacity="0.1" strokeWidth="1">
                    <polygon points="320,20 340,8 360,20 360,44 340,56 320,44" />
                    <polygon points="280,180 300,168 320,180 320,204 300,216 280,204" />
                  </g>
                </svg>

                {/* Teal glow orb top-right */}
                <div aria-hidden="true" className="absolute -top-16 -right-16 w-56 h-56 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(79,209,197,0.18), transparent 70%)' }} />
                {/* Orange glow orb bottom-left */}
                <div aria-hidden="true" className="absolute -bottom-12 -left-12 w-40 h-40 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(228,117,56,0.15), transparent 70%)' }} />

                {/* Top row: label + logo */}
                <div className="relative flex items-start justify-between z-10">
                  <div
                    className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-bold uppercase tracking-widest"
                    style={{ background: 'rgba(228,117,56,0.15)', border: '1px solid rgba(228,117,56,0.35)', color: '#e47538' }}
                  >
                    <Building className="w-3 h-3" aria-hidden="true" />
                    Corporate Programs
                  </div>
                  <WpImg
                    src={siteImages.logo}
                    alt="Coss Cloud Solutions"
                    style={{
                      height: '36px',
                      width: 'auto',
                      objectFit: 'contain',
                      background: 'rgba(255,255,255,0.9)',
                      borderRadius: '6px',
                      padding: '3px 8px',
                    }}
                  />
                </div>

                {/* Headline */}
                <div className="relative z-10 mt-5">
                  <p
                    className="font-extrabold leading-tight text-white"
                    style={{ fontSize: 'clamp(22px, 3vw, 32px)', textShadow: '0 2px 12px rgba(0,0,0,0.5)' }}
                  >
                    BUILDING SKILLS.<br />
                    <span style={{ color: '#4fd1c5' }}>DRIVING SUCCESS.</span>
                  </p>
                  <div className="mt-2 h-0.5 w-16 rounded-full" style={{ background: 'linear-gradient(to right, #e47538, transparent)' }} />
                </div>

                {/* Badge pills */}
                <div className="relative z-10 mt-4 flex flex-wrap gap-2">
                  {CORP_BADGES.map(({ label, Icon }) => (
                    <span
                      key={label}
                      className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold text-white"
                      style={{ background: 'rgba(79,209,197,0.12)', border: '1px solid rgba(79,209,197,0.3)' }}
                    >
                      <Icon className="w-3 h-3" style={{ color: '#4fd1c5' }} aria-hidden="true" />
                      {label}
                    </span>
                  ))}
                </div>

                {/* QR code — desktop/tablet only; mobile gets a direct WhatsApp link instead */}
                <div className="relative z-10 mt-5 hidden sm:block">
                  <div className="inline-flex flex-col items-center rounded-2xl px-4 py-3" style={{ background: 'white', boxShadow: '0 4px 20px rgba(0,0,0,0.25)' }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={CORP_QR_SRC} alt="Scan QR to WhatsApp" width={96} height={96} loading="lazy" />
                    <div className="flex items-center gap-1.5 mt-2">
                      <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0" fill="#25D366" aria-hidden="true">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.096 3.2 5.077 4.487.71.306 1.263.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                      </svg>
                      <span className="text-xs font-bold" style={{ color: '#083344' }}>Scan to WhatsApp</span>
                    </div>
                  </div>
                </div>

                {/* Mobile-only: direct WhatsApp CTA instead of un-scannable QR */}
                <a
                  href="https://wa.me/918885166007"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="relative z-10 mt-5 sm:hidden inline-flex items-center gap-3 rounded-2xl px-5 py-3 font-bold text-sm"
                  style={{ background: '#25D366', color: '#fff', boxShadow: '0 4px 20px rgba(37,211,102,0.35)' }}
                >
                  <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0" fill="currentColor" aria-hidden="true">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.096 3.2 5.077 4.487.71.306 1.263.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                  Chat on WhatsApp
                </a>
              </div>

              {/* Bottom bar — 3 stat columns */}
              <div
                className="grid grid-cols-3"
                style={{ background: '#05202e', borderTop: '1px solid rgba(79,209,197,0.18)' }}
              >
                {CORP_BOTTOM_BAR.map(({ Icon, title, desc }, i) => (
                  <div
                    key={title}
                    className="p-3 text-center"
                    style={i < 2 ? { borderRight: '1px solid rgba(79,209,197,0.15)' } : undefined}
                  >
                    <Icon className="w-5 h-5 mx-auto mb-1" style={{ color: '#4fd1c5' }} aria-hidden="true" />
                    <p className="text-white font-bold text-xs mb-0.5">{title}</p>
                    <p className="text-xs" style={{ color: '#94a3b8', lineHeight: '1.4' }}>{desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* ── RIGHT — Text Content ── */}
            <div className="flex flex-col justify-center">
              <h2 className="font-extrabold text-white" style={{ fontSize: 'clamp(28px,4vw,40px)' }}>
                Corporate Training
              </h2>

              {/* Orange divider */}
              <div className="h-1 w-14 rounded-full mt-3 mb-3" style={{ background: '#e47538' }} />

              {/* Subheading */}
              <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: '#e47538', letterSpacing: '0.12em' }}>
                Transform Your Workforce Skills
              </p>

              {/* Body copy */}
              <p className="text-sm leading-relaxed mb-6" style={{ color: '#b0cdd6' }}>
                We deliver top-quality training programs meeting client
                organization requirements. Excellent corporate trainers in
                current IT industry within limited budgets.
              </p>

              {/* Features grid — 6 items, 2 cols */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                {CORP_FEATURES.map(({ Icon, text }) => (
                  <div key={text} className="flex items-start gap-3">
                    <div
                      className="p-2 rounded-lg shrink-0 mt-0.5"
                      style={{ background: '#0f4a5c', border: '1px solid rgba(79,209,197,0.2)' }}
                    >
                      <Icon className="w-4 h-4" style={{ color: '#4fd1c5' }} aria-hidden="true" />
                    </div>
                    <span className="text-sm font-semibold leading-snug" style={{ color: '#d1e8ee' }}>
                      {text}
                    </span>
                  </div>
                ))}
              </div>

              {/* CTA Button */}
              <Link
                href="/corporate-training/"
                className="inline-flex items-center justify-center font-bold uppercase tracking-wide rounded-xl mt-7 px-7 py-3 transition-opacity hover:opacity-90"
                style={{ background: '#f5a623', color: '#1a1a2e', width: 'fit-content' }}
              >
                <BarChart2 className="w-4 h-4 mr-2 shrink-0" aria-hidden="true" />
                Start Your Career Today
              </Link>
            </div>
          </div>

        </div>
      </section>

      {/* ── Why Choose Us ── */}
      <section className="wcu-section" aria-label="Why choose us" id="why-choose-us">
        {/* Decorative backgrounds */}
        <div className="wcu-dot-grid" aria-hidden="true" />
        <div className="wcu-wave" aria-hidden="true" />

        <div className="section-inner" style={{ position: 'relative', zIndex: 1 }}>

          {/* ── Header ── */}
          <div className="section-header">
            <div className="section-tag">WHY CHOOSE US</div>
            <h2 className="wcu-heading">
              Everything You Need to{' '}
              <span style={{ color: 'var(--primary)' }}>Succeed</span> in IT
            </h2>
            <div className="w-16 h-1 bg-gradient-to-r from-orange-500 to-orange-300 rounded-full mx-auto mt-3" />
            <p className="section-subtitle">
              Expert instruction, hands-on labs, and end-to-end career support — all under one roof
            </p>
          </div>


          {/* ── Feature Cards ── */}
          <div className="wcu-cards-layout">

            {/* Left — tall featured card */}
            <div className="wcu-featured-card">
              <div className="wcu-feat-icon-wrap" aria-hidden="true">
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <div className="wcu-feat-illustration" aria-hidden="true">
                <svg viewBox="0 0 180 140" fill="none" xmlns="http://www.w3.org/2000/svg" className="wcu-feat-svg">
                  <rect x="20" y="40" width="140" height="85" rx="8" fill="rgba(255,255,255,0.12)" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5"/>
                  <rect x="28" y="50" width="124" height="12" rx="3" fill="rgba(255,255,255,0.18)"/>
                  <rect x="28" y="68" width="56" height="32" rx="4" fill="rgba(228,117,56,0.5)"/>
                  <rect x="92" y="68" width="60" height="14" rx="3" fill="rgba(255,255,255,0.15)"/>
                  <rect x="92" y="86" width="40" height="14" rx="3" fill="rgba(255,255,255,0.10)"/>
                  <rect x="28" y="107" width="124" height="10" rx="3" fill="rgba(255,255,255,0.1)"/>
                  <polygon points="90,8 130,26 90,44 50,26" fill="rgba(255,255,255,0.9)"/>
                  <rect x="122" y="26" width="3" height="18" rx="1.5" fill="rgba(255,255,255,0.7)"/>
                  <ellipse cx="123.5" cy="45" rx="5" ry="4" fill="var(--primary)"/>
                  <path d="M70 35 Q90 44 110 35" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" fill="none"/>
                </svg>
              </div>
              <h3 className="wcu-feat-title">Expert Trainers</h3>
              <div className="wcu-orange-bar" aria-hidden="true" />
              <p className="wcu-feat-desc">
                Learn from certified professionals with real-world experience in top IT companies.
              </p>
              <Link href="/courses/" className="wcu-feat-cta">
                Learn from the Best →
              </Link>
            </div>

            {/* Right — 2×2 + 1 grid */}
            <div className="wcu-right-grid">
              {([
                { Icon: Monitor,      WaterIcon: TestTube,  title: 'Hands-On Labs',        desc: 'Train on real-time projects using industry-standard tools — live lab access included in every course.' },
                { Icon: Calendar,     WaterIcon: Clock,     title: 'Flexible Batches',      desc: 'Weekday, weekend, morning, and evening options — learn without disrupting your current schedule.' },
                { Icon: IndianRupee,  WaterIcon: Briefcase, title: 'Affordable Fees + EMI', desc: 'Premium-quality training at accessible prices, with easy EMI options available.' },
                { Icon: Award,        WaterIcon: Shield,    title: 'Industry Certifications', desc: 'Earn globally recognised AWS, Azure, Google Cloud, and other certifications.' },
                { Icon: Briefcase,    WaterIcon: Users,     title: '100% Placement Support', desc: 'Resume building, mock interviews, and direct connections with 200+ top IT hiring companies.' },
              ] as const).map(({ Icon, WaterIcon, title, desc }) => (
                <div key={title} className="wcu-small-card">
                  <div className="wcu-small-icon-wrap" aria-hidden="true">
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <h4 className="wcu-small-title">{title}</h4>
                  <div className="wcu-orange-bar" aria-hidden="true" />
                  <p className="wcu-small-desc">{desc}</p>
                  <WaterIcon className="wcu-watermark" aria-hidden="true" />
                </div>
              ))}
            </div>
          </div>

          {/* ── Bottom Banner ── */}
          <div className="wcu-banner">
            <div className="wcu-banner-left">
              <div className="wcu-banner-rocket" aria-hidden="true">
                <Rocket className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="wcu-banner-title">Start Your Career Transformation Today</p>
                <p className="wcu-banner-sub">
                  Get the skills, confidence, and support you need to build a successful IT career.
                </p>
              </div>
            </div>
            <div className="wcu-banner-btns">
              <Link href="/courses/" className="wcu-banner-btn-primary">
                Explore Courses →
              </Link>
              <Link href="/contact-us/" className="wcu-banner-btn-outline">
                <MessageSquare className="w-4 h-4" aria-hidden="true" />
                Talk to Counselor
              </Link>
            </div>
          </div>

        </div>
      </section>

      {/* ── Explore Opportunities ── */}
      {hpSettings.showHiringPartners && <section
        className="py-20 px-4 md:px-8 relative overflow-hidden"
        style={{ background: 'linear-gradient(145deg, #0a1628 0%, #0d2237 55%, #091520 100%)' }}
        aria-label="Hiring partners"
      >
        {/* Decorative glows + dot-grid */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-48 left-1/4 w-[480px] h-[480px] rounded-full opacity-[0.09]"
            style={{ background: 'radial-gradient(circle, #14b8a6, transparent 70%)' }} />
          <div className="absolute -bottom-48 right-1/4 w-[400px] h-[400px] rounded-full opacity-[0.07]"
            style={{ background: 'radial-gradient(circle, #3b82f6, transparent 70%)' }} />
          <svg className="absolute inset-0 w-full h-full opacity-[0.04]" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="opp-dots" width="30" height="30" patternUnits="userSpaceOnUse">
                <circle cx="15" cy="15" r="1.2" fill="#14b8a6" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#opp-dots)" />
          </svg>
        </div>

        <div className="max-w-[1100px] mx-auto relative">

          {/* ── Header ── */}
          <div className="text-center mb-10">
            <h2 className="font-extrabold text-white leading-tight" style={{ fontSize: 'clamp(26px,4vw,40px)' }}>
              Our Graduates Get Hired at{' '}
              <span style={{ color: '#2dd4bf' }}>Top Companies</span>
            </h2>
            <div className="w-16 h-1 bg-gradient-to-r from-orange-500 to-orange-300 rounded-full mx-auto mt-3" />
            <p className="mt-3 text-sm max-w-lg mx-auto" style={{ color: '#94a3b8' }}>
              From resume prep to mock interviews — we connect you directly with recruiters.
              5,000+ alumni now work at companies like these.
            </p>
          </div>

          {/* ── Logo grid — white cards on dark bg so original logo colours show ── */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {hiringPartners.map((partner) => (
              <div
                key={partner.id}
                title={partner.name}
                className="flex items-center justify-center h-[76px] px-4 rounded-xl bg-white transition-all duration-200 hover:-translate-y-1 cursor-default"
                style={{ boxShadow: '0 2px 10px rgba(0,0,0,0.18)' }}
              >
                {partner.logoUrl ? (
                  <WpImg
                    src={partner.logoUrl}
                    alt={partner.altText || partner.name}
                    style={{
                      maxHeight: '40px',
                      width: 'auto',
                      maxWidth: '108px',
                      objectFit: 'contain',
                    }}
                  />
                ) : (
                  <span className="text-sm font-bold text-center text-gray-700">
                    {partner.name}
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* ── Conversion CTA ── */}
          <div className="mt-12 text-center">
            <p className="text-sm mb-5" style={{ color: '#94a3b8' }}>
              Ready to land your name on this list?
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/free-demo-class/"
                className="inline-flex items-center gap-2 rounded-xl px-8 py-4 font-bold text-sm transition-all hover:opacity-90 hover:-translate-y-0.5"
                style={{ background: 'linear-gradient(135deg, #e47538 0%, #f5a623 100%)', color: '#fff', boxShadow: '0 4px 20px rgba(228,117,56,0.4)' }}
              >
                <Rocket className="w-4 h-4" aria-hidden="true" />
                Start Your IT Career — Book Free Demo Class
              </Link>
              <Link
                href="/placements/"
                className="inline-flex items-center gap-2 rounded-xl px-6 py-4 font-semibold text-sm transition-all hover:bg-white/10"
                style={{ color: '#2dd4bf', border: '1px solid rgba(45,212,191,0.3)' }}
              >
                View Placement Stories →
              </Link>
            </div>
            <p className="text-xs mt-4" style={{ color: '#94a3b8' }}>
              No fees · No commitment · Just one free class
            </p>
          </div>

        </div>
      </section>}

      {/* ── Latest Jobs Widget — only shown when >= 3 active featured jobs ── */}
      {featuredJobs.length >= 3 && (
        <section className="section section-white" aria-label="Job openings">
          <div className="section-inner">
            <div className="section-header">
              <div className="section-tag">Placement Board</div>
              <h2 className="section-title">Jobs Our Students Get Hired For</h2>
              <div className="w-16 h-1 bg-gradient-to-r from-orange-500 to-orange-300 rounded-full mx-auto mt-3" />
              <p className="section-subtitle">Partner companies actively hiring in Hyderabad</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-4xl mx-auto">
              {featuredJobs.map((job) => {
                const color = '#0f766e';
                const initial = job.company.trim()[0]?.toUpperCase() ?? '?';
                return (
                  <Link
                    key={job.id}
                    href="/jobs"
                    className="flex items-center gap-4 p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:shadow-md transition-shadow"
                    style={{ textDecoration: 'none' }}
                  >
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold shrink-0" style={{ background: color }}>
                      {initial}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">{job.title}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{job.company}</p>
                    </div>
                    {job.salary && (
                      <span className="text-xs font-bold text-teal-600 dark:text-teal-400 shrink-0">{job.salary}</span>
                    )}
                    <span className="text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 shrink-0">{job.category}</span>
                  </Link>
                );
              })}
            </div>
            <div className="center-btn mt-6">
              <Link href="/jobs" className="btn-primary" style={{ display: 'inline-flex' }}>
                View all job openings →
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ── Testimonials ── */}
      {hpSettings.showTestimonials && <section className="section section-light" aria-label="Student testimonials">
        <div className="section-inner">
          <div className="section-header">
            <div className="section-tag">Student Reviews</div>
            <h2 className="section-title">What Our Students Say</h2>
            <div className="w-24 h-0.5 bg-teal-500 mx-auto mt-3 mb-3" aria-hidden="true" />
            {/* Aggregate rating — sourced from BranchSettings (Dilsukhnagar) */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '4px' }}>
              <span className="css-stars" aria-label={`${branch.aggregateRating.toFixed(1)} out of 5 stars`} role="img">★★★★★</span>
              <span style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
                {branch.aggregateRating.toFixed(1)} / 5 —{' '}
                {branch.reviewCount > 0
                  ? `${branch.reviewCount.toLocaleString('en-IN')}+`
                  : '1,200+'
                } Google Reviews
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {testimonials.map((t) => (
              <article key={t.name} className="testimonial-card-v2" aria-label={`Review by ${t.name}`}>
                {/* Header */}
                <div className="testimonial-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                    {t.photoUrl !== undefined ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={t.photoUrl} alt={t.name} width={40} height={40} className="w-10 h-10 rounded-full object-cover shrink-0" loading="lazy" />
                    ) : (
                      <div className={`${t.avatarBg} w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0`} aria-hidden="true">
                        {t.initials}
                      </div>
                    )}
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.name}</p>
                      <p style={{ fontSize: '12px', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.role}</p>
                    </div>
                  </div>
                  {/* Google G */}
                  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" style={{ flexShrink: 0 }}>
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                </div>

                {/* CSS-only star rating */}
                <div className="css-stars" style={{ marginTop: '12px' }} aria-label={`${t.stars} out of 5 stars`} role="img">
                  {'★'.repeat(t.stars)}
                </div>

                <p className="testimonial-text">&quot;{t.review}&quot;</p>

                <span className="testimonial-course-badge">{t.course}</span>
              </article>
            ))}
          </div>

          <div className="center-btn">
            <Link href="/student-reviews/" style={{ color: 'var(--primary)', fontFamily: 'Poppins,sans-serif', fontWeight: 600, fontSize: '14px', border: '2px solid var(--primary)', padding: '11px 26px', borderRadius: '6px', display: 'inline-block' }}>
              Read All Reviews →
            </Link>
          </div>
        </div>
      </section>}

      {/* ── Blog / Resources ── */}
      <section className="section section-white" aria-label="Latest blog posts">
        <div className="section-inner">
          <div className="section-header">
            <div className="section-tag">Resources</div>
            <h2 className="section-title">Latest From Our Blog</h2>
            <div className="w-16 h-1 bg-gradient-to-r from-orange-500 to-orange-300 rounded-full mx-auto mt-3" />
            <p className="section-subtitle">
              Expert insights, course guides, and career tips from the Coss Cloud Solutions team
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {blogPosts.map((post, i) => {
              const d = new Date(post.createdAt);
              const day = d.getDate().toString().padStart(2, '0');
              const mon = d.toLocaleDateString('en-IN', { month: 'short' }).toUpperCase();
              const gradient = BLOG_GRADIENTS[i % BLOG_GRADIENTS.length];
              return (
                <Link key={post.id} href={`/blog/${post.slug}`} className="blog-card">
                  <div className="blog-card-img" style={{ background: gradient }}>
                    <div className="blog-date-badge" aria-label={`${day} ${mon}`}>
                      <span className="blog-date-day">{day}</span>
                      <span className="blog-date-mon">{mon}</span>
                    </div>
                    <p className="blog-card-brand">Coss Cloud Solutions</p>
                    {post.category && <span className="blog-card-pill">{post.category}</span>}
                  </div>
                  <div className="blog-card-body">
                    <h3>{post.title}</h3>
                    <span className="blog-read-more">Read More →</span>
                  </div>
                </Link>
              );
            })}
          </div>

          <div className="center-btn">
            <Link href="/blog/" className="btn-primary" style={{ display: 'inline-flex' }}>
              View All Posts
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
