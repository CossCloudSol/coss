import type { Metadata } from 'next';
import { Briefcase, MapPin, Users } from 'lucide-react';
import JobsBoard from './JobsBoard';
import { findActiveJobs } from '@/lib/job-queries';
import { buildPageMetadataWithFallback } from '@/lib/get-page-seo';
import type { JobCardJob } from '@/components/JobCard';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.cosscloudsol.com';

// Server-rendered and cached; admin job edits revalidate it (src/lib/revalidate.ts).
export const revalidate = 600;

export async function generateMetadata(): Promise<Metadata> {
  // Admin SEO for "jobs" wins when set; this is the fallback.
  return buildPageMetadataWithFallback('jobs', {
    title: 'IT Job Openings in Hyderabad',
    description:
      'Current IT job openings in Hyderabad shared with Coss Cloud Solutions students: cloud, DevOps, data, full stack, SAP and more, updated by our placement team.',
    alternates: { canonical: `${SITE_URL}/jobs` },
  });
}

export default async function JobsPage() {
  const rows = await findActiveJobs();
  const jobs: JobCardJob[] = rows.map((j) => ({
    id: j.id, title: j.title, slug: j.slug, company: j.company, companyLogo: j.companyLogo,
    location: j.location, type: j.type, mode: j.mode, category: j.category, experience: j.experience,
    salary: j.salary, skills: j.skills, featured: j.featured, postedAt: j.postedAt.toISOString(),
  }));
  const companies = new Set(jobs.map((j) => j.company)).size;

  // No main element here: the root layout already wraps every page in one.
  return (
    <div>
      {/* Hero */}
      <section
        className="relative overflow-hidden py-16 px-4 md:px-8"
        style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #0f3460 100%)' }}
      >
        <div className="max-w-[1100px] mx-auto text-center">
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-widest mb-4"
            style={{ background: 'rgba(228,117,56,0.15)', border: '1px solid rgba(228,117,56,0.35)', color: '#e47538' }}>
            <Briefcase className="w-3.5 h-3.5" aria-hidden="true" />
            Placement Board
          </div>
          <h1 className="font-extrabold text-white leading-tight mb-4" style={{ fontSize: 'clamp(28px,4vw,46px)' }}>
            Job Openings
          </h1>
          <p className="text-base max-w-xl mx-auto mb-8" style={{ color: 'rgba(255,255,255,0.7)' }}>
            Partner companies hiring Coss Cloud Solutions-trained professionals in Hyderabad
          </p>

          {/* Stats */}
          <div className="flex flex-wrap justify-center gap-8">
            {[
              { Icon: Briefcase, value: jobs.length.toString(), label: 'Total Jobs' },
              { Icon: MapPin,    value: jobs.length.toString(), label: 'Active Now' },
              { Icon: Users,     value: companies.toString(), label: 'Companies Hiring' },
            ].map(({ Icon, value, label }) => (
              <div key={label} className="flex items-center gap-2">
                <Icon className="w-4 h-4 text-teal-400" aria-hidden="true" />
                <span className="font-extrabold text-white text-lg">{value}</span>
                <span className="text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <JobsBoard jobs={jobs} />
    </div>
  );
}
