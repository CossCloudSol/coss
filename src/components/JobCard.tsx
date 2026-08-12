'use client';

import Link from 'next/link';
import { jobApplyMessage } from '@/lib/whatsapp';
import WhatsAppLink from '@/components/WhatsAppLink';

export interface JobCardJob {
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
  skills: string[];
  featured: boolean;
  postedAt: string;
}

const COMPANY_COLORS: Record<string, string> = {
  A: '#e47538', B: '#3b82f6', C: '#10b981', D: '#8b5cf6',
  E: '#ef4444', F: '#f59e0b', G: '#0ea5e9', H: '#ec4899',
  I: '#14b8a6', J: '#f97316', K: '#6366f1', L: '#22c55e',
  M: '#e11d48', N: '#06b6d4', O: '#84cc16', P: '#a855f7',
  Q: '#0891b2', R: '#dc2626', S: '#2563eb', T: '#059669',
  U: '#7c3aed', V: '#d97706', W: '#0f766e', X: '#be185d',
  Y: '#1d4ed8', Z: '#15803d',
};

function getCompanyColor(company: string): string {
  const first = company.trim().toUpperCase()[0] ?? 'C';
  return COMPANY_COLORS[first] ?? '#0f766e';
}

interface JobCardProps {
  job: JobCardJob;
  showCourseLink?: boolean;
}

export default function JobCard({ job, showCourseLink = false }: JobCardProps) {
  const color = getCompanyColor(job.company);
  const initial = job.company.trim()[0]?.toUpperCase() ?? '?';

  const waMessage = jobApplyMessage({ jobTitle: job.title, company: job.company });

  const categorySlug = job.category
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return (
    <article
      className="flex flex-col rounded-2xl border bg-white dark:bg-gray-800 dark:border-gray-700 overflow-hidden transition-shadow hover:shadow-lg"
      style={job.featured ? { borderColor: '#3b82f6', borderWidth: '2px' } : {}}
    >
      {/* Header */}
      <div className="p-5 pb-3 flex items-start gap-3">
        {/* Company logo / initials */}
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold text-lg shrink-0"
          style={{ background: color }}
          aria-hidden="true"
        >
          {job.companyLogo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={job.companyLogo} alt={job.company} className="w-full h-full object-contain rounded-xl" />
          ) : (
            initial
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-bold text-gray-900 dark:text-white text-base leading-snug line-clamp-2">
              {job.title}
            </h3>
            {job.featured && (
              <span className="shrink-0 text-xs font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
                Featured
              </span>
            )}
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-0.5 truncate">
            {job.company} · {job.location}
          </p>
        </div>
      </div>

      {/* Badges */}
      <div className="px-5 flex flex-wrap gap-2 mt-1">
        {[job.type, job.mode, job.experience].map((badge) => (
          <span
            key={badge}
            className="text-xs px-2.5 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 font-medium"
          >
            {badge}
          </span>
        ))}
      </div>

      {/* Skills */}
      {job.skills.length > 0 && (
        <div className="px-5 mt-3 flex flex-wrap gap-1.5">
          {job.skills.slice(0, 6).map((skill) => (
            <span
              key={skill}
              className="text-xs px-2 py-0.5 rounded bg-gray-50 dark:bg-gray-700/60 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300"
            >
              {skill}
            </span>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="mt-auto px-5 py-4 flex items-center justify-between gap-3 border-t border-gray-100 dark:border-gray-700">
        <div>
          {job.salary ? (
            <span className="text-sm font-semibold text-teal-600 dark:text-teal-400">{job.salary}</span>
          ) : (
            <span className="text-xs text-gray-500 dark:text-gray-400">Salary not disclosed</span>
          )}
        </div>
        <WhatsAppLink
          ctaType="job"
          message={waMessage}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white transition-opacity hover:opacity-90"
          style={{ background: '#e47538' }}
        >
          Apply via Coss Cloud Solutions
        </WhatsAppLink>
      </div>

      {/* Course link */}
      {showCourseLink && (
        <div className="px-5 pb-4">
          <Link
            href={`/courses/${categorySlug}/`}
            className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
          >
            Get job-ready: {job.category} course →
          </Link>
        </div>
      )}
    </article>
  );
}
