// scripts/seed-hr-quantum.mjs
// Run: node --env-file=.env --env-file=.env.local scripts/seed-hr-quantum.mjs
import { PrismaClient } from '@prisma/client'
import { GoogleGenerativeAI } from '@google/generative-ai'

const db = new PrismaClient()
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

const COURSE_SYSTEM_PROMPT = `You are a senior content writer at COSS (Cloud & Open Source Solutions), a training institute in Hyderabad with centres in Dilsukhnagar and Ameerpet. You write like an experienced trainer who knows students personally — direct, specific, confident, never corporate or generic.

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
- SEO title: under 60 chars, format: "[Topic] Training in Hyderabad | COSS"
- Meta desc: under 155 chars, must include: one number or data point, one action verb, "Hyderabad"
- Use LSI keywords — related terms not just the main keyword repeated
- Mention Hyderabad naturally maximum 3 times in the description body

GEO RULES:
- One specific Hyderabad area name in the description
- One local employer example with context ("Companies like TCS and Wipro in HITEC City...")
- One Hyderabad salary range data point (research realistic 2025-2026 ranges)
- Mention weekend batch availability (targets Hyderabad working professionals)
- Reference "Dilsukhnagar" or "Ameerpet" as COSS centre locations

PLACEHOLDER RULES:
- Use [BATCH_DATE] where a batch date is needed
- Use [STUDENT_COUNT] where placement/student numbers appear
- Use [TRAINER_NAME] where a trainer name would appear
- These must be filled by admin before publishing

SYLLABUS RULES:
- 5-8 modules minimum
- Each module: 4-6 specific topics
- Topics must be specific tool/concept names, not vague descriptions
- First module always: fundamentals/prerequisites
- Last module always: real-world project / certification prep

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
  "seoTitle": "string (max 60 chars)",
  "seoDesc": "string (max 155 chars)"
}`

const NEW_CATEGORIES = [
  {
    name: 'Human Resource',
    slug: 'human-resource',
    description: 'HR training covering recruitment, operations, business partnering and leadership — built for Hyderabad professionals moving into or growing within HR roles.',
    icon: 'ti-users',
    color: '#D4537E',
    sortOrder: 11,
    isLegacy: false,
    status: 'published',
    seoTitle: 'HR Training Courses in Hyderabad | COSS',
    seoDesc: 'HR recruitment, operations & leadership training in Hyderabad. COSS — practical, placement-focused batches at Dilsukhnagar & Ameerpet.',
  },
  {
    name: 'Quantum Computing',
    slug: 'quantum-computing',
    description: 'Future-focused quantum computing training for Hyderabad IT professionals who want to get ahead of the curve before the market matures.',
    icon: 'ti-atom',
    color: '#534AB7',
    sortOrder: 12,
    isLegacy: false,
    status: 'published',
    seoTitle: 'Quantum Computing Training in Hyderabad | COSS',
    seoDesc: 'Quantum computing course in Hyderabad. Get ahead of the curve — COSS training for forward-thinking IT professionals.',
  },
]

