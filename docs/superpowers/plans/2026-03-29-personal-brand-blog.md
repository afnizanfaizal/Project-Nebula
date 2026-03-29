# Personal Brand Blog — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a production-grade personal brand blog for Dr. Afnizanfaizal using Astro 5, Tailwind CSS v3, Shadcn/UI, MDX, and Firebase — a neo-minimalist "WordPress Killer".

**Architecture:** Astro SSG with React islands for interactivity. Content via Astro Content Collections (MDX). Dynamic data (views) loaded client-side via Firebase Firestore. Admin editor is a protected React island, dev-only for writing. Migration script converts existing Firestore posts to MDX files.

**Tech Stack:** Astro 5, React 18, Tailwind CSS v3, Shadcn/UI, MDX, Firebase v10, @mdxeditor/editor, @shikijs/rehype, medium-zoom, firebase-admin, turndown, Vitest.

---

## File Map

| File | Responsibility |
|---|---|
| `astro.config.mjs` | Astro integrations, MDX config, Shiki rehype plugin |
| `tailwind.config.mjs` | Design tokens, dark mode, typography plugin |
| `src/styles/global.css` | Tailwind directives, CSS variables, grain texture, font-face |
| `src/content/config.ts` | Blog + projects collection schemas |
| `src/lib/utils.ts` | `cn()` helper, `getReadingTime()` |
| `src/layouts/Layout.astro` | Base shell: Navbar + Footer + dark mode script |
| `src/components/Navbar.astro` | Frosted-glass sticky navbar |
| `src/components/Footer.astro` | Minimal signature footer |
| `src/components/ThemeToggle.astro` | Sun/moon toggle, reads/writes localStorage |
| `src/components/TableOfContents.astro` | Sticky TOC from headings array |
| `src/components/mdx/CodeBlock.astro` | Shiki code block + copy button |
| `src/components/mdx/Callout.astro` | info/tip/warning/danger callout box |
| `src/components/mdx/ZoomImage.astro` | Image with medium-zoom |
| `src/layouts/PostLayout.astro` | Blog post shell: TOC + progress bar + reading time |
| `src/pages/index.astro` | Home page: hero + featured posts |
| `src/pages/blog/index.astro` | Blog listing page |
| `src/pages/blog/[slug].astro` | Individual blog post page |
| `src/pages/projects/index.astro` | Projects listing page |
| `src/pages/projects/[slug].astro` | Individual project page |
| `src/lib/firebase.ts` | Firebase client SDK init + Firestore helpers |
| `src/components/react/ViewCounter.tsx` | React island: fetch/increment Firestore view count |
| `src/middleware.ts` | Protect `/admin/*` routes with env-var password |
| `src/pages/admin/index.astro` | Admin login page |
| `src/pages/admin/editor.astro` | MDX editor shell |
| `src/components/react/MDXEditor.tsx` | @mdxeditor/editor React island |
| `src/pages/api/save-post.ts` | API endpoint to write MDX file to disk (dev only) |
| `scripts/migrate.js` | Firestore → MDX migration script |
| `src/lib/utils.test.ts` | Unit tests for `getReadingTime()` |
| `.env.example` | Template for required env vars |

---

## Task 1: Project Scaffold

**Files:**
- Create: `package.json` (via Astro CLI)
- Create: `astro.config.mjs`
- Create: `tsconfig.json`
- Create: `.env.example`
- Create: `.gitignore`

- [ ] **Step 1.1: Scaffold Astro project**

```bash
cd "/Users/afnizanfaizal/Desktop/Projects/New Blog"
npm create astro@latest . -- --template minimal --typescript strict --no-install --no-git
```

Expected output: Files created including `astro.config.mjs`, `tsconfig.json`, `package.json`.

- [ ] **Step 1.2: Install all dependencies**

```bash
npm install \
  @astrojs/react @astrojs/tailwind @astrojs/mdx \
  @astrojs/check typescript \
  react react-dom \
  @types/react @types/react-dom \
  tailwindcss @tailwindcss/typography \
  @shikijs/rehype shiki \
  firebase \
  medium-zoom \
  @mdxeditor/editor \
  clsx tailwind-merge \
  @fontsource-variable/inter geist
```

```bash
npm install --save-dev \
  vitest \
  firebase-admin \
  turndown \
  @types/turndown \
  js-yaml \
  @types/js-yaml
```

Expected: `node_modules/` populated, no peer dependency errors.

- [ ] **Step 1.3: Add Astro integrations to astro.config.mjs**

Replace the contents of `astro.config.mjs` with:

```js
// astro.config.mjs
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import react from '@astrojs/react';
import mdx from '@astrojs/mdx';
import { rehypeShiki } from '@shikijs/rehype';

export default defineConfig({
  integrations: [
    tailwind({ applyBaseStyles: false }),
    react(),
    mdx(),
  ],
  markdown: {
    syntaxHighlight: false,
    rehypePlugins: [
      [rehypeShiki, {
        themes: {
          light: 'github-light',
          dark: 'github-dark-default',
        },
      }],
    ],
  },
});
```

- [ ] **Step 1.4: Create .env.example**

```bash
cat > .env.example << 'EOF'
# Firebase client (public — safe to expose)
PUBLIC_FIREBASE_API_KEY=
PUBLIC_FIREBASE_AUTH_DOMAIN=
PUBLIC_FIREBASE_PROJECT_ID=
PUBLIC_FIREBASE_STORAGE_BUCKET=
PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
PUBLIC_FIREBASE_APP_ID=

# Admin editor protection
ADMIN_PASSWORD=changeme

# Migration script only (server-side, never expose)
GOOGLE_APPLICATION_CREDENTIALS=./service-account.json
EOF
```

- [ ] **Step 1.5: Copy .env.example to .env and fill in Firebase values**

```bash
cp .env.example .env
```

Open `.env` and fill in the Firebase project values from your existing Firebase console.

- [ ] **Step 1.6: Verify Astro runs**

```bash
npm run dev
```

Expected: Dev server starts at `http://localhost:4321`. No errors in terminal.

- [ ] **Step 1.7: Commit scaffold**

```bash
git init
echo "node_modules/\n.env\n.astro/\ndist/\n.superpowers/\nservice-account.json" > .gitignore
git add -A
git commit -m "feat: scaffold Astro 5 project with React, Tailwind, MDX integrations"
```

---

## Task 2: Design System — Tailwind + Fonts + CSS Variables

**Files:**
- Create: `tailwind.config.mjs`
- Create: `src/styles/global.css`

- [ ] **Step 2.1: Write Tailwind config**

Create `tailwind.config.mjs`:

```js
// tailwind.config.mjs
import defaultTheme from 'tailwindcss/defaultTheme';
import typography from '@tailwindcss/typography';

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter Variable', ...defaultTheme.fontFamily.sans],
        mono: ['Geist Mono', ...defaultTheme.fontFamily.mono],
      },
      typography: (theme) => ({
        zinc: {
          css: {
            '--tw-prose-body': theme('colors.zinc[700]'),
            '--tw-prose-headings': theme('colors.zinc[900]'),
            '--tw-prose-code': theme('colors.zinc[900]'),
            '--tw-prose-pre-bg': 'transparent',
            '--tw-prose-invert-body': theme('colors.zinc[300]'),
            '--tw-prose-invert-headings': theme('colors.zinc[100]'),
            '--tw-prose-invert-code': theme('colors.zinc[100]'),
            'code::before': { content: '""' },
            'code::after': { content: '""' },
            'h1, h2, h3, h4': {
              fontWeight: '700',
              letterSpacing: '-0.025em',
            },
          },
        },
      }),
    },
  },
  plugins: [typography],
};
```

