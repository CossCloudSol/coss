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
  const search = (searchParams.get('search') ?? '').trim();
  const status = (searchParams.get('status') ?? '').trim();
  const category = (searchParams.get('category') ?? '').trim();
  const page = Math.max(1, Number(searchParams.get('page') ?? '1'));
  const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') ?? '25')));

  const where: Prisma.CourseWhereInput = {};
  if (status) where.status = status;
  if (category) where.category = category;
  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { category: { contains: search, mode: 'insensitive' } },
    ];
  }

  try {
    const [total, courses] = await Promise.all([
      prisma.course.count({ where }),
      prisma.course.findMany({
        where,
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          title: true,
          slug: true,
          category: true,
          duration: true,
          mode: true,
          level: true,
          price: true,
          badge: true,
          status: true,
          featured: true,
          sortOrder: true,
          createdAt: true,
        },
      }),
    ]);

    return NextResponse.json({
      courses: courses.map((c) => ({ ...c, createdAt: c.createdAt.toISOString() })),
      total,
      page,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    });
  } catch (err) {
    console.error('[GET /api/admin/courses]', err);
    return NextResponse.json({ error: 'Failed to load courses' }, { status: 500 });
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

  const { title, slug, description, excerpt, category, duration, mode, level } = body as Record<string, string>;
  if (!title || !slug || !description || !excerpt || !category || !duration || !mode || !level) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  try {
    const course = await prisma.course.create({
      data: {
        title,
        slug,
        description,
        excerpt,
        category,
        duration,
        mode,
        level,
        price: body.price != null ? Number(body.price) : null,
        originalPrice: body.originalPrice != null ? Number(body.originalPrice) : null,
        badge: (body.badge as string) || null,
        thumbnail: (body.thumbnail as string) || null,
        syllabus: (body.syllabus as object) ?? [],
        highlights: Array.isArray(body.highlights) ? (body.highlights as string[]) : [],
        tools: Array.isArray(body.tools) ? (body.tools as string[]) : [],
        status: (body.status as string) || 'draft',
        featured: Boolean(body.featured),
        sortOrder: Number(body.sortOrder ?? 0),
        seoTitle: (body.seoTitle as string) || null,
        seoDesc: (body.seoDesc as string) || null,
        categorySlug: (body.categorySlug as string) || null,
        urlType: (body.urlType as string) || 'legacy',
        ...(body.categoryId ? { categoryId: body.categoryId as string } : {}),
      },
    });
    return NextResponse.json(course, { status: 201 });
  } catch (err: unknown) {
    const e = err as { code?: string };
    if (e.code === 'P2002') {
      return NextResponse.json({ error: 'Slug already exists' }, { status: 409 });
    }
    console.error('[POST /api/admin/courses]', err);
    return NextResponse.json({ error: 'Failed to create course' }, { status: 500 });
  }
}
