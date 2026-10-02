import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowRight,
  Award,
  Briefcase,
  Building2,
  CalendarCheck,
  CalendarDays,
  CheckCircle2,
  Code2,
  FileText,
  MapPin,
  MessageCircle,
  Mic,
  Monitor,
  Phone,
  Plus,
  Search,
  Send,
  Star,
  Users,
} from 'lucide-react';
import { buildPageMetadata } from '@/lib/get-page-seo';
import { prisma } from '@/lib/db';
import { getHomepageSettings } from '@/lib/get-homepage-settings';
import { formatBatchDate } from '@/lib/batch-utils';
import { getPromoBanners } from '@/lib/promo-banners';
import { getSearchIndex } from '@/lib/course-search-index';
import type { CatalogCourse, SearchIndex } from '@/lib/course-search';
import { getAllPosts } from '@/lib/posts';
import {
  CAREER_SUPPORT_CTA,
  CAREER_SUPPORT_HEADLINE,
  CAREER_SUPPORT_ITEMS,
  PLACEMENT_DISCLAIMER,
  PLACEMENT_PROVIDERS_CONFIRMED,
} from '@/lib/career-support';
import CallLink from '@/components/CallLink';
import WhatsAppLink from '@/components/WhatsAppLink';
import PromoBanner from '@/components/PromoBanner';
import HomeHeroForm from '@/components/home/HomeHeroForm';
import CourseTile, { BANNER_FILLS } from '@/components/courses/CourseTile';
import TrackedCta from '@/components/home/TrackedCta';

/*
 * Homepage built for lead generation (approved mockup "COSS Homepage Mockup"):
 * hero with a course search and the free-demo form, trust bar, popular
 * courses, promo banner slot, batches, how it works, career assistance,
 * reviews, corporate strip, FAQ, latest articles and a final CTA band.
 * Text-only hero (no images) so LCP is the headline. No third-party scripts.
 * GA4 events: form_start / form_submit (hero form), cta_click (every CTA).
 *
 * Allowed claims only: "since 2010", "5,000+ students trained",
 * "50+ hiring partners", "1-year access".
 */

export const revalidate = 86400;
export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata('home');
}

const FORM_ANCHOR = '#enroll-form';
const PHONE = '+918885166007';

const ORANGE_BUTTON = 'bg-[#b8531c] text-white hover:bg-[#8f3f14]';
const EYEBROW = 'text-xs font-bold uppercase tracking-[1.4px] text-[#b8531c] md:text-[13px] dark:text-[#f3a57a]';
const H2 = 'font-heading text-[26px] font-extrabold leading-tight text-[#0a3d4a] md:text-[38px] dark:text-white';
const SECTION = 'px-4 py-10 md:px-8 md:py-20';
const CONTAINER = 'mx-auto max-w-[1200px]';
const CARD = 'rounded-2xl border border-[#e3eaec] bg-white dark:border-slate-700 dark:bg-slate-900';

const POPULAR_SEARCHES = ['AWS DevOps', 'Python Full Stack', 'Data Science', 'Ethical Hacking', 'Azure'] as const;

const HERO_POINTS = [
  { icon: Monitor, text: 'Live trainer-led classes, with recordings and 1-year LMS access' },
  { icon: Code2, text: 'Hands-on labs and real-world projects in every module' },
  { icon: Briefcase, text: 'Career and placement assistance with 50+ hiring partners' },
] as const;

// The Google rating item joins this bar once live Google review data exists (Q5).
const TRUST_ITEMS = [
  { icon: CalendarDays, value: 'Since 2010', label: 'Training in Hyderabad' },
  { icon: Users, value: '5,000+', label: 'Students trained' },
  { icon: Briefcase, value: '50+', label: 'Hiring partners' },
  { icon: MapPin, value: '2 + Online', label: 'Dilsukhnagar · Ameerpet' },
] as const;

const STEPS = [
  { icon: CalendarCheck, title: 'Book a free demo', body: 'Pick a course and leave your number. A counsellor calls or WhatsApps you to fix a slot.' },
  { icon: Users, title: 'Attend the demo, meet your trainer', body: 'Online or at our Dilsukhnagar or Ameerpet branch. See how the class runs before you pay anything.' },
  { icon: CheckCircle2, title: 'Enrol and start learning', body: 'Choose a weekday, weekend or online batch. Recordings and materials come with 1-year access.' },
] as const;

const CAREER_ICONS = { resume: FileText, mock: Mic, prep: Award, referrals: Send } as const;

const FAQS = [
  { q: 'Is the demo class really free?', a: 'Yes. Book a slot, attend one class online or at a branch, and decide after. No payment is needed to book.' },
  { q: 'Can I learn online instead of at a branch?', a: 'Yes. Courses run live online as well as in our Dilsukhnagar and Ameerpet classrooms. Recordings and materials come with 1-year access.' },
  { q: 'Do you help with placements?', a: `Resume building, mock interviews, interview preparation and referrals to our 50+ hiring partners. ${PLACEMENT_DISCLAIMER}` },
  { q: 'How long has Coss Cloud Solutions been training students?', a: 'We have been training IT students in Hyderabad since 2010, with 5,000+ students trained.' },
  { q: 'What batch timings are available?', a: 'Weekday, weekend and online batches. A counsellor shares the next start dates for your course when you book a demo.' },
] as const;

