// src/pages/uploads/[...path].ts
// Dynamically serves files from public/uploads/ so images uploaded via the
// admin editor are immediately available without restarting the dev server.
// (Vite's static-file middleware caches the public/ directory at startup and
// won't serve files written there after the server starts.)
export const prerender = false;

import type { APIRoute } from 'astro';
import { readFile } from 'node:fs/promises';
import { join, extname, normalize } from 'node:path';

const CONTENT_TYPES: Record<string, string> = {
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png':  'image/png',
  '.gif':  'image/gif',
  '.webp': 'image/webp',
  '.svg':  'image/svg+xml',
};

export const GET: APIRoute = async ({ params }) => {
  const raw = params.path ?? '';

  // Prevent path traversal
  const safe = normalize(raw).replace(/^(\.\.(\/|\\|$))+/, '');
  if (!safe || safe !== raw) {
    return new Response('Not found', { status: 404 });
  }

  const contentType = CONTENT_TYPES[extname(safe).toLowerCase()] ?? 'application/octet-stream';
  const absPath = join(process.cwd(), 'public', 'uploads', safe);

  try {
    const buffer = await readFile(absPath);
    return new Response(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch {
    return new Response('Not found', { status: 404 });
  }
};
