// src/lib/firebase-admin.ts
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { getStorage } from 'firebase-admin/storage';

const apps = getApps();
const app = apps.length === 0
  ? initializeApp({
      credential: cert({
        projectId:   import.meta.env.FIREBASE_PROJECT_ID,
        clientEmail: import.meta.env.FIREBASE_CLIENT_EMAIL,
        privateKey:  import.meta.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
      storageBucket: import.meta.env.PUBLIC_FIREBASE_STORAGE_BUCKET,
    })
  : apps[0];

export const adminDb = getFirestore(app);
export const adminAuth = getAuth(app);
export const adminStorage = getStorage(app);

/**
 * Returns true if the given cookie value is a valid, non-expired, non-revoked
 * Firebase session cookie. checkRevoked=true ensures revoked sessions are
 * rejected even if the cookie hasn't expired yet.
 */
export async function isValidAdminToken(
  token: string | undefined,
  checkRevoked = false,
): Promise<boolean> {
  if (!token) return false;
  try {
    await adminAuth.verifySessionCookie(token, checkRevoked);
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
  isProject?:    boolean;
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
  isProject:     boolean;
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
      isProject:     d.isProject ?? false,
      tags:          d.tags ?? [],
      featuredImage: d.featuredImage,
      views:         d.views ?? 0,
    };
  });
}

// ── Site Profile ──────────────────────────────────────────────────────────

export interface ProfileDocument {
  name:         string;
  title:        string;
  bio:          string;
  profilePhoto: string;
  skills:       string[];
}

/**
 * Fetch the site profile from `site/profile`.
 * Returns a default empty profile if the document doesn't exist.
 */
export async function getProfile(): Promise<ProfileDocument> {
  const snap = await adminDb.collection('site').doc('profile').get();
  if (!snap.exists) {
    return {
      name: '', title: '', bio: '',
      profilePhoto: '', skills: [],
    };
  }
  return snap.data() as ProfileDocument;
}

/**
 * Save (merge) the site profile into `site/profile`.
 */
export async function saveProfile(data: Partial<ProfileDocument>): Promise<void> {
  await adminDb.collection('site').doc('profile').set(data, { merge: true });
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
