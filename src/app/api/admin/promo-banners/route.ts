import { NextResponse, type NextRequest } from 'next/server';
import { revalidateTag } from 'next/cache';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/session';
import { PROMO_BANNER_BLOCK_TYPE, promoBannerInputSchema } from '@/lib/promo-banner-schema';
import { PROMO_BANNERS_TAG } from '@/lib/promo-banners';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Writes need content:edit / content:delete — enforced by middleware's
// /api/admin guard via the /admin/promo-banners route map entry.

export async function GET(req: NextRequest) {
  const probe = NextResponse.next();
  const session = await getSession(req, probe);
  if (!session.isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const banners = await prisma.contentBlock.findMany({
    where: { blockType: PROMO_BANNER_BLOCK_TYPE },
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    select: { id: true, title: true, isVisible: true, sortOrder: true, metadata: true, updatedAt: true },
  });
  return NextResponse.json({ banners });
}

export async function POST(req: NextRequest) {
  const probe = NextResponse.next();
  const session = await getSession(req, probe);
  if (!session.isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  const parsed = promoBannerInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid banner' }, { status: 422 });
  }

  const { title, isVisible, sortOrder, metadata } = parsed.data;
  const banner = await prisma.contentBlock.create({
    data: {
      blockType: PROMO_BANNER_BLOCK_TYPE,
      page: 'promo',
      title,
      isVisible,
      sortOrder,
      metadata,
    },
    select: { id: true, title: true, isVisible: true, sortOrder: true, metadata: true, updatedAt: true },
  });
  revalidateTag(PROMO_BANNERS_TAG);
  return NextResponse.json({ banner }, { status: 201 });
}
