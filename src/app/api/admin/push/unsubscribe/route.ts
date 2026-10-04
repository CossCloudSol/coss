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

  const endpoint =
    typeof body === 'object' && body !== null
      ? (body as Record<string, unknown>).endpoint
      : undefined;

  if (typeof endpoint !== 'string') {
    return NextResponse.json({ error: 'Missing endpoint' }, { status: 400 });
  }

  await prisma.pushSubscription
    .delete({ where: { endpoint } })
    .catch(() => {
      // Row may not exist — treat as success
    });

  return NextResponse.json({ ok: true });
}
