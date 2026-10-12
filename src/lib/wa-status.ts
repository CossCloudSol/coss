/**
 * WhatsApp widget status line, driven by ONE value: WA_REPLY_MODE.
 *
 * 'office-hours' (default): 09:00-21:00 IST shows the reply-time line with a
 *   green dot; outside those hours a no-dot office-hours line.
 * 'auto-reply': switch to this once the WhatsApp Business API auto-reply is
 *   live. Always shows the instant-reply line, no dot.
 */
export type WaReplyMode = 'office-hours' | 'auto-reply';

export const WA_REPLY_MODE: WaReplyMode = 'office-hours';

const OFFICE_OPEN_HOUR = 9;
const OFFICE_CLOSE_HOUR = 21;
const IST_OFFSET_MIN = 330;

export interface WaStatus {
  text: string;
  /** Green "online" dot: only while the team is actually replying. */
  online: boolean;
}

function istHour(now: Date): number {
  const ist = new Date(now.getTime() + (IST_OFFSET_MIN + now.getTimezoneOffset()) * 60000);
  return ist.getHours();
}

export function getWaStatus(now: Date = new Date(), mode: WaReplyMode = WA_REPLY_MODE): WaStatus {
  if (mode === 'auto-reply') return { text: 'Instant reply on WhatsApp', online: false };
  const h = istHour(now);
  if (h >= OFFICE_OPEN_HOUR && h < OFFICE_CLOSE_HOUR) {
    return { text: 'Typically replies in < 15 mins', online: true };
  }
  return { text: 'We reply on WhatsApp during office hours', online: false };
}
