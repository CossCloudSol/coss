import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { HeroBanner, CtaBanner, EnrollSidebar, ResponsivePageStyles } from '@/components/shared';
import BatchCard, { type BatchCardBatch } from '@/components/BatchCard';
import {
  LOCALITY_TOPIC_PAGES,
  getLocalityTopicPage,
  getLocalityBySlug,
  TOPIC_LABELS,
  TOPIC_CATEGORY_SLUGS,
  BRANCH_GEO,
  type BranchKey,
} from '@/lib/locations-data';
import { getBranchSettings } from '@/lib/get-branch-settings';
import { buildLocalBusinessSchema } from '@/lib/global-schemas';
import { buildPageMetadataWithFallback } from '@/lib/get-page-seo';
import { getCourseUrl } from '@/lib/course-url';
import { formatBatchDate } from '@/lib/batch-utils';
import { prisma } from '@/lib/db';
import WhatsAppLink from '@/components/WhatsAppLink';

export const revalidate = 86400;

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.cosscloudsol.com';

/**
 * Duplicated from the parent /locations/[locality] page rather than shared —
 * that page's internals are out of scope for this change (Phase 2 Wave 1).
 * See the aliasing rationale there: Batch.centre is free-text and drifts.
 */
const BRANCH_CENTRE_ALIASES: Record<BranchKey, string[]> = {
  dilsukhnagar: ['dilsukhnagar', 'dilsukhnagar branch', 'dsnr', 'dilshuknagar'],
  ameerpet: ['ameerpet', 'ameerpet branch', 'amerpet'],
};

function normalizeCentre(value: string | null): string {
  return (value ?? '').trim().toLowerCase();
}

interface TopicCourse {
  title: string;
  slug: string;
  categorySlug: string | null;
  urlType: string;
  /** ISO date of the earliest upcoming/ongoing batch for this course at this
   *  branch, or null if the course is in the topic's catalogue but has no
   *  batch scheduled here right now. */
  nextBatchDate: string | null;
}

const BATCH_DISPLAY_CAP = 12;

async function getBranchTopicData(
  branchKey: BranchKey,
  categorySlugs: string[],
): Promise<{ batches: BatchCardBatch[]; courses: TopicCourse[] }> {
  try {
    const aliases = BRANCH_CENTRE_ALIASES[branchKey];
    const [allCourses, candidates] = await Promise.all([
      // The full topic catalogue — shown regardless of whether a batch is
      // currently scheduled at this branch, per the owner-confirmed rule
      // that both branches teach the complete cloud-computing catalogue.
      prisma.course.findMany({
        where: { categorySlug: { in: categorySlugs }, status: 'published' },
        orderBy: { sortOrder: 'asc' },
        select: { title: true, slug: true, categorySlug: true, urlType: true },
      }),
      prisma.batch.findMany({
        where: {
          status: { in: ['upcoming', 'ongoing'] },
          course: { categorySlug: { in: categorySlugs } },
        },
        include: { course: { select: { title: true, slug: true, category: true, categorySlug: true, urlType: true } } },
        orderBy: { startDate: 'asc' },
      }),
    ]);
    const matched = candidates.filter((b) => aliases.includes(normalizeCentre(b.centre)));

    const rows = matched.slice(0, BATCH_DISPLAY_CAP);
    const batches: BatchCardBatch[] = rows.map((b) => ({
      id: b.id,
      batchName: b.batchName,
      mode: b.mode,
      centre: b.centre,
      startDate: b.startDate.toISOString(),
      endDate: b.endDate ? b.endDate.toISOString() : null,
      schedule: b.schedule,
      totalSeats: b.totalSeats,
      seatsAvailable: b.seatsAvailable,
      status: b.status,
      featured: b.featured,
      course: { title: b.course.title, category: b.course.category, categorySlug: b.course.categorySlug },
    }));

    // `matched` is ordered by startDate asc, so the first hit per course
    // slug is its earliest upcoming/ongoing batch at this branch.
    const nextBatchBySlug = new Map<string, string>();
    for (const b of matched) {
      if (!nextBatchBySlug.has(b.course.slug)) {
        nextBatchBySlug.set(b.course.slug, b.startDate.toISOString());
      }
    }

    const courses: TopicCourse[] = allCourses.map((c) => ({
      title: c.title,
      slug: c.slug,
      categorySlug: c.categorySlug,
      urlType: c.urlType,
      nextBatchDate: nextBatchBySlug.get(c.slug) ?? null,
    }));

    return { batches, courses };
  } catch {
    return { batches: [], courses: [] };
  }
}

