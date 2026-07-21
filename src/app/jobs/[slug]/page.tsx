import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { buildWhatsAppUrl, jobApplyMessage } from '@/lib/whatsapp';
import { buildPageMetadataWithFallback } from '@/lib/get-page-seo';
import { getActiveJobBySlug } from '@/lib/job-queries';
import { prisma } from '@/lib/db';

export const revalidate = 600;

export async function generateStaticParams() {
  try {
    const jobs = await prisma.job.findMany({
      where: {
        status: 'active',
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
      select: { slug: true },
    });
    return jobs.map((j) => ({ slug: j.slug }));
  } catch {
    return [];
  }
}

interface Job {
  id: string;
  title: string;
  slug: string;
  company: string;
  companyLogo?: string | null;
  location: string;
  type: string;
  mode: string;
  category: string;
  experience: string;
  salary?: string | null;
  description: string;
  skills: string[];
  applyUrl?: string | null;
  status: string;
  featured: boolean;
  postedAt: string;
  expiresAt?: string | null;
}

async function getJob(slug: string): Promise<Job | null> {
  const job = await getActiveJobBySlug(slug);
  return job as unknown as Job | null;
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const job = await getJob(params.slug);
  if (!job) return { title: 'Job Not Found' };
  const title = `${job.title} at ${job.company} — Hyderabad`;
  const description = `${job.title} opening at ${job.company} in ${job.location}. ${job.experience} experience. Apply through Coss Cloud Solutions placement assistance.`;
  const fallback: Metadata = {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      images: job.companyLogo ? [{ url: job.companyLogo }] : undefined,
    },
  };
  return buildPageMetadataWithFallback(`jobs/${params.slug}`, fallback);
}

