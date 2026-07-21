import { NextResponse, type NextRequest } from 'next/server';
import { findBatches } from '@/lib/batch-queries';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest): Promise<Response> {
  const { searchParams } = new URL(req.url);
  const mode     = (searchParams.get('mode')     ?? '').trim();
  const centre   = (searchParams.get('centre')   ?? '').trim();
  const courseId = (searchParams.get('courseId') ?? '').trim();
  const featured = searchParams.get('featured');
  const status   = (searchParams.get('status')   ?? '').trim();

  try {
    const batches = await findBatches({ mode, centre, courseId, status, featured: featured === 'true' });
    return NextResponse.json({ batches });
  } catch (err) {
    console.error('[GET /api/batches]', err);
    return NextResponse.json({ error: 'Failed to load batches' }, { status: 500 });
  }
}
