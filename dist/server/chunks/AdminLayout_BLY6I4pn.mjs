import { c as createComponent } from './astro-component_SmdUz55m.mjs';
import 'piccolore';
import { bc as renderHead, bd as renderSlot, Q as renderTemplate } from './sequence_i9BfAQp7.mjs';
import 'clsx';
/* empty css                 */

const $$AdminLayout = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$props, $$slots);
  Astro2.self = $$AdminLayout;
  const { title } = Astro2.props;
  return renderTemplate`<html lang="en" class="dark"> <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex, nofollow"><link rel="icon" type="image/svg+xml" href="/favicon.svg"><title>${title}</title>${renderHead()}</head> <body class="bg-zinc-950 text-zinc-100 antialiased"> ${renderSlot($$result, $$slots["default"])} </body></html>`;
}, "/Users/afnizanfaizal/Desktop/Projects/New Blog/src/layouts/AdminLayout.astro", void 0);

export { $$AdminLayout as $ };
