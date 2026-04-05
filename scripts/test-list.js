// scripts/test-list.js
// Usage: node --env-file=.env scripts/test-list.js
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';

const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

if (getApps().length === 0) {
  initializeApp({
    credential: cert({
      projectId:   process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey:  privateKey,
    }),
    storageBucket: process.env.PUBLIC_FIREBASE_STORAGE_BUCKET,
  });
}

const storage = getStorage();
const bucket = storage.bucket();

async function test() {
  console.log(`Checking bucket: ${bucket.name}`);
  try {
    const [files] = await bucket.getFiles({ prefix: 'uploads/' });
    console.log(`Found ${files.length} files with prefix 'uploads/':`);
    files.forEach(f => {
       console.log(` - ${f.name} (size: ${f.metadata.size})`);
    });
  } catch (err) {
    console.error('Error listing files:', err);
  }
}

test();
