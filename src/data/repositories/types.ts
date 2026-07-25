import type { Session, Vehicle } from "../../domain/types";

export const authModes = ["guest", "anonymous", "signed_out", "signed_in"] as const;
export type AuthMode = (typeof authModes)[number];

export interface PersistedAuthState {
  mode: AuthMode;
  uid?: string | undefined;
  email?: string | undefined;
  displayName?: string | undefined;
  pendingGuestSync: boolean;
}

export interface PersistedAppState {
  version: number;
  auth: PersistedAuthState;
  vehicles: Vehicle[];
  sessions: Session[];
  lastSessionId?: string | undefined;
}

export interface AppRepository {
  load(): Promise<PersistedAppState>;
  save(state: PersistedAppState): Promise<void>;
  clear(): Promise<void>;
}
