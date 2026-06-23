// Cloudinary Admin API — server-side only, never import in client components

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!
const API_KEY    = process.env.CLOUDINARY_API_KEY!
const API_SECRET = process.env.CLOUDINARY_API_SECRET!

export interface CloudinaryAsset {
  public_id:     string
  display_name:  string
  format:        string
  resource_type: string
  bytes:         number
  width?:        number
  height?:       number
  secure_url:    string
  created_at:    string
  folder:        string
}

export interface CloudinaryListResponse {
  resources:   CloudinaryAsset[]
  next_cursor: string | null
  total_count: number
}

function authHeader(): string {
  const credentials = Buffer.from(`${API_KEY}:${API_SECRET}`).toString('base64')
  return `Basic ${credentials}`
}

export async function listAssets(options: {
  max_results?:   number
  next_cursor?:   string
  prefix?:        string
  resource_type?: 'image' | 'video' | 'raw' | 'auto'
}): Promise<CloudinaryListResponse> {
  const { max_results = 20, next_cursor, prefix, resource_type = 'image' } = options

  const params = new URLSearchParams()
  params.set('max_results', String(max_results))
  if (next_cursor) params.set('next_cursor', next_cursor)
  if (prefix)      params.set('prefix', prefix)

  const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/resources/${resource_type}?${params}`

  const res = await fetch(url, {
    headers: { Authorization: authHeader() },
    next: { revalidate: 0 },
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Cloudinary Admin API error: ${res.status} — ${err}`)
  }

  const data = await res.json()
  return {
    resources:   data.resources ?? [],
    next_cursor: data.next_cursor ?? null,
    total_count: data.rate_limit_remaining ?? 0,
  }
}

export async function deleteAsset(publicId: string, resourceType = 'image'): Promise<void> {
  const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/resources/${resourceType}/upload`
  const res = await fetch(`${url}?public_ids[]=${encodeURIComponent(publicId)}`, {
    method: 'DELETE',
    headers: { Authorization: authHeader() },
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Cloudinary delete error: ${res.status} — ${err}`)
  }
}

export async function uploadAsset(
  fileBuffer: Buffer,
  mimeType: string,
  folder: string,
  publicId: string
): Promise<{ secure_url: string; public_id: string }> {
  const blob = new Blob([new Uint8Array(fileBuffer)], { type: mimeType })

  const timestamp = Math.floor(Date.now() / 1000)
  const paramsToSign = `folder=${folder}&public_id=${publicId}&timestamp=${timestamp}`
  const crypto = await import('crypto')
  const signature = crypto
    .createHash('sha256')
    .update(paramsToSign + API_SECRET)
    .digest('hex')

  const signedForm = new FormData()
  signedForm.append('file', blob, publicId)
  signedForm.append('folder', folder)
  signedForm.append('public_id', publicId)
  signedForm.append('timestamp', String(timestamp))
  signedForm.append('api_key', API_KEY)
  signedForm.append('signature', signature)

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    { method: 'POST', body: signedForm }
  )

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Cloudinary upload error: ${res.status} — ${err}`)
  }

  const data = await res.json()
  return { secure_url: data.secure_url, public_id: data.public_id }
}
