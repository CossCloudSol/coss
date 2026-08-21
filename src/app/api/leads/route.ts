import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { createNotification } from '@/lib/notifications';

// Prisma needs the Node runtime — and we never want this cached.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/* -------------------------------------------------------------------------- */
/*  Validation                                                                */
/* -------------------------------------------------------------------------- */

const PHONE_REGEX = /^(\+91)?[6-9]\d{9}$/;

const BRANCH_VALUES = ['Dilsukhnagar', 'Ameerpet', 'Online'] as const;
const FORM_TYPE_VALUES = ['hero', 'full', 'demo', 'whatsapp_widget'] as const;

/**
 * Public lead-capture body. Permissive about email shape (`""` is treated as
 * absent so empty form fields don't 422), but strict about phone format —
 * we require an Indian mobile, with or without the `+91` prefix.
 */
const leadInputSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(255, 'Name must be 255 characters or fewer'),

  phone: z
    .string()
    .trim()
    .regex(
      PHONE_REGEX,
      'Phone must be a 10-digit Indian mobile, optionally prefixed with +91',
    )
    .transform((raw) => {
      // After the regex check, the value is either 10 digits or `+91` + 10
      // digits. Strip non-digits then re-prefix so we always store the same
      // canonical shape.
      const digits = raw.replace(/\D/g, '');
      const tenDigit = digits.length === 12 ? digits.slice(2) : digits;
      return `+91${tenDigit}`;
    }),

  // Treat `""` (the value an empty <input type="email"> sends) as absent so we
  // don't bounce a perfectly valid submission back as invalid email.
  email: z
    .preprocess(
      (v) => (typeof v === 'string' && v.trim() === '' ? undefined : v),
      z.string().trim().email('Email is not valid').optional(),
    ),

  course: z
    .preprocess(
      (v) => (typeof v === 'string' && v.trim() === '' ? undefined : v),
      z.string().trim().max(255, 'Course must be 255 characters or fewer').optional(),
    ),

  inquiryType: z
    .preprocess(
      (v) => (typeof v === 'string' && v.trim() === '' ? undefined : v),
      z.string().trim().max(100, 'Inquiry type must be 100 characters or fewer').optional(),
    ),

  branch: z.enum(BRANCH_VALUES, { error: 'Branch must be Dilsukhnagar, Ameerpet, or Online' }),

  message: z
    .preprocess(
      (v) => (typeof v === 'string' && v.trim() === '' ? undefined : v),
      z
        .string()
        .max(500, 'Message must be 500 characters or fewer')
        .optional(),
    ),

  formType: z.enum(FORM_TYPE_VALUES).default('full'),

  // Attribution — populated client-side once first-touch capture ships.
  // Every field optional so existing callers that send none of them are
  // unaffected. URL-shaped fields (referrer, landingPage) get a generous
  // cap since they're attacker-controllable and otherwise unbounded; the
  // rest match this file's existing 255-char convention for short strings.
  utmSource: z.string().trim().max(255, 'UTM source must be 255 characters or fewer').optional(),
  utmMedium: z.string().trim().max(255, 'UTM medium must be 255 characters or fewer').optional(),
  utmCampaign: z.string().trim().max(255, 'UTM campaign must be 255 characters or fewer').optional(),
  referrer: z.string().trim().max(2048, 'Referrer must be 2048 characters or fewer').optional(),
  landingPage: z.string().trim().max(2048, 'Landing page must be 2048 characters or fewer').optional(),
  submitPath: z.string().trim().max(255, 'Submit path must be 255 characters or fewer').optional(),
  // Constrained to what detectDeviceType() (src/lib/click-tracking.ts) can
  // emit — matches WhatsAppClick/CallClick's deviceType. No free text.
  deviceType: z.enum(['mobile', 'desktop'], { error: 'Device type must be mobile or desktop' }).optional(),
});

type LeadInput = z.infer<typeof leadInputSchema>;

/* -------------------------------------------------------------------------- */
/*  Rate limit (in-memory, single-process)                                    */
/* -------------------------------------------------------------------------- */

const RATE_LIMIT_MAX = 3;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000; // 10 minutes

// Module-level — survives between requests within the same Node process. On a
// multi-instance / serverless deploy this is best-effort only; swap for Redis
// (or @upstash/ratelimit) when the site scales beyond one process.
const submissionTimestamps: Map<string, number[]> = new Map();

function clientIp(req: NextRequest): string {
  const fwd = req.headers.get('x-forwarded-for');
  if (fwd === null) return 'unknown';
  // `x-forwarded-for` can be a comma-separated chain — the leftmost entry is
  // the original client (subsequent entries are proxies in the path).
  const first = fwd.split(',')[0]?.trim();
  return first && first.length > 0 ? first : 'unknown';
}

/**
 * Returns true when the call should proceed; false when the IP has hit its
 * limit. Side-effect: appends the current timestamp on success and prunes
 * timestamps older than the window on every call.
 */
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

  // Prune IPs whose entire window has expired to prevent unbounded map growth.
  // One-time submitters would otherwise accumulate indefinitely.
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
  const ip = clientIp(req);
  if (!allowSubmission(ip)) {
    return NextResponse.json(
      { success: false, error: 'Too many submissions. Try again later.' },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      {
        success: false,
        errors: { _root: ['Request body is not valid JSON'] },
      },
      { status: 422 },
    );
  }

  const parsed = leadInputSchema.safeParse(body);
  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;
    return NextResponse.json(
      { success: false, errors: fieldErrors },
      { status: 422 },
    );
  }

  const data: LeadInput = parsed.data;

  try {
    // Single transaction so the lead and its first activity row land together
    // — if the activity insert fails for any reason the lead is rolled back.
    const created = await prisma.$transaction(async (tx) => {
      const lead = await tx.lead.create({
        data: {
          name: data.name,
          phone: data.phone,
          email: data.email ?? null,
          course: data.course ?? null,
          // Admin list/stats compare against lowercase branch keys
          // (`dilsukhnagar` etc.) — normalize at write so a single value space
          // exists in the DB regardless of which form sent the lead.
          branch: data.branch.toLowerCase(),
          formType: data.formType,
          status: 'new',
          message: data.message ?? null,
          utmSource: data.utmSource ?? null,
          utmMedium: data.utmMedium ?? null,
          utmCampaign: data.utmCampaign ?? null,
          referrer: data.referrer ?? null,
          landingPage: data.landingPage ?? null,
          submitPath: data.submitPath ?? null,
          deviceType: data.deviceType ?? null,
        },
        select: { id: true },
      });

      await tx.leadActivity.create({
        data: {
          leadId: lead.id,
          action: 'form_submitted',
          note: `Lead submitted via ${data.formType} form`,
        },
      });

      return lead;
    });

    try {
      const isWhatsApp = data.formType === 'whatsapp_widget';
      await createNotification({
        type: isWhatsApp ? 'whatsapp_lead' : 'new_lead',
        title: isWhatsApp
          ? `WhatsApp lead — ${data.name}`
          : `New lead — ${data.name}`,
        body: `${data.course ?? 'No course specified'} · ${data.branch}`,
        link: '/admin/leads',
      });
    } catch (notifErr) {
      console.error('[POST /api/leads] Notification creation failed (non-fatal):', notifErr);
    }

    return NextResponse.json(
      { success: true, id: created.id },
      { status: 201 },
    );
  } catch (err) {
    // Log server-side; never leak internals to the client.
    console.error('[POST /api/leads] Failed to create lead:', err);
    return NextResponse.json(
      { success: false, message: 'Something went wrong' },
      { status: 500 },
    );
  }
}
