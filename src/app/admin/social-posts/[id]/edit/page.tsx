'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import SocialPostForm, { socialPostBody, type SocialPostFormState } from '@/components/admin/SocialPostForm';
import { parseChannels } from '@/lib/social-captions';

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

  const [initial, setInitial] = useState<SocialPostFormState | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    fetch(`/api/admin/social-posts/${params.id}`)
      .then((r) => r.json())
      .then((post) => {
        const channels = parseChannels(post.channels);
        setInitial({
          content: post.content ?? '',
          channels: { linkedin: channels.includes('linkedin'), facebook: channels.includes('facebook'), instagram: channels.includes('instagram') },
          courseId: post.courseId ?? '',
          hook: post.hook ?? '',
          hashtags: post.hashtags ?? '',
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

  async function handleSubmit(form: SocialPostFormState) {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/social-posts/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(socialPostBody(form)),
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
  if (!initial) return <div className="p-6 text-center text-red-600">Failed to load this post.</div>;

  return (
    <div className="p-6 max-w-6xl mx-auto">
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
          {readOnly.status === 'queued' && (
            <p className="text-xs text-amber-700 dark:text-amber-400 mt-3">Approved. Saving changes moves it back to Draft until it&apos;s approved again.</p>
          )}
          {readOnly.lastError && (
            <p className="text-xs text-red-600 dark:text-red-400 mt-3">Last error: {readOnly.lastError}</p>
          )}
        </div>

        <SocialPostForm initial={initial} saving={saving} submitLabel="Save Changes" onSubmit={handleSubmit} />
      </div>
    </div>
  );
}
