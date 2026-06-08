// scripts/add-failed-courses.mjs
// Re-runs only the 9 courses that failed with 503 in the previous batch
// Run: node --env-file=.env.local scripts/add-failed-courses.mjs

import { PrismaClient } from '@prisma/client'
import { GoogleGenerativeAI } from '@google/generative-ai'

const prisma = new PrismaClient()
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

const COURSES = [
  { title: 'Jenkins CI/CD Pipeline Training',       slug: 'jenkins-cicd-training-in-hyderabad',               categorySlug: 'devops-multi-cloud',       categoryName: 'DevOps & Multi-Cloud' },
  { title: 'React.js & Node.js Training',           slug: 'react-nodejs-training-in-hyderabad',               categorySlug: 'programming-full-stack',   categoryName: 'Programming & Full Stack' },
  { title: 'Python Programming Training',           slug: 'python-programming-training-in-hyderabad',         categorySlug: 'programming-full-stack',   categoryName: 'Programming & Full Stack' },
  { title: 'Cyber Security Training',               slug: 'cyber-security-training-institute-in-hyderabad',   categorySlug: 'cyber-security',           categoryName: 'Cyber Security & Networking' },
  { title: 'Network Security Training',             slug: 'network-security-training-in-hyderabad',           categorySlug: 'cyber-security',           categoryName: 'Cyber Security & Networking' },
  { title: 'SAP SD Training',                       slug: 'sap-sd-training-in-hyderabad',                     categorySlug: 'erp-crm-enterprise-tools', categoryName: 'ERP, CRM & Enterprise Tools' },
  { title: 'Salesforce Training',                   slug: 'salesforce-training-institute-in-hyderabad',       categorySlug: 'erp-crm-enterprise-tools', categoryName: 'ERP, CRM & Enterprise Tools' },
  { title: 'ServiceNow Training',                   slug: 'servicenow-training-institute-in-hyderabad',       categorySlug: 'erp-crm-enterprise-tools', categoryName: 'ERP, CRM & Enterprise Tools' },
  { title: 'SEO Training',                          slug: 'seo-training-institute-in-hyderabad',              categorySlug: 'digital-design',           categoryName: 'Digital & Design' },
]

const SYSTEM_PROMPT = `You are a course content writer for Coss Cloud Solutions, an IT training institute
in Hyderabad with centres in Dilsukhnagar and Ameerpet. 15+ years experience, 5000+ students placed.
Students placed at TCS, Infosys, Wipro, HCL, Cognizant and companies in HITEC City, Gachibowli, Madhapur.

RULES:
- Write in human voice. No AI-sounding phrases.
- BANNED WORDS: comprehensive, cutting-edge, leverage, delve, robust, seamlessly, unlock, empower,
  transformative, game-changer, revolutionize, synergy, holistic, dive deep, spearhead, foster,
  utilize, dynamic, innovative
- Description: under 120 words, mention job roles + Hyderabad job market
- Duration: realistic e.g. "45 Days", "60 Days", "3 Months"
- Mode: "Classroom"
- Level: "Beginner", "Intermediate", or "Beginner to Advanced"
- Highlights: exactly 4 items, each under 8 words
- Syllabus: 5 modules, each with 4 topics (real tool/concept names)
- Tools: 4-6 real tools
- Price: integer between 15000 and 35000
- originalPrice: integer, 20-30% higher than price
- seoTitle: "[Course Name] in Hyderabad | Coss Cloud Solutions"
- seoDesc: under 155 chars, mention Hyderabad + placement
- badge: one of "Most Popular", "High Demand", "Trending", "Newly Added", "Best Seller"

Return ONLY valid JSON, no markdown fences:
{
  "description": "",
  "excerpt": "",
  "duration": "",
  "mode": "Classroom",
  "level": "",
  "price": 0,
  "originalPrice": 0,
  "highlights": ["","","",""],
  "syllabus": [{"module":"","topics":[""]}],
  "tools": [""],
  "seoTitle": "",
  "seoDesc": "",
  "badge": ""
}`

async function generateCourse(title, categoryName) {
  const result = await model.generateContent([
    { text: SYSTEM_PROMPT },
    { text: `Generate course content for: "${title}"\nCategory: ${categoryName}\nInstitute: Coss Cloud Solutions, Hyderabad` },
  ])
  const raw = result.response.text().trim()
  let clean = raw.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim()
  const start = clean.indexOf('{')
  const end = clean.lastIndexOf('}')
  if (start === -1 || end === -1) throw new Error('No JSON in response')
  return JSON.parse(clean.slice(start, end + 1))
}

async function main() {
  console.log(`\n🔁 Re-running ${COURSES.length} failed courses...\n`)

  let success = 0, skipped = 0, failed = 0

  for (let i = 0; i < COURSES.length; i++) {
    const course = COURSES[i]

    // Skip if already exists
    const existing = await prisma.course.findUnique({ where: { slug: course.slug } })
    if (existing) {
      console.log(`[${i+1}/${COURSES.length}] ⚠️  Already exists: ${course.title} — skipping`)
      skipped++
      continue
    }

    const cat = await prisma.courseCategory.findUnique({ where: { slug: course.categorySlug } })
    if (!cat) {
      console.log(`[${i+1}/${COURSES.length}] ❌ Category not found: ${course.categorySlug}`)
      failed++
      continue
    }

    console.log(`[${i+1}/${COURSES.length}] ⏳ ${course.title}`)

    try {
      const generated = await generateCourse(course.title, course.categoryName)

      await prisma.course.create({
        data: {
          title: course.title,
          slug: course.slug,
          urlType: 'legacy',
          categorySlug: course.categorySlug,
          category: cat.name,
          courseCategory: { connect: { id: cat.id } },
          description: generated.description,
          excerpt: generated.excerpt || generated.description?.substring(0, 120) || '',
          duration: generated.duration || '60 Days',
          mode: generated.mode || 'Classroom',
          level: generated.level || 'Beginner',
          price: generated.price || 20000,
          originalPrice: generated.originalPrice || 25000,
          highlights: generated.highlights || [],
          syllabus: generated.syllabus || [],
          tools: generated.tools || [],
          seoTitle: generated.seoTitle || `${course.title} in Hyderabad | Coss Cloud Solutions`,
          seoDesc: generated.seoDesc || '',
          badge: generated.badge || 'High Demand',
          status: 'published',
          featured: false,
          sortOrder: 99,
        },
      })

      console.log(`       ✅ Published → /courses/${course.slug}`)
      success++
      // 5s delay — generous gap to avoid 503s
      await new Promise(r => setTimeout(r, 5000))

    } catch (err) {
      console.error(`       ❌ Failed: ${err.message}`)
      failed++
      await new Promise(r => setTimeout(r, 8000))
    }
  }

  console.log('\n─────────────────────────────────────────────────')
  console.log(`✅ Done.  Success: ${success}  |  Skipped: ${skipped}  |  Failed: ${failed}`)

  if (failed > 0) {
    console.log('\n⚠️  Some courses still failed — re-run this script again in a few minutes.')
    console.log('   Gemini 503 errors are temporary. The script skips already-created courses safely.')
  } else {
    console.log('\n🎉 All 9 courses published. Ready for Search Console submission!')
  }
}

main().catch(console.error).finally(() => prisma.$disconnect())
