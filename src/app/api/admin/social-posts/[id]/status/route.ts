import { NextResponse, type NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Ctx = { params: { id: string } };

function validateQueueReadiness(post: {
  imageUrl: string | null;
  imageAltText: string | null;
  linkUrl: string | null;
  channels: string;
  scheduledFor: Date;
}): string | null {
  if (post.imageUrl && post.linkUrl) {
    return 'A post cannot have both an image and a link — Buffer treats imageUrl and linkUrl as mutually exclusive.';
  }
  if (post.imageUrl && !post.imageAltText) {
    return 'Alt text is required whenever an image is set — Buffer requires alt text on every image asset.';
  }
  if (!post.channels.trim()) {
    return 'At least one channel must be selected before queuing.';
  }
  if (post.scheduledFor.getTime() < Date.now()) {
    return 'Scheduled time must be in the future before queuing.';
  }
  return null;
}

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

  const data: { status?: string } = {};
  if (typeof body.status === 'string' && (body.status === 'draft' || body.status === 'queued')) {
    data.status = body.status;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
  }

  const existing = await prisma.socialPost.findUnique({ where: { id: params.id } });
  if (!existing) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  if (data.status === 'queued') {
    const validationError = validateQueueReadiness(existing);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }
  }

  try {
    const post = await prisma.socialPost.update({ where: { id: params.id }, data });
    return NextResponse.json({ ok: true, status: post.status });
  } catch (err) {
    console.error('[PATCH /api/admin/social-posts/[id]/status]', err);
    return NextResponse.json({ error: 'Failed to update status' }, { status: 500 });
  }
}
