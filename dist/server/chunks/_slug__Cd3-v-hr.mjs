import { c as createComponent } from './astro-component_SmdUz55m.mjs';
import 'piccolore';
import { Q as renderTemplate, F as Fragment, b9 as unescapeHTML } from './sequence_i9BfAQp7.mjs';
import { r as renderComponent } from './server_nDZvDwg3.mjs';
import { g as getReadingTime, $ as $$PostLayout } from './utils_DoiCw8xK.mjs';
import { getPost } from './firebase-admin_ByUg6J6C.mjs';
import { r as renderMarkdown } from './render-markdown_ChQJYQKN.mjs';
import { Timestamp } from 'firebase-admin/firestore';

const prerender = false;
const $$slug = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$props, $$slots);
  Astro2.self = $$slug;
  const { slug } = Astro2.params;
  if (!slug) return Astro2.redirect("/404");
  const post = await getPost(slug);
  if (!post) return Astro2.redirect("/404");
  const { isValidAdminToken } = await import('./firebase-admin_ByUg6J6C.mjs');
  const isAdmin = await isValidAdminToken(Astro2.cookies.get("admin_session")?.value);
  if (post.draft && !isAdmin) return Astro2.redirect("/404");
  const { html, headings } = await renderMarkdown(post.content ?? "");
  const minutesRead = getReadingTime(post.content ?? "");
  const pubDate = post.pubDate instanceof Timestamp ? post.pubDate.toDate() : new Date(post.pubDate);
  const updatedDate = post.updatedDate instanceof Timestamp ? post.updatedDate.toDate() : void 0;
  return renderTemplate`${renderComponent($$result, "PostLayout", $$PostLayout, { "post": {
    slug,
    title: post.title,
    description: post.description,
    pubDate,
    updatedDate,
    tags: post.tags ?? [],
    featuredImage: post.featuredImage
  }, "headings": headings, "minutesRead": minutesRead }, { "after-meta": async ($$result2) => renderTemplate`${renderComponent($$result2, "ViewCounter", null, { "slug": slug, "client:only": "react", "slot": "after-meta", "client:component-hydration": "only", "client:component-path": "/Users/afnizanfaizal/Desktop/Projects/New Blog/src/components/react/ViewCounter", "client:component-export": "default" })}`, "default": async ($$result2) => renderTemplate`  ${renderComponent($$result2, "Fragment", Fragment, {}, { "default": async ($$result3) => renderTemplate`${unescapeHTML(html)}` })} ` })}`;
}, "/Users/afnizanfaizal/Desktop/Projects/New Blog/src/pages/blog/[slug].astro", void 0);

const $$file = "/Users/afnizanfaizal/Desktop/Projects/New Blog/src/pages/blog/[slug].astro";
const $$url = "/blog/[slug]";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$slug,
  file: $$file,
  prerender,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
