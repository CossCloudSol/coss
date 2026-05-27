'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Plus, X } from 'lucide-react';

const JOB_CATEGORIES = [
  'DevOps & Multi-Cloud', 'Cloud Computing', 'Data, Analytics & BI',
  'ERP, CRM & Enterprise Tools', 'Human Resource', 'Programming & Full Stack',
  'Software Testing & OS', 'Cybersecurity & Networking', 'Digital Marketing & Design',
];
const JOB_TYPES = ['Full Time', 'Part Time', 'Internship', 'Contract'];
const WORK_MODES = ['On-site', 'Remote', 'Hybrid'];
const EXPERIENCE_LEVELS = ['Fresher', '1-3 Years', '3-5 Years', '5+ Years'];

export default function EditJobPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [skillInput, setSkillInput] = useState('');

  const [form, setForm] = useState({
    title: '', slug: '', company: '', confidential: false,
    location: '', type: 'Full Time', mode: 'On-site',
    category: '', experience: 'Fresher', salary: '',
    description: '', skills: [] as string[],
    applyUrl: '', status: 'active', featured: false, expiresAt: '',
  });

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    fetch(`/api/admin/jobs/${params.id}`)
      .then((r) => r.json())
      .then((job) => {
        setForm({
          title: job.title ?? '',
          slug: job.slug ?? '',
          company: job.company === 'Confidential' ? '' : (job.company ?? ''),
          confidential: job.company === 'Confidential',
          location: job.location ?? '',
          type: job.type ?? 'Full Time',
          mode: job.mode ?? 'On-site',
          category: job.category ?? '',
          experience: job.experience ?? 'Fresher',
          salary: job.salary ?? '',
          description: job.description ?? '',
          skills: job.skills ?? [],
          applyUrl: job.applyUrl ?? '',
          status: job.status ?? 'active',
          featured: Boolean(job.featured),
          expiresAt: job.expiresAt ? job.expiresAt.slice(0, 10) : '',
        });
        setLoading(false);
      })
      .catch(() => { showToast('Failed to load job', 'error'); setLoading(false); });
  }, [params.id]);

  function setField<K extends keyof typeof form>(key: K, value: typeof form[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function addSkill() {
    const s = skillInput.trim();
    if (s && !form.skills.includes(s)) setForm((f) => ({ ...f, skills: [...f.skills, s] }));
    setSkillInput('');
  }

  function removeSkill(s: string) {
    setForm((f) => ({ ...f, skills: f.skills.filter((sk) => sk !== s) }));
  }

  async function handleSubmit() {
    if (!form.title || !form.category || !form.type || !form.mode || !form.experience) {
      showToast('Please fill all required fields', 'error');
      return;
    }
    setSaving(true);
    try {
      const body = {
        ...form,
        company: form.confidential ? 'Confidential' : form.company,
        expiresAt: form.expiresAt || null,
      };
      const res = await fetch(`/api/admin/jobs/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('Failed');
      showToast('Job updated!');
      setTimeout(() => router.push('/admin/jobs'), 500);
    } catch {
      showToast('Failed to update job', 'error');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="p-6 text-center text-gray-500 dark:text-gray-400">Loading...</div>;
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg text-sm font-medium shadow-lg ${toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'}`}>
          {toast.msg}
        </div>
      )}

      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/jobs" className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
          <ArrowLeft className="w-4 h-4 text-gray-600 dark:text-gray-300" />
        </Link>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Edit Job</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
        <div className="space-y-5">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Basic Info</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Job Title *</label>
                <input type="text" value={form.title} onChange={(e) => setField('title', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Slug</label>
                <input type="text" value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-mono text-gray-500 dark:text-gray-400 focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Company *</label>
                <div className="flex items-center gap-3 mb-2">
                  <input type="checkbox" id="confidential" checked={form.confidential}
                    onChange={(e) => setField('confidential', e.target.checked)} className="rounded" />
                  <label htmlFor="confidential" className="text-xs text-gray-600 dark:text-gray-400">Confidential</label>
                </div>
                {!form.confidential && (
                  <input type="text" value={form.company} onChange={(e) => setField('company', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white focus:outline-none" />
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Location *</label>
                  <input type="text" value={form.location} onChange={(e) => setField('location', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Salary Range</label>
                  <input type="text" value={form.salary} onChange={(e) => setField('salary', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white focus:outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Job Type *</label>
                  <select value={form.type} onChange={(e) => setField('type', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white focus:outline-none">
                    {JOB_TYPES.map((t) => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Work Mode *</label>
                  <select value={form.mode} onChange={(e) => setField('mode', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white focus:outline-none">
                    {WORK_MODES.map((m) => <option key={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Experience *</label>
                  <select value={form.experience} onChange={(e) => setField('experience', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white focus:outline-none">
                    {EXPERIENCE_LEVELS.map((l) => <option key={l}>{l}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">External Apply URL</label>
                <input type="url" value={form.applyUrl} onChange={(e) => setField('applyUrl', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white focus:outline-none" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Job Description</h2>
            <textarea value={form.description} onChange={(e) => setField('description', e.target.value)}
              rows={12}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white focus:outline-none font-mono resize-y" />
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Skills</h2>
            <div className="flex gap-2 mb-3">
              <input type="text" value={skillInput} onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSkill(); } }}
                placeholder="Type skill + Enter"
                className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white focus:outline-none" />
              <button onClick={addSkill} className="px-3 py-2 rounded-lg bg-teal-600 text-white hover:bg-teal-700">
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {form.skills.map((s) => (
                <span key={s} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-sm text-gray-700 dark:text-gray-300">
                  {s} <button onClick={() => removeSkill(s)}><X className="w-3 h-3" /></button>
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Settings</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Category *</label>
                <select value={form.category} onChange={(e) => setField('category', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white focus:outline-none">
                  <option value="">Select category</option>
                  {JOB_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
                <select value={form.status} onChange={(e) => setField('status', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white focus:outline-none">
                  <option value="active">Active</option>
                  <option value="closed">Closed</option>
                  <option value="draft">Draft</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Expiry Date</label>
                <input type="date" value={form.expiresAt} onChange={(e) => setField('expiresAt', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white focus:outline-none" />
              </div>
              <div className="flex items-center gap-3">
                <input type="checkbox" id="featured" checked={form.featured}
                  onChange={(e) => setField('featured', e.target.checked)} className="rounded" />
                <label htmlFor="featured" className="text-sm text-gray-700 dark:text-gray-300">Featured on homepage</label>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <button onClick={handleSubmit} disabled={saving}
              className="w-full py-3 rounded-xl text-sm font-bold text-white disabled:opacity-60 hover:opacity-90"
              style={{ background: '#e47538' }}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            <Link href="/admin/jobs" className="block text-center py-2 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
              Cancel
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
