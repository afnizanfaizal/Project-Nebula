// src/lib/rehype-blog-components.ts
import { visit } from 'unist-util-visit';

// Matches Callout.astro config exactly
const CALLOUT_CONFIG: Record<string, { icon: string; bg: string; border: string; text: string }> = {
  info:    { icon: 'ℹ', bg: 'bg-blue-50/50 dark:bg-blue-950/30',   border: 'border-blue-200 dark:border-blue-800/50',   text: 'text-blue-900 dark:text-blue-100'   },
  tip:     { icon: '✦', bg: 'bg-green-50/50 dark:bg-green-950/30', border: 'border-green-200 dark:border-green-800/50', text: 'text-green-900 dark:text-green-100' },
  warning: { icon: '⚠', bg: 'bg-amber-50/50 dark:bg-amber-950/30', border: 'border-amber-200 dark:border-amber-800/50', text: 'text-amber-900 dark:text-amber-100' },
  danger:  { icon: '✕', bg: 'bg-red-50/50 dark:bg-red-950/30',     border: 'border-red-200 dark:border-red-800/50',     text: 'text-red-900 dark:text-red-100'   },
};

// Lightweight hast node constructors (avoids hastscript dependency)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function el(tagName: string, props: Record<string, unknown>, ...children: any[]): any {
  return { type: 'element', tagName, properties: props, children };
}

function txt(value: string) {
  return { type: 'text', value };
}

export function rehypeBlogComponents() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (tree: any) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    visit(tree, 'element', (node: any, index: number | undefined, parent: any) => {
      if (!parent || index == null) return;

      // ── Callout ────────────────────────────────────────────────────────
      if (node.tagName === 'callout') {
        const type: string = String(node.properties?.type ?? 'info');
        const cfg = CALLOUT_CONFIG[type] ?? CALLOUT_CONFIG.info;
        const title: string | undefined = node.properties?.title
          ? String(node.properties.title)
          : undefined;

        parent.children[index] = el(
          'div',
          { className: `not-prose my-6 flex gap-3 rounded-lg border p-4 backdrop-blur-sm ${cfg.bg} ${cfg.border}` },
          el('span', { className: `mt-0.5 shrink-0 text-base leading-none ${cfg.text}`, ariaHidden: 'true' },
            txt(cfg.icon),
          ),
          el('div', { className: 'flex-1 min-w-0' },
            ...(title
              ? [el('p', { className: `mb-1 text-sm font-semibold ${cfg.text}` }, txt(title))]
              : []
            ),
            el('div', { className: `text-sm leading-relaxed ${cfg.text} [&>p]:m-0` },
              ...node.children,
            ),
          ),
        );
        return;
      }

      // ── Figure (custom — identified by presence of `src` attribute) ───
      // parse5 lowercases <Figure> → <figure>. Standard HTML <figure> never has a src attribute.
      if (node.tagName === 'figure' && node.properties?.src) {
        const src     = String(node.properties.src ?? '');
        const alt     = String(node.properties.alt ?? '');
        const align   = String(node.properties.align ?? 'none');
        const caption = node.properties.caption ? String(node.properties.caption) : undefined;

        parent.children[index] = el(
          'figure',
          { className: `blog-figure figure-${align}` },
          el('img', { src, alt, loading: 'lazy' }),
          ...(caption ? [el('figcaption', {}, txt(caption))] : []),
        );
        return;
      }

      // ── ZoomImage ──────────────────────────────────────────────────────
      if (node.tagName === 'zoomimage') {
        const src     = String(node.properties?.src ?? '');
        const alt     = String(node.properties?.alt ?? '');
        const caption = node.properties?.caption ? String(node.properties.caption) : undefined;
        const width   = node.properties?.width;
        const height  = node.properties?.height;

        parent.children[index] = el(
          'figure',
          { className: 'not-prose my-8' },
          el('img', {
            src,
            alt,
            ...(width  ? { width  } : {}),
            ...(height ? { height } : {}),
            className: 'zoom-image w-full rounded-lg border border-zinc-200 dark:border-zinc-800 cursor-zoom-in',
            loading: 'lazy',
            decoding: 'async',
          }),
          ...(caption
            ? [el('figcaption', { className: 'mt-2 text-center text-xs text-zinc-500 dark:text-zinc-400' }, txt(caption))]
            : []
          ),
        );
        return;
      }
    });
  };
}
