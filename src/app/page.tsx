import type { Metadata } from 'next';
import Link from 'next/link';
import { CalendarDays, CheckCircle2, ChevronDown, Clock, GraduationCap, MapPin, Star, Wifi } from 'lucide-react';
import { buildPageMetadata } from '@/lib/get-page-seo';
import { prisma } from '@/lib/db';
import { getHomepageSettings } from '@/lib/get-homepage-settings';
import { getCourseUrl } from '@/lib/course-url';
import { excerptDescription } from '@/lib/sanitizeDescription';
import { formatBatchDate } from '@/lib/batch-utils';
import { batchBookingMessage } from '@/lib/whatsapp';
import { syllabusLinkFor } from '@/lib/promo-banners';
import {
  CAREER_SUPPORT_CTA,
  CAREER_SUPPORT_HEADLINE,
  CAREER_SUPPORT_ITEMS,
  PLACEMENT_DISCLAIMER,
  PLACEMENT_PROVIDERS_CONFIRMED,
} from '@/lib/career-support';
import { COURSE_GROUPS } from '@/data/course-options';
import WhatsAppLink from '@/components/WhatsAppLink';
import HomeHeroForm from '@/components/home/HomeHeroForm';
import TrackedCta from '@/components/home/TrackedCta';

/*
 * Homepage built for lead generation: hero with an inline form, trust bar,
 * popular courses (Get syllabus / Book demo), upcoming batches, how it works,
 * career assistance, reviews, FAQ and a final CTA band. Text-only hero (no
 * images) so LCP is the headline. No third-party scripts. GA4 events:
 * form_start / form_submit (hero form), cta_click (every CTA here).
 *
 * Allowed claims only: "since 2010", "5,000+ students trained",
 * "50+ hiring partners", "1-year access".
 */

export const revalidate = 86400;
export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata('home');
}

const FORM_ANCHOR = '#enroll-form';

const TRUST_ITEMS = ['Since 2010', '5,000+ students trained', '50+ hiring partners'] as const;

const STEPS = [
  { title: 'Book a free demo', body: 'Pick a course and leave your number. A counsellor calls or WhatsApps you to fix a slot.' },
  { title: 'Attend the demo, meet your trainer', body: 'Online or at our Dilsukhnagar or Ameerpet branch. See how the class runs before you pay anything.' },
  { title: 'Enrol and start learning', body: 'Choose a weekday, weekend or online batch. Recordings and materials come with 1-year access.' },
] as const;

const FAQS = [
  {
    q: 'Is the demo class really free?',
    a: 'Yes. The demo is a live class with the trainer. There is no fee and no obligation to enrol afterwards.',
  },
  {
    q: 'Which branch should I choose?',
    a: 'We teach at Dilsukhnagar and Ameerpet in Hyderabad, and live online. Your counsellor will suggest the branch and batch that fit your schedule.',
  },
  {
    q: 'Do you run weekend and online batches?',
    a: 'Yes. Most courses have weekday, weekend and online batches, so working professionals and students can both attend.',
  },
  {
    q: 'What career support do you give?',
    a: `Resume building, mock interviews, interview preparation and referrals to our 50+ hiring partners. ${PLACEMENT_DISCLAIMER}`,
  },
  {
    q: 'How long can I access the course material?',
    a: 'Class recordings and course material come with 1-year access, so you can revise after the batch ends.',
  },
  {
    q: 'How long has Coss Cloud Solutions been training students?',
    a: 'We have been training IT students in Hyderabad since 2010, with 5,000+ students trained.',
  },
] as const;

/* ── Data ─────────────────────────────────────────────────────────────── */

async function getCategories() {
  try {
    return await prisma.courseCategory.findMany({
      where: { status: 'published' },
      orderBy: { sortOrder: 'asc' },
      select: { id: true, name: true, slug: true },
    });
  } catch {
    return [];
  }
}

