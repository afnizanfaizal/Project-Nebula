import { c as createComponent } from './astro-component_SmdUz55m.mjs';
import 'piccolore';
import { Q as renderTemplate } from './sequence_i9BfAQp7.mjs';
import { r as renderComponent } from './server_nDZvDwg3.mjs';
import { $ as $$AdminLayout } from './AdminLayout_BLY6I4pn.mjs';

const prerender = false;
const $$Editor = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$props, $$slots);
  Astro2.self = $$Editor;
  const slug = Astro2.url.searchParams.get("slug") ?? "";
  const pageTitle = slug ? `Edit: ${slug} — Admin` : "New Post — Admin";
  return renderTemplate`${renderComponent($$result, "AdminLayout", $$AdminLayout, { "title": pageTitle }, { "default": ($$result2) => renderTemplate` ${renderComponent($$result2, "BlogEditor", null, { "slug": slug, "client:only": "react", "client:component-hydration": "only", "client:component-path": "/Users/afnizanfaizal/Desktop/Projects/New Blog/src/components/react/MDXEditor", "client:component-export": "default" })} ` })}`;
}, "/Users/afnizanfaizal/Desktop/Projects/New Blog/src/pages/admin/editor.astro", void 0);

const $$file = "/Users/afnizanfaizal/Desktop/Projects/New Blog/src/pages/admin/editor.astro";
const $$url = "/admin/editor";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Editor,
  file: $$file,
  prerender,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
