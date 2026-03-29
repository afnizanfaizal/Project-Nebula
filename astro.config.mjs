// astro.config.mjs
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import react from '@astrojs/react';
import mdx from '@astrojs/mdx';
import rehypeShiki from '@shikijs/rehype';

export default defineConfig({
  output: 'server',
  integrations: [
    tailwind({ applyBaseStyles: false }),
    react(),
    mdx(),
  ],
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
