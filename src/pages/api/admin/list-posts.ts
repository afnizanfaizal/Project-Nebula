export const prerender = false;

import type { APIRoute } from 'astro';
import { listPosts } from '../../../lib/firebase-admin.js';

export const GET: APIRoute = async () => {
  const posts = await listPosts();
  return new Response(JSON.stringify(posts), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
  });
};
