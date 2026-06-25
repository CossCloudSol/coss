import { prisma } from '@/lib/db'
import fs from 'fs'
import path from 'path'

export async function syncRedirectsToConfig(): Promise<void> {
  const redirects = await prisma.redirect.findMany({
    where: { isActive: true },
    orderBy: { createdAt: 'asc' },
  })

  const redirectsArray = redirects.length === 0
    ? '[]'
    : `[\n${redirects.map(r => `    {
      source: '${r.source}',
      destination: '${r.destination}',
      permanent: ${r.statusCode === 301},
    }`).join(',\n')}\n  ]`

  const configPath = path.join(process.cwd(), 'next.config.mjs')

  const original = fs.readFileSync(configPath, 'utf-8')
  fs.writeFileSync(configPath + '.bak', original, 'utf-8')

  const updated = original.replace(
    /async\s+redirects\s*\(\s*\)\s*\{[\s\S]*?return\s+\[[\s\S]*?\]\s*;?\s*\}/,
    `async redirects() {\n  return ${redirectsArray};\n  }`
  )

  if (updated === original && !original.includes('async redirects')) {
    const withRedirects = original.replace(
      /const nextConfig\s*=\s*\{/,
      `const nextConfig = {\n  async redirects() {\n    return ${redirectsArray};\n  },`
    )
    fs.writeFileSync(configPath, withRedirects, 'utf-8')
  } else {
    fs.writeFileSync(configPath, updated, 'utf-8')
  }
}