- [ ] **Step 2.2: Write global CSS**

Create `src/styles/global.css`:

```css
/* src/styles/global.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Inter Variable font */
@import '@fontsource-variable/inter/index.css';
/* Geist Mono */
@import 'geist/dist/mono.css';

@layer base {
  :root {
    --font-sans: 'Inter Variable', sans-serif;
    --font-mono: 'Geist Mono', monospace;
  }

  html {
    font-feature-settings: 'cv11', 'ss01', 'liga';
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  /* Grain texture overlay */
  body::before {
    content: '';
    position: fixed;
    inset: 0;
    z-index: -1;
    pointer-events: none;
    opacity: 0.035;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)'/%3E%3C/svg%3E");
    background-repeat: repeat;
    background-size: 300px 300px;
  }

  /* Scrollbar styling */
  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { @apply bg-transparent; }
  ::-webkit-scrollbar-thumb { @apply bg-zinc-300 dark:bg-zinc-700 rounded-full; }
}

@layer utilities {
  .font-mono {
    font-feature-settings: 'liga' 0, 'calt' 0;
  }
}
```

- [ ] **Step 2.3: Verify Tailwind compiles**

```bash
npm run dev
```

Expected: Server runs, no CSS compilation errors.

- [ ] **Step 2.4: Commit design system**

```bash
git add tailwind.config.mjs src/styles/global.css
git commit -m "feat: add design system — Tailwind config, Inter/Geist fonts, grain texture"
```

---

## Task 3: Utility Functions + Tests

**Files:**
- Create: `src/lib/utils.ts`
- Create: `src/lib/utils.test.ts`
- Create: `vitest.config.ts`

- [ ] **Step 3.1: Write failing tests first**

Create `src/lib/utils.test.ts`:

```ts
// src/lib/utils.test.ts
import { describe, it, expect } from 'vitest';
import { getReadingTime, cn } from './utils';

describe('getReadingTime', () => {
  it('returns 1 for empty string', () => {
    expect(getReadingTime('')).toBe(1);
  });

  it('returns 1 for fewer than 200 words', () => {
    const text = 'word '.repeat(100);
    expect(getReadingTime(text)).toBe(1);
  });

  it('returns 2 for 201-400 words', () => {
    const text = 'word '.repeat(250);
    expect(getReadingTime(text)).toBe(2);
  });

  it('returns 5 for 1000 words', () => {
    const text = 'word '.repeat(1000);
    expect(getReadingTime(text)).toBe(5);
  });
});

describe('cn', () => {
  it('merges class names', () => {
    expect(cn('a', 'b')).toBe('a b');
  });

  it('resolves Tailwind conflicts — last class wins', () => {
    expect(cn('p-2', 'p-4')).toBe('p-4');
  });

  it('ignores falsy values', () => {
    expect(cn('a', false && 'b', undefined, null, 'c')).toBe('a c');
  });
});
```

- [ ] **Step 3.2: Create vitest config**

Create `vitest.config.ts`:

```ts
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
  },
});
```

- [ ] **Step 3.3: Run tests — verify they fail**

```bash
npx vitest run src/lib/utils.test.ts
```

Expected: FAIL — `Cannot find module './utils'`

- [ ] **Step 3.4: Implement utils.ts**

Create `src/lib/utils.ts`:

```ts
// src/lib/utils.ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Estimates reading time in minutes.
 * Assumes 200 words per minute reading speed.
 */
export function getReadingTime(content: string): number {
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}
```

- [ ] **Step 3.5: Run tests — verify they pass**

```bash
npx vitest run src/lib/utils.test.ts
```

Expected: All 7 tests PASS.

- [ ] **Step 3.6: Commit**

```bash
git add src/lib/utils.ts src/lib/utils.test.ts vitest.config.ts
git commit -m "feat: add cn() and getReadingTime() utilities with tests"
```

---

## Task 4: Content Collections

**Files:**
- Create: `src/content/config.ts`
- Create: `src/content/blog/hello-world.mdx`
- Create: `src/content/projects/ai-inference-engine.mdx`

- [ ] **Step 4.1: Create content collection schemas**

Create `src/content/config.ts`:

```ts
// src/content/config.ts
import { defineCollection, z } from 'astro:content';

const blog = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    description: z.string(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
    heroImage: z.string().optional(),
    featured: z.boolean().default(false),
  }),
});

const projects = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    tags: z.array(z.string()),
    status: z.enum(['active', 'completed', 'archived']),
    link: z.string().url().optional(),
    pubDate: z.coerce.date(),
  }),
});

export const collections = { blog, projects };
```

- [ ] **Step 4.2: Create sample blog post**

Create `src/content/blog/hello-world.mdx`:

```mdx
---
title: "Hello World — Building in Public with AI"
pubDate: 2026-03-29
description: "The first post on my new blog. Why I rebuilt my site with Astro and what I'm planning to share here."
tags: ["ai", "personal", "web-development"]
featured: true
---

Welcome to my new blog. This site is built with **Astro 5**, **Tailwind CSS**, and **MDX**.

## Why I Rebuilt

I needed a platform that matches my work: fast, precise, and opinionated.

## What to Expect

- Deep dives into AI systems
- Research notes and paper breakdowns
- Engineering decisions and trade-offs

<Callout type="tip" title="Follow Along">
  I'll be sharing everything as I build — including this blog itself.
</Callout>

## A Code Example

```python
def fibonacci(n: int) -> int:
    if n <= 1:
        return n
    return fibonacci(n - 1) + fibonacci(n - 2)
```

Stay tuned.
```

- [ ] **Step 4.3: Create sample project**

Create `src/content/projects/ai-inference-engine.mdx`:

```mdx
---
title: "AI Inference Engine"
description: "A high-performance inference system for large language models, optimized for edge deployment."
tags: ["ai", "python", "systems"]
status: "active"
pubDate: 2026-01-15
---

A research project exploring efficient inference for transformer models at the edge.

## Overview

This project explores quantization, pruning, and speculative decoding to enable LLM inference on resource-constrained devices.
```

- [ ] **Step 4.4: Verify content collections build**

```bash
npm run dev
```

Expected: Dev server starts. Navigate to `http://localhost:4321`. No content collection errors in terminal.

- [ ] **Step 4.5: Commit**

```bash
git add src/content/
git commit -m "feat: add content collections for blog and projects with sample content"
```

---

## Task 5: Base Layout — Navbar, Footer, Layout.astro

**Files:**
- Create: `src/components/Navbar.astro`
- Create: `src/components/ThemeToggle.astro`
- Create: `src/components/Footer.astro`
- Create: `src/layouts/Layout.astro`

- [ ] **Step 5.1: Create ThemeToggle component**

