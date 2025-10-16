import { collection, getDocs, limit, query } from "firebase/firestore";
import { firestore } from "../Firebase";

export type UserDoc = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  Course: string;
  Year: string;
  studentNumber: string;
  profileImage?: string;
  role: string;
  orgs?: string[];
  followers?: any[];
  following?: any[];
  group?: boolean;
  timestamp?: any;
};

export async function fetchUsers(pageSize = 100): Promise<UserDoc[]> {
  const ref = collection(firestore, "Users"); // Capital U
  const q = query(ref, limit(pageSize));
  const snap = await getDocs(q);

  return snap.docs.map((d) => {
    const data = d.data() as any;
    return {
      id: d.id,
      email: data.email ?? "",
      firstName: data.firstName ?? "",
      lastName: data.lastName ?? "",
      Course: data.Course ?? "",
      Year: data.Year ?? "",
      studentNumber: data.studentNumber ?? "",
      profileImage: data.profileImage ?? "",
      role: data.role ?? "user",
      orgs: Array.isArray(data.orgs) ? data.orgs : [],
      followers: Array.isArray(data.followers) ? data.followers : [],
      following: Array.isArray(data.following) ? data.following : [],
      group: Boolean(data.group),
      timestamp: data.timestamp ?? null,
    };
  });
}
