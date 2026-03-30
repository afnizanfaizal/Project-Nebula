# Firestore as Primary Post Storage — Design Spec

**Date:** 2026-03-30
**Status:** Approved

## Overview

Migrate blog post storage from local `.mdx` files (Astro content collections) to Firestore as the primary source of truth. Posts are written, read, and deleted via Firestore. The blog renders post content at runtime using a server-side `unified` markdown pipeline.

---

## 1. Firestore Data Model

Collection: `posts`
Document ID: `{slug}`

```
{
  title:          string       // post title
  description:    string       // short excerpt / subtitle
  pubDate:        Timestamp    // original publish date
  updatedDate?:   Timestamp    // last edited date (optional)
  tags:           string[]     // e.g. ["ai", "react"]
  draft?:         boolean      // if true, not publicly accessible
  featuredImage?: string       // URL — used as hero header + og:image
  content:        string       // raw markdown body (no frontmatter)
  views:          number       // existing view count field — unchanged
}
```

**Save behaviour:** The admin editor submits a full MDX string (frontmatter + body). `save-post.ts` parses the frontmatter, extracts the body, and writes structured fields to Firestore. The `views` field is preserved via merge on write (`{ merge: true }`).

**Load behaviour:** `get-post.ts` reads the Firestore document and reconstructs the MDX string (YAML frontmatter + body) for the editor to display.

---

## 2. New File: `src/lib/firebase-admin.ts`

Initialises Firebase Admin SDK using server-only env vars:

- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`

Exports:
- `adminDb` — server-side Firestore instance
- `savePost(slug, data)` — upserts post document (merge to preserve `views`)
- `getPost(slug)` — returns post data or `null`
- `deletePost(slug)` — deletes post document
- `listPosts()` — returns `[{ slug, title, pubDate, description, draft }]` sorted by `pubDate` descending

The existing `src/lib/firebase.ts` (client SDK, browser-only) is **unchanged** — it continues to handle view counting on the frontend.

---

## 3. Updated API Routes

### `POST /api/save-post`
- **Before:** writes `.mdx` file to `src/content/blog/`
- **After:** parses frontmatter from submitted MDX string → calls `savePost()` → writes to Firestore
- Slug is derived from the explicit `slug` field in the request body, or from the `title` frontmatter field as a fallback

### `GET /api/admin/get-post?slug=`
- **Before:** reads `.mdx` file from `src/content/blog/`
- **After:** calls `getPost(slug)` → reconstructs MDX string from frontmatter fields + content body → returns to editor

### `DELETE /api/admin/delete-post?slug=`
- **Before:** deletes `.mdx` file from `src/content/blog/`
- **After:** calls `deletePost(slug)` → removes Firestore document

### New: `GET /api/admin/list-posts`
- Calls `listPosts()` → returns array of `{ slug, title, pubDate, description, draft }` for the admin dashboard

---

## 4. New File: `src/lib/render-markdown.ts`

Server-side function `renderMarkdown(content: string): Promise<{ html: string, headings: Heading[] }>` that processes raw markdown to an HTML string and extracts headings for the Table of Contents.

```ts
type Heading = { depth: number; slug: string; text: string }
```

Pipeline:
```
unified
  → remark-parse
  → remark-extract-headings  (custom — collects h1–h6 into headings array)
  → remark-rehype (allowDangerousHtml: true)
  → rehype-raw
  → rehype-blog-components  (custom plugin — see section 5)
  → rehype-shiki (github-light / github-dark-default, matching astro.config.mjs)
  → rehype-stringify
```

Returns `{ html, headings }`. Used in `[slug].astro`: html rendered with `<Fragment set:html={html} />`, headings passed to `PostLayout` for `TableOfContents`.

---

## 5. Custom Rehype Plugin: `rehype-blog-components`

A single rehype plugin (`src/lib/rehype-blog-components.ts`) that visits raw element nodes and transforms JSX-style component tags into plain HTML:

| Input tag | Output |
|---|---|
| `<Callout type="info\|tip\|warning\|danger" title="...">` | `<div>` with icon, Tailwind classes matching existing `Callout.astro` output |
| `<Figure src="..." align="left\|right\|center\|none" caption="...">` | `<figure class="blog-figure figure-{align}">` with `<img>` and optional `<figcaption>` |
| `<ZoomImage src="..." alt="..." caption="..." width height>` | `<figure class="not-prose my-8">` with `<img class="zoom-image ...">` and optional `<figcaption>` |

**CSS migration:** `Figure` and `ZoomImage` currently use scoped Astro component styles. Since content is now rendered via `<Fragment set:html={...} />`, those styles must move to a global stylesheet (e.g. `src/styles/blog-components.css`) imported in `PostLayout.astro`.

**ZoomImage JS:** The `medium-zoom` script currently lives inside `ZoomImage.astro` as a `<script>` tag. Since that component is no longer used for rendering, the script must move to `PostLayout.astro`. It initialises by class name `.zoom-image`, so as long as the rendered HTML contains that class, zoom continues to work.

---

## 6. Updated `src/pages/blog/[slug].astro`

- Remove: `getEntry()`, `render()` from `astro:content`
- Add: fetch post via `adminDb` (Firebase Admin SDK)
- Add: call `renderMarkdown(post.content)` to get HTML
- Pass plain post data object to `PostLayout`
- Render content with `<Fragment set:html={html} />`
- If post not found or `draft === true` (for non-admin): redirect to `/404`

---

## 7. Updated `src/layouts/PostLayout.astro`

**Props change:** Replace `CollectionEntry<'blog'>` with a plain typed object:

```ts
interface Props {
  post: {
    slug: string
    title: string
    description: string
    pubDate: Date
    updatedDate?: Date
    tags: string[]
    featuredImage?: string
  }
  headings: { depth: number; slug: string; text: string }[]
  minutesRead: number
}
```

**Hero image:** When `featuredImage` is present, render a full-width hero section above the article header — image fills the width with a gradient overlay (transparent → dark), title and meta displayed on top. When absent, layout renders as today.

**og:image:** Pass `featuredImage` to `Layout.astro` as the meta image for social sharing.

---

## 8. Package Dependencies to Add

- `firebase-admin` — Firebase Admin SDK (server-side)
- `unified` — markdown processing pipeline
- `remark-parse` — markdown parser
- `remark-rehype` — remark → rehype bridge
- `rehype-raw` — allows raw HTML passthrough
- `rehype-stringify` — serialise hast to HTML string
- `gray-matter` — frontmatter parsing on save/load

Note: `@shikijs/rehype` is already installed (used in `astro.config.mjs`).

---

## 9. What Does NOT Change

- `src/lib/firebase.ts` — client SDK, view counting
- `src/components/react/ViewCounter` — unchanged
- Admin authentication (`admin_session` cookie)
- Image upload (`/api/admin/upload-image`)
- All other pages, layouts, and components
- Existing Firestore `views` data — preserved via merge writes