async function getUpcomingBatches() {
  try {
    // IST = UTC+5:30; startDate must be today or later (IST midnight)
    const istOffset = 5.5 * 60 * 60 * 1000;
    const nowIST = new Date(Date.now() + istOffset);
    const todayMidnightIST = new Date(
      Date.UTC(nowIST.getUTCFullYear(), nowIST.getUTCMonth(), nowIST.getUTCDate()) - istOffset,
    );
    const all = await prisma.batch.findMany({
      where: { status: { in: ['upcoming', 'ongoing'] }, featured: true, startDate: { gte: todayMidnightIST } },
      include: { course: { select: { title: true } } },
      orderBy: { startDate: 'asc' },
      take: 20,
    });
    // One earliest batch per course
    const seen = new Set<string>();
    return all.filter((b) => (seen.has(b.courseId) ? false : (seen.add(b.courseId), true))).slice(0, 3);
  } catch {
    return [];
  }
}

async function getReviews() {
  try {
    return await prisma.testimonial.findMany({
      where: { visible: true, scope: 'global' },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
      take: 6,
      select: { id: true, name: true, jobTitle: true, company: true, quote: true, rating: true },
    });
  } catch {
    return [];
  }
}

const COURSE_SELECT = {
  id: true,
  title: true,
  slug: true,
  excerpt: true,
  duration: true,
  mode: true,
  level: true,
  brochureUrl: true,
  categorySlug: true,
  urlType: true,
} as const;

/** Admin-picked popular courses (Homepage manager), else the featured courses. */
async function getPopularCourses(ids: string[], useAdminPick: boolean) {
  try {
    if (useAdminPick && ids.length > 0) {
      const rows = await prisma.course.findMany({ where: { id: { in: ids }, status: 'published' }, select: COURSE_SELECT });
      return ids.map((id) => rows.find((c) => c.id === id)).filter((c): c is NonNullable<typeof c> => c != null).slice(0, 6);
    }
    return await prisma.course.findMany({
      where: { status: 'published', featured: true },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
      take: 6,
      select: COURSE_SELECT,
    });
  } catch {
    return [];
  }
}

/* ── Page ─────────────────────────────────────────────────────────────── */

