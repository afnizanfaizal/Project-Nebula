import { adminStorage } from './firebase-admin_ByUg6J6C.mjs';

const GET = async () => {
  try {
    const bucket = adminStorage.bucket();
    const [files] = await bucket.getFiles({ prefix: "uploads/" });
    console.log(`[API] Listing images from bucket: ${bucket.name}, found ${files.length} files`);
    const images = files.filter((file) => {
      const isValid = /\.(jpg|jpeg|png|gif|webp|pdf)$/i.test(file.name);
      if (!isValid) console.log(`[API] Skipping non-image file: ${file.name}`);
      return isValid;
    }).map((file) => {
      const name = file.name.replace("uploads/", "");
      const metadata = file.metadata;
      const ext = name.split(".").pop()?.toLowerCase() || "";
      return {
        name,
        url: `https://storage.googleapis.com/${bucket.name}/uploads/${name}`,
        size: parseInt(String(metadata.size || "0")),
        mtime: new Date(String(metadata.updated || 0)).getTime(),
        type: ext === "pdf" ? "application/pdf" : "image"
      };
    });
    images.sort((a, b) => b.mtime - a.mtime);
    return new Response(JSON.stringify({ images }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("List images error:", error);
    return new Response(JSON.stringify({ images: [] }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  }
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  GET
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
