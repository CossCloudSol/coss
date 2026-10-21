/** The button a lead clicked before its form (Lead / CorporateLead sourceCta, sourceLocation, sourcePath). */
export interface LeadSource {
  sourceCta: string | null;
  sourceLocation: string | null;
  sourcePath: string | null;
}

/** "Came from" text for admin: "header → book_demo on /courses/aws", or null when no click was recorded. */
export function cameFromLabel(s: LeadSource): string | null {
  if (!s.sourceCta && !s.sourceLocation) return null;
  const where = [s.sourceLocation, s.sourceCta].filter(Boolean).join(' → ');
  return s.sourcePath ? `${where} on ${s.sourcePath}` : where;
}
