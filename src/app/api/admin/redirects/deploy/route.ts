import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const probe = NextResponse.next()
  const session = await getSession(req, probe)
  if (!session?.isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const hookUrl = process.env.VERCEL_DEPLOY_HOOK_URL
  if (!hookUrl) {
    return NextResponse.json(
      { error: 'VERCEL_DEPLOY_HOOK_URL not configured' },
      { status: 500 }
    )
  }

  const res = await fetch(hookUrl, { method: 'POST' })
  if (!res.ok) {
    return NextResponse.json({ error: 'Deploy hook failed' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, message: 'Deploy triggered — live in ~2 minutes' })
}
