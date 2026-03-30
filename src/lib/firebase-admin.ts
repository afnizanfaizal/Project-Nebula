// src/lib/firebase-admin.ts
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

const apps = getApps();
const app = apps.length === 0
  ? initializeApp({
      credential: cert({
        projectId:   process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey:  process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    })
  : apps[0];

export const adminDb = getFirestore(app);

// ── Types ──────────────────────────────────────────────────────────────────

export interface PostDocument {
  title:         string;
  description:   string;
  pubDate:       Timestamp;
  updatedDate?:  Timestamp;
  tags:          string[];
  draft?:        boolean;
  featured?:     boolean;
  featuredImage?: string;
  content:       string;
  views?:        number;
}

export interface PostSummary {
  slug:         string;
  title:        string;
  description:  string;
  pubDate:      string;   // ISO date string
  draft:        boolean;
  featured:     boolean;
  tags:         string[];
  featuredImage?: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────

/**
 * Upsert a post document. Merges to preserve the existing `views` count.
 */
export async function savePost(
  slug: string,
  data: Omit<PostDocument, 'views'>,
): Promise<void> {
  await adminDb.collection('posts').doc(slug).set(data, { merge: true });
}

/**
 * Fetch a single post by slug. Returns null if not found.
 */
export async function getPost(
  slug: string,
): Promise<(PostDocument & { slug: string }) | null> {
  const snap = await adminDb.collection('posts').doc(slug).get();
  if (!snap.exists) return null;
  return { slug, ...(snap.data() as PostDocument) };
}

/**
 * Delete a post document. Resolves even if the document didn't exist.
 */
export async function deletePost(slug: string): Promise<void> {
  await adminDb.collection('posts').doc(slug).delete();
}

/**
 * List all posts sorted by pubDate descending.
 */
export async function listPosts(): Promise<PostSummary[]> {
  const snap = await adminDb
    .collection('posts')
    .orderBy('pubDate', 'desc')
    .get();

  return snap.docs.map((doc) => {
    const d = doc.data() as PostDocument;
    return {
      slug:          doc.id,
      title:         d.title ?? '',
      description:   d.description ?? '',
      pubDate:       d.pubDate instanceof Timestamp
                       ? d.pubDate.toDate().toISOString()
                       : String(d.pubDate),
      draft:         d.draft ?? false,
      featured:      d.featured ?? false,
      tags:          d.tags ?? [],
      featuredImage: d.featuredImage,
    };
  });
}
