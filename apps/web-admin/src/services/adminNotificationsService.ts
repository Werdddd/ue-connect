import { collection, onSnapshot, query, where } from "firebase/firestore";
import { firestore } from "@/Firebase";

export function timeAgo(timestamp: Date): string {
  const now = new Date().getTime();
  const diffMs = now - timestamp.getTime();

  const seconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return `${seconds} second${seconds !== 1 ? "s" : ""} ago`;
  if (minutes < 60) return `${minutes} minute${minutes !== 1 ? "s" : ""} ago`;
  if (hours < 24) return `${hours} hour${hours !== 1 ? "s" : ""} ago`;
  return `${days} day${days !== 1 ? "s" : ""} ago`;
}

export const listenToAdminNotifications = (callback: (activities: any[]) => void) => {
  const activities: any[] = [];

  const eventsRef = collection(firestore, "events");
  const eventsQuery = query(eventsRef, where("status", "in", ["Pending", "Approved"]));

  const unsubEvents = onSnapshot(eventsQuery, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === "added") {
        const eventData = change.doc.data();
        const createdAt = eventData.createdAt?.toDate
          ? eventData.createdAt.toDate()
          : new Date();

        activities.push({
          action:
            eventData.status === "Pending"
              ? "New event pending approval"
              : "Event approved",
          org: eventData.organization || "Unknown Organization",
          time: timeAgo(createdAt),
          rawTime: createdAt, 
        });
      }
    });

    activities.sort((a, b) => b.rawTime - a.rawTime);
    callback([...activities]);
  });

  const orgRef = collection(firestore, "organizations");
  const orgQuery = query(orgRef, where("status", "in", ["pending", "approved"]));

  const unsubOrgs = onSnapshot(orgQuery, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === "added") {
        const orgData = change.doc.data();
        const submittedAt = orgData.submittedAt?.toDate
          ? orgData.submittedAt.toDate()
          : new Date();

        activities.push({
          action:
            orgData.status === "pending"
              ? "New organization registration pending"
              : "Organization approved",
          org: orgData.orgName || "Unknown Organization",
          time: timeAgo(submittedAt),
          rawTime: submittedAt,
        });
      }
    });

    activities.sort((a, b) => b.rawTime - a.rawTime);
    callback([...activities]);
  });

  return () => {
    unsubEvents();
    unsubOrgs();
  };
};
