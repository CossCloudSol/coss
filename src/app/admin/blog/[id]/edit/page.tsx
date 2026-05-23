'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, Plus, Trash2 } from 'lucide-react';
import dynamic from 'next/dynamic';

const MDEditor = dynamic(() => import('@uiw/react-md-editor'), { ssr: false });

const STATUSES = ['draft', 'published', 'archived'];

export default function EditBlogPostPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const [form, setForm] = useState({
    title: '', slug: '', excerpt: '', category: '',
    author: 'COSS Team', authorRole: 'Editorial Team',
    readTime: '', thumbnail: '', status: 'draft', featured: false,
    seoTitle: '', seoDesc: '',
  });
  const [content, setContent] = useState('');
  const [tags, setTags] = useState<string[]>(['']);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    fetch(`/api/admin/blog/${params.id}`)
      .then((r) => r.json())
      .then((data) => {
        setForm({
          title: data.title ?? '',
          slug: data.slug ?? '',
          excerpt: data.excerpt ?? '',
          category: data.category ?? '',
          author: data.author ?? 'COSS Team',
          authorRole: data.authorRole ?? 'Editorial Team',
          readTime: data.readTime ?? '',
          thumbnail: data.thumbnail ?? '',
          status: data.status ?? 'draft',
          featured: Boolean(data.featured),
          seoTitle: data.seoTitle ?? '',
          seoDesc: data.seoDesc ?? '',
        });
        setContent(data.content ?? '');
        setTags(Array.isArray(data.tags) && data.tags.length > 0 ? data.tags : ['']);
        setLoading(false);
      })
      .catch(() => { showToast('Failed to load post', 'error'); setLoading(false); });
  }, [params.id]);

  function handleField<K extends keyof typeof form>(key: K, value: typeof form[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) { showToast('Content is required', 'error'); return; }
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/blog/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, content, tags: tags.filter(Boolean) }),
      });
      if (!res.ok) {
        const err = await res.json();
        showToast(err.error ?? 'Failed to save', 'error');
        return;
      }
      showToast('Post saved!');
      setTimeout(() => router.push('/admin/blog'), 800);
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
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-teal-600" /></div>;
  }

  return (
    <div className="max-w-4xl space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/admin/blog" className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Edit Blog Post</h1>
      </div>

      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-5">
        {/* Basic Info */}
        <div className={sectionCls}>
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-3">Basic Information</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className={labelCls}>Title *</label>
              <input required value={form.title} onChange={(e) => handleField('title', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Slug *</label>
              <input required value={form.slug} onChange={(e) => handleField('slug', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Category *</label>
              <input required value={form.category} onChange={(e) => handleField('category', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Author</label>
              <input value={form.author} onChange={(e) => handleField('author', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Author Role</label>
              <input value={form.authorRole} onChange={(e) => handleField('authorRole', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Read Time</label>
              <input value={form.readTime} onChange={(e) => handleField('readTime', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Thumbnail URL</label>
              <input value={form.thumbnail} onChange={(e) => handleField('thumbnail', e.target.value)} className={inputCls} />
            </div>
          </div>
          <div>
            <label className={labelCls}>Excerpt *</label>
            <textarea required rows={2} value={form.excerpt} onChange={(e) => handleField('excerpt', e.target.value)} className={inputCls} />
          </div>
        </div>

        {/* Content */}
        <div className={sectionCls}>
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-3">Content *</h2>
          <div data-color-mode="light">
            <MDEditor value={content} onChange={(v) => setContent(v ?? '')} height={400} preview="edit" />
          </div>
        </div>

        {/* Tags */}
        <div className={sectionCls}>
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-3">Tags</h2>
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
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-3">SEO</h2>
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
            {saving ? 'Saving…' : 'Save Changes'}
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
