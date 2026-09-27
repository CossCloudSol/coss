import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { memoDuringBuild } from '@/lib/build-memo';

export interface BatchFilters {
  mode?: string;
  centre?: string;
  courseId?: string;
  featured?: boolean;
  status?: string;
}

/** Shared by GET /api/batches and the "Upcoming Batches" section of course detail pages. */
export async function findBatches(filters: BatchFilters = {}) {
  const where: Prisma.BatchWhereInput = {};

  if (filters.status) {
    where.status = filters.status;
  } else {
    where.status = { in: ['upcoming', 'ongoing'] };
  }

  if (filters.mode) where.mode = filters.mode;
  if (filters.centre) where.centre = filters.centre;
  if (filters.courseId) where.courseId = filters.courseId;
  if (filters.featured) where.featured = true;

  // Each course's batches were fetched on both of its URLs during the build.
  const key = `batches:${filters.status ?? ''}|${filters.mode ?? ''}|${filters.centre ?? ''}|${filters.courseId ?? ''}|${filters.featured ? 1 : 0}`;
  return memoDuringBuild(key, () =>
    prisma.batch.findMany({
      where,
      include: {
        course: { select: { title: true, category: true, categorySlug: true } },
      },
      orderBy: { startDate: 'asc' },
    }),
  );
}
