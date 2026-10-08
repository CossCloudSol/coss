// Blog categories: the topic filter on /blog and the "Related Articles" on each post.
// Dependency-free (unit-tested in scripts/test/blog-related.test.mjs).

const CATEGORY_KEYWORDS: [string, string[]][] = [
  ['Cloud Computing', ['aws', 'azure', 'gcp', 'cloud', 's3', 'ec2', 'lambda', 'multicloud', 'multi-cloud']],
  ['DevOps', ['devops', 'docker', 'kubernetes', 'k8s', 'jenkins', 'ansible', 'terraform', 'cicd', 'ci-cd', 'devsecops']],
  ['Data Science', ['data-science', 'machine-learning', 'artificial-intelligence', 'ai', 'ml', 'data-analytics', 'data-engineer', 'big-data', 'tableau', 'power-bi']],
  ['Cyber Security', ['cyber', 'security', 'ethical-hacking', 'network-security', 'ceh', 'cissp', 'penetration']],
  ['Digital Marketing', ['digital-marketing', 'seo', 'social-media', 'google-ads', 'ppc']],
  ['Linux', ['linux', 'ubuntu', 'centos', 'redhat', 'rhel', 'shell', 'bash']],
  ['Programming', ['python', 'java', 'javascript', 'react', 'nodejs', 'node-js', 'php', 'programming', 'fullstack', 'full-stack', 'web-development']],
];

/** An MDX post's category, from keywords in its slug and title (MDX posts carry no category of their own). */
export function deriveCategoryFromSlug(slug: string, title: string): string {
  const haystack = `${slug} ${title}`.toLowerCase();
  for (const [cat, keywords] of CATEGORY_KEYWORDS) {
    if (keywords.some((kw) => haystack.includes(kw))) return cat;
  }
  return 'Cloud Computing';
}

/** Loose match, so DB categories like "Cloud & DevOps" still meet the filter names. */
export function matchesCategory(postCat: string, activeCategory: string): boolean {
  return (
    postCat.toLowerCase().includes(activeCategory.toLowerCase()) ||
    activeCategory.toLowerCase().includes(postCat.toLowerCase())
  );
}

export type RelatedCandidate = { slug: string; title: string; category: string; date: string };

/**
 * Up to `limit` other posts that share the current post's category, newest first, topped
 * up with the newest posts from other categories so every post keeps its links.
 */
export function relatedPosts(
  current: { slug: string; category: string },
  pool: ReadonlyArray<RelatedCandidate>,
  limit = 4,
): RelatedCandidate[] {
  const others = pool
    .filter((p) => p.slug !== current.slug && p.title)
    .sort((a, b) => b.date.localeCompare(a.date) || a.slug.localeCompare(b.slug));
  const same = others.filter((p) => matchesCategory(p.category, current.category));
  const rest = others.filter((p) => !same.includes(p));
  return [...same, ...rest].slice(0, limit);
}
