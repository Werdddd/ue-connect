
import { firestore } from '../Firebase';
import { collection, getDocs, query, where, doc, updateDoc, getDoc, deleteField, addDoc, serverTimestamp } from 'firebase/firestore'; // <-- add addDoc and serverTimestamp

export async function fetchEvents() {
  try {
    // Query for both Approved and Finished statuses
    const eventsQuery = query(
      collection(firestore, 'events'),
      where('status', 'in', ['Approved', 'Finished'])
    );

    const querySnapshot = await getDocs(eventsQuery);

    const events = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    return events;
  } catch (error) {
    console.error('Failed to load events:', error);
    throw error;
  }
}


// NEW FUNCTION to add an event
export async function addEvent(newEvent) {
  try {
    const eventWithTimestamp = {
      ...newEvent,
      createdAt: serverTimestamp(), // Add createdAt field
    };
    const docRef = await addDoc(collection(firestore, 'events'), eventWithTimestamp);
    console.log('Event added with ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Failed to add event:', error);
    throw error;
  }
}

export async function applyToEvent(eventId, email) {
  try {
    // Fetch user data from the users collection
    const userRef = doc(firestore, 'Users', email);
    const userSnap = await getDoc(userRef);
    const safeEmailKey = email.replace(/\./g, '_');

    let userName = 'Unknown User';
    if (userSnap.exists()) {
      const user = userSnap.data();
      const firstName = user.firstName || '';
      const lastName = user.lastName || '';
      userName = `${firstName} ${lastName}`.trim();
    }

    // Update the participantsList in the event with "Applied" status by default
    const eventRef = doc(firestore, 'events', eventId);
    await updateDoc(eventRef, {
      [`participantsList.${safeEmailKey}`]: { name: userName, status: 'Applied' }, // Added status here
    });
  } catch (error) {
    throw new Error('Failed to apply to event: ' + error.message);
  }
}


export async function removeApplicationFromEvent(eventId, email) {
  try {
    const safeEmailKey = email.replace(/\./g, '_');
    const eventRef = doc(firestore, "events", eventId);
    await updateDoc(eventRef, {
      [`participantsList.${safeEmailKey}`]: deleteField(), // Ensure this is consistent with the safeEmailKey
    });
  } catch (error) {
    throw new Error("Failed to remove application: " + error.message);
  }
}