import { firestore } from '../Firebase';
import { collection, getDocs, addDoc, doc, setDoc, serverTimestamp } from 'firebase/firestore';
// Added more functions from date-fns for calculations
import { format, addDays, parse, setHours, setMinutes, getMinutes, getHours, differenceInMinutes, addHours } from "date-fns";
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
      if (orgData.email && orgData.email.toLowerCase() === currentUser.email.toLowerCase()) {
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

/**
 * Parses a time range string (e.g., "9:00 AM - 11:00 AM") into actual Date objects for a given day.
 * @param {string} dateStr - The date string (e.g., "October 17, 2025").
 * @param {string} timeStr - The time range string.
 * @returns {{start: Date, end: Date} | null} - An object with start and end Date objects, or null if parsing fails.
 */
function parseTimeRangeToDates(dateStr, timeStr) {
  try {
    const baseDate = parse(dateStr, "MMMM d, yyyy", new Date());
    const [startStr, endStr] = timeStr.split('-').map(s => s.trim());

    const parseTime = (str) => {
      const timePart = str.match(/(\d{1,2}):?(\d{2})?\s*(AM|PM)/i);
      if (!timePart) return null;

      let hours = parseInt(timePart[1], 10);
      const minutes = timePart[2] ? parseInt(timePart[2], 10) : 0;
      const meridiem = timePart[3].toUpperCase();

      if (meridiem === 'PM' && hours !== 12) {
        hours += 12;
      } else if (meridiem === 'AM' && hours === 12) {
        hours = 0; // Midnight case
      }

      let date = setHours(baseDate, hours);
      date = setMinutes(date, minutes);
      return date;
    };

    const start = parseTime(startStr);
    const end = parseTime(endStr);

    if (!start || !end) return null;

    return { start, end };
  } catch (error) {
    console.error("Error parsing time range:", error);
    return null;
  }
}


/**
 * Finds all available slots of 1-3 hours within a given day's schedule.
 * @param {Date} day - The specific day to check.
 * @param {Array} eventsForDay - A pre-filtered list of events for that day and location.
 * @returns {Array<string>} - A list of available time slots as strings.
 */
function findAvailableSlotsForDay(day, eventsForDay) {
  const availableSlots = [];
  // MODIFIED: Changed the start and end times for the day's schedule.
  const dayStart = setMinutes(setHours(day, 8), 0); // 7:00 AM
  const dayEnd = setMinutes(setHours(day, 19), 0); // 7:00 PM

  // 1. Parse and sort all existing events for the day
  const bookedSlots = eventsForDay
    .map(event => parseTimeRangeToDates(format(day, "MMMM d, yyyy"), event.time))
    .filter(Boolean) // Remove any events that couldn't be parsed
    .sort((a, b) => a.start - b.start);

  let currentTime = dayStart;

  // 2. If no events booked, the entire day is available
  if (bookedSlots.length === 0) {
    const fullDayGap = differenceInMinutes(dayEnd, dayStart);
    generateSuggestionsForGap(dayStart, fullDayGap, availableSlots);
  } else {
    // 3. Find gaps between the start of the day and the first event
    const firstEvent = bookedSlots[0];
    const gapInMinutes = differenceInMinutes(firstEvent.start, currentTime);
    generateSuggestionsForGap(currentTime, gapInMinutes, availableSlots);
    currentTime = firstEvent.end;

    // 4. Find gaps between consecutive events
    for (let i = 1; i < bookedSlots.length; i++) {
      const prevEvent = bookedSlots[i - 1];
      const currentEvent = bookedSlots[i];
      const gapInMinutes = differenceInMinutes(currentEvent.start, prevEvent.end);

      generateSuggestionsForGap(prevEvent.end, gapInMinutes, availableSlots);
      currentTime = currentEvent.end;
    }

    // 5. Find gap between the last event and the end of the day
    const finalGapInMinutes = differenceInMinutes(dayEnd, currentTime);
    generateSuggestionsForGap(currentTime, finalGapInMinutes, availableSlots);
  }

  return availableSlots;
}

/**
 * Helper to generate 1, 2, and 3-hour slots within a given gap.
 * @param {Date} startTime - The start time of the gap.
 * @param {number} gapInMinutes - The duration of the gap in minutes.
 * @param {Array<string>} suggestions - The array to push suggestions into.
 */
function generateSuggestionsForGap(startTime, gapInMinutes, suggestions) {
  const formatTime = (date) => format(date, "h:mm a");

  // Suggest the longest possible slot first (up to 3 hours)
  if (gapInMinutes >= 60) { // 1 hour
    const endTime = addHours(startTime, 1);
    suggestions.push(`${formatTime(startTime)} - ${formatTime(endTime)}`);
  }
  if (gapInMinutes >= 120) { // 2 hours
    const endTime = addHours(startTime, 2);
    suggestions.push(`${formatTime(startTime)} - ${formatTime(endTime)}`);
  }
  if (gapInMinutes >= 180) { // 3 hours
    const endTime = addHours(startTime, 3);
    suggestions.push(`${formatTime(startTime)} - ${formatTime(endTime)}`);
  }
  if (gapInMinutes >= 240) { // 3 hours
    const endTime = addHours(startTime, 4);
    suggestions.push(`${formatTime(startTime)} - ${formatTime(endTime)}`);
  }
}


// --- REWRITTEN MAIN SUGGESTION FUNCTION ---

export async function getSuggestedDateTime(location, targetDate) {
  if (!location || location.trim() === '') {
    return { suggestedTimes: [] };
  }

  const normalizeLocation = (loc) => loc?.trim().toLowerCase() || '';
  const targetLocation = normalizeLocation(location);

  try {
    const eventsSnapshot = await getDocs(collection(firestore, 'events'));
    const blackoutSnapshot = await getDocs(collection(firestore, 'blackoutDates'));
    const allEvents = eventsSnapshot.docs.map(doc => doc.data());
    const blackoutDates = blackoutSnapshot.docs.map(doc => doc.data().date);

    let suggestions = [];

    // SCENARIO 1: User provides a specific date.
    if (targetDate) {
      const date = parse(targetDate, "MMMM d, yyyy", new Date());
      const formattedDate = format(date, "MMMM d, yyyy");

      if (!blackoutDates.includes(formattedDate)) {
        const eventsForDay = allEvents.filter(event =>
          normalizeLocation(event.location) === targetLocation && 
          event.date === formattedDate &&
          (event.status === 'Applied' || event.status === 'Approved')
        );
        const availableSlots = findAvailableSlotsForDay(date, eventsForDay);
        if (availableSlots.length > 0) {
          suggestions = availableSlots.map(time => `${formattedDate} • ${time}`);
        }
      }
      // SCENARIO 2: User has NOT provided a date, so find the soonest available.
    } else {
      const startDate = new Date();
      const MAX_DAYS_AHEAD = 30;
      for (let i = 0; i < MAX_DAYS_AHEAD; i++) {
        const currentDate = addDays(startDate, i);
        const formattedDate = format(currentDate, "MMMM d, yyyy");

        if (blackoutDates.includes(formattedDate)) continue;

        const eventsForDay = allEvents.filter(event =>
          normalizeLocation(event.location) === targetLocation && 
          event.date === formattedDate &&
          (event.status === 'Applied' || event.status === 'Approved')
        );

        const availableSlots = findAvailableSlotsForDay(currentDate, eventsForDay);

        if (availableSlots.length > 0) {
          // Add the first few suggestions found and stop searching
          suggestions = availableSlots.slice(0, 4).map(time => `${formattedDate} • ${time}`);
          break;
        }
      }
    }

    console.log("📅 Suggestions generated:", suggestions);
    return { suggestedTimes: suggestions };

  } catch (error) {
    console.error("Error fetching suggested date/time:", error);
    return { suggestedTimes: [] };
  }
}