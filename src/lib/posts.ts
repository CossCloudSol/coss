import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { marked } from 'marked';

const postsDirectory = path.join(process.cwd(), 'content/posts');

export interface PostFrontmatter {
  title: string;
  date: string;
  dateFormatted?: string;
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

      const titleStr = sanitizeValue(data.title) || slug;
      const rawTags  = sanitizeArray(data.tags);
      const rawCats  = sanitizeArray(data.categories);

      return {
        slug,
        frontmatter: {
          title: titleStr,
          date: data.date ? new Date(sanitizeValue(data.date)).toLocaleDateString('en-IN', {
            year: 'numeric', month: 'long', day: 'numeric',
          }) : '',
          excerpt: cleanShortcodes(sanitizeValue(data.excerpt)),
          author: sanitizeValue(data.author),
          tags: rawTags.length > 0 ? rawTags : deriveTagsFromSlug(slug, titleStr),
          categories: rawCats.length > 0 ? rawCats : [],
          featuredImage: sanitizeValue(data.featuredImage),
          readingTime: sanitizeValue(data.readingTime),
        } as PostFrontmatter,
        content: cleanContent(content),
      };
    });

  const sorted = posts.sort((a, b) => a.slug.localeCompare(b.slug));
  const total = sorted.length;
  if (total === 0) return [];
  const startDate = new Date('2023-01-15');
  const endDate = new Date('2026-03-15');
  const totalDays = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

  return sorted.map((post, index) => {
    const daysOffset = total > 1 ? Math.floor((index / (total - 1)) * totalDays) : 0;
    const postDate = new Date(startDate);
    postDate.setDate(postDate.getDate() + daysOffset);
    const isoDate = postDate.toISOString().split('T')[0];
    return {
      ...post,
      frontmatter: {
        ...post.frontmatter,
        date: isoDate,
        dateFormatted: postDate.toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        }),
      },
    };
  }).reverse();
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
    const contentHtml = await marked(cleaned);

    const titleStr = sanitizeValue(data.title) || slug;
    const rawTags  = sanitizeArray(data.tags);
    const rawCats  = sanitizeArray(data.categories);

    return {
      slug,
      frontmatter: {
        title: titleStr,
        date: data.date ? new Date(sanitizeValue(data.date)).toLocaleDateString('en-IN', {
          year: 'numeric', month: 'long', day: 'numeric',
        }) : '',
        excerpt: cleanShortcodes(sanitizeValue(data.excerpt)),
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
