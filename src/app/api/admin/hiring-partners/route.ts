import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-guard'
import { prisma } from '@/lib/db'
import { revalidatePaths, getHiringPartnerRevalidationPaths } from '@/lib/revalidate'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const guard = await requireAdmin(req)
  if (guard instanceof Response) return guard

  const partners = await prisma.hiringPartner.findMany({
    orderBy: { sortOrder: 'asc' },
  })
  return NextResponse.json(partners)
}

export async function POST(req: NextRequest) {
  const guard = await requireAdmin(req)
  if (guard instanceof Response) return guard

  const body = await req.json()
  const { name, logoUrl, altText, website, isVisible, sortOrder } = body

  if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 })

  const partner = await prisma.hiringPartner.create({
    data: {
      name,
      logoUrl: logoUrl ?? '',
      altText: altText ?? '',
      website: website ?? '',
      isVisible: isVisible ?? true,
      sortOrder: Number(sortOrder ?? 0),
    },
  })
  await revalidatePaths(getHiringPartnerRevalidationPaths())
  return NextResponse.json(partner)
}
