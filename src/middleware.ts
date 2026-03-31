// src/middleware.ts
import { defineMiddleware } from 'astro:middleware';

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;

  const isAdminPage = pathname.startsWith('/admin');
  const isAdminApi  =
    pathname.startsWith('/api/admin/') ||
    pathname === '/api/save-post';

  // Public routes — no auth needed
  if (!isAdminPage && !isAdminApi) return next();

  // Allow the login page and the session endpoint without auth
  if (
    pathname === '/admin' ||
    pathname === '/admin/' ||
    pathname === '/api/auth/session'
  ) {
    return next();
  }

  const token = context.cookies.get('admin_session')?.value;
  if (token) {
    try {
      // Dynamic import: avoids loading firebase-admin for every public page
      const { isValidAdminToken } = await import('./lib/firebase-admin.js');
      if (await isValidAdminToken(token)) return next();
    } catch {
      // Module load failure — fall through to redirect/401
    }
  }

  if (isAdminApi) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return context.redirect('/admin');
});
