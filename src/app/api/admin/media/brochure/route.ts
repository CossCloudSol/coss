import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { getSession } from '@/lib/session'
import { uploadAsset } from '@/lib/cloudinary-admin'

export const dynamic = 'force-dynamic'

// Same ceiling as /api/admin/media/assets — Vercel Hobby serverless function
// request bodies are capped around 4.5 MB regardless of any check here.
const MAX_UPLOAD_BYTES = 4 * 1024 * 1024

const FOLDER = 'cosscloudsol/course-brochures'

function matchesPdfMagicBytes(buffer: Buffer): boolean {
  return (
    buffer.length >= 5 &&
    buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 &&
    buffer[3] === 0x46 && buffer[4] === 0x2d
  )
}

// original filename minus extension -> lowercase -> non-alnum runs to '-' ->
// trim leading/trailing '-' -> truncate to 60 chars. Empty result -> 'brochure'.
function sanitizeBaseName(filename: string): string {
  const withoutExt = filename.replace(/\.[^./]+$/, '')
  const base = withoutExt
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .slice(0, 60)
    .replace(/^-+|-+$/g, '')
  return base || 'brochure'
}

export async function POST(req: NextRequest) {
  const probe = NextResponse.next()
  const session = await getSession(req, probe)
  if (!session.isAdmin) {
    console.warn('[media/brochure POST] rejected — no admin session', {
      path: req.nextUrl.pathname,
    })
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let form: FormData
  try {
    form = await req.formData()
  } catch (err) {
    console.warn('[media/brochure POST] malformed multipart body', err)
    return NextResponse.json({ error: 'Malformed upload request' }, { status: 400 })
  }

  const file = form.get('file')
  if (!(file instanceof File)) {
    console.warn('[media/brochure POST] no file provided')
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    console.warn('[media/brochure POST] file too large', { size: file.size })
    return NextResponse.json({ error: 'File exceeds the 4 MB upload limit' }, { status: 413 })
  }

  if (file.type !== 'application/pdf') {
    console.warn('[media/brochure POST] disallowed mime type', { type: file.type })
    return NextResponse.json(
      { error: `Unsupported file type "${file.type}". Only PDF is allowed.` },
      { status: 415 },
    )
  }

  const buffer = Buffer.from(await file.arrayBuffer())

  if (!matchesPdfMagicBytes(buffer)) {
    console.warn('[media/brochure POST] file contents do not match declared type')
    return NextResponse.json(
      { error: 'File contents do not match the declared file type' },
      { status: 415 },
    )
  }

  const base = sanitizeBaseName(file.name)
  const suffix = randomBytes(5).toString('hex')
  const publicId = `${base}-${suffix}`

  try {
    const result = await uploadAsset(buffer, file.type, FOLDER, publicId, 'raw')
    return NextResponse.json({
      publicId: result.public_id,
      secureUrl: result.secure_url,
      bytes: result.bytes,
    })
  } catch (err) {
    console.error('[media/brochure POST] Cloudinary upload failed', err)
    return NextResponse.json({ error: 'Upload failed' }, { status: 502 })
  }
}
