// scripts/batch-generate-courses.mjs
// Run: node scripts/batch-generate-courses.mjs
// Or:  npx tsx scripts/batch-generate-courses.mjs (tsx handles .mjs too)
//
// Reads GEMINI_API_KEY from .env.local automatically.
// Saves all courses as draft — nothing goes live until you publish in /admin/courses.

import { PrismaClient } from '@prisma/client'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { fileURLToPath } from 'url'

// ── Load .env.local ──────────────────────────────────────────────────────────
const __dirname = fileURLToPath(new URL('.', import.meta.url))
try {
  const envPath = resolve(__dirname, '../.env.local')
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq < 1) continue
    const key = trimmed.slice(0, eq).trim()
    const val = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '')
    if (!process.env[key]) process.env[key] = val
  }
} catch {
  // .env.local not found — rely on environment variables already set
}

if (!process.env.GEMINI_API_KEY) {
  console.error('❌  GEMINI_API_KEY not found. Add it to .env.local or set it in the environment.')
  process.exit(1)
}

// ── Init clients ─────────────────────────────────────────────────────────────
const prisma = new PrismaClient()
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

// ── System prompt (mirrors src/app/api/admin/generate/course/route.ts) ───────
// Extended output schema to also include price, originalPrice, mode.
const SYSTEM_PROMPT = `You are a senior content writer at COSS (Cloud & Open Source Solutions), a training institute in Hyderabad with centres in Dilsukhnagar and Ameerpet. You write like an experienced trainer who knows students personally — direct, specific, confident, never corporate or generic.

VOICE RULES (non-negotiable):
- Write in second person ("you'll learn", "by week 3 you'll be")
- Use contractions naturally (you'll, we're, it's, don't)
- Mix short punchy sentences with longer explanatory ones
- Include one rhetorical question per major section
- Use specific numbers over vague claims ("12 hands-on projects" not "many projects")
- Name real tools with versions where relevant (Kubernetes 1.29, not just "Kubernetes")
- Name real certifications with exam codes (AWS SAA-C03, CKA, CEH v12, not generic names)
- Include one specific Hyderabad employer example per description (TCS, Infosys, Wipro, Cognizant, HCL, Tech Mahindra, Amazon Hyderabad, Microsoft IDC Hyderabad, Cyient, Mphasis)
- Mention one Hyderabad area naturally (HITEC City, Gachibowli, Madhapur, Ameerpet, Dilsukhnagar)

BANNED WORDS (never use any of these):
comprehensive, cutting-edge, industry-leading, world-class, robust, leverage, delve, empower, transformative, holistic, synergy, equip students, upon completion, in today's fast-paced world, in conclusion, furthermore, moreover, it is worth noting, seamless, streamline, game-changer, innovative, state-of-the-art, best-in-class

SEO RULES:
- Slug: 5-8 words, format: [topic]-[intent]-in-hyderabad or [topic]-training-institute-in-hyderabad
- SEO title: under 60 chars, format: "[Topic] Training in Hyderabad | Coss Cloud Solutions"
- Meta desc: under 155 chars, must include: one number or data point, one action verb, "Hyderabad"
- Use LSI keywords — related terms not just the main keyword repeated
- Mention Hyderabad naturally maximum 3 times in the description body

GEO RULES:
- One specific Hyderabad area name in the description
- One local employer example with context ("Companies like TCS and Wipro in HITEC City...")
- One Hyderabad salary range data point (research realistic 2025-2026 ranges)
- Mention weekend batch availability (targets Hyderabad working professionals)
- Reference "Dilsukhnagar" or "Ameerpet" as COSS centre locations

BATCH & TRAINER RULES:
- Use real batch timing language: "Weekend batches available", "Weekdays 9AM–1PM", "Monthly batches", "Flexible schedule" — never a bracketed placeholder like [BATCH_DATE]
- Use real student count language: "500+", "1,200+", "5,000+", "Hundreds of" — never a bracketed placeholder like [STUDENT_COUNT]
- If a trainer name is needed, write "our expert trainer" or omit it entirely — never a bracketed placeholder like [TRAINER_NAME]

SYLLABUS RULES:
- 5-8 modules minimum
- Each module: 4-6 specific topics
- Topics must be specific tool/concept names, not vague descriptions
- First module always: fundamentals/prerequisites
- Last module always: real-world project / certification prep

PRICING RULES:
- price: realistic INR course fee between 15000 and 35000 (number only, no symbol)
- originalPrice: 25-40% higher than price (number only)
- mode: "Classroom" for most technical courses; "Online" for soft skills / communication

OUTPUT: Return ONLY valid JSON with no markdown fences, no explanation, no preamble:
{
  "slug": "string",
  "excerpt": "string (max 160 chars)",
  "description": "string (200-300 words, human voice, GEO signals)",
  "highlights": ["string x6-8"],
  "syllabus": [{"module": "string", "topics": ["string x4-6"]}],
  "tools": ["string x6-10"],
  "duration": "string (e.g. 45 Days, 3 Months)",
  "level": "Beginner | Intermediate | Advanced | All Levels",
  "badge": "New | Popular | Bestseller | High Demand",
  "price": 0,
  "originalPrice": 0,
  "mode": "Classroom | Online | Classroom + Online",
  "seoTitle": "string (max 60 chars)",
  "seoDesc": "string (max 155 chars)"
}`

