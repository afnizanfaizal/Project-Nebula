// src/content.config.ts
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({
    // NOTE: Content files must stay at root level of this directory — no subdirectories.
    // Nested paths (e.g., 2026/post.mdx) would produce IDs like "2026/post.mdx" and
    // break the flat /blog/[slug] routing in src/pages/blog/[slug].astro.
    pattern: '**/*.{md,mdx}',
    base: './src/content/blog',
  }),
  schema: z.object({
    title: z.string(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    description: z.string(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
    heroImage: z.string().optional(),
    featured: z.boolean().default(false),
  }),
});

const projects = defineCollection({
  loader: glob({
    // NOTE: Content files must stay at root level of this directory — no subdirectories.
    // Nested paths (e.g., 2026/post.mdx) would produce IDs like "2026/post.mdx" and
    // break the flat /blog/[slug] routing in src/pages/blog/[slug].astro.
    pattern: '**/*.{md,mdx}',
    base: './src/content/projects',
  }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    tags: z.array(z.string()).default([]),
    status: z.enum(['active', 'completed', 'archived']),
    link: z.string().url().optional(),
    pubDate: z.coerce.date(),
  }),
});

export const collections = { blog, projects };
