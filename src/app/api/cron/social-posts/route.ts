import { NextResponse, type NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { findDueSocialPosts } from '@/lib/social-post-queries';
import { createPost, LINKEDIN_CHANNEL_ID } from '@/lib/buffer-client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_POSTS_PER_RUN = 10;
const MAX_ATTEMPTS = 5;
const PAST_DUE_SEND_BUFFER_MS = 5 * 60 * 1000;

const CHANNEL_IDS: Record<string, string> = {
  linkedin: LINKEDIN_CHANNEL_ID,
};

export async function GET(req: NextRequest): Promise<Response> {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let processed = 0;
  let sent = 0;
  let failed = 0;
  let skipped = 0;

  try {
    const duePosts = await findDueSocialPosts();
    const batch = duePosts.slice(0, MAX_POSTS_PER_RUN);
    skipped += duePosts.length - batch.length;

    let stopRun = false;

    for (const post of batch) {
      if (stopRun) {
        skipped++;
        console.log(`[cron/social-posts] post ${post.id} skipped — run stopped early (channel queue limit reached)`);
        continue;
      }

      processed++;
      const channels = post.channels.split(',').map((c) => c.trim()).filter(Boolean);
      const succeededIds: string[] = [];
      const errors: string[] = [];
      let anyRetryable = false;
      let hitLimit = false;

      if (channels.length === 0) {
        errors.push('no channels configured on this post');
      }

      // The cron only ever selects posts where scheduledFor <= now, so
      // scheduledFor itself always fails Buffer's "must be in the future"
      // check. Send a few minutes out instead; scheduledFor stays untouched
      // in the DB since it records intent, not the actual send time.
      const now = Date.now();
      const dueAt =
        post.scheduledFor.getTime() <= now
          ? new Date(now + PAST_DUE_SEND_BUFFER_MS)
          : post.scheduledFor;

      for (const channel of channels) {
        const channelId = CHANNEL_IDS[channel];
        if (!channelId) {
          errors.push(`${channel}: no Buffer channel configured for this service`);
          continue;
        }

        const result = await createPost({
          text: post.content,
          channelId,
          dueAt,
          imageUrl: post.imageUrl ?? undefined,
          imageAltText: post.imageAltText ?? undefined,
          linkUrl: post.linkUrl ?? undefined,
        });

        if (result.ok) {
          succeededIds.push(result.data.id);
          continue;
        }

        errors.push(`${channel}: ${result.error.message}`);
        if (result.error.limitReached) {
          // Free plan queue cap (10/channel) — leave this post queued and stop
          // burning requests that will all fail the same way this run.
          hitLimit = true;
          anyRetryable = true;
          break;
        }
        if (result.retryable) {
          anyRetryable = true;
        }
      }

      const attemptCount = post.attemptCount + 1;
      let status: 'sent' | 'failed' | 'queued';
      let lastError: string | null = null;

      if (errors.length === 0) {
        status = 'sent';
      } else if (anyRetryable && attemptCount < MAX_ATTEMPTS) {
        status = 'queued';
        lastError = errors.join('; ');
      } else if (anyRetryable) {
        status = 'failed';
        lastError = `${errors.join('; ')} — exceeded maximum retry attempts (${MAX_ATTEMPTS})`;
      } else {
        status = 'failed';
        lastError = errors.join('; ');
      }

      try {
        await prisma.socialPost.update({
          where: { id: post.id },
          data: {
            attemptCount,
            status,
            lastError,
            ...(status === 'sent' ? { sentAt: new Date() } : {}),
            ...(succeededIds.length > 0 ? { bufferPostIds: succeededIds.join(',') } : {}),
          },
        });
      } catch (err) {
        console.error(`[cron/social-posts] post ${post.id} — DB update failed after Buffer call(s):`, err);
        continue;
      }

      if (status === 'sent') sent++;
      else if (status === 'failed') failed++;

      console.log(`[cron/social-posts] post ${post.id} -> ${status}${lastError ? ` (${lastError})` : ''}`);

      if (hitLimit) {
        stopRun = true;
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
