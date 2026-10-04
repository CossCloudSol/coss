import { NextRequest, NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import { requireAdmin } from '@/lib/admin-guard'
import { prisma } from '@/lib/db'
import { pickFields, SITE_SETTINGS_FIELDS } from '@/lib/pick-fields'
import type { Prisma } from '@prisma/client'

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
  const picked = pickFields(await req.json().catch(() => null), SITE_SETTINGS_FIELDS)
  if ('error' in picked) return NextResponse.json({ error: picked.error }, { status: 400 })
  const data = picked.data as Prisma.SiteSettingsUpdateInput
  const existing = await prisma.siteSettings.findFirst()
  if (existing) {
    const updated = await prisma.siteSettings.update({ where: { id: existing.id }, data })
    revalidateTag('site-settings')
    return NextResponse.json(updated)
  }
  const created = await prisma.siteSettings.create({ data: data as Prisma.SiteSettingsCreateInput })
  revalidateTag('site-settings')
  return NextResponse.json(created)
}
