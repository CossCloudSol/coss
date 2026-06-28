'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Plus, Search, Pencil, Trash2, Star, ToggleLeft, ToggleRight, Loader2, Eye } from 'lucide-react';

interface PostItem {
  id: string;
  title: string;
  slug: string;
  category: string;
  author: string;
  status: string;
  featured: boolean;
  views: number;
  publishedAt: string | null;
  createdAt: string;
}

const STATUS_STYLES: Record<string, string> = {
  published: 'bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:ring-emerald-700',
  draft: 'bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:ring-amber-700',
  archived: 'bg-gray-50 text-gray-600 ring-gray-200 dark:bg-gray-700 dark:text-gray-400 dark:ring-gray-600',
};

export default function AdminBlogPage() {
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: '20' });
    if (search) params.set('search', search);
    if (statusFilter) params.set('status', statusFilter);
    try {
      const res = await fetch(`/api/admin/blog?${params}`);
      const data = await res.json();
      setPosts(data.posts ?? []);
      setTotal(data.total ?? 0);
      setTotalPages(data.totalPages ?? 1);
    } catch {
      showToast('Failed to load posts', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => { void load(); }, [load]);

  async function toggleStatus(id: string, current: string) {
    const next = current === 'published' ? 'draft' : 'published';
    try {
      await fetch(`/api/admin/blog/${id}/toggle`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: next }),
      });
      showToast(`Status set to ${next}`);
      void load();
    } catch {
      showToast('Failed to update status', 'error');
    }
  }

  async function toggleFeatured(id: string, current: boolean) {
    try {
      await fetch(`/api/admin/blog/${id}/toggle`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ featured: !current }),
      });
      showToast(`Featured ${!current ? 'enabled' : 'disabled'}`);
      void load();
    } catch {
      showToast('Failed to update', 'error');
    }
  }

  async function handleDelete(id: string, title: string) {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    try {
      await fetch(`/api/admin/blog/${id}`, { method: 'DELETE' });
      showToast('Post deleted');
      void load();
    } catch {
      showToast('Failed to delete', 'error');
    }
  }

  const loader = (
    <div className="flex items-center justify-center py-16">
      <Loader2 className="h-6 w-6 animate-spin text-teal-600" />
    </div>
  );

  const empty = (
    <div className="py-16 text-center">
      <p className="text-sm text-gray-500 dark:text-gray-400">No posts found.</p>
      <Link href="/admin/blog/new" className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-teal-600 hover:underline">
        <Plus className="h-4 w-4" /> Write your first post
      </Link>
    </div>
  );

  return (
    <div className="space-y-5 overflow-x-hidden">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Blog Posts</h1>
          <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">{total} total</p>
        </div>
        <Link
          href="/admin/blog/new"
          className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-teal-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          New Post
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search posts…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 pl-9 pr-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
        >
          <option value="">All Status</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      {/* Mobile card list */}
      <div className="block lg:hidden">
        {loading ? loader : posts.length === 0 ? empty : (
          <div className="flex flex-col gap-2">
            {posts.map((post, index) => {
              const isPublished = post.status === 'published';
              const isEven = index % 2 === 0;
              const cardBg = isPublished
                ? isEven ? 'bg-[#024c57]' : 'bg-[#03798a]'
                : 'bg-white dark:bg-[#161b22] border-[1.5px] border-[#94a3b8] dark:border-[#21262d]';
              const titleCls = isPublished
                ? 'text-white font-medium'
                : 'text-[#0f172a] dark:text-[#e6edf3] font-medium';
              const subtitleCls = isPublished
                ? 'text-white/70'
                : 'text-[#475569] dark:text-[#8b949e]';
              const editBg = isPublished
                ? isEven ? 'bg-[#024c57] ring-1 ring-white/30' : 'bg-[#03798a] ring-1 ring-white/30'
                : 'bg-[#024c57]';
              const viewBg = isPublished
                ? isEven ? 'bg-[#03798a]' : 'bg-[#024c57]'
                : 'bg-[#03798a]';
              const statusBadgeCls = isPublished
                ? 'bg-white/20 text-white'
                : post.status === 'draft'
                  ? 'bg-[#dc2626] text-white dark:bg-[#21262d] dark:text-[#8b949e]'
                  : 'bg-[#94a3b8] text-white';
              const catBadgeCls = isPublished
                ? 'bg-white/20 text-white'
                : 'bg-[#1d4ed8] text-white dark:bg-[#1a2c3d] dark:text-[#58a6ff]';

              return (
                <div key={post.id} className={`rounded-xl p-3 ${cardBg}`}>
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className={`text-sm leading-snug ${titleCls}`}>{post.title}</p>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium capitalize ${statusBadgeCls}`}>
                      {post.status}
                    </span>
                  </div>
                  <p className={`text-xs mb-1 ${subtitleCls}`}>{post.author}</p>
                  <div className="flex gap-1.5 mb-3 flex-wrap">
                    <span className={`rounded-full px-2 py-0.5 text-xs ${catBadgeCls}`}>{post.category}</span>
                    <span className={`rounded-full px-2 py-0.5 text-xs ${catBadgeCls}`}>{post.views.toLocaleString()} views</span>
                  </div>
                  <div className="flex gap-2">
                    <Link
                      href={`/admin/blog/${post.id}/edit`}
                      className={`flex-1 rounded-lg py-1.5 text-center text-xs font-medium text-white ${editBg}`}
                    >
                      Edit
                    </Link>
                    <Link
                      href={`/blog/${post.slug}`}
                      target="_blank"
                      className={`flex-1 rounded-lg py-1.5 text-center text-xs font-medium text-white ${viewBg}`}
                    >
                      View
                    </Link>
                    <button
                      onClick={() => void handleDelete(post.id, post.title)}
                      className="flex-1 rounded-lg py-1.5 text-xs font-medium text-white bg-[#dc2626]"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Desktop table */}
      <div className="hidden lg:block rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
        {loading ? loader : posts.length === 0 ? empty : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800/60">
                <tr className="text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  <th className="px-4 py-3">Title</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Author</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Featured</th>
                  <th className="px-4 py-3">
                    <span className="inline-flex items-center gap-1"><Eye className="h-3 w-3" /> Views</span>
                  </th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {posts.map((post) => (
                  <tr key={post.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900 dark:text-white line-clamp-1 max-w-xs">{post.title}</div>
                      <div className="text-xs text-gray-400 dark:text-gray-500">{post.slug}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{post.category}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{post.author}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize ring-1 ring-inset ${STATUS_STYLES[post.status] ?? STATUS_STYLES.draft}`}>
                        {post.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => void toggleFeatured(post.id, post.featured)} className="text-gray-400 hover:text-amber-500 transition-colors">
                        <Star className={`h-4 w-4 ${post.featured ? 'fill-amber-400 text-amber-400' : ''}`} />
                      </button>
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300 font-medium">
                      {post.views.toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => void toggleStatus(post.id, post.status)}
                          title={post.status === 'published' ? 'Unpublish' : 'Publish'}
                          className="text-gray-400 hover:text-teal-600 transition-colors"
                        >
                          {post.status === 'published' ? <ToggleRight className="h-5 w-5 text-teal-600" /> : <ToggleLeft className="h-5 w-5" />}
                        </button>
                        <Link href={`/admin/blog/${post.id}/edit`} className="text-gray-400 hover:text-blue-600 transition-colors">
                          <Pencil className="h-4 w-4" />
                        </Link>
                        <button onClick={() => void handleDelete(post.id, post.title)} className="text-gray-400 hover:text-red-600 transition-colors">
                          <Trash2 className="h-4 w-4" />
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500 dark:text-gray-400">Page {page} of {totalPages}</span>
          <div className="flex gap-2">
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-1.5 text-gray-700 dark:text-gray-300 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              Previous
            </button>
            <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-1.5 text-gray-700 dark:text-gray-300 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              Next
            </button>
          </div>
        </div>
      )}

      {toast && (
        <div className={`fixed bottom-5 right-5 z-50 rounded-lg px-5 py-3 text-sm font-medium text-white shadow-lg ${toast.type === 'error' ? 'bg-red-600' : 'bg-teal-600'}`}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}
