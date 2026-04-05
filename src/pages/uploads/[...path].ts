import type { APIRoute } from 'astro';
import { readFile } from 'node:fs/promises';
import { join, extname, normalize } from 'node:path';
import { adminStorage } from '../../lib/firebase-admin';

const CONTENT_TYPES: Record<string, string> = {
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png':  'image/png',
  '.gif':  'image/gif',
  '.webp': 'image/webp',
  '.pdf':  'application/pdf',
};

export const GET: APIRoute = async ({ params }) => {
  const raw = params.path ?? '';

  // Prevent path traversal
  const safe = normalize(raw).replace(/^(\.\.(\/|\\|$))+/, '');
  if (!safe || safe !== raw) {
    return new Response('Not found', { status: 404 });
  }

  const contentType = CONTENT_TYPES[extname(safe).toLowerCase()] ?? 'application/octet-stream';
  
  // 1. Try local filesystem first (legacy)
  const absPath = join(process.cwd(), 'public', 'uploads', safe);
  try {
    const buffer = await readFile(absPath);
    return new Response(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (localError) {
    // 2. Fallback to Firebase Storage
    try {
      const bucket = adminStorage.bucket();
      const file = bucket.file(`uploads/${safe}`);
      
      const [exists] = await file.exists();
      if (!exists) {
        return new Response('Not found', { status: 404 });
      }

      const [buffer] = await file.download();
      return new Response(new Uint8Array(buffer), {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
      });
    } catch (firebaseError) {
      console.error('Proxy error:', firebaseError);
      return new Response('Not found', { status: 404 });
    }
  }
};
