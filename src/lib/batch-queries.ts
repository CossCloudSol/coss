import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';

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

  return prisma.batch.findMany({
    where,
    include: {
      course: { select: { title: true, category: true, categorySlug: true } },
    },
    orderBy: { startDate: 'asc' },
  });
}
