import { auth } from '../Firebase';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth"; // <--- Import sendPasswordResetEmail

export const loginUser = async ({ email, password }) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return { success: true, user: userCredential.user };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error };
    }
};

// Password reset email
export const sendPasswordReset = async (email) => {
    try {
        await sendPasswordResetEmail(auth, email);
        return { success: true };
    } catch (error) {
        console.error('Password reset error:', error);
        return { success: false, error };
    }
};