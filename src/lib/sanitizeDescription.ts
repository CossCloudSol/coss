const TOKEN_RE = /\[([A-Z][A-Z_]*)\]/g

export function sanitizeDescription(text: string | null | undefined): string {
  if (!text) return ''
  return text
    .replace(TOKEN_RE, '')
    .replace(/,\s*,/g, ',')
    .replace(/Your trainer,\s*,\s*/gi, '')
    .replace(/\s{2,}/g, ' ')
    .replace(/\s+\./g, '.')
    .trim()
}

export function excerptDescription(text: string | null | undefined, maxLen = 160): string {
  const clean = sanitizeDescription(text)
  if (!clean) return ''
  const dot = clean.indexOf('.')
  if (dot > 0 && dot < maxLen) return clean.slice(0, dot + 1).trim()
  return clean.slice(0, maxLen).trimEnd() + (clean.length > maxLen ? '…' : '')
}
