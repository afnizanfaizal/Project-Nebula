import { c as createComponent } from './astro-component_SmdUz55m.mjs';
import 'piccolore';
import { C as maybeRenderHead, a3 as addAttribute, Q as renderTemplate, F as Fragment, bd as renderSlot } from './sequence_i9BfAQp7.mjs';
import { r as renderComponent } from './server_nDZvDwg3.mjs';
import { r as renderScript, $ as $$Layout } from './Layout_ClNaXQe1.mjs';
import 'clsx';

const $$TableOfContents = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$props, $$slots);
  Astro2.self = $$TableOfContents;
  const { headings } = Astro2.props;
  const toc = headings.filter((h) => h.depth === 2 || h.depth === 3);
  return renderTemplate`${toc.length > 0 && renderTemplate`${maybeRenderHead()}<nav class="toc" aria-label="Table of contents"><p class="mb-3 text-xs font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-600">
On this page
</p><ul class="space-y-1.5 text-sm">${toc.map((heading) => renderTemplate`<li${addAttribute(heading.depth === 3 ? "pl-3" : "", "class")}><a${addAttribute(`#${heading.slug}`, "href")} class="toc-link block text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors leading-snug py-0.5">${heading.text}</a></li>`)}</ul></nav>`}${renderScript($$result, "/Users/afnizanfaizal/Desktop/Projects/New Blog/src/components/TableOfContents.astro?astro&type=script&index=0&lang.ts")}`;
}, "/Users/afnizanfaizal/Desktop/Projects/New Blog/src/components/TableOfContents.astro", void 0);

const $$PostLayout = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$props, $$slots);
  Astro2.self = $$PostLayout;
  const { post, headings, minutesRead } = Astro2.props;
  const { title, pubDate, updatedDate, description, tags, featuredImage } = post;
  const formattedDate = new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric"
  }).format(pubDate);
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": `${title} — Dr. Afnizanfaizal`, "description": description, "image": featuredImage }, { "default": ($$result2) => renderTemplate`  ${maybeRenderHead()}<div id="progress-bar" class="fixed top-0 left-0 h-0.5 bg-zinc-900 dark:bg-zinc-100 z-[60] transition-none" style="width: 0%" aria-hidden="true"></div> ${featuredImage && renderTemplate`<div class="relative w-full overflow-hidden" style="max-height: 480px; min-height: 240px;"> <img${addAttribute(featuredImage, "src")} alt="" class="w-full object-cover" style="max-height: 480px; min-height: 240px;"> <div class="absolute inset-0 bg-gradient-to-b from-transparent via-black/30 to-black/90"></div> <div class="absolute bottom-0 left-0 right-0 px-6 pb-8" style="max-width: 80rem; margin: 0 auto;"> ${tags.length > 0 && renderTemplate`<div class="mb-3 flex flex-wrap gap-2"> ${tags.map((tag) => renderTemplate`<a${addAttribute(`/blog?tag=${tag}`, "href")} class="text-xs font-medium uppercase tracking-widest text-zinc-300 hover:text-white transition-colors"> ${tag} </a>`)} </div>`} <h1 class="text-3xl sm:text-4xl font-bold tracking-tight leading-tight text-white"> ${title} </h1> <div class="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-zinc-300"> <time${addAttribute(pubDate.toISOString(), "datetime")}>${formattedDate}</time> <span aria-hidden="true">·</span> <span>${minutesRead} min read</span> ${updatedDate && renderTemplate`${renderComponent($$result2, "Fragment", Fragment, {}, { "default": ($$result3) => renderTemplate` <span aria-hidden="true">·</span> <span>Updated <time${addAttribute(updatedDate.toISOString(), "datetime")}> ${new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(updatedDate)} </time></span> ` })}`} </div> ${renderSlot($$result2, $$slots["after-meta"])} </div> </div>`}<div class="mx-auto max-w-5xl px-6 py-16"> <div class="lg:grid lg:grid-cols-[1fr_220px] lg:gap-16"> <!-- Main content --> <article> ${!featuredImage && renderTemplate`<header class="mb-10"> ${tags.length > 0 && renderTemplate`<div class="mb-4 flex flex-wrap gap-2"> ${tags.map((tag) => renderTemplate`<a${addAttribute(`/blog?tag=${tag}`, "href")} class="text-xs font-medium uppercase tracking-widest text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"> ${tag} </a>`)} </div>`} <h1 class="text-3xl sm:text-4xl font-bold tracking-tight leading-tight text-zinc-900 dark:text-zinc-100"> ${title} </h1> <div class="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-zinc-500 dark:text-zinc-400"> <time${addAttribute(pubDate.toISOString(), "datetime")}>${formattedDate}</time> <span aria-hidden="true">·</span> <span>${minutesRead} min read</span> ${updatedDate && renderTemplate`${renderComponent($$result2, "Fragment", Fragment, {}, { "default": ($$result3) => renderTemplate` <span aria-hidden="true">·</span> <span>Updated <time${addAttribute(updatedDate.toISOString(), "datetime")}> ${new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(updatedDate)} </time></span> ` })}`} </div> ${renderSlot($$result2, $$slots["after-meta"])} </header>`} <div class="prose prose-zinc dark:prose-invert prose-lg max-w-none
          prose-headings:scroll-mt-20
          prose-a:text-zinc-900 dark:prose-a:text-zinc-100 prose-a:underline-offset-4
          prose-code:font-mono prose-code:text-sm"> ${renderSlot($$result2, $$slots["default"])} </div> </article> <!-- Sidebar TOC (desktop only) --> <aside class="hidden lg:block"> <div class="sticky top-24"> ${renderComponent($$result2, "TableOfContents", $$TableOfContents, { "headings": headings })} </div> </aside> </div> </div> ` })} ${renderScript($$result, "/Users/afnizanfaizal/Desktop/Projects/New Blog/src/layouts/PostLayout.astro?astro&type=script&index=0&lang.ts")} ${renderScript($$result, "/Users/afnizanfaizal/Desktop/Projects/New Blog/src/layouts/PostLayout.astro?astro&type=script&index=1&lang.ts")}`;
}, "/Users/afnizanfaizal/Desktop/Projects/New Blog/src/layouts/PostLayout.astro", void 0);

function getReadingTime(content) {
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

export { $$PostLayout as $, getReadingTime as g };
