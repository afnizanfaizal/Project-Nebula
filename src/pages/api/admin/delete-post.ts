// src/pages/api/admin/delete-post.ts
export const prerender = false;

import type { APIRoute } from 'astro';
import { unlink } from 'node:fs/promises';
import { join } from 'node:path';

export const DELETE: APIRoute = async ({ url, cookies }) => {
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
      await unlink(join(base, `${slug}${ext}`));
      return new Response(JSON.stringify({ ok: true }), {
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
