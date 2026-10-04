import { NextRequest, NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import { requireAdmin } from '@/lib/admin-guard'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const guard = await requireAdmin(req)
  if (guard instanceof Response) return guard
  const settings = await prisma.siteSettings.findFirst()
  return NextResponse.json(settings ?? {})
}

export async function PATCH(req: NextRequest) {
  const guard = await requireAdmin(req)
  if (guard instanceof Response) return guard
  const body = await req.json()
  const existing = await prisma.siteSettings.findFirst()
  if (existing) {
    const updated = await prisma.siteSettings.update({ where: { id: existing.id }, data: body })
    revalidateTag('site-settings')
    return NextResponse.json(updated)
  }
  const created = await prisma.siteSettings.create({ data: body })
  revalidateTag('site-settings')
  return NextResponse.json(created)
}
