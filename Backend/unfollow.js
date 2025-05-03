// follow.js
import { doc, updateDoc, arrayRemove, getDoc } from 'firebase/firestore';
import { firestore } from '../Firebase'; // adjust to your setup


export const unfollowUser = async (currentUserEmail, recipientEmail) => {
  try {
    const currentUserRef = doc(firestore, 'Users', currentUserEmail);
    const recipientRef = doc(firestore, 'Users', recipientEmail);

    const [currentUserSnap, recipientSnap] = await Promise.all([
      getDoc(currentUserRef),
      getDoc(recipientRef),
    ]);

    if (!currentUserSnap.exists() || !recipientSnap.exists()) {
      throw new Error('User not found');
    }

    await Promise.all([
      updateDoc(currentUserRef, {
        following: arrayRemove(recipientEmail),
      }),
      updateDoc(recipientRef, {
        followers: arrayRemove(currentUserEmail),
      }),
    ]);

    return { success: true };
  } catch (error) {
    console.error('Error unfollowing user:', error.message);
    return { success: false, error: error.message };
  }
};
