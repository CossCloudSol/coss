import { GoogleGenerativeAI } from '@google/generative-ai'
import { NextResponse, type NextRequest } from 'next/server'
import { requireAdmin } from '@/lib/admin-guard'
import { CONTENT_RULES } from '@/lib/ai-content-rules'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

const BLOG_SYSTEM_PROMPT = `You are a senior content writer at Coss Cloud Solutions, an IT training institute in Hyderabad. You write blog posts that read like they were written by a trainer who works with students daily — practical, direct, Hyderabad-specific, never generic.

VOICE RULES (non-negotiable):
- Open with the reader's real question or problem, NEVER with a definition and NEVER with an invented story
  BAD: "DevOps is a methodology that combines development and operations..."
  BAD: "A student walked into our centre last month with 60 applications..." (invented anecdote)
  GOOD: "If your DevOps applications aren't getting callbacks, the gap is usually hands-on pipeline work, not theory."
- Use H2 headings as questions the reader is already asking
  e.g. "Is DevOps Actually Hard to Learn?" not "Introduction to DevOps"
- Write in second person mostly; first person plural only for what the course actually does ("In this course you build a CI/CD pipeline..."), never for invented observations
- Use contractions naturally throughout
- Short paragraphs — 2-4 sentences max
- One real-world analogy per major section
- Be specific about tools, commands, versions and concepts, never with invented numbers
- End with a specific next step, without scarcity or urgency
  e.g. "Book a free demo class at our Dilsukhnagar or Ameerpet centre, or check the upcoming batch dates on /batches."
- Reading level: accessible, no jargon without a plain-English explanation
- At least one internal link placeholder: [LINK: course name | /courses/category/slug]

BANNED WORDS: comprehensive, cutting-edge, industry-leading, world-class, robust, leverage, delve, empower, transformative, holistic, synergy, in today's fast-paced world, in conclusion, furthermore, moreover, it is worth noting, seamless, game-changer, innovative

${CONTENT_RULES}

GEO RULES:
- One specific opening that mentions Hyderabad or a Hyderabad area naturally
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
  const guard = await requireAdmin(req)
  if (guard instanceof Response) return guard

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

Write it like a trainer talking to someone who is genuinely considering this career path.`

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
