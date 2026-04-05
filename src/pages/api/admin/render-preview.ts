import type { APIRoute } from 'astro';
import { renderMarkdown } from '../../../lib/render-markdown';

export const POST: APIRoute = async ({ request }) => {
  try {
    const { content } = await request.json();
    
    if (typeof content !== 'string') {
      return new Response(JSON.stringify({ error: 'Invalid content' }), { status: 400 });
    }

    const { html, headings } = await renderMarkdown(content);

    return new Response(JSON.stringify({ html, headings }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Render Preview Error:', err);
    return new Response(JSON.stringify({ error: 'Failed to render preview' }), { status: 500 });
  }
};
