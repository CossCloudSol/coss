import type { Metadata } from 'next';
import Link from 'next/link';
import { CalendarCheck } from 'lucide-react';
import { buildPageMetadataWithFallback } from '@/lib/get-page-seo';
import { findTrainers, getYearsOfExperience, splitCommaList } from '@/lib/trainer-queries';
import { optimizeCldUrl } from '@/lib/cloudinary';
import { safeJsonLd } from '@/lib/safe-json-ld';

export const revalidate = 86400;

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

function initials(name: string): string {
  const parts = name.replace(/^(mr|mrs|ms|dr)\.?\s+/i, '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * /faculty: trainers marked visible in Admin → Trainers: name, photo, title,
 * bio (public copy; clamped to 3 lines), expertise, experience and courses taught.
 */
export default async function FacultyPage() {
  const trainers = await findTrainers();

  const personSchemas = trainers.map((t) => {
    const skills = splitCommaList(t.skills);
    return {
      '@context': 'https://schema.org',
      '@type': 'Person',
      name: t.name,
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

      <section className="bg-[#0a3d4a] px-4 py-8 md:px-8 md:py-12">
        <div className="mx-auto flex max-w-[1200px] flex-col gap-3">
          <nav aria-label="Breadcrumb" className="text-[13px] text-white/70">
            <Link href="/" className="text-white/85 hover:text-white">Home</Link> / Faculty
          </nav>
          <h1 className="font-heading text-[28px] font-extrabold text-white md:text-[40px]">Our Faculty</h1>
          <p className="max-w-[720px] text-base leading-relaxed text-white/85">
            The trainers behind Coss Cloud Solutions: practitioners who teach from real project work, in Dilsukhnagar, Ameerpet and live online.
          </p>
        </div>
      </section>

      <section className="bg-[#f4f7f8] px-4 py-10 dark:bg-slate-950 md:px-8 md:py-14">
        <div className="mx-auto max-w-[1200px]">
          {trainers.length === 0 ? (
            <p className="text-center text-[#4a5c61]">Trainer profiles are coming soon.</p>
          ) : (
            <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {trainers.map((t) => {
                const years = getYearsOfExperience(t.startYear);
                const skills = splitCommaList(t.skills);
                const teaches = splitCommaList(t.teaches);
                return (
                  <li key={t.id} className="flex flex-col gap-4 rounded-2xl border border-[#e3eaec] bg-white p-6 dark:border-slate-700 dark:bg-slate-900">
                    <div className="flex items-center gap-4">
                      <span className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#e6f0f1] font-heading text-xl font-extrabold text-[#005663]">
                        {t.photoUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={optimizeCldUrl(t.photoUrl, { width: 128, height: 128, crop: 'fill', gravity: 'face' })}
                            alt={t.name}
                            width={64}
                            height={64}
                            loading="lazy"
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          initials(t.name)
                        )}
                      </span>
                      <div className="min-w-0">
                        <h2 className="font-heading text-lg font-extrabold text-[#17262a] dark:text-white">{t.name}</h2>
                        <p className="text-sm text-[#4a5c61] dark:text-slate-400">{t.title}</p>
                      </div>
                    </div>

                    {t.bio && (
                      // Clamped to 3 lines; the (visually hidden) checkbox toggles
                      // the full text with no client JS, and the text stays in the HTML.
                      <div>
                        <input type="checkbox" id={`bio-${t.id}`} className="peer sr-only" />
                        <p className="line-clamp-3 text-sm leading-relaxed text-[#4a5c61] peer-checked:line-clamp-none dark:text-slate-400">{t.bio}</p>
                        {t.bio.length > 160 && (
                          <label
                            htmlFor={`bio-${t.id}`}
                            className="mt-1 inline-block cursor-pointer text-sm font-bold text-[#b8531c] peer-focus-visible:underline [&>span:last-child]:hidden peer-checked:[&>span:first-child]:hidden peer-checked:[&>span:last-child]:inline"
                          >
                            <span>Read more</span>
                            <span>Read less</span>
                          </label>
                        )}
                      </div>
                    )}

                    {years !== null && years > 0 && (
                      <p className="text-sm text-[#26383d] dark:text-slate-300">
                        <strong className="font-heading text-lg font-extrabold text-[#0a3d4a] dark:text-white">{years}+ years</strong> industry experience
                      </p>
                    )}

                    {skills.length > 0 && (
                      <div>
                        <p className="mb-1.5 text-xs font-bold uppercase tracking-[1px] text-[#5f7075]">Expertise</p>
                        <ul className="flex flex-wrap gap-1.5">
                          {skills.map((s) => (
                            <li key={s} className="rounded-full bg-[#e6f0f1] px-2.5 py-1 text-xs font-bold text-[#005663]">{s}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {teaches.length > 0 && (
                      <p className="text-sm leading-relaxed text-[#4a5c61] dark:text-slate-400">
                        <strong className="text-[#17262a] dark:text-white">Teaches: </strong>
                        {teaches.join(', ')}
                      </p>
                    )}

                    <Link
                      href="/free-demo-class"
                      className="mt-auto flex h-11 items-center justify-center gap-2 rounded-[10px] bg-[#b8531c] text-sm font-bold text-white hover:bg-[#8f3f14]"
                    >
                      <CalendarCheck className="h-4 w-4" aria-hidden="true" />
                      Book a free demo class
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>
    </>
  );
}
