import { NextResponse, type NextRequest } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest): Promise<Response> {
  const { searchParams } = new URL(req.url);
  const category  = (searchParams.get('category')  ?? '').trim();
  const type      = (searchParams.get('type')      ?? '').trim();
  const mode      = (searchParams.get('mode')      ?? '').trim();
  const experience= (searchParams.get('experience')  ?? '').trim();
  const search    = (searchParams.get('search')    ?? '').trim();
  const featured  = searchParams.get('featured');
  const limit     = Math.min(100, Math.max(1, Number(searchParams.get('limit') ?? '50')));

  const now = new Date();
  const where: Prisma.JobWhereInput = {
    status: 'active',
    OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
  };

  if (category)   where.category   = { contains: category,   mode: 'insensitive' };
  if (type)       where.type       = type;
  if (mode)       where.mode       = mode;
  if (experience) where.experience = experience;
  if (featured === 'true') where.featured = true;

  if (search) {
    const searchFilter: Prisma.JobWhereInput = {
      OR: [
        { title:    { contains: search, mode: 'insensitive' } },
        { company:  { contains: search, mode: 'insensitive' } },
        { category: { contains: search, mode: 'insensitive' } },
      ],
    };
    where.AND = [searchFilter];
  }

  try {
    const jobs = await prisma.job.findMany({
      where,
      orderBy: [{ featured: 'desc' }, { postedAt: 'desc' }],
      take: limit,
    });

    return NextResponse.json({ jobs });
  } catch (err) {
    console.error('[GET /api/jobs]', err);
    return NextResponse.json({ error: 'Failed to load jobs' }, { status: 500 });
  }
}
