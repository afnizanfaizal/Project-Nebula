// src/pages/api/save-post.ts
export const prerender = false;

import type { APIRoute } from 'astro';
import matter from 'gray-matter';
import { Timestamp } from 'firebase-admin/firestore';
import { savePost } from '../../lib/firebase-admin.js';

function titleToSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export const POST: APIRoute = async (context) => {
  const { request } = context;

  if (context.cookies.get('admin_session')?.value !== 'authenticated') {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await request.json() as { markdown: unknown; slug?: unknown };
    const markdown = body.markdown;
    if (typeof markdown !== 'string' || markdown.length === 0) {
      return new Response(JSON.stringify({ error: 'Invalid markdown' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { data, content } = matter(markdown);

    const explicitSlug =
      typeof body.slug === 'string' && /^[a-z0-9][a-z0-9-]*$/.test(body.slug)
        ? body.slug
        : null;
    const slug = explicitSlug ?? titleToSlug(String(data.title ?? 'untitled'));

    const pubDate = data.pubDate
      ? Timestamp.fromDate(new Date(data.pubDate as string))
      : Timestamp.now();

    const updatedDate = data.updatedDate
      ? Timestamp.fromDate(new Date(data.updatedDate as string))
      : undefined;

    await savePost(slug, {
      title:         String(data.title ?? ''),
      description:   String(data.description ?? ''),
      pubDate,
      ...(updatedDate ? { updatedDate } : {}),
      tags:          Array.isArray(data.tags) ? data.tags.map(String) : [],
      draft:         Boolean(data.draft ?? false),
      featured:      Boolean(data.featured ?? false),
      ...(data.featuredImage ? { featuredImage: String(data.featuredImage) } : {}),
      content:       content.trimStart(),
    });

    return new Response(JSON.stringify({ ok: true, slug }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