// ── Course list ───────────────────────────────────────────────────────────────
// categorySlug must match CourseCategory.slug in your DB.
// categoryName is the human-readable name passed to the AI prompt.
const COURSES = [
  // ── Data, Analytics & BI ─────────────────────────────────────────────────
  { title: 'Power BI Training',                          categorySlug: 'data-analytics-bi',        categoryName: 'Data, Analytics & BI' },
  { title: 'Tableau Training',                           categorySlug: 'data-analytics-bi',        categoryName: 'Data, Analytics & BI' },
  { title: 'SQL for Data Analytics Training',            categorySlug: 'data-analytics-bi',        categoryName: 'Data, Analytics & BI' },
  { title: 'Python for Data Analysis Training',          categorySlug: 'data-analytics-bi',        categoryName: 'Data, Analytics & BI' },

  // ── Data Engineering ─────────────────────────────────────────────────────
  { title: 'Apache Spark Training',                      categorySlug: 'data-engineering',         categoryName: 'Data Engineering' },
  { title: 'Azure Data Factory Training',                categorySlug: 'data-engineering',         categoryName: 'Data Engineering' },
  { title: 'Apache Kafka Training',                      categorySlug: 'data-engineering',         categoryName: 'Data Engineering' },
  { title: 'Snowflake Training',                         categorySlug: 'data-engineering',         categoryName: 'Data Engineering' },

  // ── ERP, CRM & Enterprise Tools ──────────────────────────────────────────
  { title: 'SAP FICO Training',                          categorySlug: 'erp-crm-enterprise-tools', categoryName: 'ERP, CRM & Enterprise Tools' },
  { title: 'SAP MM & SD Training',                       categorySlug: 'erp-crm-enterprise-tools', categoryName: 'ERP, CRM & Enterprise Tools' },
  { title: 'Salesforce Admin & Developer Training',      categorySlug: 'erp-crm-enterprise-tools', categoryName: 'ERP, CRM & Enterprise Tools' },
  { title: 'ServiceNow ITSM Training',                   categorySlug: 'erp-crm-enterprise-tools', categoryName: 'ERP, CRM & Enterprise Tools' },

  // ── Software Testing & OS ────────────────────────────────────────────────
  { title: 'Manual Testing Training',                    categorySlug: 'software-testing-os',      categoryName: 'Software Testing & OS' },
  { title: 'Selenium Automation Testing Training',       categorySlug: 'software-testing-os',      categoryName: 'Software Testing & OS' },
  { title: 'API Testing with Postman Training',          categorySlug: 'software-testing-os',      categoryName: 'Software Testing & OS' },
  { title: 'Linux & Shell Scripting Training',           categorySlug: 'software-testing-os',      categoryName: 'Software Testing & OS' },

  // ── Digital & Design ─────────────────────────────────────────────────────
  { title: 'Digital Marketing Training',                 categorySlug: 'digital-design',           categoryName: 'Digital & Design' },
  { title: 'UI/UX Design Training',                      categorySlug: 'digital-design',           categoryName: 'Digital & Design' },
  { title: 'Graphic Design with Adobe Suite Training',   categorySlug: 'digital-design',           categoryName: 'Digital & Design' },

  // ── Professional & Soft Skills ────────────────────────────────────────────
  { title: 'Business Communication & English Training',  categorySlug: 'professional-soft-skills', categoryName: 'Professional & Soft Skills' },
  { title: 'Interview Preparation & Resume Building',    categorySlug: 'professional-soft-skills', categoryName: 'Professional & Soft Skills' },
  { title: 'Leadership & Management Skills Training',    categorySlug: 'professional-soft-skills', categoryName: 'Professional & Soft Skills' },

  // ── Step 6: Top-up thin categories (uncomment to include) ────────────────
  // Cloud Computing (currently has 1 course)
  { title: 'Microsoft Azure Administrator Training',     categorySlug: 'cloud-computing',          categoryName: 'Cloud Computing' },
  { title: 'Google Cloud Engineer Training',             categorySlug: 'cloud-computing',          categoryName: 'Cloud Computing' },

  // DevOps & Multi-Cloud (currently has 1 course)
  { title: 'Kubernetes & Docker Training',               categorySlug: 'devops-multi-cloud',       categoryName: 'DevOps & Multi-Cloud' },
  { title: 'Terraform & Ansible Training',               categorySlug: 'devops-multi-cloud',       categoryName: 'DevOps & Multi-Cloud' },

  // Programming & Full Stack (currently has 1 course)
  { title: 'Full Stack Java Training',                   categorySlug: 'programming-full-stack',   categoryName: 'Programming & Full Stack' },
  { title: 'MERN Stack Training',                        categorySlug: 'programming-full-stack',   categoryName: 'Programming & Full Stack' },

  // Cyber Security & Networking (currently has 1 course)
  { title: 'Ethical Hacking & CEH Training',             categorySlug: 'cyber-security-networking', categoryName: 'Cyber Security & Networking' },
  { title: 'CompTIA Security+ Training',                 categorySlug: 'cyber-security-networking', categoryName: 'Cyber Security & Networking' },
]

