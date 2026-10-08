'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Briefcase } from 'lucide-react';
import JobCard, { type JobCardJob } from '@/components/JobCard';

const CATEGORY_FILTERS = [
  'All',
  'Cloud',
  'DevOps',
  'Data',
  'Full Stack',
  'HR',
  'Cybersecurity',
  'Remote',
  'ERP',
  'SAP',
];

/** The /jobs filter pills and job grid. The jobs come server-rendered from the page. */
export default function JobsBoard({ jobs }: { jobs: JobCardJob[] }) {
  const [activeFilter, setActiveFilter] = useState('All');

  const filteredJobs = activeFilter === 'All'
    ? jobs
    : jobs.filter((j) =>
        j.category.toLowerCase().includes(activeFilter.toLowerCase()) ||
        j.mode.toLowerCase().includes(activeFilter.toLowerCase())
      );

  return (
    <div className="max-w-[1100px] mx-auto px-4 md:px-8 py-10">
      {/* Filter pills */}
      <div className="flex flex-wrap gap-2 mb-8">
        {CATEGORY_FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            className="px-4 py-2 rounded-full text-sm font-medium transition-all border min-h-[44px]"
            style={
              activeFilter === f
                ? { background: '#e47538', borderColor: '#e47538', color: '#fff' }
                : { background: 'var(--bg-card,#fff)', borderColor: '#e5e7eb', color: 'var(--text,#111)' }
            }
          >
            {f}
          </button>
        ))}
      </div>

      {filteredJobs.length === 0 ? (
        <div className="text-center py-20">
          <Briefcase className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" aria-hidden="true" />
          <p className="text-gray-500 dark:text-gray-400 text-base">
            No jobs in this category right now — check back soon
          </p>
          <Link href="/courses" className="inline-block mt-4 text-sm font-semibold text-teal-600 dark:text-teal-400 hover:underline">
            Browse our courses to get job-ready →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredJobs.map((job) => (
            <Link key={job.id} href={`/jobs/${job.slug}`} className="block group" style={{ textDecoration: 'none' }}>
              <JobCard job={job} showCourseLink />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
