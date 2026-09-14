'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { ImagePicker } from '@/components/admin/ImagePicker';

export default function NewTrainerPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const [form, setForm] = useState({
    name: '', title: '', category: '',
    skills: '', teaches: '', startYear: '',
    bio: '', photoUrl: '', isVisible: true,
  });

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  function setField<K extends keyof typeof form>(key: K, value: typeof form[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit() {
    if (!form.name || !form.title) {
      showToast('Please fill all required fields', 'error');
      return;
    }
    setSaving(true);
    try {
      const body = {
        name: form.name,
        title: form.title,
        category: form.category || null,
        skills: form.skills || null,
        teaches: form.teaches || null,
        startYear: form.startYear ? Number(form.startYear) : null,
        bio: form.bio || null,
        photoUrl: form.photoUrl || null,
        isVisible: form.isVisible,
      };
      const res = await fetch('/api/admin/trainers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('Failed');
      showToast('Trainer created!');
      setTimeout(() => router.push('/admin/trainers'), 500);
    } catch {
      showToast('Failed to create trainer', 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg text-sm font-medium shadow-lg ${toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'}`}>
          {toast.msg}
        </div>
      )}

      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/trainers" className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
          <ArrowLeft className="w-4 h-4 text-gray-600 dark:text-gray-300" />
        </Link>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">New Trainer</h1>
      </div>

      <div className="space-y-5">
        {/* Trainer details */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Trainer Details</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Name *</label>
              <input type="text" value={form.name} onChange={(e) => setField('name', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Title *</label>
              <input type="text" value={form.title} onChange={(e) => setField('title', e.target.value)}
                placeholder="e.g. Lead Trainer – DevOps"
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
              <input type="text" value={form.category} onChange={(e) => setField('category', e.target.value)}
                placeholder="e.g. Cloud &amp; DevOps"
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Photo</label>
              <ImagePicker value={form.photoUrl} onChange={(url) => setField('photoUrl', url)} />
            </div>
          </div>
        </div>

        {/* Skills & Teaching */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Skills &amp; Teaching</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Skills</label>
              <input type="text" value={form.skills} onChange={(e) => setField('skills', e.target.value)}
                placeholder="e.g. AWS, Terraform, Kubernetes"
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white focus:outline-none" />
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Comma-separated — split into a list when displayed.</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Teaches</label>
              <input type="text" value={form.teaches} onChange={(e) => setField('teaches', e.target.value)}
                placeholder="e.g. AWS DevOps, Azure DevOps"
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white focus:outline-none" />
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Comma-separated — split into a list when displayed.</p>
            </div>
          </div>
        </div>

        {/* Background */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Background</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Career start year</label>
              <input type="number" min="1970" max="2100" value={form.startYear} onChange={(e) => setField('startYear', e.target.value)}
                placeholder="e.g. 2012"
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white focus:outline-none" />
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Years of experience are calculated from this at render time — do not enter a years figure directly.</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Bio</label>
              <textarea value={form.bio} onChange={(e) => setField('bio', e.target.value)}
                rows={4} placeholder="Short bio shown on the public faculty page"
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white focus:outline-none resize-none" />
            </div>
          </div>
        </div>

        {/* Settings */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Settings</h2>
          <div className="flex items-center gap-3">
            <input type="checkbox" id="isVisible" checked={form.isVisible}
              onChange={(e) => setField('isVisible', e.target.checked)} className="rounded" />
            <label htmlFor="isVisible" className="text-sm text-gray-700 dark:text-gray-300">Show on public faculty page</label>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button onClick={handleSubmit} disabled={saving}
            className="flex-1 py-3 rounded-xl text-sm font-bold text-white disabled:opacity-60 hover:opacity-90"
            style={{ background: '#0f766e' }}>
            {saving ? 'Saving...' : 'Create Trainer'}
          </button>
          <Link href="/admin/trainers"
            className="flex-1 py-3 rounded-xl text-sm font-medium text-center border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
            Cancel
          </Link>
        </div>
      </div>
    </div>
  );
}
