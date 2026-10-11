import type { Metadata } from 'next';
import { buildPageMetadataWithFallback } from '@/lib/get-page-seo';
import { findTrainers, splitCommaList } from '@/lib/trainer-queries';
import { getSearchIndex } from '@/lib/course-search-index';
import { safeJsonLd } from '@/lib/safe-json-ld';
import FacultyView from '@/components/faculty/FacultyView';

export const revalidate = 604800; // 7 days; admin saves revalidate on demand (usage plan, 10 Oct)

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.cosscloudsol.com';

export async function generateMetadata(): Promise<Metadata> {
  // Admin SEO for "faculty" wins when set; this is the fallback.
  return buildPageMetadataWithFallback('faculty', {
    title: 'Our Faculty: IT Trainers in Hyderabad',
    description:
      'Meet the trainers at Coss Cloud Solutions, Hyderabad: their expertise, industry experience and the courses they teach in Dilsukhnagar, Ameerpet and live online.',
    alternates: { canonical: `${SITE_URL}/faculty` },
  });
}

/**
 * /faculty (Design v4): trainers marked visible in Admin > Trainers, as cards with a profile drawer
 * (full bio, expertise, courses taught, demo form). See components/faculty/FacultyView.
 */
export default async function FacultyPage() {
  const [trainers, index] = await Promise.all([findTrainers(), getSearchIndex().catch(() => ({ courses: [], categories: [] }))]);

  const personSchemas = trainers.map((t) => {
    const skills = splitCommaList(t.skills);
    return {
      '@context': 'https://schema.org',
      '@type': 'Person',
      name: t.name,
      // Each trainer's card on this page (id below), the one public URL for them.
      url: `${SITE_URL}/faculty#trainer-${t.id}`,
      jobTitle: t.title,
      worksFor: { '@id': `${SITE_URL}/#organization` },
      ...(skills.length > 0 ? { knowsAbout: skills } : {}),
      ...(t.photoUrl ? { image: t.photoUrl } : {}),
    };
  });

  return (
    <>
      {personSchemas.map((schema, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(schema) }} />
      ))}
      <FacultyView
        trainers={trainers.map((t) => ({ id: t.id, name: t.name, title: t.title, category: t.category, skills: t.skills, teaches: t.teaches, startYear: t.startYear, bio: t.bio, photoUrl: t.photoUrl }))}
        courses={index.courses}
      />
    </>
  );
}
