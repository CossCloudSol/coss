import { NextResponse, type NextRequest } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest): Promise<Response> {
  const probe = NextResponse.next();
  const session = await getSession(req, probe);
  if (!session.isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const search   = (searchParams.get('search')   ?? '').trim();
  const status   = (searchParams.get('status')   ?? '').trim();
  const category = (searchParams.get('category') ?? '').trim();
  const page     = Math.max(1, Number(searchParams.get('page')  ?? '1'));
  const limit    = Math.min(100, Math.max(1, Number(searchParams.get('limit') ?? '25')));

  const where: Prisma.JobWhereInput = {};
  if (status)   where.status   = status;
  if (category) where.category = category;
  if (search) {
    where.OR = [
      { title:   { contains: search, mode: 'insensitive' } },
      { company: { contains: search, mode: 'insensitive' } },
    ];
  }

  try {
    const [total, jobs] = await Promise.all([
      prisma.job.count({ where }),
      prisma.job.findMany({
        where,
        orderBy: [{ featured: 'desc' }, { postedAt: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return NextResponse.json({
      jobs: jobs.map((j) => ({
        ...j,
        postedAt:  j.postedAt.toISOString(),
        expiresAt: j.expiresAt?.toISOString() ?? null,
        updatedAt: j.updatedAt.toISOString(),
      })),
      total,
      page,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    });
  } catch (err) {
    console.error('[GET /api/admin/jobs]', err);
    return NextResponse.json({ error: 'Failed to load jobs' }, { status: 500 });
  }
}

export async function POST(req: NextRequest): Promise<Response> {
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

  const { title, company, location, type, mode, category, experience } = body as Record<string, string>;
  if (!title || !company || !location || !type || !mode || !category || !experience) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  let slug = (body.slug as string) || title.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-hyderabad';
  slug = slug.replace(/^-+|-+$/g, '');

  try {
    const job = await prisma.job.create({
      data: {
        title,
        slug,
        company,
        companyLogo:     (body.companyLogo as string)     || null,
        location,
        type,
        mode,
        category,
        experience,
        salary:          (body.salary as string)          || null,
        description:     (body.description as string)     || '',
        skills:          Array.isArray(body.skills) ? (body.skills as string[]) : [],
        applyUrl:        (body.applyUrl as string)        || null,
        relatedCourseId: (body.relatedCourseId as string) || null,
        status:          (body.status as string)          || 'active',
        featured:        Boolean(body.featured),
        expiresAt:       body.expiresAt ? new Date(body.expiresAt as string) : null,
      },
    });
    return NextResponse.json(job, { status: 201 });
  } catch (err: unknown) {
    const e = err as { code?: string };
    if (e.code === 'P2002') {
      return NextResponse.json({ error: 'Slug already exists' }, { status: 409 });
    }
    console.error('[POST /api/admin/jobs]', err);
    return NextResponse.json({ error: 'Failed to create job' }, { status: 500 });
  }
}
