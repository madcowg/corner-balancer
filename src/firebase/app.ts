import { getApp, getApps, initializeApp, type FirebaseApp, type FirebaseOptions } from "firebase/app";

function readFirebaseConfigFromEnv(): FirebaseOptions | undefined {
  const {
    VITE_FIREBASE_API_KEY,
    VITE_FIREBASE_AUTH_DOMAIN,
    VITE_FIREBASE_PROJECT_ID,
    VITE_FIREBASE_STORAGE_BUCKET,
    VITE_FIREBASE_MESSAGING_SENDER_ID,
    VITE_FIREBASE_APP_ID
  } = import.meta.env;

  if (!VITE_FIREBASE_API_KEY || !VITE_FIREBASE_AUTH_DOMAIN || !VITE_FIREBASE_PROJECT_ID || !VITE_FIREBASE_APP_ID) {
    return undefined;
  }

  return {
    apiKey: VITE_FIREBASE_API_KEY,
    authDomain: VITE_FIREBASE_AUTH_DOMAIN,
    projectId: VITE_FIREBASE_PROJECT_ID,
    ...(VITE_FIREBASE_STORAGE_BUCKET ? { storageBucket: VITE_FIREBASE_STORAGE_BUCKET } : {}),
    ...(VITE_FIREBASE_MESSAGING_SENDER_ID
      ? { messagingSenderId: VITE_FIREBASE_MESSAGING_SENDER_ID }
      : {}),
    appId: VITE_FIREBASE_APP_ID
  };
}

export function isFirebaseConfigured() {
  return Boolean(readFirebaseConfigFromEnv());
}

export function getFirebaseApp(): FirebaseApp | undefined {
  const config = readFirebaseConfigFromEnv();
  if (!config) {
    return undefined;
  }

  return getApps().length > 0 ? getApp() : initializeApp(config);
}

export function shouldUseFirebaseEmulators() {
  return import.meta.env.VITE_USE_FIREBASE_EMULATORS === "true";
}
