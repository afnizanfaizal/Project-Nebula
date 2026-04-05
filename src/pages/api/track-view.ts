// src/pages/api/track-view.ts
import type { APIRoute } from 'astro';
import { adminDb } from '../../lib/firebase-admin.js';
import { FieldValue } from 'firebase-admin/firestore';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
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

  // Derive visitor IP
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    '127.0.0.1';

  // Geo-lookup via ipwho.is (HTTPS, free tier ~10k req/month, 500ms timeout).
  // Falls back to 'XX' on any error — view is always recorded regardless.
  let countryCode = 'XX';
  try {
    const controller = new AbortController();
    const tid = setTimeout(() => controller.abort(), 500);
    const geoRes = await fetch(`https://ipwho.is/${ip}?fields=country_code`, {
      signal: controller.signal,
    });
    clearTimeout(tid);
    if (geoRes.ok) {
      const geoData = await geoRes.json();
      if (typeof geoData.country_code === 'string' && geoData.country_code.length === 2) {
        countryCode = geoData.country_code;
      }
    }
  } catch {
    // Geo failure is non-fatal — view is still recorded under 'XX'
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
