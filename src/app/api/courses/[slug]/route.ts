import { NextResponse, type NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { getPublishedCourseBySlug } from '@/lib/course-queries';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Ctx = { params: { slug: string } };

export async function GET(_req: NextRequest, { params }: Ctx): Promise<Response> {
  try {
    const course = await getPublishedCourseBySlug(params.slug);
    if (course) return NextResponse.json(course);

    // Fallback: treat slug as a categorySlug and return that category's courses
    const category = await (prisma as any).courseCategory.findUnique({
      where: { slug: params.slug },
    });
    if (!category) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const courses = await prisma.course.findMany({
      where: { categorySlug: params.slug, status: 'published' },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ courses });
  } catch (err) {
    console.error('[GET /api/courses/[slug]]', err);
    return NextResponse.json({ error: 'Failed to load course' }, { status: 500 });
  }
}