Create `src/components/ThemeToggle.astro`:

```astro
---
// src/components/ThemeToggle.astro
---
<button
  id="theme-toggle"
  aria-label="Toggle dark mode"
  class="p-2 rounded-md text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
>
  <!-- Sun icon (shown in dark mode) -->
  <svg id="icon-sun" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="hidden dark:block">
    <circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>
  </svg>
  <!-- Moon icon (shown in light mode) -->
  <svg id="icon-moon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="block dark:hidden">
    <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>
  </svg>
</button>

<script>
  const toggle = document.getElementById('theme-toggle');
  toggle?.addEventListener('click', () => {
    const isDark = document.documentElement.classList.toggle('dark');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  });
</script>
```

- [ ] **Step 5.2: Create Navbar component**

Create `src/components/Navbar.astro`:

```astro
---
// src/components/Navbar.astro
import ThemeToggle from './ThemeToggle.astro';

const navLinks = [
  { href: '/blog', label: 'Blog' },
  { href: '/projects', label: 'Projects' },
  { href: '/#about', label: 'About' },
];

const currentPath = Astro.url.pathname;
---
<header class="sticky top-0 z-50 w-full border-b border-zinc-200/50 dark:border-zinc-800/50 bg-white/75 dark:bg-zinc-950/75 backdrop-blur-md">
  <nav class="mx-auto max-w-3xl px-6 flex h-14 items-center justify-between">
    <a href="/" class="flex items-center gap-2 group">
      <span class="font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight group-hover:text-zinc-600 dark:group-hover:text-zinc-400 transition-colors">
        Dr. Afnizanfaizal
      </span>
      <span class="hidden sm:inline text-zinc-400 dark:text-zinc-600 text-sm font-normal">
        / AI & Tech
      </span>
    </a>

    <div class="flex items-center gap-1">
      {navLinks.map(({ href, label }) => (
        <a
          href={href}
          class={[
            'px-3 py-1.5 text-sm rounded-md transition-colors',
            currentPath.startsWith(href)
              ? 'text-zinc-900 dark:text-zinc-100 font-medium bg-zinc-100 dark:bg-zinc-800'
              : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800',
          ].filter(Boolean).join(' ')}
        >
          {label}
        </a>
      ))}
      <div class="ml-2 pl-2 border-l border-zinc-200 dark:border-zinc-800">
        <ThemeToggle />
      </div>
    </div>
  </nav>
</header>
```

- [ ] **Step 5.3: Create Footer component**

Create `src/components/Footer.astro`:

```astro
---
// src/components/Footer.astro
const year = new Date().getFullYear();
---
<footer class="border-t border-zinc-200 dark:border-zinc-800 mt-24">
  <div class="mx-auto max-w-3xl px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
    <div class="text-center sm:text-left">
      <p class="text-sm font-medium text-zinc-900 dark:text-zinc-100">Dr. Afnizanfaizal</p>
      <p class="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">AI Innovation & Tech Leader</p>
    </div>

    <div class="flex items-center gap-4">
      <a href="https://github.com" target="_blank" rel="noopener noreferrer" aria-label="GitHub" class="text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12Z"/>
        </svg>
      </a>
      <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" class="text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
        </svg>
      </a>
      <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" aria-label="Twitter / X" class="text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.213 5.567zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
      </a>
    </div>

    <p class="text-xs text-zinc-400 dark:text-zinc-600">
      © {year} Dr. Afnizanfaizal
    </p>
  </div>
</footer>
```

- [ ] **Step 5.4: Create base Layout.astro**

Create `src/layouts/Layout.astro`:

```astro
---
// src/layouts/Layout.astro
import '../styles/global.css';
import Navbar from '../components/Navbar.astro';
import Footer from '../components/Footer.astro';

interface Props {
  title: string;
  description?: string;
  image?: string;
}

const {
  title,
  description = 'AI Innovation & Tech Leadership — Dr. Afnizanfaizal',
  image = '/og-default.png',
} = Astro.props;

const canonicalURL = new URL(Astro.url.pathname, Astro.site);
---
<!doctype html>
<html lang="en" class="scroll-smooth">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <link rel="canonical" href={canonicalURL} />
    <meta name="description" content={description} />

    <!-- Open Graph -->
    <meta property="og:title" content={title} />
    <meta property="og:description" content={description} />
    <meta property="og:image" content={image} />
    <meta property="og:type" content="website" />

    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content={title} />
    <meta name="twitter:description" content={description} />
    <meta name="twitter:image" content={image} />

    <title>{title}</title>

    <!-- Prevent flash of unstyled theme -->
    <script is:inline>
      const theme = localStorage.getItem('theme') ??
        (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
      document.documentElement.classList.toggle('dark', theme === 'dark');
    </script>
  </head>
  <body class="bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 min-h-screen flex flex-col font-sans">
    <Navbar />
    <main class="flex-1">
      <slot />
    </main>
    <Footer />
  </body>
</html>
```

- [ ] **Step 5.5: Update index page to use Layout**

Replace `src/pages/index.astro` with:

```astro
---
import Layout from '../layouts/Layout.astro';
---
<Layout title="Dr. Afnizanfaizal — AI Innovation & Tech Leader">
  <div class="mx-auto max-w-3xl px-6 py-24">
    <h1 class="text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
      Dr. Afnizanfaizal
    </h1>
    <p class="mt-4 text-lg text-zinc-500 dark:text-zinc-400">
      AI Innovation & Tech Leader
    </p>
  </div>
</Layout>
```

- [ ] **Step 5.6: Verify in browser**

```bash
npm run dev
```

Open `http://localhost:4321`. Expected: Navbar with frosted glass effect, footer at bottom, dark mode toggle works, theme persists on refresh.

- [ ] **Step 5.7: Commit**

```bash
git add src/layouts/ src/components/Navbar.astro src/components/Footer.astro src/components/ThemeToggle.astro src/pages/index.astro
git commit -m "feat: add base Layout with frosted-glass Navbar, Footer, and dark mode toggle"
```

---

## Task 6: MDX Component Library

**Files:**
- Create: `src/components/mdx/CodeBlock.astro`
- Create: `src/components/mdx/Callout.astro`
- Create: `src/components/mdx/ZoomImage.astro`

- [ ] **Step 6.1: Create CodeBlock component**

Create `src/components/mdx/CodeBlock.astro`:

