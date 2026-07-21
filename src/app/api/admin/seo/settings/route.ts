import { NextResponse, type NextRequest } from 'next/server';
import { revalidateTag } from 'next/cache';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const PATCHABLE_KEYS = [
  'googleAnalyticsId',
  'googleSearchConsoleId',
  'defaultOgImage',
  'siteTitle',
  'twitterHandle',
  'robotsTxt',
] as const;

type PatchableKey = (typeof PATCHABLE_KEYS)[number];

function isPatchableKey(key: string): key is PatchableKey {
  return (PATCHABLE_KEYS as ReadonlyArray<string>).includes(key);
}

export async function GET(req: NextRequest): Promise<Response> {
  const probe = NextResponse.next();
  const session = await getSession(req, probe);
  if (!session.isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const row = await prisma.seoSettings.findFirst();
  if (!row) {
    return NextResponse.json({});
  }
  return NextResponse.json({
    ...row,
    updatedAt: row.updatedAt.toISOString(),
  });
}

/**
 * PATCH is implemented as upsert — there is only one settings row by design.
 * If none exists yet we create it; otherwise we update the existing row.
 */
export async function PATCH(req: NextRequest): Promise<Response> {
  const probe = NextResponse.next();
  const session = await getSession(req, probe);
  if (!session.isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  if (body === null || typeof body !== 'object') {
    return NextResponse.json({ error: 'Body must be a JSON object' }, { status: 400 });
  }

  const incoming = body as Record<string, unknown>;
  const cleaned: Partial<Record<PatchableKey, string | null>> = {};
  for (const key of Object.keys(incoming)) {
    if (!isPatchableKey(key)) continue;
    const value = incoming[key];
    if (typeof value === 'string') {
      cleaned[key] = value;
    } else if (value === null) {
      cleaned[key] = null;
    }
  }

  const existing = await prisma.seoSettings.findFirst();
  const row = existing
    ? await prisma.seoSettings.update({
        where: { id: existing.id },
        data: cleaned,
      })
    : await prisma.seoSettings.create({ data: cleaned });

  revalidateTag('seo-settings');

  return NextResponse.json({
    ...row,
    updatedAt: row.updatedAt.toISOString(),
  });
}
