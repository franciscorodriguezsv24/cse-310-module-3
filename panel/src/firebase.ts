import { initializeApp } from 'firebase/app';
import { connectAuthEmulator, getAuth } from 'firebase/auth';
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore';

const env = import.meta.env;

/** Without a .env file the panel talks to the local emulators with the "demo-sushi" project. */
const app = initializeApp({
  apiKey: env.VITE_FIREBASE_API_KEY ?? 'demo-api-key',
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID ?? 'demo-sushi',
  appId: env.VITE_FIREBASE_APP_ID,
});

export const db = getFirestore(app);
export const auth = getAuth(app);

const emulatorHost = env.VITE_FIREBASE_EMULATOR_HOST ?? (env.VITE_FIREBASE_PROJECT_ID ? '' : '127.0.0.1');
export const usingEmulators = emulatorHost !== '';
if (usingEmulators) {
  connectFirestoreEmulator(db, emulatorHost, 8080);
  connectAuthEmulator(auth, `http://${emulatorHost}:9099`, { disableWarnings: true });
}
