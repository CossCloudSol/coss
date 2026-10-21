import { NextResponse, type NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/admin-guard';
import { DAY_MS, istDateKey } from '@/lib/ist-date';
import { parseTrackingRange } from '@/lib/tracking-range';
import { NOT_SPAM } from '@/lib/lead-spam';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/* -------------------------------------------------------------------------- */
/*  /admin/tracking: every lead and intent click for an IST date range.       */
/*  Leads exclude spam. Clicks are anonymous events (CtaClick, CallClick,     */
/*  WhatsAppClick), never added to the lead totals.                           */
/* -------------------------------------------------------------------------- */

export type TrackingSeries = 'leads' | 'corporate' | 'calls' | 'whatsapp' | 'demo' | 'syllabus';

export interface TrackingDay extends Record<TrackingSeries, number> {
  date: string; // YYYY-MM-DD (IST)
}

export interface TrackingResponse {
  range: { from: string; to: string; days: number };
  totals: Record<TrackingSeries, number>;
  daily: TrackingDay[];
  /** Clicks per button: ctaId + location, all kinds (CtaClick, CallClick, WhatsAppClick). */
  topButtons: Array<{ ctaId: string; location: string; kind: string; count: number }>;
  topPages: Array<{ path: string; clicks: number; leads: number }>;
  topCourses: Array<{ courseSlug: string; clicks: number }>;
  /** utm_source, else the referrer's host, else "direct". */
  trafficSources: Array<{ source: string; clicks: number; leads: number }>;
  demoFunnel: { demoClicks: number; demoLeads: number; rate: number };
  /** Leads (and corporate leads) by the button clicked before the form. */
  leadsBySource: Array<{ sourceCta: string; sourceLocation: string; leads: number }>;
}

const TOP_N = 15;

function sourceOf(utmSource: string | null, referrer: string | null): string {
  if (utmSource) return utmSource.toLowerCase();
  if (referrer) {
    try {
      const host = new URL(referrer).hostname.replace(/^www\./, '');
      if (!/cosscloudsol\.com$|vercel\.app$|localhost/.test(host)) return host;
    } catch {
      /* not a URL */
    }
  }
  return 'direct';
}

function tally<K>(map: Map<K, number>, key: K, by = 1): void {
  map.set(key, (map.get(key) ?? 0) + by);
}

function top<T>(entries: T[], value: (t: T) => number, n = TOP_N): T[] {
  return entries.sort((a, b) => value(b) - value(a)).slice(0, n);
}

const isDemoLead = (l: { submitPath: string | null; sourceCta: string | null; formType: string }) =>
  l.formType === 'demo' ||
  (l.submitPath ?? '').startsWith('/free-demo-class') ||
  l.sourceCta === 'book_demo';

export async function GET(req: NextRequest): Promise<Response> {
  const guard = await requireAdmin(req);
  if (guard instanceof Response) return guard;

  const { searchParams } = new URL(req.url);
  const range = parseTrackingRange(searchParams.get('from'), searchParams.get('to'));
  if (!range) return NextResponse.json({ error: 'Invalid date range (YYYY-MM-DD, up to 366 days)' }, { status: 400 });
  const createdAt = { gte: range.start, lt: range.end };

  try {
    const [leads, corporate, ctaClicks, calls, whatsapps] = await Promise.all([
      prisma.lead.findMany({
        where: { ...NOT_SPAM, createdAt },
        select: { createdAt: true, formType: true, submitPath: true, sourceCta: true, sourceLocation: true, utmSource: true, lastUtmSource: true, referrer: true },
      }),
      prisma.corporateLead.findMany({
        where: { ...NOT_SPAM, createdAt },
        select: { createdAt: true, sourceCta: true, sourceLocation: true, utmSource: true, referrer: true },
      }),
      prisma.ctaClick.findMany({
        where: { createdAt },
        select: { createdAt: true, kind: true, ctaId: true, location: true, path: true, courseSlug: true, utmSource: true, referrer: true },
      }),
      prisma.callClick.findMany({
        where: { createdAt },
        select: { createdAt: true, ctaId: true, location: true, path: true, courseSlug: true, utmSource: true, referrer: true },
      }),
      prisma.whatsAppClick.findMany({
        where: { createdAt },
        select: { createdAt: true, ctaId: true, ctaType: true, location: true, path: true, courseSlug: true, utmSource: true, referrer: true },
      }),
    ]);

    // Daily series, one bucket per IST day in the range.
    const daily = new Map<string, TrackingDay>();
    for (let i = 0; i < range.days; i++) {
      const date = istDateKey(new Date(range.start.getTime() + i * DAY_MS));
      daily.set(date, { date, leads: 0, corporate: 0, calls: 0, whatsapp: 0, demo: 0, syllabus: 0 });
    }
    const bump = (d: Date, series: TrackingSeries) => {
      const day = daily.get(istDateKey(d));
      if (day) day[series] += 1;
    };
    for (const l of leads) bump(l.createdAt, 'leads');
    for (const c of corporate) bump(c.createdAt, 'corporate');
    for (const c of calls) bump(c.createdAt, 'calls');
    for (const w of whatsapps) bump(w.createdAt, 'whatsapp');
    for (const c of ctaClicks) {
      if (c.kind === 'demo') bump(c.createdAt, 'demo');
      else if (c.kind === 'syllabus' || c.kind === 'brochure_download') bump(c.createdAt, 'syllabus');
    }
    const days = Array.from(daily.values());
    const totals = days.reduce(
      (t, d) => ({
        leads: t.leads + d.leads,
        corporate: t.corporate + d.corporate,
        calls: t.calls + d.calls,
        whatsapp: t.whatsapp + d.whatsapp,
        demo: t.demo + d.demo,
        syllabus: t.syllabus + d.syllabus,
      }),
      { leads: 0, corporate: 0, calls: 0, whatsapp: 0, demo: 0, syllabus: 0 },
    );

    // Buttons, pages, courses, sources across the three click tables.
    const clicks = [
      ...ctaClicks.map((c) => ({ ...c, kind: c.kind })),
      ...calls.map((c) => ({ ...c, kind: 'call', ctaId: c.ctaId ?? 'call', location: c.location ?? 'unknown' })),
      ...whatsapps.map((w) => ({ ...w, kind: 'whatsapp', ctaId: w.ctaId ?? w.ctaType, location: w.location ?? 'unknown' })),
    ];
    const buttons = new Map<string, { ctaId: string; location: string; kind: string; count: number }>();
    const pageClicks = new Map<string, number>();
    const courseClicks = new Map<string, number>();
    const sourceClicks = new Map<string, number>();
    for (const c of clicks) {
      const key = `${c.kind}|${c.ctaId}|${c.location}`;
      const b = buttons.get(key) ?? { ctaId: c.ctaId, location: c.location, kind: c.kind, count: 0 };
      b.count += 1;
      buttons.set(key, b);
      tally(pageClicks, c.path);
      if (c.courseSlug) tally(courseClicks, c.courseSlug);
      tally(sourceClicks, sourceOf(c.utmSource, c.referrer));
    }

    const pageLeads = new Map<string, number>();
    const sourceLeads = new Map<string, number>();
    const bySource = new Map<string, { sourceCta: string; sourceLocation: string; leads: number }>();
    const countSource = (cta: string | null, loc: string | null) => {
      const sourceCta = cta ?? '(none)';
      const sourceLocation = loc ?? '(none)';
      const key = `${sourceCta}|${sourceLocation}`;
      const row = bySource.get(key) ?? { sourceCta, sourceLocation, leads: 0 };
      row.leads += 1;
      bySource.set(key, row);
    };
    for (const l of leads) {
      if (l.submitPath) tally(pageLeads, l.submitPath);
      tally(sourceLeads, sourceOf(l.lastUtmSource ?? l.utmSource, l.referrer));
      countSource(l.sourceCta, l.sourceLocation);
    }
    for (const c of corporate) {
      tally(sourceLeads, sourceOf(c.utmSource, c.referrer));
      countSource(c.sourceCta, c.sourceLocation);
    }

    const pages = new Set([...pageClicks.keys(), ...pageLeads.keys()]);
    const sources = new Set([...sourceClicks.keys(), ...sourceLeads.keys()]);
    const demoLeads = leads.filter(isDemoLead).length;

    const payload: TrackingResponse = {
      range: { from: range.from, to: range.to, days: range.days },
      totals,
      daily: days,
      topButtons: top(Array.from(buttons.values()), (b) => b.count),
      topPages: top(Array.from(pages, (path) => ({ path, clicks: pageClicks.get(path) ?? 0, leads: pageLeads.get(path) ?? 0 })), (p) => p.clicks + p.leads),
      topCourses: top(Array.from(courseClicks, ([courseSlug, n]) => ({ courseSlug, clicks: n })), (c) => c.clicks),
      trafficSources: top(Array.from(sources, (source) => ({ source, clicks: sourceClicks.get(source) ?? 0, leads: sourceLeads.get(source) ?? 0 })), (s) => s.clicks + s.leads),
      demoFunnel: {
        demoClicks: totals.demo,
        demoLeads,
        rate: totals.demo === 0 ? 0 : Math.round((demoLeads / totals.demo) * 1000) / 10,
      },
      leadsBySource: top(Array.from(bySource.values()), (r) => r.leads, 25),
    };
    return NextResponse.json(payload);
  } catch (err) {
    console.error('[GET /api/admin/tracking] DB error:', err);
    return NextResponse.json({ error: 'Failed to load tracking report' }, { status: 500 });
  }
}
