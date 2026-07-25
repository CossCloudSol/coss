import { SLUG_MAP } from '@/lib/get-landing-page-data'
import { selectRoundRobinSiblings } from '@/lib/related-courses'

/**
 * Deterministic flat→flat sibling pool for the flat-legacy landing pages.
 * The pool is the live set of flat-legacy page slugs (SLUG_MAP keys) — never
 * hardcode this list, it must track SLUG_MAP so it can't drift out of sync.
 * Reuses selectRoundRobinSiblings (sort key = "id") by treating each flat
 * slug as its own id, which sorts the pool by slug ascending.
 */
export function getFlatSiblingSlugs(currentSlug: string, count = 3): string[] {
  const pool = Object.keys(SLUG_MAP).map((slug) => ({ id: slug }))
  const siblings = selectRoundRobinSiblings(pool, currentSlug, count)
  return siblings.map((s) => s.id)
}
