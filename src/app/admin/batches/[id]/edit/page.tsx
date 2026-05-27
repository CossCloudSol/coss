'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Copy } from 'lucide-react';

interface CourseOption { id: string; title: string; }

const SCHEDULE_OPTIONS = [
  'Weekdays 9AM–1PM', 'Weekdays 6PM–9PM',
  'Weekend 9AM–5PM', 'Weekend 9AM–1PM', 'Custom',
];
const CENTRES = ['Dilsukhnagar', 'Ameerpet'];

export default function EditBatchPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const [form, setForm] = useState({
    courseId: '', batchName: '', mode: 'Classroom',
    centre: 'Dilsukhnagar', startDate: '', endDate: '',
    schedule: 'Weekdays 9AM–1PM', customSchedule: '',
    totalSeats: '20', seatsAvailable: '20',
    trainer: '', price: '', status: 'upcoming',
    featured: false, notes: '',
  });

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/courses?limit=200&status=published').then((r) => r.json()),
      fetch(`/api/admin/batches/${params.id}`).then((r) => r.json()),
    ]).then(([coursesData, batch]) => {
      setCourses((coursesData.courses ?? []).map((c: { id: string; title: string }) => ({ id: c.id, title: c.title })));
      const sched = SCHEDULE_OPTIONS.includes(batch.schedule) ? batch.schedule : 'Custom';
      setForm({
        courseId: batch.courseId ?? '',
        batchName: batch.batchName ?? '',
        mode: batch.mode ?? 'Classroom',
        centre: batch.centre ?? 'Dilsukhnagar',
        startDate: batch.startDate ? batch.startDate.slice(0, 10) : '',
        endDate: batch.endDate ? batch.endDate.slice(0, 10) : '',
        schedule: sched,
        customSchedule: sched === 'Custom' ? (batch.schedule ?? '') : '',
        totalSeats: batch.totalSeats?.toString() ?? '20',
        seatsAvailable: batch.seatsAvailable?.toString() ?? '20',
        trainer: batch.trainer ?? '',
        price: batch.price?.toString() ?? '',
        status: batch.status ?? 'upcoming',
        featured: Boolean(batch.featured),
        notes: batch.notes ?? '',
      });
      setLoading(false);
    }).catch(() => { showToast('Failed to load', 'error'); setLoading(false); });
  }, [params.id]);

  function setField<K extends keyof typeof form>(key: K, value: typeof form[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit() {
    if (!form.courseId || !form.startDate) {
      showToast('Please fill required fields', 'error');
      return;
    }
    setSaving(true);
    try {
      const schedule = form.schedule === 'Custom' ? form.customSchedule : form.schedule;
      const body = {
        courseId: form.courseId,
        batchName: form.batchName,
        mode: form.mode,
        centre: form.mode !== 'Online' ? form.centre : null,
        startDate: form.startDate,
        endDate: form.endDate || null,
        schedule,
        totalSeats: form.mode !== 'Online' && form.totalSeats ? Number(form.totalSeats) : null,
        seatsAvailable: form.mode !== 'Online' && form.seatsAvailable ? Number(form.seatsAvailable) : null,
        trainer: form.trainer || null,
        price: form.price ? Number(form.price) : null,
        status: form.status,
        featured: form.featured,
        notes: form.notes || null,
      };
      const res = await fetch(`/api/admin/batches/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('Failed');
      showToast('Batch updated!');
      setTimeout(() => router.push('/admin/batches'), 500);
    } catch {
      showToast('Failed to update batch', 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleClone() {
    try {
      const res = await fetch(`/api/admin/batches/${params.id}/clone`, { method: 'POST' });
      const data = await res.json();
      showToast('Batch cloned! Redirecting to new batch...');
      setTimeout(() => router.push(`/admin/batches/${data.id}/edit`), 1000);
    } catch { showToast('Failed to clone', 'error'); }
  }

  if (loading) return <div className="p-6 text-center text-gray-500 dark:text-gray-400">Loading...</div>;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg text-sm font-medium shadow-lg ${toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'}`}>
          {toast.msg}
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/admin/batches" className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
            <ArrowLeft className="w-4 h-4 text-gray-600 dark:text-gray-300" />
          </Link>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Edit Batch</h1>
        </div>
        <button onClick={handleClone}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
          <Copy className="w-3.5 h-3.5" /> Clone Batch
        </button>
      </div>

      <div className="space-y-5">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Batch Details</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Course *</label>
              <select value={form.courseId} onChange={(e) => setField('courseId', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white focus:outline-none">
                <option value="">Select course</option>
                {courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Batch Name</label>
              <input type="text" value={form.batchName} onChange={(e) => setField('batchName', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Mode *</label>
              <select value={form.mode} onChange={(e) => setField('mode', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white focus:outline-none">
                <option>Classroom</option><option>Online</option><option>Hybrid</option>
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Schedule</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Start Date *</label>
                <input type="date" value={form.startDate} onChange={(e) => setField('startDate', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">End Date</label>
                <input type="date" value={form.endDate} onChange={(e) => setField('endDate', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white focus:outline-none" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Schedule *</label>
              <select value={form.schedule} onChange={(e) => setField('schedule', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white focus:outline-none">
                {SCHEDULE_OPTIONS.map((s) => <option key={s}>{s}</option>)}
              </select>
              {form.schedule === 'Custom' && (
                <input type="text" value={form.customSchedule} onChange={(e) => setField('customSchedule', e.target.value)}
                  placeholder="e.g. Mon–Thu 7PM–9PM"
                  className="mt-2 w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white focus:outline-none" />
              )}
            </div>
          </div>
        </div>

        {form.mode !== 'Online' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Venue & Seats</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Centre *</label>
                <select value={form.centre} onChange={(e) => setField('centre', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white focus:outline-none">
                  {CENTRES.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Trainer Name</label>
                <input type="text" value={form.trainer} onChange={(e) => setField('trainer', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white focus:outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Total Seats</label>
                  <input type="number" min="1" value={form.totalSeats} onChange={(e) => setField('totalSeats', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Seats Available</label>
                  <input type="number" min="0" value={form.seatsAvailable} onChange={(e) => setField('seatsAvailable', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white focus:outline-none" />
                  {Number(form.seatsAvailable) <= 3 && Number(form.seatsAvailable) > 0 && (
                    <p className="text-xs text-red-500 mt-1">Critical — {form.seatsAvailable} left</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Settings</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
              <select value={form.status} onChange={(e) => setField('status', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white focus:outline-none">
                <option value="upcoming">Upcoming</option>
                <option value="ongoing">Ongoing</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div className="flex items-center gap-3">
              <input type="checkbox" id="featured" checked={form.featured}
                onChange={(e) => setField('featured', e.target.checked)} className="rounded" />
              <label htmlFor="featured" className="text-sm text-gray-700 dark:text-gray-300">Show on homepage widget</label>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Internal Notes</label>
              <textarea value={form.notes} onChange={(e) => setField('notes', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white focus:outline-none resize-none" />
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button onClick={handleSubmit} disabled={saving}
            className="flex-1 py-3 rounded-xl text-sm font-bold text-white disabled:opacity-60 hover:opacity-90"
            style={{ background: '#0f766e' }}>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
          <Link href="/admin/batches"
            className="flex-1 py-3 rounded-xl text-sm font-medium text-center border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
            Cancel
          </Link>
        </div>
      </div>
    </div>
  );
}
