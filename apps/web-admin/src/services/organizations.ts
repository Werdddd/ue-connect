import {
  collection,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  doc,
  query,
  where,
  serverTimestamp,
} from "firebase/firestore";
import { firestore } from "../Firebase";

export type Organization = {
  id: string;
  orgName: string;
  acronym: string;
  department: string;
  shortdesc?: string;
  email: string;
  contactNumber?: string;
  location?: string;
  presidentName: string;
  presidentStudentId: string;
  adviserName: string;
  logoBase64?: string;
  logoFileName?: string;
  status: string; // applied | approved | rejected
  registrationType?: string;
  members?: string[];
  officers?: string[];
  registeredBy?: string;
  submittedAt?: any;
  createdAt?: any;
  updatedAt?: any;
  reviewNotes?: string;
};

export async function getTotalOrganizations(): Promise<number> {
  const ref = collection(firestore, "organizations");
  const snap = await getDocs(ref);
  return snap.size;
}

/**
 * Fetches organizations grouped by orgType (for charts)
 */
export async function getOrganizationsByType(): Promise<
  { name: string; value: number }[]
> {
  const ref = collection(firestore, "organizations");
  const snap = await getDocs(ref);

  const typeCounts: Record<string, number> = {};

  snap.docs.forEach((doc) => {
    const data = doc.data() as any;
    const type = data.orgType || "Unknown";
    typeCounts[type] = (typeCounts[type] || 0) + 1;
  });

  return Object.entries(typeCounts).map(([name, value]) => ({ name, value }));
}

/**
 * ✅ Fetch ALL organizations
 */
export const getOrganizations = async (): Promise<Organization[]> => {
  try {
    const querySnapshot = await getDocs(collection(firestore, "organizations"));
    const organizations: Organization[] = [];

    querySnapshot.forEach((docSnap) => {
      organizations.push({ id: docSnap.id, ...docSnap.data() } as Organization);
    });

    return organizations;
  } catch (error) {
    console.error("Error fetching organizations:", error);
    throw error;
  }
};

/**
 * ✅ Fetch all approved organizations
 */
export const getApprovedOrganizations = async (): Promise<Organization[]> => {
  try {
    const q = query(
      collection(firestore, "organizations"),
      where("status", "==", "approved")
    );
    const querySnapshot = await getDocs(q);
    const organizations: Organization[] = [];

    querySnapshot.forEach((docSnap) => {
      organizations.push({ id: docSnap.id, ...docSnap.data() } as Organization);
    });

    return organizations;
  } catch (error) {
    console.error("Error fetching approved organizations:", error);
    throw error;
  }
};

/**
 * ✅ Fetch all applied (pending) organizations
 */
export const getAppliedOrganizations = async (): Promise<Organization[]> => {
  try {
    const q = query(
      collection(firestore, "organizations"),
      where("status", "==", "applied")
    );
    const querySnapshot = await getDocs(q);
    const appliedOrgs: Organization[] = [];

    querySnapshot.forEach((docSnap) => {
      appliedOrgs.push({ id: docSnap.id, ...docSnap.data() } as Organization);
    });

    return appliedOrgs;
  } catch (error) {
    console.error("Error fetching applied organizations:", error);
    throw error;
  }
};

/**
 * ✅ Fetch organizations by department (approved only)
 */
export const getOrganizationsByDepartment = async (
  department: string
): Promise<Organization[]> => {
  try {
    const q = query(
      collection(firestore, "organizations"),
      where("department", "==", department),
      where("status", "==", "approved")
    );
    const querySnapshot = await getDocs(q);
    const organizations: Organization[] = [];

    querySnapshot.forEach((docSnap) => {
      organizations.push({ id: docSnap.id, ...docSnap.data() } as Organization);
    });

    return organizations;
  } catch (error) {
    console.error("Error fetching organizations by department:", error);
    throw error;
  }
};

/**
 * ✅ Get a single organization by ID
 */
export const getOrganizationById = async (
  orgId: string
): Promise<Organization | null> => {
  try {
    const docRef = doc(firestore, "organizations", orgId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Organization;
    } else {
      console.warn("Organization not found:", orgId);
      return null;
    }
  } catch (error) {
    console.error("Error fetching organization by ID:", error);
    throw error;
  }
};

/**
 * ✅ Update organization status (approve / reject)
 */
export const updateOrganizationStatus = async (
  orgId: string,
  status: "approved" | "rejected",
  reviewNotes: string = ""
): Promise<{ success: boolean }> => {
  try {
    const docRef = doc(firestore, "organizations", orgId);

    await updateDoc(docRef, {
      status,
      reviewNotes,
      reviewedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return { success: true };
  } catch (error) {
    console.error("Error updating organization status:", error);
    throw error;
  }
};
