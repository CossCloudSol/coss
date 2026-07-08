// scripts/fix-broken-trainer-sentences.mjs
// Fixes grammatically broken sentences left by the previous naive [TRAINER_NAME] replacement.
// Each fix is context-specific — not another blind find-replace.
// Run: node --env-file=.env scripts/fix-broken-trainer-sentences.mjs
import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

// ── Per-course fixes ──────────────────────────────────────────────────────────
// Each entry: { slug, before, after } — exact substring match + replace.
// Multiple entries per slug are applied in order.
const FIXES = [
  // ── Azure Data Factory ───────────────────────────────────────────────────────
  {
    slug: 'azure-data-factory-training-in-hyderabad',
    before: "I'm our expert trainer, and I'll walk you through everything from the absolute basics to complex data orchestrations.",
    after:  "Our expert trainer will walk you through everything from the absolute basics to complex data orchestrations.",
  },

  // ── ServiceNow ITSM ──────────────────────────────────────────────────────────
  {
    slug: 'servicenow-itsm-training-in-hyderabad',
    before: "My name is our expert trainer, and I'm excited to guide you through this.",
    after:  "Our expert trainers are excited to guide you through this.",
  },

  // ── Graphic Design with Adobe Suite ─────────────────────────────────────────
  // "My name is our expert trainer, and I've been doing this for over 15 years. I know what Hyderabad employers are looking for."
  // The two sentences form one thought — merge them into a clean third-person statement.
  {
    slug: 'graphic-design-adobe-suite-training-hyderabad',
    before: "My name is our expert trainer, and I've been doing this for over 15 years. I know what Hyderabad employers are looking for.",
    after:  "Our lead trainer brings over 15 years of industry experience and knows exactly what Hyderabad employers are looking for.",
  },

  // ── SAP FICO ─────────────────────────────────────────────────────────────────
  // "My name is our expert trainer, and I've been in the SAP ecosystem for years.
  //  I'll show you exactly how to configure key business processes, manage financial
  //  reporting, and handle critical controlling functions."
  // Both sentences need fixing — the first-person "I'll show" in the next sentence
  // also needs to change to "They'll show".
  {
    slug: 'sap-fico-training-institute-in-hyderabad',
    before: "My name is our expert trainer, and I've been in the SAP ecosystem for years. I'll show you exactly how to configure key business processes, manage financial reporting, and handle critical controlling functions.",
    after:  "Our trainers bring years of hands-on experience in the SAP ecosystem. They'll show you exactly how to configure key business processes, manage financial reporting, and handle critical controlling functions.",
  },

  // ── Apache Kafka ─────────────────────────────────────────────────────────────
  {
    slug: 'apache-kafka-training-in-hyderabad',
    before: "In this course, I'm our expert trainer, and I'll personally walk you through everything, starting from the absolute basics up to deploying and monitoring Kafka clusters.",
    after:  "In this course, our expert trainer will personally walk you through everything, starting from the absolute basics up to deploying and monitoring Kafka clusters.",
  },

  // ── Apache Spark ─────────────────────────────────────────────────────────────
  {
    slug: 'apache-spark-training-in-hyderabad',
    before: "In this course, I'm our expert trainer, and I'll personally walk you through everything, starting from the basics of Big Data right up to building complex data pipelines.",
    after:  "In this course, our expert trainer will personally walk you through everything, starting from the basics of Big Data right up to building complex data pipelines.",
  },

  // ── Linux & Shell Scripting ──────────────────────────────────────────────────
  // "led by our expert trainer" is grammatically acceptable (original was "led by [TRAINER_NAME]").
  // Rephrase slightly for natural flow without introducing a name.
  {
    slug: 'linux-shell-scripting-training-in-hyderabad',
    before: "By the end of this course, led by our expert trainer, you'll have completed over 10 hands-on labs and 2 major automation projects.",
    after:  "By the end of this course, you'll have completed over 10 hands-on labs and 2 major automation projects, guided by our experienced Linux instructor.",
  },
]

async function main() {
  console.log('\n=== COSS Broken-Sentence Fix (Trainer Name Context) ===\n')

  const slugs = [...new Set(FIXES.map(f => f.slug))]
  const courses = await db.course.findMany({
    where: { slug: { in: slugs } },
    select: { id: true, title: true, slug: true, description: true },
  })

  const courseMap = Object.fromEntries(courses.map(c => [c.slug, c]))

  let totalFixed = 0
  let totalSkipped = 0

  for (const fix of FIXES) {
    const course = courseMap[fix.slug]
    if (!course) {
      console.log(`  ⚠  Course not found: ${fix.slug}`)
      totalSkipped++
      continue
    }

    if (!course.description.includes(fix.before)) {
      console.log(`  ⚠  Substring not found in "${course.title}" — already fixed or text changed`)
      console.log(`     Looking for: "${fix.before.slice(0, 80)}..."`)
      totalSkipped++
      continue
    }

    const newDesc = course.description.replace(fix.before, fix.after)

    console.log(`\n  ✎  "${course.title}"`)
    console.log(`     BEFORE: ${fix.before}`)
    console.log(`     AFTER:  ${fix.after}`)

    await db.course.update({
      where: { id: course.id },
      data: { description: newDesc },
    })

    // Update local cache for subsequent fixes to same course
    course.description = newDesc
    totalFixed++
  }

  console.log(`\n─────────────────────────────────────────────────`)
  console.log(`Applied: ${totalFixed}  Skipped: ${totalSkipped}\n`)

  // ── Verification pass ────────────────────────────────────────────────────────
  console.log('Verifying — re-scanning all courses for remaining broken patterns...\n')

  const BROKEN_PATTERNS = [
    /My name is our\b/gi,
    /I am our expert trainer/gi,
    /I'm our expert trainer/gi,
    /I've been our expert trainer/gi,
    /called our expert trainer/gi,
    /known as our expert trainer/gi,
    /Hi,? I'm our\b/gi,
    /Hello,? I'm our\b/gi,
    /Hi,? I am our\b/gi,
  ]

  const all = await db.course.findMany({
    select: { id: true, title: true, slug: true, description: true },
  })

  let remaining = 0
  for (const c of all) {
    if (!c.description) continue
    for (const re of BROKEN_PATTERNS) {
      re.lastIndex = 0
      if (re.test(c.description)) {
        console.log(`  ❌  Still broken: "${c.title}" — matches /${re.source}/`)
        remaining++
        break
      }
    }
  }

  if (remaining === 0) {
    console.log('  ✅  All broken trainer-name sentences resolved — zero remaining patterns.\n')
  } else {
    console.log(`\n  ⚠  ${remaining} course(s) still have broken patterns — manual review needed.\n`)
  }

  await db.$disconnect()
}

main().catch(e => {
  console.error('\n❌ Fatal error:', e)
  db.$disconnect()
  process.exit(1)
})
