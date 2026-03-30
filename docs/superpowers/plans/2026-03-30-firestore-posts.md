# Firestore as Primary Post Storage — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace local `.mdx` file storage with Firestore as the primary source of truth for blog posts, rendering content at runtime via a `unified` markdown pipeline.

**Architecture:** Firebase Admin SDK (already in devDeps) handles server-side Firestore CRUD. A `unified` remark/rehype pipeline renders markdown to HTML at runtime. A custom rehype plugin transforms `<Callout>`, `<Figure>`, `<ZoomImage>` JSX-like tags into plain HTML. `gray-matter` parses frontmatter on save and reconstructs MDX strings on load.

**Tech Stack:** firebase-admin (existing devDep → move to dep), gray-matter, unified, remark-parse, remark-rehype, rehype-raw, rehype-stringify, unist-util-visit, @shikijs/rehype (existing)

---

## File Map

**New files:**
- `src/lib/firebase-admin.ts` — Admin SDK init + `savePost` / `getPost` / `deletePost` / `listPosts`
- `src/lib/rehype-blog-components.ts` — rehype plugin: Callout / Figure / ZoomImage → HTML
- `src/lib/render-markdown.ts` — unified pipeline returning `{ html, headings }`
- `src/lib/__tests__/rehype-blog-components.test.ts` — unit tests for the plugin
- `src/lib/__tests__/render-markdown.test.ts` — unit tests for the pipeline
- `src/pages/api/admin/list-posts.ts` — GET endpoint returning post list for admin dashboard

**Modified files:**
- `package.json` — add `gray-matter`, `unified`, `remark-parse`, `remark-rehype`, `rehype-raw`, `rehype-stringify`, `unist-util-visit`; move `firebase-admin` to `dependencies`
- `src/pages/api/save-post.ts` — rewrite: filesystem → Firestore
- `src/pages/api/admin/get-post.ts` — rewrite: filesystem → Firestore
- `src/pages/api/admin/delete-post.ts` — rewrite: filesystem → Firestore
- `src/pages/blog/[slug].astro` — Firestore fetch + `renderMarkdown` pipeline
- `src/layouts/PostLayout.astro` — new props interface + hero image + medium-zoom script
- `src/pages/admin/dashboard.astro` — replace `getCollection('blog')` with `listPosts()`
- `src/styles/global.css` — add Figure / ZoomImage styles (previously scoped in Astro components)

---

## Task 1: Install Dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Move `firebase-admin` to `dependencies` and add new packages**

```bash
npm install gray-matter unified remark-parse remark-rehype rehype-raw rehype-stringify unist-util-visit
```

Then open `package.json`, cut `"firebase-admin": "^13.7.0"` from `devDependencies` and paste it into `dependencies`.

- [ ] **Step 2: Verify installation**

```bash
node -e "import('unified').then(() => console.log('ok'))"
```

Expected output: `ok`

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add unified/remark/rehype deps; move firebase-admin to dependencies"
```

---

## Task 2: Create `src/lib/firebase-admin.ts`

**Files:**
- Create: `src/lib/firebase-admin.ts`

- [ ] **Step 1: Write the file**

```ts
// src/lib/firebase-admin.ts
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

