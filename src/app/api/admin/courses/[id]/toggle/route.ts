import { NextResponse, type NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/session';
import { createNotification } from '@/lib/notifications';
import { checkPublishRedirectCollision, type RedirectCollision } from '@/lib/redirect-collision';
import { revalidatePaths, getCourseRevalidationPaths } from '@/lib/revalidate';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Ctx = { params: { id: string } };

export async function PATCH(req: NextRequest, { params }: Ctx): Promise<Response> {
  const probe = NextResponse.next();
  const session = await getSession(req, probe);
  if (!session.isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const data: { status?: string; featured?: boolean } = {};
  if (typeof body.status === 'string') data.status = body.status;
  if (typeof body.featured === 'boolean') data.featured = body.featured;

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
  }

  try {
    const existing = await prisma.course.findUnique({
      where: { id: params.id },
      select: { status: true },
    });

    const course = await prisma.course.update({ where: { id: params.id }, data });

    let redirectCollision: RedirectCollision | null = null;
    if (data.status === 'published' && existing?.status !== 'published') {
      redirectCollision = await checkPublishRedirectCollision(course);
    }

    // Publish and unpublish both need to invalidate — an unpublished course
    // that stays cached and reachable for the full revalidate window is the
    // worst case here (a course that no longer exists is worse than one
    // that's merely stale).
    await revalidatePaths(getCourseRevalidationPaths(course));

    if (data.status === 'published') {
      try {
        await createNotification({
          type: 'content_published',
          title: 'Course published',
          body: course.title,
          link: `/admin/courses/${course.id}/edit`,
        });
      } catch (notifErr) {
        console.error('[PATCH /api/admin/courses/[id]/toggle] Notification creation failed (non-fatal):', notifErr);
      }
    }

    return NextResponse.json({ ok: true, status: course.status, featured: course.featured, redirectCollision });
  } catch (err: unknown) {
    const e = err as { code?: string };
    if (e.code === 'P2025') {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    console.error('[PATCH /api/admin/courses/[id]/toggle]', err);
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}
