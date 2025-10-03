import { firestore } from "@/Firebase";
import { collection, getDocs, Timestamp } from "firebase/firestore";
import dayjs from "dayjs";

export async function getGrowthTrends() {
  const now = dayjs();
  const months = Array.from({ length: 5 }, (_, i) =>
    now.subtract(4 - i, "month").startOf("month")
  );

  // --- Students (role === "user") ---
  const usersRef = collection(firestore, "Users");
  const usersSnap = await getDocs(usersRef);
  const users = usersSnap.docs
    .map(doc => doc.data())
    .filter(u => u.role === "user"); 

  const studentCounts = months.map(m => {
    const monthEnd = m.endOf("month").toDate();
    const count = users.filter(u => {
      if (!u.timestamp) return false;
      const createdAt = (u.timestamp as Timestamp).toDate();
      return createdAt <= monthEnd; 
    }).length;

    return { month: m.format("MMM YYYY"), students: count };
  });

  // --- Organizations (cumulative too) ---
  const orgsRef = collection(firestore, "Organizations");
  const orgsSnap = await getDocs(orgsRef);
  const orgs = orgsSnap.docs.map(doc => doc.data());

  const orgCounts = months.map(m => {
    const monthEnd = m.endOf("month").toDate();
    const count = orgs.filter(o => {
      if (!o.timestamp) return false;
      const createdAt = (o.timestamp as Timestamp).toDate();
      return createdAt <= monthEnd;
    }).length;

    return { month: m.format("MMM YYYY"), orgs: count };
  });

  // --- Merge both series ---
  return months.map((m, i) => ({
    month: m.format("MMM YYYY"),
    students: studentCounts[i].students,
    orgs: orgCounts[i].orgs,
  }));
}
