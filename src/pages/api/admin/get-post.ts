// src/pages/api/admin/get-post.ts
export const prerender = false;

import type { APIRoute } from 'astro';
import { getPost } from '../../../lib/firebase-admin.js';
import { Timestamp } from 'firebase-admin/firestore';

export const GET: APIRoute = async ({ url }) => {
  const slug = url.searchParams.get('slug');
  if (!slug || !/^[a-z0-9][a-z0-9-]*$/.test(slug)) {
    return new Response(JSON.stringify({ error: 'Invalid slug' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const post = await getPost(slug);
  if (!post) {
    return new Response(JSON.stringify({ error: 'Post not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const pubDate = post.pubDate instanceof Timestamp
    ? post.pubDate.toDate().toISOString().slice(0, 10)
    : new Date().toISOString().slice(0, 10);

  return new Response(JSON.stringify({
    meta: {
      title:         post.title ?? '',
      slug:          post.slug,
      description:   post.description ?? '',
      featuredImage: post.featuredImage ?? '',
      tags:          post.tags ?? [],
      status:        post.draft ? 'draft' : 'published',
      featured:      post.featured ?? false,
      isProject:     post.isProject ?? false,
      pubDate,
    },
    body: post.content ?? '',
  }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
  });
};
