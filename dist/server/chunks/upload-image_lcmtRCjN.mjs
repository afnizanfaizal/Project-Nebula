import { extname } from 'node:path';
import { randomBytes } from 'node:crypto';
import { adminStorage } from './firebase-admin_ByUg6J6C.mjs';

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp", "application/pdf"];
const POST = async ({ request }) => {
  const formData = await request.formData();
  const file = formData.get("image");
  if (!(file instanceof File) || file.size === 0) {
    return new Response(JSON.stringify({ error: "No image provided" }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }
  if (file.size > MAX_FILE_SIZE) {
    return new Response(JSON.stringify({ error: "File too large (max 10 MB)" }), {
      status: 413,
      headers: { "Content-Type": "application/json" }
    });
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return new Response(JSON.stringify({ error: "Invalid file type. Allowed: JPEG, PNG, GIF, WebP, PDF" }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }
  const ext = extname(file.name) || ".jpg";
  const name = randomBytes(8).toString("hex") + ext;
  try {
    const bucket = adminStorage.bucket();
    const blob = bucket.file(`uploads/${name}`);
    const buffer = Buffer.from(await file.arrayBuffer());
    await blob.save(buffer, {
      contentType: file.type
      // Metadata is still useful
    });
    await blob.makePublic();
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/uploads/${name}`;
    return new Response(JSON.stringify({ url: publicUrl }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Upload error:", error);
    return new Response(JSON.stringify({ error: "Failed to upload to storage" }), {
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
