import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { Timestamp, getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { getStorage } from 'firebase-admin/storage';

const apps = getApps();
const app = apps.length === 0 ? initializeApp({
  credential: cert({
    projectId: "my-blog-b12b8",
    clientEmail: "firebase-adminsdk-fbsvc@my-blog-b12b8.iam.gserviceaccount.com",
    privateKey: "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDRCKm16qb5VnpD\nZI7KQ7kjTuxPFL/rNaUqFsTixugVw2l5z/RhozOwAMolu5ibjSLvp7EGASm7qsW0\nZ96dHx49Q9CJtgHfhEUggrm8ZVJ6PV5Arkv2vXezq2RBTvVFEQ54BRCGiqlqaxM9\nnV6BFmKGrxMenVWwSzZyPam4DTje7+HHK6/5EqHQIGLYoFfLKZ4uBWtFpRpKKLG2\nvSZGWvDj/rbYINc8sjSYgNWJYJaocejomFff2WTLOMUjuyoCXq5ZIkE2YxCeLXIy\nTrtyIeoDMWUmNMPDxRWuKHhOUoiUx/k+dE46hwEvUTE0Kb7LLxw7hCMN3OMcRM3b\nT5wyPNb7AgMBAAECggEAL40tciU1o73g5UjQVMHQMXCIQDsjp4GWF3uDgWUnMaA4\n881zNezW2sBrO+cvgZ87JdJ7ajbEhB0GiZIhaZPFIMG3BETDq1GfGhSy5OEVwJoK\nQWOFA1W5j8U68sJf+Dy3kmTwi/KqNHu0Lk2IzIvHkQTtsAaxkf+iHJ3baHOVjt0Q\nsppozp7mbFuSkK5Q9i9g9uBKyBRLo78TE+tSVsBuB2zzLxQPgmFVnRKpI4WJdgw3\ncmrHq5Q/nu3X/jiF7ZRVPvWlO10B8wsm5E5jidjLYC6ntOonAg4LW0fq2HTxqMXp\nvWE2KT4nbUQVGSWsDpCeY93vLTwv+yD0XeXPZJKN7QKBgQDtW8MvwmW0empERZFG\nTIEZ86jimtPIWiOwodC1V8BDBwDWHz3hl34vb2/Z52eCKek80lBA7b6fMn1EqrCr\nkR1tquZOTGeM9OY9p1q/Q/gXhCzcr3IOrtxah51RGEDI6bEoj4mCwwueK7TrpX1J\ne/YMPodgplxjPkc0bitocHwEVQKBgQDhc2q1epFU9bko/AwCZqwr5NOFPDTpFpU2\nd78uc6BkdTvbLOR15k1+emB5b5j9N4tRE4WNnqlXuOdXgC8cAWm6ioT+JwxqCDMx\nbUjdtKK0hhvljIcbUROrcRR4hR8dWhCHu+zjlbLAyd8UVN67jbt/TVpByZrEnbXm\ncVHSVjw+DwKBgQDIXL+lXzovYW629uqtJwOL/q0/rGa+J6kc/1uI2OxJKG5CUdkQ\nx6sTK8SFcttjezGR0A9C3+4bwKkR/+xmx3bKDoue6Mw4prp8rPrjneKdJ0wfdlKX\npnAIU5Yu0IRPlUWg8ZmosjDqcgalLOtXzrZim533rjcq53WAAsfNv7ZQiQKBgF12\nfJlpi5BeIfm0q8HfEKdNwMauU/0BaLBg6jf2pVqgI0VUkg2ygRPa5d3R/umSukXN\nQwOX7/o25Gko8d65UzyLKmE2jPX0Gkz2UkvfE8ilBDGglW4kqXPceDESdvizGsE6\njhU3PRihV8LVAFVeh4lZ5v349xlljEBRYCtDpsvPAoGBAKmDg+Y45S9tqxnyyavw\npeQsCXSjodohrwweKuzHg/0wbA7ytTymT+RITOHnWTtVgBccAjt4v1pS6M7eX4dy\ng7vJI+yoU0Z4WWONg5gnHXmOucaM+BpP+TCzQzaRRzwfQkEkmJGJIRQN+jWL1eDs\nLZAYY1X+8vdbWWT/t5fmT895\n-----END PRIVATE KEY-----\n"?.replace(/\\n/g, "\n")
  }),
  storageBucket: "my-blog-b12b8.firebasestorage.app"
}) : apps[0];
const adminDb = getFirestore(app);
const adminAuth = getAuth(app);
const adminStorage = getStorage(app);
async function isValidAdminToken(token) {
  if (!token) return false;
  try {
    await adminAuth.verifySessionCookie(
      token,
      /* checkRevoked */
      true
    );
    return true;
  } catch {
    return false;
  }
}
async function savePost(slug, data) {
  await adminDb.collection("posts").doc(slug).set(data, { merge: true });
}
async function getPost(slug) {
  const snap = await adminDb.collection("posts").doc(slug).get();
  if (!snap.exists) return null;
  return { slug, ...snap.data() };
}
async function deletePost(slug) {
  await adminDb.collection("posts").doc(slug).delete();
}
async function listPosts() {
  const snap = await adminDb.collection("posts").orderBy("pubDate", "desc").get();
  return snap.docs.map((doc) => {
    const d = doc.data();
    return {
      slug: doc.id,
      title: d.title ?? "",
      description: d.description ?? "",
      pubDate: d.pubDate instanceof Timestamp ? d.pubDate.toDate().toISOString() : String(d.pubDate),
      draft: d.draft ?? false,
      featured: d.featured ?? false,
      isProject: d.isProject ?? false,
      tags: d.tags ?? [],
      featuredImage: d.featuredImage,
      views: d.views ?? 0
    };
  });
}
async function getDailyAnalytics(dates) {
  if (dates.length === 0) return {};
  const refs = dates.map((d) => adminDb.collection("analytics").doc(d));
  const snaps = await adminDb.getAll(...refs);
  const result = {};
  for (let i = 0; i < dates.length; i++) {
    const snap = snaps[i];
    result[dates[i]] = snap.exists ? snap.data() : null;
  }
  return result;
}

export { adminAuth, adminDb, adminStorage, deletePost, getDailyAnalytics, getPost, isValidAdminToken, listPosts, savePost };
