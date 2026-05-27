import { NextResponse, type NextRequest } from 'next/server';
import { prisma } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }): Promise<Response> {
  try {
    const batch = await prisma.batch.findUnique({
      where: { id: params.id },
      include: { course: { select: { title: true, category: true, categorySlug: true } } },
    });
    if (!batch) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(batch);
  } catch (err) {
    console.error('[GET /api/batches/[id]]', err);
    return NextResponse.json({ error: 'Failed to load batch' }, { status: 500 });
  }
}
