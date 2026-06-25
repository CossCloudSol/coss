import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/db'
import { syncRedirectsToConfig } from '@/lib/sync-redirects'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const probe = NextResponse.next()
  const session = await getSession(req, probe)
  if (!session?.isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { items } = await req.json()
  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: 'No items provided' }, { status: 400 })
  }

  const results = { created: 0, skipped: 0 }

  for (const item of items) {
    if (!item.source?.startsWith('/') || !item.destination) {
      results.skipped++
      continue
    }
    try {
      await prisma.redirect.create({
        data: {
          source:      item.source,
          destination: item.destination,
          statusCode:  Number(item.statusCode ?? 301),
          isActive:    true,
        },
      })
      results.created++
    } catch {
      results.skipped++
    }
  }

  await syncRedirectsToConfig()
  return NextResponse.json({ ok: true, ...results })
}
