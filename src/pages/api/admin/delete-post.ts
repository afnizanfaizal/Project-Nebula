export const prerender = false;

import type { APIRoute } from 'astro';
import { deletePost } from '../../../lib/firebase-admin.js';

export const DELETE: APIRoute = async ({ url }) => {
  const slug = url.searchParams.get('slug');
  if (!slug || !/^[a-z0-9][a-z0-9-]*$/.test(slug)) {
    return new Response(JSON.stringify({ error: 'Invalid slug' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  await deletePost(slug);

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
