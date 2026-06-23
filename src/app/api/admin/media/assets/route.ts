import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { listAssets } from '@/lib/cloudinary-admin'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const probe = NextResponse.next()
  const session = await getSession(req, probe)
  if (!session.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = req.nextUrl
  const cursor        = searchParams.get('cursor') ?? undefined
  const prefix        = searchParams.get('prefix') ?? undefined
  const resource_type = (searchParams.get('type') ?? 'image') as 'image' | 'raw'

  try {
    const data = await listAssets({ max_results: 20, next_cursor: cursor, prefix, resource_type })
    return NextResponse.json(data)
  } catch (err) {
    console.error('[media/assets GET]', err)
    return NextResponse.json({ error: 'Failed to fetch assets' }, { status: 500 })
  }
}
