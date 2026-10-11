import type { Metadata } from 'next';
import { buildPageMetadata } from '@/lib/get-page-seo';
import { prisma } from '@/lib/db';
import { getGoogleReviews } from '@/lib/google-reviews';
import { getGoogleRating } from '@/lib/google-rating';
import { getHomepageSettings } from '@/lib/get-homepage-settings';
import { formatBatchDate } from '@/lib/batch-utils';
import { getPromoBanners } from '@/lib/promo-banners';
import { getSearchIndex } from '@/lib/course-search-index';
import type { CatalogCourse, SearchIndex } from '@/lib/course-search';
import { getAllPosts } from '@/lib/posts';
import { resolvePopular } from '@/lib/popular-courses';
import { resolveTracks, finderSuggestions } from '@/lib/home-tracks';
import { dateParts } from '@/lib/home-v4';
import PromoBanner from '@/components/PromoBanner';
import PageSchema from '@/components/PageSchema';
import ExploreTracks from '@/components/home/ExploreTracks';
import CourseFinder from '@/components/home/CourseFinder';
import Hero from '@/components/home/v4/Hero';
import PopularCourses from '@/components/home/v4/PopularCourses';
import BatchBand, { type BatchCardData } from '@/components/home/v4/BatchBand';
import { CorporateBanner, FaqArticles, ReviewsBanner, StepsCareer, type ArticleCardData } from '@/components/home/v4/Lower';
import FinalCta from '@/components/home/v4/FinalCta';
import HomeInteractions from '@/components/home/v4/HomeInteractions';
import { PLACEMENT_DISCLAIMER } from '@/lib/career-support';

/*
 * Homepage, Design v4 (design-ref Main.dc.html desktop, Mobile.dc.html mobile): hero with the demo
 * form on an illustrated banner, explore-by-track strip, popular courses with category tabs, the
 * dark batch band, the 3-question course finder, how-it-works + career card, live Google reviews,
 * corporate banner, FAQ + latest articles, and the final CTA.
 *
 * Server HTML throughout. The tabs and the finder are native radio inputs filtered by CSS :has()
 * (globals.css, ".home-tabs / .home-batches / .home-finder"), the FAQ is <details>, and one small
 * inline script (HomeInteractions) does the GA4 cta_click and course prefill. The only client
 * components are the two lead forms. GA4 events: form_start / form_submit (forms), cta_click.
 *
 * Allowed claims only: "since 2010", "5,000+ students trained", "50+ hiring partners", "1-year access".
 * Rating and reviews come from the live Google feed only and are hidden when it fails.
 */

export const revalidate = 86400;
export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata('home');
}

// next/image only optimises this Cloudinary folder (next.config.mjs images.remotePatterns).
const OPTIMISABLE_IMAGE = /^https:\/\/res\.cloudinary\.com\/dfditihuw\//;

const FAQS = [
  { q: 'Is the demo class really free?', a: 'Yes. Book a demo, meet the trainer and see a live class. No payment is needed to book.' },
  { q: 'Can I learn online instead of in class?', a: 'Yes. Courses run in class at Dilsukhnagar or Ameerpet, or live online with the same trainer.' },
  { q: 'Do I get recordings if I miss a class?', a: 'Yes. Class recordings are on the LMS, and you keep LMS access for 1 year.' },
  {
    q: 'Do you offer placement support?',
    a: `We offer placement assistance: resume building, mock interviews, interview preparation and referrals to our 50+ hiring partners. ${PLACEMENT_DISCLAIMER}`,
  },
] as const;

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

/** Admin-picked popular courses (Homepage manager), else the featured courses, else the menu's curated list. */
function popularCourses(index: SearchIndex, ids: string[], useAdminPick: boolean): CatalogCourse[] {
  const all = index.courses;
  if (useAdminPick && ids.length > 0) {
    const picked = ids.map((id) => all.find((c) => c.id === id)).filter((c): c is CatalogCourse => c != null);
    if (picked.length > 0) return picked.slice(0, 12);
  }
  const featured = all.filter((c) => c.featured).slice(0, 12);
  if (featured.length > 0) return featured;
  return resolvePopular(index)
    .items.map((it) => all.find((c) => c.slug === it.courseSlug))
    .filter((c): c is CatalogCourse => c != null)
    .slice(0, 12);
}

/**
 * Three newest admin blog posts; topped up from the MDX archive when there
 * are fewer. MDX dates are synthesised display dates, so they aren't shown.
 */
async function getLatestArticles(): Promise<ArticleCardData[]> {
  try {
    const rows = await prisma.blogPost.findMany({
      where: { status: 'published' },
      orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
      take: 3,
      select: { slug: true, title: true, category: true, readTime: true, thumbnail: true, publishedAt: true, createdAt: true },
    });
    const cards: ArticleCardData[] = rows.map((p) => ({
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
  const [index, batches, reviews, rating, articles, homeBanners] = await Promise.all([
    getSearchIndex().catch((): SearchIndex => ({ courses: [], categories: [] })),
    getUpcomingBatches(),
    hp.showTestimonials ? getGoogleReviews() : Promise.resolve(null),
    getGoogleRating(),
    getLatestArticles(),
    getPromoBanners('home'),
  ]);
  const courses = hp.showFeaturedCourses ? popularCourses(index, hp.featuredCourseIds, hp.showFeaturedCourses) : [];
  const banner = homeBanners[0] ?? null;

  const batchCards: BatchCardData[] = batches.map((b) => ({
    id: b.id,
    course: b.course.title,
    categorySlug: index.courses.find((c) => c.id === b.courseId)?.categorySlug ?? null,
    mode: b.mode,
    centre: b.centre,
    startDate: b.startDate,
    schedule: b.schedule,
    batchName: b.batchName,
    trainer: b.trainer,
  }));
  const first = batches[0];
  const nextBatch = first
    ? {
        course: first.course.title,
        when: (() => {
          const p = dateParts(first.startDate);
          return `${p.dow[0]}${p.dow.slice(1).toLowerCase()} ${p.day} ${p.mon[0]}${p.mon.slice(1).toLowerCase()}`;
        })(),
        where: first.mode === 'Online' ? 'Live online' : first.centre ?? 'Classroom',
      }
    : null;

  return (
    <div className="bg-[#f6f9fa] dark:bg-slate-950">
      <PageSchema slug="home" />
      <HomeInteractions />

      <Hero headline={hp.heroHeadline} subtext={hp.heroSubtext} rating={rating} nextBatch={nextBatch} />
      <ExploreTracks tracks={resolveTracks(index)} />
      <PopularCourses courses={courses} totalCourses={index.courses.length} />

      {/* Admin-managed "Homepage" promo slot: shown only when an image banner is set (the design has no coded fallback). */}
      {banner?.imageUrl && (
        <section aria-label="Promotion" className="mx-auto max-w-[1280px] px-4 pt-8 lg:px-8">
          <PromoBanner placement="home" banner={banner} />
        </section>
      )}

      <BatchBand batches={batchCards} />
      <CourseFinder suggestions={finderSuggestions(index)} />
      <StepsCareer showCareer={hp.showHiringPartners} />
      <ReviewsBanner reviews={reviews} rating={rating} />
      <CorporateBanner />
      <FaqArticles faqs={FAQS} articles={articles} />
      <FinalCta />
    </div>
  );
}
