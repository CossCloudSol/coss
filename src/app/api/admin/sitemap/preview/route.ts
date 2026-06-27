import { NextResponse, type NextRequest } from 'next/server'
import { getSession } from '@/lib/session'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.cosscloudsol.com'

export async function GET(req: NextRequest): Promise<Response> {
  const probe = NextResponse.next()
  const session = await getSession(req, probe)
  if (!session.isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    // Call the sitemap function directly to avoid circular HTTP fetching in dev
    const sitemapFn = (await import('@/app/sitemap')).default
    const entries = await sitemapFn()

    const lines = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
      ...entries.map(e => {
        const lastMod = e.lastModified
          ? (e.lastModified instanceof Date
              ? e.lastModified.toISOString().split('T')[0]
              : String(e.lastModified))
          : ''
        return [
          '  <url>',
          `    <loc>${e.url}</loc>`,
          lastMod ? `    <lastmod>${lastMod}</lastmod>` : '',
          e.changeFrequency ? `    <changefreq>${e.changeFrequency}</changefreq>` : '',
          e.priority !== undefined ? `    <priority>${e.priority}</priority>` : '',
          '  </url>',
        ].filter(Boolean).join('\n')
      }),
      '</urlset>',
    ]

    const xml = lines.join('\n')
    return NextResponse.json({ xml, count: entries.length })
  } catch (err) {
    console.error('[GET /api/admin/sitemap/preview]', err)
    return NextResponse.json({ error: 'Could not generate sitemap preview' }, { status: 500 })
  }
}
