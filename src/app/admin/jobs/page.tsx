'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Plus, Search, Pencil, Trash2, Star, Loader2 } from 'lucide-react';

interface JobItem {
  id: string;
  title: string;
  slug: string;
  company: string;
  category: string;
  type: string;
  experience: string;
  salary: string | null;
  status: string;
  featured: boolean;
  expiresAt: string | null;
  postedAt: string;
}

const STATUS_STYLES: Record<string, string> = {
  active: 'bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:ring-emerald-700',
  closed: 'bg-gray-50 text-gray-600 ring-gray-200 dark:bg-gray-700 dark:text-gray-400 dark:ring-gray-600',
  draft:  'bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:ring-amber-700',
};

export default function AdminJobsPage() {
  const [jobs, setJobs] = useState<JobItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: '20' });
    if (search) params.set('search', search);
    if (statusFilter) params.set('status', statusFilter);
    try {
      const res = await fetch(`/api/admin/jobs?${params}`);
      const data = await res.json();
      setJobs(data.jobs ?? []);
      setTotal(data.total ?? 0);
      setTotalPages(data.totalPages ?? 1);
    } catch {
      showToast('Failed to load jobs', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => { void load(); }, [load]);

  async function toggleStatus(id: string, current: string) {
    const next = current === 'active' ? 'closed' : 'active';
    try {
      await fetch(`/api/admin/jobs/${id}/toggle`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ field: 'status', value: next }),
      });
      showToast(`Status set to ${next}`);
      void load();
    } catch { showToast('Failed to update status', 'error'); }
  }

  async function toggleFeatured(id: string, current: boolean) {
    try {
      await fetch(`/api/admin/jobs/${id}/toggle`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ field: 'featured', value: !current }),
      });
      showToast(current ? 'Removed from featured' : 'Marked as featured');
      void load();
    } catch { showToast('Failed to update featured', 'error'); }
  }

  async function deleteJob(id: string, title: string) {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    try {
      await fetch(`/api/admin/jobs/${id}`, { method: 'DELETE' });
      showToast('Job deleted');
      void load();
    } catch { showToast('Failed to delete job', 'error'); }
  }

  const now = new Date();

  const loader = (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="w-6 h-6 animate-spin text-teal-500" />
    </div>
  );

  const empty = (
    <div className="text-center py-20 text-gray-500 dark:text-gray-400">
      <p>No jobs found.</p>
    </div>
  );

  return (
    <div className="p-6 max-w-7xl mx-auto overflow-x-hidden">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg text-sm font-medium shadow-lg ${toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'}`}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Jobs</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{total} job{total !== 1 ? 's' : ''} total</p>
        </div>
        <Link
          href="/admin/jobs/new"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-colors"
          style={{ background: '#e47538' }}
        >
          <Plus className="w-4 h-4" aria-hidden="true" /> Add Job
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" aria-hidden="true" />
          <input
            type="text"
            placeholder="Search jobs..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white focus:outline-none"
        >
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="closed">Closed</option>
          <option value="draft">Draft</option>
        </select>
      </div>

      {/* Mobile card list */}
      <div className="block lg:hidden mb-5">
        {loading ? loader : jobs.length === 0 ? empty : (
          <div className="flex flex-col gap-2">
            {jobs.map((job, index) => {
              const isActive = job.status === 'active';
              const isEven = index % 2 === 0;
              const expired = job.expiresAt ? new Date(job.expiresAt) < now : false;
              const cardBg = isActive
                ? isEven ? 'bg-[#024c57]' : 'bg-[#03798a]'
                : 'bg-white dark:bg-[#161b22] border-[1.5px] border-[#94a3b8] dark:border-[#21262d]';
              const titleCls = isActive
                ? 'text-white font-medium'
                : 'text-[#0f172a] dark:text-[#e6edf3] font-medium';
              const subtitleCls = isActive
                ? 'text-white/70'
                : 'text-[#475569] dark:text-[#8b949e]';
              const editBg = isActive
                ? isEven ? 'bg-[#024c57] ring-1 ring-white/30' : 'bg-[#03798a] ring-1 ring-white/30'
                : 'bg-[#024c57]';
              const statusBadgeCls = isActive
                ? 'bg-white/20 text-white'
                : job.status === 'draft'
                  ? 'bg-[#dc2626] text-white dark:bg-[#21262d] dark:text-[#8b949e]'
                  : 'bg-[#94a3b8] text-white';
              const catBadgeCls = isActive
                ? 'bg-white/20 text-white'
                : 'bg-[#1d4ed8] text-white dark:bg-[#1a2c3d] dark:text-[#58a6ff]';

              return (
                <div key={job.id} className={`rounded-xl p-3 ${cardBg}`}>
                  <div className="flex items-start justify-between gap-2 mb-0.5">
                    <div>
                      <p className={`text-sm leading-snug ${titleCls}`}>{job.title}</p>
                      <p className={`text-xs ${subtitleCls}`}>{job.company}</p>
                    </div>
                    <button
                      onClick={() => toggleStatus(job.id, job.status)}
                      className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium capitalize cursor-pointer ${statusBadgeCls}`}
                    >
                      {job.status}
                    </button>
                  </div>
                  <div className="flex gap-1.5 mt-2 mb-3 flex-wrap">
                    <span className={`rounded-full px-2 py-0.5 text-xs ${catBadgeCls}`}>{job.category}</span>
                    <span className={`rounded-full px-2 py-0.5 text-xs ${catBadgeCls}`}>{job.type}</span>
                    {job.expiresAt && (
                      <span className={`rounded-full px-2 py-0.5 text-xs ${expired ? 'bg-[#dc2626] text-white' : catBadgeCls}`}>
                        {expired ? 'Expired' : new Date(job.expiresAt).toLocaleDateString('en-IN')}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Link
                      href={`/admin/jobs/${job.id}/edit`}
                      className={`flex-1 rounded-lg py-1.5 text-center text-xs font-medium text-white ${editBg}`}
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => deleteJob(job.id, job.title)}
                      className="flex-1 rounded-lg py-1.5 text-xs font-medium text-white bg-[#dc2626]"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Desktop table */}
      <div className="hidden lg:block bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {loading ? loader : jobs.length === 0 ? empty : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  {['Title / Company', 'Category', 'Type', 'Experience', 'Salary', 'Status', '⭐', 'Expires', 'Actions'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {jobs.map((job) => {
                  const expired = job.expiresAt ? new Date(job.expiresAt) < now : false;
                  return (
                    <tr key={job.id} className={expired ? 'bg-amber-50 dark:bg-amber-900/10' : 'hover:bg-gray-50 dark:hover:bg-gray-700/30'}>
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900 dark:text-white truncate max-w-[200px]">{job.title}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{job.company}</p>
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300 text-xs">{job.category}</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300 text-xs">{job.type}</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300 text-xs">{job.experience}</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300 text-xs">{job.salary ?? '—'}</td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => toggleStatus(job.id, job.status)}
                          className={`px-2 py-0.5 rounded-full text-xs font-semibold ring-1 ring-inset cursor-pointer ${STATUS_STYLES[job.status] ?? STATUS_STYLES.draft}`}
                        >
                          {job.status}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => toggleFeatured(job.id, job.featured)}
                          className={`transition-colors ${job.featured ? 'text-amber-500' : 'text-gray-300 dark:text-gray-600 hover:text-amber-400'}`}
                          aria-label={job.featured ? 'Remove from featured' : 'Mark as featured'}
                        >
                          <Star className="w-4 h-4" fill={job.featured ? 'currentColor' : 'none'} />
                        </button>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400">
                        {job.expiresAt ? (
                          <span className={expired ? 'text-red-600 dark:text-red-400 font-medium' : ''}>
                            {new Date(job.expiresAt).toLocaleDateString('en-IN')}
                          </span>
                        ) : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/admin/jobs/${job.id}/edit`}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-900/30 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                            title="Edit"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </Link>
                          <button
                            onClick={() => deleteJob(job.id, job.title)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-3 py-1.5 rounded-lg text-sm border border-gray-300 dark:border-gray-600 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-3 py-1.5 rounded-lg text-sm border border-gray-300 dark:border-gray-600 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
