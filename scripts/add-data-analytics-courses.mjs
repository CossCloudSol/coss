// scripts/add-data-analytics-courses.mjs
// Adds 5 specific Data, Analytics & BI courses with exact URL slugs as specified
// Run: node scripts/add-data-analytics-courses.mjs

import { PrismaClient } from '@prisma/client'
import { GoogleGenerativeAI } from '@google/generative-ai'

const prisma = new PrismaClient()
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

// ── Exact courses to create ──────────────────────────────────────────────────
// urlType: 'legacy' = flat /courses/slug URL
// urlType: 'new'    = nested /courses/category/slug URL
const COURSES = [
  {
    title: 'Data Analytics Training',
    slug: 'data-analytics-training-institute-in-hyderabad',
    urlType: 'legacy',
    categorySlug: 'data-analytics-bi',
  },
  {
    title: 'Data Science Training',
    slug: 'data-science-training-institute-in-hyderabad',
    urlType: 'legacy',
    categorySlug: 'data-analytics-bi',
  },
  {
    title: 'Machine Learning Training',
    slug: 'machine-learning-training-institute-in-hyderabad',
    urlType: 'legacy',
    categorySlug: 'data-analytics-bi',
  },
  {
    title: 'Artificial Intelligence (AI) Training',
    slug: 'artificial-intelligence-training-institute-in-hyderabad',
    urlType: 'legacy',
    categorySlug: 'data-analytics-bi',
  },
  {
    title: 'Power BI Training in Hyderabad',
    slug: 'power-bi-training-in-hyderabad',
    urlType: 'new',
    categorySlug: 'data-analytics-bi',
  },
]
// ─────────────────────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a course content writer for Coss Cloud Solutions, an IT training institute
in Hyderabad with centres in Dilsukhnagar and Ameerpet. 15+ years experience, 5000+ students placed.
Students get placed at TCS, Infosys, Wipro, HCL, Cognizant and Hyderabad-based companies in HITEC City,
Gachibowli, Madhapur.

RULES — follow every one strictly:
- Write in human voice. No AI-sounding phrases.
- BANNED WORDS (never use): comprehensive, cutting-edge, leverage, delve, robust, seamlessly,
  unlock, empower, transformative, game-changer, revolutionize, synergy, holistic, dive deep,
  spearhead, foster, utilize, dynamic, innovative
- Every description must mention: what job roles it leads to, Hyderabad job market context
- Description: under 120 words, professional but not corporate
- Duration: realistic (e.g. "45 Days", "60 Days", "3 Months")
- Mode: "Classroom"
- Level: "Beginner" for introductory, "Intermediate" for mid-level, "Beginner to Advanced" for full courses
- Highlights: exactly 4 items, each under 8 words, practical focus
- Syllabus: 5-6 modules, each with 4-5 topics. Topics must be real tool/concept names.
- Tools: 4-6 real tools used in the course
- Price: between 15000 and 35000 (INR, integer, no symbol)
- originalPrice: 20-30% higher than price (integer)
- enrolledCount: realistic number between 80 and 300
- nextBatch: "1 Jul 2026"
- seoTitle format: "[Course Name] in Hyderabad | Coss Cloud Solutions"
- seoDesc: under 155 chars, mention Hyderabad, include relevant keywords, placement support

Return ONLY valid JSON — no markdown fences, no preamble, no explanation:
{
  "description": "",
  "excerpt": "",
  "duration": "",
  "mode": "Classroom",
  "level": "",
  "price": 0,
  "originalPrice": 0,
  "highlights": ["", "", "", ""],
  "syllabus": [{ "module": "", "topics": [""] }],
  "tools": [""],
  "enrolledCount": 0,
  "nextBatch": "1 Jul 2026",
  "seoTitle": "",
  "seoDesc": "",
  "badge": ""
}`

async function generateCourse(title, categorySlug) {
  const prompt = `Generate course content for: "${title}"
