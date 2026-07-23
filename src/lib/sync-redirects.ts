import { prisma } from '@/lib/db'
import fs from 'fs'
import path from 'path'

// Infrastructure redirects that must always be written to next.config.mjs regardless of DB state.
// These are not stored in the Redirect table — managing them via DB would require a DB read on
// every Next.js request before the rewrites layer even fires, which defeats the purpose.
const INFRA_REDIRECTS = [
  // Canonical URL consolidation (legacy short paths → category pages)
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
  // Flat-legacy alias consolidation (GSC triage: zero impressions across 3 windows) — 2026-07-23
  { source: '/aws-cloud-training-institute-in-hyderabad',        destination: '/aws-training-institute-in-hyderabad',       permanent: true },
  { source: '/aws-devops-cloud-training-institute-in-hyderabad', destination: '/aws-devops-training-institute-in-hyderabad', permanent: true },
  { source: '/ccna-networking-training-institute-in-hyderabad',  destination: '/ccna-training-institute-in-hyderabad',      permanent: true },
  { source: '/cloud-computing-training-institute-in-hyderabad',      destination: '/courses/multi-cloud-architecture-training-in-hyderabad', permanent: true },
  { source: '/multi-cloud-engineer-training-in-hyderabad',           destination: '/courses/multi-cloud-architecture-training-in-hyderabad', permanent: true },
  { source: '/multi-cloud-engineer-training-institute-in-hyderabad', destination: '/courses/multi-cloud-architecture-training-in-hyderabad', permanent: true },
  { source: '/multi-cloud-devops-training-institute-in-hyderabad',   destination: '/courses/multi-cloud-architecture-training-in-hyderabad', permanent: true },
  { source: '/cloud-data-engineer-training-in-hyderabad',           destination: '/data-engineering-training-institute-in-hyderabad', permanent: true },
  { source: '/cloud-data-engineer-training-institute-in-hyderabad', destination: '/data-engineering-training-institute-in-hyderabad', permanent: true },
  { source: '/communication-skills-training-institute-in-hyderabad', destination: '/communication-skills-training-in-hyderabad', permanent: true },
  { source: '/erp-crm-training-institute-in-hyderabad',           destination: '/courses/erp-crm-enterprise-tools/salesforce-admin-developer-training-in-hyderabad', permanent: true },
  { source: '/oracle-fusion-hcm-training-in-hyderabad',           destination: '/courses/erp-crm-enterprise-tools/salesforce-admin-developer-training-in-hyderabad', permanent: true },
  { source: '/oracle-fusion-hcm-training-institute-in-hyderabad', destination: '/courses/erp-crm-enterprise-tools/salesforce-admin-developer-training-in-hyderabad', permanent: true },
  { source: '/java-full-stack-training-institute-in-hyderabad',   destination: '/java-training-institute-in-hyderabad', permanent: true },
  { source: '/salesforce-crm-training-institute-in-hyderabad',    destination: '/salesforce-training-institute-in-hyderabad', permanent: true },
  // WordPress taxonomy wildcard patterns (must be in config — DB is exact-match only)
  { source: '/category/:path*',                             destination: '/courses',                        permanent: true },
  { source: '/tag/:path*',                                  destination: '/courses',                        permanent: true },
  { source: '/author/:path*',                               destination: '/',                               permanent: true },
  { source: '/training-institutes-in-hyderabad/:path*',     destination: '/courses',                        permanent: true },
  { source: '/coaching-centres-in-hyderabad/:path*',        destination: '/courses',                        permanent: true },
  { source: '/branches/:path*',                             destination: '/contact-us',                     permanent: true },
  { source: '/sql/mysql/:path*',                            destination: '/sql-training-institute-in-hyderabad', permanent: true },
]

const INFRA_SOURCES = new Set(INFRA_REDIRECTS.map(r => r.source))

/** Returns everything between the outer `[` and `]` of `async redirects() { return [...] }` */
function extractRedirectsArrayContent(source: string): string | null {
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

/** Splits array content into top-level `{...}` object strings (handles nesting). */
function splitTopLevelObjects(content: string): string[] {
  const objects: string[] = []
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

export async function syncRedirectsToConfig(): Promise<void> {
  const configPath = path.join(process.cwd(), 'next.config.mjs')
  const original = fs.readFileSync(configPath, 'utf-8')

  // Read existing redirects and keep only those with a `has:` property (e.g. bare-domain → www).
  // These are infrastructure rules that must not be overwritten by DB state.
  const arrayContent = extractRedirectsArrayContent(original)
  const hasRules: string[] = []
  if (arrayContent) {
    for (const obj of splitTopLevelObjects(arrayContent)) {
      if (/\bhas\s*:/.test(obj)) {
        // Collapse multi-line object to a single line for clean, stable output
        const oneLine = obj.split('\n').map(l => l.trim()).filter(Boolean).join(' ')
        hasRules.push(oneLine)
      }
    }
  }

  // Fetch DB-managed rules, excluding any whose source conflicts with an infra rule
  const dbRedirects = (await prisma.redirect.findMany({
    where: { isActive: true },
    orderBy: { createdAt: 'asc' },
  })).filter(r => !INFRA_SOURCES.has(r.source))

  // Next.js redirects are matched in array order, first match wins — regardless
  // of specificity. A wildcard like /training-institutes-in-hyderabad/:path*
  // would otherwise shadow exact-match DB rules under the same prefix
  // (e.g. /training-institutes-in-hyderabad/dilsukhnagar) if it were written
  // first. So exact-match rules (infra + DB) always go before wildcard infra rules.
  const exactInfraRedirects = INFRA_REDIRECTS.filter(r => !r.source.includes(':'))
  const wildcardInfraRedirects = INFRA_REDIRECTS.filter(r => r.source.includes(':'))

  // Build combined lines: has-rules, exact infra rules, DB rules, then wildcard infra rules
  const lines: string[] = []

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

  // Wildcard infra rules go last so they never shadow a more specific exact-match rule above.
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
