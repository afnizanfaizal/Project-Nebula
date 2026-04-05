import { deletePost } from './firebase-admin_ByUg6J6C.mjs';

const prerender = false;
const DELETE = async ({ url }) => {
  const slug = url.searchParams.get("slug");
  if (!slug || !/^[a-z0-9][a-z0-9-]*$/.test(slug)) {
    return new Response(JSON.stringify({ error: "Invalid slug" }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }
  await deletePost(slug);
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  DELETE,
  prerender
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
