// src/lib/__tests__/rehype-blog-components.test.ts
import { describe, it, expect } from 'vitest';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import rehypeRaw from 'rehype-raw';
import rehypeStringify from 'rehype-stringify';
import { rehypeBlogComponents } from '../rehype-blog-components.js';

async function process(md: string): Promise<string> {
  const file = await unified()
    .use(remarkParse)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(rehypeBlogComponents)
    .use(rehypeStringify)
    .process(md);
  return String(file);
}

describe('rehypeBlogComponents', () => {
  it('transforms <Callout type="info"> into a styled div', async () => {
    const html = await process('<Callout type="info">Hello world</Callout>');
    expect(html).toContain('bg-blue-50/50');
    expect(html).toContain('Hello world');
    expect(html).toContain('ℹ');
  });

  it('transforms <Callout type="warning"> with correct classes', async () => {
    const html = await process('<Callout type="warning">Caution</Callout>');
    expect(html).toContain('bg-amber-50/50');
    expect(html).toContain('⚠');
    expect(html).toContain('Caution');
  });

  it('renders Callout title when provided', async () => {
    const html = await process('<Callout type="tip" title="Pro tip">Content</Callout>');
    expect(html).toContain('Pro tip');
    expect(html).toContain('Content');
  });

  it('defaults to info when Callout type is unknown', async () => {
    const html = await process('<Callout type="unknown">Text</Callout>');
    expect(html).toContain('bg-blue-50/50');
  });

  it('transforms <Figure> with align class', async () => {
    const html = await process('<Figure src="/img.jpg" align="left" caption="My caption" />');
    expect(html).toContain('figure-left');
    expect(html).toContain('/img.jpg');
    expect(html).toContain('My caption');
    expect(html).toContain('<figcaption>');
  });

  it('transforms <Figure> without caption', async () => {
    const html = await process('<Figure src="/img.jpg" align="none" />');
    expect(html).toContain('figure-none');
    expect(html).not.toContain('<figcaption>');
  });

  it('transforms <ZoomImage> with zoom-image class', async () => {
    const html = await process('<ZoomImage src="/photo.jpg" alt="A photo" />');
    expect(html).toContain('zoom-image');
    expect(html).toContain('/photo.jpg');
    expect(html).toContain('A photo');
  });

  it('transforms <ZoomImage> with caption', async () => {
    const html = await process('<ZoomImage src="/photo.jpg" alt="Alt" caption="Caption text" />');
    expect(html).toContain('Caption text');
    expect(html).toContain('<figcaption');
  });

  it('does not transform a standard markdown image into zoom-image', async () => {
    const html = await process('![alt text](/regular.jpg)');
    expect(html).not.toContain('zoom-image');
    expect(html).toContain('/regular.jpg');
  });
});