// next/image only optimises this Cloudinary folder (next.config.mjs images.remotePatterns).
const OPTIMISABLE_IMAGE = /^https:\/\/res\.cloudinary\.com\/dfditihuw\//;

/* ── Data ─────────────────────────────────────────────────────────────── */

function todayMidnightIST(): Date {
  const istOffset = 5.5 * 60 * 60 * 1000;
  const nowIST = new Date(Date.now() + istOffset);
  return new Date(Date.UTC(nowIST.getUTCFullYear(), nowIST.getUTCMonth(), nowIST.getUTCDate()) - istOffset);
}

async function getUpcomingBatches() {
  try {
    const all = await prisma.batch.findMany({
      where: { status: { in: ['upcoming', 'ongoing'] }, featured: true, startDate: { gte: todayMidnightIST() } },
      include: { course: { select: { title: true } } },
      orderBy: { startDate: 'asc' },
      take: 20,
    });
    // One earliest batch per course
    const seen = new Set<string>();
    return all.filter((b) => (seen.has(b.courseId) ? false : (seen.add(b.courseId), true))).slice(0, 4);
  } catch {
    return [];
  }
}

async function getReviews() {
  try {
    return await prisma.testimonial.findMany({
      where: { visible: true, scope: 'global' },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
      take: 3,
      select: { id: true, name: true, jobTitle: true, company: true, quote: true, rating: true, reviewDate: true },
    });
  } catch {
    return [];
  }
}

/** Admin-picked popular courses (Homepage manager), else the featured courses. */
function popularCourses(all: CatalogCourse[], ids: string[], useAdminPick: boolean): CatalogCourse[] {
  if (useAdminPick && ids.length > 0) {
    return ids.map((id) => all.find((c) => c.id === id)).filter((c): c is CatalogCourse => c != null).slice(0, 6);
  }
  return all.filter((c) => c.featured).slice(0, 6);
}

interface ArticleCard {
  href: string;
  title: string;
  category: string;
  date: string | null;
  readTime: string | null;
  image: string | null;
}

/**
 * Three newest admin blog posts; topped up from the MDX archive when there
 * are fewer. MDX dates are synthesised display dates, so they aren't shown.
 */
async function getLatestArticles(): Promise<ArticleCard[]> {
  try {
    const rows = await prisma.blogPost.findMany({
      where: { status: 'published' },
      orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
      take: 3,
      select: { slug: true, title: true, category: true, readTime: true, thumbnail: true, publishedAt: true, createdAt: true },
    });
    const cards: ArticleCard[] = rows.map((p) => ({
      href: `/blog/${p.slug}`,
      title: p.title,
      category: p.category || 'Career',
      date: formatBatchDate(p.publishedAt ?? p.createdAt),
      readTime: p.readTime,
      image: p.thumbnail && OPTIMISABLE_IMAGE.test(p.thumbnail) ? p.thumbnail : null,
    }));
    if (cards.length < 3) {
      const mdx = await getAllPosts();
      for (const p of mdx) {
        if (cards.length >= 3) break;
        if (cards.some((c) => c.href === `/blog/${p.slug}`)) continue;
        cards.push({ href: `/blog/${p.slug}`, title: p.frontmatter.title, category: p.frontmatter.categories?.[0] ?? 'Career', date: null, readTime: p.frontmatter.readingTime ?? null, image: null });
      }
    }
    return cards;
  } catch {
    return [];
  }
}

/* ── Page ─────────────────────────────────────────────────────────────── */

