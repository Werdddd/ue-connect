import { collection, getCountFromServer, query } from "firebase/firestore";
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
