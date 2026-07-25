import {
  connectFirestoreEmulator,
  initializeFirestore,
  persistentLocalCache,
  type Firestore
} from "firebase/firestore";

import { getFirebaseApp, isFirebaseConfigured, shouldUseFirebaseEmulators } from "./app";

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

  if (firestoreInstance && shouldUseFirebaseEmulators() && !emulatorConnected) {
    const [host, port] = (import.meta.env.VITE_FIREBASE_FIRESTORE_EMULATOR_HOST ?? "127.0.0.1:8080").split(":");
    connectFirestoreEmulator(firestoreInstance, host ?? "127.0.0.1", Number(port ?? "8080"));
    emulatorConnected = true;
  }

  return firestoreInstance;
}
