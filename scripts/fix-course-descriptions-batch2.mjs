// scripts/fix-course-descriptions-batch2.mjs
//
// One-off content fix for 8 Course.description rows (batch2).
// All courses: partial edits — replace specific FIND substrings, leave the
//   rest of the description byte-identical.
//
// Safety:
//   - Each course is looked up by slug; if zero or more than one row match,
//     it is skipped and logged as an error (never guesses which row to touch).
//   - Before writing, the CURRENT description is re-checked against the
//     expected FIND text / opening line. If it has already changed or
//     drifted, the course is skipped — never written blind.
//   - Courses are processed sequentially. Each update is wrapped in its own
//     try/catch so one failure does not abort the rest.
//   - Safe to run twice: on the second run every course fails its
//     pre-write assertion (text no longer matches) and is skipped.
//
// Usage (production DB — @prisma/client auto-loads root .env by default):
//   npx dotenv-cli -e .env -- node scripts/fix-course-descriptions-batch2.mjs
//
// Usage (local/dev DB instead):
//   npx dotenv-cli -e .env.development.local -- node scripts/fix-course-descriptions-batch2.mjs

import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

function truncate(str, n = 200) {
  if (str == null) return '(null)'
  return str.length > n ? `${str.slice(0, n)}…[+${str.length - n} more chars]` : str
}

const EDITS = [
  {
    slug: 'apache-kafka-training-in-hyderabad',
    kind: 'partial',
    replacements: [
      {
        find: 'Companies like TCS and Wipro in Gachibowli are constantly hiring Kafka specialists.',
        replace: 'Demand for Kafka specialists across Gachibowli and HITEC City is strong and growing.',
      },
    ],
  },
  {
    slug: 'apache-spark-training-in-hyderabad',
    kind: 'partial',
    replacements: [
      {
        find: 'Companies like Amazon Hyderabad and Microsoft IDC in HITEC City are constantly hiring for roles that need strong Spark expertise.',
        replace: 'Roles requiring strong Spark expertise are in steady demand across HITEC City and Gachibowli.',
      },
    ],
  },
  {
    slug: 'api-testing-postman-training-in-hyderabad',
    kind: 'partial',
    replacements: [
      {
        find: 'Companies like TCS and Wipro in Gachibowli are constantly hiring testers who can validate microservices and backend systems.',
        replace: 'Testers who can validate microservices and backend systems are in constant demand across Gachibowli.',
      },
    ],
  },
  {
    slug: 'artificial-intelligence-ai-training-hyderabad',
    kind: 'partial',
    replacements: [
      {
        find: 'Companies like Amazon Hyderabad and Microsoft IDC are constantly looking for talent in Gachibowli.',
        replace: 'Employers across Gachibowli and HITEC City are actively recruiting AI talent.',
      },
    ],
  },
  {
    slug: 'azure-administrator-training-in-hyderabad',
    kind: 'partial',
    replacements: [
      {
        find: 'our expert trainer and I will',
        replace: 'our expert trainers will',
      },
      {
        find: 'Companies like Microsoft IDC and Wipro are actively hiring Azure Administrators.',
        replace: 'Azure Administrator roles are in steady demand across the city.',
      },
      {
        find: 'Our next batch starts the next available batch — enquire for the date',
        replace: 'Our next batch starts soon — enquire for the date',
      },
    ],
  },
  {
    slug: 'azure-data-factory-training-in-hyderabad',
    kind: 'partial',
    replacements: [
      {
        find: 'Companies like Amazon Hyderabad and Microsoft IDC are constantly looking for folks who can manage their massive data estates.',
        replace: 'Employers across Gachibowli and HITEC City are constantly looking for people who can manage large data estates.',
      },
      {
        find: 'Our next batch kicks off on the next available batch — enquire for the date',
        replace: 'Our next batch kicks off soon — enquire for the date',
      },
    ],
  },
  {
    slug: 'business-communication-english-training-in-hyderabad',
    kind: 'partial',
    replacements: [
      {
        find: "especially with companies like TCS and Wipro in Gachibowli, communication isn't",
        replace: 'especially across Gachibowli and HITEC City, communication isn\'t',
      },
      {
        find: 'Graduates of this course now work in roles that demand strong communication skills right here in Hyderabad.',
        replace: 'The skills you build here apply directly to roles that demand clear professional communication.',
      },
    ],
  },
  {
    slug: 'data-analytics-training-institute-in-hyderabad',
    kind: 'partial',
    replacements: [
      {
        find: 'including TCS, Infosys, and Wipro.',
        replace: 'across a range of IT employers.',
      },
      {
        find: 'We have 15+ years of experience placing students in top firms.',
        replace: 'We have been training students in Hyderabad since 2010.',
      },
    ],
  },
]

function buildCandidateDescription(edit, oldDescription) {
  if (edit.kind === 'partial') {
    let next = oldDescription
    for (const { find, replace } of edit.replacements) {
      next = next.split(find).join(replace)
    }
    return next
  }
  return edit.newDescription
}

function assertionPasses(edit, oldDescription) {
  if (edit.kind === 'partial') {
    return edit.replacements.every(({ find }) => oldDescription.includes(find))
  }
  return oldDescription.startsWith(edit.startsWith)
}

async function processEdit(edit, summary) {
  const { slug } = edit

  const rows = await db.course.findMany({ where: { slug } })

  if (rows.length !== 1) {
    console.log(`\n[${slug}] LOOKUP: ${rows.length} row(s) matched — expected exactly 1. Skipping.`)
    summary.errored.push(`${slug}: expected 1 row by slug, found ${rows.length}`)
    return
  }

  const course = rows[0]
  const oldDescription = course.description
  const newDescription = buildCandidateDescription(edit, oldDescription)

  console.log(`\n[${slug}] LOOKUP: matched 1 row (id=${course.id})`)
  console.log(`[${slug}] OLD (first 200 chars): ${truncate(oldDescription)}`)
  console.log(`[${slug}] NEW (first 200 chars): ${truncate(newDescription)}`)

  if (!assertionPasses(edit, oldDescription)) {
    console.log(`[${slug}] SKIPPED: already changed or drifted — skipped`)
    summary.skipped.push(slug)
    return
  }

  try {
    await db.course.update({
      where: { id: course.id },
      data: { description: newDescription },
    })
    console.log(`[${slug}] UPDATED.`)
    summary.updated.push(slug)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.log(`[${slug}] ERROR during update: ${msg}`)
    summary.errored.push(`${slug}: ${msg}`)
  }
}

async function main() {
  console.log('\n=== COSS Course Description Fix — batch2 ===')

  const summary = { updated: [], skipped: [], errored: [] }

  for (const edit of EDITS) {
    try {
      await processEdit(edit, summary)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.log(`\n[${edit.slug}] ERROR (unexpected, lookup/processing failed): ${msg}`)
      summary.errored.push(`${edit.slug}: ${msg}`)
    }
  }

  console.log('\n─────────────────────────────────────────────')
  console.log('SUMMARY')
  console.log(`  Updated: ${summary.updated.length}${summary.updated.length ? ' — ' + summary.updated.join(', ') : ''}`)
  console.log(`  Skipped: ${summary.skipped.length}${summary.skipped.length ? ' — ' + summary.skipped.join(', ') : ''}`)
  console.log(`  Errored: ${summary.errored.length}`)
  for (const e of summary.errored) console.log(`    - ${e}`)
  console.log('')

  await db.$disconnect()
}

main().catch(async (err) => {
  console.error('\nFatal error:', err)
  await db.$disconnect()
  process.exit(1)
})
