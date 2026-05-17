import { NextResponse, type NextRequest } from 'next/server';
import { getSession } from '@/lib/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export interface SpeedMetrics {
  score: number;
  lcp: string;
  fcp: string;
  tbt: string;
  cls: string;
  speedIndex: string;
}

export interface PageSpeedResponse {
  mobile: SpeedMetrics;
  desktop: SpeedMetrics;
  error?: string;
  mock?: boolean;
}

const EMPTY_METRICS: SpeedMetrics = {
  score: 0,
  lcp: '—',
  fcp: '—',
  tbt: '—',
  cls: '—',
  speedIndex: '—',
};

interface PsiAudit {
  displayValue?: string;
}
interface PsiResult {
  lighthouseResult?: {
    categories?: { performance?: { score?: number } };
    audits?: {
      'largest-contentful-paint'?: PsiAudit;
      'first-contentful-paint'?: PsiAudit;
      'total-blocking-time'?: PsiAudit;
      'cumulative-layout-shift'?: PsiAudit;
      'speed-index'?: PsiAudit;
    };
  };
}

function extract(result: PsiResult): SpeedMetrics {
  const lh = result.lighthouseResult ?? {};
  const audits = lh.audits ?? {};
  const score = Math.round(((lh.categories?.performance?.score ?? 0) as number) * 100);
  return {
    score,
    lcp: audits['largest-contentful-paint']?.displayValue ?? '—',
    fcp: audits['first-contentful-paint']?.displayValue ?? '—',
    tbt: audits['total-blocking-time']?.displayValue ?? '—',
    cls: audits['cumulative-layout-shift']?.displayValue ?? '—',
    speedIndex: audits['speed-index']?.displayValue ?? '—',
  };
}

export async function GET(req: NextRequest): Promise<Response> {
  const probe = NextResponse.next();
  const session = await getSession(req, probe);
  if (!session.isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const apiKey = process.env.GOOGLE_PAGESPEED_API_KEY;
  if (!apiKey || apiKey.trim() === '') {
    const payload: PageSpeedResponse = {
      error: 'API key not configured',
      mock: true,
      mobile: EMPTY_METRICS,
      desktop: EMPTY_METRICS,
    };
    return NextResponse.json(payload);
  }

  const { searchParams } = new URL(req.url);
  const target = searchParams.get('url')?.trim() ?? '';
  if (!target) {
    return NextResponse.json(
      { error: '`url` query param is required' },
      { status: 400 },
    );
  }

  // Reject non-HTTPS and non-HTTP URLs to prevent the PageSpeed API being
  // pointed at private network addresses, data: URIs, or other schemes.
  let parsedTarget: URL;
  try {
    parsedTarget = new URL(target);
  } catch {
    return NextResponse.json({ error: '`url` must be a valid URL' }, { status: 400 });
  }
  if (parsedTarget.protocol !== 'https:' && parsedTarget.protocol !== 'http:') {
    return NextResponse.json(
      { error: '`url` must use http or https' },
      { status: 400 },
    );
  }

  const base = 'https://www.googleapis.com/pagespeedonline/v5/runPagespeed';
  const buildUrl = (strategy: 'mobile' | 'desktop'): string => {
    const u = new URL(base);
    u.searchParams.set('url', target);
    u.searchParams.set('strategy', strategy);
    u.searchParams.set('key', apiKey);
    u.searchParams.append('category', 'performance');
    return u.toString();
  };

  try {
    const [mobileRes, desktopRes] = await Promise.all([
      fetch(buildUrl('mobile'), { cache: 'no-store' }),
      fetch(buildUrl('desktop'), { cache: 'no-store' }),
    ]);

    if (!mobileRes.ok || !desktopRes.ok) {
      throw new Error(
        `PSI returned ${mobileRes.status} (mobile) / ${desktopRes.status} (desktop)`,
      );
    }

    const [mobileJson, desktopJson] = await Promise.all([
      mobileRes.json() as Promise<PsiResult>,
      desktopRes.json() as Promise<PsiResult>,
    ]);

    const payload: PageSpeedResponse = {
      mobile: extract(mobileJson),
      desktop: extract(desktopJson),
    };
    return NextResponse.json(payload);
  } catch (err) {
    console.error('[GET /api/admin/seo/pagespeed] failed:', err);
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : 'PageSpeed API failed',
        mock: true,
        mobile: EMPTY_METRICS,
        desktop: EMPTY_METRICS,
      },
      { status: 500 },
    );
  }
}
