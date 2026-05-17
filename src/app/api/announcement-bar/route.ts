/**
 * GET /api/announcement-bar
 *
 * Public endpoint — no auth required.
 * Fetches the AnnouncementBar singleton and returns it using the canonical
 * spec field names so the public-site component can render it directly.
 *
 * Cached for 60 s at the Next.js data-cache layer (ISR-style revalidation).
 * Falls back to safe defaults when the DB row doesn't exist yet or when the
 * table hasn't been migrated, so the bar simply stays hidden on new deploys.
 *
 * Response shape:
 *   {
 *     isEnabled:        boolean
 *     announcementText: string
 *     ctaLabel:         string
 *     ctaUrl:           string
 *     backgroundColor:  string   // hex
 *     textColor:        string   // hex
 *   }
 */
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import {
  fromDbRow,
  ANNOUNCEMENT_BAR_DEFAULTS,
} from '@/lib/validations/announcement-bar';

export const runtime = 'nodejs';
export const revalidate = 60; // re-fetch from DB at most once per minute

export async function GET(): Promise<Response> {
  try {
    const row = await prisma.announcementBar.findFirst();

    if (!row) {
      // No row yet — bar stays hidden on fresh deploys until an admin enables it.
      return NextResponse.json({ ...ANNOUNCEMENT_BAR_DEFAULTS, isEnabled: false });
    }

    return NextResponse.json(fromDbRow(row));
  } catch {
    // Table not migrated yet or DB error — return safe hidden defaults.
    return NextResponse.json({ ...ANNOUNCEMENT_BAR_DEFAULTS, isEnabled: false });
  }
}
