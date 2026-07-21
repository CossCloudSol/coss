import { prisma } from '@/lib/db';

/** Shared by GET /api/jobs/[slug] and the job detail page render path. */
export async function getActiveJobBySlug(slug: string) {
  const now = new Date();
  return prisma.job.findFirst({
    where: {
      slug,
      status: 'active',
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
    },
  });
}
