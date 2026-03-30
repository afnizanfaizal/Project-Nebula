// scripts/migrate.js
// Usage: node scripts/migrate.js
// Requires: GOOGLE_APPLICATION_CREDENTIALS env var pointing to service-account.json

import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import TurndownService from 'turndown';
import { writeFile, mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ─── Firebase Admin Init ──────────────────────────────────────────────────────
if (getApps().length === 0) {
  initializeApp({ credential: cert(process.env.GOOGLE_APPLICATION_CREDENTIALS) });
}
const db = getFirestore();

// ─── Turndown Config ──────────────────────────────────────────────────────────
const td = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced',
  bulletListMarker: '-',
});

// Preserve code blocks with language annotation
td.addRule('fencedCodeBlock', {
  filter: (node) =>
    node.nodeName === 'PRE' &&
    node.firstChild?.nodeName === 'CODE',
  replacement: (_, node) => {
    const code = node.firstChild;
    const lang = (code.getAttribute?.('class') ?? '').replace('language-', '');
    return `\n\n\`\`\`${lang}\n${code.textContent}\n\`\`\`\n\n`;
  },
});

// ─── Helpers ──────────────────────────────────────────────────────────────────
function toSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function formatDate(timestamp) {
  if (!timestamp) return new Date().toISOString().slice(0, 10);
  const d = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return d.toISOString().slice(0, 10);
}

function buildFrontmatter(fields) {
  const lines = ['---'];
  for (const [key, value] of Object.entries(fields)) {
    if (Array.isArray(value)) {
      lines.push(`${key}: [${value.map((v) => `"${v}"`).join(', ')}]`);
    } else if (typeof value === 'boolean') {
      lines.push(`${key}: ${value}`);
    } else {
      lines.push(`${key}: "${String(value).replace(/"/g, '\\"')}"`);
    }
  }
  lines.push('---');
  return lines.join('\n');
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function migrate() {
  const outputDir = join(__dirname, '..', 'src', 'content', 'blog');
  await mkdir(outputDir, { recursive: true });

  const snapshot = await db.collection('posts').orderBy('createdAt', 'asc').get();

  if (snapshot.empty) {
    console.log('No posts found in Firestore.');
    return;
  }

  let count = 0;

  for (const docSnap of snapshot.docs) {
    const data = docSnap.data();

    const title = data.title ?? 'Untitled';
    const slug = data.slug ?? toSlug(title);
    const pubDate = formatDate(data.createdAt ?? data.pubDate);
    const description = data.description ?? data.excerpt ?? '';
    const tags = Array.isArray(data.tags) ? data.tags : [];
    const htmlContent = data.content ?? data.body ?? '';

    // Convert HTML → Markdown
    const markdown = htmlContent
      ? td.turndown(htmlContent)
      : '_No content_';

    const frontmatter = buildFrontmatter({
      title,
      pubDate,
      description,
      tags,
      draft: false,
      featured: data.featured ?? false,
    });

    const mdxContent = `${frontmatter}\n\n${markdown}\n`;
    const filepath = join(outputDir, `${slug}.mdx`);

    await writeFile(filepath, mdxContent, 'utf-8');
    console.log(`✓ ${slug}.mdx`);
    count++;
  }

  console.log(`\nMigrated ${count} post${count !== 1 ? 's' : ''} to src/content/blog/`);
}

migrate().catch((err) => {
  console.error('Migration failed:', err.message);
  process.exit(1);
});
