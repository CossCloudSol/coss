import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  const partners = await prisma.hiringPartner.findMany({
    where: { isVisible: true },
    orderBy: { sortOrder: 'asc' },
    select: { id: true, name: true, logoUrl: true, altText: true, website: true },
  })
  return NextResponse.json(partners)
}
