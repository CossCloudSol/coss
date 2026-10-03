import type { SocialPost } from '@prisma/client';
import { prisma } from '@/lib/db';
import { bufferChannelId, createPost, realSendsAllowed } from '@/lib/buffer-client';
import { channelPayload, checkPost, parseChannels, ruleErrors } from '@/lib/social-captions';
import { getSocialPostCourse } from '@/lib/social-post-course';
import { instagramJpegUrl } from '@/lib/social-post-image';
import { sentChannels } from '@/lib/social-post-state';

export const MAX_ATTEMPTS = 5;
/** Buffer needs a due time in the future: past-due and "Send now" posts go this far out. */
const SEND_LEAD_MS = 5 * 60 * 1000;

export type SendOutcome = {
  /**
   * 'skipped': someone else (cron or another admin) is already sending it, or it's no longer queued.
   * 'blocked': not the production deployment; nothing was sent and the post wasn't touched.
   */
  status: 'sent' | 'queued' | 'failed' | 'skipped' | 'blocked';
  lastError: string | null;
  /** Buffer's per-channel queue cap was hit: the cron stops the run. */
  hitLimit: boolean;
  bufferPostIds: string | null;
  /** When Buffer will publish it. */
  dueAt: Date | null;
};

/**
 * Sends one queued post to Buffer: the cron for due posts and the admin's
 * "Send now" both come through here, with the same checks (channel rules,
 * allowed claims, live course, channel ids, Instagram JPEG).
 *
 * The post is claimed first (attemptCount compare-and-increment while it's
 * still queued), so a cron run and a "Send now" can't both send it. A
 * channel that already succeeded on an earlier attempt is never re-sent.
 */
export async function sendSocialPost(post: SocialPost): Promise<SendOutcome> {
  // Before anything else, including the claim: a local run must not even
  // bump attemptCount on a production row.
  const guard = realSendsAllowed();
  if (!guard.ok) return { status: 'blocked', lastError: guard.reason, hitLimit: false, bufferPostIds: post.bufferPostIds, dueAt: null };

  const claim = await prisma.socialPost.updateMany({
    where: { id: post.id, status: 'queued', attemptCount: post.attemptCount },
    data: { attemptCount: { increment: 1 } },
  });
  if (claim.count === 0) {
    return { status: 'skipped', lastError: null, hitLimit: false, bufferPostIds: post.bufferPostIds, dueAt: null };
  }
  const attemptCount = post.attemptCount + 1;

  const channels = parseChannels(post.channels);
  const alreadySent = sentChannels(post.bufferPostIds);
  const succeededIds: string[] = (post.bufferPostIds ?? '').split(',').filter(Boolean);
  const errors: string[] = [];
  let anyRetryable = false;
  let hitLimit = false;

  if (channels.length === 0) errors.push('no channels configured on this post');

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

  // Both callers send now (the cron only picks due posts; "Send now" means
  // now, even if scheduledFor is later). Buffer needs a future time, so it
  // goes a few minutes out; scheduledFor stays as the recorded intent.
  const dueAt = new Date(Date.now() + SEND_LEAD_MS);

  for (const channel of sendable) {
    if (alreadySent.has(channel)) continue;
    const channelId = bufferChannelId(channel);
    if (!channelId) {
      errors.push(`${channel}: no Buffer channel configured (set BUFFER_PROFILE_${channel.toUpperCase()})`);
      continue;
    }

    let payload = channelPayload(channel, draft, course ?? {});
    if (channel === 'instagram' && payload.imageUrl) {
      try {
        payload = { ...payload, imageUrl: await instagramJpegUrl(payload.imageUrl) };
      } catch (err) {
        errors.push(`instagram: JPEG conversion failed: ${err instanceof Error ? err.message : String(err)}`);
        anyRetryable = true;
        continue;
      }
    }

    const result = await createPost({ ...payload, channelId, dueAt, service: channel });
    if (result.ok) {
      succeededIds.push(`${channel}:${result.data.id}`);
      continue;
    }

    errors.push(`${channel}: ${result.error.message}`);
    if (result.error.limitReached) {
      // Free plan queue cap (10/channel): leave it queued; the cron stops this run.
      hitLimit = true;
      anyRetryable = true;
      break;
    }
    if (result.retryable) anyRetryable = true;
  }

  let status: 'sent' | 'failed' | 'queued';
  let lastError: string | null = null;
  if (errors.length === 0) {
    status = 'sent';
  } else if (anyRetryable && attemptCount < MAX_ATTEMPTS) {
    status = 'queued';
    lastError = `${errors.join('; ')} (attempt ${attemptCount} of ${MAX_ATTEMPTS}; retried on the next run)`;
  } else if (anyRetryable) {
    status = 'failed';
    lastError = `${errors.join('; ')} — exceeded maximum retry attempts (${MAX_ATTEMPTS})`;
  } else {
    status = 'failed';
    lastError = errors.join('; ');
  }

  const bufferPostIds = succeededIds.length > 0 ? succeededIds.join(',') : null;
  await prisma.socialPost.update({
    where: { id: post.id },
    data: {
      status,
      lastError,
      ...(status === 'sent' ? { sentAt: new Date() } : {}),
      ...(bufferPostIds ? { bufferPostIds } : {}),
    },
  });

  return { status, lastError, hitLimit, bufferPostIds, dueAt: status === 'sent' ? dueAt : null };
}
