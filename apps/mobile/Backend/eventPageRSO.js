import { firestore } from '../Firebase';
import { collection, getDocs, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import {
  format,
  addDays,
  parse,
  setHours,
  setMinutes,
  differenceInMinutes,
  addHours,
  isSameDay,
  isAfter,
} from "date-fns";
import { getAuth } from "firebase/auth";

// --- FETCH FUNCTIONS ---
export async function fetchEvents() {
  try {
    const querySnapshot = await getDocs(collection(firestore, 'events'));
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

// --- ADD EVENT ---
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
          orgName: orgData.orgName || "Unknown Organization",
          department: orgData.department || "N/A",
          orgId: docSnap.id,
        };
        break;
      }
    }

    const eventWithStatus = {
      ...newEvent,
      status: newEvent.status || "Applied",
      isCollab: newEvent.isCollab || false,
      collabOrgs: newEvent.collabOrgs || [],
      createdBy: currentUser.uid,
      createdByName: creatorName,
      createdAt: serverTimestamp(),
      organization: matchedOrg?.orgName || "Unknown Organization",
      department: matchedOrg?.department || "N/A",
      orgId: matchedOrg?.orgId || null,
    };

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

// --- TIME UTILITIES ---
function parseTimeRangeToDates(dateStr, timeStr) {
  try {
    const baseDate = parse(dateStr, "MMMM d, yyyy", new Date());
    const [startStr, endStr] = timeStr.split('-').map(s => s.trim());

    const parseTime = (str) => {
      const match = str.match(/(\d{1,2}):?(\d{2})?\s*(AM|PM)/i);
      if (!match) return null;

      let hours = parseInt(match[1], 10);
      const minutes = match[2] ? parseInt(match[2], 10) : 0;
      const meridiem = match[3].toUpperCase();

      if (meridiem === 'PM' && hours !== 12) hours += 12;
      if (meridiem === 'AM' && hours === 12) hours = 0;

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

function findAvailableSlotsForDay(day, eventsForDay) {
  const availableSlots = [];
  const now = new Date();
  const dayStart = setMinutes(setHours(day, 8), 0); // 8:00 AM
  const dayEnd = setMinutes(setHours(day, 19), 0); // 7:00 PM

  // 1. DETERMINE THE STARTING POINT FOR SUGGESTIONS
  // If it's today, the starting time is the later of 8:00 AM or the current time ('now').
  // For future days, the starting time remains 8:00 AM.
  let currentTime = dayStart;
  if (isSameDay(day, now) && isAfter(now, dayStart)) {
    currentTime = now;
  }
  
  // 2. FILTER BOOKED SLOTS
  const bookedSlots = eventsForDay
    .map(event => parseTimeRangeToDates(format(day, "MMMM d, yyyy"), event.time))
    .filter(Boolean)
    .sort((a, b) => a.start - b.start);

  // Filter out booked events that have already ended.
  const futureBookedSlots = bookedSlots.filter(slot => isAfter(slot.end, currentTime));

  // 3. GENERATE SLOTS BASED ON GAPS
  if (futureBookedSlots.length === 0) {
    // If no future bookings, calculate gap from the current potential start time to day end.
    const fullDayGap = differenceInMinutes(dayEnd, currentTime); 
    generateSuggestionsForGap(currentTime, fullDayGap, availableSlots);
  } else {
    // A. Gap before the first future event
    const firstEvent = futureBookedSlots[0];
    const gapBeforeFirst = differenceInMinutes(firstEvent.start, currentTime);
    generateSuggestionsForGap(currentTime, gapBeforeFirst, availableSlots);
    
    // B. Gaps between future events
    for (let i = 1; i < futureBookedSlots.length; i++) {
      const prevEvent = futureBookedSlots[i - 1];
      const currentEvent = futureBookedSlots[i];
      const gap = differenceInMinutes(currentEvent.start, prevEvent.end);
      generateSuggestionsForGap(prevEvent.end, gap, availableSlots);
    }

    // C. Gap after the last future event
    const lastEventEnd = futureBookedSlots[futureBookedSlots.length - 1].end;
    const finalGap = differenceInMinutes(dayEnd, lastEventEnd);
    generateSuggestionsForGap(lastEventEnd, finalGap, availableSlots);
  }

  return availableSlots;
}

function generateSuggestionsForGap(startTime, gapInMinutes, suggestions) {
  const fmt = (d) => format(d, "h:mm a");
  if (gapInMinutes >= 60) suggestions.push(`${fmt(startTime)} - ${fmt(addHours(startTime, 1))}`);
  if (gapInMinutes >= 120) suggestions.push(`${fmt(startTime)} - ${fmt(addHours(startTime, 2))}`);
  if (gapInMinutes >= 180) suggestions.push(`${fmt(startTime)} - ${fmt(addHours(startTime, 3))}`);
  if (gapInMinutes >= 240) suggestions.push(`${fmt(startTime)} - ${fmt(addHours(startTime, 4))}`);
}

// --- MAIN SUGGESTION LOGIC ---
export async function getSuggestedDateTime(location, targetDate) {
  if (!location || location.trim() === '') {
    return { suggestedTimes: [] };
  }

  const normalize = (loc) => loc?.trim().toLowerCase() || '';
  const targetLocation = normalize(location);

  try {
    const eventsSnapshot = await getDocs(collection(firestore, 'events'));
    const blackoutSnapshot = await getDocs(collection(firestore, 'blackoutDates'));
    const allEvents = eventsSnapshot.docs.map(doc => doc.data());
    const blackoutDates = blackoutSnapshot.docs.map(doc => doc.data().date);

    const now = new Date();
    let suggestions = [];

    const filterPastTimes = (date, slots) => {
      if (!isSameDay(date, now)) return slots;
      return slots.filter(slot => {
        const [startTime] = slot.split('-').map(s => s.trim());
        const parsed = parse(startTime, "h:mm a", date);
        return isAfter(parsed, now);
      });
    };

    // --- CASE 1: Specific date ---
    if (targetDate) {
      const date = parse(targetDate, "MMMM d, yyyy", new Date());
      const formattedDate = format(date, "MMMM d, yyyy");

      if (!blackoutDates.includes(formattedDate) && isAfter(date, addDays(now, -1))) {
        const eventsForDay = allEvents.filter(e =>
          normalize(e.location) === targetLocation &&
          e.date === formattedDate &&
          (e.status === 'Applied' || e.status === 'Approved')
        );

        let availableSlots = findAvailableSlotsForDay(date, eventsForDay);
        availableSlots = filterPastTimes(date, availableSlots);

        if (availableSlots.length > 0)
          suggestions = availableSlots.map(time => `${formattedDate} • ${time}`);
      }
    }
    // --- CASE 2: No specific date ---
    else {
      const startDate = new Date();
      const MAX_DAYS_AHEAD = 30;

      for (let i = 0; i < MAX_DAYS_AHEAD; i++) {
        const currentDate = addDays(startDate, i);
        const formattedDate = format(currentDate, "MMMM d, yyyy");
        if (blackoutDates.includes(formattedDate)) continue;

        const eventsForDay = allEvents.filter(e =>
          normalize(e.location) === targetLocation &&
          e.date === formattedDate &&
          (e.status === 'Applied' || e.status === 'Approved')
        );

        let availableSlots = findAvailableSlotsForDay(currentDate, eventsForDay);
        availableSlots = filterPastTimes(currentDate, availableSlots);

        if (availableSlots.length > 0) {
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
