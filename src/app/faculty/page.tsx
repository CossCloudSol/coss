import type { Metadata } from 'next';
import Link from 'next/link';
import { PageBanner, ResponsivePageStyles } from '@/components/shared';
import { buildPageMetadata } from '@/lib/get-page-seo';
import { findTrainers, getYearsOfExperience, splitCommaList } from '@/lib/trainer-queries';

export const revalidate = 86400;
export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata('faculty');
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.cosscloudsol.com';

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default async function FacultyPage() {
  const trainers = await findTrainers();

  // Person schema per visible trainer — PageSeo.schemaMarkup only renders on
  // two course routes, so this page builds and emits its own JSON-LD rather
  // than going through that field. Mirrors the script-tag emission pattern
  // used for buildGlobalSchemas() in layout.tsx.
  const personSchemas = trainers.map((trainer) => {
    const skills = splitCommaList(trainer.skills);
    return {
      '@context': 'https://schema.org',
      '@type': 'Person',
      name: trainer.name,
      jobTitle: trainer.title,
      worksFor: { '@id': `${SITE_URL}/#organization` },
      ...(skills.length > 0 ? { knowsAbout: skills } : {}),
      ...(trainer.photoUrl ? { image: trainer.photoUrl } : {}),
    };
  });

  return (
    <>
      <ResponsivePageStyles />
      <style suppressHydrationWarning>{`
        .faculty-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
        @media (max-width: 768px) {
          .faculty-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {personSchemas.map((schema, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}

      <PageBanner title="Our Faculty" breadcrumb={[{ label: 'Faculty', href: '/faculty/' }]} />

      <div style={{ maxWidth: '1160px', margin: '0 auto', padding: '56px 20px' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: '15px', lineHeight: '1.8', maxWidth: '760px', margin: '0 auto 40px', textAlign: 'center' }}>
          Meet the trainers behind Coss Cloud Solutions — industry practitioners who bring real-world project experience into every classroom.
        </p>

        <div className="faculty-grid">
          {trainers.map((trainer) => {
            const years = getYearsOfExperience(trainer.startYear);
            const skills = splitCommaList(trainer.skills);
            const teaches = splitCommaList(trainer.teaches);

            return (
              <div
                key={trainer.id}
                style={{
                  display: 'flex', flexDirection: 'column', height: '100%',
                  background: 'var(--bg-card)', border: '1px solid var(--border-card)',
                  borderRadius: '14px', padding: '26px', boxShadow: 'var(--shadow-sm)',
                }}
              >
                <div style={{
                  width: '64px', height: '64px', borderRadius: '50%', overflow: 'hidden',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'rgba(232,64,28,0.1)', color: '#e8401c',
                  fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '20px',
                  marginBottom: '16px', flexShrink: 0,
                }}>
                  {trainer.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={trainer.photoUrl} alt={trainer.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    getInitials(trainer.name)
                  )}
                </div>

                {trainer.category && (
                  <div style={{ color: '#e8401c', fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>
                    {trainer.category}
                  </div>
                )}

                <h3 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '18px', color: 'var(--text)', marginBottom: '2px' }}>
                  {trainer.name}
                </h3>
                <p style={{ fontSize: '13.5px', color: 'var(--text-muted)', marginBottom: '14px' }}>
                  {trainer.title}
                </p>

                {skills.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '16px' }}>
                    {skills.map((skill) => (
                      <span
                        key={skill}
                        style={{ background: 'rgba(232,64,28,0.1)', color: '#e8401c', fontSize: '11.5px', fontWeight: 600, padding: '4px 10px', borderRadius: '20px' }}
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                )}

                {years !== null && (
                  <div style={{ marginBottom: '16px' }}>
                    <strong style={{ display: 'block', fontFamily: 'Poppins, sans-serif', fontSize: '20px', fontWeight: 800, color: 'var(--text)' }}>
                      {years}+ {years === 1 ? 'Year' : 'Years'}
                    </strong>
                    <span style={{ fontSize: '11px', color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>
                      Industry Experience
                    </span>
                  </div>
                )}

                {teaches.length > 0 && (
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.7', marginBottom: '14px' }}>
                    <strong style={{ color: 'var(--text)' }}>Teaches: </strong>{teaches.join(', ')}
                  </p>
                )}

                {trainer.bio && (
                  <p style={{ fontSize: '13.5px', color: 'var(--text-muted)', lineHeight: '1.75', marginBottom: '20px' }}>
                    {trainer.bio}
                  </p>
                )}

                <Link
                  href="/free-demo-class/"
                  style={{
                    marginTop: 'auto', display: 'block', textAlign: 'center',
                    background: '#e8401c', color: '#fff', padding: '11px', borderRadius: '6px',
                    fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '13px',
                  }}
                >
                  Book a Free Demo Class
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
