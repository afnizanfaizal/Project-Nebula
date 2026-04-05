import { c as createComponent } from './astro-component_SmdUz55m.mjs';
import 'piccolore';
import { Q as renderTemplate, F as Fragment, b9 as unescapeHTML, C as maybeRenderHead } from './sequence_i9BfAQp7.mjs';
import { r as renderComponent } from './server_nDZvDwg3.mjs';
import { g as getReadingTime, $ as $$PostLayout } from './utils_DoiCw8xK.mjs';
import { r as renderMarkdown } from './render-markdown_ChQJYQKN.mjs';

const prerender = false;
const $$Preview = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$props, $$slots);
  Astro2.self = $$Preview;
  const { isValidAdminToken } = await import('./firebase-admin_ByUg6J6C.mjs');
  const adminCookie = Astro2.cookies.get("admin_session")?.value;
  const isAdmin = await isValidAdminToken(adminCookie);
  if (!isAdmin) {
    return Astro2.redirect("/admin");
  }
  let postData = {
    title: "Preview",
    content: "",
    description: "",
    tags: [],
    featuredImage: "",
    pubDate: /* @__PURE__ */ new Date()
  };
  if (Astro2.request.method === "POST") {
    try {
      const formData = await Astro2.request.formData();
      const tagsRaw = formData.get("tags")?.toString() || "";
      postData = {
        title: formData.get("title")?.toString() || "Untitled Preview",
        content: formData.get("content")?.toString() || "",
        description: formData.get("description")?.toString() || "",
        tags: tagsRaw.split(",").filter(Boolean),
        featuredImage: formData.get("featuredImage")?.toString() || "",
        pubDate: new Date(formData.get("pubDate")?.toString() || /* @__PURE__ */ new Date())
      };
    } catch (err) {
      console.error("[Preview] Error parsing form data:", err);
    }
  }
  const { html, headings } = await renderMarkdown(postData.content);
  const readingTime = getReadingTime(postData.content);
  return renderTemplate`${renderComponent($$result, "PostLayout", $$PostLayout, { "post": {
    slug: "preview-mode",
    title: postData.title,
    description: postData.description,
    pubDate: postData.pubDate,
    tags: postData.tags,
    featuredImage: postData.featuredImage
  }, "headings": headings, "minutesRead": readingTime }, { "after-meta": async ($$result2) => renderTemplate`${maybeRenderHead()}<div class="mb-4 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-500 text-[10px] font-bold uppercase tracking-wider mb-8"> <span class="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
Preview Mode
</div>`, "default": async ($$result2) => renderTemplate`  ${renderComponent($$result2, "Fragment", Fragment, {}, { "default": async ($$result3) => renderTemplate`${unescapeHTML(html)}` })} ` })}`;
}, "/Users/afnizanfaizal/Desktop/Projects/New Blog/src/pages/admin/preview.astro", void 0);

const $$file = "/Users/afnizanfaizal/Desktop/Projects/New Blog/src/pages/admin/preview.astro";
const $$url = "/admin/preview";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Preview,
  file: $$file,
  prerender,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
