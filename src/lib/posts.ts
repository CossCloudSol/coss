import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { marked } from 'marked';
import { findClaimMatches } from '@/lib/social-captions';

const postsDirectory = path.join(process.cwd(), 'content/posts');

export interface PostFrontmatter {
  title: string;
  /** Publish date, YYYY-MM-DD: the post's first commit (content/posts/_dates.json); '' when unknown. */
  date: string;
  dateFormatted?: string;
  /** Last content change, YYYY-MM-DD: the post's last commit; '' when unknown. */
  dateModified?: string;
  excerpt?: string;
  author?: string;
  tags?: string[];
  categories?: string[];
  featuredImage?: string;
  readingTime?: string;
}

export interface Post {
  slug: string;
  frontmatter: PostFrontmatter;
  content: string;
  contentHtml?: string;
}

type PostDates = Record<string, { published: string | null; modified: string | null }>;
let postDatesCache: PostDates | null = null;

/**
 * Real dates from git history, written by scripts/build-post-dates.mjs (the frontmatter
 * "date" is the WordPress export time, identical for every post). Kept inside
 * content/posts so it ships wherever the posts do.
 */
function postDates(): PostDates {
  if (postDatesCache) return postDatesCache;
  try {
    postDatesCache = JSON.parse(fs.readFileSync(path.join(postsDirectory, '_dates.json'), 'utf8')) as PostDates;
  } catch {
    postDatesCache = {};
  }
  return postDatesCache;
}

/** "2026-05-17" → "17 May 2026". */
function formatPostDate(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
}

function datesFor(slug: string): Pick<PostFrontmatter, 'date' | 'dateFormatted' | 'dateModified'> {
  const d = postDates()[slug];
  const date = d?.published ?? '';
  return { date, dateFormatted: date ? formatPostDate(date) : '', dateModified: d?.modified ?? date };
}

/**
 * Converts any frontmatter value to a safe string.
 * Rejects the literal "[object Object]" that WP exporters write into YAML.
 */
function sanitizeValue(v: unknown): string {
  if (typeof v === 'string') {
    if (v === '[object Object]') return '';
    return v;
  }
  if (v === null || v === undefined) return '';
  if (typeof v === 'object') return '';
  return String(v);
}

function sanitizeArray(arr: unknown): string[] {
  if (!Array.isArray(arr)) return [];
  return arr.map(sanitizeValue).filter(Boolean);
}

const TAG_STOP_WORDS = new Set([
  'a','an','the','and','or','but','in','on','at','to','for',
  'of','with','by','from','as','is','are','was','were','be',
  'been','being','have','has','had','do','does','did','will',
  'would','could','should','may','might','shall','can','into',
  'its','your','our','their','this','that','these','those',
  'top','best','how','why','what','which','who','when','where',
]);

function deriveTagsFromSlug(slug: string, title?: string): string[] {
  const source = (title && title !== slug)
    ? title.replace(/[-–—:,()\[\]{}&+]/g, ' ')
    : slug.replace(/-/g, ' ');

  const seen = new Set<string>();
  const tags: string[] = [];

  source.split(/\s+/).forEach(raw => {
    const word = raw.replace(/[^a-zA-Z0-9]/g, '');
    if (word.length < 3) return;
    if (TAG_STOP_WORDS.has(word.toLowerCase())) return;
    const key = word.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    tags.push(word);
  });

  return tags.slice(0, 6);
}

function cleanShortcodes(raw: string): string {
  return raw
    .replace(/\[vc_[^\]]{0,1000}\]/g, '')
    .replace(/\[\/vc_[^\]]{0,200}\]/g, '')
    .replace(/\[woodmart[^\]]{0,500}\]/g, '')
    .replace(/\[\/woodmart[^\]]{0,200}\]/g, '')
    .replace(/\[wd_[^\]]{0,500}\]/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

/**
 * A WP-export excerpt is unusable when it's short or still holds shortcode text
 * after cleanShortcodes(): many were cut off mid-shortcode at the source (no
 * closing "]"), so a stray "[" is the signal. Same test as the post page's meta
 * description.
 */
export function isUsableExcerpt(excerpt: string): boolean {
  return excerpt.length > 20 && !excerpt.includes('[');
}

// A cut-off excerpt can lose the noun the claim rules look for ("…stands tall as
// the best Digital…"), so a generated excerpt also may not hold these words at all.
const EXCERPT_BANNED_WORD = /\b(?:best|top|leading|number\s+one|most\s+trusted|guarantee\w*|lifetime|high[-\s]paying)\b|#\s?1\b|\bno\.?\s?1\b/i;

/**
 * The first prose paragraph of a cleaned markdown body as plain text, capped at a
 * word boundary. A paragraph whose excerpt would carry a banned claim (ranking,
 * guarantee, …) is skipped: the excerpt shows on blog cards and in the meta description.
 */
