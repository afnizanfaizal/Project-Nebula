# Admin Editor Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the hardcoded-password admin login with Firebase Email+Password Auth, and add a collapsible metadata sidebar to the blog editor (title, description, featured image, tags, draft/publish toggle, pub date).

**Architecture:** Firebase client SDK handles the browser-side sign-in and ID token retrieval; a new `/api/auth/session` endpoint verifies the token server-side and issues an HttpOnly cookie; the middleware is updated to verify that cookie via Firebase Admin on every `/admin/*` and `/api/admin/*` request. Metadata fields move out of the MDXEditor frontmatter block into controlled React state in a collapsible sidebar, and the save/load API contract changes from a gray-matter markdown string to a structured `{ meta, body }` JSON payload.

**Tech Stack:** Astro 5 (SSR), React 19, Firebase JS SDK v10 (`firebase/auth`), Firebase Admin SDK (`firebase-admin/auth`), MDXEditor, Tailwind CSS, Vitest.

---

## File Map

| File | Action | Purpose |
|---|---|---|
| `src/lib/firebase.ts` | Modify | Export `auth` (Firebase client Auth instance) |
| `src/lib/firebase-admin.ts` | Modify | Export `adminAuth` + `isValidAdminToken()` helper |
| `src/pages/api/auth/session.ts` | Create | POST endpoint: verify ID token → set HttpOnly cookie |
| `src/middleware.ts` | Modify | Verify Firebase token instead of `=== 'authenticated'` |
| `src/pages/admin/index.astro` | Modify | Replace password form with `<AdminLogin client:only="react" />` |
| `src/components/react/AdminLogin.tsx` | Create | Email+Password login form component |
| `src/pages/api/admin/upload-image.ts` | Modify | Remove now-redundant per-route auth check |
| `src/pages/api/admin/delete-post.ts` | Modify | Remove now-redundant per-route auth check |
| `src/pages/api/admin/list-posts.ts` | Modify | Remove now-redundant per-route auth check |
| `src/pages/api/admin/get-post.ts` | Modify | Return `{ meta, body }` instead of reconstructed frontmatter string |
| `src/pages/api/save-post.ts` | Modify | Accept `{ meta, body }` instead of `{ markdown, slug }` |
| `src/components/react/MDXEditor.tsx` | Modify | Remove frontmatter plugin, add collapsible metadata sidebar |

---

## Task 1: Export Firebase client Auth instance

**Files:**
- Modify: `src/lib/firebase.ts`

- [ ] **Step 1: Add `auth` export**

  Open `src/lib/firebase.ts`. Add `getAuth` to the `firebase/auth` import and export `auth`:

  ```typescript
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
  import { getAuth, type Auth } from 'firebase/auth';

  const firebaseConfig = {
    apiKey: import.meta.env.PUBLIC_FIREBASE_API_KEY,
    authDomain: import.meta.env.PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.PUBLIC_FIREBASE_APP_ID,
  };

  const isConfigured =
    !import.meta.env.SSR &&
    Boolean(firebaseConfig.projectId && firebaseConfig.apiKey);

  const app = isConfigured
    ? getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]
    : null;
  export const db: Firestore | null = app ? getFirestore(app) : null;
  export const auth: Auth | null = app ? getAuth(app) : null;

  // ... rest of file unchanged (incrementPostViews, getPostViews)
  ```

- [ ] **Step 2: Commit**

  ```bash
  git add src/lib/firebase.ts
  git commit -m "feat: export Firebase client Auth instance"
  ```

---

## Task 2: Export Firebase Admin Auth + `isValidAdminToken` helper

**Files:**
- Modify: `src/lib/firebase-admin.ts`

- [ ] **Step 1: Add `adminAuth` and `isValidAdminToken` exports**

  Add to the imports at the top of `src/lib/firebase-admin.ts`:

  ```typescript
  import { getAuth } from 'firebase-admin/auth';
  ```

  Add after the `export const adminDb = getFirestore(app);` line:

  ```typescript
  export const adminAuth = getAuth(app);

  /**
   * Returns true if the given cookie value is a valid, non-expired Firebase ID token.
   */
  export async function isValidAdminToken(token: string | undefined): Promise<boolean> {
    if (!token) return false;
    try {
      await adminAuth.verifyIdToken(token);
      return true;
    } catch {
      return false;
    }
  }
  ```

