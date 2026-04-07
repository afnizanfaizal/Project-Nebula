// src/components/react/AdminDashboard.tsx
// Full-screen admin dashboard — sidebar + overview + posts management
import { useState, useMemo, useCallback, useEffect } from 'react';
import type { ReactNode } from 'react';
import ProfileEditor from './ProfileEditor';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
// ── Types ────────────────────────────────────────────────────────────

import type { ChartPoint, CountryEntry } from '../../lib/analytics-utils';

export interface PostData {
  slug: string;
  title: string;
  pubDate: string;
  draft: boolean;
  tags: string[];
  description: string;
  featured: boolean;
  views: number;
  isProject?: boolean;
}

interface Props {
  posts: PostData[];
  viewsChart: ChartPoint[];
  topCountries: CountryEntry[];
}

// ── Inline SVG icons (Heroicons outline 24px) ────────────────────────

const Icon = {
  Grid: (p: { className?: string }) => (
    <svg className={p.className ?? 'w-4 h-4'} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" />
    </svg>
  ),
  Document: (p: { className?: string }) => (
    <svg className={p.className ?? 'w-4 h-4'} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
    </svg>
  ),
  Pencil: (p: { className?: string }) => (
    <svg className={p.className ?? 'w-4 h-4'} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
    </svg>
  ),
  Eye: (p: { className?: string }) => (
    <svg className={p.className ?? 'w-4 h-4'} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.964-7.178Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    </svg>
  ),
  Trash: (p: { className?: string }) => (
    <svg className={p.className ?? 'w-4 h-4'} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
    </svg>
  ),
  Plus: (p: { className?: string }) => (
    <svg className={p.className ?? 'w-4 h-4'} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  ),
  Bars: (p: { className?: string }) => (
    <svg className={p.className ?? 'w-5 h-5'} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
    </svg>
  ),
  ArrowRight: (p: { className?: string }) => (
    <svg className={p.className ?? 'w-4 h-4'} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
    </svg>
  ),
  Globe: (p: { className?: string }) => (
    <svg className={p.className ?? 'w-4 h-4'} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253M3.284 14.253A8.959 8.959 0 0 1 3 12c0-1.268.26-2.476.727-3.582" />
    </svg>
  ),
  Star: (p: { className?: string }) => (
    <svg className={p.className ?? 'w-4 h-4'} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
    </svg>
  ),
  Logout: (p: { className?: string }) => (
    <svg className={p.className ?? 'w-4 h-4'} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 9V5.25A2.25 2.25 0 0 1 10.5 3h6a2.25 2.25 0 0 1 2.25 2.25v13.5A2.25 2.25 0 0 1 16.5 21h-6a2.25 2.25 0 0 1-2.25-2.25V15m-3 0-3-3m0 0 3-3m-3 3H15" />
    </svg>
  ),
  Photo: (p: { className?: string }) => (
    <svg className={p.className ?? 'w-4 h-4'} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
    </svg>
  ),
  Folder: (p: { className?: string }) => (
    <svg className={p.className ?? 'w-4 h-4'} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z" />
    </svg>
  ),
};

// ── Recharts custom tooltip ──────────────────────────────────────────

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 shadow-xl text-xs">
      <p className="text-zinc-400 mb-0.5">{label}</p>
      <p className="text-zinc-100 font-mono font-semibold tabular-nums">
        {payload[0].value.toLocaleString()} views
      </p>
    </div>
  );
}

// ── Shared sub-components ────────────────────────────────────────────

function StatusBadge({ draft }: { draft: boolean }) {
  return draft ? (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20 whitespace-nowrap">
      Draft
    </span>
  ) : (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 whitespace-nowrap">
      Published
    </span>
  );
}

function TypeBadge({ isProject, tags }: { isProject?: boolean, tags: string[] }) {
  const isProj = isProject || tags.some(t => t.toLowerCase() === 'project');
  return isProj ? (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20 whitespace-nowrap">
      Project
    </span>
  ) : (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-zinc-700/30 text-zinc-400 border border-zinc-700/50 whitespace-nowrap">
      Post
    </span>
  );
}

function KpiCard({
  label,
  value,
  loading,
  colorClass,
  icon,
}: {
  label: string;
  value: string | number;
  loading?: boolean;
  colorClass: string;
  icon: ReactNode;
}) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider">{label}</span>
        <span className={`w-8 h-8 rounded-lg flex items-center justify-center ${colorClass}`}>
          {icon}
        </span>
      </div>
      {loading ? (
        <div className="h-8 w-20 bg-zinc-800 rounded animate-pulse" />
      ) : (
        <p className="text-2xl font-mono font-semibold text-zinc-100 tabular-nums">{value}</p>
      )}
    </div>
  );
}

// ── Overview section ─────────────────────────────────────────────────