Category: Data, Analytics & BI
Institute: Coss Cloud Solutions, Hyderabad
Target audience: Freshers, working professionals, job seekers in Hyderabad

For badge, choose ONE of: "Most Popular", "High Demand", "Trending", "Newly Added", "Best Seller"
Pick the most appropriate for this course topic.`

  const result = await model.generateContent([
    { text: SYSTEM_PROMPT },
    { text: prompt },
  ])

  const raw = result.response.text().trim()
  // Strip markdown fences
  let clean = raw.replace(/^```json\n?/,'').replace(/\n?```$/,'').trim()
  // Extract only the JSON object (find first { to last })
  const start = clean.indexOf('{')
  const end = clean.lastIndexOf('}')
  if (start === -1 || end === -1) throw new Error('No JSON object found in response')
  clean = clean.slice(start, end + 1)
  return JSON.parse(clean)
}

async function main() {
  console.log(`\n🚀 Adding ${COURSES.length} Data Analytics & BI courses...\n`)

  // Get the category
  const category = await prisma.courseCategory.findUnique({
    where: { slug: 'data-analytics-bi' },
  })

  if (!category) {
    console.error('❌ Category "data-analytics-bi" not found in DB. Exiting.')
    process.exit(1)
  }

  console.log(`✅ Category found: "${category.name}" (id: ${category.id})\n`)

  for (const course of COURSES) {
    console.log(`⏳ [${COURSES.indexOf(course) + 1}/${COURSES.length}] Generating: ${course.title}`)

    // Check if slug already exists
    const existing = await prisma.course.findUnique({
      where: { slug: course.slug },
    })

    if (existing) {
      console.log(`   ⚠️  Slug "${course.slug}" already exists (id: ${existing.id}) — skipping`)
      continue
    }

    try {
      const generated = await generateCourse(course.title, course.categorySlug)

      const saved = await prisma.course.create({
        data: {
          title: course.title,
          slug: course.slug,
          urlType: course.urlType,
          category: category.name,
          courseCategory: { connect: { id: category.id } },
          categorySlug: course.categorySlug,
          description: generated.description,
          excerpt: generated.excerpt || generated.description.substring(0, 120),
          duration: generated.duration,
          mode: generated.mode,
          level: generated.level,
          price: generated.price,
          originalPrice: generated.originalPrice,
          highlights: generated.highlights,
          syllabus: generated.syllabus,
          tools: generated.tools,
          seoTitle: generated.seoTitle,
          seoDesc: generated.seoDesc,
          badge: generated.badge || 'High Demand',
          status: 'published',
          featured: false,
          sortOrder: 99,
        },
      })

      console.log(`   ✅ Published (id: ${saved.id})`)
      console.log(`   🔗 URL: ${course.urlType === 'legacy' ? `/courses/${course.slug}` : `/courses/${course.categorySlug}/${course.slug}`}`)

      // Respect Gemini rate limits
      await new Promise(r => setTimeout(r, 3000))

    } catch (err) {
      console.error(`   ❌ Failed: ${course.title}`, err.message)
      await new Promise(r => setTimeout(r, 5000))
    }
  }

  console.log('\n─────────────────────────────────────────')
  console.log('✅ Done. Verifying all 5 courses in DB...\n')

  const verify = await prisma.course.findMany({
    where: {
      categorySlug: 'data-analytics-bi',
      status: 'published',
    },
    select: { title: true, slug: true, urlType: true },
    orderBy: { createdAt: 'asc' },
  })

  console.log(`Total published courses in Data, Analytics & BI: ${verify.length}`)
  verify.forEach(c => {
    const url = c.urlType === 'legacy'
      ? `/courses/${c.slug}`
      : `/courses/data-analytics-bi/${c.slug}`
    console.log(`  • ${c.title}`)
    console.log(`    ${url}`)
  })

  console.log('\n👉 Visit localhost:3000/courses/data-analytics-bi to verify all courses show.')
}

main().catch(console.error).finally(() => prisma.$disconnect())
