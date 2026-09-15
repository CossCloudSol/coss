import { NextResponse, type NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function validateAssetRules(imageUrl: string | null, imageAltText: string | null, linkUrl: string | null): string | null {
  if (imageUrl && linkUrl) {
    return 'A post cannot have both an image and a link — Buffer treats imageUrl and linkUrl as mutually exclusive.';
  }
  if (imageUrl && !imageAltText) {
    return 'Alt text is required whenever an image is set — Buffer requires alt text on every image asset.';
  }
  return null;
}

export async function GET(req: NextRequest): Promise<Response> {
  const probe = NextResponse.next();
  const session = await getSession(req, probe);
  if (!session.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  try {
    const socialPosts = await prisma.socialPost.findMany({
      orderBy: { scheduledFor: 'desc' },
    });
    return NextResponse.json({ socialPosts });
  } catch (err) {
    console.error('[GET /api/admin/social-posts]', err);
    return NextResponse.json({ error: 'Failed to load social posts' }, { status: 500 });
  }
}

export async function POST(req: NextRequest): Promise<Response> {
  const probe = NextResponse.next();
  const session = await getSession(req, probe);
  if (!session.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { content, channels, scheduledFor } = body as Record<string, string>;
  if (!content || !channels || !scheduledFor) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const imageUrl     = (body.imageUrl as string)     || null;
  const imageAltText = (body.imageAltText as string) || null;
  const linkUrl       = (body.linkUrl as string)       || null;

  const validationError = validateAssetRules(imageUrl, imageAltText, linkUrl);
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  try {
    const socialPost = await prisma.socialPost.create({
      data: {
        content,
        channels,
        imageUrl,
        imageAltText,
        linkUrl,
        scheduledFor: new Date(scheduledFor),
      },
    });
    return NextResponse.json(socialPost, { status: 201 });
  } catch (err) {
    console.error('[POST /api/admin/social-posts]', err);
    return NextResponse.json({ error: 'Failed to create social post' }, { status: 500 });
  }
}
