import {
  collection,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  doc,
  query,
  where,
  serverTimestamp, setDoc,
} from "firebase/firestore";
import { auth, firestore } from "../Firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";

export type DocumentReview = {
  status: 'approved' | 'rejected' | null;
  remarks: string;
};

export type DocumentReviews = {
  constitutionByLaws?: DocumentReview;
  atoApplication?: DocumentReview;
  officersList?: DocumentReview;
  gpoa?: DocumentReview;
  registrationForm?: DocumentReview;
};

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
  
  // Logo
  logoBase64?: string;
  logoFileName?: string;
  logoFileSize?: number;
  
  // Documents
  constitutionByLawsBase64?: string;
  constitutionByLawsFileName?: string;
  constitutionByLawsFileSize?: number;
  
  atoApplicationBase64?: string;
  atoApplicationFileName?: string;
  atoApplicationFileSize?: number;
  
  officersListBase64?: string;
  officersListFileName?: string;
  officersListFileSize?: number;
  
  gpoaBase64?: string;
  gpoaFileName?: string;
  gpoaFileSize?: number;
  
  registrationFormBase64?: string;
  registrationFormFileName?: string;
  registrationFormFileSize?: number;
  
  status: string; // applied | approved | rejected
  registrationType?: string;
  members?: string[];
  officers?: string[];
  registeredBy?: string;
  submittedAt?: any;
  createdAt?: any;
  updatedAt?: any;
  reviewNotes?: string;
  reviewedAt?: any;
  
  // Document-level reviews
  documentReviews?: DocumentReviews;
};

export async function getTotalOrganizations(): Promise<number> {
  const ref = collection(firestore, "organizations");
  const snap = await getDocs(ref);
  return snap.size;
}

export async function getOrganizationsByType(): Promise<
  { name: string; value: number }[]
> {
  const ref = collection(firestore, "organizations");
  const snap = await getDocs(ref);

  const typeCounts: Record<string, number> = {};

  snap.docs.forEach((doc) => {
    const data = doc.data() as any;
    const type = data.department || "Unknown";
    typeCounts[type] = (typeCounts[type] || 0) + 1;
  });

  return Object.entries(typeCounts).map(([name, value]) => ({ name, value }));
}

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
 * ✅ Enhanced: Update organization status with document reviews
 */
export const updateOrganizationStatus = async (
  orgId: string,
  status: "approved" | "rejected",
  reviewNotes: string = "",
  documentReviews?: DocumentReviews
): Promise<{ success: boolean }> => {
  try {
    const docRef = doc(firestore, "organizations", orgId);

    const updateData: any = {
      status,
      reviewNotes,
      reviewedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    // Add document reviews if provided
    if (documentReviews) {
      updateData.documentReviews = documentReviews;
    }

    await updateDoc(docRef, updateData);

    return { success: true };
  } catch (error) {
    console.error("Error updating organization status:", error);
    throw error;
  }
};
/**
 * ✅ FIXED: Allow updating individual document statuses (approved/rejected/pending/etc.)
 */
export const submitOrganizationReview = async (
  orgId: string,
  reviewData: {
    status: "approved" | "rejected" | "applied" | "terminated" | "hold";
    reviewNotes: string;
    documentReviews: Record<string, { status: string | null; remarks: string | null }>;
  }
): Promise<{ success: boolean }> => {
  try {
    const docRef = doc(firestore, "organizations", orgId);

    // 🛠 Prepare update object based on Firestore field naming
    const updatePayload: any = {
      status: reviewData.status,
      reviewNotes: reviewData.reviewNotes,
      reviewedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    Object.entries(reviewData.documentReviews).forEach(([key, value]) => {
      // Example key: "atoApplication" → converts to:
      // atoApplicationStatus, atoApplicationRemarks
      updatePayload[`${key}Status`] = value.status ?? "pending";
      updatePayload[`${key}Remarks`] = value.remarks ?? "";
    });

    await updateDoc(docRef, updatePayload);

    console.log("✅ Updated organization review:", updatePayload);
    return { success: true };
  } catch (error) {
    console.error("❌ Error submitting review:", error);
    throw error;
  }
};


/**
 * ✅ NEW: Helper function to download document from base64
 */
export const downloadDocumentFromBase64 = (
  base64String: string,
  fileName: string,
  mimeType: string = "application/pdf"
) => {
  try {
    const linkSource = `data:${mimeType};base64,${base64String}`;
    const downloadLink = document.createElement("a");
    downloadLink.href = linkSource;
    downloadLink.download = fileName;
    downloadLink.click();
  } catch (error) {
    console.error("Error downloading document:", error);
    throw error;
  }
};
export const autoCreateUser = async (
  email: string,
  password: string,
  details: {
    firstName?: string;
    lastName?: string;
    role?: string;
    organizationId?: string;
  } = {}
): Promise<{ success: boolean; uid?: string; error?: string }> => {
  try {
    // 1️⃣ Create the user in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const uid = userCredential.user.uid;

    // 2️⃣ Use email as Firestore document ID
    const emailDocId = email.toLowerCase(); // normalize email for consistency
    const userDoc = doc(firestore, "Users", emailDocId);

    // 3️⃣ Store user info in Firestore (orgName will appear as firstName)
    await setDoc(userDoc, {
      uid, // still store actual Firebase UID
      email,
      firstName: details.firstName || "",
      lastName: details.lastName || "",
      role: details.role || "student",
      organizationId: details.organizationId || null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    console.log("✅ User auto-created (email as doc ID):", emailDocId);

    return { success: true, uid };
  } catch (error: any) {
    console.error("❌ Error auto-creating user:", error);
    return { success: false, error: error.message };
  }
};
