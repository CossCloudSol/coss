/**
 * Career & placement assistance: one source for the copy shown on /placements
 * and the homepage, plus the switch for third-party placement content.
 *
 * Allowed claims only: "since 2010", "5,000+ students trained",
 * "50+ hiring partners", "1-year access". No placement percentages,
 * guarantees, rankings, named employer logos or "lifetime".
 */

/**
 * Off until hiring partners have confirmed we may name them. While false the
 * site hides hiring-partner logos and company names, job links (nav, footer,
 * homepage job board) and placed-student stats, and skips their DB queries.
 * Flip to true to bring all of it back.
 */
export const PLACEMENT_PROVIDERS_CONFIRMED = false;

export const CAREER_SUPPORT_HEADLINE = 'Career & Placement Assistance';

export const CAREER_SUPPORT_CTA = 'Book a Free Career Counselling Call';

export const PLACEMENT_DISCLAIMER = 'Placement is not guaranteed.';

export const CAREER_SUPPORT_ITEMS = [
  {
    key: 'resume',
    title: 'Resume building',
    body: 'We rebuild your CV around the projects you complete in class: the tools you used and the problems you solved. Reviewed by the trainer who taught you.',
  },
  {
    key: 'mock',
    title: 'Mock interviews',
    body: 'Technical rounds with your trainer and HR rounds with our career team, with plain feedback on where you need more work.',
  },
  {
    key: 'prep',
    title: 'Interview preparation',
    body: 'Common questions for your role, how to walk through your projects, and how to answer the questions you get stuck on.',
  },
  {
    key: 'referrals',
    title: 'Referrals to our 50+ hiring partners',
    body: 'We share your profile with our 50+ hiring partners in Hyderabad. A referral puts your CV in front of a person; it is not a job offer.',
  },
] as const;
