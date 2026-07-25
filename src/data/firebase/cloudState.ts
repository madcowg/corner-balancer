import { z } from "zod";

import type { PersistedAppState } from "../repositories/types";

const firestoreAppMetadataSchema = z.object({
  version: z.number().int().nonnegative(),
  lastSessionId: z.string().min(1).optional(),
  updatedAt: z.string().min(1)
});

export type FirestoreAppMetadata = z.infer<typeof firestoreAppMetadataSchema>;

export function buildFirestoreAppMetadata(
  state: PersistedAppState,
  updatedAt: string
): FirestoreAppMetadata {
  return {
    version: state.version,
    updatedAt,
    ...(state.lastSessionId ? { lastSessionId: state.lastSessionId } : {})
  };
}

export function parseFirestoreAppMetadata(data: unknown) {
  const parsed = firestoreAppMetadataSchema.safeParse(data);
  return parsed.success ? parsed.data : undefined;
}

export function remapGuestDataToUser(
  state: PersistedAppState,
  guestOwnerId: string,
  userId: string,
  updatedAt: string
): PersistedAppState {
  return {
    ...state,
    auth: {
      ...state.auth,
      mode: "signed_in",
      uid: userId,
      pendingGuestSync: false
    },
    vehicles: state.vehicles.map((vehicle) =>
      vehicle.ownerId === guestOwnerId
        ? { ...vehicle, ownerId: userId, updatedAt }
        : vehicle
    ),
    sessions: state.sessions.map((session) =>
      session.ownerId === guestOwnerId
        ? { ...session, ownerId: userId, updatedAt }
        : session
    )
  };
}
