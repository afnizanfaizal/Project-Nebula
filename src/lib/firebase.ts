// src/lib/firebase.ts
import { initializeApp, getApps } from 'firebase/app';
import {
  getFirestore,
  doc,
  getDoc,
  updateDoc,
  setDoc,
  increment,
  type Firestore,
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.PUBLIC_FIREBASE_API_KEY,
  authDomain: import.meta.env.PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.PUBLIC_FIREBASE_APP_ID,
};

// Prevent re-initialization in dev hot reload
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const db: Firestore = getFirestore(app);

/**
 * Increment view count for a post and return the new total.
 * Creates the document if it doesn't exist.
 */
export async function incrementPostViews(slug: string): Promise<number> {
  const ref = doc(db, 'posts', slug);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    await setDoc(ref, { views: 1 });
    return 1;
  }

  await updateDoc(ref, { views: increment(1) });
  const updated = await getDoc(ref);
  return (updated.data()?.views as number) ?? 1;
}

/**
 * Get current view count without incrementing.
 */
export async function getPostViews(slug: string): Promise<number> {
  const ref = doc(db, 'posts', slug);
  const snap = await getDoc(ref);
  return snap.exists() ? ((snap.data().views as number) ?? 0) : 0;
}
