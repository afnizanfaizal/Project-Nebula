import { c as createComponent } from './astro-component_SmdUz55m.mjs';
import 'piccolore';
import { Q as renderTemplate, C as maybeRenderHead, a3 as addAttribute } from './sequence_i9BfAQp7.mjs';
import { r as renderComponent } from './server_nDZvDwg3.mjs';
import { listPosts } from './firebase-admin_ByUg6J6C.mjs';
import { $ as $$Layout } from './Layout_ClNaXQe1.mjs';

const prerender = false;
const $$Index = createComponent(async ($$result, $$props, $$slots) => {
  const allPosts = await listPosts();
  const featuredPosts = allPosts.filter((p) => !p.draft && p.featured).slice(0, 3);
  const displayPosts = featuredPosts.length > 0 ? featuredPosts : allPosts.filter((p) => !p.draft).slice(0, 3);
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": "Dr. Afnizanfaizal — AI Innovation & Tech Leader" }, { "default": async ($$result2) => renderTemplate`  ${maybeRenderHead()}<section class="mx-auto max-w-3xl px-6 pt-24 pb-16"> <div class="max-w-2xl"> <p class="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-600 mb-4">
AI Innovation · Tech Leadership · Research
</p> <h1 class="text-4xl sm:text-5xl font-bold tracking-tight leading-[1.1] text-zinc-900 dark:text-zinc-100">
Dr. Afnizanfaizal
</h1> <p class="mt-5 text-xl text-zinc-500 dark:text-zinc-400 leading-relaxed max-w-xl">
Building intelligent systems at the frontier of AI. Writing about research, engineering, and the future of technology.
</p> <div class="mt-8 flex flex-wrap gap-3"> <a href="/blog" class="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-sm font-medium hover:bg-zinc-700 dark:hover:bg-zinc-300 transition-colors">
Read the Blog
</a> <a href="/projects" class="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 text-sm font-medium hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors">
View Projects
</a> </div> </div> </section>  ${displayPosts.length > 0 && renderTemplate`<section class="mx-auto max-w-3xl px-6 py-8 border-t border-zinc-100 dark:border-zinc-900" id="about"> <h2 class="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-600 mb-6">
Featured Writing
</h2> <div class="space-y-px"> ${displayPosts.map((post) => renderTemplate`<a${addAttribute(`/blog/${post.slug}`, "href")} class="group flex items-baseline justify-between gap-4 py-4 border-b border-zinc-100 dark:border-zinc-900 hover:border-zinc-200 dark:hover:border-zinc-800 transition-colors"> <h3 class="text-base font-medium text-zinc-900 dark:text-zinc-100 group-hover:text-zinc-600 dark:group-hover:text-zinc-400 transition-colors leading-snug"> ${post.title} </h3> <time${addAttribute(post.pubDate, "datetime")} class="shrink-0 text-sm text-zinc-400 dark:text-zinc-600 tabular-nums"> ${new Intl.DateTimeFormat("en-US", { month: "short", year: "numeric" }).format(new Date(post.pubDate))} </time> </a>`)} </div> <a href="/blog" class="inline-block mt-6 text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
All posts →
</a> </section>`}` })}`;
}, "/Users/afnizanfaizal/Desktop/Projects/New Blog/src/pages/index.astro", void 0);

const $$file = "/Users/afnizanfaizal/Desktop/Projects/New Blog/src/pages/index.astro";
const $$url = "";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Index,
  file: $$file,
  prerender,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
