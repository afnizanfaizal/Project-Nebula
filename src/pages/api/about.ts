export const prerender = false;

import type { APIRoute } from 'astro';
import { getProfile } from '../../lib/firebase-admin.js';

export const GET: APIRoute = async () => {
  try {
    const profile = await getProfile();
    return new Response(JSON.stringify(profile), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Get profile error:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch profile' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
