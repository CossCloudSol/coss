import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-guard'
import { prisma } from '@/lib/db'
import { revalidatePaths, getTestimonialRevalidationPaths } from '@/lib/revalidate'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const guard = await requireAdmin(req)
  if (guard instanceof Response) return guard

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

  await revalidatePaths(getTestimonialRevalidationPaths())
  return NextResponse.json({ ok: true, count: created.count })
}
