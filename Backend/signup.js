import { auth, firestore } from '../Firebase';
import { doc, setDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from "firebase/auth";

export async function signUpUser({ firstName, lastName, studentNumber, email, password, year, course }) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
   
    await setDoc(doc(firestore, "Users", email), {
      email: email,
      studentNumber: studentNumber,
      firstName: firstName,
      lastName: lastName,
      Course: course,
      Year: year,
      role: 'user',
      group: false,
      followers: [],
      following: [],
      orgs: [],
      timestamp: new Date(),
      profileImage: 'https://mactaggartfp.com/manage/wp-content/uploads/default-profile.jpg',
    });

    return { success: true };
  } catch (error) {
    console.error("SignUp Error:", error);
    return { success: false, error: error.message };
  }
}
