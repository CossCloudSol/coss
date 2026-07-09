/**
 * Standalone script to call syncRedirectsToConfig() without TypeScript path aliases.
 * Reads all active DB redirects and writes them to next.config.mjs.
 * Usage: node scripts/run-sync-redirects.mjs
 */
import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const db = new PrismaClient()

// Keep in sync with src/lib/sync-redirects.ts INFRA_REDIRECTS
const INFRA_REDIRECTS = [
  { source: '/data-analytics-bi',                           destination: '/courses/data-analytics-bi',      permanent: true },
  { source: '/data-analytics-bi/',                          destination: '/courses/data-analytics-bi',      permanent: true },
  { source: '/software-testing-os',                         destination: '/courses/software-testing-os',    permanent: true },
  { source: '/software-testing-os/',                        destination: '/courses/software-testing-os',    permanent: true },
  { source: '/courses/cyber-security-networking',           destination: '/courses/cyber-security',         permanent: true },
  { source: '/courses/cyber-security-networking/',          destination: '/courses/cyber-security',         permanent: true },
  { source: '/courses/programming-full-stack-development',  destination: '/courses/programming-full-stack', permanent: true },
  { source: '/courses/programming-full-stack-development/', destination: '/courses/programming-full-stack', permanent: true },
  { source: '/blogs',                                       destination: '/blog',                           permanent: true },
  { source: '/blogs/',                                      destination: '/blog',                           permanent: true },
  { source: '/category/:path*',                             destination: '/courses',                        permanent: true },
  { source: '/tag/:path*',                                  destination: '/courses',                        permanent: true },
  { source: '/author/:path*',                               destination: '/',                               permanent: true },
  { source: '/training-institutes-in-hyderabad/:path*',     destination: '/courses',                        permanent: true },
  { source: '/coaching-centres-in-hyderabad/:path*',        destination: '/courses',                        permanent: true },
  { source: '/branches/:path*',                             destination: '/contact-us',                     permanent: true },
  { source: '/sql/mysql/:path*',                            destination: '/sql-training-institute-in-hyderabad', permanent: true },
]

const INFRA_SOURCES = new Set(INFRA_REDIRECTS.map(r => r.source))

function extractRedirectsArrayContent(source) {
  const match = source.match(/async\s+redirects\s*\(\s*\)\s*\{[\s\S]*?return\s+\[/)
  if (!match) return null
  const start = (match.index ?? 0) + match[0].length
  let depth = 1
  let i = start
  while (i < source.length && depth > 0) {
    if (source[i] === '[') depth++
    else if (source[i] === ']') depth--
    i++
  }
  return source.slice(start, i - 1)
}

function splitTopLevelObjects(content) {
  const objects = []
  let depth = 0
  let start = -1
  for (let i = 0; i < content.length; i++) {
    const ch = content[i]
    if (ch === '{') {
      if (depth === 0) start = i
      depth++
    } else if (ch === '}') {
      depth--
      if (depth === 0 && start !== -1) {
        objects.push(content.slice(start, i + 1))
        start = -1
      }
    }
  }
  return objects
}

async function main() {
  const configPath = path.join(__dirname, '..', 'next.config.mjs')
  const original = fs.readFileSync(configPath, 'utf-8')

  // Keep has: rules (e.g. bare domain → www)
  const arrayContent = extractRedirectsArrayContent(original)
  const hasRules = []
  if (arrayContent) {
    for (const obj of splitTopLevelObjects(arrayContent)) {
      if (/\bhas\s*:/.test(obj)) {
        const oneLine = obj.split('\n').map(l => l.trim()).filter(Boolean).join(' ')
        hasRules.push(oneLine)
      }
    }
  }

  // Fetch DB rules, filtering out any that conflict with infra
  const dbRedirects = (await db.redirect.findMany({
    where: { isActive: true },
    orderBy: { createdAt: 'asc' },
  })).filter(r => !INFRA_SOURCES.has(r.source))

  console.log(`DB rules: ${dbRedirects.length} (after filtering infra conflicts)`)

  // Keep in sync with src/lib/sync-redirects.ts: exact-match rules must be
  // written before wildcard rules, since Next.js redirects match in array
  // order (first match wins) regardless of specificity.
  const exactInfraRedirects = INFRA_REDIRECTS.filter(r => !r.source.includes(':'))
  const wildcardInfraRedirects = INFRA_REDIRECTS.filter(r => r.source.includes(':'))

  const lines = []

  if (hasRules.length > 0) {
    lines.push('      // preserved has: rules (bare domain → www)')
    for (const rule of hasRules) {
      lines.push(`      ${rule}`)
    }
  }

  lines.push('      // infrastructure redirects — exact-match (always preserved by sync-redirects)')
  for (const r of exactInfraRedirects) {
    lines.push(`      { source: '${r.source}', destination: '${r.destination}', permanent: ${r.permanent} }`)
  }

  if (dbRedirects.length > 0) {
    lines.push('      // DB-managed rules')
    for (const r of dbRedirects) {
      lines.push(`      { source: '${r.source}', destination: '${r.destination}', permanent: ${r.statusCode === 301} }`)
    }
  }

  lines.push('      // infrastructure redirects — wildcard (must stay after exact-match rules above)')
  for (const r of wildcardInfraRedirects) {
    lines.push(`      { source: '${r.source}', destination: '${r.destination}', permanent: ${r.permanent} }`)
  }

  const redirectsArray = lines.length === 0
    ? '[]'
    : `[\n${lines.join(',\n')},\n    ]`

  fs.writeFileSync(configPath + '.bak', original, 'utf-8')

  const updated = original.replace(
    /async\s+redirects\s*\(\s*\)\s*\{[\s\S]*?return\s+\[[\s\S]*?\]\s*;?\s*\}/,
    `async redirects() {\n    return ${redirectsArray};\n  }`
  )

  fs.writeFileSync(configPath, updated, 'utf-8')
  console.log(`next.config.mjs updated — ${lines.filter(l => l.trim().startsWith('{')).length} redirect rules written`)
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => db.$disconnect())
