import { prisma } from '@/lib/db';

/** Queued posts whose scheduled time has arrived, ready to be pushed to Buffer. */
export async function findDueSocialPosts() {
  return prisma.socialPost.findMany({
    where: {
      status: 'queued',
      scheduledFor: { lte: new Date() },
    },
    orderBy: { scheduledFor: 'asc' },
  });
}