// ── Generate a single course via Gemini ──────────────────────────────────────
async function generateCourse(title, categoryName) {
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    systemInstruction: SYSTEM_PROMPT,
    generationConfig: { responseMimeType: 'application/json' },
  })

  const userPrompt = `Generate complete course content for:
Course Title: "${title}"
Category: "${categoryName}"
Institute: COSS, Hyderabad (Dilsukhnagar & Ameerpet centres)
City focus: Hyderabad, Telangana, India

Make the content feel like it was written by the actual trainer who runs this course.
Include real tool versions, real certification exam codes, and specific Hyderabad job market context.
The description should read like a trainer talking to a prospective student, not a marketing brochure.`

  const result = await model.generateContent(userPrompt)
  const text = result.response.text().trim()
  // Strip markdown fences if the model includes them despite responseMimeType
  const clean = text.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim()
  return JSON.parse(clean)
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log(`\n🚀  Starting batch generation for ${COURSES.length} courses...\n`)

  // Cache category lookups so we don't hit the DB on every iteration
  const categoryCache = new Map()

  let success = 0
  let skipped = 0
  let failed = 0

  for (let i = 0; i < COURSES.length; i++) {
    const course = COURSES[i]
    console.log(`[${i + 1}/${COURSES.length}] ⏳  ${course.title}`)

    // ── Look up category ───────────────────────────────────────────────────
    if (!categoryCache.has(course.categorySlug)) {
      const cat = await prisma.courseCategory.findUnique({
        where: { slug: course.categorySlug },
        select: { id: true, name: true, slug: true },
      })
      categoryCache.set(course.categorySlug, cat)
    }
    const category = categoryCache.get(course.categorySlug)

    if (!category) {
      console.warn(`       ⚠️   Category not found in DB: "${course.categorySlug}" — skipping`)
      skipped++
      continue
    }

    // ── Check for duplicate slug upfront (we don't know slug yet, so skip this) ──
    // Duplicate slugs are caught by Prisma P2002 below.

    try {
      // ── Generate content ─────────────────────────────────────────────────
      const gen = await generateCourse(course.title, course.categoryName)

      // ── Check for existing slug to avoid P2002 ───────────────────────────
      const existing = await prisma.course.findUnique({ where: { slug: gen.slug } })
      if (existing) {
        console.warn(`       ⚠️   Slug "${gen.slug}" already exists (id: ${existing.id}) — appending suffix`)
        gen.slug = `${gen.slug}-2`
      }

      // ── Save to DB ───────────────────────────────────────────────────────
      const saved = await prisma.course.create({
        data: {
          title:         course.title,
          slug:          gen.slug,
          description:   gen.description,
          excerpt:       gen.excerpt ?? gen.description.slice(0, 155),
          category:      category.name,          // plain string field
          categoryId:    category.id,            // FK relation
          categorySlug:  category.slug,
          duration:      gen.duration,
          mode:          gen.mode ?? 'Classroom',
          level:         gen.level,
          price:         typeof gen.price === 'number' ? gen.price : null,
          originalPrice: typeof gen.originalPrice === 'number' ? gen.originalPrice : null,
          badge:         gen.badge ?? null,
          highlights:    Array.isArray(gen.highlights) ? gen.highlights : [],
          syllabus:      gen.syllabus ?? [],
          tools:         Array.isArray(gen.tools) ? gen.tools : [],
          seoTitle:      gen.seoTitle ?? null,
          seoDesc:       gen.seoDesc ?? null,
          status:        'draft',
          urlType:       'new',
          sortOrder:     0,
          featured:      false,
        },
      })

      console.log(`       ✅  Saved draft (id: ${saved.id}) — slug: ${saved.slug}`)
      success++

      // Rate-limit: 2 s between calls (Gemini free tier ~15 req/min)
      if (i < COURSES.length - 1) {
        await new Promise(r => setTimeout(r, 2000))
      }

    } catch (err) {
      if (err?.code === 'P2002') {
        console.error(`       ❌  Slug conflict for "${course.title}" — skipping`)
        skipped++
      } else {
        console.error(`       ❌  Failed: "${course.title}"`, err?.message ?? err)
        failed++
      }
      // Wait longer after any error before continuing
      await new Promise(r => setTimeout(r, 5000))
    }
  }

  console.log('\n─────────────────────────────────────────────────')
  console.log(`✅  Done.  Success: ${success}  |  Skipped: ${skipped}  |  Failed: ${failed}`)
  console.log('\nNext steps:')
  console.log('  1. Go to /admin/courses and filter by status = Draft')
  console.log('  2. Open each course — review AI-generated content for accuracy')
  console.log('  3. Review content, then click Publish')
  console.log('─────────────────────────────────────────────────\n')
}

main()
  .catch(err => { console.error('Fatal error:', err); process.exit(1) })
  .finally(() => prisma.$disconnect())
