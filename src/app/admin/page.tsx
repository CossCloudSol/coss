import { formatDistanceToNow } from 'date-fns';
import { headers } from 'next/headers';
import type { AdminStatsResponse } from '@/app/api/admin/stats/route';
import TestNotificationButton from '@/components/admin/TestNotificationButton';

export const dynamic = 'force-dynamic';

/**
 * Fetch the stats API using the current request's cookie so the server-side
 * fetch carries the admin session. We resolve an absolute URL from the
 * incoming request headers (server-side fetch can't use relative URLs).
 */
async function getStats(): Promise<AdminStatsResponse> {
  const headerList = headers();
  const host = headerList.get('host') ?? 'localhost:3000';
  const proto =
    headerList.get('x-forwarded-proto') ??
    (host.startsWith('localhost') ? 'http' : 'https');
  const cookie = headerList.get('cookie') ?? '';

  const response = await fetch(`${proto}://${host}/api/admin/stats`, {
    cache: 'no-store',
    headers: cookie ? { cookie } : undefined,
  });

  if (!response.ok) {
    throw new Error(`Stats API returned ${response.status}`);
  }

  return (await response.json()) as AdminStatsResponse;
}

type CardVariant = 'leads' | 'newToday' | 'enrolled' | 'corporate';

const CARD_CONFIG: Record<CardVariant, { lightBg: string; darkBar: string }> = {
  leads:     { lightBg: 'bg-[#024c57]', darkBar: 'bg-blue-500' },
  newToday:  { lightBg: 'bg-[#1d4ed8]', darkBar: 'bg-emerald-500' },
  enrolled:  { lightBg: 'bg-[#d97706]', darkBar: 'bg-teal-500' },
  corporate: { lightBg: 'bg-[#7c3aed]', darkBar: 'bg-orange-500' },
};

function StatCard({
  label,
  value,
  variant,
}: {
  label: string;
  value: number;
  variant: CardVariant;
}): JSX.Element {
  const { lightBg, darkBar } = CARD_CONFIG[variant];
  return (
    <div className={`relative overflow-hidden rounded-xl p-3 ${lightBg} dark:bg-[#161b22] dark:border dark:border-[#21262d]`}>
      <div
        className={`hidden dark:block absolute left-0 top-0 h-[2.5px] w-full ${darkBar}`}
        aria-hidden="true"
      />
      <p className="text-[10px] uppercase tracking-wide text-white/65 dark:text-[#8b949e] mb-1">
        {label}
      </p>
      <p className="text-2xl font-medium text-white dark:text-[#e6edf3]">
        {value.toLocaleString()}
      </p>
    </div>
  );
}

const STATUS_STYLES: Record<string, string> = {
  new: 'bg-[#5ef0c8] text-[#012e36] font-bold ring-[#5ef0c8] dark:bg-[#1f3a2d] dark:text-[#3fb950] dark:ring-emerald-700',
  contacted: 'bg-[#dbeafe] text-[#1d4ed8] font-medium ring-[#bfdbfe] dark:bg-blue-900/30 dark:text-blue-400 dark:ring-blue-700',
  enrolled: 'bg-[#f3e8ff] text-[#7c3aed] font-medium ring-[#e9d5ff] dark:bg-purple-900/30 dark:text-purple-400 dark:ring-purple-700',
  lost: 'bg-red-50 text-red-700 font-medium ring-red-200 dark:bg-red-900/30 dark:text-red-400 dark:ring-red-700',
};

function statusClasses(status: string): string {
  return (
    STATUS_STYLES[status.toLowerCase()] ??
    'bg-gray-50 text-gray-700 font-medium ring-gray-200'
  );
}