```astro
---
// src/components/mdx/CodeBlock.astro
// Wraps Shiki-highlighted <pre> with a copy button and language label.
// Use in astro.config.mjs by passing as MDX component for 'pre'.
interface Props {
  class?: string;
  'data-language'?: string;
  [key: string]: unknown;
}

const { class: className, 'data-language': lang, ...rest } = Astro.props;
---
<div class="relative group not-prose my-6">
  {lang && (
    <span class="absolute top-3 right-12 text-xs text-zinc-400 dark:text-zinc-500 font-mono select-none z-10">
      {lang}
    </span>
  )}

  <button
    class="copy-btn absolute top-2 right-2 z-10 p-1.5 rounded-md
      text-zinc-400 dark:text-zinc-500
      hover:text-zinc-700 dark:hover:text-zinc-300
      hover:bg-zinc-100 dark:hover:bg-zinc-800
      opacity-0 group-hover:opacity-100 transition-all"
    aria-label="Copy code"
  >
    <svg class="copy-icon" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
    </svg>
    <svg class="check-icon hidden" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  </button>

  <pre class={['rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-x-auto text-sm', className].filter(Boolean).join(' ')} {...rest}>
    <slot />
  </pre>
</div>

<script>
  document.querySelectorAll<HTMLButtonElement>('.copy-btn').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const pre = btn.nextElementSibling as HTMLPreElement;
      const code = pre?.querySelector('code')?.innerText ?? '';
      await navigator.clipboard.writeText(code);

      const copyIcon = btn.querySelector<SVGElement>('.copy-icon')!;
      const checkIcon = btn.querySelector<SVGElement>('.check-icon')!;
      copyIcon.classList.add('hidden');
      checkIcon.classList.remove('hidden');

      setTimeout(() => {
        copyIcon.classList.remove('hidden');
        checkIcon.classList.add('hidden');
      }, 2000);
    });
  });
</script>
```

- [ ] **Step 6.2: Create Callout component**

Create `src/components/mdx/Callout.astro`:

```astro
---
// src/components/mdx/Callout.astro
interface Props {
  type?: 'info' | 'tip' | 'warning' | 'danger';
  title?: string;
}

const { type = 'info', title } = Astro.props;

const config = {
  info:    { icon: 'ℹ', color: 'blue',   bg: 'bg-blue-50/50   dark:bg-blue-950/30',  border: 'border-blue-200   dark:border-blue-800/50',  text: 'text-blue-900   dark:text-blue-100'  },
  tip:     { icon: '✦', color: 'green',  bg: 'bg-green-50/50  dark:bg-green-950/30', border: 'border-green-200  dark:border-green-800/50', text: 'text-green-900  dark:text-green-100' },
  warning: { icon: '⚠', color: 'amber',  bg: 'bg-amber-50/50  dark:bg-amber-950/30', border: 'border-amber-200  dark:border-amber-800/50', text: 'text-amber-900  dark:text-amber-100' },
  danger:  { icon: '✕', color: 'red',    bg: 'bg-red-50/50    dark:bg-red-950/30',   border: 'border-red-200    dark:border-red-800/50',   text: 'text-red-900    dark:text-red-100'   },
};

const { icon, bg, border, text } = config[type];
---
<div class={`not-prose my-6 flex gap-3 rounded-lg border p-4 backdrop-blur-sm ${bg} ${border}`}>
  <span class={`mt-0.5 shrink-0 text-base leading-none ${text}`} aria-hidden="true">{icon}</span>
  <div class="flex-1 min-w-0">
    {title && (
      <p class={`mb-1 text-sm font-semibold ${text}`}>{title}</p>
    )}
    <div class={`text-sm leading-relaxed ${text} [&>p]:m-0`}>
      <slot />
    </div>
  </div>
</div>
```

- [ ] **Step 6.3: Create ZoomImage component**

Create `src/components/mdx/ZoomImage.astro`:

```astro
---
// src/components/mdx/ZoomImage.astro
interface Props {
  src: string;
  alt: string;
  caption?: string;
  width?: number;
  height?: number;
}

const { src, alt, caption, width, height } = Astro.props;
---
<figure class="not-prose my-8">
  <img
    src={src}
    alt={alt}
    width={width}
    height={height}
    class="zoom-image w-full rounded-lg border border-zinc-200 dark:border-zinc-800 cursor-zoom-in"
    loading="lazy"
    decoding="async"
  />
  {caption && (
    <figcaption class="mt-2 text-center text-xs text-zinc-500 dark:text-zinc-400">
      {caption}
    </figcaption>
  )}
</figure>

<script>
  import mediumZoom from 'medium-zoom';
  mediumZoom('.zoom-image', {
    background: 'rgba(0, 0, 0, 0.8)',
    margin: 24,
  });
</script>
```

- [ ] **Step 6.4: Register MDX components in astro.config.mjs**

The Shiki `rehype` plugin already handles `<pre>` wrapping. For MDX files, components like `<Callout>` and `<ZoomImage>` will be imported directly in each MDX file (or globally via the `[slug].astro` page). No config change needed at this step.

- [ ] **Step 6.5: Commit**

```bash
git add src/components/mdx/
git commit -m "feat: add MDX component library — CodeBlock, Callout, ZoomImage"
```

---

## Task 7: Post Layout — TOC, Reading Time, Progress Bar

**Files:**
- Create: `src/components/TableOfContents.astro`
- Create: `src/layouts/PostLayout.astro`

- [ ] **Step 7.1: Create TableOfContents component**

Create `src/components/TableOfContents.astro`:

```astro
---
// src/components/TableOfContents.astro
interface Heading {
  depth: number;
  slug: string;
  text: string;
}

interface Props {
  headings: Heading[];
}

const { headings } = Astro.props;
const toc = headings.filter((h) => h.depth === 2 || h.depth === 3);
---
{toc.length > 0 && (
  <nav class="toc" aria-label="Table of contents">
    <p class="mb-3 text-xs font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-600">
      On this page
    </p>
    <ol class="space-y-1.5 text-sm">
      {toc.map((heading) => (
        <li class={heading.depth === 3 ? 'pl-3' : ''}>
          <a
            href={`#${heading.slug}`}
            class="toc-link block text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors leading-snug py-0.5"
          >
            {heading.text}
          </a>
        </li>
      ))}
    </ol>
  </nav>
)}

<script>
  // Highlight active section as user scrolls
  const links = document.querySelectorAll<HTMLAnchorElement>('.toc-link');
  const headings = Array.from(document.querySelectorAll<HTMLHeadingElement>('h2[id], h3[id]'));

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          links.forEach((l) => l.classList.remove('text-zinc-900', 'dark:text-zinc-100', 'font-medium'));
          const active = document.querySelector<HTMLAnchorElement>(`.toc-link[href="#${entry.target.id}"]`);
          active?.classList.add('text-zinc-900', 'dark:text-zinc-100', 'font-medium');
        }
      }
    },
    { rootMargin: '-20% 0% -70% 0%' }
  );

  headings.forEach((h) => observer.observe(h));
</script>
```

- [ ] **Step 7.2: Create PostLayout.astro**

Create `src/layouts/PostLayout.astro`:

```astro
---
// src/layouts/PostLayout.astro
import type { CollectionEntry } from 'astro:content';
import Layout from './Layout.astro';
import TableOfContents from '../components/TableOfContents.astro';
import { getReadingTime } from '../lib/utils';

interface Props {
  entry: CollectionEntry<'blog'>;
  headings: { depth: number; slug: string; text: string }[];
  minutesRead: number;
}

const { entry, headings, minutesRead } = Astro.props;
const { title, pubDate, updatedDate, description, tags } = entry.data;

