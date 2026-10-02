'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import SocialPostForm, { EMPTY_SOCIAL_POST, socialPostBody, type SocialPostFormState } from '@/components/admin/SocialPostForm';

export default function NewSocialPostPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  async function handleSubmit(form: SocialPostFormState) {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/social-posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(socialPostBody(form)),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || 'Failed to create post');
      }
      showToast('Draft saved');
      setTimeout(() => router.push('/admin/social-posts'), 500);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to create post', 'error');
    } finally {
      setSaving(false);
    }
  }

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
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">New Social Post</h1>
      </div>

      <SocialPostForm initial={EMPTY_SOCIAL_POST} saving={saving} submitLabel="Save Draft" onSubmit={handleSubmit} />
    </div>
  );
}
