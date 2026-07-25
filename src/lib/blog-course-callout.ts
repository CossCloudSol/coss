import { SLUG_MAP } from '@/lib/get-landing-page-data'
import { getFlatCourseUrl } from '@/lib/flat-url'
import { getCourseUrl } from '@/lib/course-url'

export interface CalloutPostInput {
  slug: string
  title: string
  tags: string[]
  categories: string[]
}

export interface CalloutCourseInput {
  id: string
  title: string
  slug: string
  category: string
  categorySlug: string | null
  urlType: string
  highlights: string[]
  tools: string[]
}

export interface CalloutTarget {
  kind: 'flat' | 'course'
  title: string
  description: string
  href: string
}

// Generic/brand/locale words that would otherwise dominate every match —
// excluded so scoring reflects the technology/topic overlap, not boilerplate
// shared by nearly every course and flat-legacy page title.
const STOP_WORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'as',
  'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will',
  'would', 'could', 'should', 'may', 'might', 'shall', 'can', 'into', 'its', 'your', 'our', 'their',
  'this', 'that', 'these', 'those', 'top', 'best', 'how', 'why', 'what', 'which', 'who', 'when', 'where',
  'training', 'institute', 'institutes', 'course', 'courses', 'classes', 'class', 'center', 'centre',
  'centres', 'centers', 'hyderabad', 'near', 'me', 'coss', 'cloud', 'solutions', 'solution', 'you', 'get', 'new',
])

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length >= 3 && !STOP_WORDS.has(w))
}

function tokenSet(parts: Array<string | undefined | null>): Set<string> {
  const tokens = parts.filter((p): p is string => Boolean(p)).flatMap((p) => tokenize(p))
  return new Set(tokens)
}

const LOCALITY_NAMES = ['dilsukhnagar', 'ameerpet', 'kukatpally', 'madhapur', 'hitec', 'hitech']

export function isInstituteOrLocalityFlavored(slug: string, title: string): boolean {
  const haystack = `${slug} ${title}`.toLowerCase()
  if (haystack.includes('institute')) return true
  return LOCALITY_NAMES.some((loc) => haystack.includes(loc))
}

const FLAT_STEM_SUFFIXES = [
  '-training-institute-in-hyderabad',
  '-training-in-hyderabad',
  '-institute-in-hyderabad',
  '-in-hyderabad',
]

function deriveFlatStem(flatSlug: string): string {
  for (const suffix of FLAT_STEM_SUFFIXES) {
    if (flatSlug.endsWith(suffix)) return flatSlug.slice(0, -suffix.length)
  }
  return flatSlug
}

interface FlatCandidate {
  slug: string
  tokens: string[]
}

function getFlatCandidates(): FlatCandidate[] {
  return Object.keys(SLUG_MAP).map((slug) => ({
    slug,
    tokens: tokenize(deriveFlatStem(slug).replace(/-/g, ' ')),
  }))
}

interface Scored<T> {
  item: T
  score: number
  matchedLength: number
}

/** Highest-score match within one pool; ties broken by longest total matched-token length, then slug ascending. */
function bestMatch<T>(candidates: T[], getTokens: (item: T) => string[], getSlug: (item: T) => string, postTokens: Set<string>): Scored<T> | null {
  const scored = candidates
    .map((item) => {
      const matched = getTokens(item).filter((t) => postTokens.has(t))
      return { item, score: matched.length, matchedLength: matched.reduce((sum, t) => sum + t.length, 0) }
    })
    .filter((c) => c.score > 0)

  if (scored.length === 0) return null

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score
    if (b.matchedLength !== a.matchedLength) return b.matchedLength - a.matchedLength
    return getSlug(a.item) < getSlug(b.item) ? -1 : 1
  })

  return scored[0]
}

/**
 * Deterministic post → course/flat-page match for the blog-to-course callout.
 * No randomness, no dates, no runtime fetch beyond the given coursePool —
 * safe to bake into an ISR-cached page.
 */
export function matchPostToCallout(post: CalloutPostInput, coursePool: CalloutCourseInput[]): CalloutTarget | null {
  const postTokens = tokenSet([post.slug.replace(/-/g, ' '), post.title, ...post.tags, ...post.categories])
  if (postTokens.size === 0) return null

  const bestFlat = bestMatch(getFlatCandidates(), (c) => c.tokens, (c) => c.slug, postTokens)
  const bestCourse = bestMatch(
    coursePool,
    (c) => tokenize([c.title, c.category, ...c.tools].join(' ')),
    (c) => c.slug,
    postTokens
  )

  const preferFlat = isInstituteOrLocalityFlavored(post.slug, post.title)
  const coursesBySlug = new Map(coursePool.map((c) => [c.slug, c]))

  function resolveFlat(): CalloutTarget | null {
    if (!bestFlat) return null
    const dbSlug = SLUG_MAP[bestFlat.item.slug]
    const course = dbSlug ? coursesBySlug.get(dbSlug) : undefined
    if (!course) {
      console.warn(`[blog-course-callout] flat match "${bestFlat.item.slug}" for post "${post.slug}" has no resolvable course title — skipping`)
      return null
    }
    return {
      kind: 'flat',
      title: course.title,
      description: `Continue exploring ${course.title} at our training institute in Hyderabad.`,
      href: getFlatCourseUrl(bestFlat.item.slug),
    }
  }

  function resolveCourse(): CalloutTarget | null {
    if (!bestCourse) return null
    const course = bestCourse.item
    return {
      kind: 'course',
      title: course.title,
      description: `Learn more about our ${course.title} course — structured curriculum with placement support.`,
      href: getCourseUrl(course),
    }
  }

  if (preferFlat) {
    return resolveFlat() ?? resolveCourse()
  }
  return resolveCourse() ?? resolveFlat()
}
