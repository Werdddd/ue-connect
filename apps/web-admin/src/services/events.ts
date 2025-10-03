import { collection, query, where, getCountFromServer } from "firebase/firestore";
import { firestore } from "../Firebase";

export async function getActiveEvents(): Promise<number> {
  const eventsRef = collection(firestore, "events");
  const approvedQ = query(eventsRef, where("status", "==", "Approved"));

  const snapshot = await getCountFromServer(approvedQ);
  return snapshot.data().count;
}

export async function getEventsCount(): Promise<number> {
  const eventsRef = collection(firestore, "events");
  const q = query(eventsRef);
  const snap = await getCountFromServer(q);
  return snap.data().count;
}

export async function getPendingEventsCount(): Promise<number> {
  const eventsRef = collection(firestore, "events");
  const q = query(eventsRef, where("status", "==", "Applied"));
  const snap = await getCountFromServer(q);
  return snap.data().count;
}

export async function getOnGoingEventsCount(): Promise<number> {
  const eventsRef = collection(firestore, "events");
  const q = query(eventsRef, where("status", "==", "Approved"));
  const snap = await getCountFromServer(q);
  return snap.data().count;
}

export async function getCompletedEventsCount(): Promise<number> {
  const ref = collection(firestore, "events");
  const q = query(ref, where("status", "==", "Completed"));
  const snap = await getCountFromServer(q);
  return snap.data().count;
}