export function excerptFromBody(markdown: string, maxLen = 160): string {
  for (const block of markdown.split(/\r?\n\s*\r?\n/)) {
    const b = block.trim();
    if (!b || /^(#|>|\||[-*+] |\d+\. |!\[|<)/.test(b)) continue;
    const text = b
      .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
      .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
      .replace(/<[^>]+>/g, '')
      .replace(/[*_`~]+/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    if (text.length < 40 || text.includes('[')) continue;
    const cut = text.slice(0, maxLen);
    const space = cut.lastIndexOf(' ');
    const excerpt = text.length <= maxLen ? text : `${(space > 0 ? cut.slice(0, space) : cut).replace(/[,;:.\s]+$/, '')}…`;
    if (findClaimMatches(excerpt).length === 0 && !EXCERPT_BANNED_WORD.test(excerpt)) return excerpt;
  }
  return '';
}

function excerptFor(rawExcerpt: unknown, cleanedBody: string): string {
  const excerpt = cleanShortcodes(sanitizeValue(rawExcerpt));
  return isUsableExcerpt(excerpt) ? excerpt : excerptFromBody(cleanedBody);
}

function cleanContent(raw: string): string {
  let text = raw;

  const entities: [string, string][] = [
    ['&#8220;', '"'], ['&#8221;', '"'], ['&#8216;', "'"], ['&#8217;', "'"],
    ['&#8211;', '–'], ['&#8212;', '—'], ['&amp;', '&'], ['&nbsp;', ' '],
    ['&#038;', '&'], ['&#8222;', '"'], ['&#8243;', '"'], ['&#8242;', "'"],
    ['&#8230;', '…'], ['&lt;', '<'], ['&gt;', '>'], ['&quot;', '"'],
  ];
  for (const [from, to] of entities) {
    text = text.split(from).join(to);
  }

  text = text.replace(/\[vc_[^\]]{0,1000}\]/g, '');
  text = text.replace(/\[\/vc_[^\]]{0,200}\]/g, '');
  text = text.replace(/\[woodmart[^\]]{0,500}\]/g, '');
  text = text.replace(/\[\/woodmart[^\]]{0,200}\]/g, '');
  text = text.replace(/\[wd_[^\]]{0,500}\]/g, '');
  text = text.replace(/!\[[^\]]*\]\(data:image[^)]+\)/g, '');
  text = text.replace(/<img[^>]*src=["']data:[^"']*["'][^>]*\/?>/gi, '');
  text = text.replace(/!\[\[object Object\]\]\([^)]*\)/g, '');
  text = text.replace(/!\[(?:undefined|null|\[object Object\])\]\([^)]*\)/g, '');
  text = text.replace(/\n{3,}/g, '\n\n').trim();

  return text;
}

export async function getAllPosts(): Promise<Post[]> {
  if (!fs.existsSync(postsDirectory)) return [];

  const fileNames = fs.readdirSync(postsDirectory);
  const posts = fileNames
    .filter(f => f.endsWith('.mdx') || f.endsWith('.md'))
    .map(fileName => {
      const slug = fileName.replace(/\.mdx?$/, '');
      const fullPath = path.join(postsDirectory, fileName);
      const fileContents = fs.readFileSync(fullPath, 'utf8');
      const { data, content } = matter(fileContents);
      const cleaned = cleanContent(content);

      const titleStr = sanitizeValue(data.title) || slug;
      const rawTags  = sanitizeArray(data.tags);
      const rawCats  = sanitizeArray(data.categories);

      return {
        slug,
        frontmatter: {
          title: titleStr,
          ...datesFor(slug),
          excerpt: excerptFor(data.excerpt, cleaned),
          author: sanitizeValue(data.author),
          tags: rawTags.length > 0 ? rawTags : deriveTagsFromSlug(slug, titleStr),
          categories: rawCats.length > 0 ? rawCats : [],
          featuredImage: sanitizeValue(data.featuredImage),
          readingTime: sanitizeValue(data.readingTime),
        } as PostFrontmatter,
        content: cleaned,
      };
    });

  // Newest first; posts published the same day keep the previous order (slug, descending).
  return posts.sort((a, b) => b.frontmatter.date.localeCompare(a.frontmatter.date) || b.slug.localeCompare(a.slug));
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  try {
    const mdxPath = path.join(postsDirectory, `${slug}.mdx`);
    const mdPath  = path.join(postsDirectory, `${slug}.md`);
    const fullPath = fs.existsSync(mdxPath) ? mdxPath : mdPath;
    if (!fs.existsSync(fullPath)) return null;

    const fileContents = fs.readFileSync(fullPath, 'utf8');
    const { data, content } = matter(fileContents);
    const cleaned = cleanContent(content);
    // The post page renders its own <h1>{title}</h1> above the article — demote
    // any markdown h1 to h2 so the page never ends up with two H1s.
    const contentHtml = (await marked(cleaned))
      .replace(/<h1(\s|>)/gi, '<h2$1')
      .replace(/<\/h1>/gi, '</h2>');

    const titleStr = sanitizeValue(data.title) || slug;
    const rawTags  = sanitizeArray(data.tags);
    const rawCats  = sanitizeArray(data.categories);

    return {
      slug,
      frontmatter: {
        title: titleStr,
        ...datesFor(slug),
        excerpt: excerptFor(data.excerpt, cleaned),
        author: sanitizeValue(data.author),
        tags: rawTags.length > 0 ? rawTags : deriveTagsFromSlug(slug, titleStr),
        categories: rawCats.length > 0 ? rawCats : [],
        featuredImage: sanitizeValue(data.featuredImage),
        readingTime: sanitizeValue(data.readingTime),
      } as PostFrontmatter,
      content: cleaned,
      contentHtml,
    };
  } catch {
    return null;
  }
}
