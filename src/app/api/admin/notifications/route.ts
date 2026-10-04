import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-guard';
import {
  getNotificationsForUser,
  getUnreadCount,
  sessionRoleToFilter,
} from '@/lib/notifications';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const guard = await requireAdmin(req);
  if (guard instanceof Response) return guard;
  const session = guard.session;

  const userRole = sessionRoleToFilter(session.role);

  const { searchParams } = new URL(req.url);
  const unreadOnly = searchParams.get('unread') === 'true';

  const [notifications, unreadCount] = await Promise.all([
    getNotificationsForUser({ userRole, unreadOnly }),
    getUnreadCount(userRole),
  ]);

  return NextResponse.json({ notifications, unreadCount });
}
