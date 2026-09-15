'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

function istLocalToUtcIso(localValue: string): string {
  // localValue is "YYYY-MM-DDTHH:mm" entered as IST wall-clock time (no offset attached).
  return new Date(`${localValue}:00+05:30`).toISOString();
}

function utcIsoToIstLocal(utcIso: string): string {
  // Shift the UTC instant by +5:30 and read it back with UTC getters, so the
  // result is IST wall-clock time regardless of the browser's own timezone.
  const shifted = new Date(new Date(utcIso).getTime() + 5.5 * 60 * 60 * 1000);
  const yyyy = shifted.getUTCFullYear();
  const mm = String(shifted.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(shifted.getUTCDate()).padStart(2, '0');
  const hh = String(shifted.getUTCHours()).padStart(2, '0');
  const min = String(shifted.getUTCMinutes()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
}

const STATUS_BADGE_COLOR: Record<string, string> = {
  draft:  'bg-gray-50 text-gray-600 ring-gray-200 dark:bg-gray-700 dark:text-gray-400 dark:ring-gray-600',
  queued: 'bg-blue-50 text-blue-700 ring-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:ring-blue-700',
  sent:   'bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:ring-emerald-700',
  failed: 'bg-red-50 text-red-700 ring-red-200 dark:bg-red-900/30 dark:text-red-400 dark:ring-red-700',
};

export default function EditSocialPostPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [readOnly, setReadOnly] = useState({ status: 'draft', attemptCount: 0, lastError: null as string | null });

  const [form, setForm] = useState({
    content: '',
    linkedin: true,
    imageUrl: '',
    imageAltText: '',
    linkUrl: '',
    scheduledFor: '',
  });

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    fetch(`/api/admin/social-posts/${params.id}`)
      .then((r) => r.json())
      .then((post) => {
        setForm({
          content: post.content ?? '',
          linkedin: (post.channels ?? '').split(',').map((c: string) => c.trim()).includes('linkedin'),
          imageUrl: post.imageUrl ?? '',
          imageAltText: post.imageAltText ?? '',
          linkUrl: post.linkUrl ?? '',
          scheduledFor: post.scheduledFor ? utcIsoToIstLocal(post.scheduledFor) : '',
        });
        setReadOnly({
          status: post.status ?? 'draft',
          attemptCount: post.attemptCount ?? 0,
          lastError: post.lastError ?? null,
        });
        setLoading(false);
      })
      .catch(() => { showToast('Failed to load', 'error'); setLoading(false); });
  }, [params.id]);

  function setField<K extends keyof typeof form>(key: K, value: typeof form[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  const hasImage = form.imageUrl.trim().length > 0;
  const hasLink = form.linkUrl.trim().length > 0;
  const bothAssetsSet = hasImage && hasLink;
  const missingAltText = hasImage && form.imageAltText.trim().length === 0;

  async function handleSubmit() {
    if (!form.content.trim() || !form.scheduledFor) {
      showToast('Please fill all required fields', 'error');
      return;
    }
    if (!form.linkedin) {
      showToast('Select at least one channel', 'error');
      return;
    }
    if (bothAssetsSet) {
      showToast('A post cannot have both an image and a link', 'error');
      return;
    }
    if (missingAltText) {
      showToast('Alt text is required when an image is set', 'error');
      return;
    }
    setSaving(true);
    try {
      const body = {
        content: form.content,
        channels: 'linkedin',
        imageUrl: form.imageUrl || null,
        imageAltText: form.imageAltText || null,
        linkUrl: form.linkUrl || null,
        scheduledFor: istLocalToUtcIso(form.scheduledFor),
      };
      const res = await fetch(`/api/admin/social-posts/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || 'Failed to update post');
      }
      showToast('Post updated!');
      setTimeout(() => router.push('/admin/social-posts'), 500);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to update post', 'error');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="p-6 text-center text-gray-500 dark:text-gray-400">Loading...</div>;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg text-sm font-medium shadow-lg ${toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'}`}>
          {toast.msg}
        </div>
      )}

      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/social-posts" className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
          <ArrowLeft className="w-4 h-4 text-gray-600 dark:text-gray-300" />
        </Link>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Edit Social Post</h1>
      </div>

      <div className="space-y-5">
        {/* Status (read-only) */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Delivery status (read-only)</h2>
          <div className="flex flex-wrap items-center gap-4">
            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize ring-1 ring-inset ${STATUS_BADGE_COLOR[readOnly.status] ?? STATUS_BADGE_COLOR.draft}`}>
              {readOnly.status}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">Attempts: {readOnly.attemptCount}</span>
          </div>
          {readOnly.lastError && (
            <p className="text-xs text-red-600 dark:text-red-400 mt-3">Last error: {readOnly.lastError}</p>
          )}
        </div>

        {/* Content */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Content</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Post text *</label>
              <textarea value={form.content} onChange={(e) => setField('content', e.target.value)}
                rows={5}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white focus:outline-none resize-none" />
            </div>
          </div>
        </div>

        {/* Channels */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Channels</h2>
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <input type="checkbox" id="chan-linkedin" checked={form.linkedin}
                onChange={(e) => setField('linkedin', e.target.checked)} className="rounded" />
              <label htmlFor="chan-linkedin" className="text-sm text-gray-700 dark:text-gray-300">LinkedIn</label>
            </div>
            <div className="flex items-center gap-3 opacity-50">
              <input type="checkbox" disabled className="rounded" />
              <label className="text-sm text-gray-500 dark:text-gray-500">Facebook — not yet supported</label>
            </div>
            <div className="flex items-center gap-3 opacity-50">
              <input type="checkbox" disabled className="rounded" />
              <label className="text-sm text-gray-500 dark:text-gray-500">Instagram — not yet supported</label>
            </div>
          </div>
        </div>

        {/* Media */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Media (choose one)</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Image URL</label>
              <input type="text" value={form.imageUrl} onChange={(e) => setField('imageUrl', e.target.value)}
                disabled={hasLink}
                placeholder="https://..."
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white focus:outline-none disabled:opacity-50" />
            </div>
            {hasImage && (
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Image alt text *</label>
                <input type="text" value={form.imageAltText} onChange={(e) => setField('imageAltText', e.target.value)}
                  placeholder="Required by Buffer for every image"
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white focus:outline-none" />
                {missingAltText && <p className="text-xs text-red-500 mt-1">Alt text is required when an image is set</p>}
              </div>
            )}
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Link URL</label>
              <input type="text" value={form.linkUrl} onChange={(e) => setField('linkUrl', e.target.value)}
                disabled={hasImage}
                placeholder="https://..."
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white focus:outline-none disabled:opacity-50" />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">An image and a link cannot both be set — Buffer treats them as mutually exclusive.</p>
            </div>
          </div>
        </div>

        {/* Schedule */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Schedule</h2>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Scheduled for (IST) *</label>
            <input type="datetime-local" value={form.scheduledFor} onChange={(e) => setField('scheduledFor', e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white focus:outline-none" />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Enter the time in India Standard Time.</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button onClick={handleSubmit} disabled={saving}
            className="flex-1 py-3 rounded-xl text-sm font-bold text-white disabled:opacity-60 hover:opacity-90"
            style={{ background: '#0f766e' }}>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
          <Link href="/admin/social-posts"
            className="flex-1 py-3 rounded-xl text-sm font-medium text-center border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
            Cancel
          </Link>
        </div>
      </div>
    </div>
  );
}
