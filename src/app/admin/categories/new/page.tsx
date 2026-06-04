'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, Sparkles } from 'lucide-react';

export default function NewCategoryPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [slugEdited, setSlugEdited] = useState(false);

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

  function autoSlug(name: string) {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  }

  function handleName(value: string) {
    setForm((prev) => ({
      ...prev,
      name: value,
      ...(slugEdited ? {} : { slug: autoSlug(value) }),
    }));
  }

  async function generateAI() {
    if (!form.name) { showToast('Enter a category name first', 'error'); return; }
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
        ...(prev.slug === '' && g.suggestedSlug ? { slug: g.suggestedSlug } : {}),
      }));
      showToast('Content generated — review before saving');
    } catch {
      showToast('Network error', 'error');
    } finally {
      setGenerating(false);
    }
  }

  async function handleSubmit(status: 'draft' | 'published') {
    if (!form.name) { showToast('Name is required', 'error'); return; }
    setSaving(true);
    try {
      const res = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, status, sortOrder: Number(form.sortOrder) }),
      });
      if (!res.ok) {
        const err = await res.json();
        showToast(err.error ?? 'Failed to create', 'error');
        return;
      }
      showToast('Category created!');
      setTimeout(() => router.push('/admin/categories'), 800);
    } catch {
      showToast('Network error', 'error');
    } finally {
      setSaving(false);
    }
  }

  const inputCls = 'w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500';
  const labelCls = 'block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1';
  const sectionCls = 'rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 space-y-4';

  return (
    <div className="max-w-4xl space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/admin/categories" className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">New Category</h1>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Left — main fields */}
        <div className="lg:col-span-2 space-y-5">
          <div className={sectionCls}>
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-3">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Category Details</h2>
              <button
                type="button"
                onClick={() => void generateAI()}
                disabled={generating || !form.name}
                className="inline-flex items-center gap-1.5 rounded-lg bg-purple-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-purple-700 disabled:opacity-50 transition-colors"
              >
                {generating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                Generate with AI
              </button>
            </div>

            <div>
              <label className={labelCls}>Name *</label>
              <input
                required
                value={form.name}
                onChange={(e) => handleName(e.target.value)}
                className={inputCls}
                placeholder="e.g. AI & Machine Learning"
              />
            </div>

            <div>
              <label className={labelCls}>
                Slug *
                <span className="ml-1 text-gray-400 font-normal">— cosscloudsol.com/courses/{form.slug || '…'}</span>
              </label>
              <input
                required
                value={form.slug}
                onChange={(e) => { setSlugEdited(true); setForm((p) => ({ ...p, slug: e.target.value })); }}
                className={inputCls}
                placeholder="ai-machine-learning"
              />
            </div>

            <div>
              <label className={labelCls}>
                Description
                <span className="ml-1 text-gray-400 font-normal">({form.description.length}/150)</span>
              </label>
              <textarea
                maxLength={150}
                rows={3}
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                className={inputCls}
                placeholder="What roles does this category lead to? What will students learn?"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Icon (Tabler class)</label>
                <div className="flex items-center gap-2">
                  <input
                    value={form.icon}
                    onChange={(e) => setForm((p) => ({ ...p, icon: e.target.value }))}
                    className={inputCls}
                    placeholder="ti-cloud"
                  />
                </div>
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
                    placeholder="#0f766e"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* SEO */}
          <div className={sectionCls}>
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-3">SEO</h2>
            <div>
              <label className={labelCls}>SEO Title <span className="text-gray-400">({form.seoTitle.length}/60)</span></label>
              <input
                maxLength={60}
                value={form.seoTitle}
                onChange={(e) => setForm((p) => ({ ...p, seoTitle: e.target.value }))}
                className={inputCls}
                placeholder="Data Analytics Courses in Hyderabad | Coss Cloud Solutions"
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
                placeholder="Learn … at Coss Cloud Solutions Hyderabad. Hands-on training, placement support."
              />
            </div>
          </div>
        </div>

        {/* Right — settings */}
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
          </div>

          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => void handleSubmit('published')}
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-teal-700 disabled:opacity-60 transition-colors"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Publish
            </button>
            <button
              type="button"
              onClick={() => void handleSubmit('draft')}
              disabled={saving}
              className="inline-flex items-center justify-center rounded-lg border border-gray-300 dark:border-gray-600 px-5 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-60 transition-colors"
            >
              Save Draft
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