export default async function HomePage() {
  const hp = await getHomepageSettings();
  const [index, batches, reviews, articles, homeBanners] = await Promise.all([
    getSearchIndex().catch((): SearchIndex => ({ courses: [], categories: [] })),
    getUpcomingBatches(),
    hp.showTestimonials ? getReviews() : Promise.resolve([]),
    getLatestArticles(),
    getPromoBanners('home'),
  ]);
  const courses = popularCourses(index.courses, hp.featuredCourseIds, hp.showFeaturedCourses);
  const categories = index.categories;
  const courseCount = index.courses.length;

  return (
    <>
      {/* ── Hero: course search + free demo form ── */}
      <section aria-label="Book a free demo class" className="bg-[#0a3d4a] px-4 pb-8 pt-7 md:px-8 md:pb-[72px] md:pt-16">
        <div className={`${CONTAINER} grid gap-4 lg:grid-cols-[minmax(0,1fr)_480px] lg:gap-x-16 lg:gap-y-6`}>
          <div className="flex min-w-0 flex-col gap-4 md:gap-6 lg:col-start-1 lg:row-start-1">
            <p className="inline-flex items-center gap-2 self-start rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium text-[#ffd9c2] md:px-3.5 md:py-2 md:text-sm">
              <MapPin className="h-4 w-4" aria-hidden="true" />
              IT training in Hyderabad · Since 2010
            </p>
            <h1 className="font-heading text-[32px] font-extrabold leading-[1.12] text-white md:text-[54px] md:leading-[1.08]">{hp.heroHeadline}</h1>
            <p className="max-w-[600px] text-base leading-relaxed text-white/85 md:text-[19px] md:leading-[1.6]">{hp.heroSubtext}</p>
            <form action="/courses" method="get" role="search" aria-label="Find a course" className="flex max-w-[640px] flex-col gap-3">
              <div className="flex h-[54px] items-center gap-2 rounded-xl bg-white pl-3.5 pr-1.5 text-[#5f7075] shadow-[0_12px_30px_rgba(0,0,0,0.25)] md:h-[62px] md:rounded-[14px] md:pl-5 md:pr-2">
                <Search className="h-5 w-5 shrink-0 md:h-[22px] md:w-[22px]" aria-hidden="true" />
                <label htmlFor="hero-course-search" className="sr-only">What do you want to learn?</label>
                <input
                  id="hero-course-search"
                  type="search"
                  name="q"
                  placeholder="What do you want to learn? e.g. AWS, Python"
                  autoComplete="off"
                  className="field-bare min-w-0 flex-1 border-0 bg-transparent text-base text-[#17262a] outline-none placeholder:text-[#5f7075] md:text-[17px]"
                />
                <button type="submit" className="flex h-11 shrink-0 items-center gap-2 rounded-[10px] bg-[#005663] px-3 font-bold text-white hover:bg-[#0a3d4a] md:h-12 md:px-[22px]">
                  <Search className="h-5 w-5 md:hidden" aria-hidden="true" />
                  <span className="sr-only md:not-sr-only">Search</span>
                </button>
              </div>
              {/* System font (font-sans): these flowing chips would shift when the web font swaps in. */}
              <div className="flex items-center gap-2 overflow-x-auto font-sans text-[13px] md:flex-wrap md:overflow-visible">
                <span className="hidden shrink-0 text-white/70 md:inline">Popular:</span>
                {POPULAR_SEARCHES.map((term) => (
                  <TrackedCta
                    key={term}
                    href={`/courses?q=${encodeURIComponent(term)}`}
                    ctaId="popular_search"
                    location="hero_search"
                    className="shrink-0 rounded-full border border-white/30 px-3 py-1.5 text-white hover:border-white/70"
                  >
                    {term}
                  </TrackedCta>
                ))}
              </div>
            </form>
          </div>

          <div id="enroll-form" className="mt-2 scroll-mt-40 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:mt-0 lg:self-center">
            <HomeHeroForm />
          </div>

          <ul className="mt-2 flex flex-col gap-2.5 md:gap-3.5 lg:col-start-1 lg:row-start-2 lg:mt-0">
            {HERO_POINTS.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-sm text-white md:text-base">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-[#e47538]/20 text-[#f3a57a] md:h-9 md:w-9">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── Trust bar ── */}
      <section aria-label="Why students trust us" className="border-b border-[#e3eaec] bg-white px-4 py-5 dark:border-slate-800 dark:bg-slate-900 md:px-8 md:py-7">
        <ul className={`${CONTAINER} grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6`}>
          {TRUST_ITEMS.map(({ icon: Icon, value, label }) => (
            <li key={value} className="flex items-center gap-2.5 md:gap-3.5">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-[#e6f0f1] text-[#005663] md:h-12 md:w-12 md:rounded-xl dark:bg-slate-800 dark:text-[#5ef0c8]">
                <Icon className="h-5 w-5 md:h-[22px] md:w-[22px]" aria-hidden="true" />
              </span>
              <span className="flex flex-col">
                <span className="font-heading text-lg font-extrabold text-[#0a3d4a] md:text-[22px] dark:text-white">{value}</span>
                <span className="text-xs text-[#4a5c61] md:text-[13px] dark:text-slate-400">{label}</span>
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* ── Popular courses ── */}
      {courses.length > 0 && (
        <section id="courses" aria-labelledby="popular-title" className="bg-[#f4f7f8] px-4 pb-4 pt-10 dark:bg-slate-950 md:px-8 md:pb-10 md:pt-20">
          <div className={`${CONTAINER} flex flex-col gap-5 md:gap-7`}>
            <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
              <div className="flex flex-col gap-1.5 md:gap-2">
                <p className={EYEBROW}>{hp.featuredSectionTitle}</p>
                <h2 id="popular-title" className={H2}>Start with a course that gets you hired</h2>
              </div>
              <TrackedCta href="/courses" ctaId="all_courses" location="popular_courses" className="hidden items-center gap-1.5 text-[15px] font-bold text-[#b8531c] hover:text-[#8f3f14] md:flex dark:text-[#f3a57a]">
                View all {courseCount > 0 ? `${courseCount} ` : ''}courses <ArrowRight className="h-[18px] w-[18px]" aria-hidden="true" />
              </TrackedCta>
            </div>

            {categories.length > 0 && (
              <nav aria-label="Course categories" className="-mx-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:flex-wrap md:gap-2.5 md:overflow-visible md:px-0">
                <Link href="/courses" className="flex h-[38px] shrink-0 items-center rounded-full bg-[#0a3d4a] px-4 text-[13px] font-bold text-white md:h-10 md:px-[18px] md:text-sm">
                  All
                </Link>
                {categories.slice(0, 6).map((cat) => (
                  <Link
                    key={cat.slug}
                    href={`/courses/${cat.slug}`}
                    className="flex h-[38px] shrink-0 items-center rounded-full border border-[#cfdadd] bg-white px-4 text-[13px] text-[#26383d] hover:border-[#005663] md:h-10 md:px-[18px] md:text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                  >
                    {cat.name}
                  </Link>
                ))}
              </nav>
            )}

            <div className="-mx-4 flex snap-x gap-3.5 overflow-x-auto px-4 pb-2 md:mx-0 md:grid md:grid-cols-2 md:gap-6 md:overflow-visible md:px-0 lg:grid-cols-3">
              {courses.map((c, i) => (
                <CourseTile key={c.id} course={c} index={i} layout="carousel" location="popular_courses" demoHref={FORM_ANCHOR} prefillCourse />
              ))}
            </div>

            <TrackedCta
              href="/courses"
              ctaId="all_courses"
              location="popular_courses"
              className="flex h-12 items-center justify-center gap-1.5 rounded-[10px] border border-[#cfdadd] bg-white text-[15px] font-bold text-[#005663] md:hidden dark:border-slate-700 dark:bg-slate-900 dark:text-[#5ef0c8]"
            >
              View all {courseCount > 0 ? `${courseCount} ` : ''}courses <ArrowRight className="h-[18px] w-[18px]" aria-hidden="true" />
            </TrackedCta>
          </div>
        </section>
      )}

      {/* ── Promo banner slot (admin-managed, "Homepage" placement) ── */}
      <section aria-label="Promotion" className="bg-[#f4f7f8] px-4 pb-8 pt-4 dark:bg-slate-950 md:px-8 md:pb-10 md:pt-6">
        <div className={CONTAINER}>
          <PromoBanner
            placement="home"
            banner={homeBanners[0] ?? null}
            fallback={
              <div className="relative flex flex-col gap-2.5 overflow-hidden rounded-[18px] bg-[#b8531c] px-5 py-6 md:h-[200px] md:flex-row md:items-center md:justify-between md:rounded-[20px] md:px-14 md:py-0">
                <span aria-hidden="true" className="pointer-events-none absolute -right-12 -top-16 h-44 w-44 rounded-full border-[30px] border-white/[0.08] md:-right-16 md:-top-20 md:h-[280px] md:w-[280px] md:border-[40px]" />
                <div className="relative flex flex-col gap-2 md:gap-2.5">
                  <p className="font-heading text-2xl font-extrabold text-white md:text-[34px]">Try a class before you enrol</p>
                  <p className="text-sm text-white md:text-base">Free demo class for every course, online or at a branch.</p>
                </div>
                <TrackedCta
                  href={FORM_ANCHOR}
                  ctaId="book_demo"
                  location="promo_banner"
                  className="relative mt-1 flex h-[46px] items-center gap-2 self-start rounded-[10px] bg-white px-[18px] font-heading text-[15px] font-extrabold text-[#8f3f14] md:mt-0 md:h-[54px] md:self-auto md:rounded-xl md:px-[26px] md:text-[17px]"
                >
                  Book Free Demo <ArrowRight className="h-5 w-5" aria-hidden="true" />
                </TrackedCta>
              </div>
            }
          />
        </div>
      </section>

      {/* ── Upcoming batches ── */}
      {batches.length > 0 && (
        <section aria-labelledby="batches-title" className={`bg-white dark:bg-slate-900 ${SECTION} md:py-[72px]`}>
          <div className={`${CONTAINER} flex flex-col gap-4 md:gap-7`}>
            <div className="flex flex-col gap-1.5 md:flex-row md:items-end md:justify-between md:gap-2">
              <div className="flex flex-col gap-1.5 md:gap-2">
                <p className={EYEBROW}>Upcoming batches</p>
                <h2 id="batches-title" className={H2}>Batches starting soon</h2>
              </div>
              <TrackedCta href="/batches" ctaId="all_batches" location="upcoming_batches" className="hidden items-center gap-1.5 text-[15px] font-bold text-[#b8531c] hover:text-[#8f3f14] md:flex dark:text-[#f3a57a]">
                All batches <ArrowRight className="h-[18px] w-[18px]" aria-hidden="true" />
              </TrackedCta>
            </div>
            <div className="md:overflow-hidden md:rounded-2xl md:border md:border-[#e3eaec] md:dark:border-slate-700">
              <table className="w-full border-collapse text-left max-md:block">
                <thead className="hidden bg-[#f4f7f8] text-xs font-bold uppercase tracking-[1px] text-[#4a5c61] md:table-header-group dark:bg-slate-800 dark:text-slate-400">
                  <tr>
                    <th scope="col" className="px-6 py-3.5">Course</th>
                    <th scope="col" className="px-4 py-3.5">Starts</th>
                    <th scope="col" className="px-4 py-3.5">Mode</th>
                    <th scope="col" className="px-4 py-3.5">Branch</th>
                    <th scope="col" className="px-6 py-3.5"><span className="sr-only">Action</span></th>
                  </tr>
                </thead>
                <tbody className="flex flex-col gap-3 md:table-row-group">
                  {batches.map((b) => {
                    const online = b.mode === 'Online';
                    return (
                      <tr key={b.id} className="flex flex-col gap-2.5 rounded-[14px] border border-[#e3eaec] p-4 text-[15px] md:table-row md:rounded-none md:border-0 md:border-t md:border-[#eef2f3] md:p-0 dark:border-slate-700">
                        <th scope="row" className="flex items-center justify-between gap-2 font-bold text-[#17262a] md:table-cell md:px-6 md:py-[18px] dark:text-white">
                          {b.course.title}
                          <span className="rounded-full bg-[#e6f0f1] px-2.5 py-0.5 text-xs font-bold text-[#005663] md:hidden">{online ? 'Online' : 'Classroom'}</span>
                        </th>
                        <td className="text-sm text-[#26383d] md:table-cell md:px-4 md:py-[18px] md:text-[15px] dark:text-slate-300">
                          <span className="flex items-start gap-2">
                            <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-[#005663]" aria-hidden="true" />
                            <span>
                              {formatBatchDate(b.startDate)} · {b.schedule}
                              <span className="md:hidden"> · {online ? 'Live online' : b.centre ?? 'Classroom'}</span>
                            </span>
                          </span>
                        </td>
                        <td className="hidden md:table-cell md:px-4 md:py-[18px]">
                          <span className="rounded-full bg-[#e6f0f1] px-2.5 py-1 text-[13px] font-bold text-[#005663]">{online ? 'Online' : 'Classroom'}</span>
                        </td>
                        <td className="hidden text-[#26383d] md:table-cell md:px-4 md:py-[18px] dark:text-slate-300">{online ? 'Live online' : b.centre ?? 'Classroom'}</td>
                        <td className="md:table-cell md:w-[220px] md:px-6 md:py-[18px]">
                          <TrackedCta
                            href={FORM_ANCHOR}
                            ctaId="reserve_seat"
                            location="upcoming_batches"
                            prefillCourse={b.course.title}
                            className="flex h-11 items-center justify-center gap-1.5 rounded-[10px] border border-[#b8531c] text-sm font-bold text-[#b8531c] hover:bg-[#fdf0e8] dark:text-[#f3a57a]"
                          >
                            Reserve a seat <ArrowRight className="h-4 w-4" aria-hidden="true" />
                          </TrackedCta>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <TrackedCta href="/batches" ctaId="all_batches" location="upcoming_batches" className="text-center text-sm font-bold text-[#b8531c] md:hidden">
              See all upcoming batches <ArrowRight className="inline h-4 w-4 align-[-3px]" aria-hidden="true" />
            </TrackedCta>
          </div>
        </section>
      )}

      {/* ── How it works ── */}
      <section aria-labelledby="how-title" className={`bg-[#f4f7f8] dark:bg-slate-950 ${SECTION}`}>
        <div className={`${CONTAINER} flex flex-col gap-4 md:items-center md:gap-10`}>
          <div className="flex flex-col gap-1.5 md:items-center md:gap-2 md:text-center">
            <p className={EYEBROW}>How it works</p>
            <h2 id="how-title" className={H2}>From first call to first class in 3 steps</h2>
          </div>
          <ol className="grid w-full gap-3.5 md:grid-cols-3 md:gap-6">
            {STEPS.map(({ icon: Icon, title, body }, i) => (
              <li key={title} className={`${CARD} flex gap-3.5 p-4 md:flex-col md:gap-3.5 md:p-7`}>
                <div className="flex shrink-0 items-start justify-between md:items-center">
                  <span className={`flex h-11 w-11 items-center justify-center rounded-xl text-white md:h-14 md:w-14 md:rounded-[14px] ${i === STEPS.length - 1 ? 'bg-[#b8531c]' : 'bg-[#0a3d4a]'}`}>
                    <Icon className="h-6 w-6 md:h-[26px] md:w-[26px]" aria-hidden="true" />
                  </span>
                  <span aria-hidden="true" className="hidden font-heading text-[44px] font-extrabold text-[#e3eaec] md:block dark:text-slate-700">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                </div>
                <div className="flex flex-col gap-1 md:gap-3.5">
                  <h3 className="font-heading text-base font-extrabold text-[#17262a] md:text-xl dark:text-white">
                    <span className="md:hidden">{i + 1}. </span>{title}
                  </h3>
                  <p className="text-sm leading-relaxed text-[#4a5c61] md:text-[15px] md:leading-[1.6] dark:text-slate-400">{body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── Career & placement assistance ── */}
      {hp.showHiringPartners && (
        <section aria-labelledby="career-title" className={`bg-[#0a3d4a] ${SECTION}`}>
          <div className={`${CONTAINER} grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:items-center lg:gap-16`}>
            <div className="flex flex-col gap-3 md:gap-[18px]">
              <p className="text-xs font-bold uppercase tracking-[1.4px] text-[#f3a57a] md:text-[13px]">Career support</p>
              <h2 id="career-title" className="font-heading text-[26px] font-extrabold text-white md:text-[38px]">{CAREER_SUPPORT_HEADLINE}</h2>
              <p className="text-[15px] leading-relaxed text-white/85 md:text-[17px] md:leading-[1.65]">
                We prepare you for interviews and connect you with our 50+ hiring partners. {PLACEMENT_DISCLAIMER}
              </p>
              <TrackedCta
                href={FORM_ANCHOR}
                ctaId="career_counselling"
                location="career_assistance"
                className={`mt-2 hidden h-[52px] items-center gap-2.5 self-start rounded-xl px-[22px] text-base font-bold lg:flex ${ORANGE_BUTTON}`}
              >
                <Phone className="h-5 w-5" aria-hidden="true" />
                {CAREER_SUPPORT_CTA}
              </TrackedCta>
            </div>
            <ul className="grid grid-cols-2 gap-2.5 md:gap-4">
              {CAREER_SUPPORT_ITEMS.map((item) => {
                const Icon = CAREER_ICONS[item.key];
                return (
                  <li key={item.key} className="flex flex-col gap-2 rounded-[14px] border border-white/[0.12] bg-white/[0.06] p-3.5 md:gap-3 md:rounded-2xl md:p-6">
                    <Icon className="h-6 w-6 text-[#f3a57a] md:h-7 md:w-7" aria-hidden="true" />
                    <h3 className="font-heading text-sm font-extrabold text-white md:text-lg">{item.title}</h3>
                    <p className="hidden text-sm leading-[1.55] text-white/[0.78] md:block">{item.body}</p>
                  </li>
                );
              })}
            </ul>
            <TrackedCta
              href={FORM_ANCHOR}
              ctaId="career_counselling"
              location="career_assistance"
              className={`flex h-[50px] items-center justify-center gap-2 rounded-xl text-[15px] font-bold lg:hidden ${ORANGE_BUTTON}`}
            >
              <Phone className="h-5 w-5" aria-hidden="true" />
              Free Career Counselling Call
            </TrackedCta>
          </div>
        </section>
      )}

      {/* ── Reviews (live Google reviews replace these once Q5 lands) ── */}
      {reviews.length > 0 && (
        <section aria-labelledby="reviews-title" className="bg-[#f4f7f8] py-10 dark:bg-slate-950 md:px-8 md:py-20">
          <div className={`${CONTAINER} flex flex-col gap-4 md:gap-8`}>
            <div className="flex flex-col gap-1.5 px-4 md:gap-2 md:px-0">
              <p className={EYEBROW}>Student reviews</p>
              <h2 id="reviews-title" className={H2}>What our students say</h2>
            </div>
            <div className="flex snap-x gap-3 overflow-x-auto px-4 pb-1.5 md:grid md:grid-cols-3 md:gap-6 md:overflow-visible md:px-0">
              {reviews.map((r) => (
                <figure key={r.id} className={`${CARD} flex w-[290px] shrink-0 snap-start flex-col gap-2.5 p-4 md:w-auto md:gap-3.5 md:p-6`}>
                  <div className="flex items-center gap-2.5 md:gap-3">
                    <span aria-hidden="true" className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full bg-[#e6f0f1] font-bold text-[#005663] md:h-11 md:w-11">
                      {r.name.trim().charAt(0).toUpperCase()}
                    </span>
                    <figcaption className="flex min-w-0 flex-col">
                      <span className="truncate font-bold text-[#17262a] dark:text-white">{r.name}</span>
                      {/* Company names stay hidden until hiring partners are confirmed. */}
                      {(r.jobTitle || (PLACEMENT_PROVIDERS_CONFIRMED && r.company) || r.reviewDate) && (
                        <span className="truncate text-xs text-[#5f7075]">
                          {[r.jobTitle, PLACEMENT_PROVIDERS_CONFIRMED ? r.company : null, r.reviewDate].filter(Boolean).join(' · ')}
                        </span>
                      )}
                    </figcaption>
                    <span className="ml-auto flex shrink-0 gap-px" aria-label={`${r.rating} out of 5 stars`}>
                      {Array.from({ length: 5 }, (_, i) => (
                        <Star key={i} className={`h-3.5 w-3.5 ${i < r.rating ? 'fill-[#b8531c] text-[#b8531c]' : 'text-[#cfdadd]'}`} aria-hidden="true" />
                      ))}
                    </span>
                  </div>
                  <blockquote className="line-clamp-4 text-sm leading-relaxed text-[#26383d] md:text-[15px] md:leading-[1.6] dark:text-slate-300">{r.quote}</blockquote>
                </figure>
              ))}
            </div>
            <TrackedCta
              href="/student-reviews"
              ctaId="all_reviews"
              location="reviews"
              className="mx-4 flex h-12 items-center justify-center gap-2 rounded-[10px] border border-[#cfdadd] bg-white px-[22px] text-[15px] font-bold text-[#005663] md:mx-0 md:self-center dark:border-slate-700 dark:bg-slate-900 dark:text-[#5ef0c8]"
            >
              Read all student reviews <ArrowRight className="h-[18px] w-[18px]" aria-hidden="true" />
            </TrackedCta>
          </div>
        </section>
      )}

      {/* ── Corporate strip ── */}
      <section aria-label="Corporate training" className={`bg-[#f4f7f8] px-4 pb-7 dark:bg-slate-950 md:px-8 md:pb-16 ${reviews.length > 0 ? '' : 'pt-8 md:pt-16'}`}>
        <div className={`${CONTAINER} flex flex-col gap-3 rounded-2xl bg-[#e6f0f1] p-5 md:flex-row md:items-center md:gap-6 md:rounded-[20px] md:px-10 md:py-8 dark:bg-slate-900`}>
          <span className="hidden h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[#005663] text-white md:flex">
            <Building2 className="h-[30px] w-[30px]" aria-hidden="true" />
          </span>
          <div className="flex flex-1 flex-col gap-2 md:gap-1.5">
            <h2 className="flex items-center gap-3 font-heading text-xl font-extrabold text-[#0a3d4a] md:text-2xl dark:text-white">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#005663] text-white md:hidden">
                <Building2 className="h-6 w-6" aria-hidden="true" />
              </span>
              Training a team?
            </h2>
            <p className="text-sm leading-normal text-[#26383d] md:text-base dark:text-slate-300">
              Custom corporate programmes in Cloud, DevOps, AI and Security, delivered online or on-site.
            </p>
          </div>
          <TrackedCta
            href="/corporate-training"
            ctaId="corporate_training"
            location="corporate_strip"
            className="flex h-[46px] shrink-0 items-center justify-center gap-2 rounded-[10px] bg-[#005663] px-[22px] text-sm font-bold text-white hover:bg-[#0a3d4a] md:h-[50px] md:rounded-xl md:text-[15px]"
          >
            Corporate training <ArrowRight className="h-[18px] w-[18px]" aria-hidden="true" />
          </TrackedCta>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section aria-labelledby="faq-title" className={`bg-white dark:bg-slate-900 ${SECTION}`}>
        <div className={`${CONTAINER} grid gap-2 lg:grid-cols-[380px_minmax(0,1fr)] lg:gap-16`}>
          <div className="flex flex-col gap-1.5 md:gap-3.5">
            <p className={EYEBROW}>FAQ</p>
            <h2 id="faq-title" className={H2}>Questions students ask us</h2>
            <p className="hidden text-base leading-relaxed text-[#4a5c61] lg:block dark:text-slate-400">Still unsure? A counsellor can answer anything on a quick call.</p>
            <WhatsAppLink
              ctaType="hero"
              pageType="static"
              message="Hi, I have a question about your courses."
              className="hidden h-[46px] items-center gap-2 self-start rounded-[10px] bg-[#e7f6ec] px-[18px] text-sm font-bold text-[#0f5a2c] lg:flex"
            >
              <MessageCircle className="h-[18px] w-[18px]" aria-hidden="true" />
              Ask on WhatsApp
            </WhatsAppLink>
          </div>
          <div className="flex flex-col">
            {FAQS.map((f, i) => (
              <details key={f.q} open={i === 0} className="group border-b border-[#e3eaec] dark:border-slate-700">
                <summary className="flex min-h-[56px] cursor-pointer list-none items-center justify-between gap-4 py-3.5 font-heading text-base font-bold text-[#17262a] md:min-h-16 md:py-[18px] md:text-lg dark:text-white [&::-webkit-details-marker]:hidden">
                  {f.q}
                  <Plus className="h-[22px] w-[22px] shrink-0 text-[#005663] transition-transform group-open:rotate-45 group-open:text-[#b8531c] dark:text-[#5ef0c8]" aria-hidden="true" />
                </summary>
                <p className="pb-4 text-[15px] leading-relaxed text-[#4a5c61] md:pb-5 md:pr-10 md:text-base md:leading-[1.65] dark:text-slate-400">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── Latest articles ── */}
      {articles.length > 0 && (
        <section aria-labelledby="blog-title" className="bg-[#f4f7f8] py-10 dark:bg-slate-950 md:px-8 md:py-20">
          <div className={`${CONTAINER} flex flex-col gap-4 md:gap-7`}>
            <div className="flex items-end justify-between gap-2 px-4 md:px-0">
              <div className="flex flex-col gap-1.5 md:gap-2">
                <p className={EYEBROW}>From the blog</p>
                <h2 id="blog-title" className={H2}>Latest articles</h2>
              </div>
              <TrackedCta href="/blog" ctaId="all_articles" location="latest_articles" className="flex shrink-0 items-center gap-1.5 text-sm font-bold text-[#b8531c] hover:text-[#8f3f14] md:text-[15px] dark:text-[#f3a57a]">
                All articles <ArrowRight className="h-[18px] w-[18px]" aria-hidden="true" />
              </TrackedCta>
            </div>
            <div className="flex snap-x gap-3 overflow-x-auto px-4 pb-1.5 md:grid md:grid-cols-3 md:gap-6 md:overflow-visible md:px-0">
              {articles.map((a, i) => (
                <Link key={a.href} href={a.href} className={`${CARD} group flex w-[260px] shrink-0 snap-start flex-col overflow-hidden md:w-auto`}>
                  <span aria-hidden="true" className="relative flex h-[130px] items-end p-3.5 md:h-[170px] md:p-5" style={{ background: BANNER_FILLS[(i + 1) % BANNER_FILLS.length] }}>
                    {a.image ? (
                      <Image src={a.image} alt="" fill sizes="(min-width: 1024px) 384px, (min-width: 768px) 33vw, 260px" className="object-cover" />
                    ) : (
                      <span className="flex flex-col gap-1">
                        <span className="text-[10px] font-bold tracking-[1.2px] text-white/60">COSS CLOUD SOLUTIONS</span>
                        <span className="font-heading text-lg font-extrabold leading-tight text-white md:text-xl">{a.category}</span>
                      </span>
                    )}
                  </span>
                  <span className="flex flex-col gap-1.5 p-3.5 md:gap-2.5 md:p-5">
                    <span className="text-[11px] font-bold uppercase tracking-[1px] text-[#005663] md:text-xs dark:text-[#5ef0c8]">{a.category}</span>
                    <span className="line-clamp-3 font-heading text-base font-extrabold leading-snug text-[#17262a] group-hover:text-[#b8531c] md:text-lg dark:text-white">{a.title}</span>
                    {(a.date || a.readTime) && (
                      <span className="text-xs text-[#5f7075] md:text-[13px]">{[a.date, a.readTime].filter(Boolean).join(' · ')}</span>
                    )}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Final CTA band ── */}
      <section aria-label="Book your free demo class" className="bg-[#f4f7f8] px-4 pb-8 dark:bg-slate-950 md:px-8 md:pb-20">
        <div className={`${CONTAINER} relative flex flex-col gap-3 overflow-hidden rounded-[20px] bg-[#0a3d4a] px-5 py-7 md:flex-row md:items-center md:justify-between md:gap-10 md:rounded-3xl md:p-14`}>
          <span aria-hidden="true" className="pointer-events-none absolute -bottom-[70px] -right-[60px] h-[200px] w-[200px] rounded-full border-[32px] border-[#e47538]/[0.14] md:-bottom-[120px] md:-left-20 md:right-auto md:h-80 md:w-80 md:border-[48px]" />
          <div className="relative flex flex-col gap-2 md:gap-3">
            <h2 className="font-heading text-[26px] font-extrabold text-white md:text-[40px]">Your next step: a free demo class</h2>
            <p className="text-[15px] text-white/85 md:text-[17px]">Meet the trainer, see the lab setup, then decide. No payment to book.</p>
          </div>
          <div className="relative flex w-full shrink-0 flex-col gap-3 md:w-[300px]">
            <TrackedCta
              href={FORM_ANCHOR}
              ctaId="book_demo"
              location="final_cta"
              className={`flex h-14 items-center justify-center gap-2.5 rounded-xl font-heading text-[17px] font-extrabold md:text-lg ${ORANGE_BUTTON}`}
            >
              <CalendarCheck className="h-5 w-5" aria-hidden="true" />
              Book My Free Demo
            </TrackedCta>
            <div className="grid grid-cols-2 gap-2.5">
              <WhatsAppLink
                ctaType="hero"
                pageType="static"
                message="Hi, I'd like help choosing a course at Coss Cloud Solutions."
                className="flex h-12 items-center justify-center gap-1.5 rounded-[10px] bg-[#e7f6ec] text-sm font-bold text-[#0f5a2c]"
              >
                <MessageCircle className="h-[17px] w-[17px]" aria-hidden="true" />
                WhatsApp
              </WhatsAppLink>
              <CallLink
                number={PHONE}
                pageType="static"
                className="flex h-12 items-center justify-center gap-1.5 rounded-[10px] border border-white/45 text-sm font-bold text-white hover:bg-white/10"
              >
                <Phone className="h-[17px] w-[17px]" aria-hidden="true" />
                Call
              </CallLink>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
