import type { APIRoute } from 'astro';
import { adminStorage } from '../../../lib/firebase-admin';

export const GET: APIRoute = async () => {
  try {
    const bucket = adminStorage.bucket();
    const [files] = await bucket.getFiles({ prefix: 'uploads/' });

    const images = files
      .filter(file => /\.(jpg|jpeg|png|gif|webp|pdf)$/i.test(file.name))
      .map(file => {
        const name = file.name.replace('uploads/', '');
        const metadata = file.metadata;
        const ext = name.split('.').pop()?.toLowerCase() || '';
        
        return {
          name,
          url: `https://storage.googleapis.com/${bucket.name}/uploads/${name}`,
          size: parseInt(String(metadata.size || '0')),
          mtime: new Date(String(metadata.updated || 0)).getTime(),
          type: ext === 'pdf' ? 'application/pdf' : 'image',
        };
      });

    // Sort by most recent first
    images.sort((a, b) => b.mtime - a.mtime);

    return new Response(JSON.stringify({ images }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('List images error:', error);
    return new Response(JSON.stringify({ images: [] }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
