import { r as renderMarkdown } from './render-markdown_ChQJYQKN.mjs';

const POST = async ({ request }) => {
  try {
    const { content } = await request.json();
    if (typeof content !== "string") {
      return new Response(JSON.stringify({ error: "Invalid content" }), { status: 400 });
    }
    const { html, headings } = await renderMarkdown(content);
    return new Response(JSON.stringify({ html, headings }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    console.error("Render Preview Error:", err);
    return new Response(JSON.stringify({ error: "Failed to render preview" }), { status: 500 });
  }
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  POST
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
