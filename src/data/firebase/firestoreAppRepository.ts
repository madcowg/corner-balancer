import { collection, deleteDoc, doc, getDoc, getDocs, writeBatch } from "firebase/firestore";

import { createDefaultPersistedState } from "../migrations/appState";
import type { AppRepository, PersistedAppState } from "../repositories/types";
import { sessionSchema, vehicleSchema } from "../../domain/types";
import { getFirebaseFirestore } from "../../firebase/firestore";
import {
  buildFirestoreAppMetadata,
  parseFirestoreAppMetadata
} from "./cloudState";

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

    const vehicles = vehicleSnapshot.docs.map(
      (snapshot) => vehicleSchema.parse(snapshot.data()) as PersistedAppState["vehicles"][number]
    );
    const sessions = sessionSnapshot.docs.map(
      (snapshot) => sessionSchema.parse(snapshot.data()) as PersistedAppState["sessions"][number]
    );
    const lastSession = sessions
      .slice()
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))[0];

    return {
      version: 1,
      auth: {
        mode: "signed_in",
        uid: this.uid,
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
