// scripts/add-all-legacy-courses.mjs
// Adds all remaining legacy courses for 9 categories with exact URL slugs
// Run: node --env-file=.env.local scripts/add-all-legacy-courses.mjs

import { PrismaClient } from '@prisma/client'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { readFileSync } from 'fs'

const prisma = new PrismaClient()
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

// ── ALL REMAINING COURSES BY CATEGORY ────────────────────────────────────────
// urlType: 'legacy' = flat /courses/slug
// urlType: 'new'    = nested /courses/categorySlug/slug
const COURSES = [

  // ── Cloud Computing ──────────────────────────────────────────────────────
  { title: 'AWS Solutions Architect Training',          slug: 'aws-solutions-architect-training-in-hyderabad',          urlType: 'legacy', categorySlug: 'cloud-computing' },
  { title: 'Microsoft Azure Administrator Training',    slug: 'azure-administrator-training-in-hyderabad',              urlType: 'legacy', categorySlug: 'cloud-computing' },
  { title: 'Google Cloud Engineer Training',            slug: 'google-cloud-engineer-training-in-hyderabad',            urlType: 'legacy', categorySlug: 'cloud-computing' },
  { title: 'AWS Cloud Practitioner Training',           slug: 'aws-cloud-practitioner-training-in-hyderabad',           urlType: 'legacy', categorySlug: 'cloud-computing' },
  { title: 'Multi-Cloud Architecture Training',         slug: 'multi-cloud-architecture-training-in-hyderabad',         urlType: 'legacy', categorySlug: 'cloud-computing' },

  // ── DevOps & Multi-Cloud ─────────────────────────────────────────────────
  { title: 'DevOps Training',                           slug: 'devops-training-institute-in-hyderabad',                 urlType: 'legacy', categorySlug: 'devops-multi-cloud' },
  { title: 'Docker & Kubernetes Training',              slug: 'docker-kubernetes-training-in-hyderabad',                urlType: 'legacy', categorySlug: 'devops-multi-cloud' },
  { title: 'Jenkins CI/CD Pipeline Training',           slug: 'jenkins-cicd-training-in-hyderabad',                    urlType: 'legacy', categorySlug: 'devops-multi-cloud' },
  { title: 'Terraform & Ansible Training',              slug: 'terraform-ansible-training-in-hyderabad',               urlType: 'legacy', categorySlug: 'devops-multi-cloud' },
  { title: 'Azure DevOps Training',                     slug: 'azure-devops-training-in-hyderabad',                    urlType: 'legacy', categorySlug: 'devops-multi-cloud' },

  // ── Programming & Full Stack ─────────────────────────────────────────────
  { title: 'Full Stack Java Training',                  slug: 'full-stack-java-training-in-hyderabad',                 urlType: 'legacy', categorySlug: 'programming-full-stack' },
  { title: 'Full Stack Python Training',                slug: 'full-stack-python-training-in-hyderabad',               urlType: 'legacy', categorySlug: 'programming-full-stack' },
  { title: 'MERN Stack Training',                       slug: 'mern-stack-training-in-hyderabad',                      urlType: 'legacy', categorySlug: 'programming-full-stack' },
  { title: 'React.js & Node.js Training',               slug: 'react-nodejs-training-in-hyderabad',                    urlType: 'legacy', categorySlug: 'programming-full-stack' },
  { title: 'Python Programming Training',               slug: 'python-programming-training-in-hyderabad',              urlType: 'legacy', categorySlug: 'programming-full-stack' },

  // ── Data Engineering ─────────────────────────────────────────────────────
  { title: 'Apache Spark Training',                     slug: 'apache-spark-training-in-hyderabad',                    urlType: 'legacy', categorySlug: 'data-engineering' },
  { title: 'Azure Data Factory Training',               slug: 'azure-data-factory-training-in-hyderabad',              urlType: 'legacy', categorySlug: 'data-engineering' },
  { title: 'Apache Kafka Training',                     slug: 'apache-kafka-training-in-hyderabad',                    urlType: 'legacy', categorySlug: 'data-engineering' },
  { title: 'Snowflake Training',                        slug: 'snowflake-training-in-hyderabad',                       urlType: 'legacy', categorySlug: 'data-engineering' },
  { title: 'Data Engineering with Python Training',     slug: 'data-engineering-python-training-in-hyderabad',         urlType: 'legacy', categorySlug: 'data-engineering' },

  // ── Cyber Security & Networking ──────────────────────────────────────────
  { title: 'Ethical Hacking Training',                  slug: 'ethical-hacking-training-institute-in-hyderabad',       urlType: 'legacy', categorySlug: 'cyber-security' },
  { title: 'Cyber Security Training',                   slug: 'cyber-security-training-institute-in-hyderabad',        urlType: 'legacy', categorySlug: 'cyber-security' },
  { title: 'CEH Certification Training',                slug: 'ceh-certification-training-in-hyderabad',               urlType: 'legacy', categorySlug: 'cyber-security' },
  { title: 'Network Security Training',                 slug: 'network-security-training-in-hyderabad',                urlType: 'legacy', categorySlug: 'cyber-security' },
  { title: 'CompTIA Security+ Training',                slug: 'comptia-security-plus-training-in-hyderabad',           urlType: 'legacy', categorySlug: 'cyber-security' },

  // ── ERP, CRM & Enterprise Tools ─────────────────────────────────────────
  { title: 'SAP FICO Training',                         slug: 'sap-fico-training-institute-in-hyderabad',              urlType: 'legacy', categorySlug: 'erp-crm-enterprise-tools' },
  { title: 'SAP MM Training',                           slug: 'sap-mm-training-in-hyderabad',                          urlType: 'legacy', categorySlug: 'erp-crm-enterprise-tools' },
  { title: 'SAP SD Training',                           slug: 'sap-sd-training-in-hyderabad',                          urlType: 'legacy', categorySlug: 'erp-crm-enterprise-tools' },
  { title: 'Salesforce Training',                       slug: 'salesforce-training-institute-in-hyderabad',            urlType: 'legacy', categorySlug: 'erp-crm-enterprise-tools' },
  { title: 'ServiceNow Training',                       slug: 'servicenow-training-institute-in-hyderabad',            urlType: 'legacy', categorySlug: 'erp-crm-enterprise-tools' },

  // ── Software Testing & OS ────────────────────────────────────────────────
  { title: 'Manual Testing Training',                   slug: 'manual-testing-training-institute-in-hyderabad',        urlType: 'legacy', categorySlug: 'software-testing-os' },
  { title: 'Selenium Automation Testing Training',      slug: 'selenium-testing-training-in-hyderabad',                urlType: 'legacy', categorySlug: 'software-testing-os' },
  { title: 'API Testing with Postman Training',         slug: 'api-testing-postman-training-in-hyderabad',             urlType: 'legacy', categorySlug: 'software-testing-os' },
  { title: 'Linux & Shell Scripting Training',          slug: 'linux-shell-scripting-training-in-hyderabad',           urlType: 'legacy', categorySlug: 'software-testing-os' },
  { title: 'Software Testing Training',                 slug: 'software-testing-training-institute-in-hyderabad',      urlType: 'legacy', categorySlug: 'software-testing-os' },

  // ── Digital & Design ────────────────────────────────────────────────────
  { title: 'Digital Marketing Training',                slug: 'digital-marketing-training-institute-in-hyderabad',     urlType: 'legacy', categorySlug: 'digital-design' },
  { title: 'UI/UX Design Training',                     slug: 'ui-ux-design-training-in-hyderabad',                    urlType: 'legacy', categorySlug: 'digital-design' },
  { title: 'Graphic Design Training',                   slug: 'graphic-design-training-in-hyderabad',                  urlType: 'legacy', categorySlug: 'digital-design' },
  { title: 'Social Media Marketing Training',           slug: 'social-media-marketing-training-in-hyderabad',          urlType: 'legacy', categorySlug: 'digital-design' },
  { title: 'SEO Training',                              slug: 'seo-training-institute-in-hyderabad',                   urlType: 'legacy', categorySlug: 'digital-design' },

  // ── Professional & Soft Skills ───────────────────────────────────────────
  { title: 'Business Communication Training',           slug: 'business-communication-training-in-hyderabad',          urlType: 'legacy', categorySlug: 'professional-soft-skills' },
  { title: 'Interview Preparation Training',            slug: 'interview-preparation-training-in-hyderabad',           urlType: 'legacy', categorySlug: 'professional-soft-skills' },
  { title: 'Leadership & Management Training',          slug: 'leadership-management-training-in-hyderabad',           urlType: 'legacy', categorySlug: 'professional-soft-skills' },
  { title: 'Personality Development Training',          slug: 'personality-development-training-in-hyderabad',         urlType: 'legacy', categorySlug: 'professional-soft-skills' },
  { title: 'Resume Building & Career Guidance',         slug: 'resume-building-career-guidance-in-hyderabad',          urlType: 'legacy', categorySlug: 'professional-soft-skills' },
]
// ─────────────────────────────────────────────────────────────────────────────