const COURSES = [
  {
    title: 'HR Recruitment Training',
    categorySlug: 'human-resource',
    price: 12000,
    originalPrice: 15000,
    overrideBadge: 'Popular',
    overrideLevel: null,
    specialInstructions: `Focus on: sourcing, screening, interviewing, onboarding, HR tech.
Tools to mention: LinkedIn Recruiter, Naukri.com, ATS systems (Keka Recruit / Zoho Recruit), MS Excel, HRMS platforms.
Highlights must include placement support and weekend batch option.
Target audience: freshers and working professionals switching to HR recruitment roles.`,
  },
  {
    title: 'HR Operations Training',
    categorySlug: 'human-resource',
    price: 12000,
    originalPrice: 15000,
    overrideBadge: null,
    overrideLevel: null,
    specialInstructions: `Syllabus must cover: payroll processing, statutory compliance (PF/ESI/PT/TDS), HRIS, employee lifecycle management, exit formalities.
Tools to mention: SAP HCM, Darwinbox, GreytHR, Keka HRMS, MS Excel.
Context: Hyderabad IT/ITES sector has high demand for HR ops specialists.
Target audience: HR executives wanting to specialize in operations and compliance.`,
  },
  {
    title: 'HR Business Partner Training',
    categorySlug: 'human-resource',
    price: 14000,
    originalPrice: 18000,
    overrideBadge: 'High Demand',
    overrideLevel: 'Intermediate',
    specialInstructions: `Position HRBP as a strategic role, NOT administrative.
Syllabus must cover: workforce planning, organizational development, talent management, stakeholder management, data-driven HR decision making.
Tone should be senior/strategic — not entry-level framing.
Mention Hyderabad IT companies (TCS, Infosys, HCL) actively hiring HRBPs.
Target audience: HR professionals with 3-5 years of experience looking to move into strategic HR roles.`,
  },
  {
    title: 'HR Leadership Training',
    categorySlug: 'human-resource',
    price: 15000,
    originalPrice: 20000,
    overrideBadge: null,
    overrideLevel: 'Advanced',
    specialInstructions: `Target mid-senior HR professionals, NOT freshers. Use language like "HR Managers", "HR Heads", "Senior HRBPs".
Syllabus must cover: people strategy, change management, executive presence, HR metrics & dashboards, board-level reporting.
Distinguish from generic management training — this is specifically for HR leaders.
Mention salary benchmarks for HR leadership roles in Hyderabad.`,
  },
  {
    title: 'HR Learning and Development Training',
    categorySlug: 'human-resource',
    price: 12000,
    originalPrice: 15000,
    overrideBadge: null,
    overrideLevel: null,
    specialInstructions: `Syllabus must cover: Training Needs Analysis (TNA), instructional design principles, LMS platforms, e-learning content creation, L&D metrics and ROI.
Tools to mention: Moodle, Cornerstone OnDemand, LinkedIn Learning, Articulate 360, Canva for training materials.
Position L&D as a growing career path within HR — Hyderabad IT companies investing heavily in L&D roles.
Target audience: HR professionals wanting to specialize in L&D, and trainers looking to formalize their skills.`,
  },
  {
    title: 'HR Management Training',
    categorySlug: 'human-resource',
    price: 10000,
    originalPrice: 13000,
    overrideBadge: 'Bestseller',
    overrideLevel: 'Beginner',
    specialInstructions: `This is the broad/foundational HR course — the complete HR lifecycle from recruitment to exit.
Good for: freshers entering HR for the first time, and non-HR professionals switching into HR roles.
Level: Beginner / All Levels.
Syllabus: full HR lifecycle — recruitment → onboarding → payroll → L&D → compliance → exit.
This is likely the highest search volume course, so description should be welcoming and accessible.
No jargon-heavy positioning — speak to someone completely new to HR.`,
  },
  {
    title: 'Business Development Training',
    categorySlug: 'human-resource',
    price: 12000,
    originalPrice: 15000,
    overrideBadge: null,
    overrideLevel: null,
    specialInstructions: `IMPORTANT: Business Development is NOT an HR course. Do NOT drift into HR content.
Syllabus must cover: B2B sales strategy, lead generation, client acquisition and retention, CRM usage, negotiation skills, pitch decks and presentations.
Tools to mention: Salesforce CRM, HubSpot, LinkedIn Sales Navigator, MS Excel, PowerPoint.
Hyderabad context: IT services BD roles, GCC (Global Capability Centres) opportunities, startup ecosystem.
Target audience: freshers who want a sales/BD career AND professionals who want to transition into BD roles.
If the output starts drifting into HR — this is a sales role, not an HR role.`,
  },
  {
    title: 'Quantum Computing Training',
    categorySlug: 'quantum-computing',
    price: 18000,
    originalPrice: 22000,
    overrideBadge: 'New',
    overrideLevel: 'Intermediate',
    specialInstructions: `CRITICAL TONE RULE: Be HONEST about where the Quantum Computing job market is.
- Do NOT promise "high-demand jobs in Hyderabad right now" — that is not true yet.
- DO position as future-focused: "roles that will define the next decade", "get ahead before the market matures"
- Target audience: IT professionals (developers, data scientists, researchers) who want to future-proof their career
- Mention: TCS Research, IITs, IBM India, Microsoft Research India as places hiring in this space (research roles)

Syllabus must cover:
1. Quantum mechanics fundamentals (framed as "no PhD needed")
2. Qubits, superposition, entanglement — plain English explanations
3. Quantum gates and circuits
4. IBM Qiskit SDK (open source)
5. Quantum algorithms: Shor's algorithm, Grover's algorithm
6. Quantum cryptography basics (QKD)
7. Industry applications: pharma drug discovery, financial optimization, logistics

Tools to mention: Qiskit (IBM), IBM Quantum Experience (cloud platform), Cirq (Google), Python 3.x.
Level: Intermediate — requires basic Python/programming knowledge.
The description must be honest about the nascent job market while still being genuinely compelling for forward-thinking professionals.`,
  },
]

const MODEL_FALLBACKS = ['gemini-1.5-flash', 'gemini-1.5-flash-8b', 'gemini-2.0-flash']

async function generateCourse(title, categoryName, specialInstructions, modelName = MODEL_FALLBACKS[0]) {
  const userPrompt = `Generate complete course content for:
Course Title: "${title}"
Category: "${categoryName}"
Institute: COSS, Hyderabad (Dilsukhnagar & Ameerpet centres)
City focus: Hyderabad, Telangana, India

${specialInstructions}

Make the content feel like it was written by the actual trainer who runs this course.
Include real tool versions, real certification exam codes where applicable, and specific Hyderabad job market context.
The description should read like a trainer talking to a prospective student, not a marketing brochure.`

  const model = genAI.getGenerativeModel({
    model: modelName,
    systemInstruction: COURSE_SYSTEM_PROMPT,
    generationConfig: { responseMimeType: 'application/json' },
  })

  const result = await model.generateContent(userPrompt)
  const text = result.response.text().trim()
  return JSON.parse(text)
}

