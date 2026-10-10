import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-guard'
import { prisma } from '@/lib/db'
import { revalidatePaths, getTestimonialRevalidationPaths } from '@/lib/revalidate'

export const dynamic = 'force-dynamic'

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const guard = await requireAdmin(req)
  if (guard instanceof Response) return guard

  const body = await req.json()
  const { name, jobTitle, company, quote, rating, photoUrl, scope, courseSlug, visible, sortOrder } = body

  const item = await prisma.testimonial.update({
    where: { id: params.id },
    data: {
      ...(name !== undefined && { name }),
      ...(jobTitle !== undefined && { jobTitle }),
      ...(company !== undefined && { company }),
      ...(quote !== undefined && { quote }),
      ...(rating !== undefined && { rating: Number(rating) }),
      ...(photoUrl !== undefined && { photoUrl }),
      ...(scope !== undefined && { scope }),
      ...(courseSlug !== undefined && { courseSlug: scope === 'course' ? courseSlug : null }),
      ...(visible !== undefined && { visible: Boolean(visible) }),
      ...(sortOrder !== undefined && { sortOrder: Number(sortOrder) }),
    },
  })

  await revalidatePaths(getTestimonialRevalidationPaths())
  return NextResponse.json(item)
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const guard = await requireAdmin(req)
  if (guard instanceof Response) return guard

  await prisma.testimonial.delete({ where: { id: params.id } })
  await revalidatePaths(getTestimonialRevalidationPaths())
  return NextResponse.json({ ok: true })
}
