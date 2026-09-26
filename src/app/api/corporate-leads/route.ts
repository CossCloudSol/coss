import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { createNotification } from '@/lib/notifications';
import { MIN_FILL_MS, botCheck, nameField, normalizeIndianMobile, phoneField } from '@/lib/lead-validation';

// Prisma needs the Node runtime — and we never want this cached.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/* -------------------------------------------------------------------------- */
/*  Validation                                                                */
/* -------------------------------------------------------------------------- */

const corporateLeadSchema = z.object({
  companyName: z
    .string()
    .trim()
    .min(2, 'Company name must be at least 2 characters')
    .max(100, 'Company name must be 100 characters or fewer'),
  contactPerson: nameField,
  // Shared rule (lib/lead-validation): 10 digits starting 6-9 with an
  // optional +91 or 0 prefix, stored as +91XXXXXXXXXX.
  phone: phoneField.transform((raw) => normalizeIndianMobile(raw) as string),
  email: z
    .string()
    .trim()
    .min(1, 'Email is required')
    .email('Enter a valid email'),
  trainingDomain: z
    .string()
    .trim()
    .min(1, 'Training domain is required')
    .max(200, 'Training domain must be 200 characters or fewer'),
  employeeCount: z
    .string()
    .trim()
    .min(1, 'Employee count is required')
    .max(50, 'Employee count must be 50 characters or fewer'),
  // Optional "Additional requirements" box. "" (empty textarea) is stored as NULL.
  requirements: z.preprocess(
    (v) => (typeof v === 'string' && v.trim() === '' ? undefined : v),
    z.string().trim().max(1000, 'Requirements must be 1000 characters or fewer').optional(),
  ),
});

/* -------------------------------------------------------------------------- */
/*  Rate limit (in-memory, single-process) — same policy as /api/leads         */
/* -------------------------------------------------------------------------- */

const RATE_LIMIT_MAX = 3;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000; // 10 minutes

// Module-level — survives between requests within the same Node process. On a
// multi-instance / serverless deploy this is best-effort only.
const submissionTimestamps: Map<string, number[]> = new Map();

function clientIp(req: NextRequest): string {
  const fwd = req.headers.get('x-forwarded-for');
  if (fwd === null) return 'unknown';
  // Leftmost entry of the chain is the original client.
  const first = fwd.split(',')[0]?.trim();
  return first && first.length > 0 ? first : 'unknown';
}

/** True when the call may proceed; records it. False once the IP hits its limit. */
function allowSubmission(ip: string): boolean {
  const now = Date.now();
  const cutoff = now - RATE_LIMIT_WINDOW_MS;
  const recent = (submissionTimestamps.get(ip) ?? []).filter((t) => t > cutoff);

  if (recent.length >= RATE_LIMIT_MAX) {
    submissionTimestamps.set(ip, recent);
    return false;
  }

  recent.push(now);
  submissionTimestamps.set(ip, recent);

  // Prune IPs whose whole window has expired so the map can't grow unbounded.
  if (submissionTimestamps.size > 10_000) {
    for (const [storedIp, timestamps] of submissionTimestamps) {
      if (timestamps.every((t) => t <= cutoff)) submissionTimestamps.delete(storedIp);
    }
  }

  return true;
}

/* -------------------------------------------------------------------------- */
/*  Handler                                                                   */
/* -------------------------------------------------------------------------- */

export async function POST(req: NextRequest): Promise<Response> {
  // Rate limit first — cheap, no DB or JSON parsing wasted on abusive callers.
  if (!allowSubmission(clientIp(req))) {
    return NextResponse.json(
      // `message`, not `error`: CorporateForm shows `message` to the visitor.
      { success: false, message: 'Too many submissions. Try again later.' },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch (err) {
    console.error('[POST /api/corporate-leads] Invalid JSON body:', err);
    return NextResponse.json(
      {
        success: false,
        errors: { _root: ['Request body is not valid JSON'] },
      },
      { status: 422 },
    );
  }

  // Bot: same response as a saved lead, but nothing saved or sent.
  const bot = botCheck(body, MIN_FILL_MS);
  if (bot.verdict === 'bot') {
    console.info(`[POST /api/corporate-leads] Dropped bot submission (${bot.reason})`);
    return NextResponse.json({ success: true }, { status: 201 });
  }

  const parsed = corporateLeadSchema.safeParse(body);
  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;
    console.error('[POST /api/corporate-leads] Validation failed:', fieldErrors);
    return NextResponse.json(
      { success: false, errors: fieldErrors },
      { status: 422 },
    );
  }

  const data = parsed.data;

  try {
    const created = await prisma.corporateLead.create({
      data: {
        companyName: data.companyName,
        contactPerson: data.contactPerson,
        phone: data.phone, // already +91-prefixed by the schema transform
        email: data.email,
        trainingDomain: data.trainingDomain,
        employeeCount: data.employeeCount,
        requirements: data.requirements ?? null,
        status: 'new',
      },
      select: { id: true },
    });

    if (bot.verdict === 'human_missing_fill_time') {
      console.info(`[POST /api/corporate-leads] Accepted corporate lead ${created.id} with no fill time (grace period)`);
    }

    try {
      await createNotification({
        type: 'corporate_proposal',
        title: 'New corporate proposal',
        body: `${data.companyName} requested ${data.trainingDomain} training`,
        link: '/admin/corporate',
      });
    } catch (notifErr) {
      console.error('[POST /api/corporate-leads] Notification creation failed (non-fatal):', notifErr);
    }

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (err) {
    // Always log on the server so the real cause is in the terminal even
    // when the client only sees a generic message in production.
    console.error('[POST /api/corporate-leads] Insert failed:', err);

    const isDev = process.env.NODE_ENV !== 'production';
    const message =
      isDev && err instanceof Error ? err.message : 'Something went wrong';

    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
