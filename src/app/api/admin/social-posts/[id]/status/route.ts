import { NextResponse, type NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/session';
import { bufferChannelId } from '@/lib/buffer-client';
import { checkPost, parseChannels, ruleErrors } from '@/lib/social-captions';
import { getSocialPostCourse } from '@/lib/social-post-course';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Ctx = { params: { id: string } };

/**
 * "Approve & schedule": everything the post needs before the cron may send
 * it — LinkedIn's image/link rules, the per-channel rules, allowed claims
 * only, a live course and Buffer channel ids for the chosen networks.
 */
async function validateQueueReadiness(post: {
  content: string;
  imageUrl: string | null;
  imageAltText: string | null;
  linkUrl: string | null;
  channels: string;
  courseId: string | null;
  hook: string | null;
  hashtags: string | null;
  scheduledFor: Date;
}): Promise<string | null> {
  if (post.imageUrl && post.linkUrl) {
    return 'A post cannot have both an image and a link — Buffer treats imageUrl and linkUrl as mutually exclusive.';
  }
  if (post.imageUrl && !post.imageAltText) {
    return 'Alt text is required whenever an image is set — Buffer requires alt text on every image asset.';
  }
  const channels = parseChannels(post.channels);
  if (channels.length === 0) {
    return 'At least one channel must be selected before queuing.';
  }
  if (post.scheduledFor.getTime() < Date.now()) {
    return 'Scheduled time must be in the future before queuing.';
  }
  const errors = ruleErrors(checkPost({ ...post, channels, hasCourse: Boolean(post.courseId) }));
  if (errors.length > 0) return errors.join(' ');
  if (post.courseId) {
    const course = await getSocialPostCourse(post.courseId, post.hook);
    if (!course) return 'The linked course is missing or unpublished.';
    if (channels.includes('instagram') && !course.igImageUrl) return 'Instagram banner generation is unavailable (ADMIN_SESSION_SECRET not set).';
  }
  const missing = channels.filter((c) => !bufferChannelId(c));
  if (missing.length > 0) {
    return `No Buffer channel configured for ${missing.join(', ')}: set ${missing.map((c) => `BUFFER_PROFILE_${c.toUpperCase()}`).join(', ')} in Vercel.`;
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

  const data: { status?: string; lastError?: null; sentAt?: null } = {};
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
    const validationError = await validateQueueReadiness(existing);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }
    if (existing.status === 'failed') {
      data.lastError = null;
      data.sentAt = null;
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
