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

  // ip-api.com free tier is HTTP-only — intentional trade-off for a personal blog
  // Geo-lookup with 500ms timeout
  let countryCode = 'XX';
  try {
    const controller = new AbortController();
    const tid = setTimeout(() => controller.abort(), 500);
    const geoRes = await fetch(`http://ip-api.com/json/${ip}?fields=countryCode`, {
      signal: controller.signal,
    });
    clearTimeout(tid);
    if (geoRes.ok) {
      const geoData = await geoRes.json();
      if (typeof geoData.countryCode === 'string' && geoData.countryCode.length === 2) {
        countryCode = geoData.countryCode;
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
