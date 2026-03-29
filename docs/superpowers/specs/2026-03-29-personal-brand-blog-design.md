# Design Spec: Dr. Afnizanfaizal Personal Brand Blog

**Date:** 2026-03-29
**Status:** Approved
**Goal:** A "WordPress Killer" personal brand blog — faster, more secure, neo-minimalist aesthetic — for Dr. Afnizanfaizal (AI Innovation & Tech Leader).

---

## 1. Tech Stack

| Layer | Choice | Reason |
|---|---|---|
| Framework | Astro 5.0+ (SSG) | Zero JS by default, content collections, islands architecture |
| Styling | Tailwind CSS v4 + Shadcn/UI (Zinc/Slate theme) | Utility-first, design tokens, accessible components |
| Content | MDX (Markdown + React components) | Rich content authoring with custom component embedding |
| Dynamic data | Firebase Firestore (client SDK) | Views/likes without a backend; existing Firebase instance |
| Admin editor | `@mdxeditor/editor` (React) | Live MDX editing with custom component preview |
| Syntax highlighting | Shiki (via `@astrojs/mdx` + rehype-shiki) | Server-side, zero runtime cost |
| Image zoom | `medium-zoom` | Lightweight, no framework dependency |

---

## 2. Folder Structure

```
/
├── src/
│   ├── content/
│   │   ├── blog/           # .mdx blog posts
│   │   └── projects/       # .mdx project case studies
│   ├── components/
│   │   ├── ui/             # Shadcn/UI base components
│   │   ├── mdx/            # Custom MDX components (CodeBlock, Callout, ZoomImage)
│   │   └── react/          # React islands (ViewCounter, ReadingProgress, MDXEditor)
│   ├── layouts/
│   │   ├── Layout.astro         # Base: Navbar + Footer shell
│   │   └── PostLayout.astro     # Blog post: TOC + progress bar + reading time
│   ├── pages/
│   │   ├── index.astro
│   │   ├── blog/
│   │   │   ├── index.astro
│   │   │   └── [slug].astro
│   │   ├── projects/
│   │   │   ├── index.astro
│   │   │   └── [slug].astro
│   │   └── admin/
│   │       └── editor.astro     # Protected MDX editor route
│   ├── lib/
│   │   └── firebase.ts          # Firebase client SDK init + Firestore helpers
│   └── middleware.ts             # Admin route protection
├── scripts/
│   └── migrate.js               # Firestore → MDX migration (Node.js, firebase-admin)
├── public/
│   └── fonts/                   # Self-hosted Inter + Geist Mono
├── astro.config.mjs
├── tailwind.config.mjs
└── tsconfig.json
```

---

## 3. Design System

### 3.1 Color Palette

**Light mode (default):**
- Background: `white` / `zinc-50`
- Foreground: `zinc-900`
- Muted: `zinc-500`
- Border: `zinc-200`
- Accent: `zinc-900` (inverted button)

**Dark mode (`class` strategy):**
- Background: `zinc-950`
- Foreground: `zinc-100`
- Muted: `zinc-400`
- Border: `zinc-800`

### 3.2 Typography

- **Body font:** Inter (variable, self-hosted) — weights 400, 500, 600, 700
- **Mono font:** Geist Mono — weights 400, 500
- **Font feature settings:** `"cv11", "ss01", "liga"` for Inter; `"liga" 0` for Geist Mono code blocks
- **Type scale:** Tailwind's `prose` plugin customized via `tailwind.config.mjs`:
  - `prose-zinc` color theme
  - Custom `h1`–`h3` sizes with tight leading
  - `prose-lg` base size for post body

### 3.3 Texture

- Subtle SVG grain overlay: `::before` pseudo-element on `<body>`, `opacity: 0.035`, `pointer-events: none`, `position: fixed`, `inset: 0`, `z-index: -1`
- Generated inline via `background-image: url("data:image/svg+xml,...")` — no external asset needed

### 3.4 Navbar (`Navbar.astro`)

- Sticky (`position: sticky; top: 0`)
- `backdrop-blur-md` + `bg-white/75 dark:bg-zinc-950/75`
- Thin `1px` bottom border: `border-zinc-200/50 dark:border-zinc-800/50`
- Content: Logo (name + title) left, nav links right (Blog, Projects, About)
- No hamburger on mobile — links collapse to icon-only or hidden, with a minimal toggle
- `z-index: 50`

### 3.5 Footer (`Footer.astro`)

- Two-line: name + tagline | social icons (LinkedIn, GitHub, Twitter/X)
- Copyright line: `© {year} Dr. Afnizanfaizal. All rights reserved.`
- Top border: `border-zinc-200 dark:border-zinc-800`
- Padding: `py-8`

---

## 4. Content Architecture

### 4.1 Content Collections (`src/content/config.ts`)

**Blog schema:**
```ts
{
  title: z.string(),
  pubDate: z.coerce.date(),
  updatedDate: z.coerce.date().optional(),
  description: z.string(),
  slug: z.string().optional(),          // overrides auto-slug if present
  tags: z.array(z.string()).default([]),
  draft: z.boolean().default(false),
  heroImage: z.string().optional(),
  featured: z.boolean().default(false),
}
```

