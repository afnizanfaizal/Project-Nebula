// astro.config.mjs
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import react from '@astrojs/react';
import mdx from '@astrojs/mdx';
// @shikijs/rehype v4 only exports rehypeShiki as default, not as a named export
import rehypeShiki from '@shikijs/rehype';
import node from '@astrojs/node';

/**
 * Vite 7 crashes when a plugin has `transform: { filter: {...} }` with no `handler`
 * property — getHookHandler() returns undefined and handler.call() explodes.
 * This plugin removes such broken transform hooks before environment plugins are built.
 */
const patchBrokenTransforms = {
  name: 'patch-broken-transforms',
  enforce: /** @type {'pre'} */ ('pre'),
  configResolved(config) {
    let fixed = 0;
    for (const plugin of config.plugins) {
      if (
        plugin.transform != null &&
        typeof plugin.transform === 'object' &&
        !('handler' in plugin.transform)
      ) {
        console.warn(
          `[patch-broken-transforms] Removing broken transform from plugin: "${plugin.name}"`,
        );
        delete plugin.transform;
        fixed++;
      }
    }
    if (fixed > 0)
      console.warn(`[patch-broken-transforms] Fixed ${fixed} plugin(s)`);
  },
};

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
    plugins: [patchBrokenTransforms],
    ssr: {
      // Firebase ships browser-only ESM; Vite must bundle every @firebase/* sub-package
      // rather than externalize them, otherwise the EnvironmentPluginContainer transform
      // chain crashes on SSR pages that transitively import firebase.ts.
      noExternal: [/^firebase/, /^@firebase\//],
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
