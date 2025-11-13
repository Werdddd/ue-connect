import { firestore } from '../Firebase';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';

// Script to add eligibleCourses field to existing events
export async function updateEventsWithEligibleCourses() {
  try {
    console.log('Starting to update events with eligible courses...');
    
    // Get all events
    const eventsCollection = collection(firestore, 'events');
    const eventsSnapshot = await getDocs(eventsCollection);
    
    const updatePromises = [];
    
    eventsSnapshot.forEach((eventDoc) => {
      const eventData = eventDoc.data();
      const eventId = eventDoc.id;
      
      // Skip if event already has eligibleCourses
      if (eventData.eligibleCourses) {
        console.log(`Event ${eventData.title} already has eligibleCourses, skipping...`);
        return;
      }
      
      // Determine eligible courses based on department or organization
      let eligibleCourses = [];
      
      const department = eventData.department?.toLowerCase();
      const organization = eventData.organization?.toLowerCase();
      
      if (department === 'coe' || organization?.includes('engineering') || organization?.includes('cs') || organization?.includes('computer')) {
        // Engineering events - typically open to engineering courses
        eligibleCourses = ['BSCE', 'BSCpE', 'BSEE', 'BSECE', 'BSME', 'BSIE', 'BSCS', 'BSIT'];
      } else if (department === 'cas' || organization?.includes('arts') || organization?.includes('science')) {
        // Arts and Sciences events
        eligibleCourses = ['BSCS', 'BSIT', 'BSBio', 'BSPsych'];
      } else if (department === 'cba' || organization?.includes('business')) {
        // Business events
        eligibleCourses = ['BSBA', 'BSA'];
      } else if (department === 'cfad' || organization?.includes('arts') || organization?.includes('design')) {
        // Fine Arts events
        eligibleCourses = ['BFA', 'BSID'];
      } else if (department === 'csc' || organization?.includes('student council')) {
        // Student Council events - open to all
        eligibleCourses = ['BSCE', 'BSCpE', 'BSEE', 'BSECE', 'BSME', 'BSIE', 'BSCS', 'BSIT', 'BSBio', 'BSPsych', 'BSBA', 'BSA', 'BFA', 'BSID'];
      } else {
        // Default: open to all courses
        eligibleCourses = ['BSCE', 'BSCpE', 'BSEE', 'BSECE', 'BSME', 'BSIE', 'BSCS', 'BSIT', 'BSBio', 'BSPsych', 'BSBA', 'BSA', 'BFA', 'BSID'];
      }
      
      // Update the event with eligibleCourses
      const eventRef = doc(firestore, 'events', eventId);
      const updatePromise = updateDoc(eventRef, {
        eligibleCourses: eligibleCourses
      }).then(() => {
        console.log(`✅ Updated event "${eventData.title}" with eligible courses:`, eligibleCourses);
      }).catch((error) => {
        console.error(`❌ Failed to update event "${eventData.title}":`, error);
      });
      
      updatePromises.push(updatePromise);
    });
    
    // Wait for all updates to complete
    await Promise.all(updatePromises);
    
    console.log('🎉 Finished updating all events with eligible courses!');
    return { success: true, message: 'All events updated successfully' };
    
  } catch (error) {
    console.error('Error updating events:', error);
    return { success: false, error: error.message };
  }
}

// Alternative: Update specific events with custom eligible courses
export async function updateSpecificEvent(eventId, eligibleCourses) {
  try {
    const eventRef = doc(firestore, 'events', eventId);
    await updateDoc(eventRef, {
      eligibleCourses: eligibleCourses
    });
    console.log(`✅ Updated event ${eventId} with eligible courses:`, eligibleCourses);
    return { success: true };
  } catch (error) {
    console.error(`❌ Failed to update event ${eventId}:`, error);
    return { success: false, error: error.message };
  }
}

// Quick test function to update your current events
export async function quickUpdateCurrentEvents() {
  try {
    // Based on your console log, all events are from "Association of CS Students" in COE department
    // So let's make them eligible for CS and IT courses
    const csEvents = [
      'OrgEvent2', 'OrgEvent3', 'OrgEvent4', 'OrgEvent5', 
      'OrgEvent6', 'OrgEvent7', 'OrgEvent8', 'OrgEvent9'
    ];
    
    const eligibleCourses = ['BSCS', 'BSIT', 'BSCpE', 'BSEE', 'BSECE'];
    
    for (const eventId of csEvents) {
      await updateSpecificEvent(eventId, eligibleCourses);
    }
    
    console.log('🎉 All CS events updated with eligible courses!');
    return { success: true };
  } catch (error) {
    console.error('Error in quick update:', error);
    return { success: false, error: error.message };
  }
}
