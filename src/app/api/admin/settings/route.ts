import { NextRequest, NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const probe = NextResponse.next()
  const session = await getSession(req, probe)
  if (!session?.isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const settings = await prisma.siteSettings.findFirst()
  return NextResponse.json(settings ?? {})
}

export async function PATCH(req: NextRequest) {
  const probe = NextResponse.next()
  const session = await getSession(req, probe)
  if (!session?.isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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