const CATEGORY_NAMES = {
  'cloud-computing':          'Cloud Computing',
  'devops-multi-cloud':       'DevOps & Multi-Cloud',
  'programming-full-stack':   'Programming & Full Stack',
  'data-engineering':         'Data Engineering',
  'cyber-security':           'Cyber Security & Networking',
  'erp-crm-enterprise-tools': 'ERP, CRM & Enterprise Tools',
  'software-testing-os':      'Software Testing & OS',
  'digital-design':           'Digital & Design',
  'professional-soft-skills': 'Professional & Soft Skills',
}

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
  console.log(`\n🚀 Adding ${COURSES.length} courses across 9 categories...\n`)

  // Pre-load all category IDs
  const categories = await prisma.courseCategory.findMany({
    where: { slug: { in: Object.keys(CATEGORY_NAMES) } },
    select: { id: true, slug: true, name: true },
  })
  const categoryMap = Object.fromEntries(categories.map(c => [c.slug, c]))

  let success = 0, skipped = 0, failed = 0

  for (let i = 0; i < COURSES.length; i++) {
    const course = COURSES[i]
    const cat = categoryMap[course.categorySlug]

    if (!cat) {
      console.log(`[${i+1}/${COURSES.length}] ⚠️  Category not found: ${course.categorySlug} — skipping`)
      skipped++
      continue
    }

    // Check if slug already exists
    const existing = await prisma.course.findUnique({ where: { slug: course.slug } })
    if (existing) {
      console.log(`[${i+1}/${COURSES.length}] ⚠️  Already exists: ${course.title} — skipping`)
      skipped++
      continue
    }

    console.log(`[${i+1}/${COURSES.length}] ⏳ ${course.title}`)

    try {
      const generated = await generateCourse(course.title, cat.name)

      await prisma.course.create({
        data: {
          title: course.title,
          slug: course.slug,
          urlType: course.urlType,
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

      const url = course.urlType === 'legacy'
        ? `/courses/${course.slug}`
        : `/courses/${course.categorySlug}/${course.slug}`
      console.log(`       ✅ Published → ${url}`)
      success++

      // 3s delay between calls — stays well within Gemini paid tier limits
      await new Promise(r => setTimeout(r, 3000))

    } catch (err) {
      console.error(`       ❌ Failed: ${err.message}`)
      failed++
      await new Promise(r => setTimeout(r, 5000))
    }
  }

  console.log('\n─────────────────────────────────────────────────')
  console.log(`✅ Done.  Success: ${success}  |  Skipped: ${skipped}  |  Failed: ${failed}`)
  console.log('\nFinal course counts per category:')

  for (const [slug, name] of Object.entries(CATEGORY_NAMES)) {
    const count = await prisma.course.count({
      where: { categorySlug: slug, status: 'published' },
    })
    console.log(`  ${name.padEnd(30)} ${count} courses`)
  }

  console.log('\n👉 Verify at:')
  console.log('   localhost:3000/courses/cloud-computing')
  console.log('   localhost:3000/courses/devops-multi-cloud')
  console.log('   localhost:3000/courses/cyber-security')
}

main().catch(console.error).finally(() => prisma.$disconnect())
