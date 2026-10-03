import { NextResponse, type NextRequest } from 'next/server';
import { getSession } from '@/lib/session';
import { getSocialPostCourse } from '@/lib/social-post-course';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Course data for the social post form's channel previews: page URL
 * (Facebook link card), og:image and the signed Instagram portrait banner
 * for the given hook. The same function feeds the cron, so the preview
 * shows what Buffer will receive.
 */
export async function GET(req: NextRequest): Promise<Response> {
  const probe = NextResponse.next();
  const session = await getSession(req, probe);
  if (!session.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const courseId = searchParams.get('courseId') ?? '';
  const hook = (searchParams.get('hook') ?? '').slice(0, 100);
  if (!courseId) return NextResponse.json({ error: 'courseId is required' }, { status: 400 });

  try {
    const course = await getSocialPostCourse(courseId, hook);
    if (!course) return NextResponse.json({ error: 'Course not found or unpublished' }, { status: 404 });
    return NextResponse.json(course);
  } catch (err) {
    console.error('[GET /api/admin/social-posts/preview]', err);
    return NextResponse.json({ error: 'Failed to load course preview' }, { status: 500 });
  }
}
