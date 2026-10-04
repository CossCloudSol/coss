/**
 * Content rules every AI generator prompt embeds (src/app/api/admin/generate/*).
 * Dependency-free so tests can read it. The same allowed-claims list is
 * enforced on published text by findClaimMatches (src/lib/social-captions.ts);
 * keep the two in step.
 */

/** The only claims about the institute that may appear anywhere, word for word. */
export const ALLOWED_CLAIMS = ['since 2010', '5,000+ students trained', '50+ hiring partners', '1-year LMS access'] as const;

export const CONTENT_RULES = `CONTENT RULES (non-negotiable; everything you write is checked against them before it is published):

ALLOWED CLAIMS: the only claims about the institute you may make, word for word, and only where they fit naturally:
${ALLOWED_CLAIMS.map((c) => `- "${c}"`).join('\n')}
Brand spelling: "Coss Cloud Solutions". Centres: Dilsukhnagar and Ameerpet only (no other branches).

NEVER WRITE:
- Invented anecdotes: no made-up students, conversations, quotes, testimonials, case studies or "a student walked into our centre…" stories. Describe what the course covers and what a learner will be able to do.
- Invented numbers about the institute or outcomes: no student, alumni, batch-size, project, trainer, review or company counts, no years of experience, no ratings, no "within 3 weeks" results. The only numbers allowed are the four allowed claims above and facts given to you in the input.
- Scarcity or urgency: no "seats limited", "only N seats", "filling fast", "last few seats", "limited-time offer", "enrol before it's too late".
- Guarantees of any kind (job, placement, certification pass), placement or pass rates, any percentage about outcomes.
- Rankings: best, top, #1, number one, leading, premier, largest, top-rated, most trusted.
- "Lifetime" access (LMS access is 1 year), "high-paying", salary figures or packages (no LPA, lakh or ₹ salary amounts).
- Named employers as destinations for learners, "top companies" or "leading companies".
- Job-outcome promises: "get placed", "get hired", "land your dream job", "land top jobs", "secure top roles".
Placement support may be described as a service (resume reviews, mock interviews, interview preparation, referrals), never as an outcome.`;
