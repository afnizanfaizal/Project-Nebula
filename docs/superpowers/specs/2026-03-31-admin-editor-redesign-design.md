# Admin Editor Redesign — Design Spec
_Date: 2026-03-31_

## Overview

Redesign the admin editor page to add a structured metadata sidebar and replace the current hardcoded-password login with Firebase Email+Password Authentication.

---

## Section 1: Authentication — Firebase Login

### What changes
The current `/admin` route uses a hardcoded `ADMIN_PASSWORD` environment variable for access control. This is replaced with Firebase Email+Password Authentication.

### Components
- **`src/pages/admin/login.astro`** — new login page, renders `<AdminLogin client:only="react" />`
- **`src/components/react/AdminLogin.tsx`** — new React component with email + password form
- **`src/pages/api/auth/session.ts`** — existing endpoint; accepts `{ idToken }`, calls `adminAuth.verifyIdToken()`, sets `admin_session` HttpOnly cookie
- **`src/middleware.ts`** — guards all `/admin/*` and `/api/*` routes; verifies the `admin_session` cookie via Firebase Admin SDK; redirects unauthenticated requests to `/admin/login`

### Auth flow
1. User fills email + password in `AdminLogin.tsx`
2. `signInWithEmailAndPassword(auth, email, password)` → Firebase client SDK
3. `user.getIdToken()` → POST to `/api/auth/session` with `{ idToken }`
4. Server: `adminAuth.verifyIdToken(idToken)` → sets `admin_session` cookie (HttpOnly, SameSite=Strict, Secure)
5. Client redirects to `/admin`

### What is removed
- `ADMIN_PASSWORD` env var
- Any existing password-based middleware check

---

## Section 2: Editor Layout & Metadata Sidebar

### Layout
The editor page splits into two panels:

- **Left (main)**: MDXEditor — pure Markdown body only, no frontmatter block
- **Right (sidebar)**: collapsible 320px panel, toggled by a `⚙` icon button in the top bar

The sidebar is open by default. A single **Save** button lives in the top bar and is always visible regardless of sidebar state.

### Sidebar fields

| Field | Type | Behaviour |
|---|---|---|
| Title | text input | Required. Auto-generates slug on new posts (lowercase, hyphenated). Slug is editable. |
| Description | textarea | Short post summary / meta description |
| Featured Image | file upload + URL preview | Uploads via `POST /api/upload-image`, stores URL in state |
| Tags | chip input | Comma/Enter to add. Each tag is a chip with an `×` remove button. |
| Status | toggle | `Draft` / `Published` |
| Pub Date | date input | Defaults to today when switching to Published. Editable. |

### Frontmatter removal
The MDXEditor no longer shows or manages a YAML frontmatter block. The editor body is pure Markdown. Metadata lives exclusively in sidebar React state.

### On load (existing post)
- `slug` from query param → `GET /api/get-post?slug=X`
- Sidebar fields hydrate from `post.title`, `post.description`, `post.featuredImage`, `post.tags`, `post.status`, `post.publishedAt`
- Editor body = `post.body`

### On load (new post)
All sidebar fields are empty/defaults. Slug is empty until the user types a title.

---

## Section 3: Data Flow & Save Mechanism

### Firestore PostDocument mapping

| Sidebar field | Firestore field |
|---|---|
| Title | `title: string` |
| Slug | `slug: string` (also the document ID) |
| Description | `description: string` |
| Featured image URL | `featuredImage: string` |
| Tags | `tags: string[]` |
| Status toggle | `status: 'draft' \| 'published'` |
| Pub Date | `publishedAt: Timestamp` |

Body stored separately as `body: string`.

### Save flow
1. User clicks **Save**
2. `handleSave()` POSTs to `/api/save-post`:
   ```json
   {
     "meta": { "title", "slug", "description", "featuredImage", "tags", "status", "publishedAt" },
     "body": "<markdown string>"
   }
   ```
3. API writes to Firestore: `posts/{slug}` (merge)
4. On success: toast notification "Saved" (or "Published")

### Image upload flow
1. User selects a file in the Featured Image field
2. `POST /api/upload-image` with `multipart/form-data`
3. Server saves to `public/uploads/{uuid}.ext`
4. Returns `{ url: "/uploads/{uuid}.ext" }`
5. Sidebar sets `featuredImage` to that URL; preview renders immediately

### Auth middleware
`src/middleware.ts` intercepts every request to `/admin/*` and `/api/*`. If `admin_session` cookie is absent or the Firebase ID token is invalid/expired → 302 redirect to `/admin/login`. Valid session → passes through.

---

## Out of Scope (this iteration)
- Rich media embeds beyond images
- Multi-author support
- Image CDN / cloud storage (kept as local `public/uploads/`)
- Post deletion UI (can be done via Firebase Console for now)
- Comment system
