// apps/web-admin/src/services/fetchEvents.ts
import { collection, getDocs, limit, orderBy, query } from "firebase/firestore";
import { firestore } from "../Firebase";

export type EventDoc = {
  id: string;
  title?: string;
  description?: string;
  organization?: string;
  orgId?: string;
  location?: string;
  date?: string;          // e.g. "May 6, 2025"
  time?: string;          // e.g. "9:00 AM - 11:00 AM"
  status?: string;        // Applied | Approved | Rejected | Finished
  banner?: string;

  // IMPORTANT: bring these through exactly as stored
  participants?: number;                // capacity in your DB
  participantsList?: Record<string, any>; // map of users -> { status: "Approved" | ... }
  participantsCount?: number;           // if you also keep a precomputed integer

  // creator info (for RSO name)
  createdBy?: string;
  createdByName?: string;

  // other optional fields you showed
  department?: string;
  isCollab?: boolean;
  proposalFile?: string;
  proposalLink?: string;
  proposalName?: string;
  createdAt?: string;
  orgid?: string;
  orgID?: string;
};

export async function fetchEvents(max = 200): Promise<EventDoc[]> {
  const ref = collection(firestore, "events");
  // If "date" is a string in Firestore, orderBy still works, it will be lexicographic.
  // You can remove orderBy if it causes an index error.
  const q = query(ref, orderBy("date", "desc"), limit(max));
  const snap = await getDocs(q);

  return snap.docs.map((d) => {
    const data = d.data() as any;
    return {
      id: d.id,
      title: data.title,
      description: data.description,
      organization: data.organization,
      orgId: data.orgId ?? data.orgid ?? data.orgID,
      location: data.location,
      date: data.date,
      time: data.time,
      status: data.status,
      banner: data.banner,

      // pass through unchanged so your page can count them
      participants: data.participants,
      participantsList: data.participantsList,
      participantsCount: data.participantsCount,

      createdBy: data.createdBy,
      createdByName: data.createdByName,

      department: data.department,
      isCollab: data.isCollab,
      proposalFile: data.proposalFile,
      proposalLink: data.proposalLink,
      proposalName: data.proposalName,
      createdAt: data.createdAt,
    };
  });
}
