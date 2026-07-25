import { createDefaultPersistedState, migratePersistedAppState } from "../migrations/appState";
import type { AppRepository, PersistedAppState } from "../repositories/types";

const STORAGE_KEY = "corner-balance/app-state/v1";

export class LocalAppRepository implements AppRepository {
  async load() {
    if (typeof window === "undefined") {
      return createDefaultPersistedState();
    }

    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return createDefaultPersistedState();
    }

    try {
      return migratePersistedAppState(JSON.parse(raw));
    } catch {
      return createDefaultPersistedState();
    }
  }

  async save(state: PersistedAppState) {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  async clear() {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.removeItem(STORAGE_KEY);
  }
}
