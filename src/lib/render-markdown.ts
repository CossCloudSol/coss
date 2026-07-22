import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import rehypeStringify from 'rehype-stringify';
import { visit } from 'unist-util-visit';
import type { Root } from 'hast';

// Blog post pages render their own <h1>{title}</h1> above the article — demote
// any h1 the markdown produces to h2 so there's only ever one H1 on the page.
function demoteH1() {
  return (tree: Root) => {
    visit(tree, 'element', (node) => {
      if (node.tagName === 'h1') node.tagName = 'h2';
    });
  };
}

const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkRehype)
  .use(demoteH1)
  .use(rehypeSanitize, defaultSchema)
  .use(rehypeStringify);

export async function renderMarkdownToSafeHtml(markdown: string): Promise<string> {
  const file = await processor.process(markdown);
  return String(file);
}
