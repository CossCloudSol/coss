import { NextResponse, type NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { savesClickRows } from '@/lib/click-rows';
import { isBotUserAgent } from '@/lib/bot-ua';
import { ctaClickSchema } from '@/lib/cta-click-schema';
import { clientIp, createRateLimiter } from '@/lib/rate-limit';

// Prisma needs the Node runtime — and we never want this cached.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/* -------------------------------------------------------------------------- */
/*  Anonymous demo / syllabus / brochure / enrol click log (CtaClick), posted */
/*  by intent-tracking's beacon. No auth: the closed enums, the id pattern    */
/*  and the length caps bound what a caller can write, the rate limit blunts  */
/*  floods (same policy as /api/call-clicks), and bot user agents are         */
/*  ignored. No personal data is accepted.                                    */
/* -------------------------------------------------------------------------- */

const limiter = createRateLimiter({ max: 20, windowMs: 10 * 60 * 1000 });

/**
 * Called via navigator.sendBeacon — the client never waits on this, but the
 * handler awaits the insert (an un-awaited write is dropped on Vercel).
 */
export async function POST(req: NextRequest): Promise<Response> {
  if (isBotUserAgent(req.headers.get('user-agent'))) {
    return new NextResponse(null, { status: 204 });
  }
  if (!limiter.allow(clientIp(req.headers))) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 422 });
  }

  const parsed = ctaClickSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid payload', errors: parsed.error.flatten().fieldErrors },
      { status: 422 },
    );
  }
  const d = parsed.data;

  // Rows only for requests to the production host (lib/click-rows).
  if (!savesClickRows(req.headers)) return new NextResponse(null, { status: 204 });

  try {
    await prisma.ctaClick.create({
      data: {
        kind: d.kind,
        ctaId: d.ctaId,
        location: d.location,
        path: d.path,
        pageType: d.pageType,
        destination: d.destination,
        courseSlug: d.courseSlug ?? null,
        deviceType: d.deviceType,
        referrer: d.referrer ?? null,
        utmSource: d.utmSource ?? null,
        utmMedium: d.utmMedium ?? null,
        utmCampaign: d.utmCampaign ?? null,
        gclid: d.gclid ?? null,
      },
    });
  } catch (err) {
    console.error('[POST /api/cta-clicks] Failed to create CtaClick:', err);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
