// src/lib/rehype-blog-components.ts
import { visit } from 'unist-util-visit';

// Matches the MDXEditor direct rendering look in the editor
const CALLOUT_CONFIG: Record<string, { label: string; border: string; text: string }> = {
  note:    { label: 'NOTE',    border: 'border-[#71717a]', text: 'text-[#a1a1aa]' },
  info:    { label: 'INFO',    border: 'border-[#3b82f6]', text: 'text-[#60a5fa]' },
  tip:     { label: 'TIP',     border: 'border-[#10b981]', text: 'text-[#34d399]' },
  warning: { label: 'WARNING', border: 'border-[#f59e0b]', text: 'text-[#fbbf24]' },
  caution: { label: 'CAUTION', border: 'border-[#f97316]', text: 'text-[#fb923c]' },
  danger:  { label: 'DANGER',  border: 'border-[#ef4444]', text: 'text-[#f87171]' },
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

        parent.children[index] = el(
          'div',
          { className: `not-prose my-6 p-5 rounded-r-lg bg-[#0d1117] text-[#e6edf3] border-l-4 ${cfg.border}` },
          el('span', { className: `inline-block text-[0.7rem] font-extrabold uppercase mb-3 px-2 py-[2px] rounded bg-[#161b22] tracking-[0.05em] border border-[#30363d] ${cfg.text}`, ariaHidden: 'true' },
            txt(cfg.label),
          ),
          el('div', { className: 'text-[0.9em] leading-relaxed [&>p]:m-0' },
            ...node.children,
          ),
        );
        return;
      }

      // ── Figure (custom JSX tag) ────────────────────────────────────────
      // parse5 lowercases <Figure> → <figure>. Standard HTML <figure> never has a src attribute.
      if (node.tagName === 'figure' && node.properties?.src) {
        const src     = String(node.properties.src ?? '');
        const alt     = String(node.properties.alt ?? '');
        const align   = String(node.properties.align ?? 'none');
        const caption = node.properties.caption ? String(node.properties.caption) : undefined;

        const newFigure = el(
          'figure',
          { className: `blog-figure figure-${align}` },
          el('img', { src, alt, loading: 'lazy' }),
          ...(caption ? [el('figcaption', {}, txt(caption))] : []),
        );

        // Restore any children that parse5 incorrectly captured inside the <figure> tag
        const swallowed = node.children ?? [];
        parent.children.splice(index, 1, newFigure, ...swallowed);
        return;
      }

      // ── Image Alignment via URL Fragment (e.g. ![alt](url#left)) ────
      if (node.tagName === 'img' && node.properties?.src) {
        const url = String(node.properties.src);
        const match = url.match(/#(left|right|center|none)(?:$|\s|\?|&)/);
        
        if (match) {
          const align = match[1];
          const src = url.replace(match[0], '');
          
          parent.children[index] = el(
            'figure',
            { className: `blog-figure figure-${align}` },
            el('img', { ...node.properties, src, loading: 'lazy' }),
          );
          return;
        }
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

      // ── YouTube JSX Component ─────────────────────────────────────────
      if (node.tagName === 'youtube') {
        const id    = String(node.properties?.id ?? '');
        const width = String(node.properties?.width ?? '100%');
        
        parent.children[index] = el(
          'figure',
          { 
            className: 'not-prose my-8 block mx-auto',
            style: `width: ${width}; max-width: 100%;`
          },
          el('div', { className: 'aspect-video w-full' },
            el('iframe', {
              src: `https://www.youtube.com/embed/${id}`,
              className: 'w-full h-full rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-800',
              allowFullScreen: true,
              allow: 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture',
              title: 'YouTube Video'
            })
          )
        );
        return;
      }

      // ── Stats Grid Component ─────────────────────────────────────────
      // NOTE: rehype-raw uses parse5 (HTML5 parser) which treats <stat /> as
      // an unclosed open tag, causing each stat to nest inside the previous one.
      // We collect all stat nodes recursively to flatten the nesting, and render
      // them all here instead of relying on a separate stat visitor (which would
      // write into a stale parent reference after stats-grid is replaced).
      if (node.tagName === 'stats-grid') {
        const statEls: any[] = [];

        const collectStats = (children: any[]) => {
          for (const child of children) {
            if (child.type === 'element' && child.tagName === 'stat') {
              const val = String(child.properties?.value ?? '');
              const lbl = String(child.properties?.label ?? '');
              statEls.push(
                el('div', { className: 'flex flex-col' },
                  el('p', { className: 'text-3xl sm:text-4xl font-extrabold text-white mb-2 tracking-tight' }, txt(val)),
                  el('p', { className: 'text-xs sm:text-sm text-zinc-400 leading-snug font-medium' }, txt(lbl))
                )
              );
              // Recurse: HTML5 parser nests <stat /> elements inside each other
              if (child.children?.length) collectStats(child.children);
            }
          }
        };

        collectStats(node.children || []);

        parent.children[index] = el(
          'div',
          { className: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 my-16 not-prose' },
          ...statEls
        );
        return;
      }

      // Standalone <stat> outside a stats-grid
      if (node.tagName === 'stat') {
        const val = String(node.properties?.value ?? '');
        const lbl = String(node.properties?.label ?? '');

        parent.children[index] = el(
          'div',
          { className: 'flex flex-col' },
          el('p', { className: 'text-3xl sm:text-4xl font-extrabold text-white mb-2 tracking-tight' }, txt(val)),
          el('p', { className: 'text-xs sm:text-sm text-zinc-400 leading-snug font-medium' }, txt(lbl))
        );
        return;
      }

      // ── Auto-embed YouTube Links (Legacy Fallback) ───────────────────
      if (node.tagName === 'p') {
        const nonSpaceChildren = node.children.filter((c: any) => !(c.type === 'text' && !c.value.trim()));
        if (nonSpaceChildren.length === 1 && nonSpaceChildren[0].tagName === 'a') {
          const child = nonSpaceChildren[0];
          const href = String(child.properties?.href || '');
          const ytMatch = href.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
          
          if (ytMatch && ytMatch[1]) {
            const videoId = ytMatch[1];
            parent.children[index] = el(
              'figure',
              { className: 'not-prose my-8' },
              el('iframe', {
                src: `https://www.youtube.com/embed/${videoId}`,
                className: 'aspect-video w-full rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-800',
                allowFullScreen: true,
                allow: 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture',
                title: 'YouTube Video'
              })
            );
            return;
          }
        }
      }

      // ── PDF Links (Open in new tab) ───────────────────────────────────
      if (node.tagName === 'a' && node.properties?.href) {
        const href = String(node.properties.href);
        if (href.toLowerCase().endsWith('.pdf')) {
          node.properties.target = '_blank';
          node.properties.rel = 'noopener noreferrer';
        }
        return;
      }
    });
  };
}
