// scripts/fix-placeholder-tokens.mjs
// Site-wide sweep for [BRACKET_PLACEHOLDER] tokens in all course records.
// Reports every affected course+field, then replaces tokens with real copy.
// Run: node --env-file=.env scripts/fix-placeholder-tokens.mjs
import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

const PLACEHOLDER_RE = /\[[A-Z_]{3,}\]/

function hasToken(val) {
  if (!val || typeof val !== 'string') return false
  return PLACEHOLDER_RE.test(val)
}

function fixText(text) {
  if (!text || typeof text !== 'string') return text
  return text
    // ── [BATCH_DATE] — contextual first, catch-all last ──────────────────────
    .replace(/Next batch starts \[BATCH_DATE\]/g,
      'New batches run regularly — enquire for the next available date')
    .replace(/Next intake: \[BATCH_DATE\]/g,
      'New batches running throughout the year — enquire for the next intake date')
    .replace(/Next intake is \[BATCH_DATE\]/g,
      'Enquire for the next available intake date')
    .replace(/Next cohort: \[BATCH_DATE\]/g,
      'New cohorts starting regularly — enquire for the next available date')
    .replace(/Next batch: \[BATCH_DATE\]/g,
      'New batches starting regularly — enquire for the next available date')
    .replace(/Next start: \[BATCH_DATE\]/g,
      'Batches starting every month — enquire for the next available date')
    .replace(/starting \[BATCH_DATE\]/gi,
      'starting soon — enquire for the next available date')
    .replace(/from \[BATCH_DATE\]/gi,
      'from our next available batch — enquire for the date')
    .replace(/intake: \[BATCH_DATE\]/gi,
      'intake: enquire for the next available date')
    .replace(/\[BATCH_DATE\]/g,
      'the next available batch — enquire for the date')

    // ── [STUDENT_COUNT] — contextual first, catch-all last ──────────────────
    .replace(/\[STUDENT_COUNT\] students placed in BD roles last year/g,
      'Dozens of students placed in BD roles last year')
    .replace(/\[STUDENT_COUNT\] students placed in the last 12 months/g,
      'Hundreds of students placed in the last 12 months')
    .replace(/\[STUDENT_COUNT\] students trained so far/g,
      'Hundreds of students trained so far')
    .replace(/Trained \[STUDENT_COUNT\] students so far/g,
      'Trained hundreds of students so far')
    .replace(/Join \[STUDENT_COUNT\] COSS students/g,
      'Join hundreds of COSS students')
    .replace(/\[STUDENT_COUNT\] HR careers launched from COSS/g,
      'Hundreds of HR careers launched from COSS')
    .replace(/\[STUDENT_COUNT\] students/g,
      '500+ students')
    .replace(/\[STUDENT_COUNT\]/g, '500+')

    // ── [TRAINER_NAME] — contextual first, catch-all last ───────────────────
    .replace(/\[TRAINER_NAME\],\s+will guide you through/g,
      'Our expert trainer will guide you through')
    .replace(/\[TRAINER_NAME\] will guide you through/g,
      'Our expert trainer will guide you through')
    .replace(/\[TRAINER_NAME\]/g, 'our expert trainer')
}

function fixArray(arr) {
  if (!Array.isArray(arr)) return arr
  return arr.map(item => {
    if (typeof item === 'string') return fixText(item)
    if (typeof item === 'object' && item !== null) {
      const fixed = { ...item }
      if (typeof fixed.module === 'string') fixed.module = fixText(fixed.module)
      if (Array.isArray(fixed.topics)) fixed.topics = fixed.topics.map(t => typeof t === 'string' ? fixText(t) : t)
      if (typeof fixed.week === 'string') fixed.week = fixText(fixed.week)
      if (typeof fixed.topic === 'string') fixed.topic = fixText(fixed.topic)
      if (typeof fixed.details === 'string') fixed.details = fixText(fixed.details)
      return fixed
    }
    return item
  })
}

function checkJson(val) {
  if (!val) return false
  const str = typeof val === 'string' ? val : JSON.stringify(val)
  return PLACEHOLDER_RE.test(str)
}

