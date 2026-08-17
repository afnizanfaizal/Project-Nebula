# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # dev server at localhost:4321
npm run build        # production build to ./dist/
npm run preview      # preview production build
npm test             # run all tests once
npm run test:watch   # run tests in watch mode
npm run migrate      # run migration script (requires GOOGLE_APPLICATION_CREDENTIALS)
```

Run a single test file: `npx vitest run src/lib/__tests__/analytics-utils.test.ts`

## Architecture Overview

This is an **Astro 6 blog** deployed on Netlify with `output: 'server'` (SSR). Static pages opt in to prerendering with `export const prerender = true`. All Astro pages without that export are server-rendered on each request.

### Data Storage: Firebase (two separate SDK layers)

**Client SDK** (`src/lib/firebase.ts`) — browser-only, intentionally never runs during SSR. Used only by the `ViewCounter` React component to read post view counts.

**Admin SDK** (`src/lib/firebase-admin.ts`) — server-side only, used by all API routes and SSR pages. Holds all the canonical data-access helpers (`getPost`, `savePost`, `listPosts`, `getProfile`, `getDailyAnalytics`, etc.). All Firestore writes go through the Admin SDK; the client SDK has write-disabled security rules as defense-in-depth.

**Firestore collections:**
- `posts/{slug}` — post documents with `content` (raw markdown), metadata, and `views` counter
- `analytics/{YYYY-MM-DD}` — daily totals: `{ total, posts: {slug: count}, countries: {CC: count} }`
- `site/profile` — site owner profile document

### Auth / Admin Panel

Authentication is cookie-based Firebase session cookies (`admin_session`). The middleware in `src/middleware.ts` guards all `/admin/*` pages and `/api/admin/*` + `/api/save-post` routes. It lazily imports `firebase-admin` to avoid loading it on public pages.

The admin panel is a set of Astro pages under `src/pages/admin/` that shell React components:
- `AdminDashboard.tsx` — analytics charts (Recharts), post list
- `MDXEditor.tsx` — the post editor using `@mdxeditor/editor`
- `MediaLibrary.tsx` / `MediaManager.tsx` — Firebase Storage image management
- `ProfileEditor.tsx` — site profile editor

### Post Rendering Pipeline

Posts are stored in Firestore as raw markdown strings. When served at `/blog/[slug]`, they go through `src/lib/render-markdown.ts`:

1. Preprocesses `:::tip/warning/etc:::` admonitions → `<callout type="...">` tags
2. `remark-parse` → `remark-gfm` → `remark-rehype` → `rehype-raw`
3. `@shikijs/rehype` for syntax highlighting (`github-dark-default` theme)
4. `rehype-blog-components` — transforms custom HTML tags (`<callout>`, `<figure>`) into styled output
5. Rendered HTML is in-memory cached per slug (keyed by `updatedDate` timestamp)

### Content Collections (Static Fallback)

`src/content/blog/` and `src/content/projects/` hold MDX files used by Astro content collections (defined in `src/content.config.ts`). These coexist with the Firestore-backed posts. Content files must stay flat in their directory — no subdirectories — because slugs are derived directly from filenames.

### Analytics Tracking

View tracking happens in two places:
1. `POST /api/track-view` — increments `posts/{slug}.views` and writes to daily analytics. Country detection uses Netlify's `locals.netlify.context.geo` or edge headers (`x-country`, `cf-ipcountry`, etc.), falling back to `XX`.
2. Analytics data is read in `AdminDashboard.tsx` via `/api/admin/` endpoints that call `getDailyAnalytics()`.

### Image Uploads

Images upload to Firebase Storage and are proxied through `/uploads/[...path].ts` (which streams from Storage), since the Storage bucket is not publicly accessible.

## Environment Variables

Required env vars — see `.env.example` for the full list with descriptions:
- `PUBLIC_FIREBASE_*` — client SDK config (safe to expose)
- `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` — Admin SDK (server-only)

The `FIREBASE_PRIVATE_KEY` value contains literal `\n` sequences; `firebase-admin.ts` calls `.replace(/\\n/g, '\n')` to convert them.

## Key Constraints

- `firebase-admin` is CJS and must stay in `vite.ssr.external`; all `@firebase/*` client packages, plus `@mdxeditor/*`, `@lexical/*`, `@codemirror/*`, and `codemirror` (the MDX editor's deps), must stay in `vite.ssr.noExternal`.
- The `patchBrokenTransforms` Vite plugin in `astro.config.mjs` works around a Vite 7 crash with invalid plugin hooks — don't remove it.
- `export const prerender = false` is required on any page that reads from Firestore (even if it seems like it would default to server rendering).
- **Node must stay `<24`** (pinned via `.nvmrc` / `package.json#engines`). `@google-cloud/storage` (pulled in by `firebase-admin`) hard-depends on `gaxios@6.x`, which unconditionally uses the `node-fetch@2` package in Node (its `hasFetch()` check only detects browser `window.fetch`, never Node's native fetch). `node-fetch@2` is broken under Node 24 — every gzip'd response from `googleapis.com` (OAuth token exchange, Storage list/upload) fails with `GaxiosError: ... Premature close`. Node 22 LTS works cleanly. No fix exists upstream (`node-fetch@2.7.0` and `gaxios@6.7.1` are final releases on those lines; even `@google-cloud/storage@8.0.0` still requires `google-auth-library ^9.6.3` → same broken chain) — must stay off Node 24 until Google's libs move off `node-fetch@2`.
