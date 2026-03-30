// src/pages/api/admin/list-posts.ts
export const prerender = false;

import type { APIRoute } from 'astro';
import { listPosts } from '../../../lib/firebase-admin.js';

export const GET: APIRoute = async ({ cookies }) => {
  if (cookies.get('admin_session')?.value !== 'authenticated') {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const posts = await listPosts();

  return new Response(JSON.stringify(posts), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
  });
};
