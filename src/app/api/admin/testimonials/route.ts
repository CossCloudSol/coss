import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const probe = NextResponse.next()
  const session = await getSession(req, probe)
  if (!session?.isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = req.nextUrl
  const scope   = searchParams.get('scope')
  const visible = searchParams.get('visible')
  const search  = searchParams.get('search')
  const page    = parseInt(searchParams.get('page') ?? '1')
  const limit   = 20

  const where: Record<string, unknown> = {}
  if (scope) where.scope = scope
  if (visible !== null && visible !== '') where.visible = visible === 'true'
  if (search) where.OR = [
    { name: { contains: search, mode: 'insensitive' } },
    { quote: { contains: search, mode: 'insensitive' } },
    { courseSlug: { contains: search, mode: 'insensitive' } },
  ]

  const [items, total] = await Promise.all([
    prisma.testimonial.findMany({
      where,
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.testimonial.count({ where }),
  ])

  return NextResponse.json({ items, total, page, pages: Math.ceil(total / limit) })
}

export async function POST(req: NextRequest) {
  const probe = NextResponse.next()
  const session = await getSession(req, probe)
  if (!session?.isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { name, jobTitle, company, quote, rating, photoUrl, scope, courseSlug, visible, sortOrder } = body

  if (!name || !quote) return NextResponse.json({ error: 'Name and quote are required' }, { status: 400 })

  const item = await prisma.testimonial.create({
    data: {
      name,
      jobTitle: jobTitle ?? null,
      company: company ?? null,
      quote,
      rating: Number(rating ?? 5),
      photoUrl: photoUrl ?? null,
      scope: scope ?? 'global',
      courseSlug: scope === 'course' ? (courseSlug ?? null) : null,
      visible: Boolean(visible),
      sortOrder: Number(sortOrder ?? 0),
      source: 'manual',
    },
  })

  return NextResponse.json(item)
}
