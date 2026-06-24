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
  const partner = await prisma.hiringPartner.update({
    where: { id: params.id },
    data: {
      ...(body.name      !== undefined && { name:      body.name }),
      ...(body.logoUrl   !== undefined && { logoUrl:   body.logoUrl }),
      ...(body.altText   !== undefined && { altText:   body.altText }),
      ...(body.website   !== undefined && { website:   body.website }),
      ...(body.isVisible !== undefined && { isVisible: Boolean(body.isVisible) }),
      ...(body.sortOrder !== undefined && { sortOrder: Number(body.sortOrder) }),
    },
  })
  return NextResponse.json(partner)
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const probe = NextResponse.next()
  const session = await getSession(req, probe)
  if (!session?.isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await prisma.hiringPartner.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}
