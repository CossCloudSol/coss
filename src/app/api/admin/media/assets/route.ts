import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { getSession } from '@/lib/session'
import { listAssets, uploadAsset } from '@/lib/cloudinary-admin'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const probe = NextResponse.next()
  const session = await getSession(req, probe)
  if (!session.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = req.nextUrl
  const cursor        = searchParams.get('cursor') ?? undefined
  const prefix        = searchParams.get('prefix') ?? undefined
  const resource_type = (searchParams.get('type') ?? 'image') as 'image' | 'raw'

  try {
    const data = await listAssets({ max_results: 20, next_cursor: cursor, prefix, resource_type })
    return NextResponse.json(data)
  } catch (err) {
    console.error('[media/assets GET]', err)
    return NextResponse.json({ error: 'Failed to fetch assets' }, { status: 500 })
  }
}

// ── Upload ──────────────────────────────────────────────────────────────

const MAX_UPLOAD_BYTES = 4 * 1024 * 1024 // 4 MB — see Commit 3 step 1 report on the Vercel Hobby body-size ceiling

// image/svg+xml deliberately excluded — SVG can carry <script>, and nothing
// in this upload path sanitises it.
// image/avif deliberately excluded on upload because delivery-side f_auto
// already serves AVIF to browsers that support it; accepting it as input
// adds an unverified brand-detection surface for no delivery benefit.
const ALLOWED_MIME_TYPES: readonly string[] = [
  'image/jpeg', 'image/png', 'image/webp', 'image/gif',
]

const DEFAULT_FOLDER = 'cosscloudsol/site-images'
const ALLOWED_FOLDERS: readonly string[] = [DEFAULT_FOLDER]

// Confirms the buffer's actual bytes match the declared MIME type, since
// file.type is client-supplied and cannot be trusted on its own. Covers
// exactly the 4 types in ALLOWED_MIME_TYPES — not a general sniffer.
function matchesMagicBytes(buffer: Buffer, mimeType: string): boolean {
  switch (mimeType) {
    case 'image/jpeg':
      return buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff
    case 'image/png':
      return (
        buffer.length >= 8 &&
        buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47 &&
        buffer[4] === 0x0d && buffer[5] === 0x0a && buffer[6] === 0x1a && buffer[7] === 0x0a
      )
    case 'image/gif':
      return (
        buffer.length >= 6 &&
        buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x38 &&
        (buffer[4] === 0x37 || buffer[4] === 0x39) && buffer[5] === 0x61
      )
    case 'image/webp':
      return (
        buffer.length >= 12 &&
        buffer.toString('ascii', 0, 4) === 'RIFF' &&
        buffer.toString('ascii', 8, 12) === 'WEBP'
      )
    default:
      return false
  }
}

// original filename minus extension -> lowercase -> non-alnum runs to '-' ->
// trim leading/trailing '-' -> truncate to 60 chars. Empty result -> 'asset'.
function sanitizeBaseName(filename: string): string {
  const withoutExt = filename.replace(/\.[^./]+$/, '')
  const base = withoutExt
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .slice(0, 60)
    .replace(/^-+|-+$/g, '')
  return base || 'asset'
}

export async function POST(req: NextRequest) {
  const probe = NextResponse.next()
  const session = await getSession(req, probe)
  if (!session.isAdmin) {
    console.warn('[media/assets POST] rejected — no admin session', {
      path: req.nextUrl.pathname,
    })
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let form: FormData
  try {
    form = await req.formData()
  } catch (err) {
    console.warn('[media/assets POST] malformed multipart body', err)
    return NextResponse.json({ error: 'Malformed upload request' }, { status: 400 })
  }

  const file = form.get('file')
  const folderInput = form.get('folder')

  if (!(file instanceof File)) {
    console.warn('[media/assets POST] no file provided')
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    console.warn('[media/assets POST] file too large', { size: file.size })
    return NextResponse.json({ error: 'File exceeds the 4 MB upload limit' }, { status: 413 })
  }

  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    console.warn('[media/assets POST] disallowed mime type', { type: file.type })
    return NextResponse.json(
      { error: `Unsupported file type "${file.type}". Allowed: JPEG, PNG, WEBP, GIF.` },
      { status: 415 },
    )
  }

  const folder = typeof folderInput === 'string' && folderInput !== '' ? folderInput : DEFAULT_FOLDER
  if (!ALLOWED_FOLDERS.includes(folder)) {
    console.warn('[media/assets POST] disallowed folder', { folder })
    return NextResponse.json({ error: `Unsupported folder "${folder}"` }, { status: 400 })
  }

  const buffer = Buffer.from(await file.arrayBuffer())

  if (!matchesMagicBytes(buffer, file.type)) {
    console.warn('[media/assets POST] file contents do not match declared type', { type: file.type })
    return NextResponse.json(
      { error: 'File contents do not match the declared file type' },
      { status: 415 },
    )
  }

  const base = sanitizeBaseName(file.name)
  const suffix = randomBytes(5).toString('hex')
  const publicId = `${base}-${suffix}`

  try {
    const result = await uploadAsset(buffer, file.type, folder, publicId)
    return NextResponse.json({
      publicId:  result.public_id,
      secureUrl: result.secure_url,
      width:     result.width,
      height:    result.height,
      format:    result.format,
      bytes:     result.bytes,
    })
  } catch (err) {
    console.error('[media/assets POST] Cloudinary upload failed', err)
    return NextResponse.json({ error: 'Upload failed' }, { status: 502 })
  }
}
