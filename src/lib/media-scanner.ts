import { prisma } from '@/lib/db'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.cosscloudsol.com'

interface ScanItem {
  url:         string
  page:        string
  status:      'broken' | 'slow' | 'redirect' | 'ok'
  statusCode?: number
  responseMs?: number
}

async function getPagesToScan(): Promise<string[]> {
  const staticPages = [
    '/',
    '/about',
    '/contact',
    '/courses',
    '/blog',
    '/free-demo-class',
    '/careers',
    '/privacy-policy',
  ]

  const courses = await prisma.course.findMany({
    where: { status: 'published' },
    select: { slug: true, categorySlug: true },
  })

  const courseUrls = courses.map(c =>
    c.categorySlug
      ? `/courses/${c.categorySlug}/${c.slug}`
      : `/courses/${c.slug}`
  )

  const landingSlugs = [
    'python-training-hyderabad','data-science-training-hyderabad',
    'machine-learning-training-hyderabad','ai-training-hyderabad',
    'power-bi-training-hyderabad','tableau-training-hyderabad',
    'aws-training-hyderabad','azure-training-hyderabad',
    'gcp-training-hyderabad','devops-training-hyderabad',
    'docker-training-hyderabad','kubernetes-training-hyderabad',
    'java-training-hyderabad','react-training-hyderabad',
    'angular-training-hyderabad','full-stack-training-hyderabad',
    'node-js-training-hyderabad','sql-training-hyderabad',
    'selenium-training-hyderabad','manual-testing-training-hyderabad',
    'etl-training-hyderabad','pyspark-training-hyderabad',
    'hadoop-training-hyderabad','sap-fico-training-hyderabad',
    'salesforce-training-hyderabad','servicenow-training-hyderabad',
    'workday-training-hyderabad','ui-ux-design-training-hyderabad',
    'graphic-design-training-hyderabad','ethical-hacking-training-hyderabad',
    'cybersecurity-training-hyderabad','hr-training-hyderabad',
    'ms-office-training-hyderabad','soft-skills-training-hyderabad',
    'spoken-english-training-hyderabad','tally-erp-training-hyderabad',
  ]

  return [...staticPages, ...courseUrls, ...landingSlugs.map(s => `/${s}`)]
}

async function extractImageUrls(pageUrl: string): Promise<string[]> {
  try {
    const res = await fetch(pageUrl, {
      signal: AbortSignal.timeout(10000),
      headers: { 'User-Agent': 'CossMediaScanner/1.0' },
    })
    if (!res.ok) return []

    const html = await res.text()
    const srcRegex = /(?:src|data-src)=["']([^"']+\.(jpg|jpeg|png|gif|webp|svg|ico))["']/gi
    const matches: string[] = []
    let match: RegExpExecArray | null

    while ((match = srcRegex.exec(html)) !== null) {
      const src = match[1]
      if (src.startsWith('data:')) continue
      if (src.startsWith('/_next/static')) continue

      const absolute = src.startsWith('http')
        ? src
        : `${SITE_URL}${src.startsWith('/') ? '' : '/'}${src}`

      matches.push(absolute)
    }

    return [...new Set(matches)]
  } catch {
    return []
  }
}

async function checkImageUrl(imageUrl: string, page: string): Promise<ScanItem> {
  const start = Date.now()
  try {
    const res = await fetch(imageUrl, {
      method: 'HEAD',
      signal: AbortSignal.timeout(8000),
      redirect: 'manual',
    })

    const ms = Date.now() - start

    if (res.status >= 400) {
      return { url: imageUrl, page, status: 'broken', statusCode: res.status, responseMs: ms }
    }
    if (res.status >= 300) {
      return { url: imageUrl, page, status: 'redirect', statusCode: res.status, responseMs: ms }
    }
    if (ms > 2000) {
      return { url: imageUrl, page, status: 'slow', statusCode: res.status, responseMs: ms }
    }
    return { url: imageUrl, page, status: 'ok', statusCode: res.status, responseMs: ms }
  } catch {
    return { url: imageUrl, page, status: 'broken', statusCode: 0, responseMs: Date.now() - start }
  }
}

