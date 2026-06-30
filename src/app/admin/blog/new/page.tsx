'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/components/ThemeProvider';
import Link from 'next/link';
import { ArrowLeft, Loader2, Plus, RotateCcw, Sparkles, Trash2, ChevronDown } from 'lucide-react';
import dynamic from 'next/dynamic';

const MDEditor = dynamic(() => import('@uiw/react-md-editor'), { ssr: false });

const STATUSES = ['draft', 'published', 'archived'];

const PLACEHOLDER_RE = /\[[A-Z_]{3,}\]/g;
function hasPlaceholder(val: string): boolean {
  return PLACEHOLDER_RE.test(val);
}

interface DbCategory {
  id: string;
  name: string;
  slug: string;
}

export default function NewBlogPostPage() {
  const router = useRouter();
  const { theme } = useTheme();
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
    title: '', slug: '', excerpt: '', category: '',
    author: 'Coss Cloud Solutions Team', authorRole: 'Editorial Team',
    readTime: '', thumbnail: '', status: 'draft', featured: false,
    seoTitle: '', seoDesc: '',
  });
  const [content, setContent] = useState('');
  const [tags, setTags] = useState<string[]>(['']);

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
    return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  }

  function handleField<K extends keyof typeof form>(key: K, value: typeof form[K]) {
    setForm((prev) => ({
      ...prev,
      [key]: value,
      ...(key === 'title' && !prev.slug ? { slug: autoSlug(value as string) } : {}),
    }));
  }

  function selectCategory(cat: DbCategory) {
    setForm((prev) => ({ ...prev, category: cat.name }));
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

  function calcReadTime(text: string): string {
    const words = text.trim().split(/\s+/).length;
    const mins = Math.max(1, Math.round(words / 200));
    return `${mins} min read`;
  }

  async function generateAll() {
    if (!form.title || !form.category) return;
    setGenerating(true);
    try {
      const res = await fetch('/api/admin/generate/blog', {
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
        readTime: data.readTime ?? calcReadTime(data.content ?? ''),
        seoTitle: data.seoTitle ?? prev.seoTitle,
        seoDesc: data.seoDesc ?? prev.seoDesc,
      }));
      if (data.content) setContent(data.content);
      if (Array.isArray(data.tags) && data.tags.length > 0) setTags(data.tags);

      setGenerated(true);
      showToast('Blog post generated — review before publishing');
    } catch {
      showToast('Network error', 'error');
    } finally {
      setGenerating(false);
    }
  }

  async function regenField_fn(field: string) {
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
      if (field === 'content' && typeof value === 'string') {
        setContent(value);
        setForm((prev) => ({ ...prev, readTime: calcReadTime(value) }));
      } else if (field === 'tags' && Array.isArray(value)) {
        setTags(value);
      } else if (typeof value === 'string') {
        if (['slug', 'excerpt', 'seoTitle', 'seoDesc'].includes(field)) {
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
  const hasBadPlaceholders = hasPlaceholder(content) || hasPlaceholder(form.excerpt);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) { showToast('Content is required', 'error'); return; }
    setSaving(true);
    try {
      const res = await fetch('/api/admin/blog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, content, tags: tags.filter(Boolean) }),
      });
      if (!res.ok) {
        const err = await res.json();
        showToast(err.error ?? 'Failed to create', 'error');
        return;
      }
      showToast('Post created!');
      setTimeout(() => router.push('/admin/blog'), 800);
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

  function fieldCls(val: string) { return hasPlaceholder(val) ? inputAmberCls : inputCls; }

  function SectionHeader({ label, field }: { label: string; field: string }) {
    return (
      <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-3">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white">{label}</h2>
        {generated && (
          <button
            type="button"
            onClick={() => void regenField_fn(field)}
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
        <Link href="/admin/blog" className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">New Blog Post</h1>
      </div>

      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-5">

        {/* Step 1 */}
        <div className={sectionCls}>
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-3">Start Here</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className={labelCls}>Title *</label>
              <input required value={form.title} onChange={(e) => handleField('title', e.target.value)} className={inputCls} placeholder="e.g. How to Get a DevOps Job in Hyderabad" />
            </div>

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
                        <button key={cat.id} type="button" onClick={() => selectCategory(cat)}
                          className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                          {cat.name}
                        </button>
                      ))}
                    </div>
                    <div className="border-t border-gray-200 dark:border-gray-600 p-2">
                      {!showNewCatInput ? (
                        <button type="button" onClick={() => setShowNewCatInput(true)}
                          className="w-full px-3 py-1.5 text-left text-sm text-teal-600 hover:text-teal-700 font-medium">
                          + Create new category
                        </button>
                      ) : (
                        <div className="flex gap-2">
                          <input value={newCatName} onChange={(e) => setNewCatName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && void createCategory()}
                            placeholder="Category name…" autoFocus
                            className="flex-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-2 py-1.5 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-teal-500" />
                          <button type="button" onClick={() => void createCategory()} disabled={creatingCat}
                            className="rounded bg-teal-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-teal-700 disabled:opacity-60">
                            {creatingCat ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Add'}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <button type="button" onClick={() => void generateAll()} disabled={!canGenerate || generating}
            className={`w-full inline-flex items-center justify-center gap-2 rounded-lg py-3 text-sm font-semibold text-white shadow-sm transition-colors ${canGenerate ? 'bg-purple-600 hover:bg-purple-700' : 'bg-gray-300 dark:bg-gray-600 cursor-not-allowed'} disabled:opacity-60`}>
            {generating ? <><Loader2 className="h-4 w-4 animate-spin" /> Generating blog post…</> :
             generated ? <><RotateCcw className="h-4 w-4" /> Regenerate All</> :
             <><Sparkles className="h-4 w-4" /> Generate Blog Post with AI</>}
          </button>

          {hasBadPlaceholders && (
            <p className="text-xs text-amber-600 dark:text-amber-400 text-center font-medium">
              ⚠ Replace all [PLACEHOLDER] values (highlighted amber) before publishing
            </p>
          )}
        </div>

        {/* Basic Info */}
        <div className={sectionCls}>
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-3">Basic Information</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={labelCls}>Slug *</label>
              <input required value={form.slug} onChange={(e) => handleField('slug', e.target.value)} className={inputCls} placeholder="devops-jobs-in-hyderabad" />
            </div>
            <div>
              <label className={labelCls}>Read Time</label>
              <input value={form.readTime} onChange={(e) => handleField('readTime', e.target.value)} className={inputCls} placeholder="5 min read" />
            </div>
            <div>
              <label className={labelCls}>Author</label>
              <input value={form.author} onChange={(e) => handleField('author', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Author Role</label>
              <input value={form.authorRole} onChange={(e) => handleField('authorRole', e.target.value)} className={inputCls} />
            </div>
            <div className="sm:col-span-2">
              <label className={labelCls}>Thumbnail URL</label>
              <input value={form.thumbnail} onChange={(e) => handleField('thumbnail', e.target.value)} className={inputCls} placeholder="https://…" />
            </div>
          </div>
          <div>
            <label className={labelCls}>Excerpt *</label>
            <textarea required rows={2} value={form.excerpt} onChange={(e) => handleField('excerpt', e.target.value)} className={fieldCls(form.excerpt)} placeholder="Short description shown in listings…" />
          </div>
        </div>

        {/* Content */}
        <div className={sectionCls}>
          <SectionHeader label="Content *" field="content" />
          <div className={`overflow-hidden rounded-lg${hasPlaceholder(content) ? ' ring-2 ring-amber-400' : ''}`} data-color-mode={theme}>
            <MDEditor value={content} onChange={(v) => setContent(v ?? '')} height={400} preview="edit" />
          </div>
          {hasPlaceholder(content) && (
            <p className="text-xs text-amber-600 dark:text-amber-400">⚠ Content has [PLACEHOLDER] values — replace before publishing</p>
          )}
        </div>

        {/* Tags */}
        <div className={sectionCls}>
          <SectionHeader label="Tags" field="tags" />
          <div className="space-y-2">
            {tags.map((t, i) => (
              <div key={i} className="flex gap-2">
                <input value={t} onChange={(e) => { const arr = [...tags]; arr[i] = e.target.value; setTags(arr); }} className={inputCls} placeholder={`Tag ${i + 1}`} />
                <button type="button" onClick={() => setTags(tags.filter((_, j) => j !== i))} className="text-red-400 hover:text-red-600 transition-colors shrink-0">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
          <button type="button" onClick={() => setTags([...tags, ''])} className="inline-flex items-center gap-1 text-sm text-teal-600 hover:text-teal-700 font-medium">
            <Plus className="h-4 w-4" /> Add Tag
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
            <div className="flex items-end pb-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.featured} onChange={(e) => handleField('featured', e.target.checked)} className="rounded border-gray-300 text-teal-600" />
                <span className="text-sm text-gray-700 dark:text-gray-300">Featured post</span>
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
              <input maxLength={60} value={form.seoTitle} onChange={(e) => handleField('seoTitle', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Meta Description <span className="text-gray-400">({form.seoDesc.length}/160)</span></label>
              <textarea maxLength={160} rows={2} value={form.seoDesc} onChange={(e) => handleField('seoDesc', e.target.value)} className={inputCls} />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-teal-700 disabled:opacity-60 transition-colors">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {saving ? 'Saving…' : 'Create Post'}
          </button>
          <Link href="/admin/blog" className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors">
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
