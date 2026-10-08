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

/** Active, unexpired jobs for the /jobs board and the sitemap: featured first, newest first. */
export async function findActiveJobs(limit = 100) {
  const now = new Date();
  return prisma.job.findMany({
    where: { status: 'active', OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] },
    orderBy: [{ featured: 'desc' }, { postedAt: 'desc' }],
    take: limit,
  });
}
