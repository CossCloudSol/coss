// scripts/fix-course-descriptions-batch3.mjs
//
// One-off content fix for 9 Course.description rows (batch3).
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
//   npx dotenv-cli -e .env -- node scripts/fix-course-descriptions-batch3.mjs
//
// Usage (local/dev DB instead):
//   npx dotenv-cli -e .env.development.local -- node scripts/fix-course-descriptions-batch3.mjs

import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

function truncate(str, n = 200) {
  if (str == null) return '(null)'
  return str.length > n ? `${str.slice(0, n)}…[+${str.length - n} more chars]` : str
}

const EDITS = [
  {
    slug: 'data-science-training-institute-in-hyderabad',
    kind: 'partial',
    replacements: [
      {
        find: 'in top companies like TCS, Infosys, and Wipro, helping you build a strong career right here in the city.',
        replace: 'at IT employers across the city, helping you build a strong career right here in Hyderabad.',
      },
    ],
  },
  {
    slug: 'digital-marketing-training-in-hyderabad',
    kind: 'partial',
    replacements: [
      {
        find: 'Companies like Cognizant and HCL in Gachibowli are constantly looking for skilled digital marketers.',
        replace: 'Employers across Gachibowli and HITEC City are constantly looking for skilled digital marketers.',
      },
    ],
  },
  {
    slug: 'full-stack-java-developer-training-in-hyderabad',
    kind: 'partial',
    replacements: [
      {
        find: 'Our trainers, like our expert trainer, are experienced professionals who know exactly what companies like TCS and Infosys in HITEC City are really looking for.',
        replace: 'Our trainers are experienced professionals who know exactly what employers in HITEC City are really looking for.',
      },
    ],
  },
  {
    slug: 'graphic-design-training-in-hyderabad',
    kind: 'partial',
    replacements: [
      {
        find: 'opportunities at companies in HITEC City, Gachibowli, and Madhapur, including major players like TCS and Wipro.',
        replace: 'opportunities across HITEC City, Gachibowli, and Madhapur.',
      },
    ],
  },
  {
    slug: 'apache-kafka-training-in-hyderabad',
    kind: 'partial',
    replacements: [
      {
        find: 'kicking off on the next available batch — enquire for the date',
        replace: 'kicking off soon — enquire for the date',
      },
    ],
  },
  {
    slug: 'hr-business-partner-training-in-hyderabad',
    kind: 'partial',
    replacements: [
      {
        find: 'the frameworks that HRBPs at TCS and Wipro in HITEC City actually use',
        replace: 'the frameworks that HRBPs at large IT employers actually use',
      },
      {
        find: 'HR Business Partners with 5+ years at companies like Cognizant and HCL move into senior HRBP roles.',
        replace: 'HR Business Partners with 5+ years of experience typically move into senior HRBP roles.',
      },
    ],
  },
  {
    slug: 'hr-learning-development-training-in-hyderabad',
    kind: 'partial',
    replacements: [
      {
        find: 'Companies like Amazon Hyderabad and Microsoft IDC have active L&D teams.',
        replace: 'Large IT employers and GCCs across Hyderabad run active L&D teams.',
      },
      {
        find: 'New batches starting regularly — enquire for the next available date. Hundreds of students trained so far.',
        replace: 'New batches starting regularly — enquire for the next available date.',
      },
    ],
  },
  {
    slug: 'hr-operations-training-in-hyderabad',
    kind: 'partial',
    replacements: [
      {
        find: 'Companies like Infosys and HCL in Madhapur process payroll for thousands of employees every month.',
        replace: 'Large IT employers in Madhapur process payroll for thousands of employees every month.',
      },
    ],
  },
  {
    slug: 'kubernetes-docker-devops-training-in-hyderabad',
    kind: 'partial',
    replacements: [
      {
        find: 'Companies like Amazon Hyderabad and Microsoft IDC in Gachibowli are constantly looking for skilled engineers who can manage containerized environments.',
        replace: 'Employers across Gachibowli and HITEC City are constantly looking for skilled engineers who can manage containerized environments.',
      },
      {
        find: 'Isn\'t it time to future-proof your career and land that high-paying DevOps role?',
        replace: 'Isn\'t it time to future-proof your career in DevOps?',
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
  console.log('\n=== COSS Course Description Fix — batch3 ===')

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
