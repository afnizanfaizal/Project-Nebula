# Dashboard Analytics — Design Spec

**Date:** 2026-04-01  
**Status:** Approved

## Overview

Make the admin dashboard fully functional by replacing mock data with real analytics stored in Firestore. Tracks page views over time (30-day chart), top countries by visitor, and per-post view counts.

---

## 1. Data Model

**Firestore collection:** `analytics/daily/{YYYY-MM-DD}`

```ts
interface DailyAnalytics {
  total: number;                     // total page views that day (all posts combined)
  posts: Record<string, number>;     // { [slug]: viewCount }
  countries: Record<string, number>; // { [countryCode]: viewCount } e.g. { "MY": 12, "US": 4 }
}
```

Example document at `analytics/daily/2026-04-01`:
```json
{
  "total": 47,
  "posts": { "hello-world": 23, "astro-guide": 24 },
  "countries": { "MY": 28, "US": 10, "SG": 9 }
}
```

**Key properties:**
- Documents are created lazily — only on days with actual traffic. Missing days = 0 views.
- `posts/{slug}.views` continues to be kept in sync via batch write (backward-compatible with existing ViewCounter reads).
- The new `/api/track-view` endpoint is the sole writer for both collections.

---

## 2. Track-View API Endpoint

**Route:** `POST /api/track-view`  
**File:** `src/pages/api/track-view.ts`  
**Auth:** None (public — called by browser on every blog post view)

### Request
```ts
{ slug: string }
```

### Server Logic
1. Extract visitor IP from `x-forwarded-for` header, falling back to `request.socket.remoteAddress`.
2. Geo-lookup: `GET http://ip-api.com/json/{ip}?fields=countryCode` with a 500ms timeout.
3. On geo failure or timeout: use `countryCode = "XX"` — page view is still recorded.
4. Derive date key: `YYYY-MM-DD` in UTC.
5. Firestore batch write (atomic):
   - `analytics/daily/{date}`: `FieldValue.increment(1)` on `total`, `posts.{slug}`, `countries.{cc}` — uses `set(..., { merge: true })` so missing documents are created automatically.
   - `posts/{slug}`: `FieldValue.increment(1)` on `views`.
6. Read back the updated `posts/{slug}.views` and return `{ views: number }`.

### Response
```ts
{ views: number }
```

---

## 3. ViewCounter Update

**File:** `src/components/react/ViewCounter.tsx`

Replace the direct `incrementPostViews(slug)` call with a `fetch('/api/track-view', { method: 'POST', body: JSON.stringify({ slug }) })` call.

- Remove the `incrementPostViews` import from `firebase.ts`.
- The returned `{ views }` value is displayed in the counter, same as before.
- Error handling is unchanged: silently fail if the request errors.

---

## 4. Dashboard Data Loading (Server-Side)

**File:** `src/pages/admin/dashboard.astro`

On each dashboard load, the Astro page fetches analytics server-side using `firebase-admin`:

1. Compute the last 30 date keys (UTC, `YYYY-MM-DD` format).
2. Fetch all 30 `analytics/daily/{date}` documents in a single `getAll()` call.
3. Build the chart array: for each of the 30 dates, use the doc's `total` or `0` if missing.
4. Aggregate top countries: sum `countries` map across all 30 docs, sort descending, take top 5.
5. Map country codes to display names and flag emojis using a static lookup (~20 common countries hardcoded; unknown codes shown as the raw code with a 🌐 flag).
6. The existing `listPosts()` call already returns per-post data; `posts/{slug}.views` is read from the post documents to populate the "Recent Posts" view counts.

### New Props Added to AdminDashboard

```ts
interface AnalyticsProps {
  viewsChart: { date: string; views: number }[];          // 30 entries
  topCountries: { code: string; name: string; flag: string; views: number }[];
}
```

These are passed as props alongside the existing `posts` prop. No client-side Firebase reads needed for analytics.

---

## 5. AdminDashboard Component Update

**File:** `src/components/react/AdminDashboard.tsx`

- Remove `VIEWS_DATA`, `COUNTRY_DATA`, `MAX_COUNTRY` mock constants.
- Remove `loadingViews` state and `getPostViews` fetch loop — views now arrive as props from the server.
- Accept `viewsChart` and `topCountries` as props.
- Replace chart data source from `VIEWS_DATA` → `viewsChart` prop.
- Replace country list from `COUNTRY_DATA` → `topCountries` prop.
- Remove the "Sample data" amber badge from both chart and country widgets.
- Per-post view counts in the "Recent Posts" table now come from `posts[].views` (added to `PostData` type) passed from the server — no client-side fetch loop needed.

---

## 6. Files Changed

| File | Change |
|------|--------|
| `src/pages/api/track-view.ts` | **New** — server-side view tracking endpoint |
| `src/components/react/ViewCounter.tsx` | Replace `incrementPostViews` with fetch to `/api/track-view` |
| `src/pages/admin/dashboard.astro` | Fetch 30-day analytics + top countries server-side, pass as props |
| `src/components/react/AdminDashboard.tsx` | Replace mock data with props; remove client-side view fetching |
| `src/lib/firebase-admin.ts` | Add `getDailyAnalytics(dates)` helper; add `views` to `PostSummary` type and `listPosts()` mapping |

---

## 7. Out of Scope

- Hourly breakdown (daily granularity is sufficient)
- Per-post country breakdown (aggregate only)
- Real-time updates (dashboard refreshes on page load)
- Country data for `analytics/daily` docs older than the feature launch date (historical data will show 0 for countries)
