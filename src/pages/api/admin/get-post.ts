// src/pages/api/admin/get-post.ts
// Returns raw MDX file content for the editor to load existing posts
export const prerender = false;

import type { APIRoute } from 'astro';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

export const GET: APIRoute = async ({ url, cookies }) => {
  if (cookies.get('admin_session')?.value !== 'authenticated') {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const slug = url.searchParams.get('slug');
  if (!slug || !/^[a-z0-9][a-z0-9-]*$/.test(slug)) {
    return new Response(JSON.stringify({ error: 'Invalid slug' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const base = join(process.cwd(), 'src', 'content', 'blog');

  for (const ext of ['.mdx', '.md']) {
    try {
      const content = await readFile(join(base, `${slug}${ext}`), 'utf-8');
      return new Response(JSON.stringify({ content, slug }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch {
      // try next extension
    }
  }

  return new Response(JSON.stringify({ error: 'Post not found' }), {
    status: 404,
    headers: { 'Content-Type': 'application/json' },
  });
};
