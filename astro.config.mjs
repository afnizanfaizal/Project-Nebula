// astro.config.mjs
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import react from '@astrojs/react';
import mdx from '@astrojs/mdx';
// @shikijs/rehype v4 only exports rehypeShiki as default, not as a named export
import rehypeShiki from '@shikijs/rehype';
import netlify from '@astrojs/netlify';

/**
 * Vite 7 crashes when a plugin hook is an object whose `handler` is missing or
 * not a function — getHookHandler() returns undefined and handler.call() explodes.
 * This patch covers all object-style hooks (transform, resolveId, load) on every
 * plugin so EnvironmentPluginContainer never receives a non-callable handler.
 */
const OBJECT_HOOKS = /** @type {const} */ (['transform', 'resolveId', 'load']);

const patchBrokenTransforms = {
  name: 'patch-broken-transforms',
  enforce: /** @type {'pre'} */ ('pre'),
  configResolved(config) {
    let fixed = 0;
    for (const plugin of config.plugins) {
      if (!plugin || typeof plugin !== 'object') continue;
      for (const hook of OBJECT_HOOKS) {
        const h = plugin[hook];
        if (h != null && typeof h === 'object' && typeof h.handler !== 'function') {
          console.warn(
            `[patch-broken-transforms] Removing broken "${hook}" hook from plugin: "${plugin.name}"`,
          );
          delete plugin[hook];
          fixed++;
        }
      }
    }
    if (fixed > 0)
      console.warn(`[patch-broken-transforms] Fixed ${fixed} hook(s) across plugins`);
  },
};

export default defineConfig({
  site: 'https://afnizanfaizal.my',
  // 'hybrid' mode was removed in Astro 6. Using 'server' with explicit
  // `export const prerender = true` on all static pages is the Astro 6 equivalent.
  output: 'server',
  adapter: netlify(),
  integrations: [
    tailwind({ applyBaseStyles: false }),
    react(),
    mdx(),
  ],
  vite: {
    plugins: [patchBrokenTransforms],
    ssr: {
      // firebase-admin is CJS and must be externalized so Node can load it natively.
      external: ['firebase-admin', 'firebase-admin/app', 'firebase-admin/firestore', 'firebase-admin/auth', 'firebase-admin/storage'],
      // The client-side Firebase SDK ships browser-only ESM; Vite must bundle every
      // @firebase/* sub-package rather than externalize them, otherwise the
      // EnvironmentPluginContainer transform chain crashes on SSR pages that
      // transitively import firebase.ts.
      noExternal: [/^@firebase\//, /^firebase(?!-admin)/],
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
