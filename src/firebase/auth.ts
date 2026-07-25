import {
  GoogleAuthProvider,
  connectAuthEmulator,
  getAuth,
  isSignInWithEmailLink,
  onAuthStateChanged,
  sendSignInLinkToEmail,
  signInAnonymously,
  signInWithEmailLink,
  signInWithPopup,
  signOut,
  type Unsubscribe,
  type User
} from "firebase/auth";

import { getFirebaseApp, getFirebaseRuntimeConfig, isFirebaseConfigured } from "./app";

const EMAIL_STORAGE_KEY = "corner-balance/pending-email-link";
let emulatorConnected = false;

function getFirebaseAuth() {
  const app = getFirebaseApp();
  if (!app) {
    return undefined;
  }

  const auth = getAuth(app);
  const runtimeConfig = getFirebaseRuntimeConfig();
  if (runtimeConfig?.useEmulators && !emulatorConnected) {
    connectAuthEmulator(auth, runtimeConfig.authEmulatorUrl, { disableWarnings: true });
    emulatorConnected = true;
  }

  return auth;
}

export interface FirebaseUserSummary {
  uid: string;
  email?: string | undefined;
  displayName?: string | undefined;
}

export function observeFirebaseAuth(callback: (user: FirebaseUserSummary | undefined) => void): Unsubscribe {
  if (!isFirebaseConfigured()) {
    return () => {};
  }

  const auth = getFirebaseAuth();
  if (!auth) {
    return () => {};
  }

  return onAuthStateChanged(auth, (user) => callback(mapFirebaseUser(user)));
}

export async function signInWithGooglePopup() {
  const auth = getFirebaseAuth();
  if (!auth) {
    return false;
  }

  await signInWithPopup(auth, new GoogleAuthProvider());
  return true;
}

export async function requestEmailLinkSignIn(email: string) {
  const auth = getFirebaseAuth();
  if (!auth) {
    return false;
  }

  await sendSignInLinkToEmail(auth, email, {
    url: getFirebaseRuntimeConfig()?.emailLinkUrl ?? window.location.origin,
    handleCodeInApp: true
  });
  window.localStorage.setItem(EMAIL_STORAGE_KEY, email);
  return true;
}

export async function consumeEmailLinkSignInFromWindow() {
  const auth = getFirebaseAuth();
  if (!auth || !isSignInWithEmailLink(auth, window.location.href)) {
    return false;
  }

  const email = window.localStorage.getItem(EMAIL_STORAGE_KEY) ?? window.prompt("Confirm your email address");
  if (!email) {
    return false;
  }

  await signInWithEmailLink(auth, email, window.location.href);
  window.localStorage.removeItem(EMAIL_STORAGE_KEY);
  return true;
}

export async function signInAnonymouslyInFirebase() {
  const auth = getFirebaseAuth();
  if (!auth) {
    return false;
  }

  await signInAnonymously(auth);
  return true;
}

export async function signOutFromFirebase() {
  const auth = getFirebaseAuth();
  if (!auth) {
    return;
  }

  await signOut(auth);
}

function mapFirebaseUser(user: User | null): FirebaseUserSummary | undefined {
  if (!user) {
    return undefined;
  }

  return {
    uid: user.uid,
    ...(user.email ? { email: user.email } : {}),
    ...(user.displayName ? { displayName: user.displayName } : {})
  };
}
