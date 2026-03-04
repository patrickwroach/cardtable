import { initializeApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getAuth, connectAuthEmulator, signInAnonymously } from 'firebase/auth';

// Values come from .env.local — copy .env.local.example and fill in your Firebase project credentials.
const firebaseConfig = {
  apiKey:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket:     process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const db = getFirestore(app);
export const auth = getAuth(app);

// Point to local emulators when NEXT_PUBLIC_USE_EMULATOR=true (FEAT-005 multi-client testing)
if (process.env.NEXT_PUBLIC_USE_EMULATOR === 'true') {
  connectFirestoreEmulator(db, 'localhost', 8080);
  connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
}

/**
 * Signs the current browser session in anonymously (FEAT-003).
 * Safe to call multiple times — resolves immediately if already signed in.
 * If the persisted user is invalid (e.g. emulator restarted), signs in fresh.
 */
export async function ensureAnonymousAuth(): Promise<string> {
  if (auth.currentUser) {
    try {
      // Validate the persisted user is still known to Auth (catches stale emulator sessions)
      await auth.currentUser.reload();
      return auth.currentUser.uid;
    } catch {
      // Stale / unknown user — fall through to fresh sign-in
    }
  }
  const credential = await signInAnonymously(auth);
  return credential.user.uid;
}
