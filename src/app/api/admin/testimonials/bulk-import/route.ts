import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const probe = NextResponse.next()
  const session = await getSession(req, probe)
  if (!session?.isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { items } = await req.json()
  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: 'No items provided' }, { status: 400 })
  }

  const created = await prisma.testimonial.createMany({
    data: items.map((item: Record<string, unknown>, i: number) => ({
      name:       String(item.name ?? 'Anonymous'),
      quote:      String(item.quote ?? ''),
      rating:     Number(item.rating ?? 5),
      photoUrl:   item.photoUrl ? String(item.photoUrl) : null,
      scope:      String(item.scope ?? 'global'),
      courseSlug: item.courseSlug ? String(item.courseSlug) : null,
      visible:    false,
      sortOrder:  i,
      source:     String(item.source ?? 'import'),
      reviewDate: item.reviewDate ? String(item.reviewDate) : null,
    })),
    skipDuplicates: true,
  })

  return NextResponse.json({ ok: true, count: created.count })
}