**Projects schema:**
```ts
{
  title: z.string(),
  description: z.string(),
  tags: z.array(z.string()),
  status: z.enum(['active', 'completed', 'archived']),
  link: z.string().url().optional(),
  pubDate: z.coerce.date(),
}
```

### 4.2 `PostLayout.astro`

Receives a `CollectionEntry<'blog'>` as a prop. Renders:

1. **Reading time** — computed from word count: `Math.ceil(wordCount / 200)` minutes. Displayed in post header.
2. **Table of Contents** — extracted from headings (h2, h3) via `rehype-toc` or manual extraction from rendered content. Sticky on desktop (`position: sticky; top: 80px`). Collapsed to a dropdown on mobile.
3. **Reading progress bar** — thin `2px` bar at the very top of the viewport (fixed, above navbar). React island with `client:idle`. Reads `document.documentElement.scrollTop` / `scrollHeight`.

---

## 5. MDX Component Library

### 5.1 `<CodeBlock>` (`src/components/mdx/CodeBlock.astro`)

- Shiki for server-side syntax highlighting (configured in `astro.config.mjs`)
- Displays: language label (top-right), copy button (top-right, shows "Copied!" for 2s)
- Theme: `github-dark-default` (dark) / `github-light-default` (light), respect `prefers-color-scheme`
- Copy button: pure client-side JS inline `<script>`, no React needed

### 5.2 `<Callout>` (`src/components/mdx/Callout.astro`)

Variants: `info` (blue), `tip` (green), `warning` (amber), `danger` (red)

- Glassmorphism style: `backdrop-blur-sm`, `bg-{color}-50/50 dark:bg-{color}-950/30`, `border border-{color}-200 dark:border-{color}-800/50`
- Icon (SVG) + bold title + slot content
- Props: `type: 'info' | 'tip' | 'warning' | 'danger'`, `title?: string`

### 5.3 `<ZoomImage>` (`src/components/mdx/ZoomImage.astro`)

- Wraps `<img>` with `medium-zoom` initialization
- `medium-zoom` loaded as a tiny client-side script (`client:load` on a wrapper island or inline `<script>`)
- Props: `src`, `alt`, `caption?`

---

## 6. Admin Editor (`/admin/editor`)

### 6.1 Protection

- Astro middleware (`src/middleware.ts`) checks `Authorization` header or a session cookie against `process.env.ADMIN_PASSWORD`
- Redirects to `/admin/login` if unauthorized
- Simple password-based — no OAuth needed for a personal blog

### 6.2 Editor (`src/components/react/MDXEditor.tsx`)

- `@mdxeditor/editor` with plugins: `headingsPlugin`, `listsPlugin`, `quotePlugin`, `codeBlockPlugin` (with Shiki), `markdownShortcutPlugin`, `frontmatterPlugin`
- Custom component preview for `<Callout>` and `<ZoomImage>` via MDXEditor's JSX component support
- File save: posts to an Astro API endpoint `POST /api/save-post` which writes to `src/content/blog/` (dev only — not available in production build)
- `client:only="react"` directive — never SSR'd

---

## 7. Firebase Integration

### 7.1 `src/lib/firebase.ts`

- Initializes Firebase client SDK with env vars: `PUBLIC_FIREBASE_API_KEY`, `PUBLIC_FIREBASE_PROJECT_ID`, etc.
- Exports: `db` (Firestore instance), `getPostViews(slug)`, `incrementPostViews(slug)`
- Firestore schema: `posts/{slug}` → `{ views: number, likes: number }`

### 7.2 `ViewCounter.tsx` (`src/components/react/ViewCounter.tsx`)

- React island, `client:idle` — loads after main content, never blocks LCP
- On mount: calls `incrementPostViews(slug)` then reads `views` from Firestore
- Displays: `{n} views` — skeleton while loading
- Error handling: silently hides on Firestore error (no broken UI)

---

## 8. Migration Script (`scripts/migrate.js`)

**Runtime:** Node.js 20+
**Dependencies:** `firebase-admin`, `turndown`, `js-yaml`, `fs/promises`

**Algorithm:**
1. Initialize `firebase-admin` with service account JSON (path from `GOOGLE_APPLICATION_CREDENTIALS` env var)
2. Query all documents from `posts` collection (ordered by `createdAt`)
3. For each doc:
   - Convert `content` (HTML string) → Markdown via Turndown
   - Build YAML frontmatter from `title`, `createdAt` (→ `pubDate`), `slug`, `tags`, `description`
   - Write to `src/content/blog/{slug}.mdx`
4. Log: `✓ Migrated {n} posts`

**Turndown config:** headings, code blocks, links, images preserved. Custom rule for Firebase Storage image URLs → relative path rewriting (optional flag `--rewrite-images`).

---

## 9. Performance Targets

- **Lighthouse score:** 100/100/100/100 (Perf/Access/Best Practices/SEO) on static pages
- **LCP:** < 1.2s (self-hosted fonts, no layout shift)
- **No CLS:** fonts preloaded, image dimensions always explicit
- **Firebase:** loaded lazily, never blocks paint
- **Bundle:** zero JS on static pages except progress bar island (~1KB)

---

## 10. Out of Scope

- Comments system (can add Giscus later)
- Newsletter integration (can add later)
- Multi-author support
- OAuth-based admin (password env var is sufficient for solo blog)
- Search (can add Pagefind post-launch)
