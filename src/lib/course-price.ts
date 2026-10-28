// Course fee display (client-approved fees, 28 Oct 2026). Every public price is a "From" price:
// the counsellor confirms the exact fee on the call. There is no crossed-out "original price"
// anywhere on the public site: a reference price that was never charged is a misleading discount
// under the CCPA guidelines, so Course.originalPrice is not rendered.

/** "From ₹30,000", or null when the course has no price. */
export function formatFromPrice(price: number | null | undefined): string | null {
  if (price == null || !Number.isFinite(price) || price <= 0) return null;
  return `From ₹${Math.round(price).toLocaleString('en-IN')}`;
}

/**
 * Courses whose certification exam is paid separately (CEH for Ethical Hacking, Goethe for German).
 * Keyed by Course.slug; a code constant rather than a column so preview builds, which use a
 * different database, never query a column that only production has.
 */
export const EXAM_FEE_SEPARATE_SLUGS: ReadonlySet<string> = new Set<string>([
  'ethical-hacking-training-institute-in-hyderabad',
  'ethical-hacking-ceh-training-hyderabad',
  'ceh-certification-training-in-hyderabad',
  'ethical-hacking-cyber-security-professional',
  // German: add its slug when the course page exists
]);

export const EXAM_FEE_NOTE = 'Exam fee separate';

export function priceNoteFor(slug: string): string | null {
  return EXAM_FEE_SEPARATE_SLUGS.has(slug) ? EXAM_FEE_NOTE : null;
}
