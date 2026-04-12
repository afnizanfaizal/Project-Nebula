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
 * This patch covers all standard hooks across all plugins (including worker plugins)
 * to ensure no invalid non-callable handlers are ever invoked by Vite.
 */
const ALL_HOOKS = /** @type {const} */ ([
  'transform', 'resolveId', 'load', 'buildStart', 'buildEnd', 
  'closeBundle', 'config', 'configResolved', 'configureServer', 
  'configurePreviewServer', 'transformIndexHtml', 'handleHotUpdate'
]);

/**
 * @param {import('vite').Plugin[]} plugins
 */
function sanitizePlugins(plugins) {
  if (!plugins || !Array.isArray(plugins)) return 0;
  let fixed = 0;
  for (const plugin of plugins) {
    if (!plugin || typeof plugin !== 'object') continue;
    for (const hook of ALL_HOOKS) {
      if (hook in plugin) {
        const h = plugin[hook];
        // If it's not a function and not a valid hook-object with a handler, it's broken
        const isNotFunction = typeof h !== 'function';
        const isInvalidObject = typeof h === 'object' && h !== null && typeof h.handler !== 'function';
        
        if (isNotFunction && isInvalidObject) {
          console.warn(`[patch-broken-transforms] Removing broken "${hook}" hook from plugin: "${plugin.name}"`);
          delete plugin[hook];
          fixed++;
        }
      }
    }
  }
  return fixed;
}

const patchBrokenTransforms = {
  name: 'patch-broken-transforms',
  enforce: /** @type {'pre'} */ ('pre'),
  configResolved(config) {
    let total = sanitizePlugins(config.plugins);
    
    // Support Vite 7 environments
    if (config.environments) {
      for (const envName in config.environments) {
        const env = config.environments[envName];
        if (env.plugins) {
          total += sanitizePlugins(env.plugins);
        }
      }
    }

    if (config.worker && config.worker.plugins) {
      total += sanitizePlugins(config.worker.plugins);
    }
    if (total > 0) {
      console.warn(`[patch-broken-transforms] Fixed ${total} broken hook(s) across plugins/environments in configResolved`);
    }
  },
  buildStart() {},
  configureServer() {}
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
      noExternal: [
        /^@firebase\//,
        /^firebase(?!-admin)/,
        /^@mdxeditor\//,
        /^@lexical\//,
        /^@codemirror\//,
        'codemirror',
      ],
    },
  },
  markdown: {
    syntaxHighlight: false,
    rehypePlugins: [
      [rehypeShiki, {
        theme: 'github-dark-default',
      }],
    ],
  },
});
