import { adminDb } from './firebase-admin_ByUg6J6C.mjs';
import { FieldValue } from 'firebase-admin/firestore';

const prerender = false;
const POST = async ({ request }) => {
  let slug;
  try {
    const body = await request.json();
    slug = body?.slug;
    if (!slug || typeof slug !== "string") {
      return new Response(JSON.stringify({ error: "slug required" }), { status: 400 });
    }
    if (!/^[a-z0-9][a-z0-9-]*$/.test(slug)) {
      return new Response(JSON.stringify({ error: "invalid slug" }), { status: 400 });
    }
  } catch {
    return new Response(JSON.stringify({ error: "invalid json" }), { status: 400 });
  }
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? request.headers.get("x-real-ip") ?? "127.0.0.1";
  let countryCode = "XX";
  try {
    const controller = new AbortController();
    const tid = setTimeout(() => controller.abort(), 500);
    const geoRes = await fetch(`https://ipwho.is/${ip}?fields=country_code`, {
      signal: controller.signal
    });
    clearTimeout(tid);
    if (geoRes.ok) {
      const geoData = await geoRes.json();
      if (typeof geoData.country_code === "string" && geoData.country_code.length === 2) {
        countryCode = geoData.country_code;
      }
    }
  } catch {
  }
  const now = /* @__PURE__ */ new Date();
  const dateKey = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  ).toISOString().slice(0, 10);
  const dailyRef = adminDb.collection("analytics").doc(dateKey);
  const postRef = adminDb.collection("posts").doc(slug);
  try {
    await dailyRef.update({
      total: FieldValue.increment(1),
      [`posts.${slug}`]: FieldValue.increment(1),
      [`countries.${countryCode}`]: FieldValue.increment(1)
    });
  } catch (err) {
    if (err?.code === 5) {
      await dailyRef.set({
        total: FieldValue.increment(1),
        posts: { [slug]: FieldValue.increment(1) },
        countries: { [countryCode]: FieldValue.increment(1) }
      }, { merge: true });
    } else {
      throw err;
    }
  }
  await postRef.set({ views: FieldValue.increment(1) }, { merge: true });
  const postSnap = await postRef.get();
  const views = postSnap.data()?.views ?? 1;
  return new Response(JSON.stringify({ views }), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  POST,
  prerender
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
