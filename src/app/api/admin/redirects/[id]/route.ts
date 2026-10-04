import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-guard'
import { prisma } from '@/lib/db'
import { syncRedirectsToConfig } from '@/lib/sync-redirects'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const guard = await requireAdmin(req)
  if (guard instanceof Response) return guard

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
  const guard = await requireAdmin(req)
  if (guard instanceof Response) return guard

  await prisma.redirect.delete({ where: { id: params.id } })
  await syncRedirectsToConfig()
  return NextResponse.json({ ok: true })
}
