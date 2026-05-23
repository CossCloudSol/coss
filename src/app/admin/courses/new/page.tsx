'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Plus, Trash2, Loader2 } from 'lucide-react';

interface SyllabusItem {
  week: string;
  topic: string;
  details: string;
}

const MODES = ['Online', 'Classroom', 'Hybrid'];
const LEVELS = ['Beginner', 'Intermediate', 'Advanced', 'Beginner to Advanced'];
const STATUSES = ['draft', 'published', 'archived'];

export default function NewCoursePage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const [form, setForm] = useState({
    title: '',
    slug: '',
    description: '',
    excerpt: '',
    category: '',
    duration: '',
    mode: 'Classroom',
    level: 'Beginner to Advanced',
    price: '',
    originalPrice: '',
    badge: '',
    thumbnail: '',
    status: 'draft',
    featured: false,
    sortOrder: '0',
    seoTitle: '',
    seoDesc: '',
  });
  const [highlights, setHighlights] = useState<string[]>(['']);
  const [tools, setTools] = useState<string[]>(['']);
  const [syllabus, setSyllabus] = useState<SyllabusItem[]>([{ week: 'Week 1', topic: '', details: '' }]);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  function autoSlug(title: string) {
    return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  }

  function handleField<K extends keyof typeof form>(key: K, value: typeof form[K]) {
    setForm((prev) => ({
      ...prev,
      [key]: value,
      ...(key === 'title' && !prev.slug ? { slug: autoSlug(value as string) } : {}),
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/admin/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          price: form.price ? Number(form.price) : null,
          originalPrice: form.originalPrice ? Number(form.originalPrice) : null,
          sortOrder: Number(form.sortOrder),
          highlights: highlights.filter(Boolean),
          tools: tools.filter(Boolean),
          syllabus: syllabus.filter((s) => s.topic),
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        showToast(err.error ?? 'Failed to create', 'error');
        return;
      }
      showToast('Course created!');
      setTimeout(() => router.push('/admin/courses'), 800);
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
        <Link href="/admin/courses" className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">New Course</h1>
      </div>

      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-5">
        {/* Basic Info */}
        <div className={sectionCls}>
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-3">Basic Information</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className={labelCls}>Title *</label>
              <input required value={form.title} onChange={(e) => handleField('title', e.target.value)} className={inputCls} placeholder="e.g. AWS Cloud Practitioner" />
            </div>
            <div>
              <label className={labelCls}>Slug *</label>
              <input required value={form.slug} onChange={(e) => handleField('slug', e.target.value)} className={inputCls} placeholder="aws-cloud-practitioner" />
            </div>
            <div>
              <label className={labelCls}>Category *</label>
              <input required value={form.category} onChange={(e) => handleField('category', e.target.value)} className={inputCls} placeholder="Cloud Computing" />
            </div>
            <div>
              <label className={labelCls}>Duration *</label>
              <input required value={form.duration} onChange={(e) => handleField('duration', e.target.value)} className={inputCls} placeholder="3 Months" />
            </div>
            <div>
              <label className={labelCls}>Mode *</label>
              <select value={form.mode} onChange={(e) => handleField('mode', e.target.value)} className={inputCls}>
                {MODES.map((m) => <option key={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Level *</label>
              <select value={form.level} onChange={(e) => handleField('level', e.target.value)} className={inputCls}>
                {LEVELS.map((l) => <option key={l}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Badge</label>
              <input value={form.badge} onChange={(e) => handleField('badge', e.target.value)} className={inputCls} placeholder="e.g. Most Popular" />
            </div>
            <div>
              <label className={labelCls}>Thumbnail URL</label>
              <input value={form.thumbnail} onChange={(e) => handleField('thumbnail', e.target.value)} className={inputCls} placeholder="https://…" />
            </div>
            <div>
              <label className={labelCls}>Price (₹)</label>
              <input type="number" value={form.price} onChange={(e) => handleField('price', e.target.value)} className={inputCls} placeholder="25000" />
            </div>
            <div>
              <label className={labelCls}>Original Price (₹)</label>
              <input type="number" value={form.originalPrice} onChange={(e) => handleField('originalPrice', e.target.value)} className={inputCls} placeholder="35000" />
            </div>
          </div>
          <div>
            <label className={labelCls}>Excerpt *</label>
            <textarea required rows={2} value={form.excerpt} onChange={(e) => handleField('excerpt', e.target.value)} className={inputCls} placeholder="Short description for listings…" />
          </div>
          <div>
            <label className={labelCls}>Full Description *</label>
            <textarea required rows={5} value={form.description} onChange={(e) => handleField('description', e.target.value)} className={inputCls} placeholder="Detailed course description…" />
          </div>
        </div>

        {/* Highlights */}
        <div className={sectionCls}>
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-3">Highlights</h2>
          <div className="space-y-2">
            {highlights.map((h, i) => (
              <div key={i} className="flex gap-2">
                <input value={h} onChange={(e) => { const arr = [...highlights]; arr[i] = e.target.value; setHighlights(arr); }} className={inputCls} placeholder={`Highlight ${i + 1}`} />
                <button type="button" onClick={() => setHighlights(highlights.filter((_, j) => j !== i))} className="text-red-400 hover:text-red-600 transition-colors shrink-0">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
          <button type="button" onClick={() => setHighlights([...highlights, ''])} className="inline-flex items-center gap-1 text-sm text-teal-600 hover:text-teal-700 font-medium">
            <Plus className="h-4 w-4" /> Add Highlight
          </button>
        </div>

        {/* Tools */}
        <div className={sectionCls}>
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-3">Tools & Technologies</h2>
          <div className="space-y-2">
            {tools.map((t, i) => (
              <div key={i} className="flex gap-2">
                <input value={t} onChange={(e) => { const arr = [...tools]; arr[i] = e.target.value; setTools(arr); }} className={inputCls} placeholder={`Tool ${i + 1} (e.g. AWS, Docker)`} />
                <button type="button" onClick={() => setTools(tools.filter((_, j) => j !== i))} className="text-red-400 hover:text-red-600 transition-colors shrink-0">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
          <button type="button" onClick={() => setTools([...tools, ''])} className="inline-flex items-center gap-1 text-sm text-teal-600 hover:text-teal-700 font-medium">
            <Plus className="h-4 w-4" /> Add Tool
          </button>
        </div>

        {/* Syllabus */}
        <div className={sectionCls}>
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-3">Syllabus</h2>
          <div className="space-y-3">
            {syllabus.map((s, i) => (
              <div key={i} className="rounded-lg border border-gray-200 dark:border-gray-700 p-3 space-y-2">
                <div className="flex gap-2 items-start">
                  <div className="flex-1 grid grid-cols-2 gap-2">
                    <div>
                      <label className={labelCls}>Week / Module</label>
                      <input value={s.week} onChange={(e) => { const arr = [...syllabus]; arr[i] = { ...arr[i], week: e.target.value }; setSyllabus(arr); }} className={inputCls} placeholder="Week 1" />
                    </div>
                    <div>
                      <label className={labelCls}>Topic</label>
                      <input value={s.topic} onChange={(e) => { const arr = [...syllabus]; arr[i] = { ...arr[i], topic: e.target.value }; setSyllabus(arr); }} className={inputCls} placeholder="Introduction to Cloud" />
                    </div>
                  </div>
                  <button type="button" onClick={() => setSyllabus(syllabus.filter((_, j) => j !== i))} className="mt-5 text-red-400 hover:text-red-600 transition-colors shrink-0">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div>
                  <label className={labelCls}>Details</label>
                  <input value={s.details} onChange={(e) => { const arr = [...syllabus]; arr[i] = { ...arr[i], details: e.target.value }; setSyllabus(arr); }} className={inputCls} placeholder="Topics covered…" />
                </div>
              </div>
            ))}
          </div>
          <button type="button" onClick={() => setSyllabus([...syllabus, { week: `Week ${syllabus.length + 1}`, topic: '', details: '' }])} className="inline-flex items-center gap-1 text-sm text-teal-600 hover:text-teal-700 font-medium">
            <Plus className="h-4 w-4" /> Add Week
          </button>
        </div>

        {/* Publish Settings */}
        <div className={sectionCls}>
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-3">Publish Settings</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className={labelCls}>Status</label>
              <select value={form.status} onChange={(e) => handleField('status', e.target.value)} className={inputCls}>
                {STATUSES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Sort Order</label>
              <input type="number" value={form.sortOrder} onChange={(e) => handleField('sortOrder', e.target.value)} className={inputCls} />
            </div>
            <div className="flex items-end pb-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.featured} onChange={(e) => handleField('featured', e.target.checked)} className="rounded border-gray-300 text-teal-600" />
                <span className="text-sm text-gray-700 dark:text-gray-300">Featured course</span>
              </label>
            </div>
          </div>
        </div>

        {/* SEO */}
        <div className={sectionCls}>
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-3">SEO</h2>
          <div className="space-y-3">
            <div>
              <label className={labelCls}>SEO Title <span className="text-gray-400">({form.seoTitle.length}/60)</span></label>
              <input maxLength={60} value={form.seoTitle} onChange={(e) => handleField('seoTitle', e.target.value)} className={inputCls} placeholder="Leave blank to use course title" />
            </div>
            <div>
              <label className={labelCls}>Meta Description <span className="text-gray-400">({form.seoDesc.length}/160)</span></label>
              <textarea maxLength={160} rows={2} value={form.seoDesc} onChange={(e) => handleField('seoDesc', e.target.value)} className={inputCls} placeholder="Leave blank to use excerpt" />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-teal-700 disabled:opacity-60 transition-colors">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {saving ? 'Saving…' : 'Create Course'}
          </button>
          <Link href="/admin/courses" className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors">
            Cancel
          </Link>
        </div>
      </form>

      {toast && (
        <div className={`fixed bottom-5 right-5 z-50 rounded-lg px-5 py-3 text-sm font-medium text-white shadow-lg ${toast.type === 'error' ? 'bg-red-600' : 'bg-teal-600'}`}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}
