import type { APIRoute } from 'astro';
import { extname } from 'node:path';
import { randomBytes } from 'node:crypto';
import { adminStorage } from '../../../lib/firebase-admin';

// 10 MB hard cap – prevents large uploads from exhausting server memory
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// SVG is intentionally excluded: SVG files can embed <script> tags and
// execute JavaScript in the browser when served from the same origin (XSS).
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];

export const POST: APIRoute = async ({ request }) => {
  const formData = await request.formData();
  const file = formData.get('image');

  if (!(file instanceof File) || file.size === 0) {
    return new Response(JSON.stringify({ error: 'No image provided' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (file.size > MAX_FILE_SIZE) {
    return new Response(JSON.stringify({ error: 'File too large (max 10 MB)' }), {
      status: 413,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return new Response(JSON.stringify({ error: 'Invalid file type. Allowed: JPEG, PNG, GIF, WebP, PDF' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const ext = extname(file.name) || '.jpg';
  const originalBaseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
  
  // Sanitize the base name to be URL-safe
  const safeBaseName = originalBaseName
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-_]/g, '');
    
  // Fallback to random if the filename was entirely special characters
  const finalBaseName = safeBaseName || randomBytes(4).toString('hex');
  const name = `${finalBaseName}${ext}`;

  try {
    const bucket = adminStorage.bucket();
    const blob = bucket.file(`uploads/${name}`);
    const buffer = Buffer.from(await file.arrayBuffer());

    await blob.save(buffer, {
      contentType: file.type,
      // Metadata is still useful
    });

    // Make the file public so we can use a direct link
    await blob.makePublic();

    // Firebase Storage doesn't have a direct "getPublicURL" that returns the 
    // firebasestorage.googleapis.com link easily with Admin SDK without signed URLs.
    // However, the standard public URL is:
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/uploads/${name}`;

    return new Response(JSON.stringify({ url: publicUrl }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Upload error:', error);
    return new Response(JSON.stringify({ error: 'Failed to upload to storage' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

