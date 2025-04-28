import { firestore } from '../Firebase';
import { collection, getDocs } from 'firebase/firestore';

export async function fetchEvents() {
  try {
    const querySnapshot = await getDocs(collection(firestore, 'events'));
    const events = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
    console.log('Loaded events:', events);
    return events;
  } catch (error) {
    console.error('Failed to load events:', error);
    throw error;
  }
}
