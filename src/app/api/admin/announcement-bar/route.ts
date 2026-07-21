/**
 * Admin-only CRUD for the AnnouncementBar singleton.
 *
 * GET   /api/admin/announcement-bar  -- fetch current settings
 * PUT   /api/admin/announcement-bar  -- full replacement upsert (all 6 fields required)
 * PATCH /api/admin/announcement-bar  -- partial update (any subset of fields)
 *
 * PUT vs PATCH:
 *   PUT   -- Replaces the entire record. All 6 fields must be present.
 *   PATCH -- Merges into the existing record. Only supplied fields are updated.
 *
 * All bodies use spec field names:
 *   isEnabled, announcementText, ctaLabel, ctaUrl, backgroundColor, textColor
 */
import { NextResponse, type NextRequest } from 'next/server';
import { revalidateTag } from 'next/cache';
import { ZodError } from 'zod';

import { prisma } from '@/lib/db';
import { getSession } from '@/lib/session';
import {
  announcementBarSchema,
  announcementBarPatchSchema,
  fromDbRow,
  toDbFields,
  toDbFieldsPartial,
  ANNOUNCEMENT_BAR_DEFAULTS,
} from '@/lib/validations/announcement-bar';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/* helper: authenticate or return 403 */
async function requireAdmin(req: NextRequest): Promise<true | Response> {
  const probe = NextResponse.next();
  const session = await getSession(req, probe);
  if (!session.isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  return true;
}

/* helper: parse JSON body or return 400 */
async function parseBody(req: NextRequest): Promise<[unknown, null] | [null, Response]> {
  try {
    return [await req.json(), null];
  } catch {
    return [null, NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })];
  }
}

// GET /api/admin/announcement-bar
export async function GET(req: NextRequest): Promise<Response> {
  const auth = await requireAdmin(req);
  if (auth !== true) return auth;

  try {
    let row = await prisma.announcementBar.findFirst();

    // Auto-seed a default row on first load so the admin UI always has a
    // record to display (and the PUT/PATCH handlers always have a row to
    // update rather than having to handle the upsert edge-case).
    if (!row) {
      row = await prisma.announcementBar.create({
        data: toDbFields(ANNOUNCEMENT_BAR_DEFAULTS),
      });
    }

    return NextResponse.json(fromDbRow(row));
  } catch (err) {
    // Log the real error server-side but return the in-memory defaults so
    // the admin page degrades gracefully instead of showing a 500.
    console.error('[GET /api/admin/announcement-bar] DB error:', err);
    return NextResponse.json(ANNOUNCEMENT_BAR_DEFAULTS);
  }
}

// PUT /api/admin/announcement-bar
// Full replacement upsert -- all 6 spec fields required.
export async function PUT(req: NextRequest): Promise<Response> {
  const auth = await requireAdmin(req);
  if (auth !== true) return auth;

  const [raw, parseErr] = await parseBody(req);
  if (parseErr) return parseErr;

  let input;
  try {
    input = announcementBarSchema.parse(raw);
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', issues: err.flatten().fieldErrors },
        { status: 422 },
      );
    }
    return NextResponse.json({ error: 'Bad request' }, { status: 400 });
  }

  const dbData = toDbFields(input);
  const existing = await prisma.announcementBar.findFirst();

  const saved = existing
    ? await prisma.announcementBar.update({ where: { id: existing.id }, data: dbData })
    : await prisma.announcementBar.create({ data: dbData });

  revalidateTag('announcement-bar');

  return NextResponse.json(fromDbRow(saved), { status: 200 });
}

// PATCH /api/admin/announcement-bar
// Partial update -- any subset of spec fields accepted.
export async function PATCH(req: NextRequest): Promise<Response> {
  const auth = await requireAdmin(req);
  if (auth !== true) return auth;

  const [raw, parseErr] = await parseBody(req);
  if (parseErr) return parseErr;

  let patch;
  try {
    patch = announcementBarPatchSchema.parse(raw);
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', issues: err.flatten().fieldErrors },
        { status: 422 },
      );
    }
    return NextResponse.json({ error: 'Bad request' }, { status: 400 });
  }

  const dbData = toDbFieldsPartial(patch);
  const existing = await prisma.announcementBar.findFirst();

  let updated;
  if (existing) {
      updated = await prisma.announcementBar.update({ where: { id: existing.id }, data: dbData as Parameters<typeof prisma.announcementBar.update>[0]['data'] });
  } else {
    updated = await prisma.announcementBar.create({
      data: {
        enabled:   (dbData.enabled   as boolean | undefined) ?? ANNOUNCEMENT_BAR_DEFAULTS.isEnabled,
        text:      (dbData.text      as string  | undefined) ?? ANNOUNCEMENT_BAR_DEFAULTS.announcementText,
        ctaLabel:  (dbData.ctaLabel  as string  | undefined) ?? ANNOUNCEMENT_BAR_DEFAULTS.ctaLabel,
        ctaUrl:    (dbData.ctaUrl    as string  | undefined) ?? ANNOUNCEMENT_BAR_DEFAULTS.ctaUrl,
        bgColor:   (dbData.bgColor   as string  | undefined) ?? ANNOUNCEMENT_BAR_DEFAULTS.backgroundColor,
        textColor: (dbData.textColor as string  | undefined) ?? ANNOUNCEMENT_BAR_DEFAULTS.textColor,
      },
    });
  }

  revalidateTag('announcement-bar');

  return NextResponse.json(fromDbRow(updated));
}