const apps = getApps();
const app = apps.length === 0
  ? initializeApp({
      credential: cert({
        projectId:   process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey:  process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    })
  : apps[0];

export const adminDb = getFirestore(app);

// ── Types ──────────────────────────────────────────────────────────────────

export interface PostDocument {
  title:         string;
  description:   string;
  pubDate:       Timestamp;
  updatedDate?:  Timestamp;
  tags:          string[];
  draft?:        boolean;
  featured?:     boolean;
  featuredImage?: string;
  content:       string;
  views?:        number;
}

export interface PostSummary {
  slug:         string;
  title:        string;
  description:  string;
  pubDate:      string;   // ISO date string
  draft:        boolean;
  featured:     boolean;
  tags:         string[];
  featuredImage?: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────

/**
 * Upsert a post document. Merges to preserve the existing `views` count.
 */
export async function savePost(
  slug: string,
  data: Omit<PostDocument, 'views'>,
): Promise<void> {
  await adminDb.collection('posts').doc(slug).set(data, { merge: true });
}

/**
 * Fetch a single post by slug. Returns null if not found.
 */
export async function getPost(
  slug: string,
): Promise<(PostDocument & { slug: string }) | null> {
  const snap = await adminDb.collection('posts').doc(slug).get();
  if (!snap.exists) return null;
  return { slug, ...(snap.data() as PostDocument) };
}

/**
 * Delete a post document. Resolves even if the document didn't exist.
 */
export async function deletePost(slug: string): Promise<void> {
  await adminDb.collection('posts').doc(slug).delete();
}

/**
 * List all posts sorted by pubDate descending.
 */
export async function listPosts(): Promise<PostSummary[]> {
  const snap = await adminDb
    .collection('posts')
    .orderBy('pubDate', 'desc')
    .get();

  return snap.docs.map((doc) => {
    const d = doc.data() as PostDocument;
    return {
      slug:          doc.id,
      title:         d.title ?? '',
      description:   d.description ?? '',
      pubDate:       d.pubDate instanceof Timestamp
                       ? d.pubDate.toDate().toISOString()
                       : String(d.pubDate),
      draft:         d.draft ?? false,
      featured:      d.featured ?? false,
      tags:          d.tags ?? [],
      featuredImage: d.featuredImage,
    };
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/firebase-admin.ts
git commit -m "feat: add firebase-admin lib with savePost/getPost/deletePost/listPosts"
```

---

## Task 3: Create `src/lib/rehype-blog-components.ts`

**Files:**
- Create: `src/lib/rehype-blog-components.ts`

Context: When MDX content (e.g. `<Callout type="warning">text</Callout>`) is processed by
`remark-rehype` with `allowDangerousHtml: true` and then `rehype-raw`, the HTML parser (parse5)
lowercases tag names. So `<Callout>` → element with `tagName: 'callout'`, `<Figure>` → `figure`,
`<ZoomImage>` → `zoomimage`. This plugin transforms those into proper HTML.

- [ ] **Step 1: Write the file**

```ts
// src/lib/rehype-blog-components.ts
import { visit } from 'unist-util-visit';

// Matches Callout.astro config exactly
const CALLOUT_CONFIG: Record<string, { icon: string; bg: string; border: string; text: string }> = {
  info:    { icon: 'ℹ', bg: 'bg-blue-50/50 dark:bg-blue-950/30',   border: 'border-blue-200 dark:border-blue-800/50',   text: 'text-blue-900 dark:text-blue-100'   },
  tip:     { icon: '✦', bg: 'bg-green-50/50 dark:bg-green-950/30', border: 'border-green-200 dark:border-green-800/50', text: 'text-green-900 dark:text-green-100' },
  warning: { icon: '⚠', bg: 'bg-amber-50/50 dark:bg-amber-950/30', border: 'border-amber-200 dark:border-amber-800/50', text: 'text-amber-900 dark:text-amber-100' },
  danger:  { icon: '✕', bg: 'bg-red-50/50 dark:bg-red-950/30',     border: 'border-red-200 dark:border-red-800/50',     text: 'text-red-900 dark:text-red-100'   },
};

// Lightweight hast node constructors (avoids hastscript dependency)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function el(tagName: string, props: Record<string, unknown>, ...children: any[]): any {
  return { type: 'element', tagName, properties: props, children };
}

function txt(value: string) {
  return { type: 'text', value };
}

export function rehypeBlogComponents() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (tree: any) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    visit(tree, 'element', (node: any, index: number | undefined, parent: any) => {
      if (!parent || index == null) return;

      // ── Callout ────────────────────────────────────────────────────────
      if (node.tagName === 'callout') {
        const type: string = String(node.properties?.type ?? 'info');
        const cfg = CALLOUT_CONFIG[type] ?? CALLOUT_CONFIG.info;
        const title: string | undefined = node.properties?.title
          ? String(node.properties.title)
          : undefined;

        parent.children[index] = el(
          'div',
          { className: `not-prose my-6 flex gap-3 rounded-lg border p-4 backdrop-blur-sm ${cfg.bg} ${cfg.border}` },
          el('span', { className: `mt-0.5 shrink-0 text-base leading-none ${cfg.text}`, ariaHidden: 'true' },
            txt(cfg.icon),
          ),
          el('div', { className: 'flex-1 min-w-0' },
            ...(title
              ? [el('p', { className: `mb-1 text-sm font-semibold ${cfg.text}` }, txt(title))]
              : []
            ),
            el('div', { className: `text-sm leading-relaxed ${cfg.text} [&>p]:m-0` },
              ...node.children,
            ),
          ),
        );
        return;
      }

      // ── Figure (custom — identified by presence of `src` attribute) ───
      // parse5 lowercases <Figure> → <figure>. Standard HTML <figure> never has a src attribute.
      if (node.tagName === 'figure' && node.properties?.src) {
        const src     = String(node.properties.src ?? '');
        const alt     = String(node.properties.alt ?? '');
        const align   = String(node.properties.align ?? 'none');
        const caption = node.properties.caption ? String(node.properties.caption) : undefined;

        parent.children[index] = el(
          'figure',
          { className: `blog-figure figure-${align}` },
          el('img', { src, alt, loading: 'lazy' }),
          ...(caption ? [el('figcaption', {}, txt(caption))] : []),
        );
        return;
      }

      // ── ZoomImage ──────────────────────────────────────────────────────
      if (node.tagName === 'zoomimage') {
        const src     = String(node.properties?.src ?? '');
        const alt     = String(node.properties?.alt ?? '');
        const caption = node.properties?.caption ? String(node.properties.caption) : undefined;
        const width   = node.properties?.width;
        const height  = node.properties?.height;

        parent.children[index] = el(
          'figure',
          { className: 'not-prose my-8' },
          el('img', {
            src,
            alt,
            ...(width  ? { width  } : {}),
            ...(height ? { height } : {}),
            className: 'zoom-image w-full rounded-lg border border-zinc-200 dark:border-zinc-800 cursor-zoom-in',
            loading: 'lazy',
            decoding: 'async',
          }),
          ...(caption
            ? [el('figcaption', { className: 'mt-2 text-center text-xs text-zinc-500 dark:text-zinc-400' }, txt(caption))]
            : []
          ),
        );
        return;
      }
    });
  };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/rehype-blog-components.ts
git commit -m "feat: add rehype-blog-components plugin for Callout/Figure/ZoomImage"
```

---

## Task 4: Write tests for `rehype-blog-components`

**Files:**
- Create: `src/lib/__tests__/rehype-blog-components.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
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
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test src/lib/__tests__/rehype-blog-components.test.ts
```

Expected: FAIL (modules not found yet or import errors — confirms the test wiring is correct once Task 3 is done)

- [ ] **Step 3: Run tests after Task 3 is complete**

```bash
npm test src/lib/__tests__/rehype-blog-components.test.ts
```

Expected: all 9 tests PASS

- [ ] **Step 4: Commit**

```bash
git add src/lib/__tests__/rehype-blog-components.test.ts
git commit -m "test: add rehype-blog-components unit tests"
```

---

## Task 5: Create `src/lib/render-markdown.ts`

**Files:**
- Create: `src/lib/render-markdown.ts`

- [ ] **Step 1: Write the file**

```ts
// src/lib/render-markdown.ts
import { unified } from 'unified';
import remarkParse from 'remark-parse';
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

  const file = await unified()
    .use(remarkParse)
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
      themes: { light: 'github-light', dark: 'github-dark-default' },
    })
    .use(rehypeStringify)
    .process(content);

  return { html: String(file), headings };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/render-markdown.ts
git commit -m "feat: add render-markdown unified pipeline with heading extraction"
```

---

## Task 6: Write and run tests for `render-markdown`

**Files:**
- Create: `src/lib/__tests__/render-markdown.test.ts`

- [ ] **Step 1: Write the tests**

```ts
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
```

- [ ] **Step 2: Run all tests**

```bash
npm test
```

Expected: all tests PASS

- [ ] **Step 3: Commit**

```bash
git add src/lib/__tests__/render-markdown.test.ts
git commit -m "test: add render-markdown unit tests"
```

---

## Task 7: Update `src/pages/api/save-post.ts`

**Files:**
- Modify: `src/pages/api/save-post.ts`

- [ ] **Step 1: Rewrite the file**

```ts
// src/pages/api/save-post.ts
export const prerender = false;

import type { APIRoute } from 'astro';
import matter from 'gray-matter';
import { Timestamp } from 'firebase-admin/firestore';
import { savePost } from '../../lib/firebase-admin.js';

function titleToSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export const POST: APIRoute = async (context) => {
  const { request } = context;

  if (context.cookies.get('admin_session')?.value !== 'authenticated') {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await request.json() as { markdown: unknown; slug?: unknown };
    const markdown = body.markdown;
    if (typeof markdown !== 'string' || markdown.length === 0) {
      return new Response(JSON.stringify({ error: 'Invalid markdown' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { data, content } = matter(markdown);

    const explicitSlug =
      typeof body.slug === 'string' && /^[a-z0-9][a-z0-9-]*$/.test(body.slug)
        ? body.slug
        : null;
    const slug = explicitSlug ?? titleToSlug(String(data.title ?? 'untitled'));

    const pubDate = data.pubDate
      ? Timestamp.fromDate(new Date(data.pubDate as string))
      : Timestamp.now();

    const updatedDate = data.updatedDate
      ? Timestamp.fromDate(new Date(data.updatedDate as string))
      : undefined;

    await savePost(slug, {
      title:         String(data.title ?? ''),
      description:   String(data.description ?? ''),
      pubDate,
      ...(updatedDate ? { updatedDate } : {}),
      tags:          Array.isArray(data.tags) ? data.tags.map(String) : [],
      draft:         Boolean(data.draft ?? false),
      featured:      Boolean(data.featured ?? false),
      ...(data.featuredImage ? { featuredImage: String(data.featuredImage) } : {}),
      content:       content.trimStart(),
    });

    return new Response(JSON.stringify({ ok: true, slug }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/api/save-post.ts
git commit -m "feat: save-post writes to Firestore instead of filesystem"
```

---

## Task 8: Update `src/pages/api/admin/get-post.ts`

**Files:**
- Modify: `src/pages/api/admin/get-post.ts`

- [ ] **Step 1: Rewrite the file**

```ts
// src/pages/api/admin/get-post.ts
export const prerender = false;

import type { APIRoute } from 'astro';
import { getPost } from '../../../lib/firebase-admin.js';
import { Timestamp } from 'firebase-admin/firestore';

function formatDate(ts: Timestamp | undefined): string | undefined {
  if (!ts) return undefined;
  return ts instanceof Timestamp
    ? ts.toDate().toISOString().slice(0, 10)
    : String(ts);
}

export const GET: APIRoute = async ({ url, cookies }) => {
  if (cookies.get('admin_session')?.value !== 'authenticated') {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const slug = url.searchParams.get('slug');
  if (!slug || !/^[a-z0-9][a-z0-9-]*$/.test(slug)) {
    return new Response(JSON.stringify({ error: 'Invalid slug' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const post = await getPost(slug);
  if (!post) {
    return new Response(JSON.stringify({ error: 'Post not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Reconstruct the MDX frontmatter string for the editor
  const pubDateStr     = formatDate(post.pubDate) ?? new Date().toISOString().slice(0, 10);
  const updatedDateStr = formatDate(post.updatedDate);

  const lines = [
    '---',
    `title: ${JSON.stringify(post.title)}`,
    `pubDate: ${pubDateStr}`,
    `description: ${JSON.stringify(post.description ?? '')}`,
    `tags: ${JSON.stringify(post.tags ?? [])}`,
    `featured: ${post.featured ?? false}`,
    `draft: ${post.draft ?? false}`,
    ...(post.featuredImage ? [`featuredImage: ${JSON.stringify(post.featuredImage)}`] : []),
    ...(updatedDateStr     ? [`updatedDate: ${updatedDateStr}`]                       : []),
    '---',
    '',
    post.content ?? '',
  ];

  const content = lines.join('\n');

  return new Response(JSON.stringify({ content, slug }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
  });
};
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/api/admin/get-post.ts
git commit -m "feat: get-post reads from Firestore and reconstructs MDX string"
```

---

## Task 9: Update `src/pages/api/admin/delete-post.ts`

**Files:**
- Modify: `src/pages/api/admin/delete-post.ts`

- [ ] **Step 1: Rewrite the file**

```ts
// src/pages/api/admin/delete-post.ts
export const prerender = false;

import type { APIRoute } from 'astro';
import { deletePost } from '../../../lib/firebase-admin.js';

export const DELETE: APIRoute = async ({ url, cookies }) => {
  if (cookies.get('admin_session')?.value !== 'authenticated') {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const slug = url.searchParams.get('slug');
  if (!slug || !/^[a-z0-9][a-z0-9-]*$/.test(slug)) {
    return new Response(JSON.stringify({ error: 'Invalid slug' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  await deletePost(slug);

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/api/admin/delete-post.ts
git commit -m "feat: delete-post removes Firestore document"
```

---

## Task 10: Create `src/pages/api/admin/list-posts.ts`

**Files:**
- Create: `src/pages/api/admin/list-posts.ts`

- [ ] **Step 1: Write the file**

```ts
// src/pages/api/admin/list-posts.ts
export const prerender = false;

import type { APIRoute } from 'astro';
import { listPosts } from '../../../lib/firebase-admin.js';

export const GET: APIRoute = async ({ cookies }) => {
  if (cookies.get('admin_session')?.value !== 'authenticated') {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const posts = await listPosts();

  return new Response(JSON.stringify(posts), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
  });
};
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/api/admin/list-posts.ts
git commit -m "feat: add list-posts API endpoint"
```

---

## Task 11: Migrate Figure and ZoomImage CSS to `src/styles/global.css`

**Files:**
- Modify: `src/styles/global.css`

Context: `Figure.astro` and `ZoomImage.astro` use scoped `<style>` blocks. When post content is
rendered via `<Fragment set:html={...} />`, those scoped styles no longer apply. The styles must
become global.

- [ ] **Step 1: Append blog component styles to `src/styles/global.css`**

Open `src/styles/global.css` and append the following at the end of the file:

```css
/* ── Blog MDX component styles ───────────────────────────────────────────── */
/* Previously scoped in Figure.astro and ZoomImage.astro.                     */
/* Required here because post content is rendered via <Fragment set:html>      */

.blog-figure {
  margin: 0;
}

.figure-left {
  float: left;
  max-width: 45%;
  margin: 0.25rem 1.75rem 1rem 0;
}

.figure-right {
  float: right;
  max-width: 45%;
  margin: 0.25rem 0 1rem 1.75rem;
}

.figure-center {
  display: block;
  margin: 1.5rem auto;
  text-align: center;
  max-width: 100%;
}

.figure-none {
  display: block;
  margin: 1.5rem 0;
  max-width: 100%;
}

.blog-figure img {
  display: block;
  width: 100%;
  height: auto;
  border-radius: 0.375rem;
}

.blog-figure figcaption {
  margin-top: 0.5rem;
  font-size: 0.8125rem;
  color: #6b7280;
  text-align: center;
  font-style: italic;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/styles/global.css
git commit -m "style: migrate Figure/ZoomImage scoped styles to global.css"
```

---

## Task 12: Update `src/pages/blog/[slug].astro`

**Files:**
- Modify: `src/pages/blog/[slug].astro`

- [ ] **Step 1: Rewrite the file**

```astro
---
export const prerender = false;
import PostLayout from '../../layouts/PostLayout.astro';
import ViewCounter from '../../components/react/ViewCounter';
import { getPost } from '../../lib/firebase-admin.js';
import { renderMarkdown } from '../../lib/render-markdown.js';
import { getReadingTime } from '../../lib/utils';
import { Timestamp } from 'firebase-admin/firestore';

const { slug } = Astro.params;
if (!slug) return Astro.redirect('/404');

const post = await getPost(slug);
if (!post) return Astro.redirect('/404');

// Hide drafts from public — admins bypass via direct URL awareness
const isAdmin = Astro.cookies.get('admin_session')?.value === 'authenticated';
if (post.draft && !isAdmin) return Astro.redirect('/404');

const { html, headings } = await renderMarkdown(post.content ?? '');
const minutesRead = getReadingTime(post.content ?? '');

const pubDate    = post.pubDate instanceof Timestamp ? post.pubDate.toDate()     : new Date(post.pubDate as any);
const updatedDate = post.updatedDate instanceof Timestamp ? post.updatedDate.toDate() : undefined;
---
<PostLayout
  post={{
    slug,
    title:         post.title,
    description:   post.description,
    pubDate,
    updatedDate,
    tags:          post.tags ?? [],
    featuredImage: post.featuredImage,
  }}
  headings={headings}
  minutesRead={minutesRead}
>
  <ViewCounter slug={slug} client:only="react" slot="after-meta" />
  <Fragment set:html={html} />
</PostLayout>
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/blog/[slug].astro
git commit -m "feat: [slug].astro fetches post from Firestore and renders via unified pipeline"
```

---

## Task 13: Update `src/layouts/PostLayout.astro`

**Files:**
- Modify: `src/layouts/PostLayout.astro`

- [ ] **Step 1: Rewrite the file**

```astro
---
// src/layouts/PostLayout.astro
import Layout from './Layout.astro';
import TableOfContents from '../components/TableOfContents.astro';

interface Props {
  post: {
    slug: string;
    title: string;
    description: string;
    pubDate: Date;
    updatedDate?: Date;
    tags: string[];
    featuredImage?: string;
  };
  headings: { depth: number; slug: string; text: string }[];
  minutesRead: number;
}

const { post, headings, minutesRead } = Astro.props;
const { title, pubDate, updatedDate, description, tags, featuredImage } = post;

const formattedDate = new Intl.DateTimeFormat('en-US', {
  year: 'numeric', month: 'long', day: 'numeric',
}).format(pubDate);
---
<Layout
  title={`${title} — Dr. Afnizanfaizal`}
  description={description}
  image={featuredImage}
>
  <!-- Reading progress bar -->
  <div
    id="progress-bar"
    class="fixed top-0 left-0 h-0.5 bg-zinc-900 dark:bg-zinc-100 z-[60] transition-none"
    style="width: 0%"
    aria-hidden="true"
  ></div>

  {featuredImage ? (
    <!-- Hero image layout: image fills top, gradient overlay, title on top -->
    <div class="relative w-full overflow-hidden" style="max-height: 480px; min-height: 240px;">
      <img
        src={featuredImage}
        alt=""
        class="w-full object-cover"
        style="max-height: 480px; min-height: 240px;"
      />
      <div class="absolute inset-0 bg-gradient-to-b from-transparent via-black/30 to-black/90" />
      <div class="absolute bottom-0 left-0 right-0 px-6 pb-8 mx-auto" style="max-width: 80rem;">
        {tags.length > 0 && (
          <div class="mb-3 flex flex-wrap gap-2">
            {tags.map((tag) => (
              <a
                href={`/blog?tag=${tag}`}
                class="text-xs font-medium uppercase tracking-widest text-zinc-300 hover:text-white transition-colors"
              >
                {tag}
              </a>
            ))}
          </div>
        )}
        <h1 class="text-3xl sm:text-4xl font-bold tracking-tight leading-tight text-white">
          {title}
        </h1>
        <div class="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-zinc-300">
          <time datetime={pubDate.toISOString()}>{formattedDate}</time>
          <span aria-hidden="true">·</span>
          <span>{minutesRead} min read</span>
          {updatedDate && (
            <>
              <span aria-hidden="true">·</span>
              <span>Updated <time datetime={updatedDate.toISOString()}>
                {new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(updatedDate)}
              </time></span>
            </>
          )}
        </div>
        <slot name="after-meta" />
      </div>
    </div>
  ) : null}

  <div class="mx-auto max-w-5xl px-6 py-16">
    <div class="lg:grid lg:grid-cols-[1fr_220px] lg:gap-16">
      <!-- Main content -->
      <article>
        {!featuredImage && (
          <!-- Standard header (no hero image) -->
          <header class="mb-10">
            {tags.length > 0 && (
              <div class="mb-4 flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <a
                    href={`/blog?tag=${tag}`}
                    class="text-xs font-medium uppercase tracking-widest text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                  >
                    {tag}
                  </a>
                ))}
              </div>
            )}
            <h1 class="text-3xl sm:text-4xl font-bold tracking-tight leading-tight text-zinc-900 dark:text-zinc-100">
              {title}
            </h1>
            <div class="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-zinc-500 dark:text-zinc-400">
              <time datetime={pubDate.toISOString()}>{formattedDate}</time>
              <span aria-hidden="true">·</span>
              <span>{minutesRead} min read</span>
              {updatedDate && (
                <>
                  <span aria-hidden="true">·</span>
                  <span>Updated <time datetime={updatedDate.toISOString()}>
                    {new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(updatedDate)}
                  </time></span>
                </>
              )}
            </div>
            <slot name="after-meta" />
          </header>
        )}

        <!-- Post content rendered from Firestore via unified pipeline -->
        <div class="prose prose-zinc dark:prose-invert prose-lg max-w-none
          prose-headings:scroll-mt-20
          prose-a:text-zinc-900 dark:prose-a:text-zinc-100 prose-a:underline-offset-4
          prose-code:font-mono prose-code:text-sm">
          <slot />
        </div>
      </article>

      <!-- Sidebar TOC (desktop only) -->
      <aside class="hidden lg:block">
        <div class="sticky top-24">
          <TableOfContents headings={headings} />
        </div>
      </aside>
    </div>
  </div>
</Layout>

<script>
  // Reading progress bar
  const bar = document.getElementById('progress-bar');
  if (bar) {
    const update = () => {
      const scrolled = document.documentElement.scrollTop;
      const total = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.width = total > 0 ? `${(scrolled / total) * 100}%` : '0%';
    };
    window.addEventListener('scroll', update, { passive: true });
    update();
  }
</script>

<script>
  // medium-zoom for .zoom-image elements (previously initialised inside ZoomImage.astro)
  import mediumZoom from 'medium-zoom';
  mediumZoom('.zoom-image', { background: 'rgba(0, 0, 0, 0.8)', margin: 24 });
</script>
```

- [ ] **Step 2: Commit**

```bash
git add src/layouts/PostLayout.astro
git commit -m "feat: PostLayout accepts plain post object, adds hero image support, moves medium-zoom script"
```

---

## Task 14: Update `src/pages/admin/dashboard.astro`

**Files:**
- Modify: `src/pages/admin/dashboard.astro`

- [ ] **Step 1: Rewrite the file**

```astro
---
export const prerender = false;
import AdminLayout from '../../layouts/AdminLayout.astro';
import AdminDashboard from '../../components/react/AdminDashboard';
import { listPosts } from '../../lib/firebase-admin.js';

const postList = await listPosts();
const posts = postList.map((p) => ({
  slug:        p.slug,
  title:       p.title,
  pubDate:     p.pubDate,
  draft:       p.draft,
  tags:        p.tags,
  description: p.description,
  featured:    p.featured,
}));
---
<AdminLayout title="Dashboard — Admin">
  <AdminDashboard posts={posts} client:only="react" />
</AdminLayout>
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/admin/dashboard.astro
git commit -m "feat: dashboard fetches posts from Firestore via listPosts()"
```

---

## Task 15: Run full test suite and smoke-test the dev server

**Files:** none

- [ ] **Step 1: Run all tests**

```bash
npm test
```

Expected: all tests PASS with no errors

- [ ] **Step 2: Start the dev server**

```bash
npm run dev
```

Expected: dev server starts on `http://localhost:4321` with no build errors in the terminal.

- [ ] **Step 3: Smoke test — create a post via the admin editor**

1. Navigate to `http://localhost:4321/admin`
2. Log in and open the editor
3. Write a short post with a title, then click **Save Post**
4. Verify the terminal shows no errors
5. Navigate to `http://localhost:4321/blog/<your-slug>`
6. Verify the post renders correctly with the content and any components

- [ ] **Step 4: Smoke test — verify the dashboard lists the post**

Navigate to `http://localhost:4321/admin/dashboard` and verify the new post appears in the list.

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "feat: Firestore as primary post storage — full migration complete"
```
