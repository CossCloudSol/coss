import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { HeroBanner, CtaBanner, EnrollSidebar, ResponsivePageStyles } from '@/components/shared';
import BatchCard, { type BatchCardBatch } from '@/components/BatchCard';
import { LOCALITIES, getLocalityBySlug, BRANCH_GEO, LOCALITY_TOPIC_PAGES, TOPIC_LABELS, type BranchKey } from '@/lib/locations-data';
import { getBranchSettings } from '@/lib/get-branch-settings';
import { buildLocalBusinessSchema } from '@/lib/global-schemas';
import { buildPageMetadataWithFallback } from '@/lib/get-page-seo';
import { getCourseUrl } from '@/lib/course-url';
import { prisma } from '@/lib/db';
import CallLink from '@/components/CallLink';

export const revalidate = 86400;

/**
 * Batch.centre is free-text and nullable, entered by hand in the admin
 * panel — so it drifts from the canonical branch name (casing, whitespace,
 * "branch" suffix, typos). Match against an alias list per branch rather
 * than a single hardcoded literal, so one typo doesn't silently zero out a
 * whole branch page's batch list.
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

/** Batch cards shown per branch page. Raised from 6 -> 12: Ameerpet alone has
 *  13 active batches, and the old cap of 6 silently hid 7 of them (DevOps,
 *  Azure DevOps, AWS Solutions Architect, Azure Administrator, etc). */
const BATCH_DISPLAY_CAP = 12;

