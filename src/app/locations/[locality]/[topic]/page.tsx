import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { HeroBanner, CtaBanner, EnrollSidebar, ResponsivePageStyles } from '@/components/shared';
import {
  LOCALITY_TOPIC_PAGES,
  getLocalityTopicPage,
  getLocalityBySlug,
  TOPIC_LABELS,
} from '@/lib/locations-data';
import { getBranchSettings } from '@/lib/get-branch-settings';
import { buildPageMetadataWithFallback } from '@/lib/get-page-seo';

export const revalidate = 600;

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
  const branch = await getBranchSettings(config.branchKey);

  return (
    <>
      <ResponsivePageStyles />

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