function OverviewSection({
  posts,
  viewsChart,
  topCountries,
  totalViews,
  publishedCount,
  draftCount,
  featuredCount,
}: {
  posts: PostData[];
  viewsChart: ChartPoint[];
  topCountries: CountryEntry[];
  totalViews: number;
  publishedCount: number;
  draftCount: number;
  featuredCount: number;
}) {
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
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.35} />
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
                      style={{ width: `${topCountries[0] ? (c.views / topCountries[0].views) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Popular posts summary */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-zinc-100">Popular Posts</h2>
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
            {[...posts].sort((a, b) => b.views - a.views).slice(0, 5).map((post) => (
              <div key={post.slug} className="px-5 py-3.5 flex items-center gap-4 hover:bg-zinc-800/30 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-zinc-100 truncate">{post.title}</p>
                  <p className="text-xs text-zinc-500 font-mono mt-0.5">{post.slug}</p>
                </div>
                <TypeBadge isProject={post.isProject} tags={post.tags} />
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
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Posts section ─────────────────────────────────────────────────────

function PostsTable({
  title,
  posts,
  emptyMessage,
  emptyButtonLabel,
  onDeleteRequest,
}: {
  title: string;
  posts: PostData[];
  emptyMessage: string;
  emptyButtonLabel: string;
  onDeleteRequest: (post: PostData) => void;
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const totalPages = Math.ceil(posts.length / itemsPerPage);
  const validPage = Math.max(1, Math.min(currentPage, totalPages || 1));
  const startIndex = (validPage - 1) * itemsPerPage;
  const paginatedPosts = posts.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden mb-8">
      <div className="px-5 py-4 border-b border-zinc-800">
        <h2 className="text-sm font-semibold text-zinc-100">{title}</h2>
        <p className="text-xs text-zinc-500 mt-0.5">
          {posts.length} {posts.length === 1 ? 'post' : 'posts'} total
        </p>
      </div>

      {posts.length === 0 ? (
        <div className="py-16 text-center">
          <Icon.Document className="w-8 h-8 text-zinc-700 mx-auto mb-3" />
          <p className="text-sm text-zinc-500 mb-4">{emptyMessage}</p>
          <a
            href="/admin/editor"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition-colors"
          >
            <Icon.Plus className="w-3.5 h-3.5" />
            {emptyButtonLabel}
          </a>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-900/50">
                <th className="px-5 py-3 text-left text-[11px] font-medium text-zinc-500 uppercase tracking-wider">
                  Title
                </th>
                <th className="px-3 py-3 text-left text-[11px] font-medium text-zinc-500 uppercase tracking-wider hidden sm:table-cell">
                  Date
                </th>
                <th className="px-3 py-3 text-left text-[11px] font-medium text-zinc-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-3 py-3 text-left text-[11px] font-medium text-zinc-500 uppercase tracking-wider hidden md:table-cell">
                  Featured
                </th>
                <th className="px-3 py-3 text-right text-[11px] font-medium text-zinc-500 uppercase tracking-wider hidden sm:table-cell">
                  Views
                </th>
                <th className="px-5 py-3 text-right text-[11px] font-medium text-zinc-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {paginatedPosts.map((post) => (
                <tr key={post.slug} className="hover:bg-zinc-800/30 transition-colors group">
                  <td className="px-5 py-4">
                    <p className="text-sm font-medium text-zinc-100 leading-snug">{post.title}</p>
                    <p className="text-[11px] text-zinc-600 font-mono mt-0.5">{post.slug}</p>
                  </td>
                  <td className="px-3 py-4 text-xs text-zinc-400 whitespace-nowrap hidden sm:table-cell">
                    {new Date(post.pubDate).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </td>
                  <td className="px-3 py-4">
                    <StatusBadge draft={post.draft} />
                  </td>
                  <td className="px-3 py-4 hidden md:table-cell">
                    {post.featured ? (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20">
                        <Icon.Star className="w-2.5 h-2.5" />
                        Featured
                      </span>
                    ) : (
                      <span className="text-[10px] text-zinc-600">No</span>
                    )}
                  </td>
                  <td className="px-3 py-4 text-right hidden sm:table-cell">
                    <span className="text-xs text-zinc-400 font-mono tabular-nums">
                      {post.views.toLocaleString()}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1.5 justify-end">
                      <a
                        href={`/blog/${post.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-md text-zinc-600 hover:text-zinc-300 hover:bg-zinc-800 transition-colors"
                        aria-label={`View "${post.title}"`}
                        title="View"
                      >
                        <Icon.Eye className="w-3.5 h-3.5" />
                      </a>
                      <a
                        href={`/admin/editor?slug=${post.slug}`}
                        className="p-1.5 rounded-md text-zinc-600 hover:text-blue-400 hover:bg-blue-950/40 transition-colors"
                        aria-label={`Edit "${post.title}"`}
                        title="Edit"
                      >
                        <Icon.Pencil className="w-3.5 h-3.5" />
                      </a>
                      <button
                        type="button"
                        onClick={() => onDeleteRequest(post)}
                        className="p-1.5 rounded-md text-zinc-600 hover:text-red-400 hover:bg-red-950/40 transition-colors cursor-pointer"
                        aria-label={`Delete "${post.title}"`}
                        title="Delete"
                      >
                        <Icon.Trash className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {totalPages > 1 && (
            <div className="px-5 py-3 border-t border-zinc-800 flex items-center justify-between bg-zinc-900/50">
              <span className="text-xs text-zinc-500">
                Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, posts.length)} of {posts.length} entries
              </span>
              <div className="flex gap-1">
                <button
                  type="button"
                  disabled={validPage === 1}
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  className="px-2 py-1 rounded border border-zinc-700 text-xs font-medium text-zinc-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-zinc-800 cursor-pointer"
                >
                  Prev
                </button>
                <button
                  type="button"
                  disabled={validPage === totalPages}
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  className="px-2 py-1 rounded border border-zinc-700 text-xs font-medium text-zinc-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-zinc-800 cursor-pointer"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function PostsSection({
  posts,
  onDeleteRequest,
}: {
  posts: PostData[];
  onDeleteRequest: (post: PostData) => void;
}) {
  const regularPosts = posts.filter(p => !p.isProject && !p.tags.some(t => t.toLowerCase() === 'project'));

  return (
    <div className="max-w-6xl">
      <PostsTable
        title="All Posts"
        posts={regularPosts}
        emptyMessage="No posts yet."
        emptyButtonLabel="Create your first post"
        onDeleteRequest={onDeleteRequest}
      />
    </div>
  );
}

function ProjectsSection({
  posts,
  onDeleteRequest,
}: {
  posts: PostData[];
  onDeleteRequest: (post: PostData) => void;
}) {
  const projectPosts = posts.filter(p => p.isProject || p.tags.some(t => t.toLowerCase() === 'project'));

  return (
    <div className="max-w-6xl">
      <PostsTable
        title="Projects"
        posts={projectPosts}
        emptyMessage="No projects yet."
        emptyButtonLabel="Create your first project"
        onDeleteRequest={onDeleteRequest}
      />
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────
import MediaManager from './MediaManager';

// ── About section (self-fetching) ─────────────────────────────────────────

interface ProfileData {
  name: string; title: string; bio: string;
  profilePhoto: string; skills: string[];
}

function AboutSection() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/about')
      .then(r => r.json())
      .then(data => { setProfile(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/10 border-t-indigo-500" />
      </div>
    );
  }

  return <ProfileEditor initialProfile={profile ?? { name: '', title: '', bio: '', profilePhoto: '', skills: [] }} />;
}

export default function AdminDashboard({ posts: initialPosts, viewsChart, topCountries }: Props) {
  const [section, setSection] = useState<'overview' | 'posts' | 'projects' | 'media' | 'about'>(() => {
    if (typeof window !== 'undefined') {
      const tab = new URLSearchParams(window.location.search).get('tab');
      if (tab === 'posts' || tab === 'projects' || tab === 'media' || tab === 'overview' || tab === 'about') return tab as 'overview' | 'posts' | 'projects' | 'media' | 'about';
    }
    return 'overview';
  });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [posts, setPosts] = useState(initialPosts);
  const [deleteTarget, setDeleteTarget] = useState<PostData | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [toast, setToast] = useState('');

  const totalViews = useMemo(
    () => posts.reduce((a, p) => a + p.views, 0),
    [posts]
  );
  const publishedCount = posts.filter((p) => !p.draft).length;
  const draftCount = posts.filter((p) => p.draft).length;
  const featuredCount = posts.filter((p) => p.featured).length;

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

  // Sidebar nav items
  const navItems = [
    { id: 'overview' as const, label: 'Overview', icon: <Icon.Grid /> },
    { id: 'posts' as const, label: 'Posts', icon: <Icon.Document /> },
    { id: 'projects' as const, label: 'Projects', icon: <Icon.Folder /> },
    { id: 'media' as const, label: 'Media', icon: <Icon.Photo /> },
  ];

  const SidebarContent = (
    <>
      {/* Brand */}
      <div className="h-14 flex items-center px-5 border-b border-zinc-800 flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <img src="/logo.png" alt="Logo" className="w-6 h-6 object-contain" />
          <div className="leading-none">
            <p className="text-xs font-semibold text-zinc-100">Blog Admin</p>
            <p className="text-[10px] text-zinc-500 mt-0.5">Dr. Afnizanfaizal</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => { setSection(item.id); setSidebarOpen(false); }}
            className={`
              w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer
              ${section === item.id
                ? 'bg-zinc-800 text-zinc-100 font-medium'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'}
            `}
          >
            {item.icon}
            {item.label}
          </button>
        ))}

        <div className="pt-1">
          <p className="px-3 py-1 text-[10px] font-medium text-zinc-600 uppercase tracking-wider">
            Create
          </p>
          <a
            href="/admin/editor"
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 transition-colors"
          >
            <Icon.Pencil />
            New Post
          </a>
        </div>

        <div className="pt-1">
          <p className="px-3 py-1 text-[10px] font-medium text-zinc-600 uppercase tracking-wider">
            Settings
          </p>
          <button
            type="button"
            onClick={() => { setSection('about'); setSidebarOpen(false); }}
            className={`
              w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer
              ${section === 'about'
                ? 'bg-zinc-800 text-zinc-100 font-medium'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'}
            `}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
            </svg>
            Profile
          </button>
        </div>
      </nav>

      {/* Bottom actions */}
      <div className="p-3 border-t border-zinc-800 space-y-0.5 flex-shrink-0">
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 transition-colors"
        >
          <Icon.Globe />
          View Site
          <Icon.ArrowRight className="w-3 h-3 ml-auto opacity-40" />
        </a>
        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-zinc-400 hover:text-red-400 hover:bg-red-950/30 transition-colors cursor-pointer"
        >
          <Icon.Logout />
          Logout
        </button>
      </div>
    </>
  );

  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-100 overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-56 flex-shrink-0 bg-zinc-900 border-r border-zinc-800">
        {SidebarContent}
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        >
          <div className="absolute inset-0 bg-zinc-950/80 backdrop-blur-sm" />
          <aside
            className="absolute left-0 top-0 bottom-0 w-56 flex flex-col bg-zinc-900 border-r border-zinc-800"
            onClick={(e) => e.stopPropagation()}
          >
            {SidebarContent}
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="h-14 flex items-center gap-3 px-5 border-b border-zinc-800 bg-zinc-950 flex-shrink-0">
          <button
            type="button"
            className="md:hidden p-1 text-zinc-400 hover:text-zinc-100 transition-colors cursor-pointer rounded-md hover:bg-zinc-800"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open navigation"
          >
            <Icon.Bars />
          </button>
          <h1 className="text-sm font-semibold text-zinc-100 capitalize">{section === 'about' ? 'About Page' : section}</h1>
          {section === 'posts' && (
            <a
              href="/admin/editor"
              className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition-colors"
            >
              <Icon.Plus className="w-3.5 h-3.5" />
              New Post
            </a>
          )}
        </header>

        {/* Scrollable content */}
        <main className="flex-1 overflow-y-auto p-5 lg:p-7">
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
          {section === 'projects' && (
            <ProjectsSection
              posts={posts}
              onDeleteRequest={setDeleteTarget}
            />
          )}
          {section === 'media' && (
            <MediaManager />
          )}
          {section === 'about' && (
            <AboutSection />
          )}
        </main>
      </div>

      {/* Delete confirmation modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-zinc-950/80 backdrop-blur-sm"
            onClick={() => !deleting && setDeleteTarget(null)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-dialog-title"
            className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl p-6"
          >
            <div className="flex items-start gap-4 mb-5">
              <div className="w-10 h-10 rounded-xl bg-red-950/60 border border-red-900/40 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Icon.Trash className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <h2 id="delete-dialog-title" className="text-sm font-semibold text-zinc-100">
                  Delete Post
                </h2>
                <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                  Are you sure you want to delete{' '}
                  <span className="font-medium text-zinc-200">"{deleteTarget.title}"</span>?
                  The MDX file will be permanently removed.
                </p>
              </div>
            </div>

            {deleteError && (
              <div className="mb-4 px-3 py-2 bg-red-950/40 border border-red-900/40 rounded-lg text-xs text-red-400">
                {deleteError}
              </div>
            )}

            <div className="flex items-center gap-3 justify-end">
              <button
                type="button"
                onClick={() => { setDeleteTarget(null); setDeleteError(''); }}
                disabled={deleting}
                className="px-4 py-2 rounded-lg text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors disabled:opacity-40 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={deleting}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-red-600 hover:bg-red-500 text-white transition-colors disabled:opacity-50 cursor-pointer"
              >
                {deleting ? (
                  <>
                    <span className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" />
                    Deleting…
                  </>
                ) : (
                  <>
                    <Icon.Trash className="w-3.5 h-3.5" />
                    Delete Post
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast notification */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-zinc-800 border border-zinc-700 text-zinc-100 text-xs font-medium px-4 py-2.5 rounded-full shadow-xl whitespace-nowrap"
        >
          {toast}
        </div>
      )}
    </div>
  );
}
