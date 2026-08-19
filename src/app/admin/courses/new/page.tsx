'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Plus, Trash2, Loader2, Sparkles, RotateCcw, ChevronDown } from 'lucide-react';
import { ImagePicker } from '@/components/admin/ImagePicker';

interface SyllabusItem {
  week: string;
  topic: string;
  details: string;
}

interface DbCategory {
  id: string;
  name: string;
  slug: string;
}

const MODES = ['Online', 'Classroom', 'Hybrid'];
const LEVELS = ['Beginner', 'Intermediate', 'Advanced', 'Beginner to Advanced'];
const STATUSES = ['draft', 'published', 'archived'];

const PLACEHOLDER_RE = /\[[A-Z_]{3,}\]/g;

function hasPlaceholder(val: string): boolean {
  return PLACEHOLDER_RE.test(val);
}

function highlightPlaceholder(val: string): boolean {
  return hasPlaceholder(val);
}

export default function NewCoursePage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [regenField, setRegenField] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [categories, setCategories] = useState<DbCategory[]>([]);
  const [catDropOpen, setCatDropOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [creatingCat, setCreatingCat] = useState(false);
  const [showNewCatInput, setShowNewCatInput] = useState(false);

  const [form, setForm] = useState({
    title: '',
    slug: '',
    description: '',
    excerpt: '',
    category: '',
    categoryId: '',
    categorySlug: '',
    urlType: 'new',
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

  useEffect(() => {
    fetch('/api/categories')
      .then((r) => r.json())
      .then((d) => setCategories(d.categories ?? []))
      .catch(() => {});
  }, []);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  function autoSlug(title: string) {
    return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') + '-in-hyderabad';
  }

  function handleField<K extends keyof typeof form>(key: K, value: typeof form[K]) {
    setForm((prev) => ({
      ...prev,
      [key]: value,
      ...(key === 'title' && !prev.slug ? { slug: autoSlug(value as string) } : {}),
    }));
  }

  function selectCategory(cat: DbCategory) {
    setForm((prev) => ({
      ...prev,
      category: cat.name,
      categoryId: cat.id,
      categorySlug: cat.slug,
    }));
    setCatDropOpen(false);
  }

  async function createCategory() {
    if (!newCatName.trim()) return;
    setCreatingCat(true);
    try {
      const res = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCatName.trim(), status: 'published' }),
      });
      if (!res.ok) { showToast('Failed to create category', 'error'); return; }
      const cat = await res.json();
      setCategories((prev) => [...prev, cat]);
      selectCategory(cat);
      setNewCatName('');
      setShowNewCatInput(false);
      showToast('Category created and selected');
    } catch {
      showToast('Network error', 'error');
    } finally {
      setCreatingCat(false);
    }
  }

  async function generateAll() {
    if (!form.title || !form.category) return;
    setGenerating(true);
    try {
      const res = await fetch('/api/admin/generate/course', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: form.title, categoryName: form.category }),
      });
      if (!res.ok) { showToast('Generation failed — check API key', 'error'); return; }
      const { data } = await res.json();

      setForm((prev) => ({
        ...prev,
        slug: data.slug ?? prev.slug,
        excerpt: data.excerpt ?? prev.excerpt,
        description: data.description ?? prev.description,
        duration: data.duration ?? prev.duration,
        level: data.level ?? prev.level,
        badge: data.badge ?? prev.badge,
        seoTitle: data.seoTitle ?? prev.seoTitle,
        seoDesc: data.seoDesc ?? prev.seoDesc,
      }));

      if (Array.isArray(data.highlights) && data.highlights.length > 0) {
        setHighlights(data.highlights);
      }
      if (Array.isArray(data.tools) && data.tools.length > 0) {
        setTools(data.tools);
      }
      if (Array.isArray(data.syllabus) && data.syllabus.length > 0) {
        const converted = (data.syllabus as Array<{ module: string; topics: string[] }>).map(
          (item, i) => ({
            week: item.module ?? `Module ${i + 1}`,
            topic: Array.isArray(item.topics) ? item.topics.join(', ') : '',
            details: '',
          }),
        );
        setSyllabus(converted);
      }

      setGenerated(true);
      showToast('Content generated — review all fields before publishing');
    } catch {
      showToast('Network error', 'error');
    } finally {
      setGenerating(false);
    }
  }

  async function regenSingleField(field: string) {
    if (!form.title || !form.category) return;
    setRegenField(field);
    try {
      const res = await fetch('/api/admin/generate/field', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ field, title: form.title, categoryName: form.category }),
      });
      if (!res.ok) { showToast('Regeneration failed', 'error'); return; }
      const { value } = await res.json();
      if (field === 'highlights' && Array.isArray(value)) {
        setHighlights(value);
      } else if (field === 'tools' && Array.isArray(value)) {
        setTools(value);
      } else if (field === 'syllabus' && Array.isArray(value)) {
        const converted = (value as Array<{ module: string; topics: string[] }>).map(
          (item, i) => ({
            week: item.module ?? `Module ${i + 1}`,
            topic: Array.isArray(item.topics) ? item.topics.join(', ') : '',
            details: '',
          }),
        );
        setSyllabus(converted);
      } else if (typeof value === 'string') {
        if (field === 'description' || field === 'excerpt' || field === 'slug' || field === 'seoTitle' || field === 'seoDesc') {
          setForm((prev) => ({ ...prev, [field]: value }));
        }
      }
      showToast(`${field} regenerated`);
    } catch {
      showToast('Network error', 'error');
    } finally {
      setRegenField(null);
    }
  }

  const canGenerate = form.title.trim() !== '' && form.category !== '';
  const previewUrl = form.categorySlug && form.slug
    ? `cosscloudsol.com/courses/${form.categorySlug}/${form.slug}`
    : form.slug ? `cosscloudsol.com/courses/${form.slug}` : '';

  const hasBadPlaceholders =
    hasPlaceholder(form.description) ||
    hasPlaceholder(form.excerpt) ||
    highlights.some(hasPlaceholder) ||
    hasPlaceholder(form.seoTitle) ||
    hasPlaceholder(form.seoDesc);

  const canPublish =
    form.title && form.category && form.slug &&
    form.duration && highlights.filter(Boolean).length > 0 &&
    syllabus.filter((s) => s.topic).length > 0 &&
    !hasBadPlaceholders;

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
  const inputAmberCls = 'w-full rounded-lg border border-amber-400 dark:border-amber-500 bg-amber-50 dark:bg-amber-900/20 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-400';
  const labelCls = 'block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1';
  const sectionCls = 'rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 space-y-4';

  function fieldCls(val: string) {
    return highlightPlaceholder(val) ? inputAmberCls : inputCls;
  }

  function SectionHeader({ label, field }: { label: string; field: string }) {
    return (
      <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-3">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white">{label}</h2>
        {generated && (
          <button
            type="button"
            onClick={() => void regenSingleField(field)}
            disabled={regenField === field}
            className="inline-flex items-center gap-1 text-xs text-purple-600 hover:text-purple-700 font-medium disabled:opacity-50"
          >
            {regenField === field ? <Loader2 className="h-3 w-3 animate-spin" /> : <RotateCcw className="h-3 w-3" />}
            Regenerate
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/admin/courses" className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">New Course</h1>
      </div>

      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-5">

        {/* Step 1 — Title + Category + Generate */}
        <div className={sectionCls}>
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-3">
            Start Here
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className={labelCls}>Course Title *</label>
              <input
                required
                value={form.title}
                onChange={(e) => handleField('title', e.target.value)}
                className={inputCls}
                placeholder="e.g. AWS Cloud Practitioner"
              />
            </div>

            {/* Category dropdown */}
            <div className="sm:col-span-2">
              <label className={labelCls}>Category *</label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setCatDropOpen((o) => !o)}
                  className={`${inputCls} flex items-center justify-between text-left`}
                >
                  <span className={form.category ? 'text-gray-900 dark:text-white' : 'text-gray-400'}>
                    {form.category || 'Select or create category…'}
                  </span>
                  <ChevronDown className="h-4 w-4 text-gray-400 shrink-0" />
                </button>

                {catDropOpen && (
                  <div className="absolute top-full left-0 right-0 z-20 mt-1 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 shadow-lg">
                    <div className="max-h-48 overflow-y-auto py-1">
                      {categories.map((cat) => (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => selectCategory(cat)}
                          className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                          {cat.name}
                        </button>
                      ))}
                    </div>
                    <div className="border-t border-gray-200 dark:border-gray-600 p-2">
                      {!showNewCatInput ? (
                        <button
                          type="button"
                          onClick={() => setShowNewCatInput(true)}
                          className="w-full px-3 py-1.5 text-left text-sm text-teal-600 hover:text-teal-700 font-medium"
                        >
                          + Create new category
                        </button>
                      ) : (
                        <div className="flex gap-2">
                          <input
                            value={newCatName}
                            onChange={(e) => setNewCatName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && void createCategory()}
                            placeholder="Category name…"
                            className="flex-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-2 py-1.5 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-teal-500"
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={() => void createCategory()}
                            disabled={creatingCat}
                            className="rounded bg-teal-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-teal-700 disabled:opacity-60"
                          >
                            {creatingCat ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Add'}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              {previewUrl && (
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Preview URL: <span className="text-teal-600 dark:text-teal-400 font-mono">{previewUrl}</span>
                </p>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={() => void generateAll()}
            disabled={!canGenerate || generating}
            className={`w-full inline-flex items-center justify-center gap-2 rounded-lg py-3 text-sm font-semibold text-white shadow-sm transition-colors ${
              canGenerate
                ? 'bg-purple-600 hover:bg-purple-700'
                : 'bg-gray-300 dark:bg-gray-600 cursor-not-allowed'
            } disabled:opacity-60`}
          >
            {generating ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Generating content…</>
            ) : generated ? (
              <><RotateCcw className="h-4 w-4" /> Regenerate All</>
            ) : (
              <><Sparkles className="h-4 w-4" /> Generate Content with AI</>
            )}
          </button>

          {!canGenerate && (
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
              Fill in Course Title and Category to enable AI generation
            </p>
          )}
          {hasBadPlaceholders && (
            <p className="text-xs text-amber-600 dark:text-amber-400 text-center font-medium">
              ⚠ Replace all [PLACEHOLDER] values (highlighted in amber) before publishing
            </p>
          )}
        </div>

        {/* Basic Info — shown always but highlighted after generation */}
        <div className={sectionCls}>
          <SectionHeader label="Basic Information" field="description" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={labelCls}>Slug *</label>
              <input required value={form.slug} onChange={(e) => handleField('slug', e.target.value)} className={inputCls} placeholder="aws-cloud-practitioner-in-hyderabad" />
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
              <input value={form.badge} onChange={(e) => handleField('badge', e.target.value)} className={inputCls} placeholder="Popular" />
            </div>
            <div>
              <label className={labelCls}>Thumbnail URL</label>
              <ImagePicker value={form.thumbnail} onChange={(url) => handleField('thumbnail', url)} />
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
            <textarea required rows={2} value={form.excerpt} onChange={(e) => handleField('excerpt', e.target.value)} className={fieldCls(form.excerpt)} placeholder="Short description for listings…" />
          </div>
          <div>
            <label className={labelCls}>Full Description *</label>
            <textarea required rows={5} value={form.description} onChange={(e) => handleField('description', e.target.value)} className={fieldCls(form.description)} placeholder="Detailed course description…" />
          </div>
        </div>

        {/* Highlights */}
        <div className={sectionCls}>
          <SectionHeader label="Highlights" field="highlights" />
          <div className="space-y-2">
            {highlights.map((h, i) => (
              <div key={i} className="flex gap-2">
                <input value={h} onChange={(e) => { const arr = [...highlights]; arr[i] = e.target.value; setHighlights(arr); }} className={fieldCls(h)} placeholder={`Highlight ${i + 1}`} />
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
          <SectionHeader label="Tools & Technologies" field="tools" />
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
          <SectionHeader label="Syllabus" field="syllabus" />
          <div className="space-y-3">
            {syllabus.map((s, i) => (
              <div key={i} className="rounded-lg border border-gray-200 dark:border-gray-700 p-3 space-y-2">
                <div className="flex gap-2 items-start">
                  <div className="flex-1 grid grid-cols-2 gap-2">
                    <div>
                      <label className={labelCls}>Week / Module</label>
                      <input value={s.week} onChange={(e) => { const arr = [...syllabus]; arr[i] = { ...arr[i], week: e.target.value }; setSyllabus(arr); }} className={inputCls} placeholder="Module 1" />
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
          <button type="button" onClick={() => setSyllabus([...syllabus, { week: `Module ${syllabus.length + 1}`, topic: '', details: '' }])} className="inline-flex items-center gap-1 text-sm text-teal-600 hover:text-teal-700 font-medium">
            <Plus className="h-4 w-4" /> Add Module
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
          <SectionHeader label="SEO" field="seoTitle" />
          <div className="space-y-3">
            <div>
              <label className={labelCls}>SEO Title <span className="text-gray-400">({form.seoTitle.length}/60)</span></label>
              <input maxLength={60} value={form.seoTitle} onChange={(e) => handleField('seoTitle', e.target.value)} className={fieldCls(form.seoTitle)} placeholder="Leave blank to use course title" />
            </div>
            <div>
              <label className={labelCls}>Meta Description <span className="text-gray-400">({form.seoDesc.length}/160)</span></label>
              <textarea maxLength={160} rows={2} value={form.seoDesc} onChange={(e) => handleField('seoDesc', e.target.value)} className={fieldCls(form.seoDesc)} placeholder="Leave blank to use excerpt" />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={saving || !canPublish}
              title={!canPublish ? 'Fill required fields and remove all [PLACEHOLDER] values' : undefined}
              className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-teal-700 disabled:opacity-60 transition-colors"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {saving ? 'Saving…' : 'Create Course'}
            </button>
            <Link href="/admin/courses" className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors">
              Cancel
            </Link>
          </div>
          {!canPublish && (
            <ul className="text-xs text-gray-500 dark:text-gray-400 space-y-0.5 list-none">
              {!form.title && <li>✗ Course title required</li>}
              {!form.category && <li>✗ Category required</li>}
              {!form.slug && <li>✗ Slug required</li>}
              {!form.duration && <li>✗ Duration required</li>}
              {highlights.filter(Boolean).length === 0 && <li>✗ At least one highlight required</li>}
              {syllabus.filter((s) => s.topic).length === 0 && <li>✗ At least one syllabus module required</li>}
              {hasBadPlaceholders && <li className="text-amber-600 dark:text-amber-400">✗ Replace all [PLACEHOLDER] values first</li>}
            </ul>
          )}
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
