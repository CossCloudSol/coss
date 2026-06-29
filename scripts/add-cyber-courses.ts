import { PrismaClient } from '@prisma/client'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { readFileSync } from 'fs'
import { resolve } from 'path'

// Load .env.local manually (no dotenv dependency)
try {
  const envPath = resolve(process.cwd(), '.env.local')
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    const key = trimmed.slice(0, eq).trim()
    const val = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '')
    if (!process.env[key]) process.env[key] = val
  }
} catch { /* .env.local not found, rely on existing env */ }

const prisma = new PrismaClient()
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

async function generateWithRetry(prompt1: string, prompt2: string, retries = 4): Promise<string> {
  const models = ['gemini-2.5-flash', 'gemini-2.0-flash']
  for (let attempt = 0; attempt <= retries; attempt++) {
    const modelName = models[Math.min(attempt >= 2 ? 1 : 0, models.length - 1)]
    try {
      const m = genAI.getGenerativeModel({ model: modelName })
      const result = await m.generateContent([{ text: prompt1 }, { text: prompt2 }])
      return result.response.text().trim()
    } catch (err: any) {
      if (attempt < retries && (err?.status === 503 || err?.status === 429)) {
        const wait = Math.pow(2, attempt) * 5000
        console.log(`  ⚠️  ${modelName} busy (${err.status}), retrying in ${wait / 1000}s...`)
        await new Promise(r => setTimeout(r, wait))
      } else {
        throw err
      }
    }
  }
  throw new Error('All retries exhausted')
}

const SYSTEM_PROMPT = `You are a course content writer for Coss Cloud Solutions, an IT training institute
in Hyderabad with centres in Dilsukhnagar and Ameerpet. 15+ years experience. Students placed at TCS, Infosys,
Wipro, HCL, Cognizant and Hyderabad-based startups in HITEC City, Gachibowli, Madhapur.

RULES:
- Write in human voice. No AI-sounding phrases.
- BANNED WORDS: comprehensive, cutting-edge, leverage, delve, robust, seamlessly, unlock, empower,
  transformative, game-changer, revolutionize, synergy, holistic, dive deep, spearhead, foster,
  utilize, dynamic, innovative
- Every description must mention job roles and Hyderabad job market context
- Description: under 120 words
- Slug: keyword-rich, lowercase, hyphens only, e.g. "ethical-hacking-ceh-training-hyderabad"
- Duration: realistic (e.g. "45 Days", "60 Days")
- Mode: "Classroom"
- Level: "Beginner" or "Intermediate"
- Highlights: exactly 4 items, each under 8 words
- Syllabus: 4-6 modules, each with 3-5 topics
- Tools: 3-6 real tools
- Price: between 15000 and 35000
- originalPrice: 20-40% higher than price
- Use realistic batch schedules (e.g. Every Monday, Weekend batches) and real student counts (500+, 1200+)
- seoTitle: "[Course Name] in Hyderabad | Coss Cloud Solutions"
- seoDesc: under 155 chars, mention Hyderabad + placement
- excerpt: 1-2 sentence summary under 120 chars

Return ONLY valid JSON, no markdown fences:
{
  "slug": "",
  "description": "",
  "duration": "",
  "mode": "",
  "level": "",
  "price": 0,
  "originalPrice": 0,
  "highlights": ["","","",""],
  "syllabus": [{"module":"","topics":[""]}],
  "tools": [""],
  "enrolledCount": "500+ students enrolled",
  "nextBatch": "Every Monday",
  "seoTitle": "",
  "seoDesc": "",
  "excerpt": ""
}`

const COURSES = [
  { title: 'Ethical Hacking & CEH Training',  categorySlug: 'cyber-security', categoryName: 'Cyber Security & Networking' },
  { title: 'CompTIA Security+ Training',       categorySlug: 'cyber-security', categoryName: 'Cyber Security & Networking' },
]

async function main() {
  for (const course of COURSES) {
    console.log(`⏳ Generating: ${course.title}`)

    const category = await prisma.courseCategory.findUnique({
      where: { slug: course.categorySlug }
    })
    if (!category) {
      console.error(`❌ Category not found: ${course.categorySlug}`)
      continue
    }

    const raw = await generateWithRetry(
      SYSTEM_PROMPT,
      `Generate course content for: "${course.title}"\nCategory: ${course.categoryName}\nInstitute: Coss Cloud Solutions, Hyderabad`
    )
    const clean = raw.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim()
    const generated = JSON.parse(clean)

    const saved = await prisma.course.create({
      data: {
        title:         course.title,
        slug:          generated.slug,
        description:   generated.description,
        excerpt:       generated.excerpt ?? generated.description.slice(0, 155),
        category:      category.name,
        categoryId:    category.id,
        categorySlug:  category.slug,
        duration:      generated.duration,
        mode:          generated.mode ?? 'Classroom',
        level:         generated.level,
        price:         typeof generated.price === 'number' ? generated.price : null,
        originalPrice: typeof generated.originalPrice === 'number' ? generated.originalPrice : null,
        highlights:    Array.isArray(generated.highlights) ? generated.highlights : [],
        syllabus:      generated.syllabus ?? [],
        tools:         Array.isArray(generated.tools) ? generated.tools : [],
        seoTitle:      generated.seoTitle ?? null,
        seoDesc:       generated.seoDesc ?? null,
        status:        'draft',
        urlType:       'new',
        sortOrder:     0,
        featured:      false,
      }
    })

    console.log(`✅ Saved draft (id: ${saved.id}) — slug: ${saved.slug}`)
    await new Promise(r => setTimeout(r, 3000))
  }

  console.log('\n✅ Done. Both Cyber Security courses now in DB as drafts.')
}

main().catch(console.error).finally(() => prisma.$disconnect())
