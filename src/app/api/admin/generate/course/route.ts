import { GoogleGenerativeAI } from '@google/generative-ai'
import { NextResponse, type NextRequest } from 'next/server'
import { getSession } from '@/lib/session'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

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

export async function POST(req: NextRequest): Promise<Response> {
  const probe = NextResponse.next()
  const session = await getSession(req, probe)
  if (!session.isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  let body: { title?: string; categoryName?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { title, categoryName } = body
  if (!title || !categoryName) {
    return NextResponse.json({ error: 'title and categoryName are required' }, { status: 400 })
  }

  try {
    const userPrompt = `Generate complete course content for:
Course Title: "${title}"
Category: "${categoryName}"
Institute: COSS, Hyderabad (Dilsukhnagar & Ameerpet centres)
City focus: Hyderabad, Telangana, India

Make the content feel like it was written by the actual trainer who runs this course.
Include real tool versions, real certification exam codes, and specific Hyderabad job market context.
The description should read like a trainer talking to a prospective student, not a marketing brochure.`

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      systemInstruction: COURSE_SYSTEM_PROMPT,
      generationConfig: { responseMimeType: 'application/json' },
    })

    const result = await model.generateContent(userPrompt)
    const cleanText = result.response.text().trim()

    const generated = JSON.parse(cleanText)
    return NextResponse.json({ success: true, data: generated })
  } catch (error: unknown) {
    const e = error as { message?: string }
    console.error('[POST /api/admin/generate/course]', error)
    return NextResponse.json({ error: 'Generation failed', details: e.message }, { status: 500 })
  }
}
