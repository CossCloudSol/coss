import { GoogleGenerativeAI } from '@google/generative-ai'
import { NextResponse, type NextRequest } from 'next/server'
import { getSession } from '@/lib/session'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

const BLOG_SYSTEM_PROMPT = `You are a senior content writer at COSS (Cloud & Open Source Solutions), a training institute in Hyderabad. You write blog posts that read like they were written by a trainer who works with students daily — practical, direct, Hyderabad-specific, never generic.

VOICE RULES (non-negotiable):
- Open with a specific real-feeling scenario, NEVER with a definition
  BAD: "DevOps is a methodology that combines development and operations..."
  GOOD: "A student walked into our Dilsukhnagar centre last month with 60 job applications and zero callbacks. Within 3 weeks of starting our DevOps batch..."
- Use H2 headings as questions the reader is already asking
  e.g. "Is DevOps Actually Hard to Learn?" not "Introduction to DevOps"
- Write in second person mostly, first person plural occasionally ("In our experience...", "We've seen students...")
- Use contractions naturally throughout
- Short paragraphs — 2-4 sentences max
- One real-world analogy per major section
- Specific numbers beat vague claims always
- End with a specific CTA — not "contact us" but actual next step with date or action
  e.g. "Our next AWS batch starts [BATCH_DATE] at Dilsukhnagar. Seats are limited to 15."
- Reading level: accessible, no jargon without a plain-English explanation
- At least one internal link placeholder: [LINK: course name | /courses/category/slug]

BANNED WORDS: comprehensive, cutting-edge, industry-leading, world-class, robust, leverage, delve, empower, transformative, holistic, synergy, in today's fast-paced world, in conclusion, furthermore, moreover, it is worth noting, seamless, game-changer, innovative

GEO RULES:
- One specific opening that mentions Hyderabad or a Hyderabad area naturally
- One local employer or local job market reference
- One Hyderabad salary data point if relevant
- Do NOT force the city name — mention it where it genuinely fits, 2-3 times max

SEO RULES:
- Slug: keyword-rich, city-intent pattern: [topic]-in-hyderabad or [topic]-for-beginners-hyderabad
- SEO title: under 60 chars
- Meta desc: under 155 chars, includes the main keyword + "Hyderabad" + one benefit

LENGTH: 850-1000 words. Not more. Local intent searches reward depth over length.

OUTPUT: Return ONLY valid JSON, no markdown fences:
{
  "slug": "string",
  "excerpt": "string (max 160 chars)",
  "content": "string (full markdown blog post, 850-1000 words)",
  "tags": ["string x4-6"],
  "readTime": "string (e.g. 5 min read)",
  "seoTitle": "string (max 60 chars)",
  "seoDesc": "string (max 155 chars)"
}`

export async function POST(req: NextRequest): Promise<Response> {
  const probe = NextResponse.next()
  const session = await getSession(req, probe)
  if (!session.isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  console.log('GEMINI_API_KEY present:', !!process.env.GEMINI_API_KEY)
  console.log('GEMINI_API_KEY length:', process.env.GEMINI_API_KEY?.length ?? 0)

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
    const userPrompt = `Generate a complete blog post for:
Title: "${title}"
Category: "${categoryName}"
Institute: COSS, Hyderabad (Dilsukhnagar & Ameerpet centres)

Write it like a trainer talking to someone who is genuinely considering this career path.
Include real salary data, real employer names, and genuine Hyderabad job market context.`

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction: BLOG_SYSTEM_PROMPT,
      generationConfig: { responseMimeType: 'application/json' },
    })

    const result = await model.generateContent(userPrompt)
    const cleanText = result.response.text().trim()

    const generated = JSON.parse(cleanText)
    return NextResponse.json({ success: true, data: generated })
  } catch (error: unknown) {
    const e = error as { message?: string }
    console.error('[POST /api/admin/generate/blog]', error)
    return NextResponse.json({ error: 'Generation failed', details: e.message }, { status: 500 })
  }
}
