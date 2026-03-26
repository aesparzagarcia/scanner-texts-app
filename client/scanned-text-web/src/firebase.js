import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Create React App only exposes env vars prefixed with REACT_APP_.
// Add these to `backend/client/scanned-text-web/.env` and restart `npm start`.

const isTest = process.env.NODE_ENV === 'test';

/** True when both API key and project id are non-empty (still might be wrong values). */
export const isWebFirebaseConfigured =
  Boolean(
    (process.env.REACT_APP_FIREBASE_API_KEY || '').trim() &&
      (process.env.REACT_APP_FIREBASE_PROJECT_ID || '').trim()
  );

const testFirebaseConfig = {
  apiKey: 'AIzaSyDUMMYDUMMYDUMMYDUMMYDUMMYDUMMYDUM',
  authDomain: 'test.firebaseapp.com',
  projectId: 'test',
  storageBucket: 'test.appspot.com',
  messagingSenderId: '000000000000',
  appId: '1:000000000000:web:test',
};

const envFirebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
};

/** Set if initializeApp / getAuth / getFirestore throws. */
export let firebaseBootstrapError = null;

/** Only non-null after a successful bootstrap (or in tests). */
export let auth = null;
export let db = null;

export const firebaseReady = () => Boolean(auth && db);

(function bootstrap() {
  if (!isTest && !isWebFirebaseConfigured) {
    console.warn(
      '[TextScan:firebase] Skipping Firebase init: add REACT_APP_FIREBASE_API_KEY and REACT_APP_FIREBASE_PROJECT_ID to .env, then restart the dev server.'
    );
    return;
  }

  const firebaseConfig = isTest ? testFirebaseConfig : envFirebaseConfig;

  try {
    const app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);

    if (
      process.env.NODE_ENV === 'development' ||
      process.env.REACT_APP_DEBUG_AUTH === '1'
    ) {
      console.info('[TextScan:firebase] initializeApp + auth + db OK', {
        projectId: firebaseConfig.projectId || '(missing)',
        authDomain: firebaseConfig.authDomain || '(missing)',
      });
    }
  } catch (e) {
    const code = e?.code || '';
    const message = e?.message || String(e);
    firebaseBootstrapError = message;
    auth = null;
    db = null;
    console.error('[TextScan:firebase] Bootstrap FAILED', { code, message, e });
  }
})();
