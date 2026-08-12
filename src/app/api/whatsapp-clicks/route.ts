import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';

// Prisma needs the Node runtime — and we never want this cached.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/* -------------------------------------------------------------------------- */
/*  Validation                                                                */
/* -------------------------------------------------------------------------- */

const PAGE_TYPE_VALUES = ['course', 'category', 'locality', 'blog', 'static'] as const;
const CTA_TYPE_VALUES = [
  'footer', 'hero', 'contact_page', 'free_demo', 'batches_page',
  'batch', 'job', 'locality', 'widget', 'sticky',
] as const;
const DEVICE_TYPE_VALUES = ['mobile', 'desktop'] as const;

// Canonical shape only — +91 followed by a 10-digit Indian mobile starting
// 6-9. <WhatsAppLink> is responsible for normalizing to this before it ever
// calls this endpoint; the server does not attempt to reformat, only accept
// or reject.
const PHONE_REGEX = /^\+91[6-9]\d{9}$/;

// Pathname only (no query string — UTM params travel in their own fields).
const PATH_REGEX = /^\/[a-zA-Z0-9\-_/]*$/;

const whatsAppClickSchema = z.object({
  path: z.string().trim().min(1).max(300).regex(PATH_REGEX, 'path must be a relative pathname'),
  pageType: z.enum(PAGE_TYPE_VALUES),
  ctaType: z.enum(CTA_TYPE_VALUES),
  courseSlug: z
    .preprocess(
      (v) => (typeof v === 'string' && v.trim() === '' ? undefined : v),
      z.string().trim().max(255).optional(),
    ),
  branchKey: z
    .preprocess(
      (v) => (typeof v === 'string' && v.trim() === '' ? undefined : v),
      z.string().trim().max(100).optional(),
    ),
  phoneNumber: z.string().trim().regex(PHONE_REGEX, 'phoneNumber must be canonical +91XXXXXXXXXX'),
  hadPrefill: z.boolean(),
  deviceType: z.enum(DEVICE_TYPE_VALUES),
  referrer: z
    .preprocess(
      (v) => (typeof v === 'string' && v.trim() === '' ? undefined : v),
      z.string().trim().max(500).optional(),
    ),
  utmSource: z
    .preprocess(
      (v) => (typeof v === 'string' && v.trim() === '' ? undefined : v),
      z.string().trim().max(100).optional(),
    ),
  utmMedium: z
    .preprocess(
      (v) => (typeof v === 'string' && v.trim() === '' ? undefined : v),
      z.string().trim().max(100).optional(),
    ),
  utmCampaign: z
    .preprocess(
      (v) => (typeof v === 'string' && v.trim() === '' ? undefined : v),
      z.string().trim().max(100).optional(),
    ),
});

/* -------------------------------------------------------------------------- */
/*  Phone allowlist                                                           */
/*                                                                            */
/*  phoneNumber is NOT free text — it must be one of the site's own known     */
/*  WhatsApp numbers. WA_NUMBER is the central number every <WhatsAppLink>    */
/*  targets by default; branch numbers come live from BranchSettings so an   */
/*  admin changing a centre's number doesn't need a code deploy to keep      */
/*  click-tracking working (LandingPageTemplate opens WhatsApp to the        */
/*  branch's own number, not the central one — see WA_NUMBER usage there).  */
/*  Cached briefly — BranchSettings changes rarely, and this endpoint may    */
/*  see far more traffic than the admin table.                               */
/* -------------------------------------------------------------------------- */

const WA_NUMBER = '+918885166007';

const ALLOWLIST_TTL_MS = 60_000;
let allowlistCache: { numbers: Set<string>; expiresAt: number } | null = null;

function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  const tenDigit = digits.length === 12 && digits.startsWith('91') ? digits.slice(2) : digits;
  return `+91${tenDigit}`;
}

async function getPhoneAllowlist(): Promise<Set<string>> {
  const now = Date.now();
  if (allowlistCache && allowlistCache.expiresAt > now) {
    return allowlistCache.numbers;
  }

  const branches = await prisma.branchSettings.findMany({ select: { phone: true } });
  const numbers = new Set<string>([WA_NUMBER]);
  for (const b of branches) {
    if (b.phone) numbers.add(normalizePhone(b.phone));
  }

  allowlistCache = { numbers, expiresAt: now + ALLOWLIST_TTL_MS };
  return numbers;
}

