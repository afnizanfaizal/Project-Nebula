export const prerender = false;

import type { APIRoute } from 'astro';
import { writeFile, mkdir } from 'node:fs/promises';
import { join, extname } from 'node:path';
import { randomBytes } from 'node:crypto';

export const POST: APIRoute = async ({ request }) => {
  const formData = await request.formData();
  const file = formData.get('image');

  if (!(file instanceof File) || file.size === 0) {
    return new Response(JSON.stringify({ error: 'No image provided' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
  if (!allowedTypes.includes(file.type)) {
    return new Response(JSON.stringify({ error: 'Invalid file type' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const ext = extname(file.name) || '.jpg';
  const name = randomBytes(8).toString('hex') + ext;

  const uploadDir = join(process.cwd(), 'public', 'uploads');
  await mkdir(uploadDir, { recursive: true });
  await writeFile(join(uploadDir, name), Buffer.from(await file.arrayBuffer()));

  return new Response(JSON.stringify({ url: `/uploads/${name}` }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
