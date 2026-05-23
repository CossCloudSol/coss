import { NextResponse, type NextRequest } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest): Promise<Response> {
  const { searchParams } = new URL(req.url);
  const category = (searchParams.get('category') ?? '').trim();
  const mode = (searchParams.get('mode') ?? '').trim();
  const level = (searchParams.get('level') ?? '').trim();

  const where: Prisma.CourseWhereInput = { status: 'published' };
  if (category) where.category = { contains: category, mode: 'insensitive' };
  if (mode) where.mode = { contains: mode, mode: 'insensitive' };
  if (level) where.level = { contains: level, mode: 'insensitive' };

  try {
    const courses = await prisma.course.findMany({
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
    return NextResponse.json({ courses });
  } catch (err) {
    console.error('[GET /api/courses]', err);
    return NextResponse.json({ error: 'Failed to load courses' }, { status: 500 });
  }
}
