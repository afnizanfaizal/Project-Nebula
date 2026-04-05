import { c as createComponent } from './astro-component_SmdUz55m.mjs';
import 'piccolore';
import { T as createRenderInstruction, C as maybeRenderHead, Q as renderTemplate, a3 as addAttribute, bd as renderSlot, bc as renderHead } from './sequence_i9BfAQp7.mjs';
import { r as renderComponent } from './server_nDZvDwg3.mjs';
/* empty css                 */
import 'clsx';

async function renderScript(result, id) {
  const inlined = result.inlinedScripts.get(id);
  let content = "";
  if (inlined != null) {
    if (inlined) {
      content = `<script type="module">${inlined}</script>`;
    }
  } else {
    const resolved = await result.resolve(id);
    content = `<script type="module" src="${result.userAssetsBase ? (result.base === "/" ? "" : result.base) + result.userAssetsBase : ""}${resolved}"></script>`;
  }
  return createRenderInstruction({ type: "script", id, content });
}

const $$ThemeToggle = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${maybeRenderHead()}<button id="theme-toggle" type="button" aria-label="Toggle dark mode" class="p-2 rounded-md text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"> <!-- Sun icon (shown in dark mode) --> <svg id="icon-sun" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="hidden dark:block"> <circle cx="12" cy="12" r="4"></circle><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"></path> </svg> <!-- Moon icon (shown in light mode) --> <svg id="icon-moon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="block dark:hidden"> <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"></path> </svg> </button> ${renderScript($$result, "/Users/afnizanfaizal/Desktop/Projects/New Blog/src/components/ThemeToggle.astro?astro&type=script&index=0&lang.ts")}`;
}, "/Users/afnizanfaizal/Desktop/Projects/New Blog/src/components/ThemeToggle.astro", void 0);

const $$Navbar = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$props, $$slots);
  Astro2.self = $$Navbar;
  const navLinks = [
    { href: "/blog", label: "Blog" },
    { href: "/projects", label: "Projects" },
    { href: "/#about", label: "About" }
  ];
  const currentPath = Astro2.url.pathname;
  return renderTemplate`${maybeRenderHead()}<header class="sticky top-0 z-50 w-full border-b border-zinc-200/50 dark:border-zinc-800/50 bg-white/75 dark:bg-zinc-950/75 backdrop-blur-md"> <nav class="mx-auto max-w-3xl px-6 flex h-14 items-center justify-between"> <a href="/" class="flex items-center gap-2 group"> <span class="font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight group-hover:text-zinc-600 dark:group-hover:text-zinc-400 transition-colors">
Dr. Afnizanfaizal
</span> <span class="hidden sm:inline text-zinc-400 dark:text-zinc-600 text-sm font-normal">
/ AI & Tech
</span> </a> <div class="flex items-center gap-1"> ${navLinks.map(({ href, label }) => renderTemplate`<a${addAttribute(href, "href")}${addAttribute([
    "px-3 py-1.5 text-sm rounded-md transition-colors",
    currentPath === href || currentPath.startsWith(href + "/") ? "text-zinc-900 dark:text-zinc-100 font-medium bg-zinc-100 dark:bg-zinc-800" : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800"
  ].filter(Boolean).join(" "), "class")}> ${label} </a>`)} <div class="ml-2 pl-2 border-l border-zinc-200 dark:border-zinc-800 flex items-center gap-1"> ${renderComponent($$result, "ThemeToggle", $$ThemeToggle, {})} <a href="/admin" aria-label="Admin Login" class="p-2 rounded-md text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"> <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"> <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle> </svg> </a> </div> </div> </nav> </header>`;
}, "/Users/afnizanfaizal/Desktop/Projects/New Blog/src/components/Navbar.astro", void 0);

const $$Footer = createComponent(($$result, $$props, $$slots) => {
  const year = (/* @__PURE__ */ new Date()).getFullYear();
  return renderTemplate`${maybeRenderHead()}<footer class="border-t border-zinc-200 dark:border-zinc-800 mt-24"> <div class="mx-auto max-w-3xl px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4"> <div class="text-center sm:text-left"> <p class="text-sm font-medium text-zinc-900 dark:text-zinc-100">Dr. Afnizanfaizal</p> <p class="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">AI Innovation & Tech Leader</p> </div> <div class="flex items-center gap-4"> <a href="https://github.com/afnizanfaizal" target="_blank" rel="noopener noreferrer" aria-label="GitHub" class="text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"> <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"> <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12Z"></path> </svg> </a> <a href="https://linkedin.com/in/afnizanfaizal" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" class="text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"> <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"> <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"></path> </svg> </a> <a href="https://x.com/afnizanfaizal" target="_blank" rel="noopener noreferrer" aria-label="Twitter / X" class="text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"> <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"> <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.213 5.567zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path> </svg> </a> </div> <p class="text-xs text-zinc-400 dark:text-zinc-600">
© ${year} Dr. Afnizanfaizal
</p> </div> </footer>`;
}, "/Users/afnizanfaizal/Desktop/Projects/New Blog/src/components/Footer.astro", void 0);

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(cooked.slice()) }));
var _a;
const $$Layout = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$props, $$slots);
  Astro2.self = $$Layout;
  const {
    title,
    description = "AI Innovation & Tech Leadership — Dr. Afnizanfaizal",
    image = "/og-default.png"
  } = Astro2.props;
  const canonicalURL = new URL(Astro2.url.pathname, Astro2.site ?? "http://localhost:4321");
  return renderTemplate(_a || (_a = __template(['<html lang="en" class="scroll-smooth"> <head><meta charset="UTF-8"><link rel="icon" type="image/svg+xml" href="/favicon.svg"><link rel="icon" href="/favicon.ico"><meta name="generator"', '><meta name="viewport" content="width=device-width, initial-scale=1"><link rel="canonical"', '><meta name="description"', '><!-- Open Graph --><meta property="og:title"', '><meta property="og:description"', '><meta property="og:image"', '><meta property="og:type" content="website"><meta property="og:url"', '><!-- Twitter --><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title"', '><meta name="twitter:description"', '><meta name="twitter:image"', "><title>", "</title><!-- Prevent flash of unstyled theme --><script>\n      const theme = localStorage.getItem('theme') ??\n        (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');\n      document.documentElement.classList.toggle('dark', theme === 'dark');\n    <\/script>", '</head> <body class="bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 min-h-screen flex flex-col font-sans"> ', ' <main class="flex-1"> ', " </main> ", " </body></html>"])), addAttribute(Astro2.generator, "content"), addAttribute(canonicalURL, "href"), addAttribute(description, "content"), addAttribute(title, "content"), addAttribute(description, "content"), addAttribute(image, "content"), addAttribute(canonicalURL, "content"), addAttribute(title, "content"), addAttribute(description, "content"), addAttribute(image, "content"), title, renderHead(), renderComponent($$result, "Navbar", $$Navbar, {}), renderSlot($$result, $$slots["default"]), renderComponent($$result, "Footer", $$Footer, {}));
}, "/Users/afnizanfaizal/Desktop/Projects/New Blog/src/layouts/Layout.astro", void 0);

export { $$Layout as $, renderScript as r };
