import { c as createComponent } from './astro-component_SmdUz55m.mjs';
import 'piccolore';
import { Q as renderTemplate } from './sequence_i9BfAQp7.mjs';
import { r as renderComponent } from './server_nDZvDwg3.mjs';
import { $ as $$AdminLayout } from './AdminLayout_BLY6I4pn.mjs';

const prerender = false;
const $$Index = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${renderComponent($$result, "AdminLayout", $$AdminLayout, { "title": "Admin — Sign In" }, { "default": ($$result2) => renderTemplate` ${renderComponent($$result2, "AdminLogin", null, { "client:only": "react", "client:component-hydration": "only", "client:component-path": "/Users/afnizanfaizal/Desktop/Projects/New Blog/src/components/react/AdminLogin", "client:component-export": "default" })} ` })}`;
}, "/Users/afnizanfaizal/Desktop/Projects/New Blog/src/pages/admin/index.astro", void 0);

const $$file = "/Users/afnizanfaizal/Desktop/Projects/New Blog/src/pages/admin/index.astro";
const $$url = "/admin";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Index,
  file: $$file,
  prerender,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
