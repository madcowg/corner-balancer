import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";

import { readFirebaseRuntimeConfig } from "./config";

export function isFirebaseConfigured() {
  return Boolean(readFirebaseRuntimeConfig(import.meta.env));
}

export function getFirebaseRuntimeConfig() {
  return readFirebaseRuntimeConfig(
    import.meta.env,
    typeof window === "undefined" ? "http://localhost" : window.location.origin
  );
}

export function getFirebaseApp(): FirebaseApp | undefined {
  const runtimeConfig = getFirebaseRuntimeConfig();
  if (!runtimeConfig) {
    return undefined;
  }

  return getApps().length > 0 ? getApp() : initializeApp(runtimeConfig.options);
}

export function shouldUseFirebaseEmulators() {
  return getFirebaseRuntimeConfig()?.useEmulators ?? false;
}
