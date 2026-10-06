import * as admin from 'firebase-admin';
import path from 'path';
import fs from 'fs';
import { env } from './env.config';

let db: admin.firestore.Firestore | null = null;
let isFirebaseInitialized = false;

try {
  const serviceAccountPath = path.resolve(__dirname, '../../', env.firebaseServiceAccountPath);

  if (fs.existsSync(serviceAccountPath)) {
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
    }

    db = admin.firestore();
    isFirebaseInitialized = true;
    console.log('[Firebase] Initialized successfully with service account credentials.');
  } else {
    console.warn(`[Firebase Warning] Service account file not found at ${serviceAccountPath}. Database features will be disabled or mocked.`);
  }
} catch {
  isFirebaseInitialized = false;
}

export { db, isFirebaseInitialized };
