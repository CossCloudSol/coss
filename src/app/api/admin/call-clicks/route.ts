import { NextResponse, type NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/* -------------------------------------------------------------------------- */
/*  Response shape                                                           */
/* -------------------------------------------------------------------------- */

export interface CallClickRow {
  id: string;
  path: string;
  pageType: string;
  courseSlug: string | null;
  branchKey: string | null;
  phoneNumber: string;
  deviceType: string;
  createdAt: string; // ISO
}

export interface ChannelBucket {
  label: string; // e.g. "2026-08-12", "2026-W32", "2026-08"
  form: number;
  whatsapp: number;
  call: number;
}

export interface CallClicksAdminResponse {
  stats: {
    total: number;
    thisMonth: number;
    topPageType: string;
    topCourse: string;
    byPageType: Array<{ pageType: string; count: number }>;
    byPhoneNumber: Array<{ phoneNumber: string; count: number }>;
  };
  recent: CallClickRow[];
  // Three independent per-channel series, NEVER summed into one total —
  // a call click is an anonymous event, not a contactable lead, and a
  // combined "total leads" figure would overstate real pipeline volume.
  series: {
    day: ChannelBucket[];   // last 30 days
    week: ChannelBucket[];  // last 12 ISO weeks
    month: ChannelBucket[]; // last 12 months
  };
}

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function dayKey(d: Date): string {
  return d.toISOString().slice(0, 10); // YYYY-MM-DD
}

function monthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

/** ISO 8601 week key, e.g. "2026-W32". */
function weekKey(d: Date): string {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = (date.getUTCDay() + 6) % 7; // Mon=0..Sun=6
  date.setUTCDate(date.getUTCDate() - dayNum + 3); // nearest Thursday
  const firstThursday = new Date(Date.UTC(date.getUTCFullYear(), 0, 4));
  const week = 1 + Math.round(((date.getTime() - firstThursday.getTime()) / 86400000 - 3 + ((firstThursday.getUTCDay() + 6) % 7)) / 7);
  return `${date.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

/**
 * Builds an ordered array of the last `count` bucket keys (oldest first,
 * ending at "now"'s bucket) and tallies each channel's timestamps into them.
 * Timestamps outside the window are dropped rather than clamped into the
 * first bucket, so counts stay accurate.
 */
function bucketSeries(
  granularity: 'day' | 'week' | 'month',
  count: number,
  channels: { form: Date[]; whatsapp: Date[]; call: Date[] },
): ChannelBucket[] {
  const now = new Date();
  const keyFor = granularity === 'day' ? dayKey : granularity === 'week' ? weekKey : monthKey;

  const labels: string[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(now);
    if (granularity === 'day') d.setDate(d.getDate() - i);
    else if (granularity === 'week') d.setDate(d.getDate() - i * 7);
    else d.setMonth(d.getMonth() - i);
    labels.push(keyFor(d));
  }

  const buckets = new Map<string, ChannelBucket>(
    labels.map((label) => [label, { label, form: 0, whatsapp: 0, call: 0 }]),
  );

  const tally = (dates: Date[], field: 'form' | 'whatsapp' | 'call') => {
    for (const d of dates) {
      const bucket = buckets.get(keyFor(d));
      if (bucket) bucket[field] += 1;
    }
  };
  tally(channels.form, 'form');
  tally(channels.whatsapp, 'whatsapp');
  tally(channels.call, 'call');

  return labels.map((label) => buckets.get(label)!);
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
  const twelveMonthsAgo = new Date(now);
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

  try {
    const [
      total,
      thisMonth,
      pageTypeGroups,
      phoneGroups,
      courseGroups,
      recentRaw,
      formLeadDates,
      whatsappLeadDates,
      callClickDates,
    ] = await Promise.all([
      prisma.callClick.count(),
      prisma.callClick.count({ where: { createdAt: { gte: monthStart } } }),
      prisma.callClick.groupBy({
        by: ['pageType'],
        _count: { _all: true },
        orderBy: { _count: { pageType: 'desc' } },
      }),
      prisma.callClick.groupBy({
        by: ['phoneNumber'],
        _count: { _all: true },
        orderBy: { _count: { phoneNumber: 'desc' } },
      }),
      prisma.callClick.groupBy({
        by: ['courseSlug'],
        where: { courseSlug: { not: null } },
        _count: { _all: true },
        orderBy: { _count: { courseSlug: 'desc' } },
        take: 1,
      }),
      prisma.callClick.findMany({
        orderBy: { createdAt: 'desc' },
        take: 30,
        select: {
          id: true,
          path: true,
          pageType: true,
          courseSlug: true,
          branchKey: true,
          phoneNumber: true,
          deviceType: true,
          createdAt: true,
        },
      }),
      prisma.lead.findMany({
        where: { formType: { in: ['hero', 'full', 'demo'] }, createdAt: { gte: twelveMonthsAgo } },
        select: { createdAt: true },
      }),
      prisma.lead.findMany({
        where: { formType: 'whatsapp_widget', createdAt: { gte: twelveMonthsAgo } },
        select: { createdAt: true },
      }),
      prisma.callClick.findMany({
        where: { createdAt: { gte: twelveMonthsAgo } },
        select: { createdAt: true },
      }),
    ]);

    const topPageType = pageTypeGroups.length > 0 ? pageTypeGroups[0].pageType : '—';
    const topCourse = courseGroups.length > 0 && courseGroups[0].courseSlug ? courseGroups[0].courseSlug : '—';

    const channels = {
      form: formLeadDates.map((r) => r.createdAt),
      whatsapp: whatsappLeadDates.map((r) => r.createdAt),
      call: callClickDates.map((r) => r.createdAt),
    };

    const payload: CallClicksAdminResponse = {
      stats: {
        total,
        thisMonth,
        topPageType,
        topCourse,
        byPageType: pageTypeGroups.map((g) => ({ pageType: g.pageType, count: g._count._all })),
        byPhoneNumber: phoneGroups.map((g) => ({ phoneNumber: g.phoneNumber, count: g._count._all })),
      },
      recent: recentRaw.map((r) => ({
        id: r.id,
        path: r.path,
        pageType: r.pageType,
        courseSlug: r.courseSlug,
        branchKey: r.branchKey,
        phoneNumber: r.phoneNumber,
        deviceType: r.deviceType,
        createdAt: r.createdAt.toISOString(),
      })),
      series: {
        day: bucketSeries('day', 30, channels),
        week: bucketSeries('week', 12, channels),
        month: bucketSeries('month', 12, channels),
      },
    };

    return NextResponse.json(payload);
  } catch (err) {
    console.error('[GET /api/admin/call-clicks] DB error:', err);
    return NextResponse.json({ error: 'Failed to load call click stats' }, { status: 500 });
  }
}
