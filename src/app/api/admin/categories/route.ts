import { NextResponse, type NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/session'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest): Promise<Response> {
  const probe = NextResponse.next()
  const session = await getSession(req, probe)
  if (!session.isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status') ?? ''

  const where: Record<string, unknown> = {}
  if (status) where.status = status

  const categories = await prisma.courseCategory.findMany({
    where,
    orderBy: { sortOrder: 'asc' },
    include: {
      _count: { select: { courses: true } },
    },
  })

  return NextResponse.json({ categories })
}

export async function POST(req: NextRequest): Promise<Response> {
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

  if (!body.name) {
    return NextResponse.json({ error: 'name is required' }, { status: 400 })
  }

  if (!body.slug) {
    body.slug = (body.name as string)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
  }

  // Categories created via admin are never legacy
  body.isLegacy = false

  const existing = await prisma.courseCategory.findUnique({
    where: { slug: body.slug as string },
  })
  if (existing) {
    return NextResponse.json({ error: 'Slug already exists' }, { status: 409 })
  }

  try {
    const category = await prisma.courseCategory.create({
      data: {
        name: body.name as string,
        slug: body.slug as string,
        description: (body.description as string) || null,
        icon: (body.icon as string) || null,
        color: (body.color as string) || null,
        sortOrder: Number(body.sortOrder ?? 0),
        isLegacy: false,
        status: (body.status as string) || 'draft',
        seoTitle: (body.seoTitle as string) || null,
        seoDesc: (body.seoDesc as string) || null,
      },
    })
    return NextResponse.json(category, { status: 201 })
  } catch (err) {
    console.error('[POST /api/admin/categories]', err)
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 })
  }
}