const formattedDate = new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
}).format(pubDate);
---
<Layout title={`${title} — Dr. Afnizanfaizal`} description={description}>
  <!-- Reading progress bar -->
  <div
    id="progress-bar"
    class="fixed top-0 left-0 h-0.5 bg-zinc-900 dark:bg-zinc-100 z-[60] transition-none"
    style="width: 0%"
    aria-hidden="true"
  ></div>

  <div class="mx-auto max-w-5xl px-6 py-16">
    <div class="lg:grid lg:grid-cols-[1fr_220px] lg:gap-16">
      <!-- Main content -->
      <article>
        <!-- Post header -->
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
        </header>

        <!-- MDX content -->
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
```

- [ ] **Step 7.3: Commit**

```bash
git add src/layouts/PostLayout.astro src/components/TableOfContents.astro
git commit -m "feat: add PostLayout with sticky TOC, reading time, and scroll progress bar"
```

---

## Task 8: Blog & Project Pages

**Files:**
- Create: `src/pages/blog/index.astro`
- Create: `src/pages/blog/[slug].astro`
- Create: `src/pages/projects/index.astro`
- Create: `src/pages/projects/[slug].astro`
- Modify: `src/pages/index.astro`

- [ ] **Step 8.1: Create blog listing page**

Create `src/pages/blog/index.astro`:

```astro
---
import { getCollection } from 'astro:content';
import Layout from '../../layouts/Layout.astro';

const posts = (await getCollection('blog', ({ data }) => !data.draft))
  .sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
---
<Layout title="Blog — Dr. Afnizanfaizal" description="Thoughts on AI, systems, and technology.">
  <div class="mx-auto max-w-3xl px-6 py-16">
    <h1 class="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 mb-2">Blog</h1>
    <p class="text-zinc-500 dark:text-zinc-400 mb-12">
      Writing on AI, systems design, and technology leadership.
    </p>

    <div class="space-y-px">
      {posts.map((post) => (
        <a
          href={`/blog/${post.slug}`}
          class="group flex items-baseline justify-between gap-4 py-4 border-b border-zinc-100 dark:border-zinc-900 hover:border-zinc-200 dark:hover:border-zinc-800 transition-colors"
        >
          <div>
            <h2 class="text-base font-medium text-zinc-900 dark:text-zinc-100 group-hover:text-zinc-600 dark:group-hover:text-zinc-400 transition-colors leading-snug">
              {post.data.title}
            </h2>
            <p class="mt-1 text-sm text-zinc-500 dark:text-zinc-400 line-clamp-1">
              {post.data.description}
            </p>
          </div>
          <time
            datetime={post.data.pubDate.toISOString()}
            class="shrink-0 text-sm text-zinc-400 dark:text-zinc-600 tabular-nums"
          >
            {new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(post.data.pubDate)}
          </time>
        </a>
      ))}
    </div>
  </div>
</Layout>
```

- [ ] **Step 8.2: Create blog post page**

Create `src/pages/blog/[slug].astro`:

```astro
---
import { getCollection, render } from 'astro:content';
import PostLayout from '../../layouts/PostLayout.astro';
import CodeBlock from '../../components/mdx/CodeBlock.astro';
import Callout from '../../components/mdx/Callout.astro';
import ZoomImage from '../../components/mdx/ZoomImage.astro';
import { getReadingTime } from '../../lib/utils';

export async function getStaticPaths() {
  const posts = await getCollection('blog', ({ data }) => !data.draft);
  return posts.map((entry) => ({
    params: { slug: entry.slug },
    props: { entry },
  }));
}

const { entry } = Astro.props;
const { Content, headings } = await render(entry);
const minutesRead = getReadingTime(entry.body ?? '');
---
<PostLayout entry={entry} headings={headings} minutesRead={minutesRead}>
  <Content components={{ pre: CodeBlock, Callout, ZoomImage }} />
</PostLayout>
```

- [ ] **Step 8.3: Create projects listing page**

Create `src/pages/projects/index.astro`:

```astro
---
import { getCollection } from 'astro:content';
import Layout from '../../layouts/Layout.astro';

const projects = (await getCollection('projects'))
  .sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());

const statusLabel: Record<string, string> = {
  active: 'Active',
  completed: 'Completed',
  archived: 'Archived',
};

const statusColor: Record<string, string> = {
  active: 'text-green-600 dark:text-green-400',
  completed: 'text-zinc-500 dark:text-zinc-400',
  archived: 'text-zinc-400 dark:text-zinc-600',
};
---
<Layout title="Projects — Dr. Afnizanfaizal" description="Research and engineering projects.">
  <div class="mx-auto max-w-3xl px-6 py-16">
    <h1 class="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 mb-2">Projects</h1>
    <p class="text-zinc-500 dark:text-zinc-400 mb-12">Selected research and engineering work.</p>

    <div class="space-y-8">
      {projects.map((project) => (
        <a
          href={`/projects/${project.slug}`}
          class="group block p-6 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors"
        >
          <div class="flex items-start justify-between gap-4 mb-2">
            <h2 class="font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-zinc-600 dark:group-hover:text-zinc-400 transition-colors">
              {project.data.title}
            </h2>
            <span class={`text-xs font-medium shrink-0 ${statusColor[project.data.status]}`}>
              {statusLabel[project.data.status]}
            </span>
          </div>
          <p class="text-sm text-zinc-500 dark:text-zinc-400 mb-3">{project.data.description}</p>
          <div class="flex flex-wrap gap-2">
            {project.data.tags.map((tag) => (
              <span class="text-xs font-medium text-zinc-400 dark:text-zinc-600 uppercase tracking-wider">
                {tag}
              </span>
            ))}
          </div>
        </a>
      ))}
    </div>
  </div>
</Layout>
```

- [ ] **Step 8.4: Create project post page**

Create `src/pages/projects/[slug].astro`:

```astro
---
import { getCollection, render } from 'astro:content';
import Layout from '../../layouts/Layout.astro';
import CodeBlock from '../../components/mdx/CodeBlock.astro';
import Callout from '../../components/mdx/Callout.astro';
import ZoomImage from '../../components/mdx/ZoomImage.astro';

export async function getStaticPaths() {
  const projects = await getCollection('projects');
  return projects.map((entry) => ({
    params: { slug: entry.slug },
    props: { entry },
  }));
}

const { entry } = Astro.props;
const { Content } = await render(entry);
const { title, description, tags, status, link } = entry.data;
---
<Layout title={`${title} — Dr. Afnizanfaizal`} description={description}>
  <div class="mx-auto max-w-3xl px-6 py-16">
    <header class="mb-10">
      <div class="flex flex-wrap gap-2 mb-4">
        {tags.map((tag) => (
          <span class="text-xs font-medium uppercase tracking-widest text-zinc-500 dark:text-zinc-400">{tag}</span>
        ))}
      </div>
      <h1 class="text-3xl sm:text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">{title}</h1>
      <p class="mt-3 text-lg text-zinc-500 dark:text-zinc-400">{description}</p>
      {link && (
        <a href={link} target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1.5 mt-4 text-sm font-medium text-zinc-900 dark:text-zinc-100 underline underline-offset-4 hover:text-zinc-600 transition-colors">
          View Project →
        </a>
      )}
    </header>
    <div class="prose prose-zinc dark:prose-invert prose-lg max-w-none">
      <Content components={{ pre: CodeBlock, Callout, ZoomImage }} />
    </div>
  </div>
