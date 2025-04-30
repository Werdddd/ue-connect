import { doc, getDoc } from 'firebase/firestore';
import { auth, firestore } from '../Firebase';

export const getOwnUserProfile = async () => {
  return new Promise((resolve, reject) => {
    
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      unsubscribe(); 
      if (!user) {
        reject(new Error("No user logged in"));
        return;
      }

      try {
        const docRef = doc(firestore, "Users", user.email);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          resolve(docSnap.data());
        } else {
          reject(new Error("User profile not found"));
        }
      } catch (error) {
        reject(error);
      }
    });
  });
};
