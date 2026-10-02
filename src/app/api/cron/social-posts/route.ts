import { NextResponse, type NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { findDueSocialPosts } from '@/lib/social-post-queries';
import { bufferChannelId, createPost } from '@/lib/buffer-client';
import { channelPayload, checkPost, parseChannels, ruleErrors } from '@/lib/social-captions';
import { getSocialPostCourse } from '@/lib/social-post-course';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_POSTS_PER_RUN = 10;
const MAX_ATTEMPTS = 5;
const PAST_DUE_SEND_BUFFER_MS = 5 * 60 * 1000;

/** "linkedin:abc,facebook:def" → channels already sent (ids from before this format have no channel). */
function sentChannels(bufferPostIds: string | null): Map<string, string> {
  const sent = new Map<string, string>();
  for (const entry of (bufferPostIds ?? '').split(',').filter(Boolean)) {
    const [channel, id] = entry.includes(':') ? entry.split(':', 2) : ['', entry];
    if (channel) sent.set(channel, id);
  }
  return sent;
}

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
      const channels = parseChannels(post.channels);
      const alreadySent = sentChannels(post.bufferPostIds);
      const succeededIds: string[] = (post.bufferPostIds ?? '').split(',').filter(Boolean);
      const errors: string[] = [];
      let anyRetryable = false;
      let hitLimit = false;

      if (channels.length === 0) {
        errors.push('no channels configured on this post');
      }

      // Course (Facebook link, Instagram banner). A DB error is retryable.
      let course: Awaited<ReturnType<typeof getSocialPostCourse>> = null;
      if (post.courseId && channels.length > 0) {
        try {
          course = await getSocialPostCourse(post.courseId, post.hook);
          if (!course) errors.push('the linked course is missing or unpublished');
        } catch (err) {
          errors.push(`course lookup failed: ${err instanceof Error ? err.message : String(err)}`);
          anyRetryable = true;
        }
      }

      // Backstop for the approve step: channel rules and allowed claims.
      const draft = { ...post, channels, hasCourse: Boolean(post.courseId) };
      if (errors.length === 0) {
        errors.push(...ruleErrors(checkPost(draft)));
        if (channels.includes('instagram') && course && !course.igImageUrl) errors.push('instagram: banner generation is unavailable');
      }
      const sendable = errors.length === 0 ? channels : [];

      // The cron only ever selects posts where scheduledFor <= now, so
      // scheduledFor itself always fails Buffer's "must be in the future"
      // check. Send a few minutes out instead; scheduledFor stays untouched
      // in the DB since it records intent, not the actual send time.
      const now = Date.now();
      const dueAt =
        post.scheduledFor.getTime() <= now
          ? new Date(now + PAST_DUE_SEND_BUFFER_MS)
          : post.scheduledFor;

      for (const channel of sendable) {
        // Sent on an earlier attempt: don't post it twice.
        if (alreadySent.has(channel)) continue;
        const channelId = bufferChannelId(channel);
        if (!channelId) {
          errors.push(`${channel}: no Buffer channel configured (set BUFFER_PROFILE_${channel.toUpperCase()})`);
          continue;
        }

        const result = await createPost({ ...channelPayload(channel, draft, course ?? {}), channelId, dueAt, service: channel });

        if (result.ok) {
          succeededIds.push(`${channel}:${result.data.id}`);
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
