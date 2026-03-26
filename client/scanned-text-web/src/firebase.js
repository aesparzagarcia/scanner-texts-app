import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Config via env vars (Create React App requires REACT_APP_ prefix).
// Add these to `backend/client/scanned-text-web/.env` (or your hosting env):
// - REACT_APP_FIREBASE_API_KEY
// - REACT_APP_FIREBASE_AUTH_DOMAIN
// - REACT_APP_FIREBASE_PROJECT_ID
// - REACT_APP_FIREBASE_STORAGE_BUCKET
// - REACT_APP_FIREBASE_MESSAGING_SENDER_ID
// - REACT_APP_FIREBASE_APP_ID
/** False when CRA env vars are missing — auth/Firestore will not work in the browser. */
export const isWebFirebaseConfigured =
  Boolean(
    (process.env.REACT_APP_FIREBASE_API_KEY || '').trim() &&
      (process.env.REACT_APP_FIREBASE_PROJECT_ID || '').trim()
  );

const firebaseConfig = {
  apiKey:
    process.env.REACT_APP_FIREBASE_API_KEY ||
    (process.env.NODE_ENV === 'test'
      ? 'AIzaSyDUMMYDUMMYDUMMYDUMMYDUMMYDUMMYDUM'
      : undefined),
  authDomain:
    process.env.REACT_APP_FIREBASE_AUTH_DOMAIN ||
    (process.env.NODE_ENV === 'test' ? 'test.firebaseapp.com' : undefined),
  projectId:
    process.env.REACT_APP_FIREBASE_PROJECT_ID ||
    (process.env.NODE_ENV === 'test' ? 'test' : undefined),
  storageBucket:
    process.env.REACT_APP_FIREBASE_STORAGE_BUCKET ||
    (process.env.NODE_ENV === 'test' ? 'test.appspot.com' : undefined),
  messagingSenderId:
    process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID ||
    (process.env.NODE_ENV === 'test' ? '000000000000' : undefined),
  appId:
    process.env.REACT_APP_FIREBASE_APP_ID ||
    (process.env.NODE_ENV === 'test' ? '1:000000000000:web:test' : undefined),
};

let app;
try {
  app = initializeApp(firebaseConfig);
  if (
    process.env.NODE_ENV === 'development' ||
    process.env.REACT_APP_DEBUG_AUTH === '1'
  ) {
    console.info('[TextScan:firebase] initializeApp OK', {
      isWebFirebaseConfigured,
      projectId: firebaseConfig.projectId || '(missing)',
      authDomain: firebaseConfig.authDomain || '(missing)',
      hasApiKey: Boolean((firebaseConfig.apiKey || '').length),
    });
  }
} catch (e) {
  console.error('[TextScan:firebase] initializeApp FAILED', e?.code || e?.message || e);
  throw e;
}

export const auth = getAuth(app);
export const db = getFirestore(app);

