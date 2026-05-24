import { NextResponse, type NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/session'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type RouteContext = { params: { id: string } }

export async function GET(req: NextRequest, { params }: RouteContext): Promise<Response> {
  const probe = NextResponse.next()
  const session = await getSession(req, probe)
  if (!session.isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const category = await prisma.courseCategory.findUnique({
    where: { id: params.id },
    include: { _count: { select: { courses: true } } },
  })
  if (!category) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  return NextResponse.json(category)
}

export async function PUT(req: NextRequest, { params }: RouteContext): Promise<Response> {
  const probe = NextResponse.next()
  const session = await getSession(req, probe)
  if (!session.isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const existing = await prisma.courseCategory.findUnique({ where: { id: params.id } })
  if (!existing) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  // Legacy categories: do not allow slug changes
  if (existing.isLegacy && body.slug && body.slug !== existing.slug) {
    return NextResponse.json({ error: 'Cannot change slug of a legacy category' }, { status: 422 })
  }

  try {
    const updated = await prisma.courseCategory.update({
      where: { id: params.id },
      data: {
        name: (body.name as string) ?? existing.name,
        slug: existing.isLegacy ? existing.slug : ((body.slug as string) ?? existing.slug),
        description: (body.description as string) ?? existing.description,
        icon: (body.icon as string) ?? existing.icon,
        color: (body.color as string) ?? existing.color,
        sortOrder: body.sortOrder != null ? Number(body.sortOrder) : existing.sortOrder,
        status: (body.status as string) ?? existing.status,
        seoTitle: (body.seoTitle as string) ?? existing.seoTitle,
        seoDesc: (body.seoDesc as string) ?? existing.seoDesc,
      },
    })
    return NextResponse.json(updated)
  } catch (err) {
    console.error('[PUT /api/admin/categories/:id]', err)
    return NextResponse.json({ error: 'Failed to update category' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: RouteContext): Promise<Response> {
  const probe = NextResponse.next()
  const session = await getSession(req, probe)
  if (!session.isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const courseCount = await prisma.course.count({ where: { categoryId: params.id } })
  if (courseCount > 0) {
    return NextResponse.json(
      { error: `Cannot delete — ${courseCount} course(s) are linked to this category` },
      { status: 409 },
    )
  }

  try {
    await prisma.courseCategory.delete({ where: { id: params.id } })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[DELETE /api/admin/categories/:id]', err)
    return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 })
  }
}
