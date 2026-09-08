// scripts/fix-course-descriptions-batch5.mjs
//
// One-off content fix for 8 Course.description rows (batch5).
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
//   npx dotenv-cli -e .env -- node scripts/fix-course-descriptions-batch5.mjs
//
// Usage (local/dev DB instead):
//   npx dotenv-cli -e .env.development.local -- node scripts/fix-course-descriptions-batch5.mjs

import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

function truncate(str, n = 200) {
  if (str == null) return '(null)'
  return str.length > n ? `${str.slice(0, n)}…[+${str.length - n} more chars]` : str
}

const EDITS = [
  {
    slug: 'business-development-training-in-hyderabad',
    kind: 'partial',
    replacements: [
      {
        find: 'Companies like Tech Mahindra and Cyient at HITEC City hire BD Executives on a base salary plus commission.',
        replace: 'BD Executives at HITEC City employers are typically hired on a base salary plus commission.',
      },
    ],
  },
  {
    slug: 'graphic-design-adobe-suite-training-hyderabad',
    kind: 'partial',
    replacements: [
      {
        find: 'noticed by companies like Cyient and Mphasis right here in Gachibowli.',
        replace: 'noticed by employers right here in Gachibowli.',
      },
    ],
  },
  {
    slug: 'hr-leadership-training-in-hyderabad',
    kind: 'partial',
    replacements: [
      {
        find: 'HR Manager roles in companies like Mphasis and Cyient at HITEC City are a common next step.',
        replace: 'HR Manager roles at HITEC City employers are a common next step.',
      },
    ],
  },
  {
    slug: 'interview-prep-resume-building-hyderabad',
    kind: 'partial',
    replacements: [
      {
        find: 'Companies like Amazon Hyderabad and Tech Mahindra get thousands of applications.',
        replace: 'Large employers get thousands of applications.',
      },
    ],
  },
  {
    slug: 'google-cloud-engineer-training-in-hyderabad',
    kind: 'partial',
    replacements: [
      {
        find: "In this course, I'll walk you through everything you need to know",
        replace: "In this course, we'll walk you through everything you need to know",
      },
      {
        find: 'perfect for working professionals. our expert trainer will be your guide, sharing real-world insights.',
        replace: 'perfect for working professionals. Our expert trainers will be your guide, sharing real-world insights.',
      },
    ],
  },
  {
    slug: 'interview-prep-resume-building-training-in-hyderabad',
    kind: 'partial',
    replacements: [
      {
        find: 'into your schedule. our expert trainer will be right there with you, providing personalized feedback.',
        replace: 'into your schedule. Our expert trainers will be right there with you, providing personalised feedback.',
      },
    ],
  },
  {
    slug: 'leadership-management-skills-training-hyderabad',
    kind: 'partial',
    replacements: [
      {
        find: 'really make an an impact?',
        replace: 'really make an impact?',
      },
      {
        find: "if you're already working. our expert trainer will be guiding you, sharing insights from years in the field.",
        replace: "if you're already working. Our expert trainers will be guiding you, sharing insights from years in the field.",
      },
    ],
  },
  {
    slug: 'mern-stack-training-in-hyderabad',
    kind: 'partial',
    replacements: [
      {
        find: 'enquire for the next available date. our expert trainer and the team are ready to get you coding!',
        replace: 'enquire for the next available date. Our expert trainers are ready to get you coding!',
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
  console.log('\n=== COSS Course Description Fix — batch5 ===')

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
