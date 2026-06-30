import { NextResponse, type NextRequest } from 'next/server';
import { AdminRole } from '@prisma/client';
import { prisma } from '@/lib/db';
import { sendEmail, buildDigestEmail } from '@/lib/email';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Scheduled: 0 2 * * * (2:00 AM UTC = 7:30 AM IST)

const DIGEST_TYPES = ['status_change', 'content_published', 'batch_reminder'] as const;
type DigestType = (typeof DIGEST_TYPES)[number];

const TYPE_LABELS: Record<DigestType, string> = {
  status_change: 'Lead Status Changes',
  content_published: 'Content Published',
  batch_reminder: 'Batch Reminders',
};

export async function GET(req: NextRequest): Promise<Response> {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

  try {
    const notifications = await prisma.notification.findMany({
      where: {
        type: { in: [...DIGEST_TYPES] },
        createdAt: { gte: since },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (notifications.length === 0) {
      return NextResponse.json({ ok: true, sent: 0, reason: 'no digest notifications' });
    }

    const adminUsers = await prisma.adminUser.findMany({
      where: { isActive: true },
      select: { id: true, email: true, role: true },
    });

    const dateLabel = new Date().toLocaleDateString('en-IN', {
      timeZone: 'Asia/Kolkata',
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });

    let sent = 0;

    for (const user of adminUsers) {
      // SUPER_ADMIN sees everything; other roles see targetRole=null + their own role
      const userRoleStr =
        user.role === AdminRole.SUPER_ADMIN ? null : user.role.toLowerCase();

      const visible = notifications.filter((n) => {
        if (userRoleStr === null) return true;
        return n.targetRole === null || n.targetRole === userRoleStr;
      });

      if (visible.length === 0) continue;

      // Build groups, checking per-type email preference
      const groups: Array<{
        label: string;
        count: number;
        items: Array<{ text: string; link?: string | null }>;
      }> = [];

      for (const type of DIGEST_TYPES) {
        const typeItems = visible.filter((n) => n.type === type);
        if (typeItems.length === 0) continue;

        const pref = await prisma.notificationPreference.findUnique({
          where: { userId_eventType: { userId: user.id, eventType: type } },
          select: { email: true },
        });
        const emailEnabled = pref === null ? true : pref.email;
        if (!emailEnabled) continue;

        groups.push({
          label: TYPE_LABELS[type],
          count: typeItems.length,
          items: typeItems.map((n) => ({
            text: `${n.title}: ${n.body}`,
            link: n.link,
          })),
        });
      }

      if (groups.length === 0) continue;

      try {
        const html = buildDigestEmail({ groups, dateLabel });
        await sendEmail({
          to: user.email,
          subject: `Admin Digest — ${dateLabel}`,
          html,
        });
        sent++;
      } catch (err) {
        console.error(`[cron/daily-digest] send failed for ${user.email}:`, err);
      }
    }

    return NextResponse.json({ ok: true, sent });
  } catch (err) {
    console.error('[cron/daily-digest] Failed:', err);
    return NextResponse.json({ error: 'Digest failed' }, { status: 500 });
  }
}
