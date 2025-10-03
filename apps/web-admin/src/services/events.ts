import { collection, query, where, getCountFromServer } from "firebase/firestore";
import { firestore } from "@/Firebase";

export async function getActiveEvents(): Promise<number> {
  const eventsRef = collection(firestore, "events");
  const approvedQ = query(eventsRef, where("status", "==", "Approved"));

  const snapshot = await getCountFromServer(approvedQ);
  return snapshot.data().count;
}
