// src/lib/firebase-admin.ts
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

const apps = getApps();
const app = apps.length === 0
  ? initializeApp({
      credential: cert({
        projectId:   import.meta.env.FIREBASE_PROJECT_ID,
        clientEmail: import.meta.env.FIREBASE_CLIENT_EMAIL,
        privateKey:  import.meta.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    })
  : apps[0];

export const adminDb = getFirestore(app);
export const adminAuth = getAuth(app);

/**
 * Returns true if the given cookie value is a valid, non-expired Firebase ID token.
 */
export async function isValidAdminToken(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  try {
    await adminAuth.verifyIdToken(token);
    return true;
  } catch {
    return false;
  }
}

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
  slug:          string;
  title:         string;
  description:   string;
  pubDate:       string;   // ISO date string
  draft:         boolean;
  featured:      boolean;
  tags:          string[];
  featuredImage?: string;
  views:         number;
}

export interface DailyAnalytics {
  total:     number;
  posts:     Record<string, number>;
  countries: Record<string, number>;
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
      views:         d.views ?? 0,
    };
  });
}

/**
 * Fetch multiple daily analytics documents by date key (YYYY-MM-DD).
 * Returns a map of dateKey → DailyAnalytics (or null if the doc doesn't exist).
 */
export async function getDailyAnalytics(
  dates: string[],
): Promise<Record<string, DailyAnalytics | null>> {
  if (dates.length === 0) return {};
  const refs = dates.map((d) => adminDb.collection('analytics').doc(d));
  const snaps = await adminDb.getAll(...refs);
  const result: Record<string, DailyAnalytics | null> = {};
  for (let i = 0; i < dates.length; i++) {
    const snap = snaps[i];
    result[dates[i]] = snap.exists ? (snap.data() as DailyAnalytics) : null;
  }
  return result;
}
