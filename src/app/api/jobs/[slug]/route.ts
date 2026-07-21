import { NextResponse, type NextRequest } from 'next/server';
import { getActiveJobBySlug } from '@/lib/job-queries';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest, { params }: { params: { slug: string } }): Promise<Response> {
  try {
    const job = await getActiveJobBySlug(params.slug);
    if (!job) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(job);
  } catch (err) {
    console.error('[GET /api/jobs/[slug]]', err);
    return NextResponse.json({ error: 'Failed to load job' }, { status: 500 });
  }
}
