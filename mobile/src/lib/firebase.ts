import { initializeApp } from 'firebase/app';
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore';

// Expo inlines EXPO_PUBLIC_* variables at build time (see .env.example).
// These are client identifiers, not secrets: Firestore security rules decide who can write.
const app = initializeApp({
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY ?? 'demo-api-key',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? 'demo-sushi',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
});

export const db = getFirestore(app);

// Point at the local emulator when a host is set. A physical phone needs the computer's LAN IP.
const emulatorHost = process.env.EXPO_PUBLIC_FIREBASE_EMULATOR_HOST;
if (emulatorHost) connectFirestoreEmulator(db, emulatorHost, 8080);
