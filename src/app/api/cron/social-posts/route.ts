import { NextResponse, type NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { findDueSocialPosts } from '@/lib/social-post-queries';
import { realSendsAllowed } from '@/lib/buffer-client';
import { sendSocialPost } from '@/lib/social-post-send';
import { skippedNote } from '@/lib/social-post-state';
import { isAuthorizedCron } from '@/lib/cron-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
// Up to 10 posts × 3 channels, plus Instagram's JPEG upload: well past the 10 s default.
export const maxDuration = 60;

const MAX_POSTS_PER_RUN = 10;

/**
 * Daily (vercel.json "0 0 * * *" = 05:30 IST; Hobby plan runs it once a day,
 * at some point in that hour). Sends every queued post that's due. Admins can
 * also "Send now" from Admin → Social Posts (same sendSocialPost path).
 */
export async function GET(req: NextRequest): Promise<Response> {
  if (!isAuthorizedCron(req.headers.get('authorization'))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Outside production: no Buffer calls and no DB writes (not even skip notes).
  const guard = realSendsAllowed();
  if (!guard.ok) {
    console.warn(`[cron/social-posts] ${guard.reason}`);
    return NextResponse.json({ ok: false, blocked: true, error: guard.reason }, { status: 503 });
  }

  let processed = 0;
  let sent = 0;
  let failed = 0;
  let skipped = 0;

  // A post left unsent this run says why in its row, instead of sitting silently.
  async function noteSkipped(postId: string, reason: string) {
    skipped++;
    console.log(`[cron/social-posts] post ${postId} skipped: ${reason}`);
    try {
      await prisma.socialPost.update({ where: { id: postId }, data: { lastError: skippedNote(reason, new Date()) } });
    } catch (err) {
      console.error(`[cron/social-posts] post ${postId}: could not record the skip`, err);
    }
  }

  try {
    const duePosts = await findDueSocialPosts();
    let stopReason: string | null = null;

    for (const [i, post] of duePosts.entries()) {
      if (i >= MAX_POSTS_PER_RUN) {
        await noteSkipped(post.id, `more than ${MAX_POSTS_PER_RUN} posts were due in this run`);
        continue;
      }
      if (stopReason) {
        await noteSkipped(post.id, stopReason);
        continue;
      }

      processed++;
      let outcome;
      try {
        outcome = await sendSocialPost(post);
      } catch (err) {
        console.error(`[cron/social-posts] post ${post.id} failed:`, err);
        failed++;
        continue;
      }

      if (outcome.status === 'blocked') {
        // Checked above; kept so a blocked send can never be counted as anything else.
        return NextResponse.json({ ok: false, blocked: true, error: outcome.lastError }, { status: 503 });
      }
      if (outcome.status === 'skipped') {
        // Claimed by a concurrent "Send now": nothing to record here.
        skipped++;
        continue;
      }
      if (outcome.status === 'sent') sent++;
      else if (outcome.status === 'failed') failed++;
      console.log(`[cron/social-posts] post ${post.id} -> ${outcome.status}${outcome.lastError ? ` (${outcome.lastError})` : ''}`);

      if (outcome.hitLimit) {
        stopReason = 'a Buffer channel queue is full (free plan: 10 scheduled posts per channel)';
      }
    }

    const summary = { ok: true, processed, sent, failed, skipped };
    console.log('[cron/social-posts] run complete', summary);
    return NextResponse.json(summary);
  } catch (err) {
    console.error('[cron/social-posts] Failed:', err);
    return NextResponse.json({ error: 'Failed to process social posts' }, { status: 500 });
  }
}
