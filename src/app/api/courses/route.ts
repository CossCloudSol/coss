import { NextResponse, type NextRequest } from 'next/server';
import { findCourses } from '@/lib/course-queries';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest): Promise<Response> {
  const { searchParams } = new URL(req.url);
  const category = (searchParams.get('category') ?? '').trim();
  const mode = (searchParams.get('mode') ?? '').trim();
  const level = (searchParams.get('level') ?? '').trim();

  try {
    const courses = await findCourses({ category, mode, level });
    return NextResponse.json({ courses });
  } catch (err) {
    console.error('[GET /api/courses]', err);
    return NextResponse.json({ error: 'Failed to load courses' }, { status: 500 });
  }
}