async function getBranchBatches(branchKey: BranchKey): Promise<{ batches: BatchCardBatch[]; courses: CourseLite[] }> {
  try {
    const aliases = BRANCH_CENTRE_ALIASES[branchKey];
    const candidates = await prisma.batch.findMany({
      where: { status: { in: ['upcoming', 'ongoing'] } },
      include: { course: { select: { title: true, slug: true, category: true, categorySlug: true, urlType: true } } },
      orderBy: { startDate: 'asc' },
    });
    const matched = candidates.filter((b) => aliases.includes(normalizeCentre(b.centre)));

    if (matched.length === 0) {
      const distinctCentres = Array.from(new Set(candidates.map((b) => b.centre ?? '(null)')));
      console.warn(`[getBranchBatches] branch "${branchKey}" resolved 0 batches. Distinct centre values in DB: ${JSON.stringify(distinctCentres)}`);
    }

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

    // "Courses Running at This Branch" is derived from the full matched set,
    // not the display-limited `rows` — otherwise a batch cap also hides its
    // course chip even though the course genuinely runs at this branch.
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
  return LOCALITIES.map((l) => ({ locality: l.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ locality: string }> }): Promise<Metadata> {
  const { locality } = await params;
  const config = getLocalityBySlug(locality);
  if (!config) return {};

  // Per-locality geo meta — branch pages use their own coordinates,
  // catchment pages use the nearest branch's coordinates.
  const branchKey = config.type === 'branch' ? config.branchKey : config.nearestBranches[0].branchKey;
  const geo = BRANCH_GEO[branchKey];

  return buildPageMetadataWithFallback(`locations/${locality}`, {
    title: config.metaTitle,
    description: config.metaDescription,
    keywords: config.keywords,
    alternates: { canonical: `https://www.cosscloudsol.com/locations/${locality}` },
    openGraph: {
      title: config.metaTitle,
      description: config.metaDescription,
      type: 'website',
      url: `https://www.cosscloudsol.com/locations/${locality}`,
    },
    other: {
      'geo.region': 'IN-TG',
      'geo.placename': `${config.name}, Hyderabad`,
      'geo.position': `${geo.lat};${geo.lng}`,
      'ICBM': `${geo.lat}, ${geo.lng}`,
    },
  });
}

export default async function LocalityPage({ params }: { params: Promise<{ locality: string }> }) {
  const { locality } = await params;
  const config = getLocalityBySlug(locality);
  if (!config) notFound();

  if (config.type === 'branch') {
    const [branch, { batches, courses }] = await Promise.all([
      getBranchSettings(config.branchKey),
      getBranchBatches(config.branchKey),
    ]);
    const schema = branch.schemaEnabled ? buildLocalBusinessSchema(branch) : null;

    return (
      <>
        <ResponsivePageStyles />
        {schema && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
          />
        )}
        <HeroBanner
          badge={config.badge}
          titlePre={config.h1Pre}
          accentText={config.h1Accent}
          titlePost={config.h1Post}
          subtitle={config.heroSubtitle}
          stats={[
            config.studentsTrained
              ? { value: `${config.studentsTrained}+`, label: 'STUDENTS TRAINED' }
              : { value: `${branch.reviewCount}+`, label: 'GOOGLE REVIEWS' },
            { value: String(branch.serviceAreas.length), label: 'AREAS SERVED' },
            { value: branch.workingDays.replace('-', '–'), label: `${branch.workingHoursOpen}–${branch.workingHoursClose}` },
          ]}
          ctaText={`${branch.addressLine2 || branch.city}, Hyderabad · Free career counselling`}
          breadcrumb={[{ label: config.name, href: `/locations/${config.slug}` }]}
        />

        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '56px 20px' }}>
          <div className="page-with-sidebar">
            <div>
              {config.intro.map((p, i) => (
                <p key={i} style={{ color: 'var(--text-muted)', fontSize: '15px', lineHeight: '1.8', marginBottom: '18px' }}>{p}</p>
              ))}

              {/* NAP + Map */}
              <div className="inner-card" style={{ marginBottom: '24px' }}>
                <h2 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '18px', color: 'var(--text)', marginBottom: '14px' }}>
                  📍 Visit Our {config.name} Branch
                </h2>
                <div className="page-two-col" style={{ gap: '24px', alignItems: 'start' }}>
                  <div>
                    {config.addressLines.map((line, i) => (
                      <p key={i} style={{ color: 'var(--text-muted)', fontSize: '13.5px', lineHeight: '1.8' }}>{line}</p>
                    ))}
                    <p style={{ marginTop: '12px', fontSize: '13.5px', color: 'var(--text)' }}>
                      📞 <CallLink number={branch.phone} pageType="locality" branchKey={config.branchKey} style={{ color: 'var(--primary)', fontWeight: 600 }}>{branch.phone}</CallLink>
                    </p>
                    <p style={{ fontSize: '13.5px', color: 'var(--text)' }}>
                      🕐 {branch.workingDays}, {branch.workingHoursOpen}–{branch.workingHoursClose}
                    </p>
                    <a href={config.directionsHref} target="_blank" rel="noopener noreferrer"
                      style={{ display: 'inline-block', marginTop: '12px', fontSize: '13px', fontWeight: 600, color: 'var(--primary)' }}>
                      Get directions →
                    </a>
                  </div>
                  <div style={{ borderRadius: '10px', overflow: 'hidden', border: '1px solid var(--border-card)' }}>
                    <iframe
                      src={config.mapEmbed}
                      width="100%"
                      height="220"
                      loading="lazy"
                      style={{ border: 0, display: 'block' }}
                      referrerPolicy="no-referrer-when-downgrade"
                      title={`Map – ${config.name} branch`}
                    />
                  </div>
                </div>
              </div>

              {/* Directions */}
              <div style={{ marginBottom: '28px' }}>
                <h2 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '18px', color: 'var(--text)', marginBottom: '12px' }}>
                  🚇 {config.directionsHeading}
                </h2>
                {config.directionsBody.map((line, i) => (
                  <p key={i} style={{ color: 'var(--text-muted)', fontSize: '14px', lineHeight: '1.8', marginBottom: '8px' }}>{line}</p>
                ))}
              </div>

              {/* Batches */}
              {batches.length > 0 && (
                <div style={{ marginBottom: '28px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                    <h2 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '18px', color: 'var(--text)', margin: 0 }}>
                      Upcoming Batches at {config.name}
                    </h2>
                    <Link href="/batches" style={{ fontSize: '13px', color: 'var(--primary)', fontWeight: 600 }}>
                      View all batches at this branch →
                    </Link>
                  </div>
                  <div className="course-list-grid">
                    {batches.map((b) => <BatchCard key={b.id} batch={b} />)}
                  </div>
                </div>
              )}

              {/* Courses */}
              {courses.length > 0 && (
                <div style={{ marginBottom: '28px' }}>
                  <h2 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '18px', color: 'var(--text)', marginBottom: '14px' }}>
                    Courses Running at This Branch
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

              {/* Outbound links to this branch's locality x topic pages */}
              {LOCALITY_TOPIC_PAGES.filter((t) => t.localitySlug === config.slug).length > 0 && (
                <div style={{ marginBottom: '24px' }}>
                  <h2 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '16px', color: 'var(--text)', marginBottom: '10px' }}>
                    Explore by Course Area
                  </h2>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                    {LOCALITY_TOPIC_PAGES.filter((t) => t.localitySlug === config.slug).map((t) => (
                      <Link key={t.slug} href={`/locations/${t.localitySlug}/${t.slug}`}
                        style={{ padding: '9px 16px', borderRadius: '8px', background: 'var(--primary-light)', border: '1px solid var(--border)', fontSize: '13px', fontWeight: 600, color: 'var(--primary)' }}>
                        {TOPIC_LABELS[t.topicKey]} at {config.name} →
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Areas served */}
              <div style={{ marginBottom: '8px' }}>
                <h2 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '16px', color: 'var(--text)', marginBottom: '10px' }}>
                  Areas We Serve from {config.name}
                </h2>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '14px' }}>
                  {branch.serviceAreas.map((a) => (
                    <span key={a} style={{ padding: '6px 12px', borderRadius: '999px', background: 'var(--bg-alt)', fontSize: '12px', color: 'var(--text-muted)' }}>{a}</span>
                  ))}
                </div>
                {config.nearbyCatchmentSlugs.length > 0 && (
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                    Commuting from further out? See training options for{' '}
                    {config.nearbyCatchmentSlugs.map((slug, i) => {
                      const c = getLocalityBySlug(slug);
                      if (!c) return null;
                      return (
                        <span key={slug}>
                          {i > 0 && ' and '}
                          <Link href={`/locations/${slug}`} style={{ color: 'var(--primary)', fontWeight: 600 }}>{c.name}</Link>
                        </span>
                      );
                    })}.
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

  /* ── Catchment page (no branch here) ── */
  const primaryBranch = config.nearestBranches[0];
  const { batches, courses } = await getBranchBatches(primaryBranch.branchKey);
  const branchDisplay = primaryBranch.branchKey === 'dilsukhnagar' ? 'Dilsukhnagar' : 'Ameerpet';

  return (
    <>
      <ResponsivePageStyles />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            name: config.metaTitle,
            description: config.metaDescription,
            url: `https://www.cosscloudsol.com/locations/${config.slug}`,
            about: 'IT training and upskilling courses',
            isPartOf: { '@id': 'https://www.cosscloudsol.com/#website' },
          }),
        }}
      />
      <HeroBanner
        badge={config.badge}
        titlePre={config.h1Pre}
        accentText={config.h1Accent}
        titlePost={config.h1Post}
        subtitle={config.heroSubtitle}
        stats={[
          { value: primaryBranch.travelTime, label: `TO ${branchDisplay.toUpperCase()} BRANCH` },
          { value: 'Weekend', label: 'BATCHES AVAILABLE' },
          { value: 'Online', label: 'OPTION AVAILABLE' },
          { value: 'Free', label: 'COUNSELLING' },
        ]}
        ctaText="No branch in this area — honest commute guidance below · Free counselling"
        breadcrumb={[{ label: config.name, href: `/locations/${config.slug}` }]}
      />

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '56px 20px' }}>
        <div className="page-with-sidebar">
          <div>
            {config.intro.map((p, i) => (
              <p key={i} style={{ color: 'var(--text-muted)', fontSize: '15px', lineHeight: '1.8', marginBottom: '18px' }}>{p}</p>
            ))}

            <div style={{ marginBottom: '28px' }}>
              <h2 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '18px', color: 'var(--text)', marginBottom: '12px' }}>
                {config.audienceHeading}
              </h2>
              {config.audienceBody.map((p, i) => (
                <p key={i} style={{ color: 'var(--text-muted)', fontSize: '14px', lineHeight: '1.8', marginBottom: '10px' }}>{p}</p>
              ))}
            </div>

            {config.secondaryHeading && config.secondaryBody && (
              <div style={{ marginBottom: '28px' }}>
                <h2 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '18px', color: 'var(--text)', marginBottom: '12px' }}>
                  {config.secondaryHeading}
                </h2>
                {config.secondaryBody.map((p, i) => (
                  <p key={i} style={{ color: 'var(--text-muted)', fontSize: '14px', lineHeight: '1.8', marginBottom: '10px' }}>{p}</p>
                ))}
              </div>
            )}

            {/* Nearest branches */}
            <div style={{ marginBottom: '28px' }}>
              <h2 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '18px', color: 'var(--text)', marginBottom: '14px' }}>
                🚇 Nearest Branches &amp; Commute
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {config.nearestBranches.map((nb) => (
                  <div key={nb.branchKey} className="inner-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: '8px', marginBottom: '6px' }}>
                      <Link href={`/locations/${nb.branchKey}`} style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '15px', color: 'var(--primary)' }}>
                        {nb.label} →
                      </Link>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text)' }}>{nb.travelTime}</span>
                    </div>
                    <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '4px' }}>{nb.route}</p>
                    <p style={{ fontSize: '12.5px', color: 'var(--text-light)' }}>{nb.whyThisOne}</p>
                  </div>
                ))}
              </div>
              <p style={{ marginTop: '14px', fontSize: '13.5px', color: 'var(--text-muted)', background: 'var(--bg-alt)', padding: '12px 16px', borderRadius: '8px' }}>
                💻 {config.onlineNote}
              </p>
            </div>

            {/* Batches at nearest branch */}
            {batches.length > 0 && (
              <div style={{ marginBottom: '28px' }}>
                <h2 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '18px', color: 'var(--text)', marginBottom: '14px' }}>
                  Upcoming Batches at Your Nearest Branch ({branchDisplay})
                </h2>
                <div className="course-list-grid">
                  {batches.map((b) => <BatchCard key={b.id} batch={b} />)}
                </div>
              </div>
            )}

            {courses.length > 0 && (
              <div style={{ marginBottom: '8px' }}>
                <h2 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '16px', color: 'var(--text)', marginBottom: '10px' }}>
                  Popular Courses for This Area
                </h2>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '14px' }}>
                  {courses.map((c) => (
                    <Link key={c.slug} href={getCourseUrl(c)}
                      style={{ padding: '9px 16px', borderRadius: '8px', background: 'var(--bg-alt)', border: '1px solid var(--border)', fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>
                      {c.title}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            <div>
              <h2 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '15px', color: 'var(--text)', marginBottom: '10px' }}>
                Areas We Cover
              </h2>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {config.areasCovered.map((a) => (
                  <span key={a} style={{ padding: '6px 12px', borderRadius: '999px', background: 'var(--bg-alt)', fontSize: '12px', color: 'var(--text-muted)' }}>{a}</span>
                ))}
              </div>
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
