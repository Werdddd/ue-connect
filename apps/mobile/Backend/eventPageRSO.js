import { firestore } from '../Firebase';
import { collection, getDocs, addDoc, doc, setDoc } from 'firebase/firestore';
import { format, addDays, isSameDay, parse } from "date-fns";

export async function fetchEvents() {
  try {
    const querySnapshot = await getDocs(collection(firestore, 'events'));
    const events = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
    //console.log('Loaded events:', events);
    return events;
  } catch (error) {
    console.error('Failed to load events:', error);
    throw error;
  }
}

// Fetch organizations for collab
export async function fetchOrganizations() {
  try {
    const querySnapshot = await getDocs(collection(firestore, 'organizations'));
    const organizations = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
    return organizations;
  } catch (error) {
    console.error('Failed to fetch organizations:', error);
    throw error;
  }
}

// Function for add event
export async function addEvent(newEvent) {
    try {
      
      const eventWithStatus = {
        ...newEvent,
        status: newEvent.status || 'Applied',
        isCollab: newEvent.isCollab || false,
      collabOrgs: newEvent.collabOrgs || [],
      };
  
      const eventsSnapshot = await getDocs(collection(firestore, 'events'));
      const newEventID = `OrgEvent${eventsSnapshot.size + 1}`; 
  
      const docRef = doc(firestore, 'events', newEventID);
      await setDoc(docRef, eventWithStatus);
  
      //console.log('Event added with custom ID:', newEventID);
      return newEventID;
    } catch (error) {
      console.error('Failed to add event:', error);
      throw error;
    }
  }


  // GREEDY ALGORITHM FOR SUGGESTED DATE AND TIME
  const TIME_SLOTS = [
    "9:00 AM - 11:00 AM",
    "11:00 AM - 1:00 PM",
    "1:00 PM - 3:00 PM",
    "3:00 PM - 5:00 PM"
  ];
  
  function parseDate(dateString) {
    return parse(dateString, "MMMM d, yyyy", new Date());
  }
  
  export async function getSuggestedDateTime() {
    try {
      const eventsSnapshot = await getDocs(collection(firestore, 'events'));
      const blackoutSnapshot = await getDocs(collection(firestore, 'blackoutDates'));
  
      const events = eventsSnapshot.docs.map(doc => doc.data());
      const blackoutDates = blackoutSnapshot.docs.map(doc => doc.data().date);
  
      const startDate = new Date();
      const MAX_DAYS_AHEAD = 30;
      const suggestedDates = [];
  
      for (let i = 0; i < MAX_DAYS_AHEAD && suggestedDates.length < 2; i++) {
        const currentDate = addDays(startDate, i);
        const formattedDate = format(currentDate, "MMMM d, yyyy");
  
        if (blackoutDates.includes(formattedDate)) continue;
  
        const availableSlots = [];
  
        for (let slot of TIME_SLOTS) {
          const isConflict = events.some(event =>
            event.date === formattedDate && event.time === slot
          );
  
          if (!isConflict) {
            availableSlots.push(slot);
          }
  
          if (availableSlots.length === 2) break;
        }
  
        if (availableSlots.length > 0) {
          suggestedDates.push({
            date: formattedDate,
            times: availableSlots
          });
        }
      }
  
      const allTimes = suggestedDates.flatMap(item =>
        item.times.map(time => `${item.date} • ${time}`)
      );
  
      return {
        suggestedTimes: allTimes.length ? allTimes : []
      };
  
    } catch (error) {
      console.error("Error fetching suggested date/time:", error);
      return {
        suggestedTimes: []
      };
    }
  }
  