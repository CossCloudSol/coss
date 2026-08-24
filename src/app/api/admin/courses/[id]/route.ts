import { NextResponse, type NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/session';
import { checkPublishRedirectCollision, type RedirectCollision } from '@/lib/redirect-collision';
import { revalidatePaths, getCourseRevalidationPaths } from '@/lib/revalidate';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Ctx = { params: { id: string } };

export async function GET(req: NextRequest, { params }: Ctx): Promise<Response> {
  const probe = NextResponse.next();
  const session = await getSession(req, probe);
  if (!session.isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const course = await prisma.course.findUnique({ where: { id: params.id } });
    if (!course) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(course);
  } catch (err) {
    console.error('[GET /api/admin/courses/[id]]', err);
    return NextResponse.json({ error: 'Failed to load course' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: Ctx): Promise<Response> {
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

  try {
    const existing = await prisma.course.findUnique({
      where: { id: params.id },
      select: { status: true, slug: true, categorySlug: true },
    });

    const course = await prisma.course.update({
      where: { id: params.id },
      data: {
        title: body.title as string,
        slug: body.slug as string,
        description: body.description as string,
        excerpt: body.excerpt as string,
        category: body.category as string,
        duration: body.duration as string,
        mode: body.mode as string,
        level: body.level as string,
        price: body.price != null ? Number(body.price) : null,
        originalPrice: body.originalPrice != null ? Number(body.originalPrice) : null,
        badge: (body.badge as string) || null,
        thumbnail: (body.thumbnail as string) || null,
        syllabus: (body.syllabus as object) ?? [],
        highlights: Array.isArray(body.highlights) ? (body.highlights as string[]) : [],
        tools: Array.isArray(body.tools) ? (body.tools as string[]) : [],
        status: body.status as string,
        featured: Boolean(body.featured),
        sortOrder: Number(body.sortOrder ?? 0),
        seoTitle: (body.seoTitle as string) || null,
        seoDesc: (body.seoDesc as string) || null,
      },
    });

    let redirectCollision: RedirectCollision | null = null;
    if (body.status === 'published' && existing?.status !== 'published') {
      redirectCollision = await checkPublishRedirectCollision(course);
    }

    const newPaths = getCourseRevalidationPaths(course);
    const oldPaths = existing ? getCourseRevalidationPaths(existing) : [];
    await revalidatePaths(Array.from(new Set([...newPaths, ...oldPaths])));

    return NextResponse.json({ ...course, redirectCollision });
  } catch (err: unknown) {
    const e = err as { code?: string };
    if (e.code === 'P2002') {
      return NextResponse.json({ error: 'Slug already exists' }, { status: 409 });
    }
    if (e.code === 'P2025') {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    console.error('[PUT /api/admin/courses/[id]]', err);
    return NextResponse.json({ error: 'Failed to update course' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: Ctx): Promise<Response> {
  const probe = NextResponse.next();
  const session = await getSession(req, probe);
  if (!session.isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const deleted = await prisma.course.delete({ where: { id: params.id } });
    await revalidatePaths(getCourseRevalidationPaths(deleted));
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const e = err as { code?: string };
    if (e.code === 'P2025') {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    console.error('[DELETE /api/admin/courses/[id]]', err);
    return NextResponse.json({ error: 'Failed to delete course' }, { status: 500 });
  }
}
