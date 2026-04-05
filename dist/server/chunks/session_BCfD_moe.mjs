import { adminAuth } from './firebase-admin_ByUg6J6C.mjs';

const prerender = false;
const SESSION_DURATION_MS = 60 * 60 * 1e3;
const SESSION_DURATION_S = 60 * 60;
const POST = async ({ request, cookies }) => {
  try {
    const body = await request.json();
    const { idToken } = body;
    if (typeof idToken !== "string" || idToken.length === 0) {
      return new Response(JSON.stringify({ error: "Missing idToken" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    await adminAuth.verifyIdToken(idToken);
    const sessionCookie = await adminAuth.createSessionCookie(idToken, {
      expiresIn: SESSION_DURATION_MS
    });
    cookies.set("admin_session", sessionCookie, {
      path: "/",
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      maxAge: SESSION_DURATION_S
    });
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" }
    });
  }
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  POST,
  prerender
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
