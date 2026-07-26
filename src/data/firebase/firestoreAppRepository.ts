import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  writeBatch,
  type FirestoreError,
  type QuerySnapshot,
  type Unsubscribe
} from "firebase/firestore";

import { createDefaultPersistedState } from "../migrations/appState";
import type { AppRepository, PersistedAppState } from "../repositories/types";
import { sessionSchema, vehicleSchema } from "../../domain/types";
import { getFirebaseFirestore } from "../../firebase/firestore";
import {
  buildFirestoreAppMetadata,
  type FirestoreAppMetadata,
  parseFirestoreAppMetadata
} from "./cloudState";

export interface FirestoreObservedAppState {
  state: PersistedAppState;
  hasPendingWrites: boolean;
  fromCache: boolean;
  updatedAt?: string | undefined;
}

function buildPersistedAppState(
  uid: string,
  metadata: FirestoreAppMetadata | undefined,
  vehicles: PersistedAppState["vehicles"],
  sessions: PersistedAppState["sessions"]
): PersistedAppState {
  const lastSession = sessions
    .slice()
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))[0];

  return {
    version: 1,
    auth: {
      mode: "signed_in",
      uid,
      pendingGuestSync: false
    },
    vehicles,
    sessions,
    ...(metadata?.lastSessionId
      ? { lastSessionId: metadata.lastSessionId }
      : lastSession
        ? { lastSessionId: lastSession.id }
        : {})
  };
}

function parseVehicleSnapshot(snapshot: QuerySnapshot) {
  return snapshot.docs.map(
    (documentSnapshot) =>
      vehicleSchema.parse(documentSnapshot.data()) as PersistedAppState["vehicles"][number]
  );
}

function parseSessionSnapshot(snapshot: QuerySnapshot) {
  return snapshot.docs.map(
    (documentSnapshot) =>
      sessionSchema.parse(documentSnapshot.data()) as PersistedAppState["sessions"][number]
  );
}

export class FirestoreAppRepository implements AppRepository {
  private readonly uid: string;

  constructor(uid: string) {
    this.uid = uid;
  }

  async load(): Promise<PersistedAppState> {
    const db = getFirebaseFirestore();
    if (!db) {
      return createDefaultPersistedState();
    }

    const [userSnapshot, vehicleSnapshot, sessionSnapshot] = await Promise.all([
      getDoc(doc(db, "users", this.uid)),
      getDocs(collection(db, "users", this.uid, "vehicles")),
      getDocs(collection(db, "users", this.uid, "sessions"))
    ]);
    const metadata = userSnapshot.exists()
      ? parseFirestoreAppMetadata(userSnapshot.data())
      : undefined;
    const vehicles = parseVehicleSnapshot(vehicleSnapshot);
    const sessions = parseSessionSnapshot(sessionSnapshot);

    return buildPersistedAppState(this.uid, metadata, vehicles, sessions);
  }

  async save(state: PersistedAppState): Promise<void> {
    const db = getFirebaseFirestore();
    if (!db) {
      return;
    }

    const batch = writeBatch(db);
    state.vehicles
      .filter((vehicle) => vehicle.ownerId === this.uid)
      .forEach((vehicle) => {
        batch.set(doc(db, "users", this.uid, "vehicles", vehicle.id), vehicle);
      });

    state.sessions
      .filter((session) => session.ownerId === this.uid)
      .forEach((session) => {
        batch.set(doc(db, "users", this.uid, "sessions", session.id), session);
      });

    const updatedAt = new Date().toISOString();
    batch.set(
      doc(db, "users", this.uid),
      buildFirestoreAppMetadata(state, updatedAt)
    );

    await batch.commit();
  }

  deleteVehicle(vehicleId: string): Promise<void> {
    const db = getFirebaseFirestore();
    if (!db) {
      return Promise.resolve();
    }

    return deleteDoc(doc(db, "users", this.uid, "vehicles", vehicleId));
  }

  observe(
    callback: (snapshot: FirestoreObservedAppState) => void,
    onError?: (error: Error) => void
  ): Unsubscribe {
    const db = getFirebaseFirestore();
    if (!db) {
      return () => {};
    }

    let metadataLoaded = false;
    let vehiclesLoaded = false;
    let sessionsLoaded = false;
    let metadata: FirestoreAppMetadata | undefined;
    let vehicles: PersistedAppState["vehicles"] = [];
    let sessions: PersistedAppState["sessions"] = [];
    let metadataPendingWrites = false;
    let vehiclesPendingWrites = false;
    let sessionsPendingWrites = false;
    let metadataFromCache = true;
    let vehiclesFromCache = true;
    let sessionsFromCache = true;

    const emit = () => {
      if (!metadataLoaded || !vehiclesLoaded || !sessionsLoaded) {
        return;
      }

      callback({
        state: buildPersistedAppState(this.uid, metadata, vehicles, sessions),
        hasPendingWrites:
          metadataPendingWrites || vehiclesPendingWrites || sessionsPendingWrites,
        fromCache: metadataFromCache || vehiclesFromCache || sessionsFromCache,
        updatedAt: metadata?.updatedAt
      });
    };

    const handleError = (error: FirestoreError) => {
      onError?.(error);
    };

    const unsubscribers = [
      onSnapshot(
        doc(db, "users", this.uid),
        { includeMetadataChanges: true },
        (snapshot) => {
          metadataLoaded = true;
          metadata = snapshot.exists()
            ? parseFirestoreAppMetadata(snapshot.data())
            : undefined;
          metadataPendingWrites = snapshot.metadata.hasPendingWrites;
          metadataFromCache = snapshot.metadata.fromCache;
          emit();
        },
        handleError
      ),
      onSnapshot(
        collection(db, "users", this.uid, "vehicles"),
        { includeMetadataChanges: true },
        (snapshot) => {
          vehiclesLoaded = true;
          vehicles = parseVehicleSnapshot(snapshot);
          vehiclesPendingWrites = snapshot.metadata.hasPendingWrites;
          vehiclesFromCache = snapshot.metadata.fromCache;
          emit();
        },
        handleError
      ),
      onSnapshot(
        collection(db, "users", this.uid, "sessions"),
        { includeMetadataChanges: true },
        (snapshot) => {
          sessionsLoaded = true;
          sessions = parseSessionSnapshot(snapshot);
          sessionsPendingWrites = snapshot.metadata.hasPendingWrites;
          sessionsFromCache = snapshot.metadata.fromCache;
          emit();
        },
        handleError
      )
    ];

    return () => {
      unsubscribers.forEach((unsubscribe) => unsubscribe());
    };
  }

  async clear(): Promise<void> {
    const db = getFirebaseFirestore();
    if (!db) {
      return;
    }

    const [vehicleSnapshot, sessionSnapshot] = await Promise.all([
      getDocs(collection(db, "users", this.uid, "vehicles")),
      getDocs(collection(db, "users", this.uid, "sessions"))
    ]);

    await Promise.all([
      deleteDoc(doc(db, "users", this.uid)),
      ...vehicleSnapshot.docs.map((snapshot) => deleteDoc(snapshot.ref)),
      ...sessionSnapshot.docs.map((snapshot) => deleteDoc(snapshot.ref))
    ]);
  }
}
