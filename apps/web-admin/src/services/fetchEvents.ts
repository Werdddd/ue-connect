import { collection, getDocs, limit, orderBy, query } from "firebase/firestore";
import { firestore } from "../Firebase";

export type EventDoc = {
  id: string;
  title: string;
  org: string;
  description?: string;
  date?: string;     // "May 6, 2025"
  time?: string;     // "9:00 AM - 11:00 AM"
  location?: string; // "MPH2"
  participants?: number; // 1
  status?: "Applied" | "Approved" | "Rejected" | "Finished" | string;
};

export async function fetchEvents(pageSize = 50): Promise<EventDoc[]> {
  // Your date is a string, so we’ll sort by title to keep it deterministic
  const ref = collection(firestore, "events");
  const q   = query(ref, orderBy("title"), limit(pageSize));
  const snap = await getDocs(q);

  return snap.docs.map(d => {
    const data = d.data() as any;
    return {
      id: d.id,
      title: data.title ?? "Untitled",
      org: data.org ?? "",
      description: data.description ?? "",
      date: data.date ?? "",
      time: data.time ?? "",
      location: data.location ?? "",
      participants: typeof data.participants === "number" ? data.participants : 0,
      status: data.status ?? ""
    };
  });
}
