import { NextResponse, type NextRequest } from 'next/server'
import { getSession } from '@/lib/session'
import fs from 'fs'
import path from 'path'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const ROBOTS_PATH = path.join(process.cwd(), 'src', 'app', 'robots.ts')

const DEFAULT_ROBOTS_CONTENT = `import type { MetadataRoute } from 'next';

const BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.cosscloudsol.com';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        // All crawlers: index public pages, block admin + API routes
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/api/'],
      },
      {
        // Prevent GPTBot (ChatGPT) from scraping without permission
        userAgent: 'GPTBot',
        disallow: ['/admin/', '/api/'],
      },
      {
        // Prevent CCBot (Common Crawl / AI training data) from admin/api
        userAgent: 'CCBot',
        disallow: ['/admin/', '/api/'],
      },
    ],
    sitemap: \`\${BASE_URL}/sitemap.xml\`,
    host: BASE_URL,
  };
}
`

export async function GET(req: NextRequest): Promise<Response> {
  const probe = NextResponse.next()
  const session = await getSession(req, probe)
  if (!session.isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let content = DEFAULT_ROBOTS_CONTENT
  try {
    content = fs.readFileSync(ROBOTS_PATH, 'utf-8')
  } catch {
    // file unreadable — return default
  }

  const preview = generateRobotsTxtPreview(content)
  return NextResponse.json({ content, preview })
}

export async function POST(req: NextRequest): Promise<Response> {
  const probe = NextResponse.next()
  const session = await getSession(req, probe)
  if (!session.isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: { rules?: Array<{ userAgent: string; allow?: string[]; disallow?: string[] }> }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const rules = body.rules ?? []

  const rulesCode = rules.map(r => {
    const allowLines  = (r.allow ?? []).map(a => `'${a}'`).join(', ')
    const disallowLines = (r.disallow ?? []).map(d => `'${d}'`).join(', ')
    return [
      '      {',
      `        userAgent: '${r.userAgent}',`,
      allowLines    ? `        allow: [${allowLines}],`    : null,
      disallowLines ? `        disallow: [${disallowLines}],` : null,
      '      }',
    ].filter(Boolean).join('\n')
  }).join(',\n')

  const newContent = `import type { MetadataRoute } from 'next';

const BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.cosscloudsol.com';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
${rulesCode}
    ],
    sitemap: \`\${BASE_URL}/sitemap.xml\`,
    host: BASE_URL,
  };
}
`

  try {
    fs.writeFileSync(ROBOTS_PATH, newContent, 'utf-8')
  } catch (err) {
    console.error('[POST /api/admin/sitemap/robots]', err)
    return NextResponse.json({ error: 'Could not write robots.ts' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}

function generateRobotsTxtPreview(tsContent: string): string {
  const lines: string[] = []
  // Extract userAgent values
  const agentMatches = [...tsContent.matchAll(/userAgent:\s*['"]([^'"]+)['"]/g)]
  // Extract allow values (arrays or single string)
  const allowMatches  = [...tsContent.matchAll(/allow:\s*(?:\[([^\]]*)\]|['"]([^'"]+)['"])/g)]
  // Extract disallow values
  const disallowMatches = [...tsContent.matchAll(/disallow:\s*\[([^\]]*)\]/g)]

  for (let i = 0; i < agentMatches.length; i++) {
    if (i > 0) lines.push('')
    lines.push(`User-agent: ${agentMatches[i][1]}`)

    // Try to pair allow entries
    const allowRaw = allowMatches[i]?.[1] ?? allowMatches[i]?.[2] ?? ''
    const allowPaths = allowRaw
      .split(',')
      .map(s => s.trim().replace(/['"]/g, ''))
      .filter(Boolean)
    allowPaths.forEach(p => lines.push(`Allow: ${p}`))

    const disallowRaw = disallowMatches[i]?.[1] ?? ''
    const disallowPaths = disallowRaw
      .split(',')
      .map(s => s.trim().replace(/['"]/g, ''))
      .filter(Boolean)
    disallowPaths.forEach(p => lines.push(`Disallow: ${p}`))
  }

  return lines.join('\n') || '# Could not parse rules'
}
