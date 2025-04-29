import { firestore } from '../Firebase';
import { collection, getDocs, query, where } from 'firebase/firestore'; // <-- import query and where

export async function fetchEvents() {
  try {
    // Create a query that filters events where status is "approved"
    const eventsQuery = query(collection(firestore, 'events'), where('status', '==', 'Approved'));

    // Execute the query to get the filtered events
    const querySnapshot = await getDocs(eventsQuery);

    // Map through the documents to format them
    const events = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    console.log('Loaded approved events:', events);
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
