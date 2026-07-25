import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';

/** Shared by GET /api/courses/[slug] and the course detail page render path. */
export async function getPublishedCourseBySlug(slug: string) {
  return prisma.course.findFirst({ where: { slug, status: 'published' } });
}

/** Shared by GET /api/categories/[slug] and the category landing page render path. */
export async function getCategoryBySlugWithCourses(slug: string) {
  return prisma.courseCategory.findUnique({
    where: { slug },
    include: {
      courses: { where: { status: 'published' }, orderBy: { sortOrder: 'asc' } },
    },
  });
}

/** Shared by GET /api/courses/[slug]/[courseSlug] and the nested course detail page. */
export async function getCourseInCategory(categorySlug: string, courseSlug: string) {
  return prisma.course.findFirst({
    where: { slug: courseSlug, categorySlug, status: 'published' },
  });
}

export interface CourseListFilters {
  category?: string;
  mode?: string;
  level?: string;
}

/** Full published-course pool for deterministic keyword matching (blog-to-course callout). */
export async function getPublishedCoursesForMatching() {
  return prisma.course.findMany({
    where: { status: 'published' },
    select: {
      id: true,
      title: true,
      slug: true,
      category: true,
      categorySlug: true,
      urlType: true,
      highlights: true,
      tools: true,
    },
  })
}

/** Shared by GET /api/courses and the related-courses section of course detail pages. */
export async function findCourses(filters: CourseListFilters = {}) {
  const where: Prisma.CourseWhereInput = { status: 'published' };
  if (filters.category) where.category = { contains: filters.category, mode: 'insensitive' };
  if (filters.mode) where.mode = { contains: filters.mode, mode: 'insensitive' };
  if (filters.level) where.level = { contains: filters.level, mode: 'insensitive' };

  return prisma.course.findMany({
    where,
    orderBy: [{ featured: 'desc' }, { sortOrder: 'asc' }, { createdAt: 'desc' }],
    select: {
      id: true,
      title: true,
      slug: true,
      excerpt: true,
      category: true,
      duration: true,
      mode: true,
      level: true,
      price: true,
      originalPrice: true,
      badge: true,
      thumbnail: true,
      highlights: true,
      featured: true,
    },
  });
}