export default async function HomePage() {
  const hp = await getHomepageSettings();
  const [categories, batches, reviews, courses] = await Promise.all([
    getCategories(),
    getUpcomingBatches(),
    hp.showTestimonials ? getReviews() : Promise.resolve([]),
    getPopularCourses(hp.featuredCourseIds, hp.showFeaturedCourses),
  ]);

  return (
    <>
      {/* ── Hero with inline form ── */}
      <section
        aria-label="Book a free demo class"
        className="relative overflow-hidden px-4 pb-12 pt-10 md:px-8 md:pb-16 md:pt-16"
        style={{ background: 'linear-gradient(135deg, #012e36 0%, #024c57 55%, #03798a 100%)' }}
      >
        <div aria-hidden="true" className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full" style={{ background: 'rgba(94,240,200,0.10)' }} />
        <div className="relative mx-auto grid max-w-[1200px] items-center gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:gap-12">
          <div>
            <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-[#5ef0c8]">
              IT training in Hyderabad · Since 2010
            </p>
            <h1 className="text-[30px] font-extrabold leading-tight text-white md:text-[46px]">{hp.heroHeadline}</h1>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-slate-200 md:text-lg">{hp.heroSubtext}</p>
            <ul className="mt-6 space-y-2 text-sm text-slate-100 md:text-[15px]">
              {['Live classes at Dilsukhnagar, Ameerpet or online', 'Weekday, weekend and evening batches', 'Resume, mock interview and referral support'].map((t) => (
                <li key={t} className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#5ef0c8]" aria-hidden="true" />
                  {t}
                </li>
              ))}
            </ul>
          </div>
          <div id="enroll-form" className="scroll-mt-24">
            <HomeHeroForm courseGroups={COURSE_GROUPS} />
          </div>
        </div>
      </section>

      {/* ── Trust bar ── */}
      <section aria-label="Why students trust us" className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <ul className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-center gap-x-8 gap-y-2 px-4 py-4 text-sm font-bold text-[#024c57] dark:text-[#5ef0c8] md:text-base">
          {TRUST_ITEMS.map((t, i) => (
            <li key={t} className="flex items-center gap-8">
              {i > 0 && <span aria-hidden="true" className="hidden text-slate-300 sm:inline">·</span>}
              {t}
            </li>
          ))}
        </ul>
      </section>

      {/* ── Popular courses ── */}
      {courses.length > 0 && (
        <section aria-labelledby="popular-title" className="bg-slate-50 px-4 py-14 dark:bg-slate-950 md:px-8">
          <div className="mx-auto max-w-[1200px]">
            <div className="mb-8 text-center">
              <h2 id="popular-title" className="text-2xl font-extrabold text-slate-900 dark:text-white md:text-3xl">{hp.featuredSectionTitle}</h2>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{hp.featuredSectionSubtext}</p>
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {courses.map((c) => {
                const url = getCourseUrl(c);
                const syllabus = syllabusLinkFor(c);
                return (
                  <article key={c.id} className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
                    <h3 className="text-lg font-bold leading-snug text-slate-900 dark:text-white">
                      <Link href={url} className="hover:text-teal-700 dark:hover:text-teal-400">{c.title}</Link>
                    </h3>
                    <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{excerptDescription(c.excerpt, 140)}</p>
                    <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                      {c.duration && <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" aria-hidden="true" />{c.duration}</span>}
                      {c.mode && <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" aria-hidden="true" />{c.mode}</span>}
                      {c.level && <span className="inline-flex items-center gap-1"><GraduationCap className="h-3.5 w-3.5" aria-hidden="true" />{c.level}</span>}
                    </p>
                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <TrackedCta
                        href={syllabus.href}
                        ctaId="get_syllabus"
                        location="popular_courses"
                        className="rounded-xl border border-[#024c57] px-3 py-2.5 text-center text-sm font-bold text-[#024c57] hover:bg-teal-50 dark:border-[#5ef0c8] dark:text-[#5ef0c8] dark:hover:bg-white/5"
                      >
                        Get syllabus
                      </TrackedCta>
                      <TrackedCta
                        href={FORM_ANCHOR}
                        ctaId="book_demo"
                        location="popular_courses"
                        prefillCourse={c.title}
                        className="rounded-xl bg-[#e47538] px-3 py-2.5 text-center text-sm font-bold text-white hover:opacity-95"
                      >
                        Book demo
                      </TrackedCta>
                    </div>
                  </article>
                );
              })}
            </div>
            {categories.length > 0 && (
              <nav aria-label="Course categories" className="mt-8 flex flex-wrap justify-center gap-2">
                {categories.map((cat) => (
                  <Link
                    key={cat.id}
                    href={`/courses/${cat.slug}`}
                    className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-teal-600 hover:text-teal-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                  >
                    {cat.name}
                  </Link>
                ))}
              </nav>
            )}
          </div>
        </section>
      )}

      {/* ── Upcoming batches ── */}
      {batches.length > 0 && (
        <section aria-labelledby="batches-title" className="bg-white px-4 py-14 dark:bg-slate-900 md:px-8">
          <div className="mx-auto max-w-[1100px]">
            <div className="mb-8 text-center">
              <h2 id="batches-title" className="text-2xl font-extrabold text-slate-900 dark:text-white md:text-3xl">Batches starting soon</h2>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Classroom at Dilsukhnagar &amp; Ameerpet · Live online</p>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {batches.map((b) => {
                const date = formatBatchDate(b.startDate);
                const message = batchBookingMessage({ courseName: b.course.title, mode: b.mode, startDate: date, centre: b.centre, schedule: b.schedule });
                return (
                  <div key={b.id} className="flex flex-col gap-3 rounded-2xl border border-slate-200 p-5 dark:border-slate-700">
                    <p className="font-bold leading-snug text-slate-900 dark:text-white">{b.course.title}</p>
                    <p className="flex flex-col gap-1 text-sm text-slate-600 dark:text-slate-300">
                      <span className="inline-flex items-center gap-1.5"><CalendarDays className="h-4 w-4 text-teal-700" aria-hidden="true" />{date}</span>
                      <span className="inline-flex items-center gap-1.5"><Clock className="h-4 w-4 text-teal-700" aria-hidden="true" />{b.schedule}</span>
                      <span className="inline-flex items-center gap-1.5">
                        {b.mode === 'Online' ? <Wifi className="h-4 w-4 text-teal-700" aria-hidden="true" /> : <MapPin className="h-4 w-4 text-teal-700" aria-hidden="true" />}
                        {b.mode === 'Online' ? 'Online' : b.centre ?? 'Classroom'}
                      </span>
                    </p>
                    <div className="mt-auto grid grid-cols-2 gap-2">
                      <TrackedCta
                        href={FORM_ANCHOR}
                        ctaId="book_demo"
                        location="upcoming_batches"
                        prefillCourse={b.course.title}
                        className="rounded-xl bg-[#e47538] px-3 py-2 text-center text-sm font-bold text-white hover:opacity-95"
                      >
                        Book demo
                      </TrackedCta>
                      <WhatsAppLink
                        ctaType="batch"
                        pageType="static"
                        message={message}
                        className="rounded-xl border border-[#25D366] px-3 py-2 text-center text-sm font-bold text-[#128C7E]"
                      >
                        Ask on WhatsApp
                      </WhatsAppLink>
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="mt-6 text-center">
              <TrackedCta href="/batches" ctaId="all_batches" location="upcoming_batches" className="text-sm font-bold text-teal-700 hover:underline dark:text-teal-400">
                See all upcoming batches →
              </TrackedCta>
            </p>
          </div>
        </section>
      )}

      {/* ── How it works ── */}
      <section aria-labelledby="how-title" className="bg-slate-50 px-4 py-14 dark:bg-slate-950 md:px-8">
        <div className="mx-auto max-w-[1100px]">
          <h2 id="how-title" className="mb-8 text-center text-2xl font-extrabold text-slate-900 dark:text-white md:text-3xl">How it works</h2>
          <ol className="grid gap-4 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <li key={s.title} className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#024c57] text-sm font-extrabold text-[#5ef0c8]">{i + 1}</span>
                <p className="mt-3 font-bold text-slate-900 dark:text-white">{s.title}</p>
                <p className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{s.body}</p>
              </li>
            ))}
          </ol>
          <p className="mt-8 text-center">
            <TrackedCta href={FORM_ANCHOR} ctaId="book_demo" location="how_it_works" className="inline-block rounded-xl bg-[#e47538] px-6 py-3 text-sm font-bold text-white hover:opacity-95">
              Book a free demo class
            </TrackedCta>
          </p>
        </div>
      </section>

      {/* ── Career & placement assistance ── */}
      {hp.showHiringPartners && (
        <section aria-labelledby="career-title" className="bg-white px-4 py-14 dark:bg-slate-900 md:px-8">
          <div className="mx-auto max-w-[1100px]">
            <div className="mb-8 text-center">
              <h2 id="career-title" className="text-2xl font-extrabold text-slate-900 dark:text-white md:text-3xl">{CAREER_SUPPORT_HEADLINE}</h2>
              <p className="mt-2 text-sm font-semibold text-slate-600 dark:text-slate-300">{PLACEMENT_DISCLAIMER}</p>
            </div>
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {CAREER_SUPPORT_ITEMS.map((item) => (
                <li key={item.key} className="rounded-2xl border border-slate-200 p-5 dark:border-slate-700">
                  <p className="text-sm font-bold text-slate-900 dark:text-white">{item.title}</p>
                  <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-300">{item.body}</p>
                </li>
              ))}
            </ul>
            <p className="mt-6 text-center">
              <TrackedCta href={FORM_ANCHOR} ctaId="career_counselling" location="career_assistance" className="inline-block rounded-xl bg-[#024c57] px-6 py-3 text-sm font-bold text-white hover:opacity-95">
                {CAREER_SUPPORT_CTA}
              </TrackedCta>
            </p>
          </div>
        </section>
      )}

      {/* ── Reviews ── */}
      {reviews.length > 0 && (
        <section aria-labelledby="reviews-title" className="bg-slate-50 px-4 py-14 dark:bg-slate-950 md:px-8">
          <div className="mx-auto max-w-[1100px]">
            <h2 id="reviews-title" className="mb-8 text-center text-2xl font-extrabold text-slate-900 dark:text-white md:text-3xl">What our students say</h2>
            <div className="grid gap-4 md:grid-cols-3">
              {reviews.map((r) => (
                <figure key={r.id} className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
                  <div className="flex gap-0.5" aria-label={`${r.rating} out of 5 stars`}>
                    {Array.from({ length: 5 }, (_, i) => (
                      <Star key={i} className={`h-4 w-4 ${i < r.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} aria-hidden="true" />
                    ))}
                  </div>
                  <blockquote className="mt-3 flex-1 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                    {r.quote.length > 280 ? `${r.quote.slice(0, 277).trimEnd()}…` : r.quote}
                  </blockquote>
                  <figcaption className="mt-4 text-sm font-bold text-slate-900 dark:text-white">
                    {r.name}
                    {/* Company names stay hidden until hiring partners are confirmed. */}
                    {(r.jobTitle || (PLACEMENT_PROVIDERS_CONFIRMED && r.company)) && (
                      <span className="block text-xs font-normal text-slate-500 dark:text-slate-400">
                        {[r.jobTitle, PLACEMENT_PROVIDERS_CONFIRMED ? r.company : null].filter(Boolean).join(' · ')}
                      </span>
                    )}
                  </figcaption>
                </figure>
              ))}
            </div>
            <p className="mt-6 text-center">
              <TrackedCta href="/student-reviews" ctaId="all_reviews" location="reviews" className="text-sm font-bold text-teal-700 hover:underline dark:text-teal-400">
                Read more student reviews →
              </TrackedCta>
            </p>
          </div>
        </section>
      )}

      {/* ── FAQ ── */}
      <section aria-labelledby="faq-title" className="bg-white px-4 py-14 dark:bg-slate-900 md:px-8">
        <div className="mx-auto max-w-[800px]">
          <h2 id="faq-title" className="mb-6 text-center text-2xl font-extrabold text-slate-900 dark:text-white md:text-3xl">Frequently asked questions</h2>
          <div className="divide-y divide-slate-200 rounded-2xl border border-slate-200 dark:divide-slate-700 dark:border-slate-700">
            {FAQS.map((f) => (
              <details key={f.q} className="group px-5 py-4">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-slate-900 dark:text-white">
                  {f.q}
                  <ChevronDown className="h-4 w-4 shrink-0 text-slate-400 transition-transform group-open:rotate-180" aria-hidden="true" />
                </summary>
                <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA band ── */}
      <section
        aria-label="Book your free demo class"
        className="px-4 py-12 md:px-8"
        style={{ background: 'linear-gradient(135deg, #024c57 0%, #03798a 100%)' }}
      >
        <div className="mx-auto flex max-w-[1100px] flex-col items-center gap-5 text-center md:flex-row md:justify-between md:text-left">
          <div>
            <p className="text-2xl font-extrabold text-white">Not sure which course fits you?</p>
            <p className="mt-1 text-sm text-slate-200">Book a free demo class and talk it through with a counsellor.</p>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            <TrackedCta href={FORM_ANCHOR} ctaId="book_demo" location="final_cta" className="rounded-xl bg-[#e47538] px-6 py-3 text-sm font-bold text-white hover:opacity-95">
              Book a free demo class
            </TrackedCta>
            <WhatsAppLink
              ctaType="hero"
              pageType="static"
              message="Hi, I'd like help choosing a course at Coss Cloud Solutions."
              className="rounded-xl border border-white/40 px-6 py-3 text-sm font-bold text-white hover:bg-white/10"
            >
              Chat on WhatsApp
            </WhatsAppLink>
          </div>
        </div>
      </section>
    </>
  );
}