export async function runImageScan() {
  const pages = await getPagesToScan()
  const allItems: ScanItem[] = []

  for (let i = 0; i < pages.length; i += 5) {
    const batch = pages.slice(i, i + 5)
    await Promise.all(
      batch.map(async (page) => {
        const fullUrl = `${SITE_URL}${page}`
        const imageUrls = await extractImageUrls(fullUrl)

        for (let j = 0; j < imageUrls.length; j += 10) {
          const imgBatch = imageUrls.slice(j, j + 10)
          const results = await Promise.all(imgBatch.map(url => checkImageUrl(url, page)))
          allItems.push(...results)
        }
      })
    )
  }

  const broken   = allItems.filter(i => i.status === 'broken')
  const slow     = allItems.filter(i => i.status === 'slow')
  const redirect = allItems.filter(i => i.status === 'redirect')

  const scanResult = await prisma.mediaScanResult.create({
    data: {
      totalImages:   allItems.length,
      brokenCount:   broken.length,
      slowCount:     slow.length,
      redirectCount: redirect.length,
      results: JSON.parse(JSON.stringify(
        allItems.filter(i => i.status !== 'ok')
      )),
    },
  })

  const old = await prisma.mediaScanResult.findMany({
    orderBy: { scannedAt: 'desc' },
    skip: 30,
    select: { id: true },
  })
  if (old.length > 0) {
    await prisma.mediaScanResult.deleteMany({
      where: { id: { in: old.map(o => o.id) } },
    })
  }

  return scanResult
}

// Quick scan — static + landing pages only (for manual admin trigger)
// Full scan runs via nightly cron
export async function runQuickScan() {
  const staticPages = [
    '/',
    '/about',
    '/contact',
    '/courses',
    '/blog',
    '/free-demo-class',
    '/careers',
    '/privacy-policy',
  ]

  const landingSlugs = [
    'python-training-hyderabad','data-science-training-hyderabad',
    'machine-learning-training-hyderabad','ai-training-hyderabad',
    'power-bi-training-hyderabad','tableau-training-hyderabad',
    'aws-training-hyderabad','azure-training-hyderabad',
    'gcp-training-hyderabad','devops-training-hyderabad',
    'docker-training-hyderabad','kubernetes-training-hyderabad',
    'java-training-hyderabad','react-training-hyderabad',
    'angular-training-hyderabad','full-stack-training-hyderabad',
    'node-js-training-hyderabad','sql-training-hyderabad',
    'selenium-training-hyderabad','manual-testing-training-hyderabad',
    'etl-training-hyderabad','pyspark-training-hyderabad',
    'hadoop-training-hyderabad','sap-fico-training-hyderabad',
    'salesforce-training-hyderabad','servicenow-training-hyderabad',
    'workday-training-hyderabad','ui-ux-design-training-hyderabad',
    'graphic-design-training-hyderabad','ethical-hacking-training-hyderabad',
    'cybersecurity-training-hyderabad','hr-training-hyderabad',
    'ms-office-training-hyderabad','soft-skills-training-hyderabad',
    'spoken-english-training-hyderabad','tally-erp-training-hyderabad',
  ]

  const pages = [...staticPages, ...landingSlugs.map(s => `/${s}`)]
  const allItems: ScanItem[] = []

  for (let i = 0; i < pages.length; i += 8) {
    const batch = pages.slice(i, i + 8)
    await Promise.all(
      batch.map(async (page) => {
        const fullUrl = `${SITE_URL}${page}`
        const imageUrls = await extractImageUrls(fullUrl)
        for (let j = 0; j < imageUrls.length; j += 10) {
          const imgBatch = imageUrls.slice(j, j + 10)
          const results = await Promise.all(imgBatch.map(url => checkImageUrl(url, page)))
          allItems.push(...results)
        }
      })
    )
  }

  const broken   = allItems.filter(i => i.status === 'broken')
  const slow     = allItems.filter(i => i.status === 'slow')
  const redirect = allItems.filter(i => i.status === 'redirect')

  const scanResult = await prisma.mediaScanResult.create({
    data: {
      totalImages:   allItems.length,
      brokenCount:   broken.length,
      slowCount:     slow.length,
      redirectCount: redirect.length,
      results: JSON.parse(JSON.stringify(
        allItems.filter(i => i.status !== 'ok')
      )),
    },
  })

  // Cleanup: keep only last 30 scans
  const old = await prisma.mediaScanResult.findMany({
    orderBy: { scannedAt: 'desc' },
    skip: 30,
    select: { id: true },
  })
  if (old.length > 0) {
    await prisma.mediaScanResult.deleteMany({
      where: { id: { in: old.map(o => o.id) } },
    })
  }

  return scanResult
}