export default async function JobDetailPage({ params }: { params: { slug: string } }) {
  const job = await getJob(params.slug);
  if (!job) notFound();

  const waUrl = buildWhatsAppUrl(jobApplyMessage({ jobTitle: job.title, company: job.company }));

  const jobSchema = {
    '@context': 'https://schema.org/',
    '@type': 'JobPosting',
    title: job.title,
    description: job.description,
    hiringOrganization: {
      '@type': 'Organization',
      name: job.company,
    },
    jobLocation: {
      '@type': 'Place',
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'Hyderabad',
        addressRegion: 'Telangana',
        addressCountry: 'IN',
      },
    },
    employmentType: job.type.toUpperCase().replace(/ /g, '_'),
    datePosted: job.postedAt,
    validThrough: job.expiresAt,
  };

  const categorySlug = job.category
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  const postedDate = new Date(job.postedAt).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'long', year: 'numeric',
  });

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jobSchema) }}
      />

      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg, #1a1a2e, #0f3460)', padding: '40px 20px', color: '#fff' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <nav style={{ marginBottom: '16px', fontSize: '13px', color: 'rgba(255,255,255,0.6)' }}>
            <Link href="/" style={{ color: 'rgba(255,255,255,0.6)' }}>Home</Link>
            <span style={{ margin: '0 8px' }}>›</span>
            <Link href="/jobs" style={{ color: 'rgba(255,255,255,0.6)' }}>Jobs</Link>
            <span style={{ margin: '0 8px' }}>›</span>
            <span style={{ color: '#fff' }}>{job.title}</span>
          </nav>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '20px', flexWrap: 'wrap' }}>
            <div
              style={{
                width: '64px', height: '64px', borderRadius: '14px', flexShrink: 0,
                background: '#e47538', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '28px', fontWeight: 800, color: '#fff',
              }}
            >
              {job.company[0]?.toUpperCase()}
            </div>

            <div style={{ flex: 1 }}>
              <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)', marginBottom: '4px' }}>{job.company}</p>
              <h1 style={{ fontWeight: 800, fontSize: 'clamp(22px,3.5vw,36px)', color: '#fff', marginBottom: '12px', lineHeight: 1.2 }}>
                {job.title}
              </h1>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '16px' }}>
                {[job.location, job.type, job.mode, job.experience].map((b) => (
                  <span key={b} style={{ background: 'rgba(255,255,255,0.12)', color: '#fff', fontSize: '12px', padding: '4px 12px', borderRadius: '6px' }}>
                    {b}
                  </span>
                ))}
                {job.salary && (
                  <span style={{ background: 'rgba(16,185,129,0.25)', color: '#6ee7b7', fontSize: '12px', fontWeight: 700, padding: '4px 12px', borderRadius: '6px' }}>
                    {job.salary}
                  </span>
                )}
              </div>
              <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>
                Posted {postedDate}
                {job.expiresAt && ` · Open until ${new Date(job.expiresAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}`}
              </p>
            </div>

            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                background: '#e47538', color: '#fff', fontWeight: 700, fontSize: '14px',
                padding: '14px 28px', borderRadius: '12px', textDecoration: 'none',
                whiteSpace: 'nowrap',
              }}
            >
              Apply via Coss Cloud Solutions
            </a>
          </div>
        </div>
      </div>

      {/* Body */}
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '40px 20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '32px', alignItems: 'start' }}>
          {/* Main */}
          <div>
            {/* Description */}
            <div style={{ background: 'var(--bg-card)', borderRadius: '14px', padding: '28px', border: '1px solid var(--border-card)', marginBottom: '24px' }}>
              <h2 style={{ fontWeight: 700, fontSize: '18px', color: 'var(--text)', marginBottom: '16px', fontFamily: 'Poppins, sans-serif' }}>
                Job Description
              </h2>
              <div
                style={{ color: 'var(--text-muted)', fontSize: '14.5px', lineHeight: '1.8', whiteSpace: 'pre-wrap' }}
              >
                {job.description}
              </div>
            </div>

            {/* Skills */}
            {job.skills.length > 0 && (
              <div style={{ background: 'var(--bg-card)', borderRadius: '14px', padding: '28px', border: '1px solid var(--border-card)' }}>
                <h2 style={{ fontWeight: 700, fontSize: '18px', color: 'var(--text)', marginBottom: '16px', fontFamily: 'Poppins, sans-serif' }}>
                  Required Skills
                </h2>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {job.skills.map((s) => (
                    <span key={s} style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: '12px', padding: '5px 12px', borderRadius: '20px', fontFamily: 'Poppins, sans-serif', fontWeight: 500 }}>
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div style={{ position: 'sticky', top: '80px' }}>
            {/* Apply CTA */}
            <div style={{ background: 'linear-gradient(135deg, #1a1a2e, #0f3460)', borderRadius: '14px', padding: '24px', marginBottom: '16px' }}>
              <h3 style={{ fontWeight: 700, fontSize: '16px', color: '#fff', marginBottom: '8px' }}>
                Ready to Apply?
              </h3>
              <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '13px', marginBottom: '20px', lineHeight: '1.6' }}>
                Apply through Coss Cloud Solutions placement assistance. Our team will help you with resume review, interview prep, and direct referral.
              </p>
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: 'block', textAlign: 'center', background: '#e47538', color: '#fff', fontWeight: 700, fontSize: '14px', padding: '14px', borderRadius: '10px', textDecoration: 'none' }}
              >
                Apply via WhatsApp
              </a>
              {job.applyUrl && (
                <a
                  href={job.applyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ display: 'block', textAlign: 'center', marginTop: '10px', color: 'rgba(255,255,255,0.65)', fontSize: '12px', textDecoration: 'underline' }}
                >
                  Apply directly on company website →
                </a>
              )}
            </div>

            {/* Related course */}
            <div style={{ background: 'var(--bg-card)', borderRadius: '14px', padding: '20px', border: '1px solid var(--border-card)' }}>
              <h3 style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text)', marginBottom: '8px' }}>
                Prepare for this Role
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '14px', lineHeight: '1.6' }}>
                Get the skills needed for {job.title} with our hands-on {job.category} training in Hyderabad.
              </p>
              <Link
                href={`/courses/${categorySlug}/`}
                style={{ display: 'block', textAlign: 'center', background: '#0f766e', color: '#fff', fontWeight: 700, fontSize: '13px', padding: '11px', borderRadius: '8px', textDecoration: 'none' }}
              >
                View {job.category} Courses →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