- [ ] **Step 2: Verify dev server still starts**

  ```bash
  npm run dev
  ```

  Expected: server starts without errors. No Firebase initialization errors in the terminal.

- [ ] **Step 3: Commit**

  ```bash
  git add src/lib/firebase-admin.ts
  git commit -m "feat: export adminAuth and isValidAdminToken helper"
  ```

---

## Task 3: Create `/api/auth/session` endpoint

**Files:**
- Create: `src/pages/api/auth/session.ts`

- [ ] **Step 1: Create the session endpoint**

  ```typescript
  // src/pages/api/auth/session.ts
  export const prerender = false;

  import type { APIRoute } from 'astro';
  import { adminAuth } from '../../../lib/firebase-admin.js';

  export const POST: APIRoute = async ({ request, cookies }) => {
    try {
      const body = await request.json() as { idToken?: unknown };
      const { idToken } = body;
      if (typeof idToken !== 'string' || idToken.length === 0) {
        return new Response(JSON.stringify({ error: 'Missing idToken' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      await adminAuth.verifyIdToken(idToken);

      cookies.set('admin_session', idToken, {
        path: '/',
        httpOnly: true,
        secure: import.meta.env.PROD,
        sameSite: 'strict',
        maxAge: 60 * 60, // 1 hour (matches Firebase ID token TTL)
      });

      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  };
  ```

- [ ] **Step 2: Commit**

  ```bash
  git add src/pages/api/auth/session.ts
  git commit -m "feat: add /api/auth/session endpoint for Firebase ID token exchange"
  ```

---

## Task 4: Update middleware to verify Firebase token

**Files:**
- Modify: `src/middleware.ts`

- [ ] **Step 1: Rewrite middleware**

  Replace the entire contents of `src/middleware.ts`:

  ```typescript
  // src/middleware.ts
  import { defineMiddleware } from 'astro:middleware';

  export const onRequest = defineMiddleware(async (context, next) => {
    const { pathname } = context.url;

    const isAdminPage = pathname.startsWith('/admin');
    const isAdminApi  =
      pathname.startsWith('/api/admin/') ||
      pathname === '/api/save-post';

    // Public routes — no auth needed
    if (!isAdminPage && !isAdminApi) return next();

    // Allow the login page and the session endpoint without auth
    if (
      pathname === '/admin' ||
      pathname === '/admin/' ||
      pathname === '/api/auth/session'
    ) {
      return next();
    }

    const token = context.cookies.get('admin_session')?.value;
    if (token) {
      try {
        // Dynamic import: avoids loading firebase-admin for every public page
        const { isValidAdminToken } = await import('./lib/firebase-admin.js');
        if (await isValidAdminToken(token)) return next();
      } catch {
        // Module load failure — fall through to redirect/401
      }
    }

    if (isAdminApi) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return context.redirect('/admin');
  });
  ```

- [ ] **Step 2: Commit**

  ```bash
  git add src/middleware.ts
  git commit -m "feat: update middleware to verify Firebase ID token"
  ```

---

## Task 5: Create `AdminLogin` component + replace login page

**Files:**
- Create: `src/components/react/AdminLogin.tsx`
- Modify: `src/pages/admin/index.astro`

