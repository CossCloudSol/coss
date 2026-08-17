import { NextResponse, type NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/* -------------------------------------------------------------------------- */
/*  Response shape                                                            */
/* -------------------------------------------------------------------------- */

export interface WidgetLead {
  id: string;
  name: string;
  phone: string;
  course: string | null;
  branch: string;
  status: string;
  createdAt: string; // ISO
}

export interface WhatsAppActivityItem {
  id: string;
  leadId: string;
  leadName: string;
  note: string;
  createdAt: string; // ISO
}

export interface WhatsAppAdminResponse {
  widgetStats: {
    total: number;
    enrolled: number;
    thisMonth: number;
    topCourse: string;
    conversionRate: number;
    recentLeads: WidgetLead[];
  };
  recentActivities: WhatsAppActivityItem[];
}

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function pct(num: number, denom: number): number {
  return denom === 0 ? 0 : Math.round((num / denom) * 1000) / 10;
}

const WIDGET_FORM_TYPE = 'whatsapp_widget';

/* -------------------------------------------------------------------------- */
/*  Handler                                                                   */
/* -------------------------------------------------------------------------- */

export async function GET(req: NextRequest): Promise<Response> {
  const probe = NextResponse.next();
  const session = await getSession(req, probe);
  if (!session.isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const monthStart = startOfMonth(new Date());

  try {
    const [
      totalWidget,
      thisMonthWidget,
      courseGroups,
      statusGroups,
      recentLeads,
      recentActivitiesRaw,
    ] = await Promise.all([
      prisma.lead.count({ where: { formType: WIDGET_FORM_TYPE } }),
      prisma.lead.count({
        where: { formType: WIDGET_FORM_TYPE, createdAt: { gte: monthStart } },
      }),
      // Top course among widget leads (excluding null/empty).
      prisma.lead.groupBy({
        by: ['course'],
        where: {
          formType: WIDGET_FORM_TYPE,
          course: { not: null },
        },
        _count: { _all: true },
        orderBy: { _count: { course: 'desc' } },
        take: 1,
      }),
      // Status breakdown for widget leads → conversion rate.
      prisma.lead.groupBy({
        by: ['status'],
        where: { formType: WIDGET_FORM_TYPE },
        _count: { _all: true },
      }),
      // Last 20 widget leads for the inline table.
      prisma.lead.findMany({
        where: { formType: WIDGET_FORM_TYPE },
        orderBy: { createdAt: 'desc' },
        take: 20,
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
      // Recent whatsapp_sent activities, joined with the lead's name for display.
      prisma.leadActivity.findMany({
        where: { action: 'whatsapp_sent' },
        orderBy: { createdAt: 'desc' },
        take: 30,
        select: {
          id: true,
          leadId: true,
          note: true,
          createdAt: true,
          lead: { select: { name: true } },
        },
      }),
    ]);

    /* ----------------------------- Top course ------------------------------ */
    const topCourse =
      courseGroups.length > 0 && courseGroups[0].course
        ? courseGroups[0].course
        : '—';

    /* ----------------------------- Conversion ------------------------------ */
    let widgetEnrolled = 0;
    for (const row of statusGroups) {
      if ((row.status ?? '').toLowerCase() === 'enrolled') {
        widgetEnrolled = row._count._all;
      }
    }
    const conversionRate = pct(widgetEnrolled, totalWidget);

    /* ----------------------------- Payload --------------------------------- */
    const payload: WhatsAppAdminResponse = {
      widgetStats: {
        total: totalWidget,
        enrolled: widgetEnrolled,
        thisMonth: thisMonthWidget,
        topCourse,
        conversionRate,
        recentLeads: recentLeads.map((l) => ({
          id: l.id,
          name: l.name,
          phone: l.phone,
          course: l.course,
          branch: l.branch,
          status: l.status,
          createdAt: l.createdAt.toISOString(),
        })),
      },
      recentActivities: recentActivitiesRaw.map((a) => ({
        id: a.id,
        leadId: a.leadId,
        leadName: a.lead.name,
        note: a.note,
        createdAt: a.createdAt.toISOString(),
      })),
    };

    return NextResponse.json(payload);
  } catch (err) {
    console.error('[GET /api/admin/whatsapp] DB error:', err);
    return NextResponse.json({ error: 'Failed to load WhatsApp stats' }, { status: 500 });
  }
}
