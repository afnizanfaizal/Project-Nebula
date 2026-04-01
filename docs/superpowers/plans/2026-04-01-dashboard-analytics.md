# Dashboard Analytics Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace all mock data in the admin dashboard with real analytics (daily page views chart, top countries, per-post views) stored in Firestore.

**Architecture:** A new server-side `/api/track-view` POST endpoint replaces the client-side `incrementPostViews` call; it geo-locates the visitor via ip-api.com, then batch-writes to `analytics/{YYYY-MM-DD}` (daily aggregate) and `posts/{slug}` (view counter). The dashboard reads 30 daily docs server-side and passes chart + country data as props to `AdminDashboard`.

**Tech Stack:** Astro (SSR, Node adapter), Firebase Admin SDK (Firestore), ip-api.com (free geo-IP, no key), React, Recharts, Vitest

---

## File Map

| Path | Status | Responsibility |
|------|--------|----------------|
| `src/lib/analytics-utils.ts` | **Create** | Pure functions: date range, chart builder, country aggregator, country lookup table |
| `src/lib/__tests__/analytics-utils.test.ts` | **Create** | Vitest unit tests for analytics-utils |
| `src/lib/firebase-admin.ts` | **Modify** | Add `DailyAnalytics` type, `views` to `PostSummary`, `getDailyAnalytics()` |
| `src/pages/api/track-view.ts` | **Create** | Server-side endpoint: geo-lookup + Firestore batch write |
| `src/components/react/ViewCounter.tsx` | **Modify** | Replace `incrementPostViews` with `fetch('/api/track-view')` |
| `src/pages/admin/dashboard.astro` | **Modify** | Fetch 30-day analytics server-side, pass as props |
| `src/components/react/AdminDashboard.tsx` | **Modify** | Accept analytics props, remove mock data + client-side view fetching |

---

## Task 1: Pure analytics utility functions (TDD)

**Files:**
- Create: `src/lib/analytics-utils.ts`
- Create: `src/lib/__tests__/analytics-utils.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `src/lib/__tests__/analytics-utils.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import {
  buildDateRange,
  buildChartData,
  aggregateTopCountries,
} from '../analytics-utils.js';

