import { prisma } from '@/lib/db';

/**
 * Admin overview statistics — shared by GET /api/admin/stats and the
 * /admin overview page. The page calls this directly: it used to HTTP-fetch
 * its own API route, which chained a second serverless invocation (and a
 * second potential cold start) behind every dashboard load.
 *
 * Callers are responsible for the admin session check.
 */

export interface AdminStatsResponse {
  totals: {
    leads: number;
    corporate: number;
    newToday: number;
    enrolled: number;
  };
  content: {
    publishedCourses: number;
    publishedPosts: number;
    totalBlogViews: number;
    draftsPending: number;
  };
  byBranch: {
    dilsukhnagar: number;
    ameerpet: number;
    online: number;
  };
  byStatus: {
    new: number;
    contacted: number;
    enrolled: number;
    lost: number;
  };
  recentLeads: Array<{
    id: string;
    name: string;
    phone: string;
    course: string | null;
    branch: string;
    status: string;
    createdAt: string;
  }>;
  dailyLeads: Array<{
    date: string;
    count: number;
  }>;
}

const BRANCH_KEYS = ['dilsukhnagar', 'ameerpet', 'online'] as const;
type BranchKey = (typeof BRANCH_KEYS)[number];

const STATUS_KEYS = ['new', 'contacted', 'enrolled', 'lost'] as const;
type StatusKey = (typeof STATUS_KEYS)[number];

function isBranchKey(value: string): value is BranchKey {
  return (BRANCH_KEYS as ReadonlyArray<string>).includes(value);
}

function isStatusKey(value: string): value is StatusKey {
  return (STATUS_KEYS as ReadonlyArray<string>).includes(value);
}

/**
 * Start of local-day (00:00:00.000). We intentionally use the server's local
 * clock — if you deploy in a different timezone to your users, set TZ on the
 * runtime (e.g. `TZ=Asia/Kolkata`) so "today" matches the admin's calendar.
 */
function startOfToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

/** Throws on DB errors — callers decide how to surface them. */
export async function getAdminStats(): Promise<AdminStatsResponse> {
  const todayStart = startOfToday();
  const sevenDaysAgo = new Date(todayStart);
  // 7 days inclusive of today => subtract 6 from today's 00:00.
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

  const [
    totalLeads,
    totalCorporate,
    newTodayCount,
    enrolledCount,
    byBranchRaw,
    byStatusRaw,
    recentLeadsRaw,
    dailyLeadsRaw,
    publishedCourses,
    publishedPosts,
    blogViewsAgg,
    draftCourses,
    draftPosts,
  ] = await Promise.all([
    prisma.lead.count(),
    prisma.corporateLead.count(),
    prisma.lead.count({ where: { createdAt: { gte: todayStart } } }),
    prisma.lead.count({ where: { status: 'enrolled' } }),
    prisma.lead.groupBy({ by: ['branch'], _count: { _all: true } }),
    prisma.lead.groupBy({ by: ['status'], _count: { _all: true } }),
    prisma.lead.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        name: true,
        phone: true,
        course: true,
        branch: true,
        status: true,
        createdAt: true,
      },
    }),
    prisma.lead.findMany({
      where: { createdAt: { gte: sevenDaysAgo } },
      select: { createdAt: true },
    }),
    prisma.course.count({ where: { status: 'published' } }),
    prisma.blogPost.count({ where: { status: 'published' } }),
    prisma.blogPost.aggregate({ _sum: { views: true } }),
    prisma.course.count({ where: { status: 'draft' } }),
    prisma.blogPost.count({ where: { status: 'draft' } }),
  ]);

  // Shape byBranch: seed the three expected keys to 0 so the UI doesn't have
  // to handle missing buckets.
  const byBranch: AdminStatsResponse['byBranch'] = {
    dilsukhnagar: 0,
    ameerpet: 0,
    online: 0,
  };
  for (const row of byBranchRaw) {
    const key = (row.branch ?? '').toLowerCase();
    if (isBranchKey(key)) {
      byBranch[key] = row._count._all;
    }
  }

  const byStatus: AdminStatsResponse['byStatus'] = {
    new: 0,
    contacted: 0,
    enrolled: 0,
    lost: 0,
  };
  for (const row of byStatusRaw) {
    const key = (row.status ?? '').toLowerCase();
    if (isStatusKey(key)) {
      byStatus[key] = row._count._all;
    }
  }

  // Build a dense 7-day series (no gaps) keyed by weekday short-name.
  const weekdayFormatter = new Intl.DateTimeFormat('en-US', { weekday: 'short' });
  const dailyLeads: AdminStatsResponse['dailyLeads'] = [];
  for (let offset = 6; offset >= 0; offset--) {
    const dayStart = new Date(todayStart);
    dayStart.setDate(dayStart.getDate() - offset);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);
    const count = dailyLeadsRaw.filter(
      (lead) => lead.createdAt >= dayStart && lead.createdAt < dayEnd,
    ).length;
    dailyLeads.push({
      date: weekdayFormatter.format(dayStart),
      count,
    });
  }

  return {
    totals: {
      leads: totalLeads,
      corporate: totalCorporate,
      newToday: newTodayCount,
      enrolled: enrolledCount,
    },
    content: {
      publishedCourses,
      publishedPosts,
      totalBlogViews: blogViewsAgg._sum.views ?? 0,
      draftsPending: draftCourses + draftPosts,
    },
    byBranch,
    byStatus,
    recentLeads: recentLeadsRaw.map((lead) => ({
      id: lead.id,
      name: lead.name,
      phone: lead.phone,
      course: lead.course,
      branch: lead.branch,
      status: lead.status,
      createdAt: lead.createdAt.toISOString(),
    })),
    dailyLeads,
  };
}
