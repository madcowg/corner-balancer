import { describe, expect, it } from "vitest";

import {
  DEFAULT_AUTH_EMULATOR_HOST,
  DEFAULT_FIRESTORE_EMULATOR_HOST,
  parseEmulatorHost,
  readFirebaseRuntimeConfig
} from "./config";

describe("firebase config", () => {
  it("returns undefined without the required Firebase keys", () => {
    expect(readFirebaseRuntimeConfig({} as ImportMetaEnv)).toBeUndefined();
  });

  it("builds runtime config from environment values", () => {
    const config = readFirebaseRuntimeConfig(
      {
        VITE_FIREBASE_API_KEY: " api-key ",
        VITE_FIREBASE_AUTH_DOMAIN: " corner-balancer.firebaseapp.com ",
        VITE_FIREBASE_PROJECT_ID: " corner-balancer ",
        VITE_FIREBASE_STORAGE_BUCKET: " corner-balancer.appspot.com ",
        VITE_FIREBASE_MESSAGING_SENDER_ID: " 123456 ",
        VITE_FIREBASE_APP_ID: " 1:123456:web:abc ",
        VITE_FIREBASE_EMAIL_LINK_URL: " https://cornerbalancer.app/login ",
        VITE_USE_FIREBASE_EMULATORS: "true",
        VITE_FIREBASE_AUTH_EMULATOR_HOST: " localhost:9199 ",
        VITE_FIREBASE_FIRESTORE_EMULATOR_HOST: " localhost:8181 "
      } as ImportMetaEnv,
      "https://fallback.example"
    );

    expect(config).toEqual({
      options: {
        apiKey: "api-key",
        authDomain: "corner-balancer.firebaseapp.com",
        projectId: "corner-balancer",
        storageBucket: "corner-balancer.appspot.com",
        messagingSenderId: "123456",
        appId: "1:123456:web:abc"
      },
      useEmulators: true,
      emailLinkUrl: "https://cornerbalancer.app/login",
      authEmulatorUrl: "http://localhost:9199",
      firestoreEmulatorHost: "localhost",
      firestoreEmulatorPort: 8181
    });
  });

  it("falls back to default emulator hosts and email-link URL", () => {
    const config = readFirebaseRuntimeConfig(
      {
        VITE_FIREBASE_API_KEY: "api-key",
        VITE_FIREBASE_AUTH_DOMAIN: "corner-balancer.firebaseapp.com",
        VITE_FIREBASE_PROJECT_ID: "corner-balancer",
        VITE_FIREBASE_APP_ID: "1:123456:web:abc"
      } as ImportMetaEnv,
      "https://app.example"
    );

    expect(config?.authEmulatorUrl).toBe(`http://${DEFAULT_AUTH_EMULATOR_HOST}`);
    expect(config?.firestoreEmulatorHost).toBe("127.0.0.1");
    expect(config?.firestoreEmulatorPort).toBe(8080);
    expect(config?.emailLinkUrl).toBe("https://app.example");
  });

  it("falls back when emulator port is missing or invalid", () => {
    expect(parseEmulatorHost("localhost", DEFAULT_FIRESTORE_EMULATOR_HOST)).toEqual({
      host: "localhost",
      port: 8080
    });
    expect(parseEmulatorHost("localhost:not-a-port", DEFAULT_FIRESTORE_EMULATOR_HOST)).toEqual({
      host: "localhost",
      port: 8080
    });
  });
});