</Layout>
```

- [ ] **Step 8.5: Update home page with hero + featured posts**

Replace `src/pages/index.astro`:

```astro
---
import { getCollection } from 'astro:content';
import Layout from '../layouts/Layout.astro';

const featuredPosts = (await getCollection('blog', ({ data }) => !data.draft && data.featured))
  .sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf())
  .slice(0, 3);
---
<Layout title="Dr. Afnizanfaizal — AI Innovation & Tech Leader">
  <!-- Hero -->
  <section class="mx-auto max-w-3xl px-6 pt-24 pb-16">
    <div class="max-w-2xl">
      <p class="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-600 mb-4">
        AI Innovation · Tech Leadership · Research
      </p>
      <h1 class="text-4xl sm:text-5xl font-bold tracking-tight leading-[1.1] text-zinc-900 dark:text-zinc-100">
        Dr. Afnizanfaizal
      </h1>
      <p class="mt-5 text-xl text-zinc-500 dark:text-zinc-400 leading-relaxed max-w-xl">
        Building intelligent systems at the frontier of AI. Writing about research, engineering, and the future of technology.
      </p>
      <div class="mt-8 flex flex-wrap gap-3">
        <a href="/blog" class="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-sm font-medium hover:bg-zinc-700 dark:hover:bg-zinc-300 transition-colors">
          Read the Blog
        </a>
        <a href="/projects" class="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 text-sm font-medium hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors">
          View Projects
        </a>
      </div>
    </div>
  </section>

  <!-- Featured Posts -->
  {featuredPosts.length > 0 && (
    <section class="mx-auto max-w-3xl px-6 py-8 border-t border-zinc-100 dark:border-zinc-900" id="about">
      <h2 class="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-600 mb-6">
        Featured Writing
      </h2>
      <div class="space-y-px">
        {featuredPosts.map((post) => (
          <a href={`/blog/${post.slug}`} class="group flex items-baseline justify-between gap-4 py-4 border-b border-zinc-100 dark:border-zinc-900 hover:border-zinc-200 dark:hover:border-zinc-800 transition-colors">
            <h3 class="text-base font-medium text-zinc-900 dark:text-zinc-100 group-hover:text-zinc-600 dark:group-hover:text-zinc-400 transition-colors leading-snug">
              {post.data.title}
            </h3>
            <time datetime={post.data.pubDate.toISOString()} class="shrink-0 text-sm text-zinc-400 dark:text-zinc-600 tabular-nums">
              {new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric' }).format(post.data.pubDate)}
            </time>
          </a>
        ))}
      </div>
      <a href="/blog" class="inline-block mt-6 text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
        All posts →
      </a>
    </section>
  )}
</Layout>
```

- [ ] **Step 8.6: Verify build**

```bash
npm run build
```

Expected: Build completes with no errors. All pages generated.

- [ ] **Step 8.7: Commit**

```bash
git add src/pages/
git commit -m "feat: add blog and projects pages, home page hero with featured posts"
```

---

## Task 9: Firebase Integration

**Files:**
- Create: `src/lib/firebase.ts`
- Create: `src/components/react/ViewCounter.tsx`
- Modify: `src/pages/blog/[slug].astro`

- [ ] **Step 9.1: Create Firebase client utility**

Create `src/lib/firebase.ts`:

```ts
// src/lib/firebase.ts
import { initializeApp, getApps } from 'firebase/app';
import {
  getFirestore,
  doc,
  getDoc,
  updateDoc,
  setDoc,
  increment,
  type Firestore,
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.PUBLIC_FIREBASE_API_KEY,
  authDomain: import.meta.env.PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.PUBLIC_FIREBASE_APP_ID,
};

// Prevent re-initialization in dev hot reload
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const db: Firestore = getFirestore(app);

/**
 * Increment view count for a post and return the new total.
 * Creates the document if it doesn't exist.
 */
export async function incrementPostViews(slug: string): Promise<number> {
  const ref = doc(db, 'posts', slug);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    await setDoc(ref, { views: 1 });
    return 1;
  }

  await updateDoc(ref, { views: increment(1) });
  const updated = await getDoc(ref);
  return (updated.data()?.views as number) ?? 1;
}

/**
 * Get current view count without incrementing.
 */
export async function getPostViews(slug: string): Promise<number> {
  const ref = doc(db, 'posts', slug);
  const snap = await getDoc(ref);
  return snap.exists() ? ((snap.data().views as number) ?? 0) : 0;
}
```

- [ ] **Step 9.2: Create ViewCounter React island**

Create `src/components/react/ViewCounter.tsx`:

```tsx
// src/components/react/ViewCounter.tsx
import { useEffect, useState } from 'react';
import { incrementPostViews } from '../../lib/firebase';

interface Props {
  slug: string;
}

export default function ViewCounter({ slug }: Props) {
  const [views, setViews] = useState<number | null>(null);

  useEffect(() => {
    incrementPostViews(slug)
      .then(setViews)
      .catch(() => {
        // Silently fail — view counter is non-critical
      });
  }, [slug]);

  if (views === null) {
    return <span className="inline-block w-12 h-4 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse" aria-hidden="true" />;
  }

  return (
    <span className="text-sm text-zinc-500 dark:text-zinc-400">
      {views.toLocaleString()} views
    </span>
  );
}
```

- [ ] **Step 9.3: Add ViewCounter to blog post page**

Open `src/pages/blog/[slug].astro` and add the import + component after the other imports:

```astro
---
import { getCollection, render } from 'astro:content';
import PostLayout from '../../layouts/PostLayout.astro';
import CodeBlock from '../../components/mdx/CodeBlock.astro';
import Callout from '../../components/mdx/Callout.astro';
import ZoomImage from '../../components/mdx/ZoomImage.astro';
import ViewCounter from '../../components/react/ViewCounter';
import { getReadingTime } from '../../lib/utils';

export async function getStaticPaths() {
  const posts = await getCollection('blog', ({ data }) => !data.draft);
  return posts.map((entry) => ({
    params: { slug: entry.slug },
    props: { entry },
  }));
}

const { entry } = Astro.props;
const { Content, headings } = await render(entry);
const minutesRead = getReadingTime(entry.body ?? '');
---
<PostLayout entry={entry} headings={headings} minutesRead={minutesRead}>
  <div slot="after-meta">
    <ViewCounter slug={entry.slug} client:idle />
  </div>
  <Content components={{ pre: CodeBlock, Callout, ZoomImage }} />
</PostLayout>
```

- [ ] **Step 9.4: Add after-meta slot to PostLayout**

Open `src/layouts/PostLayout.astro` and add the slot after the reading time row:

Find this block in `PostLayout.astro`:
```astro
            <span>{minutesRead} min read</span>
```

Add a slot below it (still inside `<div class="mt-4 flex flex-wrap...">`)  after the closing `</div>` of the flex row:
```astro
          </div>
          <slot name="after-meta" />
        </header>
```

- [ ] **Step 9.5: Verify**

```bash
npm run dev
```

Open `http://localhost:4321/blog/hello-world`. Expected: View counter shows a skeleton pulse on load, then a view count after Firebase responds. No console errors (Firebase config errors are expected if .env isn't filled in yet).

