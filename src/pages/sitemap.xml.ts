import type { APIRoute } from 'astro';
import { listPosts } from '../lib/firebase-admin.js';

export const GET: APIRoute = async ({ site }) => {
  const siteBase = site?.toString().replace(/\/$/, '') ?? 'https://afnizanfaizal.my';

  const allPosts = await listPosts();
  const published = allPosts.filter(p => !p.draft);

  const staticPages = [
    { url: '/', priority: '1.0', changefreq: 'daily' },
    { url: '/about', priority: '0.8', changefreq: 'monthly' },
    { url: '/projects', priority: '0.8', changefreq: 'weekly' },
  ];

  const postEntries = published.map(post => ({
    url: `/blog/${post.slug}`,
    lastmod: post.updatedDate
      ? new Date(post.updatedDate as any).toISOString()
      : new Date(post.pubDate as any).toISOString(),
    priority: post.isProject ? '0.7' : '0.8',
    changefreq: 'monthly' as const,
  }));

  const allEntries = [
    ...staticPages.map(p => ({ ...p, lastmod: undefined })),
    ...postEntries,
  ];

  const urls = allEntries
    .map(entry => {
      const loc = `${siteBase}${entry.url}`;
      return [
        '  <url>',
        `    <loc>${loc}</loc>`,
        entry.lastmod ? `    <lastmod>${entry.lastmod}</lastmod>` : '',
        `    <changefreq>${entry.changefreq}</changefreq>`,
        `    <priority>${entry.priority}</priority>`,
        '  </url>',
      ]
        .filter(Boolean)
        .join('\n');
    })
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
