import { prisma } from '@/lib/db';
import { getAllBranchSettings } from '@/lib/get-branch-settings';
import { getBranchHours } from '@/lib/branch-hours';
import { courseCanonicalUrl } from '@/lib/course-canonical';
import { ALLOWED_CLAIMS } from '@/lib/ai-content-rules';
import { findClaimMatches } from '@/lib/social-captions';
import { BRAND_NAME, CONTACT_EMAIL, PRIMARY_PHONE_LABEL } from '@/lib/nap';
import { SITE_URL } from '@/lib/structured-data';

// /llms.txt (llmstxt.org): a plain summary for AI assistants and search engines, built from
// the same data the site shows. Rebuilt daily and on each deploy.
export const revalidate = 86400;

const KEY_PAGES: Array<[string, string]> = [
  ['All courses', '/courses'],
  ['Upcoming batches (dates, timings, centres)', '/batches'],
  ['Centres and directions', '/locations'],
  ['Trainers', '/faculty'],
  ['Corporate training', '/corporate-training'],
  ['Job openings shared with students', '/jobs'],
  ['Blog', '/blog'],
  ['Contact', '/contact-us'],
];

export async function GET(): Promise<Response> {
  const [branches, courses] = await Promise.all([
    getAllBranchSettings(),
    prisma.course.findMany({
      where: { status: 'published' },
      select: { title: true, slug: true, urlType: true, categorySlug: true, courseCategory: { select: { name: true } }, category: true },
      orderBy: [{ categorySlug: 'asc' }, { sortOrder: 'asc' }, { title: 'asc' }],
    }),
  ]);
  const hours = await Promise.all(branches.map(getBranchHours));

  const lines: string[] = [
    `# ${BRAND_NAME}`,
    '',
    `> IT training institute in Hyderabad, India, since 2010. Classroom training at two centres (Dilsukhnagar and Ameerpet) and live online batches, in cloud, DevOps, data, programming, cyber security, ERP and professional skills.`,
    '',
    '## Facts',
    '',
    ...ALLOWED_CLAIMS.map((c) => `- ${c}`),
    `- Centres: Dilsukhnagar and Ameerpet, Hyderabad (no other branches)`,
    `- Placement support is a service (resume reviews, mock interviews, interview preparation, referrals); placement is not guaranteed`,
    `- Phone: ${PRIMARY_PHONE_LABEL}; email: ${CONTACT_EMAIL}`,
    `- Brand spelling: "${BRAND_NAME}"`,
    '',
    '## Centres',
    '',
  ];
  branches.forEach((b, i) => {
    const area = b.branchKey.charAt(0).toUpperCase() + b.branchKey.slice(1);
    const when = hours[i].groups.map((g) => `${g.days} ${g.time}`).join('; ');
    lines.push(`- [${area} centre](${SITE_URL}/locations/${b.branchKey}): ${b.addressLine1}, ${b.addressLine2}, ${b.city} ${b.pincode}. Phone ${b.phone}.${when ? ` Open ${when}.` : ''}`);
  });

  lines.push('', '## Courses', '');
  const byCategory = new Map<string, string[]>();
  for (const c of courses) {
    if (findClaimMatches(c.title).length > 0) continue;
    const cat = c.courseCategory?.name ?? c.category ?? 'Other';
    byCategory.set(cat, [...(byCategory.get(cat) ?? []), `- [${c.title}](${courseCanonicalUrl(c)})`]);
  }
  for (const [cat, items] of byCategory) lines.push(`### ${cat}`, '', ...items, '');

  lines.push('## Key pages', '', ...KEY_PAGES.map(([label, path]) => `- [${label}](${SITE_URL}${path})`), '');

  return new Response(lines.join('\n'), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
