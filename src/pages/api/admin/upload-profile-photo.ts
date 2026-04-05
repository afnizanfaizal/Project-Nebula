export const prerender = false;

import type { APIRoute } from 'astro';
import { extname } from 'node:path';
import { adminStorage, saveProfile } from '../../../lib/firebase-admin.js';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export const POST: APIRoute = async ({ request }) => {
  const formData = await request.formData();
  const file = formData.get('file');

  if (!(file instanceof File) || file.size === 0) {
    return new Response(JSON.stringify({ error: 'No file provided' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (file.size > MAX_FILE_SIZE) {
    return new Response(JSON.stringify({ error: 'File too large (max 5 MB)' }), {
      status: 413,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return new Response(JSON.stringify({ error: 'Only JPEG, PNG, or WebP images are allowed' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const bucket = adminStorage.bucket();
    const ext = extname(file.name) || '.jpg';

    // Always use the same fixed path — this replaces the previous photo
    const storagePath = `profile/photo${ext}`;

    // Delete any existing profile photo files (different extensions)
    const [existingFiles] = await bucket.getFiles({ prefix: 'profile/photo' });
    await Promise.all(existingFiles.map(f => f.delete().catch(() => null)));

    const blob = bucket.file(storagePath);
    const buffer = Buffer.from(await file.arrayBuffer());

    await blob.save(buffer, { contentType: file.type });
    await blob.makePublic();

    // Add cache-busting timestamp so the browser reloads the new photo
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${storagePath}?v=${Date.now()}`;

    // Persist the new URL into the profile document
    await saveProfile({ profilePhoto: publicUrl });

    return new Response(JSON.stringify({ url: publicUrl }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Profile photo upload error:', error);
    return new Response(JSON.stringify({ error: 'Upload failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
