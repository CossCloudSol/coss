import Anthropic from '@anthropic-ai/sdk'
import { NextResponse, type NextRequest } from 'next/server'
import { getSession } from '@/lib/session'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const client = new Anthropic()

const FIELD_PROMPTS: Record<string, string> = {
  slug: 'Return ONLY valid JSON: {"value": "seo-slug-5-8-words-in-hyderabad"}. SEO-friendly slug, 5-8 words, ends with -in-hyderabad.',
  description: 'Return ONLY valid JSON: {"value": "200-300 word course description in human trainer voice with Hyderabad context"}. Direct, second-person, no banned words (comprehensive, cutting-edge, robust, leverage, etc.).',
  excerpt: 'Return ONLY valid JSON: {"value": "max 160 char excerpt"}. One punchy sentence.',
  highlights: 'Return ONLY valid JSON: {"value": ["highlight 1", "highlight 2", ...]}. 6-8 specific, concrete highlights.',
  syllabus: 'Return ONLY valid JSON: {"value": [{"module": "Module Name", "topics": ["topic1", "topic2", "topic3", "topic4"]}]}. 5-8 modules, 4-6 topics each.',
  tools: 'Return ONLY valid JSON: {"value": ["Tool1", "Tool2", ...]}. 6-10 specific tools with versions where relevant.',
  seoTitle: 'Return ONLY valid JSON: {"value": "SEO Title under 60 chars | COSS"}.',
  seoDesc: 'Return ONLY valid JSON: {"value": "Meta description under 155 chars with keyword + Hyderabad + benefit"}.',
  content: 'Return ONLY valid JSON: {"value": "full markdown blog post 850-1000 words"}. Use H2s as questions. Open with scenario, not definition.',
  tags: 'Return ONLY valid JSON: {"value": ["tag1", "tag2", "tag3", "tag4"]}. 4-6 relevant tags.',
  readTime: 'Return ONLY valid JSON: {"value": "X min read"}.',
}

export async function POST(req: NextRequest): Promise<Response> {
  const probe = NextResponse.next()
  const session = await getSession(req, probe)
  if (!session.isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  let body: { field?: string; title?: string; categoryName?: string; currentContent?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { field, title, categoryName } = body
  if (!field || !title || !categoryName) {
    return NextResponse.json({ error: 'field, title, and categoryName are required' }, { status: 400 })
  }

  const fieldPrompt = FIELD_PROMPTS[field]
  if (!fieldPrompt) {
    return NextResponse.json({ error: `Unknown field: ${field}` }, { status: 400 })
  }

  try {
    const userPrompt = `Regenerate the "${field}" field for:
Title: "${title}"
Category: "${categoryName}"
Institute: COSS, Hyderabad${body.currentContent ? `\nCurrent content to improve: "${body.currentContent}"` : ''}`

    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1200,
      system: `You are a content writer at COSS Hyderabad training institute. ${fieldPrompt}`,
      messages: [{ role: 'user', content: userPrompt }],
    })

    const rawText = message.content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map((block) => block.text)
      .join('')

    const cleanText = rawText
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim()

    const parsed = JSON.parse(cleanText)
    return NextResponse.json({ success: true, value: parsed.value })
  } catch (error: unknown) {
    const e = error as { message?: string }
    console.error('[POST /api/admin/generate/field]', error)
    return NextResponse.json({ error: 'Generation failed', details: e.message }, { status: 500 })
  }
}