export function generateStaticParams() {
  return LOCALITY_TOPIC_PAGES.map((p) => ({ locality: p.localitySlug, topic: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ locality: string; topic: string }> }): Promise<Metadata> {
  const { locality, topic } = await params;
  const config = getLocalityTopicPage(locality, topic);
  if (!config) return {};

  const url = `https://www.cosscloudsol.com/locations/${config.localitySlug}/${config.slug}`;
  const geo = BRANCH_GEO[config.branchKey];
  const localityConfig = getLocalityBySlug(config.localitySlug);

  return buildPageMetadataWithFallback(`locations/${locality}/${topic}`, {
    title: config.metaTitle,
    description: config.metaDescription,
    keywords: config.keywords,
    alternates: { canonical: url },
    openGraph: {
      title: config.metaTitle,
      description: config.metaDescription,
      type: 'website',
      url,
    },
    other: {
      'geo.region': 'IN-TG',
      'geo.placename': `${localityConfig?.name ?? config.localitySlug}, Hyderabad`,
      'geo.position': `${geo.lat};${geo.lng}`,
      'ICBM': `${geo.lat}, ${geo.lng}`,
    },
  });
}

export default async function LocalityTopicPage({ params }: { params: Promise<{ locality: string; topic: string }> }) {
  const { locality, topic } = await params;
  const config = getLocalityTopicPage(locality, topic);
  if (!config) notFound();

  const localityConfig = getLocalityBySlug(config.localitySlug);
  if (!localityConfig) notFound();

  const topicLabel = TOPIC_LABELS[config.topicKey];
  const categorySlugs = TOPIC_CATEGORY_SLUGS[config.topicKey];
  const [branch, { batches, courses }] = await Promise.all([
    getBranchSettings(config.branchKey),
    getBranchTopicData(config.branchKey, categorySlugs),
  ]);

  const pageUrl = `${SITE_URL}/locations/${config.localitySlug}/${config.slug}`;
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: localityConfig.name, item: `${SITE_URL}/locations/${config.localitySlug}` },
      { '@type': 'ListItem', position: 3, name: topicLabel, item: pageUrl },
    ],
  };

  const noBatchMessage = `Hi Coss Cloud Solutions Team,\n\nI'm interested in the ${topicLabel} course at your ${localityConfig.name} branch. Could you share the next available batch dates?\n\nThank you!`;

  // Same "ask on WhatsApp" CTA as the zero-batch fallback above, but scoped
  // to one course — used by catalogue courses that have no batch currently
  // scheduled at this branch.
  const courseWhatsAppMessage = (courseTitle: string) =>
    `Hi Coss Cloud Solutions Team,\n\nI'm interested in the ${courseTitle} course at your ${localityConfig.name} branch. Could you share the next available batch dates?\n\nThank you!`;

  const localBusinessSchema = branch.schemaEnabled ? buildLocalBusinessSchema(branch) : null;
  const itemListSchema = courses.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    '@id': `${pageUrl}/#courses`,
    name: `${topicLabel} Courses at ${localityConfig.name}`,
    itemListElement: courses.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.title,
      url: `${SITE_URL}${getCourseUrl(c)}`,
    })),
  } : null;

  // Cross-link to the other branch's same-topic page — the natural
  // internal-link path between the two pilot pages.
  const otherBranchPage = LOCALITY_TOPIC_PAGES.find(
    (p) => p.topicKey === config.topicKey && p.localitySlug !== config.localitySlug,
  );
  const otherBranchLocality = otherBranchPage ? getLocalityBySlug(otherBranchPage.localitySlug) : undefined;

  return (
    <>
      <ResponsivePageStyles />
      {localBusinessSchema && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }} />
      )}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      {itemListSchema && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }} />
      )}

      <HeroBanner
        badge={config.badge}
        titlePre={config.h1}
        accentText=""
        subtitle={config.intro[0]}
        stats={[
          { value: branch.workingDays.replace('-', '–'), label: `${branch.workingHoursOpen}–${branch.workingHoursClose}` },
        ]}
        ctaText={`${branch.addressLine2 || branch.city}, Hyderabad · Free career counselling`}
        breadcrumb={[
          { label: localityConfig.name, href: `/locations/${config.localitySlug}` },
          { label: topicLabel, href: `/locations/${config.localitySlug}/${config.slug}` },
        ]}
      />

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '56px 20px' }}>
        <div className="page-with-sidebar">
          <div>
            {config.intro.map((p, i) => (
              <p key={i} style={{ color: 'var(--text-muted)', fontSize: '15px', lineHeight: '1.8', marginBottom: '18px' }}>{p}</p>
            ))}

            <div style={{ marginBottom: '28px' }}>
              <h2 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '18px', color: 'var(--text)', marginBottom: '12px' }}>
                Why Train Here for {topicLabel}
              </h2>
              {config.whyThisBranch.map((p, i) => (
                <p key={i} style={{ color: 'var(--text-muted)', fontSize: '14px', lineHeight: '1.8', marginBottom: '10px' }}>{p}</p>
              ))}
            </div>

            {/* Batches */}
            <div style={{ marginBottom: '28px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <h2 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '18px', color: 'var(--text)', margin: 0 }}>
                  {topicLabel} Batches at {localityConfig.name}
                </h2>
                {batches.length > 0 && (
                  <Link href="/batches" style={{ fontSize: '13px', color: 'var(--primary)', fontWeight: 600 }}>
                    View all batches at this branch →
                  </Link>
                )}
              </div>
              {batches.length > 0 ? (
                <div className="course-list-grid">
                  {batches.map((b) => <BatchCard key={b.id} batch={b} />)}
                </div>
              ) : (
                <div className="inner-card" style={{ textAlign: 'center', padding: '28px 20px' }}>
                  <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '14px' }}>
                    No {topicLabel} batch is scheduled at {localityConfig.name} right this moment — the next batch dates are available on request.
                  </p>
                  <WhatsAppLink
                    ctaType="locality"
                    pageType="locality"
                    branchKey={config.branchKey}
                    message={noBatchMessage}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 24px', borderRadius: '10px', fontSize: '14px', fontWeight: 700, color: '#fff', background: '#25D366' }}
                  >
                    Ask for Next Batch Dates on WhatsApp
                  </WhatsAppLink>
                </div>
              )}
            </div>

            {/* Courses — the full topic catalogue, not just courses with a scheduled batch here */}
            {courses.length > 0 && (
              <div style={{ marginBottom: '28px' }}>
                <h2 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '18px', color: 'var(--text)', marginBottom: '14px' }}>
                  {topicLabel} Courses at {localityConfig.name}
                </h2>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                  {courses.map((c) => (
                    c.nextBatchDate ? (
                      <Link key={c.slug} href={getCourseUrl(c)}
                        style={{ display: 'flex', flexDirection: 'column', gap: '3px', padding: '9px 16px', borderRadius: '8px', background: 'var(--bg-alt)', border: '1px solid var(--border)' }}>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>{c.title}</span>
                        <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--primary)' }}>Next batch: {formatBatchDate(c.nextBatchDate)}</span>
                      </Link>
                    ) : (
                      <WhatsAppLink
                        key={c.slug}
                        ctaType="locality"
                        pageType="locality"
                        branchKey={config.branchKey}
                        courseSlug={c.slug}
                        message={courseWhatsAppMessage(c.title)}
                        style={{ display: 'flex', flexDirection: 'column', gap: '3px', padding: '9px 16px', borderRadius: '8px', background: 'transparent', border: '1px dashed var(--border)' }}
                      >
                        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>{c.title}</span>
                        <span style={{ fontSize: '11px', fontWeight: 700, color: '#25D366' }}>Next batch on request →</span>
                      </WhatsAppLink>
                    )
                  ))}
                </div>
              </div>
            )}

            <div style={{ marginBottom: '28px' }}>
              <h2 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '18px', color: 'var(--text)', marginBottom: '12px' }}>
                🚇 Getting Here
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '14px', lineHeight: '1.8' }}>{config.commuteNote}</p>
            </div>

            {/* Internal links: back to the parent locality page, across to the other branch's same-topic page */}
            <div style={{ fontSize: '13.5px', color: 'var(--text-muted)' }}>
              <p style={{ marginBottom: '8px' }}>
                <Link href={`/locations/${config.localitySlug}`} style={{ color: 'var(--primary)', fontWeight: 600 }}>
                  ← Back to the {localityConfig.name} branch page
                </Link>
              </p>
              {otherBranchPage && otherBranchLocality && (
                <p>
                  Also available at our{' '}
                  <Link href={`/locations/${otherBranchPage.localitySlug}/${otherBranchPage.slug}`} style={{ color: 'var(--primary)', fontWeight: 600 }}>
                    {otherBranchLocality.name} branch
                  </Link>.
                </p>
              )}
            </div>
          </div>

          <div>
            <EnrollSidebar />
          </div>
        </div>

        <CtaBanner />
      </div>
    </>
  );
}
