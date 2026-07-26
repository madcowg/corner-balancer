/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_FIREBASE_API_KEY?: string;
  readonly VITE_FIREBASE_AUTH_DOMAIN?: string;
  readonly VITE_FIREBASE_PROJECT_ID?: string;
  readonly VITE_FIREBASE_STORAGE_BUCKET?: string;
  readonly VITE_FIREBASE_MESSAGING_SENDER_ID?: string;
  readonly VITE_FIREBASE_APP_ID?: string;
  readonly VITE_FIREBASE_EMAIL_LINK_URL?: string;
  readonly VITE_USE_FIREBASE_EMULATORS?: string;
  readonly VITE_FIREBASE_AUTH_EMULATOR_HOST?: string;
  readonly VITE_FIREBASE_FIRESTORE_EMULATOR_HOST?: string;
  readonly VITE_BASE_PATH?: string;
  readonly VITE_GITHUB_PAGES_REPOSITORY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
