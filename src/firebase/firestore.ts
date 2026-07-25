import {
  connectFirestoreEmulator,
  initializeFirestore,
  persistentLocalCache,
  type Firestore
} from "firebase/firestore";

import { getFirebaseApp, getFirebaseRuntimeConfig, isFirebaseConfigured } from "./app";

let firestoreInstance: Firestore | undefined;
let emulatorConnected = false;

export function getFirebaseFirestore() {
  if (!isFirebaseConfigured()) {
    return undefined;
  }

  if (!firestoreInstance) {
    const app = getFirebaseApp();
    if (!app) {
      return undefined;
    }

    firestoreInstance = initializeFirestore(app, {
      localCache: persistentLocalCache({})
    });
  }

  const runtimeConfig = getFirebaseRuntimeConfig();
  if (firestoreInstance && runtimeConfig?.useEmulators && !emulatorConnected) {
    connectFirestoreEmulator(
      firestoreInstance,
      runtimeConfig.firestoreEmulatorHost,
      runtimeConfig.firestoreEmulatorPort
    );
    emulatorConnected = true;
  }

  return firestoreInstance;
}
