import { NextResponse, type NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/admin-guard';
import { DAY_MS, istDateKey, istMonthKey, istWeekKey, startOfMonthIST } from '@/lib/ist-date';
import { NOT_SPAM } from '@/lib/lead-spam';

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

// Day, ISO-week and month buckets are IST calendar periods (lib/ist-date).

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
  const keyFor = granularity === 'day' ? istDateKey : granularity === 'week' ? istWeekKey : istMonthKey;

  const labels: string[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const d =
      granularity === 'day' ? new Date(now.getTime() - i * DAY_MS)
      : granularity === 'week' ? new Date(now.getTime() - i * 7 * DAY_MS)
      : startOfMonthIST(now, i);
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
  const guard = await requireAdmin(req);
  if (guard instanceof Response) return guard;

  const now = new Date();
  const monthStart = startOfMonthIST(now);
  // Oldest bucket is the IST month 11 months back (12 monthly buckets).
  const twelveMonthsAgo = startOfMonthIST(now, 11);

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
        where: { ...NOT_SPAM, formType: { in: ['hero', 'hero_demo', 'full', 'demo', 'contact'] }, createdAt: { gte: twelveMonthsAgo } },
        select: { createdAt: true },
      }),
      prisma.lead.findMany({
        where: { ...NOT_SPAM, formType: 'whatsapp_widget', createdAt: { gte: twelveMonthsAgo } },
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
