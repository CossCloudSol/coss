import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { getSession } from '@/lib/session'

export const dynamic = 'force-dynamic'

// Manual cache-purge for ISR pages. Query-string cache-busting does not work
// on ISR routes (the cache key is pathname only), so a stale page can only be
// cleared by calling revalidatePath() directly. Not wired into any deploy
// hook — trigger by hand after a deploy that changed content on these paths.
export async function POST(req: NextRequest) {
  const probe = NextResponse.next()
  const session = await getSession(req, probe)
  const caller = session?.email ?? session?.name ?? (session?.isAdmin ? 'superadmin' : null)

  if (!session?.isAdmin) {
    console.warn('[revalidate] Unauthorized attempt', { paths: null, caller: null })
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json().catch(() => null)
  const rawPaths = body?.paths ?? (body?.path ? [body.path] : null)

  if (!Array.isArray(rawPaths) || rawPaths.length === 0 || !rawPaths.every((p) => typeof p === 'string' && p.startsWith('/'))) {
    return NextResponse.json(
      { error: 'Provide { paths: string[] } with paths starting with /' },
      { status: 400 }
    )
  }

  const paths: string[] = rawPaths

  for (const path of paths) {
    revalidatePath(path)
  }

  console.warn('[revalidate] Purged cache', { paths, caller })

  return NextResponse.json({ ok: true, revalidated: paths, caller })
}
