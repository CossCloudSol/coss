import { NextResponse, type NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { createNotification } from '@/lib/notifications';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest): Promise<Response> {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  const dayAfterTomorrow = new Date(tomorrow);
  dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);

  try {
    const upcomingBatches = await prisma.batch.findMany({
      where: {
        startDate: {
          gte: tomorrow,
          lt: dayAfterTomorrow,
        },
      },
      select: {
        id: true,
        centre: true,
        startDate: true,
        course: {
          select: { title: true },
        },
      },
    });

    let notified = 0;
    for (const batch of upcomingBatches) {
      try {
        await createNotification({
          type: 'batch_reminder',
          title: 'Batch starting tomorrow',
          body: `${batch.course.title} — ${batch.centre ?? 'Online'}`,
          link: '/admin/batches',
        });
        notified++;
      } catch (err) {
        console.error(`[cron/batch-reminders] Failed to notify for batch ${batch.id}:`, err);
      }
    }

    return NextResponse.json({ ok: true, batchesFound: upcomingBatches.length, notified });
  } catch (err) {
    console.error('[cron/batch-reminders] Failed:', err);
    return NextResponse.json({ error: 'Failed to check batches' }, { status: 500 });
  }
}
