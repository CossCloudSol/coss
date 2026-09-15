import { NextResponse, type NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Ctx = { params: { id: string } };

function validateAssetRules(imageUrl: string | null, imageAltText: string | null, linkUrl: string | null): string | null {
  if (imageUrl && linkUrl) {
    return 'A post cannot have both an image and a link — Buffer treats imageUrl and linkUrl as mutually exclusive.';
  }
  if (imageUrl && !imageAltText) {
    return 'Alt text is required whenever an image is set — Buffer requires alt text on every image asset.';
  }
  return null;
}

export async function GET(req: NextRequest, { params }: Ctx): Promise<Response> {
  const probe = NextResponse.next();
  const session = await getSession(req, probe);
  if (!session.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  try {
    const socialPost = await prisma.socialPost.findUnique({ where: { id: params.id } });
    if (!socialPost) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(socialPost);
  } catch (err) {
    console.error('[GET /api/admin/social-posts/[id]]', err);
    return NextResponse.json({ error: 'Failed to load social post' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: Ctx): Promise<Response> {
  const probe = NextResponse.next();
  const session = await getSession(req, probe);
  if (!session.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const existing = await prisma.socialPost.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const data: {
    content?: string;
    channels?: string;
    imageUrl?: string | null;
    imageAltText?: string | null;
    linkUrl?: string | null;
    scheduledFor?: Date;
  } = {};
  if (typeof body.content === 'string') data.content = body.content;
  if (typeof body.channels === 'string') data.channels = body.channels;
  if (typeof body.imageUrl === 'string') data.imageUrl = body.imageUrl || null;
  if (typeof body.imageAltText === 'string') data.imageAltText = body.imageAltText || null;
  if (typeof body.linkUrl === 'string') data.linkUrl = body.linkUrl || null;
  if (typeof body.scheduledFor === 'string') data.scheduledFor = new Date(body.scheduledFor);

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
  }

  const nextImageUrl     = typeof body.imageUrl === 'string'     ? (data.imageUrl as string | null)     : existing.imageUrl;
  const nextImageAltText = typeof body.imageAltText === 'string' ? (data.imageAltText as string | null) : existing.imageAltText;
  const nextLinkUrl       = typeof body.linkUrl === 'string'       ? (data.linkUrl as string | null)       : existing.linkUrl;

  const validationError = validateAssetRules(nextImageUrl, nextImageAltText, nextLinkUrl);
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  try {
    const socialPost = await prisma.socialPost.update({ where: { id: params.id }, data });
    return NextResponse.json(socialPost);
  } catch (err) {
    console.error('[PUT /api/admin/social-posts/[id]]', err);
    return NextResponse.json({ error: 'Failed to update social post' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: Ctx): Promise<Response> {
  const probe = NextResponse.next();
  const session = await getSession(req, probe);
  if (!session.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  try {
    await prisma.socialPost.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[DELETE /api/admin/social-posts/[id]]', err);
    return NextResponse.json({ error: 'Failed to delete social post' }, { status: 500 });
  }
}
