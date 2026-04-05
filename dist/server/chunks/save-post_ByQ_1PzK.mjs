import { Timestamp } from 'firebase-admin/firestore';
import { savePost } from './firebase-admin_ByUg6J6C.mjs';

const prerender = false;
const POST = async ({ request }) => {
  try {
    const payload = await request.json();
    const { meta, body } = payload;
    if (!meta?.slug || !/^[a-z0-9][a-z0-9-]*$/.test(meta.slug)) {
      return new Response(JSON.stringify({ error: "Invalid slug" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    if (typeof meta.title !== "string" || meta.title.trim().length === 0) {
      return new Response(JSON.stringify({ error: "Title is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    if (typeof body !== "string") {
      return new Response(JSON.stringify({ error: "Invalid body" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    const pubDate = meta.pubDate ? Timestamp.fromDate(new Date(meta.pubDate)) : Timestamp.now();
    await savePost(meta.slug, {
      title: meta.title.trim(),
      description: meta.description ?? "",
      pubDate,
      tags: Array.isArray(meta.tags) ? meta.tags.map(String) : [],
      draft: meta.status === "draft",
      featured: Boolean(meta.featured),
      isProject: Boolean(meta.isProject),
      ...meta.featuredImage ? { featuredImage: meta.featuredImage } : {},
      content: body
    });
    return new Response(JSON.stringify({ ok: true, slug: meta.slug }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
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
