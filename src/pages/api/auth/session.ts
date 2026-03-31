export const prerender = false;

import type { APIRoute } from 'astro';
import { adminAuth } from '../../../lib/firebase-admin.js';

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const body = await request.json() as { idToken?: unknown };
    const { idToken } = body;
    if (typeof idToken !== 'string' || idToken.length === 0) {
      return new Response(JSON.stringify({ error: 'Missing idToken' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    await adminAuth.verifyIdToken(idToken);

    cookies.set('admin_session', idToken, {
      path: '/',
      httpOnly: true,
      secure: import.meta.env.PROD,
      sameSite: 'strict',
      maxAge: 60 * 60, // 1 hour (matches Firebase ID token TTL)
    });

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
