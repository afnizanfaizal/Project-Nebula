import { c as createComponent } from './astro-component_SmdUz55m.mjs';
import 'piccolore';
import { Q as renderTemplate, C as maybeRenderHead, a3 as addAttribute } from './sequence_i9BfAQp7.mjs';
import { r as renderComponent } from './server_nDZvDwg3.mjs';
import { listPosts } from './firebase-admin_ByUg6J6C.mjs';
import { $ as $$Layout } from './Layout_ClNaXQe1.mjs';

const prerender = false;
const $$Index = createComponent(async ($$result, $$props, $$slots) => {
  const projects = (await listPosts()).filter((p) => !p.draft && p.isProject).sort((a, b) => new Date(b.pubDate).valueOf() - new Date(a.pubDate).valueOf());
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": "Projects — Dr. Afnizanfaizal", "description": "Research and engineering projects." }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="mx-auto max-w-3xl px-6 py-16"> <h1 class="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 mb-2">Projects</h1> <p class="text-zinc-500 dark:text-zinc-400 mb-12">Selected research and engineering work.</p> <div class="space-y-8"> ${projects.length === 0 ? renderTemplate`<p class="text-zinc-400 dark:text-zinc-600 text-sm">No projects listed yet.</p>` : projects.map((project) => renderTemplate`<a${addAttribute(`/blog/${project.slug}`, "href")} class="group block p-6 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors"> <div class="flex items-start justify-between gap-4 mb-2"> <h2 class="font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-zinc-600 dark:group-hover:text-zinc-400 transition-colors"> ${project.title} </h2> </div> <p class="text-sm text-zinc-500 dark:text-zinc-400 mb-3">${project.description}</p> <div class="flex flex-wrap gap-2"> ${project.tags.map((tag) => renderTemplate`<span class="text-xs font-medium text-zinc-400 dark:text-zinc-600 uppercase tracking-wider"> ${tag} </span>`)} </div> </a>`)} </div> </div> ` })}`;
}, "/Users/afnizanfaizal/Desktop/Projects/New Blog/src/pages/projects/index.astro", void 0);

const $$file = "/Users/afnizanfaizal/Desktop/Projects/New Blog/src/pages/projects/index.astro";
const $$url = "/projects";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Index,
  file: $$file,
  prerender,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
