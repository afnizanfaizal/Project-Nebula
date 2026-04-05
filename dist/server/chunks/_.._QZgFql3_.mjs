import { readFile } from 'node:fs/promises';
import { normalize, extname, join } from 'node:path';
import { adminStorage } from './firebase-admin_ByUg6J6C.mjs';

const CONTENT_TYPES = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".pdf": "application/pdf"
};
const GET = async ({ params }) => {
  const raw = params.path ?? "";
  const safe = normalize(raw).replace(/^(\.\.(\/|\\|$))+/, "");
  if (!safe || safe !== raw) {
    return new Response("Not found", { status: 404 });
  }
  const contentType = CONTENT_TYPES[extname(safe).toLowerCase()] ?? "application/octet-stream";
  const absPath = join(process.cwd(), "public", "uploads", safe);
  try {
    const buffer = await readFile(absPath);
    return new Response(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable"
      }
    });
  } catch (localError) {
    try {
      const bucket = adminStorage.bucket();
      const file = bucket.file(`uploads/${safe}`);
      const [exists] = await file.exists();
      if (!exists) {
        return new Response("Not found", { status: 404 });
      }
      const [buffer] = await file.download();
      return new Response(new Uint8Array(buffer), {
        status: 200,
        headers: {
          "Content-Type": contentType,
          "Cache-Control": "public, max-age=31536000, immutable"
        }
      });
    } catch (firebaseError) {
      console.error("Proxy error:", firebaseError);
      return new Response("Not found", { status: 404 });
    }
  }
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  GET
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
