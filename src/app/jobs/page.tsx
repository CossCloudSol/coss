'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Briefcase, MapPin, Users } from 'lucide-react';
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

export default function JobsPage() {
  const [jobs, setJobs] = useState<JobCardJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('All');

  useEffect(() => {
    fetch('/api/jobs')
      .then((r) => r.json())
      .then((data) => {
        setJobs(data.jobs ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filteredJobs = activeFilter === 'All'
    ? jobs
    : jobs.filter((j) =>
        j.category.toLowerCase().includes(activeFilter.toLowerCase()) ||
        j.mode.toLowerCase().includes(activeFilter.toLowerCase())
      );

  const companies = new Set(jobs.map((j) => j.company)).size;

  return (
    <main>
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

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-64 rounded-2xl bg-gray-100 dark:bg-gray-700 animate-pulse" />
            ))}
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="text-center py-20">
            <Briefcase className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" aria-hidden="true" />
            <p className="text-gray-500 dark:text-gray-400 text-base">
              No jobs in this category right now — check back soon
            </p>
            <Link href="/courses/" className="inline-block mt-4 text-sm font-semibold text-teal-600 dark:text-teal-400 hover:underline">
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
    </main>
  );
}