describe('buildDateRange', () => {
  it('returns the correct number of dates', () => {
    const result = buildDateRange(5);
    expect(result).toHaveLength(5);
  });

  it('returns dates in ascending order ending with today (UTC)', () => {
    const result = buildDateRange(3);
    const today = new Date();
    const todayKey = new Date(Date.UTC(
      today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()
    )).toISOString().slice(0, 10);
    expect(result[2]).toBe(todayKey);
  });

  it('returns YYYY-MM-DD formatted strings', () => {
    const result = buildDateRange(1);
    expect(result[0]).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe('buildChartData', () => {
  it('fills missing dates with 0', () => {
    const docs = { '2026-04-01': null, '2026-04-02': null };
    const result = buildChartData(docs, ['2026-04-01', '2026-04-02']);
    expect(result).toHaveLength(2);
    expect(result[0].views).toBe(0);
    expect(result[1].views).toBe(0);
  });

  it('uses the total from docs when present', () => {
    const docs = {
      '2026-04-01': { total: 42, posts: {}, countries: {} },
      '2026-04-02': null,
    };
    const result = buildChartData(docs, ['2026-04-01', '2026-04-02']);
    expect(result[0].views).toBe(42);
    expect(result[1].views).toBe(0);
  });

  it('formats dates as "Mon D" labels', () => {
    const docs = { '2026-04-01': null };
    const result = buildChartData(docs, ['2026-04-01']);
    // Apr 1 2026 is a Wednesday — label should be "Apr 1"
    expect(result[0].date).toBe('Apr 1');
  });
});

describe('aggregateTopCountries', () => {
  it('returns empty array for empty docs', () => {
    expect(aggregateTopCountries({}, 5)).toEqual([]);
  });

  it('sums country counts across multiple days', () => {
    const docs = {
      '2026-04-01': { total: 5, posts: {}, countries: { MY: 3, US: 2 } },
      '2026-04-02': { total: 4, posts: {}, countries: { MY: 1, SG: 3 } },
    };
    const result = aggregateTopCountries(docs, 5);
    const my = result.find((r) => r.code === 'MY')!;
    expect(my.views).toBe(4);
  });

  it('returns results sorted descending by views', () => {
    const docs = {
      'd': { total: 10, posts: {}, countries: { US: 1, MY: 9 } },
    };
    const result = aggregateTopCountries(docs, 5);
    expect(result[0].code).toBe('MY');
    expect(result[1].code).toBe('US');
  });

  it('respects the limit parameter', () => {
    const docs = {
      'd': { total: 6, posts: {}, countries: { A: 1, B: 2, C: 3, D: 4 } },
    };
    expect(aggregateTopCountries(docs, 2)).toHaveLength(2);
  });

  it('maps known country codes to names and flags', () => {
    const docs = { 'd': { total: 1, posts: {}, countries: { MY: 1 } } };
    const result = aggregateTopCountries(docs, 5);
    expect(result[0].name).toBe('Malaysia');
    expect(result[0].flag).toBe('🇲🇾');
  });

  it('uses raw code and globe flag for unknown country codes', () => {
    const docs = { 'd': { total: 1, posts: {}, countries: { ZZ: 1 } } };
    const result = aggregateTopCountries(docs, 5);
    expect(result[0].name).toBe('ZZ');
    expect(result[0].flag).toBe('🌐');
  });

  it('skips null docs without throwing', () => {
    const docs = { '2026-04-01': null, '2026-04-02': { total: 2, posts: {}, countries: { SG: 2 } } };
    const result = aggregateTopCountries(docs, 5);
    expect(result).toHaveLength(1);
    expect(result[0].code).toBe('SG');
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
cd "/Users/afnizanfaizal/Desktop/Projects/New Blog"
npx vitest run src/lib/__tests__/analytics-utils.test.ts
```

Expected: FAIL — `Cannot find module '../analytics-utils.js'`

- [ ] **Step 3: Create `src/lib/analytics-utils.ts`**

```typescript
// src/lib/analytics-utils.ts

export interface DailyData {
  total: number;
  posts: Record<string, number>;
  countries: Record<string, number>;
}

export interface ChartPoint {
  date: string;
  views: number;
}

export interface CountryEntry {
  code: string;
  name: string;
  flag: string;
  views: number;
}

const COUNTRY_INFO: Record<string, { name: string; flag: string }> = {
  MY: { name: 'Malaysia',       flag: '🇲🇾' },
  SG: { name: 'Singapore',      flag: '🇸🇬' },
  ID: { name: 'Indonesia',      flag: '🇮🇩' },
  US: { name: 'United States',  flag: '🇺🇸' },
  GB: { name: 'United Kingdom', flag: '🇬🇧' },
  AU: { name: 'Australia',      flag: '🇦🇺' },
  CA: { name: 'Canada',         flag: '🇨🇦' },
  DE: { name: 'Germany',        flag: '🇩🇪' },
  FR: { name: 'France',         flag: '🇫🇷' },
  JP: { name: 'Japan',          flag: '🇯🇵' },
  IN: { name: 'India',          flag: '🇮🇳' },
  BR: { name: 'Brazil',         flag: '🇧🇷' },
  NL: { name: 'Netherlands',    flag: '🇳🇱' },
  SE: { name: 'Sweden',         flag: '🇸🇪' },
  NO: { name: 'Norway',         flag: '🇳🇴' },
  PH: { name: 'Philippines',    flag: '🇵🇭' },
  TH: { name: 'Thailand',       flag: '🇹🇭' },
  VN: { name: 'Vietnam',        flag: '🇻🇳' },
  KR: { name: 'South Korea',    flag: '🇰🇷' },
  CN: { name: 'China',          flag: '🇨🇳' },
  RU: { name: 'Russia',         flag: '🇷🇺' },
  PK: { name: 'Pakistan',       flag: '🇵🇰' },
  BD: { name: 'Bangladesh',     flag: '🇧🇩' },
  NZ: { name: 'New Zealand',    flag: '🇳🇿' },
  ZA: { name: 'South Africa',   flag: '🇿🇦' },
  EG: { name: 'Egypt',          flag: '🇪🇬' },
  NG: { name: 'Nigeria',        flag: '🇳🇬' },
  IT: { name: 'Italy',          flag: '🇮🇹' },
  ES: { name: 'Spain',          flag: '🇪🇸' },
  PL: { name: 'Poland',         flag: '🇵🇱' },
};

/**
 * Returns an array of `days` date strings (YYYY-MM-DD, UTC) ending with today.
 */
export function buildDateRange(days: number): string[] {
  const now = new Date();
  const todayUTC = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const result: string[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const ts = todayUTC - i * 86_400_000;
    result.push(new Date(ts).toISOString().slice(0, 10));
  }
  return result;
}

/**
 * Converts a map of date → DailyData into an ordered chart array.
 * Missing dates (null) produce a 0-view entry.
 */
export function buildChartData(
  docs: Record<string, DailyData | null>,
  dates: string[],
): ChartPoint[] {
  return dates.map((dateKey) => {
    const [year, month, day] = dateKey.split('-').map(Number);
    const label = new Date(year, month - 1, day).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
    return { date: label, views: docs[dateKey]?.total ?? 0 };
  });
}

/**
 * Aggregates country view counts across all daily docs, sorts descending,
 * and returns up to `limit` entries with display names and flag emojis.
 */
export function aggregateTopCountries(
  docs: Record<string, DailyData | null>,
  limit: number,
): CountryEntry[] {
  const totals: Record<string, number> = {};
  for (const doc of Object.values(docs)) {
    if (!doc) continue;
    for (const [cc, count] of Object.entries(doc.countries)) {
      totals[cc] = (totals[cc] ?? 0) + count;
    }
  }
  return Object.entries(totals)
    .sort(([, a], [, b]) => b - a)
    .slice(0, limit)
    .map(([code, views]) => ({
      code,
      name: COUNTRY_INFO[code]?.name ?? code,
      flag: COUNTRY_INFO[code]?.flag ?? '🌐',
      views,
    }));
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npx vitest run src/lib/__tests__/analytics-utils.test.ts
```

Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/analytics-utils.ts src/lib/__tests__/analytics-utils.test.ts
git commit -m "feat: add analytics utility functions with tests"
```

---

## Task 2: Update `firebase-admin.ts` — add `DailyAnalytics`, `views` to `PostSummary`, `getDailyAnalytics()`

**Files:**
- Modify: `src/lib/firebase-admin.ts`

- [ ] **Step 1: Add `DailyAnalytics` interface and update `PostSummary`**

In `src/lib/firebase-admin.ts`, find the `PostSummary` interface and add `views`:

```typescript
export interface PostSummary {
  slug:          string;
  title:         string;
  description:   string;
  pubDate:       string;
  draft:         boolean;
  featured:      boolean;
  tags:          string[];
  featuredImage?: string;
  views:         number;       // ← add this line
}
```

Add the new `DailyAnalytics` interface after `PostSummary`:

```typescript
export interface DailyAnalytics {
  total:     number;
  posts:     Record<string, number>;
  countries: Record<string, number>;
}
```

- [ ] **Step 2: Update `listPosts()` to include `views`**

In `src/lib/firebase-admin.ts`, find the `listPosts()` function's `return snap.docs.map(...)` block. Add `views` to the returned object:

```typescript
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
      views:         d.views ?? 0,    // ← add this line
    };
  });
```

- [ ] **Step 3: Add `getDailyAnalytics()` helper**

Append to the end of `src/lib/firebase-admin.ts`:

```typescript
/**
 * Fetch multiple daily analytics documents by date key (YYYY-MM-DD).
 * Returns a map of dateKey → DailyAnalytics (or null if the doc doesn't exist).
 */
export async function getDailyAnalytics(
  dates: string[],
): Promise<Record<string, DailyAnalytics | null>> {
  if (dates.length === 0) return {};
  const refs = dates.map((d) => adminDb.collection('analytics').doc(d));
  const snaps = await adminDb.getAll(...refs);
  const result: Record<string, DailyAnalytics | null> = {};
  for (let i = 0; i < dates.length; i++) {
    const snap = snaps[i];
    result[dates[i]] = snap.exists ? (snap.data() as DailyAnalytics) : null;
  }
  return result;
}
```

- [ ] **Step 4: Run existing tests to confirm nothing is broken**

```bash
npx vitest run
```

Expected: All tests PASS (no TypeScript errors, no test failures).

- [ ] **Step 5: Commit**

```bash
git add src/lib/firebase-admin.ts
git commit -m "feat: add DailyAnalytics type, views to PostSummary, getDailyAnalytics helper"
```

---

## Task 3: Create `/api/track-view` endpoint

**Files:**
- Create: `src/pages/api/track-view.ts`

- [ ] **Step 1: Create the endpoint**

Create `src/pages/api/track-view.ts`:

```typescript
// src/pages/api/track-view.ts
import type { APIRoute } from 'astro';
import { adminDb } from '../../lib/firebase-admin.js';
import { FieldValue } from 'firebase-admin/firestore';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  // Parse body
  let slug: string;
  try {
    const body = await request.json();
    slug = body?.slug;
    if (!slug || typeof slug !== 'string') {
      return new Response(JSON.stringify({ error: 'slug required' }), { status: 400 });
    }
  } catch {
    return new Response(JSON.stringify({ error: 'invalid json' }), { status: 400 });
  }

  // Derive visitor IP
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    '127.0.0.1';

  // Geo-lookup with 500ms timeout
  let countryCode = 'XX';
  try {
    const controller = new AbortController();
    const tid = setTimeout(() => controller.abort(), 500);
    const geoRes = await fetch(`http://ip-api.com/json/${ip}?fields=countryCode`, {
      signal: controller.signal,
    });
    clearTimeout(tid);
    if (geoRes.ok) {
      const geoData = await geoRes.json();
      if (typeof geoData.countryCode === 'string' && geoData.countryCode.length === 2) {
        countryCode = geoData.countryCode;
      }
    }
  } catch {
    // Geo failure is non-fatal — view is still recorded under 'XX'
  }

  // UTC date key
  const now = new Date();
  const dateKey = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  ).toISOString().slice(0, 10);

  const dailyRef = adminDb.collection('analytics').doc(dateKey);
  const postRef  = adminDb.collection('posts').doc(slug);

  // Write to daily analytics — use update() (dot-notation increments) with
  // set() fallback for the first view of a new day.
  try {
    await dailyRef.update({
      total:                          FieldValue.increment(1),
      [`posts.${slug}`]:              FieldValue.increment(1),
      [`countries.${countryCode}`]:   FieldValue.increment(1),
    });
  } catch (err: any) {
    // gRPC NOT_FOUND (code 5) — doc doesn't exist yet, create it
    if (err?.code === 5) {
      await dailyRef.set({
        total:     1,
        posts:     { [slug]: 1 },
        countries: { [countryCode]: 1 },
      });
    } else {
      throw err;
    }
  }

  // Increment post view counter and read back the new total
  await postRef.update({ views: FieldValue.increment(1) });
  const postSnap = await postRef.get();
  const views = (postSnap.data()?.views as number) ?? 1;

  return new Response(JSON.stringify({ views }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
```

- [ ] **Step 2: Run existing tests to confirm no regressions**

```bash
npx vitest run
```

Expected: All tests PASS.

- [ ] **Step 3: Commit**

```bash
git add src/pages/api/track-view.ts
git commit -m "feat: add /api/track-view endpoint with geo-lookup and Firestore daily aggregates"
```

---

## Task 4: Update `ViewCounter.tsx` — replace Firebase SDK call with fetch

**Files:**
- Modify: `src/components/react/ViewCounter.tsx`

- [ ] **Step 1: Replace the file contents**

Overwrite `src/components/react/ViewCounter.tsx` with:

```typescript
// src/components/react/ViewCounter.tsx
import { useEffect, useState } from 'react';

interface Props {
  slug: string;
}

export default function ViewCounter({ slug }: Props) {
  const [views, setViews] = useState<number | null>(null);

  useEffect(() => {
    fetch('/api/track-view', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug }),
    })
      .then((res) => {
        if (!res.ok) throw new Error('track-view failed');
        return res.json() as Promise<{ views: number }>;
      })
      .then((data) => setViews(data.views))
      .catch(() => {
        // Silently fail — view counter is non-critical
      });
  }, [slug]);

  if (views === null) {
    return (
      <span
        className="inline-block w-12 h-4 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse"
        aria-hidden="true"
      />
    );
  }

  return (
    <span className="text-sm text-zinc-500 dark:text-zinc-400">
      {views.toLocaleString()} views
    </span>
  );
}
```

- [ ] **Step 2: Run existing tests to confirm no regressions**

```bash
npx vitest run
```

Expected: All tests PASS.

- [ ] **Step 3: Commit**

```bash
git add src/components/react/ViewCounter.tsx
git commit -m "feat: ViewCounter calls /api/track-view instead of Firebase client SDK directly"
```

---

## Task 5: Update `dashboard.astro` — fetch analytics server-side

**Files:**
- Modify: `src/pages/admin/dashboard.astro`

- [ ] **Step 1: Replace the file contents**

Overwrite `src/pages/admin/dashboard.astro` with:

```astro
---
export const prerender = false;
import AdminLayout from '../../layouts/AdminLayout.astro';
import AdminDashboard from '../../components/react/AdminDashboard';
import { listPosts, getDailyAnalytics } from '../../lib/firebase-admin.js';
import { buildDateRange, buildChartData, aggregateTopCountries } from '../../lib/analytics-utils.js';

const [postList, analyticsMap] = await Promise.all([
  listPosts(),
  getDailyAnalytics(buildDateRange(30)),
]);

const dates      = buildDateRange(30);
const viewsChart = buildChartData(analyticsMap, dates);
const topCountries = aggregateTopCountries(analyticsMap, 5);

const posts = postList.map((p) => ({
  slug:        p.slug,
  title:       p.title,
  pubDate:     p.pubDate,
  draft:       p.draft,
  tags:        p.tags,
  description: p.description,
  featured:    p.featured,
  views:       p.views,
}));
---
<AdminLayout title="Dashboard — Admin">
  <AdminDashboard
    posts={posts}
    viewsChart={viewsChart}
    topCountries={topCountries}
    client:only="react"
  />
</AdminLayout>
```

- [ ] **Step 2: Run existing tests to confirm no regressions**

```bash
npx vitest run
```

Expected: All tests PASS.

- [ ] **Step 3: Commit**

```bash
git add src/pages/admin/dashboard.astro
git commit -m "feat: dashboard.astro fetches 30-day analytics server-side"
```

---

## Task 6: Update `AdminDashboard.tsx` — replace mock data with props

**Files:**
- Modify: `src/components/react/AdminDashboard.tsx`

- [ ] **Step 1: Update imports and type definitions**

At the top of `src/components/react/AdminDashboard.tsx`, replace the existing imports and type block:

```typescript
// src/components/react/AdminDashboard.tsx
// Full-screen admin dashboard — sidebar + overview + posts management
import { useState, useMemo, useCallback } from 'react';
import type { ReactNode } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { ChartPoint, CountryEntry } from '../../lib/analytics-utils.js';

// ── Types ────────────────────────────────────────────────────────────

export interface PostData {
  slug:        string;
  title:       string;
  pubDate:     string;
  draft:       boolean;
  tags:        string[];
  description: string;
  featured:    boolean;
  views:       number;
}

interface Props {
  posts:        PostData[];
  viewsChart:   ChartPoint[];
  topCountries: CountryEntry[];
}
```

- [ ] **Step 2: Remove mock data constants**

Delete the following lines (the entire VIEWS_SEED, VIEWS_DATA, COUNTRY_DATA, and MAX_COUNTRY block — roughly lines 34–56 in the original):

```typescript
// ── Mock analytics data (replace with real analytics API) ────────────

const VIEWS_SEED = [
  45, 62, 78, 55, 90, 123, 145, 134, 167, 189,
  156, 178, 203, 221, 198, 234, 245, 189, 267, 289,
  312, 298, 321, 345, 334, 367, 389, 412, 398, 445,
];

const VIEWS_DATA = VIEWS_SEED.map((v, i) => {
  const d = new Date();
  d.setDate(d.getDate() - (29 - i));
  return {
    date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    views: v,
  };
});

const COUNTRY_DATA = [
  { country: 'Malaysia',       flag: '🇲🇾', views: 3240 },
  { country: 'Singapore',      flag: '🇸🇬', views: 1890 },
  { country: 'Indonesia',      flag: '🇮🇩', views: 1420 },
  { country: 'United States',  flag: '🇺🇸', views: 980  },
  { country: 'United Kingdom', flag: '🇬🇧', views: 650  },
];
const MAX_COUNTRY = COUNTRY_DATA[0].views;
```

- [ ] **Step 3: Update `OverviewSection` signature and internals**

Replace the `OverviewSection` function (from `function OverviewSection` down to its closing `}`) with:

```typescript
function OverviewSection({
  posts,
  viewsChart,
  topCountries,
  totalViews,
  publishedCount,
  draftCount,
  featuredCount,
}: {
  posts:         PostData[];
  viewsChart:    ChartPoint[];
  topCountries:  CountryEntry[];
  totalViews:    number;
  publishedCount: number;
  draftCount:    number;
  featuredCount: number;
}) {
  const maxCountry = topCountries[0]?.views ?? 1;

  return (
    <div className="space-y-6 max-w-6xl">
      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Total Views"
          value={totalViews.toLocaleString()}
          colorClass="bg-blue-500/10 text-blue-400"
          icon={<Icon.Eye />}
        />
        <KpiCard
          label="Published"
          value={publishedCount}
          colorClass="bg-emerald-500/10 text-emerald-400"
          icon={<Icon.Document />}
        />
        <KpiCard
          label="Drafts"
          value={draftCount}
          colorClass="bg-amber-500/10 text-amber-400"
          icon={<Icon.Pencil />}
        />
        <KpiCard
          label="Featured"
          value={featuredCount}
          colorClass="bg-purple-500/10 text-purple-400"
          icon={<Icon.Star />}
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Area chart */}
        <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-sm font-semibold text-zinc-100">Page Views</h2>
              <p className="text-xs text-zinc-500 mt-0.5">Last 30 days</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={viewsChart} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="blueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fill: '#52525b', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                interval={6}
              />
              <YAxis
                tick={{ fill: '#52525b', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                width={38}
              />
              <Tooltip content={<ChartTooltip />} cursor={{ stroke: '#3f3f46', strokeWidth: 1 }} />
              <Area
                type="monotone"
                dataKey="views"
                stroke="#3b82f6"
                strokeWidth={2}
                fill="url(#blueGrad)"
                dot={false}
                activeDot={{ r: 3, fill: '#3b82f6', strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Country breakdown */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-sm font-semibold text-zinc-100">Top Countries</h2>
              <p className="text-xs text-zinc-500 mt-0.5">By visitors</p>
            </div>
          </div>
          {topCountries.length === 0 ? (
            <p className="text-xs text-zinc-500 mt-2">No visitor data yet.</p>
          ) : (
            <div className="space-y-4">
              {topCountries.map((c) => (
                <div key={c.code}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-sm leading-none" aria-hidden="true">{c.flag}</span>
                      <span className="text-xs text-zinc-300">{c.name}</span>
                    </div>
                    <span className="text-xs text-zinc-500 font-mono tabular-nums">
                      {c.views.toLocaleString()}
                    </span>
                  </div>
                  <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full transition-all duration-700"
                      style={{ width: `${(c.views / maxCountry) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent posts summary */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-zinc-100">Recent Posts</h2>
          <a
            href="/admin/editor"
            className="text-xs text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1"
          >
            New post <Icon.ArrowRight className="w-3 h-3" />
          </a>
        </div>
        {posts.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-zinc-500">No posts yet.</div>
        ) : (
          <div className="divide-y divide-zinc-800">
            {posts.slice(0, 5).map((post) => (
              <div key={post.slug} className="px-5 py-3.5 flex items-center gap-4 hover:bg-zinc-800/30 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-zinc-100 truncate">{post.title}</p>
                  <p className="text-xs text-zinc-500 font-mono mt-0.5">{post.slug}</p>
                </div>
                <StatusBadge draft={post.draft} />
                <span className="text-xs text-zinc-500 font-mono tabular-nums hidden sm:block w-16 text-right">
                  {post.views.toLocaleString()} views
                </span>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <a
                    href={`/blog/${post.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded text-zinc-600 hover:text-zinc-400 hover:bg-zinc-800 transition-colors"
                    aria-label={`View ${post.title}`}
                  >
                    <Icon.Eye className="w-3.5 h-3.5" />
                  </a>
                  <a
                    href={`/admin/editor?slug=${post.slug}`}
                    className="p-1.5 rounded text-zinc-600 hover:text-blue-400 hover:bg-blue-950/40 transition-colors"
                    aria-label={`Edit ${post.title}`}
                  >
                    <Icon.Pencil className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Update `PostsSection` signature and internals**

Replace the `PostsSection` function signature and the two view-related cells with:

```typescript
function PostsSection({
  posts,
  onDeleteRequest,
}: {
  posts:           PostData[];
  onDeleteRequest: (post: PostData) => void;
}) {
```

In the table body, replace the loading-views cell:

```typescript
                    <td className="px-3 py-4 text-right hidden sm:table-cell">
                      <span className="text-xs text-zinc-400 font-mono tabular-nums">
                        {post.views.toLocaleString()}
                      </span>
                    </td>
```

- [ ] **Step 5: Update the main `AdminDashboard` component**

Replace the main `AdminDashboard` function signature and body with:

```typescript
export default function AdminDashboard({ posts: initialPosts, viewsChart, topCountries }: Props) {
  const [section, setSection]       = useState<'overview' | 'posts'>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [posts, setPosts]           = useState(initialPosts);
  const [deleteTarget, setDeleteTarget] = useState<PostData | null>(null);
  const [deleting, setDeleting]     = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [toast, setToast]           = useState('');

  const totalViews    = useMemo(() => posts.reduce((a, p) => a + p.views, 0), [posts]);
  const publishedCount = posts.filter((p) => !p.draft).length;
  const draftCount     = posts.filter((p) =>  p.draft).length;
  const featuredCount  = posts.filter((p) =>  p.featured).length;

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  }, []);

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError('');
    try {
      const res = await fetch(
        `/api/admin/delete-post?slug=${encodeURIComponent(deleteTarget.slug)}`,
        { method: 'DELETE' }
      );
      if (!res.ok) throw new Error('Failed');
      setPosts((prev) => prev.filter((p) => p.slug !== deleteTarget.slug));
      const deleted = deleteTarget;
      setDeleteTarget(null);
      showToast(`"${deleted.title}" deleted`);
    } catch {
      setDeleteError('Could not delete. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/logout', { method: 'POST' });
    window.location.href = '/admin';
  };
```

And update the JSX where `OverviewSection` and `PostsSection` are called (in the `<main>` block):

```tsx
          {section === 'overview' && (
            <OverviewSection
              posts={posts}
              viewsChart={viewsChart}
              topCountries={topCountries}
              totalViews={totalViews}
              publishedCount={publishedCount}
              draftCount={draftCount}
              featuredCount={featuredCount}
            />
          )}
          {section === 'posts' && (
            <PostsSection
              posts={posts}
              onDeleteRequest={setDeleteTarget}
            />
          )}
```

- [ ] **Step 6: Run all tests**

```bash
npx vitest run
```

Expected: All tests PASS.

- [ ] **Step 7: Commit**

```bash
git add src/components/react/AdminDashboard.tsx
git commit -m "feat: AdminDashboard uses real analytics props, removes mock data and client-side view fetching"
```

---

## Task 7: Manual smoke test

- [ ] **Step 1: Start dev server**

```bash
npm run dev
```

- [ ] **Step 2: Visit a blog post**

Open `http://localhost:4321/blog/<any-slug>`. The ViewCounter should show a number after a brief moment. Check browser DevTools Network tab — confirm a `POST /api/track-view` request returns `200` with `{ "views": N }`.

- [ ] **Step 3: Check Firestore**

In the Firebase console, verify:
- `analytics/{today's date}` document exists with `total`, `posts`, and `countries` fields incremented.
- `posts/{slug}.views` has been incremented.

- [ ] **Step 4: Visit the dashboard**

Open `http://localhost:4321/admin/dashboard`. Confirm:
- The "Page Views" area chart has no "Sample data" badge and shows real (possibly 0-heavy) data.
- The "Top Countries" panel shows real entries (or "No visitor data yet." if no geo data yet).
- The "Recent Posts" table shows view counts directly (no loading skeleton).
- The KPI card "Total Views" shows the correct sum.

- [ ] **Step 5: Final commit (if any cleanup needed)**

```bash
git add -p   # review any remaining changes
git commit -m "chore: dashboard analytics smoke test cleanup"
```
