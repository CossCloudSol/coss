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

/** Resolves a manual OVERRIDES href against the live coursePool/SLUG_MAP — throws if it no longer exists, since these are meant to be verified live survivors. */
function resolveOverride(
  postSlug: string,
  href: string,
  coursePool: CalloutCourseInput[],
  coursesBySlug: Map<string, CalloutCourseInput>
): CalloutTarget {
  if (href.startsWith('/courses/')) {
    const course = coursePool.find((c) => getCourseUrl(c) === href)
    if (!course) {
      throw new Error(`[blog-course-callout] override for post "${postSlug}" points to "${href}", which does not resolve to a published course`)
    }
    return {
      kind: 'course',
      title: course.title,
      description: `Learn more about our ${course.title} course — structured curriculum with placement support.`,
      href,
    }
  }

  const flatSlug = href.slice(1)
  const dbSlug = SLUG_MAP[flatSlug]
  const course = dbSlug ? coursesBySlug.get(dbSlug) : undefined
  if (!course) {
    throw new Error(`[blog-course-callout] override for post "${postSlug}" points to "${href}", which does not resolve via SLUG_MAP to a published course`)
  }
  return {
    kind: 'flat',
    title: course.title,
    description: `Continue exploring ${course.title} at our training institute in Hyderabad.`,
    href,
  }
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

// Manual corrections for posts the token-overlap matcher below sends to the
// wrong course family (e.g. generic "cloud computing" posts landing on
// quantum computing) or that shouldn't get a callout at all (`null`).
// Takes precedence over bestMatch. Every non-null href is validated against
// the live coursePool/SLUG_MAP in matchPostToCallout — reviewed 2026-07-26
// against the flat-legacy consolidation survivors.
const OVERRIDES: Record<string, string | null> = {
  // Wrong-family fixes
  'learning-tally-with-coss-cloud-solutions-in-dilsukhnagar-hyderabad': '/tally-erp-training-institute-in-hyderabad',
  'machine-learning-training-in-hyderabad': '/courses/machine-learning-training-institute-in-hyderabad',
  'sap-fico-training-in-hyderabad': '/courses/erp-crm-enterprise-tools/sap-fico-training-institute-in-hyderabad',
  'cloud-computing-classes-with-coss-cloud-solutions-in-hyderabad': '/courses/multi-cloud-architecture-training-in-hyderabad',
  'cloud-computing-future-in-hyderabad-with-coss-cloud-solutions': '/courses/multi-cloud-architecture-training-in-hyderabad',
  'cloud-computing-training-in-hyderabad-the-best-career-move-in-2025': '/courses/multi-cloud-architecture-training-in-hyderabad',
  'cloud-computing-training-institute-in-dilsukhnagar-hyderabad': '/courses/multi-cloud-architecture-training-in-hyderabad',
  'best-full-stack-java-training-institute-in-dilsukhnagar-hyderabad-coss-cloud-solutions': '/java-training-institute-in-hyderabad',
  'best-python-institute-in-dilsukhnagar-hyderabad-coss-cloud-solutions': '/python-training-institute-in-hyderabad',
  'best-python-institute-in-hyderabad-coss-cloud-solutions': '/python-training-institute-in-hyderabad',
  'full-stack-power-bi-training-in-dilsukhnagar-hyderabad': '/power-bi-training-institute-in-hyderabad',

  // Data science / analytics → their real courses (top-performing pages)
  'data-science-course-hyderabad-choosing-institute': '/courses/data-science-training-institute-in-hyderabad',
  'data-science-training-dilsukhnagar-hyderabad': '/courses/data-science-training-institute-in-hyderabad',
  'data-science-training-institute-in-dilsukhnagar-coss-cloud-solutions': '/courses/data-science-training-institute-in-hyderabad',
  'data-science-training-in-hyderabad': '/courses/data-science-training-institute-in-hyderabad',
  'data-analytics-course-hyderabad-beginners': '/courses/data-analytics-training-institute-in-hyderabad',
  'data-analytics-institute-in-dilsukhnagar-hyderabad': '/courses/data-analytics-training-institute-in-hyderabad',
  'data-analytics-training-in-hyderabad': '/courses/data-analytics-training-institute-in-hyderabad',
  'ai-career-growth-hyderabad': '/courses/artificial-intelligence-training/artificial-intelligence-ai-training-hyderabad',

  // DevOps/AWS family precision (generic devops ≠ aws-devops ≠ azure-devops)
  'devops-institute-in-dilsukhnagar-hyderabad': '/devops-training-institute-in-hyderabad',
  'devops-training-in-dilsukhnagar': '/devops-training-institute-in-hyderabad',
  'best-institute-for-devops-in-hyderabad-coss-cloud-solutions': '/devops-training-institute-in-hyderabad',
  'advance-your-career-at-the-top-devops-institute-in-dilsukhnagar-coss-cloud-solutions': '/devops-training-institute-in-hyderabad',
  'devops-training-in-hyderabad-with-coss-cloud-solutions': '/courses/devops-training-institute-in-hyderabad',
  'job-opportunities-for-devops-professionals-in-hyderabad': '/courses/devops-training-institute-in-hyderabad',
  'learn-aws-devops-in-hyderabad-with-coss-cloud-solutions': '/courses/devops-multi-cloud/kubernetes-docker-devops-training-in-hyderabad',
  'learn-aws-devops-from-industry-experts-at-coss-cloud-solutions-hyderabad': '/courses/devops-multi-cloud/kubernetes-docker-devops-training-in-hyderabad',
  'multi-cloud-devops-course-hyderabad-career-guide': '/courses/multi-cloud-architecture-training-in-hyderabad',
  'best-aws-institutes-in-hyderabad-coss-cloud-solutions': '/aws-training-institute-in-hyderabad',
  'join-our-industry-leading-aws-cloud-institute-in-dilsukhnagar-hyderabad': '/aws-training-institute-in-hyderabad',

  // Junk posts — no callout
  '77674-2': null,
  a: null,
}

/**
 * Deterministic post → course/flat-page match for the blog-to-course callout.
 * No randomness, no dates, no runtime fetch beyond the given coursePool —
 * safe to bake into an ISR-cached page.
 */
export function matchPostToCallout(post: CalloutPostInput, coursePool: CalloutCourseInput[]): CalloutTarget | null {
  const coursesBySlug = new Map(coursePool.map((c) => [c.slug, c]))

  if (post.slug in OVERRIDES) {
    const overrideHref = OVERRIDES[post.slug]
    if (overrideHref === null) return null
    return resolveOverride(post.slug, overrideHref, coursePool, coursesBySlug)
  }

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
