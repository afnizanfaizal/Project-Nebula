import { adminStorage } from './firebase-admin_ByUg6J6C.mjs';

const POST = async ({ request }) => {
  try {
    const { names } = await request.json();
    if (!Array.isArray(names) || names.length === 0) {
      return new Response(JSON.stringify({ error: "No filenames provided or invalid format" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    const bucket = adminStorage.bucket();
    const results = {
      success: [],
      failed: []
    };
    for (const name of names) {
      try {
        const file = bucket.file(`uploads/${name}`);
        const [exists] = await file.exists();
        if (!exists) {
          results.failed.push({ name, error: "Not found in storage" });
          continue;
        }
        await file.delete();
        results.success.push(name);
      } catch (error) {
        console.error(`Error deleting ${name}:`, error);
        results.failed.push({ name, error: "Failed to delete" });
      }
    }
    return new Response(JSON.stringify({ results }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    console.error("Bulk delete error:", err);
    return new Response(JSON.stringify({ error: "An unexpected error occurred" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  POST
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