- [ ] **Step 9.6: Commit**

```bash
git add src/lib/firebase.ts src/components/react/ViewCounter.tsx src/pages/blog/\[slug\].astro src/layouts/PostLayout.astro
git commit -m "feat: add Firebase Firestore view counter as React island (client:idle)"
```

---

## Task 10: Admin Editor

**Files:**
- Create: `src/middleware.ts`
- Create: `src/pages/admin/index.astro`
- Create: `src/pages/admin/editor.astro`
- Create: `src/components/react/MDXEditor.tsx`
- Create: `src/pages/api/save-post.ts`

- [ ] **Step 10.1: Create admin middleware**

Create `src/middleware.ts`:

```ts
// src/middleware.ts
import { defineMiddleware } from 'astro:middleware';

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;

  if (!pathname.startsWith('/admin')) {
    return next();
  }

  // Allow the login page itself
  if (pathname === '/admin' || pathname === '/admin/') {
    return next();
  }

  const cookie = context.cookies.get('admin_session');
  if (cookie?.value === import.meta.env.ADMIN_PASSWORD) {
    return next();
  }

  return context.redirect('/admin');
});
```

- [ ] **Step 10.2: Create admin login page**

Create `src/pages/admin/index.astro`:

```astro
---
// src/pages/admin/index.astro
import Layout from '../../layouts/Layout.astro';

if (Astro.request.method === 'POST') {
  const data = await Astro.request.formData();
  const password = data.get('password');

  if (password === import.meta.env.ADMIN_PASSWORD) {
    Astro.cookies.set('admin_session', String(password), {
      path: '/',
      httpOnly: true,
      secure: import.meta.env.PROD,
      sameSite: 'strict',
      maxAge: 60 * 60 * 24, // 24 hours
    });
    return Astro.redirect('/admin/editor');
  }
}
---
<Layout title="Admin — Dr. Afnizanfaizal">
  <div class="mx-auto max-w-sm px-6 py-24">
    <h1 class="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 mb-8">Admin</h1>
    <form method="POST" class="space-y-4">
      <div>
        <label for="password" class="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
          Password
        </label>
        <input
          type="password"
          id="password"
          name="password"
          required
          class="w-full px-3 py-2 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100"
        />
      </div>
      <button type="submit" class="w-full px-4 py-2 rounded-md bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-sm font-medium hover:bg-zinc-700 dark:hover:bg-zinc-300 transition-colors">
        Enter
      </button>
    </form>
  </div>
</Layout>
```

**Note:** The admin login form requires Astro server mode (SSR). Add `output: 'hybrid'` to `astro.config.mjs` and add `export const prerender = false;` to the admin pages.

- [ ] **Step 10.3: Enable hybrid rendering for admin pages**

In `astro.config.mjs`, add the `output` option:

```js
export default defineConfig({
  output: 'hybrid',   // ← add this
  integrations: [
    tailwind({ applyBaseStyles: false }),
    react(),
    mdx(),
  ],
  // ...rest unchanged
});
```

Add to top of `src/pages/admin/index.astro` (inside the frontmatter):
```ts
export const prerender = false;
```

- [ ] **Step 10.4: Create MDXEditor React component**

Create `src/components/react/MDXEditor.tsx`:

```tsx
// src/components/react/MDXEditor.tsx
// Only renders client-side (client:only="react")
import '@mdxeditor/editor/style.css';
import {
  MDXEditor,
  headingsPlugin,
  listsPlugin,
  quotePlugin,
  codeBlockPlugin,
  markdownShortcutPlugin,
  frontmatterPlugin,
  toolbarPlugin,
  UndoRedo,
  BoldItalicUnderlineToggles,
  BlockTypeSelect,
  InsertCodeBlock,
  CodeMirrorEditor,
} from '@mdxeditor/editor';
import { useState } from 'react';

const INITIAL_MARKDOWN = `---
title: "New Post"
pubDate: ${new Date().toISOString().slice(0, 10)}
description: ""
tags: []
featured: false
draft: true
---

Start writing here...
`;

export default function BlogEditor() {
  const [markdown, setMarkdown] = useState(INITIAL_MARKDOWN);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<'idle' | 'saved' | 'error'>('idle');

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/save-post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markdown }),
      });
      setStatus(res.ok ? 'saved' : 'error');
    } catch {
      setStatus('error');
    } finally {
      setSaving(false);
      setTimeout(() => setStatus('idle'), 3000);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950">
      <div className="sticky top-14 z-40 flex items-center justify-between px-6 py-3 border-b border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-sm">
        <h1 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">MDX Editor</h1>
        <div className="flex items-center gap-3">
          {status === 'saved' && <span className="text-xs text-green-600 dark:text-green-400">Saved!</span>}
          {status === 'error' && <span className="text-xs text-red-600 dark:text-red-400">Error saving</span>}
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-3 py-1.5 rounded-md bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-medium hover:bg-zinc-700 dark:hover:bg-zinc-300 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Saving...' : 'Save Post'}
          </button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8">
        <MDXEditor
          markdown={markdown}
          onChange={setMarkdown}
          plugins={[
            headingsPlugin(),
            listsPlugin(),
            quotePlugin(),
            frontmatterPlugin(),
            codeBlockPlugin({ defaultCodeBlockLanguage: 'ts', codeBlockEditorDescriptors: [{ match: () => true, priority: 100, Editor: CodeMirrorEditor }] }),
            markdownShortcutPlugin(),
            toolbarPlugin({
              toolbarContents: () => (
                <>
                  <UndoRedo />
                  <BoldItalicUnderlineToggles />
                  <BlockTypeSelect />
                  <InsertCodeBlock />
                </>
              ),
            }),
          ]}
          contentEditableClassName="prose prose-zinc dark:prose-invert max-w-none min-h-[60vh] outline-none"
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 10.5: Create admin editor page**

Create `src/pages/admin/editor.astro`:

```astro
---
export const prerender = false;
import Layout from '../../layouts/Layout.astro';
import BlogEditor from '../../components/react/MDXEditor';
---
<Layout title="Editor — Admin">
  <BlogEditor client:only="react" />
</Layout>
```

- [ ] **Step 10.6: Create save-post API endpoint**

Create `src/pages/api/save-post.ts`:

```ts
// src/pages/api/save-post.ts
export const prerender = false;

