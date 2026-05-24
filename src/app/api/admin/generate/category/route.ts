import { GoogleGenerativeAI } from '@google/generative-ai'
import { NextResponse, type NextRequest } from 'next/server'
import { getSession } from '@/lib/session'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

const CATEGORY_PROMPT = `You write short, specific category descriptions for a Hyderabad IT training institute (COSS).
No generic phrases. Each description must mention: what roles it leads to, Hyderabad job market context.
Under 120 words. Professional but not corporate.
Return ONLY valid JSON: {"description":"...","seoTitle":"...","seoDesc":"...","suggestedSlug":"..."}`

export async function POST(req: NextRequest): Promise<Response> {
  const probe = NextResponse.next()
  const session = await getSession(req, probe)
  if (!session.isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

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
      model: 'gemini-2.0-flash',
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
