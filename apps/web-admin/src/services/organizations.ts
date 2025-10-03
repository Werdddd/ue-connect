import { collection, getCountFromServer, query, getDocs } from "firebase/firestore";
import { firestore } from "@/Firebase";

/**
 * Get total number of registered organizations
 */
export async function getTotalOrganizations(): Promise<number> {
  const orgsRef = collection(firestore, "organizations"); 
  const q = query(orgsRef);
  const snapshot = await getCountFromServer(q);
  return snapshot.data().count;
}
/**
 * Get Organization Type
 */
export async function getOrganizationsByType() {
  const orgsRef = collection(firestore, "organizations");
  const snapshot = await getDocs(orgsRef);

  const counts: Record<string, number> = {};
  snapshot.docs.forEach(doc => {
    const data = doc.data();
    const dept = data.department || "Unknown";
    counts[dept] = (counts[dept] || 0) + 1;
  });

  return Object.entries(counts).map(([name, value]) => ({
    name,
    value,
  }));
}

