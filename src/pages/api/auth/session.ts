export const prerender = false;

import type { APIRoute } from 'astro';
import { adminAuth } from '../../../lib/firebase-admin.js';

// Session cookie TTL: 1 hour (must be provided in milliseconds to createSessionCookie)
const SESSION_DURATION_MS = 60 * 60 * 1000;
const SESSION_DURATION_S  = 60 * 60;

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

    // Verify the ID token is valid before creating a session cookie
    await adminAuth.verifyIdToken(idToken);

    // Exchange the short-lived ID token for a revocable, opaque session cookie.
    // Unlike storing the raw JWT, this cookie can be revoked server-side at any
    // time via adminAuth.revokeRefreshTokens(uid).
    const sessionCookie = await adminAuth.createSessionCookie(idToken, {
      expiresIn: SESSION_DURATION_MS,
    });

    cookies.set('admin_session', sessionCookie, {
      path: '/',
      httpOnly: true,
      secure: import.meta.env.PROD,
      sameSite: 'strict',
      maxAge: SESSION_DURATION_S,
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
