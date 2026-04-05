import { c as createComponent } from './astro-component_SmdUz55m.mjs';
import 'piccolore';
import { Q as renderTemplate, C as maybeRenderHead, a3 as addAttribute } from './sequence_i9BfAQp7.mjs';
import { r as renderComponent } from './server_nDZvDwg3.mjs';
import { listPosts } from './firebase-admin_ByUg6J6C.mjs';
import { $ as $$Layout } from './Layout_ClNaXQe1.mjs';

const prerender = false;
const $$Index = createComponent(async ($$result, $$props, $$slots) => {
  const posts = (await listPosts()).filter((p) => !p.draft);
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": "Blog — Dr. Afnizanfaizal", "description": "Thoughts on AI, systems, and technology." }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="mx-auto max-w-3xl px-6 py-16"> <h1 class="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 mb-2">Blog</h1> <p class="text-zinc-500 dark:text-zinc-400 mb-12">
Writing on AI, systems design, and technology leadership.
</p> ${posts.length === 0 ? renderTemplate`<p class="text-zinc-400 dark:text-zinc-600 text-sm">No posts yet — check back soon.</p>` : renderTemplate`<div class="space-y-px"> ${posts.map((post) => renderTemplate`<a${addAttribute(`/blog/${post.slug}`, "href")} class="group flex items-baseline justify-between gap-4 py-4 border-b border-zinc-100 dark:border-zinc-900 hover:border-zinc-200 dark:hover:border-zinc-800 transition-colors"> <div> <h2 class="text-base font-medium text-zinc-900 dark:text-zinc-100 group-hover:text-zinc-600 dark:group-hover:text-zinc-400 transition-colors leading-snug"> ${post.title} </h2> <p class="mt-1 text-sm text-zinc-500 dark:text-zinc-400 line-clamp-1"> ${post.description} </p> </div> <time${addAttribute(post.pubDate, "datetime")} class="shrink-0 text-sm text-zinc-400 dark:text-zinc-600 tabular-nums"> ${new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(post.pubDate))} </time> </a>`)} </div>`} </div> ` })}`;
}, "/Users/afnizanfaizal/Desktop/Projects/New Blog/src/pages/blog/index.astro", void 0);

const $$file = "/Users/afnizanfaizal/Desktop/Projects/New Blog/src/pages/blog/index.astro";
const $$url = "/blog";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Index,
  file: $$file,
  prerender,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
