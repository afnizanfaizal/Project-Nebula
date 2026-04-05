import { c as createComponent } from './astro-component_SmdUz55m.mjs';
import 'piccolore';
import { Q as renderTemplate } from './sequence_i9BfAQp7.mjs';
import { r as renderComponent } from './server_nDZvDwg3.mjs';
import { $ as $$AdminLayout } from './AdminLayout_BLY6I4pn.mjs';
import { listPosts, getDailyAnalytics } from './firebase-admin_ByUg6J6C.mjs';

const COUNTRY_INFO = {
  MY: { name: "Malaysia", flag: "🇲🇾" },
  SG: { name: "Singapore", flag: "🇸🇬" },
  ID: { name: "Indonesia", flag: "🇮🇩" },
  US: { name: "United States", flag: "🇺🇸" },
  GB: { name: "United Kingdom", flag: "🇬🇧" },
  AU: { name: "Australia", flag: "🇦🇺" },
  CA: { name: "Canada", flag: "🇨🇦" },
  DE: { name: "Germany", flag: "🇩🇪" },
  FR: { name: "France", flag: "🇫🇷" },
  JP: { name: "Japan", flag: "🇯🇵" },
  IN: { name: "India", flag: "🇮🇳" },
  BR: { name: "Brazil", flag: "🇧🇷" },
  NL: { name: "Netherlands", flag: "🇳🇱" },
  SE: { name: "Sweden", flag: "🇸🇪" },
  NO: { name: "Norway", flag: "🇳🇴" },
  PH: { name: "Philippines", flag: "🇵🇭" },
  TH: { name: "Thailand", flag: "🇹🇭" },
  VN: { name: "Vietnam", flag: "🇻🇳" },
  KR: { name: "South Korea", flag: "🇰🇷" },
  CN: { name: "China", flag: "🇨🇳" },
  RU: { name: "Russia", flag: "🇷🇺" },
  PK: { name: "Pakistan", flag: "🇵🇰" },
  BD: { name: "Bangladesh", flag: "🇧🇩" },
  NZ: { name: "New Zealand", flag: "🇳🇿" },
  ZA: { name: "South Africa", flag: "🇿🇦" },
  EG: { name: "Egypt", flag: "🇪🇬" },
  NG: { name: "Nigeria", flag: "🇳🇬" },
  IT: { name: "Italy", flag: "🇮🇹" },
  ES: { name: "Spain", flag: "🇪🇸" },
  PL: { name: "Poland", flag: "🇵🇱" }
};
function buildDateRange(days) {
  const now = /* @__PURE__ */ new Date();
  const todayUTC = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const result = [];
  for (let i = days - 1; i >= 0; i--) {
    const ts = todayUTC - i * 864e5;
    result.push(new Date(ts).toISOString().slice(0, 10));
  }
  return result;
}
function buildChartData(docs, dates) {
  return dates.map((dateKey) => {
    const label = (/* @__PURE__ */ new Date(`${dateKey}T00:00:00Z`)).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      timeZone: "UTC"
    });
    return { date: label, views: docs[dateKey]?.total ?? 0 };
  });
}
function aggregateTopCountries(docs, limit) {
  const totals = {};
  for (const doc of Object.values(docs)) {
    if (!doc) continue;
    for (const [cc, count] of Object.entries(doc.countries)) {
      totals[cc] = (totals[cc] ?? 0) + count;
    }
  }
  return Object.entries(totals).sort(([, a], [, b]) => b - a).slice(0, limit).map(([code, views]) => ({
    code,
    name: COUNTRY_INFO[code]?.name ?? code,
    flag: COUNTRY_INFO[code]?.flag ?? "🌐",
    views
  }));
}

const prerender = false;
const $$Dashboard = createComponent(async ($$result, $$props, $$slots) => {
  const [postList, analyticsMap] = await Promise.all([
    listPosts(),
    getDailyAnalytics(buildDateRange(30))
  ]);
  const dates = buildDateRange(30);
  const viewsChart = buildChartData(analyticsMap, dates);
  const topCountries = aggregateTopCountries(analyticsMap, 5);
  const posts = postList.map((p) => ({
    slug: p.slug,
    title: p.title,
    pubDate: p.pubDate,
    draft: p.draft,
    tags: p.tags,
    description: p.description,
    featured: p.featured,
    views: p.views
  }));
  return renderTemplate`${renderComponent($$result, "AdminLayout", $$AdminLayout, { "title": "Dashboard — Admin" }, { "default": async ($$result2) => renderTemplate` ${renderComponent($$result2, "AdminDashboard", null, { "posts": posts, "viewsChart": viewsChart, "topCountries": topCountries, "client:only": "react", "client:component-hydration": "only", "client:component-path": "/Users/afnizanfaizal/Desktop/Projects/New Blog/src/components/react/AdminDashboard", "client:component-export": "default" })} ` })}`;
}, "/Users/afnizanfaizal/Desktop/Projects/New Blog/src/pages/admin/dashboard.astro", void 0);

const $$file = "/Users/afnizanfaizal/Desktop/Projects/New Blog/src/pages/admin/dashboard.astro";
const $$url = "/admin/dashboard";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Dashboard,
  file: $$file,
  prerender,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
