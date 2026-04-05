import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import rehypeRaw from 'rehype-raw';
import rehypeShiki from '@shikijs/rehype';
import rehypeStringify from 'rehype-stringify';
import { visit } from 'unist-util-visit';

const CALLOUT_CONFIG = {
  info: { icon: "ℹ", bg: "bg-blue-50/50 dark:bg-blue-950/30", border: "border-blue-200 dark:border-blue-800/50", text: "text-blue-900 dark:text-blue-100" },
  tip: { icon: "✦", bg: "bg-green-50/50 dark:bg-green-950/30", border: "border-green-200 dark:border-green-800/50", text: "text-green-900 dark:text-green-100" },
  warning: { icon: "⚠", bg: "bg-amber-50/50 dark:bg-amber-950/30", border: "border-amber-200 dark:border-amber-800/50", text: "text-amber-900 dark:text-amber-100" },
  danger: { icon: "✕", bg: "bg-red-50/50 dark:bg-red-950/30", border: "border-red-200 dark:border-red-800/50", text: "text-red-900 dark:text-red-100" }
};
function el(tagName, props, ...children) {
  return { type: "element", tagName, properties: props, children };
}
function txt(value) {
  return { type: "text", value };
}
function rehypeBlogComponents() {
  return (tree) => {
    visit(tree, "element", (node, index, parent) => {
      if (!parent || index == null) return;
      if (node.tagName === "callout") {
        const type = String(node.properties?.type ?? "info");
        const cfg = CALLOUT_CONFIG[type] ?? CALLOUT_CONFIG.info;
        const title = node.properties?.title ? String(node.properties.title) : void 0;
        parent.children[index] = el(
          "div",
          { className: `not-prose my-6 flex gap-3 rounded-lg border p-4 backdrop-blur-sm ${cfg.bg} ${cfg.border}` },
          el(
            "span",
            { className: `mt-0.5 shrink-0 text-base leading-none ${cfg.text}`, ariaHidden: "true" },
            txt(cfg.icon)
          ),
          el(
            "div",
            { className: "flex-1 min-w-0" },
            ...title ? [el("p", { className: `mb-1 text-sm font-semibold ${cfg.text}` }, txt(title))] : [],
            el(
              "div",
              { className: `text-sm leading-relaxed ${cfg.text} [&>p]:m-0` },
              ...node.children
            )
          )
        );
        return;
      }
      if (node.tagName === "figure" && node.properties?.src) {
        const src = String(node.properties.src ?? "");
        const alt = String(node.properties.alt ?? "");
        const align = String(node.properties.align ?? "none");
        const caption = node.properties.caption ? String(node.properties.caption) : void 0;
        const newFigure = el(
          "figure",
          { className: `blog-figure figure-${align}` },
          el("img", { src, alt, loading: "lazy" }),
          ...caption ? [el("figcaption", {}, txt(caption))] : []
        );
        const swallowed = node.children ?? [];
        parent.children.splice(index, 1, newFigure, ...swallowed);
        return;
      }
      if (node.tagName === "img" && node.properties?.src) {
        const url = String(node.properties.src);
        const match = url.match(/#(left|right|center|none)(?:$|\s|\?|&)/);
        if (match) {
          const align = match[1];
          const src = url.replace(match[0], "");
          parent.children[index] = el(
            "figure",
            { className: `blog-figure figure-${align}` },
            el("img", { ...node.properties, src, loading: "lazy" })
          );
          return;
        }
      }
      if (node.tagName === "zoomimage") {
        const src = String(node.properties?.src ?? "");
        const alt = String(node.properties?.alt ?? "");
        const caption = node.properties?.caption ? String(node.properties.caption) : void 0;
        const width = node.properties?.width;
        const height = node.properties?.height;
        parent.children[index] = el(
          "figure",
          { className: "not-prose my-8" },
          el("img", {
            src,
            alt,
            ...width ? { width } : {},
            ...height ? { height } : {},
            className: "zoom-image w-full rounded-lg border border-zinc-200 dark:border-zinc-800 cursor-zoom-in",
            loading: "lazy",
            decoding: "async"
          }),
          ...caption ? [el("figcaption", { className: "mt-2 text-center text-xs text-zinc-500 dark:text-zinc-400" }, txt(caption))] : []
        );
        return;
      }
      if (node.tagName === "a" && node.properties?.href) {
        const href = String(node.properties.href);
        if (href.toLowerCase().endsWith(".pdf")) {
          node.properties.target = "_blank";
          node.properties.rel = "noopener noreferrer";
        }
        return;
      }
    });
  };
}

function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-").replace(/-+/g, "-");
}
async function renderMarkdown(content) {
  const headings = [];
  const file = await unified().use(remarkParse).use(() => (tree) => {
    visit(tree, "heading", (node) => {
      const text = node.children.filter((c) => c.type === "text" || c.type === "inlineCode").map((c) => String(c.value)).join("");
      headings.push({ depth: node.depth, slug: slugify(text), text });
    });
  }).use(remarkRehype, { allowDangerousHtml: true }).use(rehypeRaw).use(rehypeBlogComponents).use(rehypeShiki, {
    themes: { light: "github-light", dark: "github-dark-default" }
  }).use(rehypeStringify).process(content);
  return { html: String(file), headings };
}

export { renderMarkdown as r };
