import { adminStorage } from './firebase-admin_ByUg6J6C.mjs';

const DELETE = async ({ request }) => {
  const url = new URL(request.url);
  const fileName = url.searchParams.get("name");
  if (!fileName) {
    return new Response(JSON.stringify({ error: "No filename provided" }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }
  try {
    const bucket = adminStorage.bucket();
    const file = bucket.file(`uploads/${fileName}`);
    const [exists] = await file.exists();
    if (!exists) {
      return new Response(JSON.stringify({ error: "File not found in storage" }), {
        status: 404,
        headers: { "Content-Type": "application/json" }
      });
    }
    await file.delete();
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Delete image error:", error);
    return new Response(JSON.stringify({ error: "Failed to delete file from storage" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  DELETE
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
