/**
 * Social post state helpers: what changed since approval, and the notes
 * written to lastError whenever a post is moved back to Draft or skipped
 * without being sent, so no state change is silent. Pure and
 * dependency-free (unit-tested in scripts/test/social-post-state.test.mjs).
 */

/** "3 Oct, 3:21 pm IST" */
export function formatIst(date: Date): string {
  return `${date.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', hour12: true })} IST`;
}

/** "linkedin:abc,facebook:def" → channels already sent (ids from before this format have no channel). */
export function sentChannels(bufferPostIds: string | null | undefined): Map<string, string> {
  const sent = new Map<string, string>();
  for (const entry of (bufferPostIds ?? '').split(',').filter(Boolean)) {
    const [channel, id] = entry.includes(':') ? entry.split(':', 2) : ['', entry];
    if (channel) sent.set(channel, id);
  }
  return sent;
}

type ApprovalFields = {
  content?: string | null;
  channels?: string | null;
  imageUrl?: string | null;
  imageAltText?: string | null;
  linkUrl?: string | null;
  courseId?: string | null;
  hook?: string | null;
  hashtags?: string | null;
  scheduledFor?: Date | null;
};

const FIELD_LABEL: Record<keyof ApprovalFields, string> = {
  content: 'post text',
  channels: 'channels',
  imageUrl: 'image',
  imageAltText: 'alt text',
  linkUrl: 'link',
  courseId: 'course',
  hook: 'hook',
  hashtags: 'hashtags',
  scheduledFor: 'schedule',
};

function norm(key: keyof ApprovalFields, value: ApprovalFields[keyof ApprovalFields]): string {
  if (value == null) return '';
  if (value instanceof Date) return String(value.getTime());
  if (key === 'channels') return value.split(',').map((c) => c.trim().toLowerCase()).filter(Boolean).sort().join(',');
  return value.trim();
}

/**
 * Labels of the fields an edit really changes (only keys present in `next`
 * are compared; null and "" are the same). Saving an approved post without
 * changes returns [] and leaves it approved.
 */
export function approvalChanges(before: ApprovalFields, next: ApprovalFields): string[] {
  return (Object.keys(FIELD_LABEL) as Array<keyof ApprovalFields>)
    .filter((k) => k in next && norm(k, before[k]) !== norm(k, next[k]))
    .map((k) => FIELD_LABEL[k]);
}

export function revertedNote(changes: string[], at: Date): string {
  return `Moved back to Draft ${formatIst(at)}: edited after approval (changed: ${changes.join(', ')}). Approve again to queue it.`;
}

export function manualDraftNote(at: Date): string {
  return `Moved back to Draft ${formatIst(at)} by an admin ("To Draft"). Approve again to queue it.`;
}

export function skippedNote(reason: string, at: Date): string {
  return `Not sent ${formatIst(at)}: ${reason}. Still queued; it goes in the next run (or use Send now).`;
}
