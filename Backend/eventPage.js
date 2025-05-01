import { firestore } from '../Firebase';
import { collection, getDocs, query, where, doc, updateDoc, getDoc, deleteField } from 'firebase/firestore'; // <-- import query and where

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

export async function applyToEvent(eventId, studentNumber) {
  try {
    const userRef = doc(firestore, 'Users', studentNumber);
    const userSnap = await getDoc(userRef);

    let userName = 'Unknown User';
    if (userSnap.exists()) {
      const user = userSnap.data();
      const firstName = user.firstName || '';
      const lastName = user.lastName || '';
      userName = `${firstName} ${lastName}`.trim();
    }

    // Update the participantsList in the event
    const eventRef = doc(firestore, 'events', eventId);
    await updateDoc(eventRef, {
      [`participantsList.${studentNumber}`]: userName,
    });
  } catch (error) {
    throw new Error('Failed to apply to event: ' + error.message);
  }
}

export async function removeApplicationFromEvent(eventId, email) {
  try {
    const eventRef = doc(firestore, "events", eventId);
    await updateDoc(eventRef, {
      [`participantsList.${email}`]: deleteField(),
    });
  } catch (error) {
    throw new Error("Failed to remove application: " + error.message);
  }
}