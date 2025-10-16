// apps/web-admin/src/services/fetchEvents.ts
import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  where,
  documentId,
} from "firebase/firestore";
import { firestore } from "../Firebase";

export type EventDoc = {
  id: string;
  title: string;
  description?: string;
  location?: string;
  status?: string;
  date?: string;
  time?: string;

  // creator fields on the event
  createdBy?: string;        // UID (often useless for our join)
  createdByName?: string;    // EMAIL (this matches your Users doc ID)

  collabOrgs?: {
    orgId?: string;
    organization?: string;   // optional label stored on the event
  };

  // computed
  organizerName?: string;    // <- what we'll show in the table
};

const CHUNK = 10; // Firestore 'in' query limit

export async function fetchEvents(max = 200): Promise<EventDoc[]> {
  // 1) read events
  const eventsRef = collection(firestore, "events");
  const q = query(eventsRef, orderBy(documentId()), limit(max));
  const snap = await getDocs(q);

  const events: EventDoc[] = snap.docs.map((d) => {
    const data = d.data() as any;
    return {
      id: d.id,
      title: data.title ?? data.name ?? "Untitled",
      description: data.description ?? "",
      location: data.location ?? "",
      status: data.status ?? "",
      date: data.date ?? "",
      time: data.time ?? "",
      createdBy: data.createdBy ?? "",
      createdByName: data.createdByName ?? "", // this is the email in your screenshots
      collabOrgs: data.collabOrgs ?? undefined,
    };
  });

  // 2) collect unique emails (Users doc IDs)
  const emails = Array.from(
    new Set(
      events
        .map((e) => (e.createdByName || "").trim())
        .filter(Boolean)
    )
  );

  // 3) build email -> firstName map from Users
  const emailToFirst = new Map<string, string>();
  if (emails.length) {
    const usersRef = collection(firestore, "Users");

    for (let i = 0; i < emails.length; i += CHUNK) {
      const chunk = emails.slice(i, i + CHUNK);
      // your Users docId is the email -> we can query by documentId() 'in'
      const uq = query(usersRef, where(documentId(), "in", chunk));
      const usnap = await getDocs(uq);
      usnap.forEach((udoc) => {
        const u = udoc.data() as any;
        emailToFirst.set(udoc.id, (u.firstName ?? "").trim());
      });
    }
  }

  // 4) resolve organizerName with nice fallbacks
  events.forEach((e) => {
    const fromUsers = e.createdByName ? emailToFirst.get(e.createdByName) : "";
    e.organizerName =
      fromUsers ||
      e.collabOrgs?.organization || // if you saved a label on the event
      e.createdByName ||            // last resort: show the email
      "—";
  });

  return events;
}
