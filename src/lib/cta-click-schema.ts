import { z } from 'zod';
import { DESTINATION_REGEX } from '@/lib/intent-tracking';

/* Body check for /api/cta-clicks, kept apart from the route so tests can run it on the payload
   lib/intent-tracking builds. */

const KIND_VALUES = ['demo', 'syllabus', 'brochure_download', 'enroll', 'other'] as const;
const PAGE_TYPE_VALUES = ['course', 'category', 'locality', 'blog', 'static'] as const;
const DEVICE_TYPE_VALUES = ['mobile', 'desktop'] as const;

// Pathname only (no query string); same rule as /api/call-clicks.
const PATH_REGEX = /^\/[a-zA-Z0-9\-_/]*$/;
// Button and section ids: snake_case words, e.g. "book_demo", "sticky_bar".
const ID_REGEX = /^[a-z0-9_]{1,60}$/;

const optionalText = (max: number) =>
  z.preprocess(
    (v) => (typeof v === 'string' && v.trim() === '' ? undefined : v),
    z.string().trim().max(max).optional(),
  );

export const ctaClickSchema = z.object({
  kind: z.enum(KIND_VALUES),
  ctaId: z.string().trim().regex(ID_REGEX),
  location: z.string().trim().regex(ID_REGEX),
  path: z.string().trim().min(1).max(300).regex(PATH_REGEX),
  pageType: z.enum(PAGE_TYPE_VALUES),
  // The same pattern lib/intent-tracking's cleanDestination produces — never a query string.
  destination: z.string().trim().min(1).max(300).regex(DESTINATION_REGEX),
  courseSlug: z.preprocess(
    (v) => (typeof v === 'string' && v.trim() === '' ? undefined : v),
    z.string().trim().max(255).regex(/^[a-z0-9-]+$/).optional(),
  ),
  deviceType: z.enum(DEVICE_TYPE_VALUES),
  referrer: optionalText(500),
  utmSource: optionalText(100),
  utmMedium: optionalText(100),
  utmCampaign: optionalText(100),
  gclid: optionalText(255),
});
