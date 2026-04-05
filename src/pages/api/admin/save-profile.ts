export const prerender = false;

import type { APIRoute } from 'astro';
import { isValidAdminToken, saveProfile } from '../../../lib/firebase-admin.js';
import type { ProfileDocument } from '../../../lib/firebase-admin.js';

export const POST: APIRoute = async ({ request, cookies }) => {
  const token = cookies.get('admin_session')?.value;
  if (!(await isValidAdminToken(token))) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const data = await request.json() as Partial<ProfileDocument>;

    // Basic validation
    if (data.name !== undefined && typeof data.name !== 'string') {
      return new Response(JSON.stringify({ error: 'Invalid name' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Sanitize arrays
    if (data.skills && !Array.isArray(data.skills)) {
      return new Response(JSON.stringify({ error: 'Skills must be an array' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    await saveProfile(data);

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Save profile error:', error);
    return new Response(JSON.stringify({ error: 'Failed to save profile' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
