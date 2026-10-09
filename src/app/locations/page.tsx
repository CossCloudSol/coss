import type { Metadata } from 'next';
import Link from 'next/link';
import { PageBanner, ResponsivePageStyles } from '@/components/shared';
import CallLink from '@/components/CallLink';
import { getAllBranchSettings } from '@/lib/get-branch-settings';
import { getBranchHours } from '@/lib/branch-hours';
import { buildPageMetadataWithFallback } from '@/lib/get-page-seo';
import { LOCALITIES, LOCALITY_TOPIC_PAGES, TOPIC_LABELS, getLocalityBySlug, type BranchLocalityConfig, type CatchmentLocalityConfig } from '@/lib/locations-data';
import { safeJsonLd } from '@/lib/safe-json-ld';
import { SITE_URL, breadcrumbList, collectionPage, jsonLdGraph } from '@/lib/structured-data';

export const revalidate = 86400;

export async function generateMetadata(): Promise<Metadata> {
  // Admin SEO for "locations" wins when set; this is the fallback.
  return buildPageMetadataWithFallback('locations', {
    title: 'Our Centres in Hyderabad: Dilsukhnagar & Ameerpet',
    description:
      'Coss Cloud Solutions centres in Dilsukhnagar and Ameerpet, Hyderabad: addresses, timings and directions, plus guides for students travelling in from nearby areas.',
    alternates: { canonical: `${SITE_URL}/locations` },
  });
}

const card = { background: 'var(--bg-card)', borderRadius: '14px', padding: '24px', border: '1px solid var(--border-card)' } as const;
const h2 = { fontFamily: 'var(--font-poppins), Poppins, sans-serif', fontWeight: 700, fontSize: '20px', color: 'var(--text)', margin: '0 0 16px' } as const;

/** /locations: every centre and every area guide, from the same data the pages use. */
export default async function LocationsIndexPage() {
  const branches = await getAllBranchSettings();
  const hours = await Promise.all(branches.map(getBranchHours));
  const centrePages = LOCALITIES.filter((l): l is BranchLocalityConfig => l.type === 'branch');
  const areaPages = LOCALITIES.filter((l): l is CatchmentLocalityConfig => l.type === 'catchment');

  const pageUrl = `${SITE_URL}/locations`;
  const graph = jsonLdGraph([
    ...collectionPage({
      url: pageUrl,
      name: 'Coss Cloud Solutions centres in Hyderabad',
      items: [...centrePages, ...areaPages].map((l) => ({ name: l.name, url: `${SITE_URL}/locations/${l.slug}` })),
    }),
    breadcrumbList(pageUrl, [{ name: 'Home', url: SITE_URL }, { name: 'Locations', url: pageUrl }]),
  ]);

  return (
    <>
      {graph && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(graph) }} />}
      <ResponsivePageStyles />
      <PageBanner title="Our Centres in Hyderabad" breadcrumb={[{ label: 'Locations', href: '/locations' }]} />

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '48px 20px' }}>
        <h2 style={h2}>Visit a centre</h2>
        <div className="contact-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '44px' }}>
          {centrePages.map((loc) => {
            const i = branches.findIndex((b) => b.branchKey === loc.branchKey);
            const branch = branches[i];
            if (!branch) return null;
            return (
              <div key={loc.slug} style={card}>
                <h3 style={{ fontFamily: 'var(--font-poppins), Poppins, sans-serif', fontWeight: 700, fontSize: '17px', color: 'var(--text)', margin: '0 0 10px' }}>
                  {loc.name} Centre
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '14px', lineHeight: 1.7, margin: '0 0 8px' }}>
                  {branch.addressLine1}, {branch.addressLine2}, {branch.city} – {branch.pincode}
                </p>
                {hours[i].groups.map((g) => (
                  <p key={g.days} style={{ color: 'var(--text)', fontSize: '14px', margin: '0 0 4px' }}>🕐 {g.days}, {g.time}</p>
                ))}
                <p style={{ fontSize: '14px', margin: '8px 0 14px' }}>
                  📞 <CallLink number={branch.phone} pageType="locality" branchKey={loc.branchKey} style={{ color: 'var(--primary)', fontWeight: 600 }}>{branch.phone}</CallLink>
                </p>
                <Link href={`/locations/${loc.slug}`} style={{ display: 'inline-flex', alignItems: 'center', minHeight: '44px', fontSize: '14px', fontWeight: 700, color: 'var(--primary)' }}>
                  Directions and courses at {loc.name} →
                </Link>
              </div>
            );
          })}
        </div>

        {areaPages.length > 0 && (
          <>
            <h2 style={h2}>Coming from a nearby area?</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '14.5px', lineHeight: 1.7, margin: '0 0 16px' }}>
              We have no centre in these areas; each guide shows the easiest way to reach us, and the online option.
            </p>
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 44px', display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              {areaPages.map((loc) => (
                <li key={loc.slug}>
                  <Link href={`/locations/${loc.slug}`} style={{ ...card, display: 'inline-flex', alignItems: 'center', minHeight: '44px', padding: '10px 18px', fontSize: '14px', fontWeight: 600, color: 'var(--text)' }}>
                    {loc.name}
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}

        {LOCALITY_TOPIC_PAGES.length > 0 && (
          <>
            <h2 style={h2}>Courses by centre</h2>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              {LOCALITY_TOPIC_PAGES.map((t) => (
                <li key={`${t.localitySlug}/${t.slug}`}>
                  <Link href={`/locations/${t.localitySlug}/${t.slug}`} style={{ ...card, display: 'inline-flex', alignItems: 'center', minHeight: '44px', padding: '10px 18px', fontSize: '14px', fontWeight: 600, color: 'var(--text)' }}>
                    {TOPIC_LABELS[t.topicKey]} at {getLocalityBySlug(t.localitySlug)?.name ?? t.localitySlug}
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </>
  );
}
