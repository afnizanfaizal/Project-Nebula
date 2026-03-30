// src/lib/__tests__/render-markdown.test.ts
import { describe, it, expect } from 'vitest';
import { renderMarkdown } from '../render-markdown.js';

describe('renderMarkdown', () => {
  it('converts markdown headings and paragraphs to html', async () => {
    const { html } = await renderMarkdown('# Hello\n\nWorld paragraph.');
    expect(html).toMatch(/<h1[^>]*>.*Hello.*<\/h1>/s);
    expect(html).toContain('<p>World paragraph.</p>');
  });

  it('extracts headings with depth, slug, and text', async () => {
    const { headings } = await renderMarkdown('# First\n\n## Second Section\n\n### Third');
    expect(headings).toEqual([
      { depth: 1, slug: 'first',          text: 'First'          },
      { depth: 2, slug: 'second-section', text: 'Second Section' },
      { depth: 3, slug: 'third',          text: 'Third'          },
    ]);
  });

  it('returns empty headings array when there are no headings', async () => {
    const { headings } = await renderMarkdown('Just a paragraph.');
    expect(headings).toEqual([]);
  });

  it('renders inline code and bold', async () => {
    const { html } = await renderMarkdown('Use **bold** and `code`.');
    expect(html).toContain('<strong>bold</strong>');
    expect(html).toContain('<code>code</code>');
  });

  it('syntax-highlights fenced code blocks', async () => {
    const { html } = await renderMarkdown('```ts\nconst x = 1;\n```');
    // rehype-shiki wraps code in <pre> with shiki classes
    expect(html).toContain('<pre');
    expect(html).toContain('const');
  });

  it('transforms <Callout> component via rehype-blog-components', async () => {
    const { html } = await renderMarkdown('<Callout type="danger">Watch out!</Callout>');
    expect(html).toContain('bg-red-50/50');
    expect(html).toContain('Watch out!');
  });
});
