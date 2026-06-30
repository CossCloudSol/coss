import { NextResponse, type NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/session';
import { createNotification } from '@/lib/notifications';

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

  const data: { status?: string; featured?: boolean; publishedAt?: Date | null } = {};
  if (typeof body.status === 'string') {
    data.status = body.status;
    if (body.status === 'published') data.publishedAt = new Date();
  }
  if (typeof body.featured === 'boolean') data.featured = body.featured;

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
  }

  try {
    const post = await prisma.blogPost.update({ where: { id: params.id }, data });

    if (data.status === 'published') {
      try {
        await createNotification({
          type: 'content_published',
          title: 'Blog post published',
          body: post.title,
          link: `/admin/blog/${post.id}/edit`,
        });
      } catch (notifErr) {
        console.error('[PATCH /api/admin/blog/[id]/toggle] Notification creation failed (non-fatal):', notifErr);
      }
    }

    return NextResponse.json({ ok: true, status: post.status, featured: post.featured });
  } catch (err: unknown) {
    const e = err as { code?: string };
    if (e.code === 'P2025') {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    console.error('[PATCH /api/admin/blog/[id]/toggle]', err);
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}
