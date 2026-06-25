import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/db'
import { syncRedirectsToConfig } from '@/lib/sync-redirects'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const probe = NextResponse.next()
  const session = await getSession(req, probe)
  if (!session?.isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()

  const redirect = await prisma.redirect.update({
    where: { id: params.id },
    data: {
      ...(body.source      !== undefined && { source:      body.source }),
      ...(body.destination !== undefined && { destination: body.destination }),
      ...(body.statusCode  !== undefined && { statusCode:  Number(body.statusCode) }),
      ...(body.isActive    !== undefined && { isActive:    Boolean(body.isActive) }),
    },
  })

  await syncRedirectsToConfig()
  return NextResponse.json(redirect)
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const probe = NextResponse.next()
  const session = await getSession(req, probe)
  if (!session?.isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await prisma.redirect.delete({ where: { id: params.id } })
  await syncRedirectsToConfig()
  return NextResponse.json({ ok: true })
}
