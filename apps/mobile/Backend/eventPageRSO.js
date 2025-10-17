import { firestore } from '../Firebase';
import { collection, getDocs, addDoc, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { format, addDays, isSameDay, parse } from "date-fns";
import { getAuth } from "firebase/auth";
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

// Add event with creator info
export async function addEvent(newEvent) {
  try {
    const auth = getAuth();
const currentUser = auth.currentUser;

    if (!currentUser) {
      throw new Error("User must be logged in to create events.");
}

    const creatorName = currentUser.displayName || currentUser.email || "Unknown Org";

    const orgSnapshot = await getDocs(collection(firestore, "organizations"));
let matchedOrg = null;

    for (const docSnap of orgSnapshot.docs) {
      const orgData = docSnap.data();
if (
        orgData.email &&
        orgData.email.toLowerCase() === currentUser.email.toLowerCase()
      ) {
        matchedOrg = {
          orgName: orgData.orgName ||
"Unknown Organization",
          department: orgData.department ||
"N/A",
          orgId: docSnap.id,
        };
break;
      }
    }

    const eventWithStatus = {
      ...newEvent,
      status: newEvent.status ||
"Applied",
      isCollab: newEvent.isCollab || false,
      collabOrgs: newEvent.collabOrgs ||
[],
      createdBy: currentUser.uid,
      createdByName: creatorName,
      createdAt: serverTimestamp(),

      // ✅ Include organization details
      organization: matchedOrg?.orgName ||
"Unknown Organization",
      department: matchedOrg?.department || "N/A",
      orgId: matchedOrg?.orgId ||
null,
    };

    // Custom ID like OrgEvent1, OrgEvent2...
    const eventsSnapshot = await getDocs(collection(firestore, "events"));
const newEventID = `OrgEvent${eventsSnapshot.size + 1}`;

    const docRef = doc(firestore, "events", newEventID);
    await setDoc(docRef, eventWithStatus);

    return newEventID;
} catch (error) {
    console.error("Failed to add event:", error);
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
    // 1. Fetch all existing events and blackout dates from Firebase
    const eventsSnapshot = await getDocs(collection(firestore, 'events'));
const blackoutSnapshot = await getDocs(collection(firestore, 'blackoutDates'));

    const events = eventsSnapshot.docs.map(doc => doc.data());
    const blackoutDates = blackoutSnapshot.docs.map(doc => doc.data().date);
// 2. Set the starting point for the search (today)
    const startDate = new Date();
    const MAX_DAYS_AHEAD = 30; // Limit the search to 30 days ahead
    const suggestedDates = [];
// 3. Greedily iterate through the next 30 days to find the first 2 suggestion dates
    for (let i = 0; i < MAX_DAYS_AHEAD && suggestedDates.length < 2; i++) {
      const currentDate = addDays(startDate, i);
const formattedDate = format(currentDate, "MMMM d, yyyy");

      // Skip if the date is a blackout date
      if (blackoutDates.includes(formattedDate)) continue;

      const availableSlots = [];
// 4. For each day, iterate through the predefined time slots
      for (let slot of TIME_SLOTS) {
        // Check if any event in Firebase conflicts with the current date and time slot
        const isConflict = events.some(event =>
          event.date === formattedDate && event.time === slot
        );
// 5. If no conflict is found, "greedily" add it to the list of available slots
        if (!isConflict) {
          availableSlots.push(slot);
}

        // Stop once we have found 2 available slots for the day
        if (availableSlots.length === 2) break;
}

      // If we found any available slots for the current date, add them to our main suggestions list
      if (availableSlots.length > 0) {
        suggestedDates.push({
          date: formattedDate,
          times: availableSlots
        });
}
    }

    // 6. Format the final suggestions for the frontend
    const allTimes = suggestedDates.flatMap(item =>
      item.times.map(time => `${item.date} • ${time}`)
    );
return {
      suggestedTimes: allTimes.length ?
allTimes : []
    };

  } catch (error) {
    console.error("Error fetching suggested date/time:", error);
return {
      suggestedTimes: []
    };
  }
}