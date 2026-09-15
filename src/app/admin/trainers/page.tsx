'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import { Plus, Pencil, Trash2, Eye, EyeOff, Loader2 } from 'lucide-react';

interface TrainerItem {
  id: string;
  name: string;
  title: string;
  category: string | null;
  startYear: number | null;
  sortOrder: number;
  isVisible: boolean;
}

export default function AdminTrainersPage() {
  const [trainers, setTrainers] = useState<TrainerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const dragItem = useRef<number | null>(null);
  const dragOver = useRef<number | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/trainers');
      const data = await res.json();
      setTrainers(data.trainers ?? []);
    } catch { showToast('Failed to load trainers', 'error'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function deleteTrainer(id: string, name: string) {
    if (!confirm(`Delete "${name}"?`)) return;
    try {
      const res = await fetch(`/api/admin/trainers/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || 'Failed to delete');
      }
      showToast('Trainer deleted');
      void load();
    } catch (err) { showToast(err instanceof Error ? err.message : 'Failed to delete', 'error'); }
  }

  async function toggleVisible(id: string, current: boolean) {
    try {
      const res = await fetch(`/api/admin/trainers/${id}/toggle`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isVisible: !current }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || 'Failed to update');
      }
      showToast(current ? 'Hidden from faculty page' : 'Shown on faculty page');
      void load();
    } catch (err) { showToast(err instanceof Error ? err.message : 'Failed to update', 'error'); }
  }

  function handleDragStart(index: number) { dragItem.current = index; }
  function handleDragEnter(index: number) { dragOver.current = index; }

  async function handleDragEnd() {
    if (dragItem.current === null || dragOver.current === null) return;
    const reordered = [...trainers];
    const [moved] = reordered.splice(dragItem.current, 1);
    reordered.splice(dragOver.current, 0, moved);
    dragItem.current = null;
    dragOver.current = null;
    setTrainers(reordered);
    try {
      const res = await fetch('/api/admin/trainers/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: reordered.map((t) => t.id) }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || 'Failed to save order');
      }
    } catch (err) { showToast(err instanceof Error ? err.message : 'Failed to save order', 'error'); }
  }

  const loader = (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="w-6 h-6 animate-spin text-teal-500" />
    </div>
  );

  const empty = (
    <div className="text-center py-20 text-gray-500 dark:text-gray-400">No trainers found.</div>
  );

  return (
    <div className="p-6 max-w-7xl mx-auto overflow-x-hidden">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg text-sm font-medium shadow-lg ${toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'}`}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Trainers</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {trainers.filter((t) => t.isVisible).length} visible · {trainers.length} total · drag to reorder
          </p>
        </div>
        <Link
          href="/admin/trainers/new"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-colors"
          style={{ background: '#0f766e' }}
        >
          <Plus className="w-4 h-4" /> New Trainer
        </Link>
      </div>

      {/* Mobile card list */}
      <div className="block lg:hidden mb-5">
        {loading ? loader : trainers.length === 0 ? empty : (
          <div className="flex flex-col gap-2">
            {trainers.map((trainer, index) => (
              <div
                key={trainer.id}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragEnter={() => handleDragEnter(index)}
                onDragEnd={handleDragEnd}
                onDragOver={(e) => e.preventDefault()}
                className={`rounded-xl p-3 cursor-grab bg-white dark:bg-[#161b22] border-[1.5px] border-[#94a3b8] dark:border-[#21262d] ${!trainer.isVisible ? 'opacity-50' : ''}`}
              >
                <div className="flex items-start justify-between gap-2 mb-0.5">
                  <div className="min-w-0">
                    <p className="text-sm leading-snug truncate font-medium text-[#0f172a] dark:text-[#e6edf3]">{trainer.name}</p>
                    <p className="text-xs truncate text-[#475569] dark:text-[#8b949e]">{trainer.title}</p>
                  </div>
                  {trainer.category && (
                    <span className="shrink-0 rounded-full px-2 py-0.5 text-xs bg-[#1d4ed8] text-white">{trainer.category}</span>
                  )}
                </div>
                <div className="flex gap-2 mt-3">
                  <Link
                    href={`/admin/trainers/${trainer.id}/edit`}
                    className="flex-1 rounded-lg py-1.5 text-center text-xs font-medium text-white bg-[#024c57]"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => toggleVisible(trainer.id, trainer.isVisible)}
                    className="flex-1 rounded-lg py-1.5 text-xs font-medium text-white bg-[#03798a]"
                  >
                    {trainer.isVisible ? 'Hide' : 'Show'}
                  </button>
                  <button
                    onClick={() => deleteTrainer(trainer.id, trainer.name)}
                    className="flex-1 rounded-lg py-1.5 text-xs font-medium text-white bg-[#dc2626]"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Desktop table */}
      <div className="hidden lg:block bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {loading ? loader : trainers.length === 0 ? empty : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  {['', 'Name', 'Title', 'Category', 'Career Start', 'Visible', 'Actions'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {trainers.map((trainer, index) => (
                  <tr
                    key={trainer.id}
                    draggable
                    onDragStart={() => handleDragStart(index)}
                    onDragEnter={() => handleDragEnter(index)}
                    onDragEnd={handleDragEnd}
                    onDragOver={(e) => e.preventDefault()}
                    className={`hover:bg-gray-50 dark:hover:bg-gray-700/30 cursor-grab ${!trainer.isVisible ? 'opacity-50' : ''}`}
                  >
                    <td className="px-4 py-3 text-gray-300 dark:text-gray-600" aria-hidden="true">⠿</td>
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white text-sm">{trainer.name}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300 text-xs">{trainer.title}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300 text-xs">{trainer.category ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300 text-xs">{trainer.startYear ?? '—'}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleVisible(trainer.id, trainer.isVisible)}
                        className={`transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center ${trainer.isVisible ? 'text-teal-600' : 'text-gray-300 dark:text-gray-600'}`}
                        title={trainer.isVisible ? 'Hide from faculty page' : 'Show on faculty page'}
                      >
                        {trainer.isVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Link href={`/admin/trainers/${trainer.id}/edit`}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-900/30 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center" title="Edit">
                          <Pencil className="w-3.5 h-3.5" />
                        </Link>
                        <button onClick={() => deleteTrainer(trainer.id, trainer.name)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center" title="Delete">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
