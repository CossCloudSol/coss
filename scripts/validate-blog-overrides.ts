// READ-ONLY. No writes.
//
// Validates every entry in blog-course-callout.ts's OVERRIDES map against the
// live published-course set by calling the real resolveOverride() — not a
// reimplementation of its branching. Catches exactly the failure mode that
// took down /blog/ai-career-growth-hyderabad: an override (course slug or
// hardcoded path) that no longer resolves to anything live.
//
// Usage: npx tsx scripts/validate-blog-overrides.ts
// Exits non-zero if any entry fails to resolve.
import { PrismaClient } from '@prisma/client'
import { getPublishedCoursesForMatching } from '../src/lib/course-queries'
import { OVERRIDES, resolveOverride, type CalloutCourseInput } from '../src/lib/blog-course-callout'

const prisma = new PrismaClient()

async function main() {
  const coursePool = await getPublishedCoursesForMatching()
  const coursesBySlug = new Map<string, CalloutCourseInput>(coursePool.map((c) => [c.slug, c]))

  const entries = Object.entries(OVERRIDES)
  const failures: string[] = []

  for (const [postSlug, override] of entries) {
    if (override === null) {
      console.log(`OK    (null/no-callout)  "${postSlug}"`)
      continue
    }

    // resolveOverride() itself console.errors the specific reason on failure —
    // that's the "with the reason" output this script is required to surface.
    const target = resolveOverride(postSlug, override, coursesBySlug)
    if (target === null) {
      failures.push(postSlug)
      console.log(`FAIL  "${postSlug}" -> ${JSON.stringify(override)}`)
    } else {
      console.log(`OK    [${target.kind}] "${postSlug}" -> ${target.href}`)
    }
  }

  console.log('')
  console.log(`${failures.length} failing of ${entries.length} OVERRIDES entries`)
  if (failures.length > 0) {
    console.log('Failing post slugs: ' + failures.join(', '))
  }

  await prisma.$disconnect()
  if (failures.length > 0) process.exit(1)
}

main().catch(async (e) => {
  console.error(e)
  await prisma.$disconnect()
  process.exit(1)
})