- [ ] **Step 1: Create `AdminLogin.tsx`**

  ```tsx
  // src/components/react/AdminLogin.tsx
  import { useState } from 'react';
  import { signInWithEmailAndPassword } from 'firebase/auth';
  import { auth } from '../../lib/firebase.js';

  export default function AdminLogin() {
    const [email, setEmail]       = useState('');
    const [password, setPassword] = useState('');
    const [error, setError]       = useState('');
    const [loading, setLoading]   = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!auth) {
        setError('Firebase Auth is not configured.');
        return;
      }
      setLoading(true);
      setError('');
      try {
        const cred = await signInWithEmailAndPassword(auth, email, password);
        const idToken = await cred.user.getIdToken();

        const res = await fetch('/api/auth/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idToken }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({})) as { error?: string };
          setError(data.error ?? 'Sign-in failed.');
          return;
        }

        window.location.href = '/admin/dashboard';
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        // Firebase auth error codes are verbose — trim to the useful part
        setError(msg.replace('Firebase: ', '').replace(/ \(auth\/.*\)\.?$/, ''));
      } finally {
        setLoading(false);
      }
    };

    return (
      <div className="flex items-center justify-center px-6 min-h-screen">
        <div className="w-full max-w-xs">
          {/* Lock icon */}
          <div className="mb-8 flex justify-center">
            <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center">
              <svg className="w-4.5 h-4.5 text-zinc-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            </div>
          </div>

          <h1 className="text-center text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-1 tracking-tight">
            Admin Access
          </h1>
          <p className="text-center text-xs text-zinc-500 dark:text-zinc-500 mb-8">
            Sign in with your Firebase account
          </p>

          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoFocus
              placeholder="Email"
              className="w-full px-3.5 py-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800
                         bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 text-sm
                         placeholder:text-zinc-400 dark:placeholder:text-zinc-600
                         focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-100
                         focus:border-zinc-900 dark:focus:border-zinc-100 transition"
            />
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              placeholder="Password"
              className="w-full px-3.5 py-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800
                         bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 text-sm
                         placeholder:text-zinc-400 dark:placeholder:text-zinc-600
                         focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-100
                         focus:border-zinc-900 dark:focus:border-zinc-100 transition"
            />
            {error && (
              <p className="text-xs text-red-500 dark:text-red-400">{error}</p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-2.5 rounded-lg bg-zinc-900 dark:bg-zinc-100
                         text-white dark:text-zinc-900 text-sm font-semibold
                         hover:bg-zinc-700 dark:hover:bg-white active:scale-[0.98]
                         disabled:opacity-50 disabled:cursor-not-allowed
                         transition-all"
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>
      </div>
    );
  }
  ```

- [ ] **Step 2: Replace `src/pages/admin/index.astro`**

  Replace the entire file:

  ```astro
  ---
  export const prerender = false;
  import AdminLayout from '../../layouts/AdminLayout.astro';
  import AdminLogin from '../../components/react/AdminLogin';
  ---
  <AdminLayout title="Admin — Sign In">
    <AdminLogin client:only="react" />
  </AdminLayout>
  ```

- [ ] **Step 3: Manual smoke test**

  1. Start dev server: `npm run dev`
  2. Visit `http://localhost:4321/admin` — should show email + password form
  3. Enter valid Firebase credentials → should redirect to `/admin/dashboard`
  4. Visit `http://localhost:4321/admin/dashboard` → should work
  5. Clear cookies → visit `/admin/dashboard` → should redirect to `/admin`

- [ ] **Step 4: Commit**

  ```bash
  git add src/components/react/AdminLogin.tsx src/pages/admin/index.astro
  git commit -m "feat: replace password login with Firebase Email+Password auth"
  ```

---

## Task 6: Remove redundant per-route auth checks

**Files:**
- Modify: `src/pages/api/admin/upload-image.ts`
- Modify: `src/pages/api/admin/delete-post.ts`
- Modify: `src/pages/api/admin/list-posts.ts`

These routes are now protected by middleware. Remove the `cookies.get('admin_session')?.value !== 'authenticated'` guard block from each.

