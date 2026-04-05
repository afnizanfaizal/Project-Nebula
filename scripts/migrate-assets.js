// scripts/migrate-assets.js
// Usage: node --env-file=.env scripts/migrate-assets.js
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';
import { readdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ─── Firebase Admin Init ──────────────────────────────────────────────────────
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

async function migrate() {
  const uploadDir = join(__dirname, '..', 'public', 'uploads');
  
  let files;
  try {
    files = await readdir(uploadDir);
  } catch (err) {
    if (err.code === 'ENOENT') {
      console.log('No local uploads directory found. Nothing to migrate.');
      return;
    }
    throw err;
  }

  const images = files.filter(file => /\.(jpg|jpeg|png|gif|webp|pdf)$/i.test(file));

  if (images.length === 0) {
    console.log('No images found in public/uploads.');
    return;
  }

  console.log(`Found ${images.length} files to migrate...\n`);

  for (const name of images) {
    const localPath = join(uploadDir, name);
    const remotePath = `uploads/${name}`;

    try {
      const file = bucket.file(remotePath);
      const [exists] = await file.exists();

      if (exists) {
        console.log(`- ${name} already exists in storage, skipping.`);
        continue;
      }

      console.log(`- Uploading ${name}...`);
      await bucket.upload(localPath, {
        destination: remotePath,
        public: true,
        metadata: {
          cacheControl: 'public, max-age=31536000',
        },
      });
      
      console.log(`  ✓ ${name} uploaded and made public.`);
    } catch (err) {
      console.error(`  ✗ Failed to upload ${name}:`, err.message);
    }
  }

  console.log('\nMigration complete!');
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
