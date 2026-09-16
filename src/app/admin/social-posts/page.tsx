'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Plus, Pencil, Trash2, Loader2, Image as ImageIcon, Link2, Send, RotateCcw } from 'lucide-react';

interface SocialPostItem {
  id: string;
  content: string;
  channels: string;
  imageUrl: string | null;
  linkUrl: string | null;
  scheduledFor: string;
  status: string;
  attemptCount: number;
  lastError: string | null;
}

const STATUS_BADGE_COLOR: Record<string, string> = {
  draft:  'bg-gray-50 text-gray-600 ring-gray-200 dark:bg-gray-700 dark:text-gray-400 dark:ring-gray-600',
  queued: 'bg-blue-50 text-blue-700 ring-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:ring-blue-700',
  sent:   'bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:ring-emerald-700',
  failed: 'bg-red-50 text-red-700 ring-red-200 dark:bg-red-900/30 dark:text-red-400 dark:ring-red-700',
};

function formatIst(utcIso: string): string {
  return new Date(utcIso).toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }) + ' IST';
}

export default function AdminSocialPostsPage() {
  const [posts, setPosts] = useState<SocialPostItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/social-posts');
      if (!res.ok) throw new Error('Failed to load');
      const data = await res.json();
      setPosts(data.socialPosts ?? []);
    } catch { showToast('Failed to load social posts', 'error'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function deletePost(id: string) {
    if (!confirm('Delete this post?')) return;
    try {
      const res = await fetch(`/api/admin/social-posts/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || 'Failed to delete');
      }
      showToast('Post deleted');
      void load();
    } catch (err) { showToast(err instanceof Error ? err.message : 'Failed to delete', 'error'); }
  }

  function getQueueAction(status: string): { next: 'draft' | 'queued'; label: string } | null {
    if (status === 'draft') return { next: 'queued', label: 'Queue' };
    if (status === 'queued') return { next: 'draft', label: 'To Draft' };
    if (status === 'failed') return { next: 'queued', label: 'Requeue' };
    return null;
  }

  async function toggleQueueStatus(id: string, currentStatus: string) {
    const action = getQueueAction(currentStatus);
    if (!action) return;
    try {
      const res = await fetch(`/api/admin/social-posts/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: action.next }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.error || 'Failed to update status');
      }
      showToast(action.next === 'queued' ? 'Post queued' : 'Post reverted to draft');
      void load();
    } catch (err) { showToast(err instanceof Error ? err.message : 'Failed to update status', 'error'); }
  }

  const queued = posts.filter((p) => p.status === 'queued').length;
  const failed = posts.filter((p) => p.status === 'failed').length;

  const loader = (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="w-6 h-6 animate-spin text-teal-500" />
    </div>
  );

  const empty = (
    <div className="text-center py-20 text-gray-500 dark:text-gray-400">No social posts found.</div>
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Social Posts</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {queued} queued · {failed} failed · {posts.length} total
          </p>
        </div>
        <Link
          href="/admin/social-posts/new"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-colors"
          style={{ background: '#0f766e' }}
        >
          <Plus className="w-4 h-4" /> New Post
        </Link>
      </div>

      {/* Mobile card list */}
      <div className="block lg:hidden mb-5">
        {loading ? loader : posts.length === 0 ? empty : (
          <div className="flex flex-col gap-2">
            {posts.map((post) => (
              <div key={post.id} className="rounded-xl p-3 bg-white dark:bg-[#161b22] border-[1.5px] border-[#94a3b8] dark:border-[#21262d]">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <p className="text-sm leading-snug text-[#0f172a] dark:text-[#e6edf3] font-medium line-clamp-2">{post.content}</p>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium capitalize ring-1 ring-inset ${STATUS_BADGE_COLOR[post.status] ?? STATUS_BADGE_COLOR.draft}`}>
                    {post.status}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-[#475569] dark:text-[#8b949e] mb-2">
                  <span className="capitalize">{post.channels}</span>
                  {post.imageUrl && <ImageIcon className="w-3.5 h-3.5" />}
                  {post.linkUrl && <Link2 className="w-3.5 h-3.5" />}
                  <span>·</span>
                  <span>{formatIst(post.scheduledFor)}</span>
                </div>
                {post.attemptCount > 0 && (
                  <p className="text-xs text-[#475569] dark:text-[#8b949e] mb-1">Attempts: {post.attemptCount}</p>
                )}
                {post.lastError && (
                  <p className="text-xs text-red-600 dark:text-red-400 mb-2 line-clamp-2">{post.lastError}</p>
                )}
                <div className="flex gap-2">
                  {getQueueAction(post.status) && (
                    <button
                      onClick={() => toggleQueueStatus(post.id, post.status)}
                      className="flex-1 rounded-lg py-1.5 text-xs font-medium text-white bg-[#1d4ed8]"
                    >
                      {getQueueAction(post.status)?.label}
                    </button>
                  )}
                  <Link
                    href={`/admin/social-posts/${post.id}/edit`}
                    className="flex-1 rounded-lg py-1.5 text-center text-xs font-medium text-white bg-[#024c57]"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => deletePost(post.id)}
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
        {loading ? loader : posts.length === 0 ? empty : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  {['Content', 'Channels', 'Scheduled (IST)', 'Status', 'Attempts', 'Last Error', 'Actions'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {posts.map((post) => (
                  <tr key={post.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900 dark:text-white text-sm truncate max-w-[280px]">{post.content}</p>
                      <div className="flex items-center gap-1.5 mt-0.5 text-gray-400 dark:text-gray-500">
                        {post.imageUrl && <ImageIcon className="w-3.5 h-3.5" />}
                        {post.linkUrl && <Link2 className="w-3.5 h-3.5" />}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300 text-xs capitalize">{post.channels}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300 text-xs whitespace-nowrap">{formatIst(post.scheduledFor)}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize ring-1 ring-inset ${STATUS_BADGE_COLOR[post.status] ?? STATUS_BADGE_COLOR.draft}`}>
                        {post.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300 text-xs">{post.attemptCount}</td>
                    <td className="px-4 py-3 text-red-600 dark:text-red-400 text-xs max-w-[200px] truncate" title={post.lastError ?? ''}>
                      {post.lastError ?? '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {getQueueAction(post.status) && (
                          <button onClick={() => toggleQueueStatus(post.id, post.status)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                            title={getQueueAction(post.status)?.label}>
                            {post.status === 'draft' ? <Send className="w-3.5 h-3.5" /> : <RotateCcw className="w-3.5 h-3.5" />}
                          </button>
                        )}
                        <Link href={`/admin/social-posts/${post.id}/edit`}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-900/30 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center" title="Edit">
                          <Pencil className="w-3.5 h-3.5" />
                        </Link>
                        <button onClick={() => deletePost(post.id)}
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
