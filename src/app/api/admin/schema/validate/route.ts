import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const probe = NextResponse.next()
  const session = await getSession(req, probe)
  if (!session?.isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { url } = await req.json()
  if (!url) return NextResponse.json({ error: 'URL required' }, { status: 400 })

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'CossSchemaValidator/1.0' },
      signal: AbortSignal.timeout(10000),
    })
    const html = await res.text()

    const schemas: object[] = []
    const regex = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
    let match: RegExpExecArray | null
    while ((match = regex.exec(html)) !== null) {
      try {
        const parsed = JSON.parse(match[1].trim())
        schemas.push(parsed)
      } catch {}
    }

    return NextResponse.json({
      url,
      count: schemas.length,
      schemas,
      richResultsUrl: `https://search.google.com/test/rich-results?url=${encodeURIComponent(url)}`,
    })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch URL' }, { status: 500 })
  }
}