- [ ] **Step 1: Update `upload-image.ts`**

  Remove lines 9–14 (the auth check block) from `src/pages/api/admin/upload-image.ts`. The handler should begin with `const formData = await request.formData();`. Also remove `cookies` from the destructured parameter:

  ```typescript
  // src/pages/api/admin/upload-image.ts
  export const prerender = false;

  import type { APIRoute } from 'astro';
  import { writeFile, mkdir } from 'node:fs/promises';
  import { join, extname } from 'node:path';
  import { randomBytes } from 'node:crypto';

  export const POST: APIRoute = async ({ request }) => {
    const formData = await request.formData();
    const file = formData.get('image');

    if (!(file instanceof File) || file.size === 0) {
      return new Response(JSON.stringify({ error: 'No image provided' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      return new Response(JSON.stringify({ error: 'Invalid file type' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const ext = extname(file.name) || '.jpg';
    const name = randomBytes(8).toString('hex') + ext;

    const uploadDir = join(process.cwd(), 'public', 'uploads');
    await mkdir(uploadDir, { recursive: true });
    await writeFile(join(uploadDir, name), Buffer.from(await file.arrayBuffer()));

    return new Response(JSON.stringify({ url: `/uploads/${name}` }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  };
  ```

- [ ] **Step 2: Update `delete-post.ts`**

  ```typescript
  // src/pages/api/admin/delete-post.ts
  export const prerender = false;

  import type { APIRoute } from 'astro';
  import { deletePost } from '../../../lib/firebase-admin.js';

  export const DELETE: APIRoute = async ({ url }) => {
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

- [ ] **Step 3: Update `list-posts.ts`**

  ```typescript
  // src/pages/api/admin/list-posts.ts
  export const prerender = false;

  import type { APIRoute } from 'astro';
  import { listPosts } from '../../../lib/firebase-admin.js';

  export const GET: APIRoute = async () => {
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

- [ ] **Step 4: Commit**

  ```bash
  git add src/pages/api/admin/upload-image.ts src/pages/api/admin/delete-post.ts src/pages/api/admin/list-posts.ts
  git commit -m "refactor: remove redundant per-route auth checks (middleware handles it)"
  ```

---

## Task 7: Update `get-post` API — return `{ meta, body }`

**Files:**
- Modify: `src/pages/api/admin/get-post.ts`

The editor no longer needs frontmatter YAML. The API now returns structured `meta` + `body` separately.

- [ ] **Step 1: Rewrite `get-post.ts`**

  ```typescript
  // src/pages/api/admin/get-post.ts
  export const prerender = false;

  import type { APIRoute } from 'astro';
  import { getPost } from '../../../lib/firebase-admin.js';
  import { Timestamp } from 'firebase-admin/firestore';

  export const GET: APIRoute = async ({ url }) => {
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

    const pubDate = post.pubDate instanceof Timestamp
      ? post.pubDate.toDate().toISOString().slice(0, 10)
      : new Date().toISOString().slice(0, 10);

    return new Response(JSON.stringify({
      meta: {
        title:         post.title ?? '',
        slug:          post.slug,
        description:   post.description ?? '',
        featuredImage: post.featuredImage ?? '',
        tags:          post.tags ?? [],
        status:        post.draft ? 'draft' : 'published',
        pubDate,
      },
      body: post.content ?? '',
    }), {
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
  git commit -m "feat: get-post returns structured { meta, body } instead of frontmatter string"
  ```

---

## Task 8: Update `save-post` API — accept `{ meta, body }`

**Files:**
- Modify: `src/pages/api/save-post.ts`

The editor no longer sends a markdown string with embedded frontmatter. It now sends explicit `meta` fields.

- [ ] **Step 1: Rewrite `save-post.ts`**

  ```typescript
  // src/pages/api/save-post.ts
  export const prerender = false;

  import type { APIRoute } from 'astro';
  import { Timestamp } from 'firebase-admin/firestore';
  import { savePost } from '../lib/firebase-admin.js';

  interface SavePayload {
    meta: {
      title:         string;
      slug:          string;
      description:   string;
      featuredImage: string;
      tags:          string[];
      status:        'draft' | 'published';
      pubDate:       string; // YYYY-MM-DD
    };
    body: string;
  }

  export const POST: APIRoute = async ({ request }) => {
    try {
      const payload = await request.json() as SavePayload;
      const { meta, body } = payload;

      if (!meta?.slug || !/^[a-z0-9][a-z0-9-]*$/.test(meta.slug)) {
        return new Response(JSON.stringify({ error: 'Invalid slug' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      if (typeof meta.title !== 'string' || meta.title.trim().length === 0) {
        return new Response(JSON.stringify({ error: 'Title is required' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      if (typeof body !== 'string') {
        return new Response(JSON.stringify({ error: 'Invalid body' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const pubDate = meta.pubDate
        ? Timestamp.fromDate(new Date(meta.pubDate))
        : Timestamp.now();

      await savePost(meta.slug, {
        title:         meta.title.trim(),
        description:   meta.description ?? '',
        pubDate,
        tags:          Array.isArray(meta.tags) ? meta.tags.map(String) : [],
        draft:         meta.status === 'draft',
        featured:      false,
        ...(meta.featuredImage ? { featuredImage: meta.featuredImage } : {}),
        content:       body,
      });

      return new Response(JSON.stringify({ ok: true, slug: meta.slug }), {
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
  git commit -m "feat: save-post accepts structured { meta, body } payload"
  ```

---

## Task 9: Rewrite MDXEditor with metadata sidebar

**Files:**
- Modify: `src/components/react/MDXEditor.tsx`

This is the largest change. Remove the frontmatter plugin, add a 320px collapsible sidebar with all metadata fields, and update the save/load flow to use the new `{ meta, body }` API contract.

- [ ] **Step 1: Define sidebar state types** (at the top of the file, after imports)

  Replace the `INITIAL_MARKDOWN` constant and everything from line 142 onward with the new version. First, establish the sidebar state interface:

  The new `SidebarMeta` type (add after the `InsertJsxBridge` component, before `INITIAL_MARKDOWN`):

  ```typescript
  interface SidebarMeta {
    title:         string;
    description:   string;
    featuredImage: string;
    tags:          string[];
    status:        'draft' | 'published';
    pubDate:       string; // YYYY-MM-DD
  }

  const todayISO = new Date().toISOString().slice(0, 10);

  const EMPTY_META: SidebarMeta = {
    title:         '',
    description:   '',
    featuredImage: '',
    tags:          [],
    status:        'draft',
    pubDate:       todayISO,
  };
  ```

- [ ] **Step 2: Remove `frontmatterPlugin` from `STATIC_PLUGINS`**

  In the `STATIC_PLUGINS` array, remove:
  - The `import { frontmatterPlugin } from '@mdxeditor/editor'` import line
  - The `frontmatterPlugin(),` entry from the array

  Also remove `frontmatterPlugin` from the `@mdxeditor/editor` import destructure at the top.

- [ ] **Step 3: Update `INITIAL_MARKDOWN`**

  Replace:
  ```typescript
  const today = new Date().toISOString().slice(0, 10);

  const INITIAL_MARKDOWN = `---
  title: "New Post"
  pubDate: ${today}
  description: ""
  tags: []
  featured: false
  draft: true
  ---

  Start writing here...
  `;
  ```

  With:
  ```typescript
  const INITIAL_MARKDOWN = `Start writing here...`;
  ```

- [ ] **Step 4: Update the `BlogEditor` component state**

  Replace the state declarations inside `BlogEditor` to add sidebar state. After `const [loading, setLoading] = useState(Boolean(initialSlug));` add:

  ```typescript
  const [meta, setMeta]               = useState<SidebarMeta>(EMPTY_META);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [tagInput, setTagInput]       = useState('');
  const [imgUploading, setImgUploading] = useState(false);
  ```

  (Remove the old `const [imgUploading, setImgUploading] = useState(false);` which already exists — just consolidate. Keep all other existing state.)

- [ ] **Step 5: Update `loadPost` to populate sidebar**

  Replace the `loadPost` function body inside the `useEffect`:

  ```typescript
  async function loadPost() {
    try {
      const res = await fetch(
        `/api/admin/get-post?slug=${encodeURIComponent(initialSlug)}`,
        { cache: 'no-store' },
      );
      if (!res.ok) return;
      const data = await res.json() as {
        meta: SidebarMeta & { slug: string };
        body: string;
      };
      if (!cancelled) {
        const clean = stripBrokenImages(data.body);
        latestMarkdownRef.current = clean;
        setSeedMarkdown(clean);
        setMarkdown(clean);
        setSlug(data.meta.slug);
        setMeta({
          title:         data.meta.title,
          description:   data.meta.description,
          featuredImage: data.meta.featuredImage,
          tags:          data.meta.tags,
          status:        data.meta.status,
          pubDate:       data.meta.pubDate,
        });
        setEditorKey(k => k + 1);
      }
    } finally {
      if (!cancelled) setLoading(false);
    }
  }
  ```

- [ ] **Step 6: Update `handleSave`**

  Replace the `handleSave` function:

  ```typescript
  const handleSave = async () => {
    const fromEditor = editorRef.current?.getMarkdown();
    const latest = fromEditor || latestMarkdownRef.current;
    if (fromEditor) latestMarkdownRef.current = fromEditor;

    if (!meta.title.trim()) {
      setStatus('error');
      setStatusMsg('Title is required');
      setTimeout(() => setStatus('idle'), 3000);
      return;
    }
    if (!slug) {
      setStatus('error');
      setStatusMsg('Slug is required');
      setTimeout(() => setStatus('idle'), 3000);
      return;
    }

    setSaving(true);
    setStatus('idle');
    setStatusMsg('');
    try {
      const res = await fetch('/api/save-post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ meta: { ...meta, slug }, body: latest }),
      });
      if (res.ok) {
        setSeedMarkdown(latest);
        setStatus('saved');
      } else {
        const body = await res.json().catch(() => ({})) as { error?: string };
        setStatusMsg(body.error ?? `HTTP ${res.status}`);
        setStatus('error');
      }
    } catch (err) {
      setStatusMsg(err instanceof Error ? err.message : String(err));
      setStatus('error');
    } finally {
      setSaving(false);
      setTimeout(() => setStatus('idle'), 3000);
    }
  };
  ```

- [ ] **Step 7: Add title-to-slug auto-generation handler**

  Add after `handleSave`:

  ```typescript
  // Auto-generate slug from title only for new posts (initialSlug is empty)
  const handleTitleChange = (value: string) => {
    setMeta(m => ({ ...m, title: value }));
    if (!initialSlug) {
      const generated = value
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
      setSlug(generated || 'new-post');
    }
  };
  ```

- [ ] **Step 8: Add featured image upload handler for sidebar**

  Add after `handleTitleChange`:

  ```typescript
  const handleFeaturedImageUpload = async (file: File) => {
    setImgUploading(true);
    try {
      const form = new FormData();
      form.append('image', file);
      const res = await fetch('/api/admin/upload-image', { method: 'POST', body: form });
      const data = await res.json() as { url?: string; error?: string };
      if (!res.ok || !data.url) throw new Error(data.error ?? 'Upload failed');
      setMeta(m => ({ ...m, featuredImage: data.url! }));
    } catch (err) {
      alert(`Upload failed: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setImgUploading(false);
    }
  };
  ```

- [ ] **Step 9: Add tag helpers**

  ```typescript
  const addTag = (value: string) => {
    const tag = value.trim().toLowerCase();
    if (tag && !meta.tags.includes(tag)) {
      setMeta(m => ({ ...m, tags: [...m.tags, tag] }));
    }
    setTagInput('');
  };

  const removeTag = (tag: string) => {
    setMeta(m => ({ ...m, tags: m.tags.filter(t => t !== tag) }));
  };
  ```

- [ ] **Step 10: Update the command bar JSX**

  In the command bar `<div>`, update the **slug input** section to show title in the command bar instead of slug (the slug is still editable). Also add the sidebar toggle button before the Save button.

  Replace the slug/file path section in the command bar (the `posts/` span + slug input + `.mdx` span block) with:

  ```tsx
  {/* File path */}
  <span className="text-zinc-600 text-[11px] font-mono select-none">posts/</span>
  <input
    value={slug}
    onChange={(e) =>
      setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-'))
    }
    className="w-44 bg-transparent text-zinc-300 text-[11px] font-mono outline-none
               border-b border-transparent hover:border-zinc-700 focus:border-zinc-500
               pb-px transition-colors placeholder:text-zinc-600"
    placeholder="post-slug"
    spellCheck={false}
  />
  <span className="text-zinc-600 text-[11px] font-mono select-none">.mdx</span>
  ```

  (This stays the same.)

  Add the **sidebar toggle button** just before the Save button:

  ```tsx
  {/* Sidebar toggle */}
  <button
    type="button"
    title={sidebarOpen ? 'Hide metadata' : 'Show metadata'}
    onClick={() => setSidebarOpen(o => !o)}
    className={`flex items-center justify-center w-7 h-7 rounded transition-colors
                ${sidebarOpen
                  ? 'text-zinc-100 bg-zinc-700'
                  : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800'}`}
  >
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2"/>
      <path d="M15 3v18"/>
    </svg>
  </button>
  ```

- [ ] **Step 11: Update the main layout to include the sidebar**

  Replace the outer `<div className="flex flex-col bg-zinc-950 h-screen">` layout. After the command bar, change the editor area to be a flex row:

  Replace the editor area section:

  ```tsx
  {/* ── Main area: editor + sidebar ─────────────────────────────── */}
  <div className="flex flex-1 overflow-hidden">
    {/* Editor */}
    <div className="flex-1 overflow-y-auto">
      <MDXEditor
        key={editorKey}
        ref={editorRef}
        markdown={seedMarkdown}
        onChange={handleChange}
        plugins={plugins}
        contentEditableClassName="prose prose-invert max-w-none px-8 py-8 min-h-screen
                                   focus:outline-none text-zinc-200
                                   prose-headings:text-zinc-100 prose-code:text-zinc-200
                                   prose-a:text-blue-400"
      />
    </div>

    {/* Sidebar */}
    {sidebarOpen && (
      <aside className="w-80 shrink-0 border-l border-zinc-800 bg-zinc-900 overflow-y-auto">
        <div className="p-5 space-y-5">

          {/* Title */}
          <div>
            <label className="block text-[11px] font-medium text-zinc-400 mb-1.5 uppercase tracking-wider">
              Title
            </label>
            <input
              value={meta.title}
              onChange={e => handleTitleChange(e.target.value)}
              placeholder="Post title"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2
                         text-sm text-zinc-100 placeholder:text-zinc-600
                         focus:outline-none focus:ring-1 focus:ring-zinc-500 focus:border-zinc-500
                         transition"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-[11px] font-medium text-zinc-400 mb-1.5 uppercase tracking-wider">
              Description
            </label>
            <textarea
              value={meta.description}
              onChange={e => setMeta(m => ({ ...m, description: e.target.value }))}
              placeholder="Short summary for meta and previews"
              rows={3}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2
                         text-sm text-zinc-100 placeholder:text-zinc-600 resize-none
                         focus:outline-none focus:ring-1 focus:ring-zinc-500 focus:border-zinc-500
                         transition"
            />
          </div>

          {/* Featured Image */}
          <div>
            <label className="block text-[11px] font-medium text-zinc-400 mb-1.5 uppercase tracking-wider">
              Featured Image
            </label>
            {meta.featuredImage && (
              <div className="relative mb-2">
                <img
                  src={meta.featuredImage}
                  alt="Featured"
                  className="w-full rounded-lg border border-zinc-700 object-cover"
                  style={{ maxHeight: 160, minHeight: 60, background: '#27272a' }}
                  onError={e => {
                    (e.currentTarget as HTMLImageElement).style.minHeight = '60px';
                  }}
                />
                <button
                  type="button"
                  onClick={() => setMeta(m => ({ ...m, featuredImage: '' }))}
                  className="absolute top-1.5 right-1.5 w-5 h-5 rounded bg-zinc-900/80
                             text-zinc-400 hover:text-zinc-100 flex items-center justify-center text-xs"
                  title="Remove image"
                >
                  ✕
                </button>
              </div>
            )}
            <label className={`flex items-center justify-center gap-2 w-full py-2 rounded-lg border
                               border-dashed border-zinc-700 text-[11px] text-zinc-500
                               hover:border-zinc-500 hover:text-zinc-400 cursor-pointer transition
                               ${imgUploading ? 'opacity-50 cursor-wait' : ''}`}>
              <input
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml"
                className="hidden"
                disabled={imgUploading}
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) handleFeaturedImageUpload(file);
                  e.target.value = '';
                }}
              />
              {imgUploading ? 'Uploading…' : (meta.featuredImage ? 'Replace image' : 'Upload image')}
            </label>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-[11px] font-medium text-zinc-400 mb-1.5 uppercase tracking-wider">
              Tags
            </label>
            {meta.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {meta.tags.map(tag => (
                  <span key={tag} className="flex items-center gap-1 px-2 py-0.5 rounded-full
                                             bg-zinc-800 border border-zinc-700 text-[11px] text-zinc-300">
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="text-zinc-500 hover:text-zinc-300 leading-none"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
            <input
              value={tagInput}
              onChange={e => setTagInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ',') {
                  e.preventDefault();
                  addTag(tagInput);
                }
              }}
              onBlur={() => { if (tagInput.trim()) addTag(tagInput); }}
              placeholder="Add tag, press Enter"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2
                         text-sm text-zinc-100 placeholder:text-zinc-600
                         focus:outline-none focus:ring-1 focus:ring-zinc-500 focus:border-zinc-500
                         transition"
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-[11px] font-medium text-zinc-400 mb-1.5 uppercase tracking-wider">
              Status
            </label>
            <div className="flex rounded-lg border border-zinc-700 overflow-hidden">
              {(['draft', 'published'] as const).map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setMeta(m => ({ ...m, status: s }))}
                  className={`flex-1 py-2 text-[11px] font-medium capitalize transition
                              ${meta.status === s
                                ? 'bg-zinc-700 text-zinc-100'
                                : 'bg-transparent text-zinc-500 hover:text-zinc-300'}`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Pub Date */}
          <div>
            <label className="block text-[11px] font-medium text-zinc-400 mb-1.5 uppercase tracking-wider">
              Publish Date
            </label>
            <input
              type="date"
              value={meta.pubDate}
              onChange={e => setMeta(m => ({ ...m, pubDate: e.target.value }))}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2
                         text-sm text-zinc-100
                         focus:outline-none focus:ring-1 focus:ring-zinc-500 focus:border-zinc-500
                         transition [color-scheme:dark]"
            />
          </div>

        </div>
      </aside>
    )}
  </div>
  ```

- [ ] **Step 12: Verify existing body image upload still works**

  The `handleImageFile` function (for inserting images into the body via the toolbar button) should remain unchanged — it still POSTs to `/api/admin/upload-image` and inserts a `<Figure>` JSX node. No changes needed there.

- [ ] **Step 13: Manual smoke test**

  1. Start dev server: `npm run dev`
  2. Log in and go to `/admin/editor` (new post) — sidebar should be open with empty fields
  3. Type a title — slug in command bar should auto-populate
  4. Upload a featured image — preview should appear in sidebar
  5. Add some tags using Enter key — chips should appear
  6. Toggle status to "Published"
  7. Click "Save Post" — should succeed
  8. Navigate to `/admin/editor?slug=<your-slug>` — sidebar should hydrate with saved values, editor body should load content without frontmatter block

- [ ] **Step 14: Commit**

  ```bash
  git add src/components/react/MDXEditor.tsx
  git commit -m "feat: add collapsible metadata sidebar to blog editor, remove frontmatter plugin"
  ```

---

## Task 10: Run tests

- [ ] **Step 1: Run the full test suite**

  ```bash
  npm run test
  ```

  Expected: all existing tests pass. The `rehype-blog-components` tests are unaffected. The `render-markdown` tests are unaffected.

- [ ] **Step 2: Fix any test failures before proceeding**

  If any tests fail, investigate and fix before merging.

- [ ] **Step 3: Final commit if fixes were needed**

  ```bash
  git add -p
  git commit -m "fix: address test failures after editor redesign"
  ```