async function main() {
  console.log('\n=== COSS Content Seed: Human Resource + Quantum Computing ===\n')

  if (!process.env.GEMINI_API_KEY) {
    console.error('❌ GEMINI_API_KEY not set. Run with --env-file=.env.local')
    process.exit(1)
  }

  // ── Phase 1: Create categories ──────────────────────────────────────────────
  console.log('Phase 1 — Creating 2 new categories...\n')
  const categoryMap = {}

  for (const cat of NEW_CATEGORIES) {
    const created = await db.courseCategory.upsert({
      where: { slug: cat.slug },
      update: cat,
      create: cat,
    })
    categoryMap[cat.slug] = created
    console.log(`  ✓ ${cat.name} (id: ${created.id})`)
  }

  console.log('\n✅ Categories created.\n')

  // ── Phase 2: Generate + create courses ─────────────────────────────────────
  console.log('Phase 2 — Generating 8 courses via Gemini...\n')

  const createdCourses = []
  let idx = 0

  for (const courseDef of COURSES) {
    idx++
    const cat = categoryMap[courseDef.categorySlug]
    console.log(`  [${idx}/8] Generating: "${courseDef.title}" ...`)

    let generated
    let succeeded = false
    for (const modelName of MODEL_FALLBACKS) {
      try {
        generated = await generateCourse(courseDef.title, cat.name, courseDef.specialInstructions, modelName)
        console.log(`     (model: ${modelName})`)
        succeeded = true
        break
      } catch (err) {
        const retryMatch = err.message?.match(/Please retry in ([\d.]+)s/)
        const waitMs = retryMatch ? Math.ceil(parseFloat(retryMatch[1]) * 1000) + 2000 : 5000
        console.warn(`  ⚠ ${modelName} failed (429). Trying next model after ${Math.round(waitMs/1000)}s...`)
        await new Promise(r => setTimeout(r, waitMs))
        // try same model once more after waiting
        try {
          generated = await generateCourse(courseDef.title, cat.name, courseDef.specialInstructions, modelName)
          console.log(`     (model: ${modelName} — succeeded after wait)`)
          succeeded = true
          break
        } catch {
          // continue to next model
        }
      }
    }
    if (!succeeded) {
      console.error(`  ❌ All models failed for "${courseDef.title}" — skipping.`)
      continue
    }

    const badge = courseDef.overrideBadge ?? generated.badge ?? 'New'
    const level = courseDef.overrideLevel ?? generated.level ?? 'Beginner'

    let course
    try {
      course = await db.course.create({
        data: {
          title: courseDef.title,
          slug: generated.slug,
          excerpt: generated.excerpt,
          description: generated.description,
          highlights: generated.highlights ?? [],
          syllabus: generated.syllabus ?? [],
          tools: generated.tools ?? [],
          duration: generated.duration ?? '45 Days',
          level,
          mode: 'Classroom',
          badge,
          price: courseDef.price,
          originalPrice: courseDef.originalPrice,
          status: 'published',
          featured: false,
          sortOrder: idx,
          seoTitle: generated.seoTitle,
          seoDesc: generated.seoDesc,
          category: cat.name,
          categoryId: cat.id,
          categorySlug: cat.slug,
          urlType: 'new',
        },
      })
    } catch (dbErr) {
      if (dbErr.code === 'P2002') {
        console.warn(`  ⚠ Slug "${generated.slug}" already exists — skipping.`)
      } else {
        console.error(`  ❌ DB error: ${dbErr.message}`)
      }
      continue
    }

    createdCourses.push({ title: courseDef.title, slug: course.slug, categorySlug: courseDef.categorySlug })
    console.log(`  ✓ Published → /courses/${courseDef.categorySlug}/${course.slug}`)

    // Brief pause between Gemini calls to respect rate limits
    if (idx < COURSES.length) await new Promise(r => setTimeout(r, 1500))
  }

  // ── Summary ─────────────────────────────────────────────────────────────────
  console.log('\n\n=== DONE — Course URLs ===\n')
  for (const c of createdCourses) {
    console.log(`  /courses/${c.categorySlug}/${c.slug}`)
  }

  console.log(`\n  Total created: ${createdCourses.length} / 8`)
  console.log('\n  Category pages:')
  console.log('  /courses/human-resource')
  console.log('  /courses/quantum-computing')

  // Print the Quantum Computing description for tone check
  const qc = createdCourses.find(c => c.categorySlug === 'quantum-computing')
  if (qc) {
    console.log('\n  Quantum Computing slug:', qc.slug)
    const qcCourse = await db.course.findUnique({ where: { slug: qc.slug }, select: { description: true } })
    if (qcCourse) {
      const firstPara = qcCourse.description.split('\n').find(l => l.trim().length > 30) ?? ''
      console.log('\n  === Quantum Computing — first paragraph (tone check) ===')
      console.log(' ', firstPara)
    }
  }

  await db.$disconnect()
}

main().catch(e => {
  console.error('\n❌ Fatal error:', e)
  db.$disconnect()
  process.exit(1)
})
