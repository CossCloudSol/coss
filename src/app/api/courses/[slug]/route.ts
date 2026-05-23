import { NextResponse, type NextRequest } from 'next/server';
import { prisma } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Ctx = { params: { slug: string } };

export async function GET(_req: NextRequest, { params }: Ctx): Promise<Response> {
  try {
    const course = await prisma.course.findFirst({
      where: { slug: params.slug, status: 'published' },
    });
    if (!course) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(course);
  } catch (err) {
    console.error('[GET /api/courses/[slug]]', err);
    return NextResponse.json({ error: 'Failed to load course' }, { status: 500 });
  }
}
