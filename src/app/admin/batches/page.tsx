'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Plus, Pencil, Trash2, Copy, Star, Loader2 } from 'lucide-react';
import { formatBatchDate, getBatchStatusBadge } from '@/lib/batch-utils';

interface BatchItem {
  id: string;
  batchName: string;
  mode: string;
  centre: string | null;
  startDate: string;
  schedule: string;
  totalSeats: number | null;
  seatsAvailable: number | null;
  status: string;
  featured: boolean;
  course: { title: string };
}

const STATUS_BADGE_COLOR: Record<string, string> = {
  blue:  'bg-blue-50 text-blue-700 ring-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:ring-blue-700',
  green: 'bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:ring-emerald-700',
  gray:  'bg-gray-50 text-gray-600 ring-gray-200 dark:bg-gray-700 dark:text-gray-400 dark:ring-gray-600',
  red:   'bg-red-50 text-red-700 ring-red-200 dark:bg-red-900/30 dark:text-red-400 dark:ring-red-700',
};

export default function AdminBatchesPage() {
  const [batches, setBatches] = useState<BatchItem[]>([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [modeFilter, setModeFilter]   = useState('');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (statusFilter) params.set('status', statusFilter);
    if (modeFilter)   params.set('mode', modeFilter);
    try {
      const res = await fetch(`/api/admin/batches?${params}`);
      const data = await res.json();
      setBatches(data.batches ?? []);
    } catch { showToast('Failed to load batches', 'error'); }
    finally { setLoading(false); }
  }, [statusFilter, modeFilter]);

  useEffect(() => { void load(); }, [load]);

  async function deleteBatch(id: string, name: string) {
    if (!confirm(`Delete "${name}"?`)) return;
    try {
      await fetch(`/api/admin/batches/${id}`, { method: 'DELETE' });
      showToast('Batch deleted');
      void load();
    } catch { showToast('Failed to delete', 'error'); }
  }

  async function cloneBatch(id: string) {
    try {
      const res = await fetch(`/api/admin/batches/${id}/clone`, { method: 'POST' });
      const data = await res.json();
      showToast('Batch cloned! Edit to set start date.');
      void load();
      // Navigate to edit of cloned batch
      setTimeout(() => window.location.href = `/admin/batches/${data.id}/edit`, 1500);
    } catch { showToast('Failed to clone', 'error'); }
  }

  async function toggleFeatured(id: string, current: boolean) {
    try {
      await fetch(`/api/admin/batches/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ featured: !current }),
      });
      showToast(current ? 'Removed from featured' : 'Marked as featured');
      void load();
    } catch { showToast('Failed to update', 'error'); }
  }

  const upcoming  = batches.filter((b) => b.status === 'upcoming').length;
  const ongoing   = batches.filter((b) => b.status === 'ongoing').length;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg text-sm font-medium shadow-lg ${toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'}`}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Batches</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {upcoming} upcoming · {ongoing} ongoing · {batches.length} total
          </p>
        </div>
        <Link
          href="/admin/batches/new"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-colors"
          style={{ background: '#0f766e' }}
        >
          <Plus className="w-4 h-4" /> New Batch
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white focus:outline-none">
          <option value="">All Statuses</option>
          <option value="upcoming">Upcoming</option>
          <option value="ongoing">Ongoing</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <select value={modeFilter} onChange={(e) => setModeFilter(e.target.value)}
          className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white focus:outline-none">
          <option value="">All Modes</option>
          <option value="Classroom">Classroom</option>
          <option value="Online">Online</option>
          <option value="Hybrid">Hybrid</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-teal-500" />
          </div>
        ) : batches.length === 0 ? (
          <div className="text-center py-20 text-gray-500 dark:text-gray-400">No batches found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  {['Course', 'Mode', 'Centre', 'Start Date', 'Schedule', 'Seats', 'Status', '⭐', 'Actions'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {batches.map((batch) => {
                  const badge = getBatchStatusBadge(batch.status);
                  return (
                    <tr key={batch.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900 dark:text-white text-sm truncate max-w-[180px]">{batch.course.title}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[180px]">{batch.batchName}</p>
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300 text-xs">{batch.mode}</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300 text-xs">{batch.centre ?? '—'}</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300 text-xs">{formatBatchDate(batch.startDate)}</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300 text-xs max-w-[120px] truncate">{batch.schedule}</td>
                      <td className="px-4 py-3 text-xs">
                        {batch.mode === 'Online' ? (
                          <span className="text-green-600 dark:text-green-400 font-semibold">Unlimited</span>
                        ) : batch.seatsAvailable !== null ? (
                          <span className={`font-semibold ${(batch.seatsAvailable ?? 0) <= 3 ? 'text-red-600' : (batch.seatsAvailable ?? 0) <= 6 ? 'text-amber-600' : 'text-green-600'}`}>
                            {batch.seatsAvailable} / {batch.totalSeats ?? '?'}
                          </span>
                        ) : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ring-1 ring-inset ${STATUS_BADGE_COLOR[badge.color] ?? STATUS_BADGE_COLOR.gray}`}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => toggleFeatured(batch.id, batch.featured)}
                          className={`transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center ${batch.featured ? 'text-amber-500' : 'text-gray-300 dark:text-gray-600 hover:text-amber-400'}`}
                        >
                          <Star className="w-4 h-4" fill={batch.featured ? 'currentColor' : 'none'} />
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Link href={`/admin/batches/${batch.id}/edit`}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-900/30 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center" title="Edit">
                            <Pencil className="w-3.5 h-3.5" />
                          </Link>
                          <button onClick={() => cloneBatch(batch.id)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center" title="Clone">
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => deleteBatch(batch.id, batch.batchName)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center" title="Delete">
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
    </div>
  );
}
