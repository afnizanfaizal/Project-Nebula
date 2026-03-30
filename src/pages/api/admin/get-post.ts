// src/pages/api/admin/get-post.ts
export const prerender = false;

import type { APIRoute } from 'astro';
import { getPost } from '../../../lib/firebase-admin.js';
import { Timestamp } from 'firebase-admin/firestore';

function formatDate(ts: Timestamp | undefined): string | undefined {
  if (!ts) return undefined;
  return ts instanceof Timestamp
    ? ts.toDate().toISOString().slice(0, 10)
    : String(ts);
}

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

  const post = await getPost(slug);
  if (!post) {
    return new Response(JSON.stringify({ error: 'Post not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Reconstruct the MDX frontmatter string for the editor
  const pubDateStr     = formatDate(post.pubDate) ?? new Date().toISOString().slice(0, 10);
  const updatedDateStr = formatDate(post.updatedDate);

  const lines = [
    '---',
    `title: ${JSON.stringify(post.title)}`,
    `pubDate: ${pubDateStr}`,
    `description: ${JSON.stringify(post.description ?? '')}`,
    `tags: ${JSON.stringify(post.tags ?? [])}`,
    `featured: ${post.featured ?? false}`,
    `draft: ${post.draft ?? false}`,
    ...(post.featuredImage ? [`featuredImage: ${JSON.stringify(post.featuredImage)}`] : []),
    ...(updatedDateStr     ? [`updatedDate: ${updatedDateStr}`]                       : []),
    '---',
    '',
    post.content ?? '',
  ];

  const content = lines.join('\n');

  return new Response(JSON.stringify({ content, slug }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
  });
};
