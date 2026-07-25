import { prisma } from '@/lib/db'

export interface RelatedCourseItem {
  id: string
  title: string
  slug: string
  duration: string
  urlType: string
  categorySlug: string | null
}

/**
 * Deterministic sibling selection: sort the pool by id ascending (stable, no
 * ties), locate the current course, then walk forward (N+1, N+2, N+3) mod
 * length, skipping self. Must stay pure and free of randomness/dates/counters
 * — output is baked into ISR-cached pages and must be identical across builds.
 */
export function selectRoundRobinSiblings<T extends { id: string }>(
  pool: T[],
  currentId: string,
  count = 3
): T[] {
  const sorted = [...pool].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))
  const n = sorted.findIndex((c) => c.id === currentId)
  if (n === -1 || sorted.length <= 1) return []

  const maxPick = Math.min(count, sorted.length - 1)
  const result: T[] = []
  for (let offset = 1; result.length < maxPick && offset <= sorted.length; offset++) {
    const idx = (n + offset) % sorted.length
    if (idx !== n) result.push(sorted[idx])
  }
  return result
}

export async function getRelatedCourses(
  categorySlug: string | null | undefined,
  currentCourseId: string
): Promise<RelatedCourseItem[]> {
  if (!categorySlug) return []
  const pool = await prisma.course.findMany({
    where: { categorySlug, status: 'published' },
    select: { id: true, title: true, slug: true, duration: true, urlType: true, categorySlug: true },
  })
  return selectRoundRobinSiblings(pool, currentCourseId)
}
