/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_FIREBASE_API_KEY?: string;
  readonly VITE_FIREBASE_AUTH_DOMAIN?: string;
  readonly VITE_FIREBASE_PROJECT_ID?: string;
  readonly VITE_FIREBASE_APP_ID?: string;
  /** Host of the Firebase emulators, e.g. 127.0.0.1. Leave empty to use the real project. */
  readonly VITE_FIREBASE_EMULATOR_HOST?: string;
}
