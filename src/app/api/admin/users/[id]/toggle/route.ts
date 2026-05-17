import { NextResponse } from 'next/server';
import { withAdminAuth, getSession } from '@/lib/session';
import { prisma as db } from '@/lib/db';

type Ctx = { params: { id: string } };

function isSuperAdmin(session: { role?: string }): boolean {
  return !session.role || session.role === 'SUPER_ADMIN';
}

export const PATCH = withAdminAuth<{ id: string }>(async (req, ctx) => {
  const probe = NextResponse.next();
  const session = await getSession(req, probe);
  if (!isSuperAdmin(session)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = (ctx as Ctx).params;

  // Prevent self-disable
  if (session.userId && session.userId === id) {
    return NextResponse.json({ error: 'You cannot disable your own account' }, { status: 400 });
  }

  try {
    const user = await db.adminUser.findUnique({ where: { id } });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const updated = await db.adminUser.update({
      where: { id },
      data: { isActive: !user.isActive },
      select: { id: true, isActive: true },
    });

    return NextResponse.json({ ok: true, isActive: updated.isActive });
  } catch {
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
});
