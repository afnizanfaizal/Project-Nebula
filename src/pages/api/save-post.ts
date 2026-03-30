// src/pages/api/save-post.ts
export const prerender = false;

import type { APIRoute } from 'astro';
import { writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';

function titleToSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function extractTitle(markdown: string): string {
  const match = markdown.match(/^title:\s*["']?(.+?)["']?\s*$/m);
  return match ? match[1] : 'untitled';
}

export const POST: APIRoute = async ({ request }) => {
  if (import.meta.env.PROD) {
    return new Response(JSON.stringify({ error: 'Not available in production' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const { markdown } = await request.json() as { markdown: string };
    const title = extractTitle(markdown);
    const slug = titleToSlug(title);
    const filename = `${slug}.mdx`;
    const dir = join(process.cwd(), 'src', 'content', 'blog');

    await mkdir(dir, { recursive: true });
    await writeFile(join(dir, filename), markdown, 'utf-8');

    return new Response(JSON.stringify({ ok: true, filename }), {
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