/* -------------------------------------------------------------------------- */
/*  Rate limit (in-memory, single-process)                                    */
/*                                                                            */
/*  NOTE: on Vercel serverless, each function instance holds its own copy of */
/*  this Map — there is no shared state across concurrent/cold instances, so */
/*  this is a per-instance soft deterrent, NOT a per-IP guarantee. A         */
/*  determined caller distributed across instances (or simply hitting a      */
/*  fresh cold start) will not be reliably capped by this alone. The real    */
/*  defense against fabricated rows is the closed-enum + allowlisted-phone   */
/*  validation above: even an unlimited flood can only ever write rows that  */
/*  reference a real page type and a real site phone number. Do not treat    */
/*  this limiter as authoritative; it exists only to blunt naive abuse.      */
/* -------------------------------------------------------------------------- */

const RATE_LIMIT_MAX = 20;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000; // 10 minutes

const submissionTimestamps: Map<string, number[]> = new Map();

function clientIp(req: NextRequest): string {
  const fwd = req.headers.get('x-forwarded-for');
  if (fwd === null) return 'unknown';
  const first = fwd.split(',')[0]?.trim();
  return first && first.length > 0 ? first : 'unknown';
}

function allowSubmission(ip: string): boolean {
  const now = Date.now();
  const cutoff = now - RATE_LIMIT_WINDOW_MS;
  const previous = submissionTimestamps.get(ip) ?? [];
  const recent = previous.filter((t) => t > cutoff);

  if (recent.length >= RATE_LIMIT_MAX) {
    submissionTimestamps.set(ip, recent);
    return false;
  }

  recent.push(now);
  submissionTimestamps.set(ip, recent);

  if (submissionTimestamps.size > 10_000) {
    for (const [storedIp, timestamps] of submissionTimestamps) {
      if (timestamps.every((t) => t <= cutoff)) submissionTimestamps.delete(storedIp);
    }
  }

  return true;
}

/* -------------------------------------------------------------------------- */
/*  Handler                                                                   */
/*                                                                            */
/*  Called via navigator.sendBeacon from <WhatsAppLink> — the CLIENT is      */
/*  fire-and-forget (it never waits on this response, since the wa.me        */
/*  navigation must never be delayed). The SERVER is not: this handler       */
/*  awaits the insert before returning, because a serverless function that   */
/*  returns before its background work finishes gets its execution           */
/*  frozen/killed — an un-awaited write here would be dropped silently on    */
/*  Vercel.                                                                   */
/* -------------------------------------------------------------------------- */

export async function POST(req: NextRequest): Promise<Response> {
  const ip = clientIp(req);
  if (!allowSubmission(ip)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  let body: unknown;
  try {
    // sendBeacon's Blob arrives as a JSON-typed body just like fetch.
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 422 });
  }

  const parsed = whatsAppClickSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid payload', errors: parsed.error.flatten().fieldErrors },
      { status: 422 },
    );
  }

  const data = parsed.data;

  const allowlist = await getPhoneAllowlist();
  if (!allowlist.has(data.phoneNumber)) {
    return NextResponse.json({ error: 'Unrecognized phoneNumber' }, { status: 422 });
  }

  try {
    await prisma.whatsAppClick.create({
      data: {
        path: data.path,
        pageType: data.pageType,
        ctaType: data.ctaType,
        courseSlug: data.courseSlug ?? null,
        branchKey: data.branchKey ?? null,
        phoneNumber: data.phoneNumber,
        hadPrefill: data.hadPrefill,
        deviceType: data.deviceType,
        referrer: data.referrer ?? null,
        utmSource: data.utmSource ?? null,
        utmMedium: data.utmMedium ?? null,
        utmCampaign: data.utmCampaign ?? null,
      },
    });
  } catch (err) {
    console.error('[POST /api/whatsapp-clicks] Failed to create WhatsAppClick:', err);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
