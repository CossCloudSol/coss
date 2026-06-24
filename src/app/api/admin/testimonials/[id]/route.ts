import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const probe = NextResponse.next()
  const session = await getSession(req, probe)
  if (!session?.isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

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

  return NextResponse.json(item)
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const probe = NextResponse.next()
  const session = await getSession(req, probe)
  if (!session?.isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await prisma.testimonial.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}
