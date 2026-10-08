// Resolves a site path through the redirect rules the site serves (redirects.config.mjs),
// the way Next.js applies them: rules in order, first match wins, then follow the chain.
// The sitemap uses it so it only ever lists final URLs (item 10).
// Dependency-free (unit-tested in scripts/test/sitemap-final-urls.test.mjs).

export type RedirectRule = {
  source: string
  destination: string
  permanent?: boolean
  has?: unknown
  missing?: unknown
}

type Compiled = { re: RegExp; names: string[]; rule: RedirectRule }

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/** The source-pattern subset the rules use: literal segments, ":name" (one segment), ":name*" (zero or more). */
function compile(rule: RedirectRule): Compiled {
  const names: string[] = []
  let re = ''
  for (const seg of rule.source.split('/').slice(1)) {
    const m = seg.match(/^:(\w+)(\*)?$/)
    if (m) {
      names.push(m[1])
      re += m[2] ? '(?:/(.*))?' : '/([^/]+)'
    } else {
      re += `/${escapeRe(seg)}`
    }
  }
  return { re: new RegExp(`^${re || '/'}$`), names, rule }
}

const cache = new WeakMap<ReadonlyArray<RedirectRule>, Compiled[]>()

function compiled(rules: ReadonlyArray<RedirectRule>): Compiled[] {
  let c = cache.get(rules)
  if (!c) {
    // Host/header-conditional rules (e.g. bare domain → www) never apply to our own www URLs.
    c = rules.filter((r) => !r.has && !r.missing).map(compile)
    cache.set(rules, c)
  }
  return c
}

function apply(path: string, rules: ReadonlyArray<RedirectRule>): string | undefined {
  for (const { re, names, rule } of compiled(rules)) {
    const m = path.match(re)
    if (!m) continue
    let dest = rule.destination
    names.forEach((name, i) => {
      dest = dest.replace(new RegExp(`:${name}\\*?`, 'g'), m[i + 1] ?? '')
    })
    dest = dest.replace(/\/{2,}/g, '/')
    return dest.length > 1 ? dest.replace(/\/$/, '') : dest
  }
  return undefined
}

/**
 * The URL path a visitor finally lands on: `path` itself when no rule matches; null when
 * the chain leaves the site or loops (more than 10 hops). Absolute destinations on
 * `siteOrigin` are treated as paths.
 */
export function finalPath(path: string, rules: ReadonlyArray<RedirectRule>, siteOrigin = 'https://www.cosscloudsol.com'): string | null {
  let current = path
  const seen = new Set<string>([current])
  for (let hop = 0; hop < 10; hop++) {
    let next = apply(current, rules)
    if (next === undefined) return current
    if (next.startsWith(siteOrigin)) next = next.slice(siteOrigin.length) || '/'
    if (!next.startsWith('/')) return null
    if (seen.has(next)) return null
    seen.add(next)
    current = next
  }
  return null
}

/**
 * Sitemap entries with every URL replaced by its final URL: a redirecting URL becomes the
 * page it lands on (or is dropped when that leaves the site), and duplicates keep their
 * first entry.
 */
export function toFinalSitemap<T extends { url: string }>(entries: ReadonlyArray<T>, baseUrl: string, rules: ReadonlyArray<RedirectRule>): T[] {
  const out: T[] = []
  const seen = new Set<string>()
  for (const entry of entries) {
    if (!entry.url.startsWith(baseUrl)) continue
    const path = entry.url.slice(baseUrl.length) || '/'
    const final = finalPath(path, rules, baseUrl)
    if (final === null) continue
    const url = final === path ? entry.url : `${baseUrl}${final === '/' ? '' : final}`
    if (seen.has(url)) continue
    seen.add(url)
    out.push(url === entry.url ? entry : { ...entry, url })
  }
  return out
}
