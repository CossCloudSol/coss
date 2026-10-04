import { GoogleGenerativeAI } from '@google/generative-ai'
import { NextResponse, type NextRequest } from 'next/server'
import { requireAdmin } from '@/lib/admin-guard'
import { CONTENT_RULES } from '@/lib/ai-content-rules'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

const CATEGORY_PROMPT = `You write short, specific category descriptions for a Hyderabad IT training institute (COSS).
No generic phrases. Each description must mention: what roles it leads to.
Under 120 words. Professional but not corporate.

${CONTENT_RULES}

Return ONLY valid JSON: {"description":"...","seoTitle":"...","seoDesc":"...","suggestedSlug":"..."}`

export async function POST(req: NextRequest): Promise<Response> {
  const guard = await requireAdmin(req)
  if (guard instanceof Response) return guard

  let body: { name?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!body.name) {
    return NextResponse.json({ error: 'name is required' }, { status: 400 })
  }

  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction: CATEGORY_PROMPT,
      generationConfig: { responseMimeType: 'application/json' },
    })

    const result = await model.generateContent(
      `Generate for category: "${body.name}" at COSS Hyderabad training institute.`,
    )
    const cleanText = result.response.text().trim()

    const generated = JSON.parse(cleanText)
    return NextResponse.json({ success: true, data: generated })
  } catch (error: unknown) {
    const e = error as { message?: string }
    console.error('[POST /api/admin/generate/category]', error)
    return NextResponse.json({ error: 'Generation failed', details: e.message }, { status: 500 })
  }
}
