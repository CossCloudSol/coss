'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Edit2, Trash2, Lock, Loader2, FolderOpen } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  sortOrder: number;
  isLegacy: boolean;
  status: string;
  seoTitle: string | null;
  seoDesc: string | null;
  _count: { courses: number };
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch('/api/admin/categories')
      .then((r) => r.json())
      .then((data) => { if (!cancelled) setCategories(data.categories ?? []); })
      .catch(() => { if (!cancelled) showToast('Failed to load categories', 'error'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function toggleStatus(cat: Category) {
    const newStatus = cat.status === 'published' ? 'draft' : 'published';
    try {
      const res = await fetch(`/api/admin/categories/${cat.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) { showToast('Failed to update status', 'error'); return; }
      setCategories((prev) => prev.map((c) => c.id === cat.id ? { ...c, status: newStatus } : c));
    } catch {
      showToast('Network error', 'error');
    }
  }

  async function updateSortOrder(cat: Category, value: string) {
    const num = parseInt(value, 10);
    if (isNaN(num)) return;
    try {
      await fetch(`/api/admin/categories/${cat.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sortOrder: num }),
      });
      setCategories((prev) => prev.map((c) => c.id === cat.id ? { ...c, sortOrder: num } : c));
    } catch { /* ignore */ }
  }

  async function handleDelete(cat: Category) {
    if (cat._count.courses > 0) {
      showToast(`Cannot delete — ${cat._count.courses} course(s) linked`, 'error');
      return;
    }
    if (!confirm(`Delete category "${cat.name}"? This cannot be undone.`)) return;
    setDeleting(cat.id);
    try {
      const res = await fetch(`/api/admin/categories/${cat.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const err = await res.json();
        showToast(err.error ?? 'Failed to delete', 'error');
        return;
      }
      showToast('Category deleted');
      setCategories((prev) => prev.filter((c) => c.id !== cat.id));
    } catch {
      showToast('Network error', 'error');
    } finally {
      setDeleting(null);
    }
  }

  const thCls = 'px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider';
  const tdCls = 'px-4 py-3 text-sm text-gray-700 dark:text-gray-300';

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Categories</h1>
          {!loading && (
            <span className="rounded-full bg-gray-100 dark:bg-gray-700 px-2.5 py-0.5 text-xs font-semibold text-gray-600 dark:text-gray-300">
              {categories.length}
            </span>
          )}
        </div>
        <Link
          href="/admin/categories/new"
          className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-teal-700 transition-colors"
        >
          <Plus className="h-4 w-4" /> New Category
        </Link>
      </div>

      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-teal-600" />
          </div>
        ) : categories.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <FolderOpen className="h-10 w-10 text-gray-300 dark:text-gray-600" />
            <p className="text-sm text-gray-500 dark:text-gray-400">No categories yet.</p>
            <Link href="/admin/categories/new" className="text-sm font-medium text-teal-600 hover:text-teal-700">
              Add your first category →
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className={thCls}>Name</th>
                  <th className={thCls}>Slug</th>
                  <th className={thCls}>Courses</th>
                  <th className={thCls}>Sort</th>
                  <th className={thCls}>Status</th>
                  <th className={thCls}></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {categories.map((cat) => (
                  <tr key={cat.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                    <td className={tdCls}>
                      <div className="flex items-center gap-2">
                        {cat.color && (
                          <span
                            className="inline-block w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ background: cat.color }}
                          />
                        )}
                        <span className="font-medium text-gray-900 dark:text-white">{cat.name}</span>
                        {cat.isLegacy && (
                          <span className="rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-[10px] font-semibold px-2 py-0.5">
                            Legacy
                          </span>
                        )}
                      </div>
                    </td>
                    <td className={tdCls}>
                      <div className="flex items-center gap-1.5">
                        {cat.isLegacy && <Lock className="h-3 w-3 text-gray-400 shrink-0" />}
                        <code className="text-xs bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">
                          {cat.slug}
                        </code>
                      </div>
                    </td>
                    <td className={tdCls}>
                      <span className="font-medium">{cat._count.courses}</span>
                    </td>
                    <td className={`${tdCls} w-20`}>
                      <input
                        type="number"
                        defaultValue={cat.sortOrder}
                        onBlur={(e) => void updateSortOrder(cat, e.target.value)}
                        className="w-16 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-2 py-1 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-teal-500"
                      />
                    </td>
                    <td className={tdCls}>
                      <button
                        onClick={() => void toggleStatus(cat)}
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors ${
                          cat.status === 'published'
                            ? 'bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 hover:bg-teal-200'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200'
                        }`}
                      >
                        {cat.status}
                      </button>
                    </td>
                    <td className={`${tdCls} text-right`}>
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/admin/categories/${cat.id}/edit`}
                          className="rounded p-1.5 text-gray-400 hover:text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => void handleDelete(cat)}
                          disabled={cat._count.courses > 0 || deleting === cat.id}
                          title={cat._count.courses > 0 ? `${cat._count.courses} course(s) linked — unlink first` : 'Delete'}
                          className="rounded p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          {deleting === cat.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
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

      {toast && (
        <div className={`fixed bottom-5 right-5 z-50 rounded-lg px-5 py-3 text-sm font-medium text-white shadow-lg ${toast.type === 'error' ? 'bg-red-600' : 'bg-teal-600'}`}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}
