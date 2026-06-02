interface ThumbnailParams {
  title: string
  categoryName: string
  categoryColor?: string | null
  tools?: string[]
  mode?: string | null
}

const CATEGORY_COLORS: Record<string, { bg: string; accent: string; text: string; label: string }> = {
  'data-analytics-bi':        { bg: '#1a2744', accent: '#378ADD', text: '#5eead4', label: '#94a3b8' },
  'cloud-computing':          { bg: '#0a2a1f', accent: '#0F6E56', text: '#5eead4', label: '#94a3b8' },
  'devops-multi-cloud':       { bg: '#1e1040', accent: '#534AB7', text: '#a5b4fc', label: '#94a3b8' },
  'programming-full-stack':   { bg: '#1e1510', accent: '#D85A30', text: '#fb923c', label: '#94a3b8' },
  'data-engineering':         { bg: '#14200e', accent: '#3B6D11', text: '#86efac', label: '#94a3b8' },
  'cyber-security':           { bg: '#200a0a', accent: '#A32D2D', text: '#fca5a5', label: '#94a3b8' },
  'erp-crm-enterprise-tools': { bg: '#0d201a', accent: '#1D9E75', text: '#5eead4', label: '#94a3b8' },
  'software-testing-os':      { bg: '#1a1a1a', accent: '#5F5E5A', text: '#d4d4d4', label: '#94a3b8' },
  'digital-design':           { bg: '#1e0a14', accent: '#993556', text: '#f9a8d4', label: '#94a3b8' },
  'professional-soft-skills': { bg: '#100d20', accent: '#7F77DD', text: '#c4b5fd', label: '#94a3b8' },
  'human-resource':           { bg: '#1e0c16', accent: '#D4537E', text: '#f9a8d4', label: '#94a3b8' },
  'quantum-computing':        { bg: '#0a0a20', accent: '#185FA5', text: '#93c5fd', label: '#94a3b8' },
}

const DEFAULT_COLORS = { bg: '#0f172a', accent: '#0F6E56', text: '#5eead4', label: '#94a3b8' }

const CATEGORY_LABELS: Record<string, string> = {
  'data-analytics-bi':        'DATA ANALYTICS & BI',
  'cloud-computing':          'CLOUD COMPUTING',
  'devops-multi-cloud':       'DEVOPS & MULTI-CLOUD',
  'programming-full-stack':   'PROGRAMMING & FULL STACK',
  'data-engineering':         'DATA ENGINEERING',
  'cyber-security':           'CYBER SECURITY',
  'erp-crm-enterprise-tools': 'ERP, CRM & ENTERPRISE',
  'software-testing-os':      'SOFTWARE TESTING & OS',
  'digital-design':           'DIGITAL & DESIGN',
  'professional-soft-skills': 'PROFESSIONAL SKILLS',
  'human-resource':           'HUMAN RESOURCE',
  'quantum-computing':        'QUANTUM COMPUTING',
}

const CATEGORY_SYMBOLS: Record<string, string> = {
  'data-analytics-bi':        '&#9641;',
  'cloud-computing':          '&#9729;',
  'devops-multi-cloud':       '&#9881;',
  'programming-full-stack':   '&#10092;/&#10093;',
  'data-engineering':         '&#128451;',
  'cyber-security':           '&#128737;',
  'erp-crm-enterprise-tools': '&#127970;',
  'software-testing-os':      '&#9881;',
  'digital-design':           '&#9998;',
  'professional-soft-skills': '&#128101;',
  'human-resource':           '&#128188;',
  'quantum-computing':        '&#9883;',
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str
  return str.substring(0, maxLen - 1) + '…'
}

export function generateCourseThumbnailSvg(
  params: ThumbnailParams,
  categorySlug?: string | null
): string {
  const colors = (categorySlug && CATEGORY_COLORS[categorySlug])
    ? CATEGORY_COLORS[categorySlug]
    : DEFAULT_COLORS

  const catLabel = (categorySlug && CATEGORY_LABELS[categorySlug])
    ? CATEGORY_LABELS[categorySlug]
    : (params.categoryName?.toUpperCase() || 'COURSE')

  const symbol = (categorySlug && CATEGORY_SYMBOLS[categorySlug])
    ? CATEGORY_SYMBOLS[categorySlug]
    : '&#9632;'

  const toolsLine = params.tools && params.tools.length > 0
    ? params.tools.slice(0, 3).map(t => escapeXml(t)).join(' · ')
    : ''

  const title = escapeXml(truncate(params.title, 32))
  const W = 400
  const H = 200

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="${colors.bg}"/>
  <text x="${W - 30}" y="${H / 2 + 20}" font-size="90" fill="${colors.accent}" opacity="0.12" font-family="sans-serif" text-anchor="middle" dominant-baseline="middle">${symbol}</text>
  <text x="18" y="26" font-size="9" fill="${colors.text}" font-weight="500" font-family="sans-serif, Arial">${escapeXml(catLabel)}</text>
  <text x="18" y="120" font-size="18" fill="#ffffff" font-weight="600" font-family="sans-serif, Arial">${title}</text>
  ${toolsLine ? `<text x="18" y="142" font-size="11" fill="${colors.label}" font-family="sans-serif, Arial">${toolsLine}</text>` : ''}
  <text x="18" y="168" font-size="10" fill="${colors.label}" font-family="sans-serif, Arial" opacity="0.8">Training in Hyderabad</text>
  <text x="${W - 14}" y="${H - 10}" font-size="9" fill="${colors.text}" font-family="sans-serif, Arial" text-anchor="end">COSS</text>
  <rect x="0" y="${H - 4}" width="${W}" height="4" fill="${colors.accent}" opacity="0.6"/>
</svg>`
}

export function generateCourseThumbnailDataUri(
  params: ThumbnailParams,
  categorySlug?: string | null
): string {
  const svg = generateCourseThumbnailSvg(params, categorySlug)
  const encoded = encodeURIComponent(svg)
  return `data:image/svg+xml,${encoded}`
}
