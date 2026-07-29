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
  type BranchKey,
} from '@/lib/locations-data';
import { getBranchSettings } from '@/lib/get-branch-settings';
import { buildPageMetadataWithFallback } from '@/lib/get-page-seo';
import { getCourseUrl } from '@/lib/course-url';
import { buildWhatsAppUrl } from '@/lib/whatsapp';
import { prisma } from '@/lib/db';

export const revalidate = 600;

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

interface CourseLite {
  title: string;
  slug: string;
  categorySlug: string | null;
  urlType: string;
}

const BATCH_DISPLAY_CAP = 12;

async function getBranchTopicBatches(
  branchKey: BranchKey,
  categorySlugs: string[],
): Promise<{ batches: BatchCardBatch[]; courses: CourseLite[] }> {
  try {
    const aliases = BRANCH_CENTRE_ALIASES[branchKey];
    const candidates = await prisma.batch.findMany({
      where: {
        status: { in: ['upcoming', 'ongoing'] },
        course: { categorySlug: { in: categorySlugs } },
      },
      include: { course: { select: { title: true, slug: true, category: true, categorySlug: true, urlType: true } } },
      orderBy: { startDate: 'asc' },
    });
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

    // Course chips are derived from the full matched set, not the
    // display-limited `rows` — a batch cap shouldn't also hide a course
    // that genuinely runs at this branch under this topic.
    const courseMap = new Map<string, CourseLite>();
    for (const b of matched) {
      if (!courseMap.has(b.course.slug)) {
        courseMap.set(b.course.slug, {
          title: b.course.title,
          slug: b.course.slug,
          categorySlug: b.course.categorySlug,
          urlType: b.course.urlType,
        });
      }
    }
    return { batches, courses: Array.from(courseMap.values()) };
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
    getBranchTopicBatches(config.branchKey, categorySlugs),
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
  const noBatchWhatsAppUrl = buildWhatsAppUrl(noBatchMessage);

  return (
    <>
      <ResponsivePageStyles />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

      <HeroBanner
        badge={config.badge}
        titlePre={config.h1}
        accentText=""
        subtitle={config.intro[0]}
        stats={[
          { value: `${branch.aggregateRating}★`, label: 'GOOGLE RATING' },
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
                  <a
                    href={noBatchWhatsAppUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 24px', borderRadius: '10px', fontSize: '14px', fontWeight: 700, color: '#fff', background: '#25D366' }}
                  >
                    Ask for Next Batch Dates on WhatsApp
                  </a>
                </div>
              )}
            </div>

            {/* Courses */}
            {courses.length > 0 && (
              <div style={{ marginBottom: '28px' }}>
                <h2 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '18px', color: 'var(--text)', marginBottom: '14px' }}>
                  {topicLabel} Courses at {localityConfig.name}
                </h2>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                  {courses.map((c) => (
                    <Link key={c.slug} href={getCourseUrl(c)}
                      style={{ padding: '9px 16px', borderRadius: '8px', background: 'var(--bg-alt)', border: '1px solid var(--border)', fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>
                      {c.title}
                    </Link>
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
