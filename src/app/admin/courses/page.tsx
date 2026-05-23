'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Plus, Search, Pencil, Trash2, Star, ToggleLeft, ToggleRight, Loader2 } from 'lucide-react';

interface CourseItem {
  id: string;
  title: string;
  slug: string;
  category: string;
  duration: string;
  mode: string;
  level: string;
  price: number | null;
  badge: string | null;
  status: string;
  featured: boolean;
  createdAt: string;
}

const STATUS_STYLES: Record<string, string> = {
  published: 'bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:ring-emerald-700',
  draft: 'bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:ring-amber-700',
  archived: 'bg-gray-50 text-gray-600 ring-gray-200 dark:bg-gray-700 dark:text-gray-400 dark:ring-gray-600',
};

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

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
      const res = await fetch(`/api/admin/courses?${params}`);
      const data = await res.json();
      setCourses(data.courses ?? []);
      setTotal(data.total ?? 0);
      setTotalPages(data.totalPages ?? 1);
    } catch {
      showToast('Failed to load courses', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => { void load(); }, [load]);

  async function toggleStatus(id: string, current: string) {
    const next = current === 'published' ? 'draft' : 'published';
    try {
      await fetch(`/api/admin/courses/${id}/toggle`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: next }),
      });
      showToast(`Status set to ${next}`);
      void load();
    } catch {
      showToast('Failed to update status', 'error');
    }
  }

  async function toggleFeatured(id: string, current: boolean) {
    try {
      await fetch(`/api/admin/courses/${id}/toggle`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ featured: !current }),
      });
      showToast(`Featured ${!current ? 'enabled' : 'disabled'}`);
      void load();
    } catch {
      showToast('Failed to update', 'error');
    }
  }

  async function handleDelete(id: string, title: string) {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    try {
      await fetch(`/api/admin/courses/${id}`, { method: 'DELETE' });
      showToast('Course deleted');
      void load();
    } catch {
      showToast('Failed to delete', 'error');
    }
  }

  async function bulkDelete() {
    if (selectedIds.size === 0) return;
    if (!confirm(`Delete ${selectedIds.size} course(s)? This cannot be undone.`)) return;
    await Promise.all([...selectedIds].map((id) => fetch(`/api/admin/courses/${id}`, { method: 'DELETE' })));
    setSelectedIds(new Set());
    showToast(`${selectedIds.size} course(s) deleted`);
    void load();
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selectedIds.size === courses.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(courses.map((c) => c.id)));
    }
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Courses</h1>
          <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">{total} total</p>
        </div>
        <Link
          href="/admin/courses/new"
          className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-teal-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          New Course
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search courses…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 pl-9 pr-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
        >
          <option value="">All Status</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
          <option value="archived">Archived</option>
        </select>
        {selectedIds.size > 0 && (
          <button
            onClick={() => void bulkDelete()}
            className="inline-flex items-center gap-2 rounded-lg border border-red-300 bg-red-50 dark:bg-red-900/20 dark:border-red-700 px-4 py-2 text-sm font-medium text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
          >
            <Trash2 className="h-4 w-4" />
            Delete {selectedIds.size}
          </button>
        )}
      </div>

      {/* Table */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-teal-600" />
          </div>
        ) : courses.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">No courses found.</p>
            <Link href="/admin/courses/new" className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-teal-600 hover:underline">
              <Plus className="h-4 w-4" /> Add your first course
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800/60">
                <tr className="text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  <th className="px-4 py-3">
                    <input type="checkbox" checked={selectedIds.size === courses.length && courses.length > 0} onChange={toggleSelectAll} className="rounded border-gray-300" />
                  </th>
                  <th className="px-4 py-3">Title</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Mode</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Featured</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {courses.map((course) => (
                  <tr key={course.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                    <td className="px-4 py-3">
                      <input type="checkbox" checked={selectedIds.has(course.id)} onChange={() => toggleSelect(course.id)} className="rounded border-gray-300" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900 dark:text-white line-clamp-1">{course.title}</div>
                      <div className="text-xs text-gray-400 dark:text-gray-500">{course.duration} · {course.level}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{course.category}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300 capitalize">{course.mode}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize ring-1 ring-inset ${STATUS_STYLES[course.status] ?? STATUS_STYLES.draft}`}>
                        {course.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => void toggleFeatured(course.id, course.featured)} className="text-gray-400 hover:text-amber-500 transition-colors">
                        <Star className={`h-4 w-4 ${course.featured ? 'fill-amber-400 text-amber-400' : ''}`} />
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => void toggleStatus(course.id, course.status)}
                          title={course.status === 'published' ? 'Unpublish' : 'Publish'}
                          className="text-gray-400 hover:text-teal-600 transition-colors"
                        >
                          {course.status === 'published' ? <ToggleRight className="h-5 w-5 text-teal-600" /> : <ToggleLeft className="h-5 w-5" />}
                        </button>
                        <Link href={`/admin/courses/${course.id}/edit`} className="text-gray-400 hover:text-blue-600 transition-colors">
                          <Pencil className="h-4 w-4" />
                        </Link>
                        <button onClick={() => void handleDelete(course.id, course.title)} className="text-gray-400 hover:text-red-600 transition-colors">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500 dark:text-gray-400">Page {page} of {totalPages}</span>
          <div className="flex gap-2">
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-1.5 text-gray-700 dark:text-gray-300 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              Previous
            </button>
            <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-1.5 text-gray-700 dark:text-gray-300 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              Next
            </button>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-5 right-5 z-50 rounded-lg px-5 py-3 text-sm font-medium text-white shadow-lg ${toast.type === 'error' ? 'bg-red-600' : 'bg-teal-600'}`}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}