function StatusBadge({ status }: { status: string }): JSX.Element {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs capitalize ring-1 ring-inset ${statusClasses(status)}`}
    >
      {status}
    </span>
  );
}

function RecentLeadsCard({
  leads,
}: {
  leads: AdminStatsResponse['recentLeads'];
}): JSX.Element {
  return (
    <section className="rounded-xl border border-[#c9e8ed] dark:border-[#21262d] bg-white dark:bg-[#161b22]">
      <header className="flex items-center justify-between border-b border-[#c9e8ed] dark:border-[#21262d] px-5 py-4">
        <h2 className="text-xs font-semibold text-[#024c57] dark:text-[#8b949e] uppercase tracking-wide">Recent Leads</h2>
        <span className="text-xs text-[#475569] dark:text-[#8b949e]">Last 5</span>
      </header>
      {leads.length === 0 ? (
        <p className="px-5 py-10 text-center text-sm text-[#475569] dark:text-[#8b949e]">
          No leads captured yet.
        </p>
      ) : (
        <>
          {/* Mobile card list — shown only on < md */}
          <ul className="md:hidden divide-y divide-[#c9e8ed] dark:divide-[#21262d]">
            {leads.map((lead) => (
              <li key={lead.id} className="flex items-start justify-between gap-2 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-[#0f172a] dark:text-[#e6edf3]">
                    {lead.name}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-[#475569] dark:text-[#8b949e]">
                    {lead.course ?? '—'} · <span className="capitalize">{lead.branch}</span>
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <StatusBadge status={lead.status} />
                  <p className="mt-1 text-[11px] text-[#475569] dark:text-[#8b949e]">
                    {formatDistanceToNow(new Date(lead.createdAt), { addSuffix: true })}
                  </p>
                </div>
              </li>
            ))}
          </ul>

          {/* Desktop table — hidden on < md */}
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full divide-y divide-[#c9e8ed] dark:divide-[#21262d] text-sm">
              <thead className="bg-[#e6f4f6] dark:bg-gray-800/60">
                <tr className="text-left text-xs font-medium uppercase tracking-wide text-[#475569] dark:text-[#8b949e]">
                  <th scope="col" className="px-5 py-2.5">Name</th>
                  <th scope="col" className="px-5 py-2.5">Course</th>
                  <th scope="col" className="px-5 py-2.5">Branch</th>
                  <th scope="col" className="px-5 py-2.5">Status</th>
                  <th scope="col" className="px-5 py-2.5">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#c9e8ed] dark:divide-[#21262d] bg-white dark:bg-[#161b22]">
                {leads.map((lead) => (
                  <tr key={lead.id}>
                    <td className="whitespace-nowrap px-5 py-3 font-medium text-[#0f172a] dark:text-[#e6edf3]">
                      {lead.name}
                    </td>
                    <td className="px-5 py-3 text-[#475569] dark:text-[#8b949e]">
                      {lead.course ?? <span className="text-[#475569] dark:text-[#8b949e]">—</span>}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 capitalize text-[#475569] dark:text-[#8b949e]">
                      {lead.branch}
                    </td>
                    <td className="px-5 py-3">
                      <StatusBadge status={lead.status} />
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 text-[#475569] dark:text-[#8b949e]">
                      {formatDistanceToNow(new Date(lead.createdAt), {
                        addSuffix: true,
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
}

function BranchBreakdown({
  byBranch,
}: {
  byBranch: AdminStatsResponse['byBranch'];
}): JSX.Element {
  const items: ReadonlyArray<{ label: string; count: number }> = [
    { label: 'Dilsukhnagar', count: byBranch.dilsukhnagar },
    { label: 'Ameerpet', count: byBranch.ameerpet },
    { label: 'Online', count: byBranch.online },
  ];
  const max = Math.max(...items.map((item) => item.count), 1);

  return (
    <section className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5">
      <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Leads by Branch</h2>
      <ul className="mt-4 space-y-4">
        {items.map((item) => {
          const widthPercent = (item.count / max) * 100;
          return (
            <li key={item.label}>
              <div className="mb-1.5 flex items-center justify-between text-sm">
                <span className="text-gray-700 dark:text-gray-300">{item.label}</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {item.count.toLocaleString()}
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
                <div
                  className="h-full rounded-full bg-teal-500 transition-all"
                  style={{ width: `${widthPercent}%` }}
                  aria-hidden="true"
                />
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function WeeklySparkline({
  dailyLeads,
}: {
  dailyLeads: AdminStatsResponse['dailyLeads'];
}): JSX.Element {
  const max = Math.max(...dailyLeads.map((day) => day.count), 1);
  const total = dailyLeads.reduce((sum, day) => sum + day.count, 0);

  return (
    <section className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5">
      <header className="flex items-end justify-between">
        <div>
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">This week</h2>
          <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
            Leads captured across the last 7 days
          </p>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Total: <span className="font-semibold text-gray-900 dark:text-white">{total}</span>
        </p>
      </header>

      <div className="overflow-x-auto -mx-1">
        <div style={{ minWidth: '260px' }}>
          <div className="mt-6 grid h-[140px] grid-cols-7 items-end gap-1 sm:gap-3">
            {dailyLeads.map((day, index) => {
              const heightPercent = (day.count / max) * 100;
              return (
                <div
                  key={`${day.date}-${index}`}
                  className="w-full rounded-t bg-teal-500 transition-all"
                  style={{
                    height: day.count === 0 ? '2px' : `${heightPercent}%`,
                    opacity: day.count === 0 ? 0.3 : 1,
                  }}
                  aria-hidden="true"
                />
              );
            })}
          </div>
          <div className="mt-2 grid grid-cols-7 gap-1 sm:gap-3">
            {dailyLeads.map((day, index) => (
              <div key={`${day.date}-label-${index}`} className="text-center">
                <p className="text-xs font-semibold text-gray-900 dark:text-white sm:text-sm">{day.count}</p>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 sm:text-xs">{day.date}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function ErrorState({ message }: { message: string }): JSX.Element {
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-6">
      <h2 className="text-sm font-semibold text-red-800">
        Couldn&apos;t load dashboard stats
      </h2>
      <p className="mt-1 text-sm text-red-700">{message}</p>
      <p className="mt-3 text-xs text-red-700/80">
        Check that <code className="rounded bg-red-100 px-1 py-0.5">DATABASE_URL</code>{' '}
        is set in <code className="rounded bg-red-100 px-1 py-0.5">.env.local</code>{' '}
        and that <code className="rounded bg-red-100 px-1 py-0.5">npx prisma migrate dev</code>{' '}
        has been run.
      </p>
    </div>
  );
}

export default async function AdminOverviewPage(): Promise<JSX.Element> {
  let stats: AdminStatsResponse | null = null;
  let errorMessage: string | null = null;

  try {
    stats = await getStats();
  } catch (err) {
    errorMessage = err instanceof Error ? err.message : 'Unknown error';
  }

  if (stats === null) {
    return <ErrorState message={errorMessage ?? 'Unknown error'} />;
  }

  return (
    <div className="grid grid-cols-12 gap-4 md:gap-6 bg-[#e6f4f6] dark:bg-[#0d1117] overflow-x-hidden">
      {/* Dev-only test button — remove in a later phase */}
      <div className="col-span-12 flex justify-end">
        <TestNotificationButton />
      </div>

      {/* Top row — 4 stat cards, 2-column grid on all sizes */}
      <div className="col-span-12">
        <div className="grid grid-cols-2 gap-3 mb-4">
          <StatCard label="Total Leads" value={stats.totals.leads} variant="leads" />
          <StatCard label="New Today" value={stats.totals.newToday} variant="newToday" />
          <StatCard label="Enrolled" value={stats.totals.enrolled} variant="enrolled" />
          <StatCard label="Corporate" value={stats.totals.corporate} variant="corporate" />
        </div>
      </div>

      {/* Middle row — recent leads (60%) + branch breakdown (40%) */}
      <div className="col-span-12 lg:col-span-7">
        <RecentLeadsCard leads={stats.recentLeads} />
      </div>
      <div className="col-span-12 lg:col-span-5">
        <BranchBreakdown byBranch={stats.byBranch} />
      </div>

      {/* Content stats row */}
      <div className="col-span-12">
        <section className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Content</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-lg border border-gray-100 dark:border-gray-700 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Published Courses</p>
              <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">{stats.content.publishedCourses.toLocaleString()}</p>
            </div>
            <div className="rounded-lg border border-gray-100 dark:border-gray-700 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Published Posts</p>
              <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">{stats.content.publishedPosts.toLocaleString()}</p>
            </div>
            <div className="rounded-lg border border-gray-100 dark:border-gray-700 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Total Blog Views</p>
              <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">{stats.content.totalBlogViews.toLocaleString()}</p>
            </div>
            <div className="rounded-lg border border-gray-100 dark:border-gray-700 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Drafts Pending</p>
              <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">{stats.content.draftsPending.toLocaleString()}</p>
            </div>
          </div>
        </section>
      </div>

      {/* Bottom row — weekly sparkline */}
      <div className="col-span-12">
        <WeeklySparkline dailyLeads={stats.dailyLeads} />
      </div>
    </div>
  );
}
