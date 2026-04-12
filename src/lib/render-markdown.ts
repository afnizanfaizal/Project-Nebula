// src/lib/render-markdown.ts
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import rehypeRaw from 'rehype-raw';
import rehypeShiki from '@shikijs/rehype';
import rehypeStringify from 'rehype-stringify';
import { visit } from 'unist-util-visit';
import { rehypeBlogComponents } from './rehype-blog-components.js';

export type Heading = { depth: number; slug: string; text: string };

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export async function renderMarkdown(
  content: string,
): Promise<{ html: string; headings: Heading[] }> {
  const headings: Heading[] = [];

  // Pre-process :::tip style admonitions into <callout> tags for consistent rendering
  const preprocessed = content.replace(/:::(note|tip|info|warning|caution|danger)([\s\S]*?):::/g, (match, type, inner) => {
    return `\n<callout type="${type}">\n${inner.trim()}\n</callout>\n`;
  });

  const file = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    // Collect headings from the MDAST before converting to hast
    .use(() => (tree) => {
      visit(tree, 'heading', (node: any) => {
        const text = node.children
          .filter((c: any) => c.type === 'text' || c.type === 'inlineCode')
          .map((c: any) => String(c.value))
          .join('');
        headings.push({ depth: node.depth, slug: slugify(text), text });
      });
    })
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(rehypeBlogComponents)
    .use(rehypeShiki, {
      theme: 'github-dark-default',
    })
    .use(rehypeStringify)
    .process(preprocessed);

  return { html: String(file), headings };
}
