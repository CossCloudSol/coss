import { NextResponse, type NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/* -------------------------------------------------------------------------- */
/*  Response shape                                                            */
/* -------------------------------------------------------------------------- */

export interface AnalyticsResponse {
  totals: {
    leads: number;
    enrolled: number;
    conversionRate: number; // percent, 1 decimal
    avgResponseHours: number | null; // null if no status_changed activities yet
    thisMonth: number;
    whatsappSent: number;
  };
  funnel: Array<{ stage: string; key: string; count: number }>; // 4 entries
  byCourse: Array<{ course: string; count: number }>; // top 8
  byInquiryType: Array<{ type: string; count: number }>;
  byBranch: Array<{
    branch: string;
    total: number;
    new: number;
    contacted: number;
    enrolled: number;
    conversionRate: number;
  }>;
  byFormSource: Array<{
    formType: string;
    submissions: number;
    enrolled: number;
    conversionRate: number;
  }>;
  whatsapp: {
    total: number;
    today: number;
    thisWeek: number;
    thisMonth: number;
    conversionRate: number; // % of leads with whatsapp_sent activity that are enrolled
  };
  dailyLeads: Array<{ date: string; count: number }>; // last 30 days, oldest → newest
}

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */

const BRANCHES = ['dilsukhnagar', 'ameerpet', 'online'] as const;
const STATUSES = ['new', 'contacted', 'enrolled', 'lost'] as const;
const FORM_TYPES = ['hero', 'full', 'demo', 'whatsapp_widget'] as const;

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function pct(num: number, denom: number): number {
  return denom === 0 ? 0 : Math.round((num / denom) * 1000) / 10;
}

function isoDateKey(d: Date): string {
  // YYYY-MM-DD in local time so the chart buckets line up with the user's day.
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/* -------------------------------------------------------------------------- */
/*  Handler                                                                   */
/* -------------------------------------------------------------------------- */

export async function GET(req: NextRequest): Promise<Response> {
  const probe = NextResponse.next();
  const session = await getSession(req, probe);
  if (!session.isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const now = new Date();
  const monthStart = startOfMonth(now);
  const todayStart = startOfDay(now);
  const weekAgo = new Date(todayStart);
  weekAgo.setDate(weekAgo.getDate() - 6); // 7 days inclusive of today
  const thirtyDaysAgo = new Date(todayStart);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29); // 30 days inclusive of today

  const [
    totalLeads,
    thisMonthCount,
    statusGroups,
    branchStatusGroups,
    formStatusGroups,
    courseGroups,
    leadsForInquiry,
    leadsForDaily,
    statusActivities,
    whatsappActivities,
    leadsForWhatsapp,
  ] = await Promise.all([
    // 1. Total leads
    prisma.lead.count(),

    // 2. This month
    prisma.lead.count({ where: { createdAt: { gte: monthStart } } }),

    // 3. Funnel — counts grouped by status
    prisma.lead.groupBy({ by: ['status'], _count: { _all: true } }),

    // 4. Branch performance — branch + status combos
    prisma.lead.groupBy({
      by: ['branch', 'status'],
      _count: { _all: true },
    }),

    // 5. Form source performance — formType + status combos
    prisma.lead.groupBy({
      by: ['formType', 'status'],
      _count: { _all: true },
    }),

    // 6. Top courses (8) — exclude null/empty
    prisma.lead.groupBy({
      by: ['course'],
      where: { course: { not: null } },
      _count: { _all: true },
      orderBy: { _count: { course: 'desc' } },
      take: 8,
    }),

    // 7. Inquiry-type breakdown — derived from `course` (Course Inquiry vs General)
    prisma.lead.findMany({ select: { course: true } }),

    // 8. Daily series — pull just createdAt for last 30 days, bucket client-side
    prisma.lead.findMany({
      where: { createdAt: { gte: thirtyDaysAgo } },
      select: { createdAt: true },
    }),

    // 9. First status_changed activity per lead — for avg response time
    prisma.leadActivity.findMany({
      where: { action: 'status_changed' },
      orderBy: { createdAt: 'asc' },
      distinct: ['leadId'],
      select: { leadId: true, createdAt: true },
    }),

    // 10. All whatsapp_sent activities — for time-bucketed WhatsApp stats
    prisma.leadActivity.findMany({
      where: { action: 'whatsapp_sent' },
      select: { leadId: true, createdAt: true },
    }),

    // 11. Status of every lead that has a whatsapp_sent activity — for conv rate
    prisma.lead.findMany({
      where: {
        activities: { some: { action: 'whatsapp_sent' } },
      },
      select: { id: true, status: true },
    }),
  ]);

  /* ------------------------------ Funnel -------------------------------- */
  const statusCounts: Record<string, number> = {
    new: 0,
    contacted: 0,
    enrolled: 0,
    lost: 0,
  };
  for (const row of statusGroups) {
    const key = (row.status ?? '').toLowerCase();
    if (key in statusCounts) statusCounts[key] = row._count._all;
  }

  const funnel: AnalyticsResponse['funnel'] = [
    { stage: 'New Leads', key: 'new', count: statusCounts.new },
    { stage: 'Contacted', key: 'contacted', count: statusCounts.contacted },
    { stage: 'Enrolled', key: 'enrolled', count: statusCounts.enrolled },
    { stage: 'Lost', key: 'lost', count: statusCounts.lost },
  ];

  /* ------------------------------ Totals -------------------------------- */
  const enrolledCount = statusCounts.enrolled;
  const conversionRate = pct(enrolledCount, totalLeads);

  // Avg response — first status_changed per lead, joined with lead.createdAt.
  const leadCreated = await prisma.lead.findMany({
    where: { id: { in: statusActivities.map((a) => a.leadId) } },
    select: { id: true, createdAt: true },
  });
  const createdMap = new Map<string, Date>();
  for (const l of leadCreated) createdMap.set(l.id, l.createdAt);

  let totalHours = 0;
  let counted = 0;
  for (const a of statusActivities) {
    const created = createdMap.get(a.leadId);
    if (!created) continue;
    const hours = (a.createdAt.getTime() - created.getTime()) / (1000 * 60 * 60);
    if (hours >= 0) {
      totalHours += hours;
      counted += 1;
    }
  }
  const avgResponseHours =
    counted === 0 ? null : Math.round((totalHours / counted) * 10) / 10;

  /* ------------------------------ Branch perf --------------------------- */
  const branchBuckets = new Map<
    string,
    { total: number; new: number; contacted: number; enrolled: number }
  >();
  for (const b of BRANCHES) {
    branchBuckets.set(b, { total: 0, new: 0, contacted: 0, enrolled: 0 });
  }
  for (const row of branchStatusGroups) {
    const branch = (row.branch ?? '').toLowerCase();
    const status = (row.status ?? '').toLowerCase();
    const bucket = branchBuckets.get(branch);
    if (!bucket) continue;
    bucket.total += row._count._all;
    if (status === 'new') bucket.new += row._count._all;
    else if (status === 'contacted') bucket.contacted += row._count._all;
    else if (status === 'enrolled') bucket.enrolled += row._count._all;
  }
  const byBranch: AnalyticsResponse['byBranch'] = BRANCHES.map((b) => {
    const bucket = branchBuckets.get(b)!;
    return {
      branch: b,
      total: bucket.total,
      new: bucket.new,
      contacted: bucket.contacted,
      enrolled: bucket.enrolled,
      conversionRate: pct(bucket.enrolled, bucket.total),
    };
  });

  /* ------------------------------ Form source perf ---------------------- */
  const formBuckets = new Map<string, { submissions: number; enrolled: number }>();
  for (const f of FORM_TYPES) {
    formBuckets.set(f, { submissions: 0, enrolled: 0 });
  }
  // Also track any unknown formTypes that show up so they're not lost.
  for (const row of formStatusGroups) {
    const formType = row.formType ?? 'unknown';
    if (!formBuckets.has(formType)) {
      formBuckets.set(formType, { submissions: 0, enrolled: 0 });
    }
    const bucket = formBuckets.get(formType)!;
    bucket.submissions += row._count._all;
    if ((row.status ?? '').toLowerCase() === 'enrolled') {
      bucket.enrolled += row._count._all;
    }
  }
  const byFormSource: AnalyticsResponse['byFormSource'] = Array.from(
    formBuckets.entries(),
  ).map(([formType, bucket]) => ({
    formType,
    submissions: bucket.submissions,
    enrolled: bucket.enrolled,
    conversionRate: pct(bucket.enrolled, bucket.submissions),
  }));

  /* ------------------------------ Top courses --------------------------- */
  const byCourse: AnalyticsResponse['byCourse'] = courseGroups
    .filter((row): row is typeof row & { course: string } => row.course !== null)
    .map((row) => ({ course: row.course, count: row._count._all }));

  /* ------------------------------ Inquiry types ------------------------- */
  let courseInquiry = 0;
  let general = 0;
  for (const lead of leadsForInquiry) {
    if (lead.course && lead.course.trim() !== '') courseInquiry += 1;
    else general += 1;
  }
  const byInquiryType: AnalyticsResponse['byInquiryType'] = [
    { type: 'Course Inquiry', count: courseInquiry },
    { type: 'General', count: general },
  ];

  /* ------------------------------ Daily series -------------------------- */
  const dailyMap = new Map<string, number>();
  // Seed every day in the window so the chart has 30 bars even on quiet days.
  for (let i = 0; i < 30; i++) {
    const d = new Date(thirtyDaysAgo);
    d.setDate(d.getDate() + i);
    dailyMap.set(isoDateKey(d), 0);
  }
  for (const lead of leadsForDaily) {
    const key = isoDateKey(lead.createdAt);
    if (dailyMap.has(key)) {
      dailyMap.set(key, (dailyMap.get(key) ?? 0) + 1);
    }
  }
  const dailyLeads: AnalyticsResponse['dailyLeads'] = Array.from(
    dailyMap.entries(),
  ).map(([date, count]) => ({ date, count }));

  /* ------------------------------ WhatsApp ------------------------------ */
  let waToday = 0;
  let waThisWeek = 0;
  let waThisMonth = 0;
  for (const a of whatsappActivities) {
    if (a.createdAt >= todayStart) waToday += 1;
    if (a.createdAt >= weekAgo) waThisWeek += 1;
    if (a.createdAt >= monthStart) waThisMonth += 1;
  }
  const waTotalLeads = leadsForWhatsapp.length;
  const waEnrolledLeads = leadsForWhatsapp.filter(
    (l) => l.status.toLowerCase() === 'enrolled',
  ).length;

  const whatsapp: AnalyticsResponse['whatsapp'] = {
    total: whatsappActivities.length,
    today: waToday,
    thisWeek: waThisWeek,
    thisMonth: waThisMonth,
    conversionRate: pct(waEnrolledLeads, waTotalLeads),
  };

  /* ------------------------------ Final payload ------------------------- */
  const payload: AnalyticsResponse = {
    totals: {
      leads: totalLeads,
      enrolled: enrolledCount,
      conversionRate,
      avgResponseHours,
      thisMonth: thisMonthCount,
      whatsappSent: whatsappActivities.length,
    },
    funnel,
    byCourse,
    byInquiryType,
    byBranch,
    byFormSource,
    whatsapp,
    dailyLeads,
  };

  return NextResponse.json(payload);
}