import type { APIRoute } from 'astro';
import { writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';

// Extract slug from YAML frontmatter title
function titleToSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

// Extract frontmatter title from markdown string
function extractTitle(markdown: string): string {
  const match = markdown.match(/^title:\s*["']?(.+?)["']?\s*$/m);
  return match ? match[1] : 'untitled';
}

export const POST: APIRoute = async ({ request }) => {
  // Only allow in development
  if (import.meta.env.PROD) {
    return new Response(JSON.stringify({ error: 'Not available in production' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const { markdown } = await request.json() as { markdown: string };
    const title = extractTitle(markdown);
    const slug = titleToSlug(title);
    const filename = `${slug}.mdx`;
    const dir = join(process.cwd(), 'src', 'content', 'blog');

    await mkdir(dir, { recursive: true });
    await writeFile(join(dir, filename), markdown, 'utf-8');

    return new Response(JSON.stringify({ ok: true, filename }), {
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

- [ ] **Step 10.7: Verify admin route**

```bash
npm run dev
```

Open `http://localhost:4321/admin`. Expected: Login page renders. Enter the `ADMIN_PASSWORD` from `.env`. Expected: Redirect to `/admin/editor` with the MDX editor loaded.

- [ ] **Step 10.8: Commit**

```bash
git add src/middleware.ts src/pages/admin/ src/components/react/MDXEditor.tsx src/pages/api/ astro.config.mjs
git commit -m "feat: add protected admin MDX editor with save-to-disk API endpoint"
```

---

## Task 11: Migration Script

**Files:**
- Create: `scripts/migrate.js`

- [ ] **Step 11.1: Create migration script**

Create `scripts/migrate.js`:

```js
// scripts/migrate.js
// Usage: node scripts/migrate.js
// Requires: GOOGLE_APPLICATION_CREDENTIALS env var pointing to service-account.json

import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import TurndownService from 'turndown';
import { writeFile, mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ─── Firebase Admin Init ──────────────────────────────────────────────────────
if (getApps().length === 0) {
  initializeApp({ credential: cert(process.env.GOOGLE_APPLICATION_CREDENTIALS) });
}
const db = getFirestore();

// ─── Turndown Config ──────────────────────────────────────────────────────────
const td = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced',
  bulletListMarker: '-',
});

// Preserve code blocks with language annotation
td.addRule('fencedCodeBlock', {
  filter: (node) =>
    node.nodeName === 'PRE' &&
    node.firstChild?.nodeName === 'CODE',
  replacement: (_, node) => {
    const code = node.firstChild;
    const lang = (code.getAttribute?.('class') ?? '').replace('language-', '');
    return `\n\n\`\`\`${lang}\n${code.textContent}\n\`\`\`\n\n`;
  },
});

// ─── Helpers ──────────────────────────────────────────────────────────────────
function toSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function formatDate(timestamp) {
  if (!timestamp) return new Date().toISOString().slice(0, 10);
  const d = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return d.toISOString().slice(0, 10);
}

function buildFrontmatter(fields) {
  const lines = ['---'];
  for (const [key, value] of Object.entries(fields)) {
    if (Array.isArray(value)) {
      lines.push(`${key}: [${value.map((v) => `"${v}"`).join(', ')}]`);
    } else if (typeof value === 'boolean') {
      lines.push(`${key}: ${value}`);
    } else {
      lines.push(`${key}: "${String(value).replace(/"/g, '\\"')}"`);
    }
  }
  lines.push('---');
  return lines.join('\n');
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function migrate() {
  const outputDir = join(__dirname, '..', 'src', 'content', 'blog');
  await mkdir(outputDir, { recursive: true });

  const snapshot = await db.collection('posts').orderBy('createdAt', 'asc').get();

  if (snapshot.empty) {
    console.log('No posts found in Firestore.');
    return;
  }

  let count = 0;

  for (const docSnap of snapshot.docs) {
    const data = docSnap.data();

    const title = data.title ?? 'Untitled';
    const slug = data.slug ?? toSlug(title);
    const pubDate = formatDate(data.createdAt ?? data.pubDate);
    const description = data.description ?? data.excerpt ?? '';
    const tags = Array.isArray(data.tags) ? data.tags : [];
    const htmlContent = data.content ?? data.body ?? '';

    // Convert HTML → Markdown
    const markdown = htmlContent
      ? td.turndown(htmlContent)
      : '_No content_';

    const frontmatter = buildFrontmatter({
      title,
      pubDate,
      description,
      tags,
      draft: false,
      featured: data.featured ?? false,
    });

    const mdxContent = `${frontmatter}\n\n${markdown}\n`;
    const filepath = join(outputDir, `${slug}.mdx`);

    await writeFile(filepath, mdxContent, 'utf-8');
    console.log(`✓ ${slug}.mdx`);
    count++;
  }

  console.log(`\nMigrated ${count} post${count !== 1 ? 's' : ''} to src/content/blog/`);
}

migrate().catch((err) => {
  console.error('Migration failed:', err.message);
  process.exit(1);
});
```

- [ ] **Step 11.2: Add migrate script to package.json**

Open `package.json` and add to the `"scripts"` section:

```json
"migrate": "node scripts/migrate.js"
```

- [ ] **Step 11.3: Test migration against Firestore**

Make sure `GOOGLE_APPLICATION_CREDENTIALS` in `.env` points to your Firebase service account JSON file, then run:

```bash
node --env-file=.env scripts/migrate.js
```

Expected output:
```
✓ first-post.mdx
✓ second-post.mdx
...
Migrated N posts to src/content/blog/
```

Inspect the generated `.mdx` files in `src/content/blog/` — verify frontmatter is correct and content is readable Markdown.

- [ ] **Step 11.4: Commit**

```bash
git add scripts/migrate.js package.json
git commit -m "feat: add Firestore → MDX migration script with HTML-to-Markdown conversion"
```

---

## Task 12: Final Verification & Type Check

- [ ] **Step 12.1: Run all unit tests**

```bash
npx vitest run
```

Expected: All tests in `src/lib/utils.test.ts` pass.

- [ ] **Step 12.2: Run TypeScript check**

```bash
npx astro check
```

Expected: No type errors.

- [ ] **Step 12.3: Run production build**

```bash
npm run build
```

Expected: Build completes successfully. Output in `dist/`.

- [ ] **Step 12.4: Preview production build**

```bash
npm run preview
```

Open `http://localhost:4321`. Verify:
- Home page loads with hero and featured posts
- `/blog` lists posts
- `/blog/hello-world` shows post with TOC, reading time, progress bar
- Dark mode toggle works and persists on refresh
- No JavaScript errors in browser console

- [ ] **Step 12.5: Final commit**

```bash
git add -A
git commit -m "chore: final build verification — all checks passing"
```

---

## Environment Variables Reference

```
PUBLIC_FIREBASE_API_KEY          — Firebase web API key
PUBLIC_FIREBASE_AUTH_DOMAIN      — yourproject.firebaseapp.com
PUBLIC_FIREBASE_PROJECT_ID       — your-project-id
PUBLIC_FIREBASE_STORAGE_BUCKET   — yourproject.appspot.com
PUBLIC_FIREBASE_MESSAGING_SENDER_ID
PUBLIC_FIREBASE_APP_ID

ADMIN_PASSWORD                   — Plain string, protects /admin/editor
GOOGLE_APPLICATION_CREDENTIALS  — Path to service-account.json (migrate script only)
```

---

## Known Constraints

- **`save-post` API is dev-only.** In production (static build), the save endpoint returns 403. Posts must be committed to git and rebuilt for publication.
- **Admin cookie is not cryptographically signed.** Sufficient for a personal blog but not for multi-user access.
- **`medium-zoom` script** runs on every page that includes `ZoomImage`. If no `.zoom-image` elements exist, it does nothing — no error.
- **Shiki highlights all code blocks** in MDX, including those inside `<CodeBlock>`. The `<CodeBlock>` component wraps the already-highlighted `<pre>` for copy-button UX.
