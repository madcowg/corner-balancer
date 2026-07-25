import type { FirebaseOptions } from "firebase/app";

export const DEFAULT_AUTH_EMULATOR_HOST = "127.0.0.1:9099";
export const DEFAULT_FIRESTORE_EMULATOR_HOST = "127.0.0.1:8080";
const DEFAULT_EMAIL_LINK_URL = "http://localhost";

type FirebaseEnvShape = Pick<
  ImportMetaEnv,
  | "VITE_FIREBASE_API_KEY"
  | "VITE_FIREBASE_AUTH_DOMAIN"
  | "VITE_FIREBASE_PROJECT_ID"
  | "VITE_FIREBASE_STORAGE_BUCKET"
  | "VITE_FIREBASE_MESSAGING_SENDER_ID"
  | "VITE_FIREBASE_APP_ID"
  | "VITE_FIREBASE_EMAIL_LINK_URL"
  | "VITE_USE_FIREBASE_EMULATORS"
  | "VITE_FIREBASE_AUTH_EMULATOR_HOST"
  | "VITE_FIREBASE_FIRESTORE_EMULATOR_HOST"
>;

export interface FirebaseRuntimeConfig {
  options: FirebaseOptions;
  useEmulators: boolean;
  emailLinkUrl: string;
  authEmulatorUrl: string;
  firestoreEmulatorHost: string;
  firestoreEmulatorPort: number;
}

function cleanEnvValue(value?: string) {
  return value?.trim() || undefined;
}

export function parseEmulatorHost(value: string, fallback: string) {
  const [fallbackHost, fallbackPort] = fallback.split(":");
  const [candidateHost, candidatePort] = value.split(":");
  const parsedPort = Number(candidatePort ?? fallbackPort ?? "0");

  return {
    host: candidateHost?.trim() || fallbackHost || "127.0.0.1",
    port:
      Number.isFinite(parsedPort) && parsedPort > 0
        ? parsedPort
        : Number(fallbackPort ?? "0")
  };
}

export function readFirebaseRuntimeConfig(
  env: FirebaseEnvShape,
  fallbackEmailLinkUrl = DEFAULT_EMAIL_LINK_URL
): FirebaseRuntimeConfig | undefined {
  const apiKey = cleanEnvValue(env.VITE_FIREBASE_API_KEY);
  const authDomain = cleanEnvValue(env.VITE_FIREBASE_AUTH_DOMAIN);
  const projectId = cleanEnvValue(env.VITE_FIREBASE_PROJECT_ID);
  const appId = cleanEnvValue(env.VITE_FIREBASE_APP_ID);

  if (!apiKey || !authDomain || !projectId || !appId) {
    return undefined;
  }

  const authEmulatorHost =
    cleanEnvValue(env.VITE_FIREBASE_AUTH_EMULATOR_HOST) ?? DEFAULT_AUTH_EMULATOR_HOST;
  const firestoreHostValue =
    cleanEnvValue(env.VITE_FIREBASE_FIRESTORE_EMULATOR_HOST) ?? DEFAULT_FIRESTORE_EMULATOR_HOST;
  const firestoreEmulator = parseEmulatorHost(
    firestoreHostValue,
    DEFAULT_FIRESTORE_EMULATOR_HOST
  );
  const storageBucket = cleanEnvValue(env.VITE_FIREBASE_STORAGE_BUCKET);
  const messagingSenderId = cleanEnvValue(env.VITE_FIREBASE_MESSAGING_SENDER_ID);

  return {
    options: {
      apiKey,
      authDomain,
      projectId,
      appId,
      ...(storageBucket ? { storageBucket } : {}),
      ...(messagingSenderId ? { messagingSenderId } : {})
    },
    useEmulators: cleanEnvValue(env.VITE_USE_FIREBASE_EMULATORS) === "true",
    emailLinkUrl:
      cleanEnvValue(env.VITE_FIREBASE_EMAIL_LINK_URL) ?? fallbackEmailLinkUrl,
    authEmulatorUrl: `http://${authEmulatorHost}`,
    firestoreEmulatorHost: firestoreEmulator.host,
    firestoreEmulatorPort: firestoreEmulator.port
  };
}
