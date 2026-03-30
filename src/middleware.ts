// src/middleware.ts
import { defineMiddleware } from 'astro:middleware';

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;

  if (!pathname.startsWith('/admin')) {
    return next();
  }

  // Allow the login page itself
  if (pathname === '/admin' || pathname === '/admin/') {
    return next();
  }

  const cookie = context.cookies.get('admin_session');
  if (cookie?.value === import.meta.env.ADMIN_PASSWORD) {
    return next();
  }

  return context.redirect('/admin');
});
