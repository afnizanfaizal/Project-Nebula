// src/pages/api/track-view.ts
import type { APIRoute } from 'astro';
import { adminDb } from '../../lib/firebase-admin.js';
import { FieldValue } from 'firebase-admin/firestore';

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  // Parse body
  let slug: string;
  try {
    const body = await request.json();
    slug = body?.slug;
    if (!slug || typeof slug !== 'string') {
      return new Response(JSON.stringify({ error: 'slug required' }), { status: 400 });
    }
    if (!/^[a-z0-9][a-z0-9-]*$/.test(slug)) {
      return new Response(JSON.stringify({ error: 'invalid slug' }), { status: 400 });
    }
  } catch {
    return new Response(JSON.stringify({ error: 'invalid json' }), { status: 400 });
  }

  // 1. Detect Country natively (Netlify/Vercel/Cloudflare)
  // This automatically tracks any country based on the IP address via the hosting provider's edge network,
  // without the latency of an external API call.
  // We check Astro.locals.netlify first, then a variety of common edge headers.
  const netlifyLocalsCountry = (locals as any)?.netlify?.context?.geo?.country?.code;
  
  const headerCountry = 
    request.headers.get('x-country') ||
    request.headers.get('x-country-code') ||
    request.headers.get('x-nf-client-connection-ip-country') ||
    request.headers.get('x-vercel-ip-country') ||
    request.headers.get('cf-ipcountry');

  let countryCode = (netlifyLocalsCountry || headerCountry || 'XX').toUpperCase();

  // Local testing override
  if (import.meta.env.DEV) {
    if (countryCode === 'XX') {
       countryCode = 'MY'; // Simulate Malaysia in local dev to verify it works
    }
  }

  // UTC date key
  const now = new Date();
  const dateKey = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  ).toISOString().slice(0, 10);

  const dailyRef = adminDb.collection('analytics').doc(dateKey);
  const postRef  = adminDb.collection('posts').doc(slug);

  // Write to daily analytics — use update() (dot-notation increments) with
  // set() fallback for the first view of a new day.
  try {
    await dailyRef.update({
      total:                          FieldValue.increment(1),
      [`posts.${slug}`]:              FieldValue.increment(1),
      [`countries.${countryCode}`]:   FieldValue.increment(1),
    });
  } catch (err: any) {
    // gRPC NOT_FOUND (code 5) — doc doesn't exist yet, create it
    if (err?.code === 5) {
      await dailyRef.set({
        total:     FieldValue.increment(1),
        posts:     { [slug]: FieldValue.increment(1) },
        countries: { [countryCode]: FieldValue.increment(1) },
      }, { merge: true });
    } else {
      throw err;
    }
  }

  // Increment post view counter and read back the new total
  await postRef.set({ views: FieldValue.increment(1) }, { merge: true });
  const postSnap = await postRef.get();
  const views = (postSnap.data()?.views as number) ?? 1;

  return new Response(JSON.stringify({ views }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
