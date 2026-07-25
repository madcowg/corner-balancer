import { z } from "zod";

import { sessionSchema, vehicleSchema } from "../../domain/types";
import type { PersistedAppState } from "../repositories/types";

const authSchema = z.object({
  mode: z.enum(["guest", "anonymous", "signed_out", "signed_in"]),
  uid: z.string().optional(),
  email: z.string().optional(),
  displayName: z.string().optional(),
  pendingGuestSync: z.boolean().default(false)
});

const persistedAppStateSchema = z.object({
  version: z.literal(1),
  auth: authSchema,
  vehicles: z.array(vehicleSchema),
  sessions: z.array(sessionSchema),
  lastSessionId: z.string().optional()
});

export function createDefaultPersistedState(): PersistedAppState {
  return {
    version: 1,
    auth: {
      mode: "guest",
      pendingGuestSync: false
    },
    vehicles: [],
    sessions: []
  };
}

export function migratePersistedAppState(rawValue: unknown): PersistedAppState {
  const result = persistedAppStateSchema.safeParse(rawValue);
  return result.success ? (result.data as PersistedAppState) : createDefaultPersistedState();
}
