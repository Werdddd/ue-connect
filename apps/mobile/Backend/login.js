import { auth } from '../Firebase';
import { signInWithEmailAndPassword } from "firebase/auth";

export const loginUser = async ({ email, password }) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return { success: true, user: userCredential.user };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error };
    }
  };