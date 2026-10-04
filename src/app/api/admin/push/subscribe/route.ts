import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-guard';
import { prisma } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const guard = await requireAdmin(req);
  if (guard instanceof Response) return guard;
  const session = guard.session;
  if (!session.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (
    typeof body !== 'object' ||
    body === null ||
    typeof (body as Record<string, unknown>).endpoint !== 'string' ||
    typeof (body as Record<string, unknown>).p256dh !== 'string' ||
    typeof (body as Record<string, unknown>).auth !== 'string'
  ) {
    return NextResponse.json({ error: 'Missing required subscription fields' }, { status: 400 });
  }

  const { endpoint, p256dh, auth, userAgent } = body as {
    endpoint: string;
    p256dh: string;
    auth: string;
    userAgent?: string;
  };

  await prisma.pushSubscription.upsert({
    where: { endpoint },
    update: { p256dh, auth, userAgent: userAgent ?? null, adminUserId: session.userId },
    create: { endpoint, p256dh, auth, userAgent: userAgent ?? null, adminUserId: session.userId },
  });

  return NextResponse.json({ ok: true });
}
