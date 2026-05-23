import { NextResponse, type NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/session';

// Prisma uses Node built-ins — cannot run on the Edge runtime.
export const runtime = 'nodejs';
// Admin data is request-scoped; never let Next cache it.
export const dynamic = 'force-dynamic';

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

export async function GET(req: NextRequest): Promise<Response> {
  // Session check — middleware guards `/admin/*` but `/api/admin/*` is not
  // covered by that matcher, so we validate here too.
  const probe = NextResponse.next();
  const session = await getSession(req, probe);
  if (!session.isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const todayStart = startOfToday();
  const sevenDaysAgo = new Date(todayStart);
  // 7 days inclusive of today => subtract 6 from today's 00:00.
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

  try {
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

    const payload: AdminStatsResponse = {
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

    return NextResponse.json(payload);
  } catch (err) {
    console.error('[GET /api/admin/stats] DB error:', err);
    return NextResponse.json({ error: 'Failed to load stats' }, { status: 500 });
  }
}
