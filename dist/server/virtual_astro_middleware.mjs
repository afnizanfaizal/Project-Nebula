import { a7 as defineMiddleware, ag as sequence } from './chunks/sequence_i9BfAQp7.mjs';
import 'piccolore';
import 'clsx';

const onRequest$1 = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;
  const isAdminPage = pathname.startsWith("/admin");
  const isAdminApi = pathname.startsWith("/api/admin/") || pathname === "/api/save-post";
  if (!isAdminPage && !isAdminApi) return next();
  if (pathname === "/admin" || pathname === "/admin/" || pathname === "/api/auth/session") {
    return next();
  }
  const token = context.cookies.get("admin_session")?.value;
  if (token) {
    try {
      const { isValidAdminToken } = await import('./chunks/firebase-admin_ByUg6J6C.mjs');
      if (await isValidAdminToken(token)) return next();
    } catch {
    }
  }
  if (isAdminApi) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" }
    });
  }
  return context.redirect("/admin");
});

const onRequest = sequence(
	
	onRequest$1
	
);

export { onRequest };
