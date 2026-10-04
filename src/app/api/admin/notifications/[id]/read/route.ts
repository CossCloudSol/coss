import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-guard';
import { markAsRead } from '@/lib/notifications';

export const runtime = 'nodejs';

interface RouteContext {
  params: { id: string };
}

export async function POST(req: NextRequest, { params }: RouteContext) {
  const guard = await requireAdmin(req);
  if (guard instanceof Response) return guard;

  await markAsRead(params.id);
  return NextResponse.json({ success: true });
}
