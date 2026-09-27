import { NextResponse, type NextRequest } from 'next/server';
import { revalidateTag } from 'next/cache';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/session';
import { PROMO_BANNER_BLOCK_TYPE, promoBannerInputSchema } from '@/lib/promo-banner-schema';
import { PROMO_BANNERS_TAG } from '@/lib/promo-banners';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Ctx = { params: { id: string } };

function notFound() {
  return NextResponse.json({ error: 'Banner not found' }, { status: 404 });
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
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

  // Only ever touch promo_banner rows through this route.
  const existing = await prisma.contentBlock.findFirst({
    where: { id: params.id, blockType: PROMO_BANNER_BLOCK_TYPE },
    select: { id: true },
  });
  if (!existing) return notFound();

  const { title, isVisible, sortOrder, metadata } = parsed.data;
  const banner = await prisma.contentBlock.update({
    where: { id: params.id },
    data: { title, isVisible, sortOrder, metadata },
    select: { id: true, title: true, isVisible: true, sortOrder: true, metadata: true, updatedAt: true },
  });
  revalidateTag(PROMO_BANNERS_TAG);
  return NextResponse.json({ banner });
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
  const probe = NextResponse.next();
  const session = await getSession(req, probe);
  if (!session.isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { count } = await prisma.contentBlock.deleteMany({
      where: { id: params.id, blockType: PROMO_BANNER_BLOCK_TYPE },
    });
    if (count === 0) return notFound();
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) return notFound();
    throw err;
  }
  revalidateTag(PROMO_BANNERS_TAG);
  return NextResponse.json({ ok: true });
}
