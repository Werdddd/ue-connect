import { collection, query, where, getCountFromServer, Timestamp, getDocs } from "firebase/firestore";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, firestore } from "@/Firebase"; // adjust path

/**
 * Only allow login with role superadmin (role === "superadmin")
 */

export const loginUser = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    const userDocRef = doc(firestore, "Users", user.email!.toLowerCase());
    const userDocSnap = await getDoc(userDocRef);

    if (!userDocSnap.exists()) {
      await signOut(auth);
      throw new Error("User record not found in Firestore.");
    }

    const userData = userDocSnap.data();

    if (userData.role !== "superadmin") {
      await signOut(auth);
      throw new Error("Access denied. Only admins can log in.");
    }

    return { success: true, userData };
  } catch (error: any) {
    console.error("Login failed:", error);
    throw new Error(error.message || "Failed to log in.");
  }
};

/**
 * Get total number of students (role === "user")
 */
export async function getTotalUsers(): Promise<number> {
  const usersRef = collection(firestore, "Users");
  const q = query(usersRef, where("role", "==", "user"));
  const snapshot = await getCountFromServer(q);
  return snapshot.data().count;
}

/**
 * Get user growth percentage compared to last month.
 * Returns 0 if no growth data is available.
 */
export async function getUserGrowth(): Promise<number> {
  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const usersRef = collection(firestore, "Users");

  const thisMonthQ = query(
    usersRef,
    where("role", "==", "user"),
    where("timestamp", ">=", Timestamp.fromDate(thisMonthStart)),
    where("timestamp", "<", Timestamp.fromDate(nextMonthStart))
  );

  const lastMonthQ = query(
    usersRef,
    where("role", "==", "user"),
    where("timestamp", ">=", Timestamp.fromDate(lastMonthStart)),
    where("timestamp", "<", Timestamp.fromDate(thisMonthStart))
  );

  const [thisSnap, lastSnap] = await Promise.all([
    getCountFromServer(thisMonthQ),
    getCountFromServer(lastMonthQ),
  ]);

  const thisCount = thisSnap.data().count;
  const lastCount = lastSnap.data().count;

  if (lastCount === 0) return 0;
  const growth = ((thisCount - lastCount) / lastCount) * 100;
  return parseFloat(growth.toFixed(1));
}

/**
 * Get total number of students that joined in organizations
 */
export async function getTotalJoinedStudents(): Promise<number> {
  const orgsRef = collection(firestore, "organizations");
  const orgsSnap = await getDocs(orgsRef);

  const allMembers = new Set<string>();

  orgsSnap.forEach((doc) => {
    const data = doc.data();
    const members = data.members || [];
    members.forEach((email: string) => allMembers.add(email));
  });

  return allMembers.size; 
}