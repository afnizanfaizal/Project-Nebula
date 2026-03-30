// astro.config.mjs
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import react from '@astrojs/react';
import mdx from '@astrojs/mdx';
// @shikijs/rehype v4 only exports rehypeShiki as default, not as a named export
import rehypeShiki from '@shikijs/rehype';
import node from '@astrojs/node';

export default defineConfig({
  site: 'https://afnizanfaizal.com',
  // 'hybrid' mode was removed in Astro 6. Using 'server' with explicit
  // `export const prerender = true` on all static pages is the Astro 6 equivalent.
  output: 'server',
  adapter: node({ mode: 'standalone' }),
  integrations: [
    tailwind({ applyBaseStyles: false }),
    react(),
    mdx(),
  ],
  vite: {
    ssr: {
      // Firebase ESM modules use browser-specific constructs (import.meta, etc.)
      // that Vite must bundle rather than externalize for SSR to work correctly.
      noExternal: ['firebase', '@firebase/app', '@firebase/firestore', '@firebase/util', '@firebase/component', '@firebase/logger'],
    },
  },
  markdown: {
    syntaxHighlight: false,
    rehypePlugins: [
      [rehypeShiki, {
        themes: {
          light: 'github-light',
          dark: 'github-dark-default',
        },
      }],
    ],
  },
});
