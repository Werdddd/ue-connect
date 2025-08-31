import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { firestore } from '../Firebase';

export async function sendNotification({ userId, type, content }) {
  try {
    await addDoc(collection(firestore, 'notifications'), {
      userId,
      type,
      content,
      timestamp: serverTimestamp(),
      read: false,
    });
  } catch (error) {
    console.error("Failed to send notification:", error);
  }
}
