import type { Prisma } from '@prisma/client';

/**
 * Status of a submission the bot check flagged (honeypot filled, sent too fast, or no fill
 * time). It is saved so staff can review it, but it never counts as a lead: every admin
 * count, chart, list default and export filters it out with NOT_SPAM.
 */
export const SPAM_STATUS = 'spam';

/** Prisma filter for Lead / CorporateLead: everything except spam. */
export const NOT_SPAM = { status: { not: SPAM_STATUS } } satisfies Prisma.LeadWhereInput & Prisma.CorporateLeadWhereInput;
