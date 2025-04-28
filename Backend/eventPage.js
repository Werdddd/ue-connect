import { firestore } from '../Firebase';
import { collection, getDocs, addDoc } from 'firebase/firestore'; // <-- import addDoc

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

// NEW FUNCTION to add an event
export async function addEvent(newEvent) {
  try {
    const docRef = await addDoc(collection(firestore, 'events'), newEvent);
    console.log('Event added with ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Failed to add event:', error);
    throw error;
  }
}