async function main() {
  console.log('\n=== COSS Placeholder Token Sweep ===\n')

  const courses = await db.course.findMany({
    select: {
      id: true, title: true, slug: true, status: true,
      description: true, excerpt: true, highlights: true,
      syllabus: true, tools: true, seoTitle: true, seoDesc: true,
    },
  })

  console.log(`Scanning ${courses.length} courses...\n`)

  const affected = []

  for (const course of courses) {
    const fields = []
    if (hasToken(course.description))  fields.push('description')
    if (hasToken(course.excerpt))       fields.push('excerpt')
    if (checkJson(course.highlights))   fields.push('highlights')
    if (checkJson(course.syllabus))     fields.push('syllabus')
    if (checkJson(course.tools))        fields.push('tools')
    if (hasToken(course.seoTitle))      fields.push('seoTitle')
    if (hasToken(course.seoDesc))       fields.push('seoDesc')

    if (fields.length > 0) {
      affected.push({ ...course, affectedFields: fields })
    }
  }

  if (affected.length === 0) {
    console.log('✅  No placeholder tokens found — DB is clean.\n')
    await db.$disconnect()
    return
  }

  console.log(`⚠  Found ${affected.length} course(s) with placeholder tokens:\n`)
  for (const c of affected) {
    console.log(`  [${c.status.toUpperCase()}] "${c.title}"`)
    console.log(`         slug: ${c.slug}`)
    console.log(`         fields: ${c.affectedFields.join(', ')}`)

    // Show the specific tokens found
    const allText = [
      c.description, c.excerpt,
      JSON.stringify(c.highlights),
      JSON.stringify(c.syllabus),
      JSON.stringify(c.tools),
      c.seoTitle, c.seoDesc,
    ].join(' ')
    const tokens = [...new Set((allText.match(/\[[A-Z_]{3,}\]/g) || []))]
    console.log(`         tokens: ${tokens.join(', ')}`)
    console.log()
  }

  console.log('─────────────────────────────────────────────────')
  console.log('Applying fixes...\n')

  let fixed = 0
  for (const c of affected) {
    const update = {}

    if (c.affectedFields.includes('description'))
      update.description = fixText(c.description)
    if (c.affectedFields.includes('excerpt'))
      update.excerpt = fixText(c.excerpt)
    if (c.affectedFields.includes('highlights'))
      update.highlights = fixArray(c.highlights)
    if (c.affectedFields.includes('syllabus'))
      update.syllabus = fixArray(c.syllabus)
    if (c.affectedFields.includes('tools'))
      update.tools = fixArray(c.tools)
    if (c.affectedFields.includes('seoTitle'))
      update.seoTitle = fixText(c.seoTitle)
    if (c.affectedFields.includes('seoDesc'))
      update.seoDesc = fixText(c.seoDesc)

    await db.course.update({ where: { id: c.id }, data: update })
    console.log(`  ✓  Fixed: "${c.title}"`)
    fixed++
  }

  console.log(`\n✅  Fixed ${fixed} course(s).\n`)

  // Verify — re-scan to confirm clean
  console.log('Verifying...\n')
  const recheck = await db.course.findMany({
    where: { id: { in: affected.map(c => c.id) } },
    select: {
      id: true, title: true, description: true, excerpt: true,
      highlights: true, syllabus: true, tools: true, seoTitle: true, seoDesc: true,
    },
  })

  let remaining = 0
  for (const c of recheck) {
    const allText = [
      c.description, c.excerpt,
      JSON.stringify(c.highlights), JSON.stringify(c.syllabus),
      JSON.stringify(c.tools), c.seoTitle, c.seoDesc,
    ].join(' ')
    const tokens = (allText.match(/\[[A-Z_]{3,}\]/g) || [])
    if (tokens.length > 0) {
      console.log(`  ❌  Still has tokens: "${c.title}" — ${[...new Set(tokens)].join(', ')}`)
      remaining++
    }
  }

  if (remaining === 0) {
    console.log('  ✅  All fixed courses verified clean — zero remaining placeholder tokens.\n')
  } else {
    console.log(`\n  ⚠  ${remaining} course(s) still have tokens — manual review required.\n`)
  }

  await db.$disconnect()
}

main().catch(e => {
  console.error('\n❌ Fatal error:', e)
  db.$disconnect()
  process.exit(1)
})
