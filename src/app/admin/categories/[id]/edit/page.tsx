'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ExternalLink, Loader2, Lock, Sparkles } from 'lucide-react';

export default function EditCategoryPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [isLegacy, setIsLegacy] = useState(false);
  const [courseCount, setCourseCount] = useState(0);

  const [form, setForm] = useState({
    name: '',
    slug: '',
    description: '',
    icon: '',
    color: '#0f766e',
    sortOrder: '0',
    status: 'draft',
    seoTitle: '',
    seoDesc: '',
  });

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/admin/categories/${id}`);
        if (!res.ok) { showToast('Category not found', 'error'); return; }
        const cat = await res.json();
        setIsLegacy(cat.isLegacy);
        setCourseCount(cat._count?.courses ?? 0);
        setForm({
          name: cat.name ?? '',
          slug: cat.slug ?? '',
          description: cat.description ?? '',
          icon: cat.icon ?? '',
          color: cat.color ?? '#0f766e',
          sortOrder: String(cat.sortOrder ?? 0),
          status: cat.status ?? 'draft',
          seoTitle: cat.seoTitle ?? '',
          seoDesc: cat.seoDesc ?? '',
        });
      } catch {
        showToast('Failed to load', 'error');
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [id]);

  async function generateAI() {
    if (!form.name) return;
    setGenerating(true);
    try {
      const res = await fetch('/api/admin/generate/category', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name }),
      });
      if (!res.ok) { showToast('AI generation failed', 'error'); return; }
      const data = await res.json();
      const g = data.data;
      setForm((prev) => ({
        ...prev,
        description: g.description ?? prev.description,
        seoTitle: g.seoTitle ?? prev.seoTitle,
        seoDesc: g.seoDesc ?? prev.seoDesc,
      }));
      showToast('Content regenerated — review before saving');
    } catch {
      showToast('Network error', 'error');
    } finally {
      setGenerating(false);
    }
  }

  async function handleSubmit(status: string) {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/categories/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, status, sortOrder: Number(form.sortOrder) }),
      });
      if (!res.ok) {
        const err = await res.json();
        showToast(err.error ?? 'Failed to update', 'error');
        return;
      }
      showToast('Category updated!');
      setTimeout(() => router.push('/admin/categories'), 800);
    } catch {
      showToast('Network error', 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (courseCount > 0) {
      showToast(`Cannot delete — ${courseCount} course(s) linked`, 'error');
      return;
    }
    if (!confirm(`Delete category "${form.name}"? This cannot be undone.`)) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/categories/${id}`, { method: 'DELETE' });
      if (!res.ok) { const err = await res.json(); showToast(err.error ?? 'Failed', 'error'); return; }
      showToast('Category deleted');
      setTimeout(() => router.push('/admin/categories'), 600);
    } catch {
      showToast('Network error', 'error');
    } finally {
      setSaving(false);
    }
  }

  const inputCls = 'w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500';
  const labelCls = 'block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1';
  const sectionCls = 'rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 space-y-4';

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-teal-600" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin/categories" className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Edit Category</h1>
          {isLegacy && (
            <span className="rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-semibold px-2.5 py-0.5">
              Legacy
            </span>
          )}
        </div>
        <a
          href={`/courses/${form.slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-teal-600 transition-colors"
        >
          View Page <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-5">
          <div className={sectionCls}>
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-3">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Category Details</h2>
              <button
                type="button"
                onClick={() => void generateAI()}
                disabled={generating}
                className="inline-flex items-center gap-1.5 rounded-lg bg-purple-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-purple-700 disabled:opacity-50 transition-colors"
              >
                {generating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                Regenerate
              </button>
            </div>

            <div>
              <label className={labelCls}>Name *</label>
              <input
                required
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                className={inputCls}
              />
            </div>

            <div>
              <label className={labelCls}>
                Slug *
                {isLegacy && <span className="ml-1 text-amber-600 dark:text-amber-400 text-[10px]">— locked (legacy)</span>}
                {!isLegacy && courseCount > 0 && <span className="ml-1 text-orange-500 text-[10px]">— warning: courses are linked</span>}
              </label>
              <div className="relative">
                {isLegacy && (
                  <Lock className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-400" />
                )}
                <input
                  value={form.slug}
                  onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))}
                  disabled={isLegacy}
                  className={`${inputCls} ${isLegacy ? 'pl-8 opacity-60 cursor-not-allowed' : ''}`}
                />
              </div>
            </div>

            <div>
              <label className={labelCls}>Description <span className="text-gray-400">({form.description.length}/150)</span></label>
              <textarea
                maxLength={150}
                rows={3}
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                className={inputCls}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Icon (Tabler class)</label>
                <input
                  value={form.icon}
                  onChange={(e) => setForm((p) => ({ ...p, icon: e.target.value }))}
                  className={inputCls}
                  placeholder="ti-cloud"
                />
              </div>
              <div>
                <label className={labelCls}>Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={form.color}
                    onChange={(e) => setForm((p) => ({ ...p, color: e.target.value }))}
                    className="h-9 w-14 rounded border border-gray-300 dark:border-gray-600 cursor-pointer shrink-0"
                  />
                  <input
                    value={form.color}
                    onChange={(e) => setForm((p) => ({ ...p, color: e.target.value }))}
                    className={inputCls}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className={sectionCls}>
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-3">SEO</h2>
            <div>
              <label className={labelCls}>SEO Title <span className="text-gray-400">({form.seoTitle.length}/60)</span></label>
              <input
                maxLength={60}
                value={form.seoTitle}
                onChange={(e) => setForm((p) => ({ ...p, seoTitle: e.target.value }))}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>SEO Description <span className="text-gray-400">({form.seoDesc.length}/155)</span></label>
              <textarea
                maxLength={155}
                rows={2}
                value={form.seoDesc}
                onChange={(e) => setForm((p) => ({ ...p, seoDesc: e.target.value }))}
                className={inputCls}
              />
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <div className={sectionCls}>
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-3">Settings</h2>
            <div>
              <label className={labelCls}>Sort Order</label>
              <input
                type="number"
                value={form.sortOrder}
                onChange={(e) => setForm((p) => ({ ...p, sortOrder: e.target.value }))}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}
                className={inputCls}
              >
                <option value="published">Published</option>
                <option value="draft">Draft</option>
              </select>
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {courseCount} course{courseCount !== 1 ? 's' : ''} linked
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => void handleSubmit(form.status)}
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-teal-700 disabled:opacity-60 transition-colors"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Save Changes
            </button>
            <button
              type="button"
              onClick={() => void handleDelete()}
              disabled={saving || courseCount > 0}
              title={courseCount > 0 ? `${courseCount} course(s) linked — unlink first` : 'Delete category'}
              className="inline-flex items-center justify-center rounded-lg border border-red-300 dark:border-red-700 px-5 py-2.5 text-sm font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              Delete Category
            </button>
            <Link href="/admin/categories" className="text-center text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors">
              Cancel
            </Link>
          </div>
        </div>
      </div>

      {toast && (
        <div className={`fixed bottom-5 right-5 z-50 rounded-lg px-5 py-3 text-sm font-medium text-white shadow-lg ${toast.type === 'error' ? 'bg-red-600' : 'bg-teal-600'}`}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}
