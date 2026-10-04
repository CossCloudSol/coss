import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-guard'
import { prisma } from '@/lib/db'
import { syncRedirectsToConfig } from '@/lib/sync-redirects'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const guard = await requireAdmin(req)
  if (guard instanceof Response) return guard

  const redirects = await prisma.redirect.findMany({
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(redirects)
}

export async function POST(req: NextRequest) {
  const guard = await requireAdmin(req)
  if (guard instanceof Response) return guard

  const body = await req.json()
  const { source, destination, statusCode, isActive } = body

  if (!source || !destination) {
    return NextResponse.json({ error: 'Source and destination are required' }, { status: 400 })
  }
  if (!source.startsWith('/')) {
    return NextResponse.json({ error: 'Source must start with /' }, { status: 400 })
  }

  const redirect = await prisma.redirect.create({
    data: {
      source,
      destination,
      statusCode: Number(statusCode ?? 301),
      isActive: isActive ?? true,
    },
  })

  await syncRedirectsToConfig()

  return NextResponse.json(redirect)
}
