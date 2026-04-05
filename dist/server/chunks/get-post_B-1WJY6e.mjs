import { getPost } from './firebase-admin_ByUg6J6C.mjs';
import { Timestamp } from 'firebase-admin/firestore';

const prerender = false;
const GET = async ({ url }) => {
  const slug = url.searchParams.get("slug");
  if (!slug || !/^[a-z0-9][a-z0-9-]*$/.test(slug)) {
    return new Response(JSON.stringify({ error: "Invalid slug" }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }
  const post = await getPost(slug);
  if (!post) {
    return new Response(JSON.stringify({ error: "Post not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" }
    });
  }
  const pubDate = post.pubDate instanceof Timestamp ? post.pubDate.toDate().toISOString().slice(0, 10) : (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
  return new Response(JSON.stringify({
    meta: {
      title: post.title ?? "",
      slug: post.slug,
      description: post.description ?? "",
      featuredImage: post.featuredImage ?? "",
      tags: post.tags ?? [],
      status: post.draft ? "draft" : "published",
      featured: post.featured ?? false,
      isProject: post.isProject ?? false,
      pubDate
    },
    body: post.content ?? ""
  }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store"
    }
  });
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  GET,
  prerender
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
