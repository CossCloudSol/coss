import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const PHONE_REGEX = /^(\+91)?[6-9]\d{9}$/;

const contactSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(255),

  phone: z
    .string()
    .trim()
    .regex(PHONE_REGEX, 'Phone must be a 10-digit Indian mobile, optionally prefixed with +91')
    .transform(raw => {
      const digits = raw.replace(/\D/g, '');
      const ten = digits.length === 12 ? digits.slice(2) : digits;
      return `+91${ten}`;
    }),

  email: z.preprocess(
    v => (typeof v === 'string' && v.trim() === '' ? undefined : v),
    z.string().trim().email('Email is not valid').optional(),
  ),

  subject: z.preprocess(
    v => (typeof v === 'string' && v.trim() === '' ? undefined : v),
    z.string().trim().max(100).optional(),
  ),

  branch: z.enum(['Dilsukhnagar', 'Ameerpet', 'Online']).default('Online'),

  message: z.preprocess(
    v => (typeof v === 'string' && v.trim() === '' ? undefined : v),
    z.string().trim().max(1000, 'Message must be 1000 characters or fewer').optional(),
  ),

  // Attribution — same shape and caps as /api/leads' leadInputSchema so the
  // two lead-creating routes stay consistent. All optional.
  utmSource: z.string().trim().max(255, 'UTM source must be 255 characters or fewer').optional(),
  utmMedium: z.string().trim().max(255, 'UTM medium must be 255 characters or fewer').optional(),
  utmCampaign: z.string().trim().max(255, 'UTM campaign must be 255 characters or fewer').optional(),
  referrer: z.string().trim().max(2048, 'Referrer must be 2048 characters or fewer').optional(),
  landingPage: z.string().trim().max(2048, 'Landing page must be 2048 characters or fewer').optional(),
  submitPath: z.string().trim().max(255, 'Submit path must be 255 characters or fewer').optional(),
  deviceType: z.enum(['mobile', 'desktop'], { error: 'Device type must be mobile or desktop' }).optional(),
});

// In-memory rate limit: 3 submissions per IP per 10 minutes
const rateMap = new Map<string, number[]>();

function allow(ip: string): boolean {
  const now = Date.now();
  const cutoff = now - 10 * 60 * 1000;
  const prev = (rateMap.get(ip) ?? []).filter(t => t > cutoff);
  if (prev.length >= 3) { rateMap.set(ip, prev); return false; }
  prev.push(now);
  rateMap.set(ip, prev);
  return true;
}

export async function POST(req: NextRequest): Promise<Response> {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  if (!allow(ip)) {
    return NextResponse.json(
      { success: false, error: 'Too many submissions. Please try again later.' },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid request body' }, { status: 422 });
  }

  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, errors: parsed.error.flatten().fieldErrors },
      { status: 422 },
    );
  }

  const d = parsed.data;

  try {
    await prisma.$transaction(async tx => {
      const lead = await tx.lead.create({
        data: {
          name: d.name,
          phone: d.phone,
          email: d.email ?? null,
          course: d.subject ?? null,
          branch: d.branch.toLowerCase(),
          formType: 'contact',
          status: 'new',
          message: d.message ?? null,
          utmSource: d.utmSource ?? null,
          utmMedium: d.utmMedium ?? null,
          utmCampaign: d.utmCampaign ?? null,
          referrer: d.referrer ?? null,
          landingPage: d.landingPage ?? null,
          submitPath: d.submitPath ?? null,
          deviceType: d.deviceType ?? null,
        },
        select: { id: true },
      });
      await tx.leadActivity.create({
        data: {
          leadId: lead.id,
          action: 'form_submitted',
          note: 'Submitted via contact page form',
        },
      });
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/contact]', err);
    return NextResponse.json({ success: false, error: 'Something went wrong' }, { status: 500 });
  }
}
