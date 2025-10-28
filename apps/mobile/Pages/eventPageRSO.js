import React, { useState, useEffect } from 'react';
import {
    View, Text, TouchableOpacity, SafeAreaView,
    KeyboardAvoidingView, Platform, ScrollView, StyleSheet,
    Modal, TextInput, Image, Linking, Switch
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Header from '../components/header';
import BottomNavBar from '../components/bottomNavBar';
import EventCardRSO from '../components/eventCardRSO';
import { fetchEvents, fetchOrganizations, addEvent } from '../Backend/eventPageRSO';
import { getSuggestedDateTime } from '../Backend/eventPageRSO';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImageManipulator from 'expo-image-manipulator';
import { getAuth } from "firebase/auth"; // if using Firebase Auth
import EventCalendar from "../components/calendar";
import DropDownPicker from 'react-native-dropdown-picker';
import { firestore } from '../Firebase';
import { doc, updateDoc } from 'firebase/firestore';

export default function EventPageRSO() {
    const navigation = useNavigation();
    const [selectedOrg, setSelectedOrg] = useState('All');
    const [scrollY, setScrollY] = useState(0);
    const [events, setEvents] = useState([]);
    const [isModalVisible, setIsModalVisible] = useState(false);

    const [newTitle, setNewTitle] = useState('');
    const [newDescription, setNewDescription] = useState('');
    const [newDate, setNewDate] = useState('');
    const [newTime, setNewTime] = useState('');
    const [newLocation, setNewLocation] = useState('');
    const [newParticipants, setNewParticipants] = useState('');

    const [status, setStatus] = useState('');
    const [selectedBanner, setSelectedBanner] = useState(null);
    const [selectedProposal, setSelectedProposal] = useState(null);

    const [isProposalModalVisible, setIsProposalModalVisible] = useState(false);
    const [proposalLink, setProposalLink] = useState('');
    const [isSuccessModalVisible, setIsSuccessModalVisible] = useState(false);


    const [isCollab, setIsCollab] = useState(false);
    const [organizations, setOrganizations] = useState([]);
    const [selectedOrgs, setSelectedOrgs] = useState([]);
    const [isOrgDropdownOpen, setIsOrgDropdownOpen] = useState(false);

    const auth = getAuth();
    const currentUser = auth.currentUser; // logged-in user
    const userId = currentUser?.uid;

    const [isEditMode, setIsEditMode] = useState(false);
    const [editingEventId, setEditingEventId] = useState(null);

    const [openLocation, setOpenLocation] = useState(false);
    const [locations] = useState([
        { label: 'MPH 1, EN Building', value: 'MPH 1, EN Building' },
        { label: 'MPH 2, EN Building', value: 'MPH 2, EN Building' },
        { label: 'EE Laboratory Rooms, EN Building', value: 'EE Laboratory Rooms, EN Building' },
        { label: 'EN Briefing Room, EN Building', value: 'EN Briefing Room, EN Building' },
        { label: 'MPH 3, LCT Building', value: 'MPH 3, LCT Building' },
        { label: 'Conference Hall, TYK Building', value: 'Conference Hall, TYK Building' },
    ]);

    const [selectedCourses, setSelectedCourses] = useState([]);

    const courses = [
        { label: 'College of Engineering', value: 'label-engineering', isLabel: true },
        { label: 'BSCE', value: 'BSCE' },
        { label: 'BSCpE', value: 'BSCpE' },
        { label: 'BSEE', value: 'BSEE' },
        { label: 'BSECE', value: 'BSECE' },
        { label: 'BSME', value: 'BSME' },
        { label: 'BSIE', value: 'BSIE' },
        { label: 'College of Arts and Sciences', value: 'label-cas', isLabel: true },
        { label: 'BSCS', value: 'BSCS' },
        { label: 'BSIT', value: 'BSIT' },
        { label: 'BSBio', value: 'BSBio' },
        { label: 'BSPsych', value: 'BSPsych' },
        { label: 'College of Business Administration', value: 'label-cba', isLabel: true },
        { label: 'BSBA', value: 'BSBA' },
        { label: 'BSA', value: 'BSA' },
        { label: 'College of Fine Arts and Design', value: 'label-cfad', isLabel: true },
        { label: 'BFA', value: 'BFA' },
        { label: 'BSID', value: 'BSID' },
    ];

    const toggleCourse = (courseValue) => {
        setSelectedCourses(prev => {
            if (prev.includes(courseValue)) {
                return prev.filter(c => c !== courseValue);
            } else {
                return [...prev, courseValue];
            }
        });
    };

    useEffect(() => {
        loadEvents();
    }, []);

    const loadEvents = async () => {
        try {
            const data = await fetchEvents();

            // ✅ Show only events created by the logged-in user
            const userEvents = data.filter(event => event.createdBy === userId);
            setEvents(userEvents);
        } catch (error) {
            console.error("Failed to load events:", error);
        }
    };

    const handleSelectBanner = async () => {
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (!permissionResult.granted) {
            alert("Permission to access media library is required!");
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 1,
        });

        if (!result.canceled) {
            try {
                const uri = result.assets[0].uri;

                // For Compressing Image(Di kaya pag malaki)
                const compressed = await ImageManipulator.manipulateAsync(
                    uri,
                    [{ resize: { width: 800 } }],
                    { compress: 0.5, format: ImageManipulator.SaveFormat.JPEG, base64: true }
                );

                const dataUri = `data:image/jpeg;base64,${compressed.base64}`;
                setSelectedBanner(dataUri);

            } catch (error) {
                console.error("Error processing image:", error);
            }
        }
    };

    const handleSelectProposal = async () => {
        try {
            // Let user pick a document (PDF)
            const result = await DocumentPicker.getDocumentAsync({
                type: 'application/pdf',
                copyToCacheDirectory: true,
            });

            if (result.canceled || !result.assets?.length) return;

            const fileUri = result.assets[0].uri;
            const fileName = result.assets[0].name || 'proposal.pdf';

            const base64 = await FileSystem.readAsStringAsync(fileUri, {
                encoding: FileSystem.EncodingType.Base64,
            });

            const dataUri = `data:application/pdf;base64,${base64}`;

            setSelectedProposal({
                name: fileName,
                base64: dataUri,
            });

        } catch (error) {
            console.error("Error uploading proposal:", error);
            alert("Failed to upload proposal. Please try again.");
        }
    };

    const handleUpdateEvent = async () => {
        if (!editingEventId) return;

        try {
            const updatedEvent = {
                banner: selectedBanner,
                title: newTitle,
                description: newDescription,
                date: newDate,
                time: newTime,
                location: newLocation,
                participants: parseInt(newParticipants, 10),
                proposalName: selectedProposal?.name || null,
                proposalBase64: selectedProposal?.base64 || null,
                isCollab,
                collabOrgs: selectedOrgs,
                status: 'Applied',
                adminRemarks: '',
                eligibleCourses: selectedCourses,
            };

            const eventRef = doc(firestore, 'events', editingEventId);
            await updateDoc(eventRef, updatedEvent);

            alert('Event resubmitted for approval!');
            setIsModalVisible(false);
            setIsEditMode(false);
            setEditingEventId(null);
            await loadEvents();
        } catch (error) {
            console.error('Error updating event:', error);
            alert('Failed to update event. Please try again.');
        }
    };

    const handleReapply = (event) => {
        setNewTitle(event.title);
        setNewDescription(event.description);
        setNewDate(event.date);
        setNewTime(event.time);
        setNewLocation(event.location);
        setNewParticipants(String(event.participants));
        setIsCollab(event.isCollab);
        setEditingEventId(event.id);
        setIsEditMode(true);
        setIsModalVisible(true); 
        setSelectedBanner(event.banner);
        setSelectedCourses(event.eligibleCourses || []);
    };

    useEffect(() => {
        if (isModalVisible) {
            (async () => {
                const orgs = await fetchOrganizations();
                setOrganizations(orgs);
            })();
        }
    }, [isModalVisible]);

    const handleAddEvent = async () => {
        if (!newTitle || !newDescription || !newDate || !newTime || !newLocation || !newParticipants) {
            alert('Please fill out all fields!');
            return;
        }

        const participants = parseInt(newParticipants, 10);
        if (isNaN(participants)) {
            alert('Please enter a valid number for participants!');
            return;
        }

        // ✅ Enhanced function to parse time strings
        const parseTimeRange = (dateStr, timeStr) => {
            try {
                const [startStr, endStr] = timeStr.split('-').map(s => s?.trim());

                const parseTime = (timeString) => {
                    // Clean the time string
                    const cleanTime = timeString.trim();

                    // Extract hours, minutes, and AM/PM
                    const timeRegex = /(\d{1,2})(?::(\d{2}))?\s*(AM|PM|am|pm)?/i;
                    const match = cleanTime.match(timeRegex);

                    if (!match) {
                        throw new Error('Invalid time format');
                    }

                    let hours = parseInt(match[1], 10);
                    const minutes = match[2] ? parseInt(match[2], 10) : 0;
                    const meridiem = match[3] ? match[3].toUpperCase() : null;

                    // Convert to 24-hour format
                    if (meridiem === 'PM' && hours !== 12) {
                        hours += 12;
                    } else if (meridiem === 'AM' && hours === 12) {
                        hours = 0;
                    }

                    // Parse the date string to extract month, day, year
                    const dateRegex = /(\w+)\s+(\d{1,2}),?\s+(\d{4})/;
                    const dateMatch = dateStr.match(dateRegex);

                    if (!dateMatch) {
                        throw new Error('Invalid date format');
                    }

                    const monthNames = ['january', 'february', 'march', 'april', 'may', 'june',
                        'july', 'august', 'september', 'october', 'november', 'december'];
                    const monthIndex = monthNames.findIndex(m =>
                        m.startsWith(dateMatch[1].toLowerCase().substring(0, 3))
                    );

                    if (monthIndex === -1) {
                        throw new Error('Invalid month');
                    }

                    const day = parseInt(dateMatch[2], 10);
                    const year = parseInt(dateMatch[3], 10);

                    // Create date object using individual components (more reliable)
                    const date = new Date(year, monthIndex, day, hours, minutes, 0, 0);

                    if (isNaN(date.getTime())) {
                        throw new Error('Invalid date object created');
                    }

                    return date.getTime();
                };

                if (endStr) {
                    return {
                        start: parseTime(startStr),
                        end: parseTime(endStr),
                    };
                } else {
                    const start = parseTime(startStr);
                    // Default: add 1 hour if no end time provided
                    return {
                        start,
                        end: start + 60 * 60 * 1000,
                    };
                }
            } catch (err) {
                console.warn("⏰ Error parsing time:", err.message, "Date:", dateStr, "Time:", timeStr);
                return null;
            }
        };

        // ✅ Normalize location for comparison (case-insensitive, trim spaces)
        const normalizeLocation = (loc) => loc?.trim().toLowerCase() || '';
        const normalizedNewLocation = normalizeLocation(newLocation);

        // ✅ Check conflicts against events with Applied or Approved status
        const conflictingEvents = events.filter(event => {

            // Only check Applied and Approved events
            if (!(event.status === 'Applied' || event.status === 'Approved')) {
                return false;
            }

            // Check if same location (case-insensitive comparison)
            const eventLoc = normalizeLocation(event.location);

            if (eventLoc !== normalizedNewLocation) {
                return false;
            }

            // Check if same date
            if (event.date !== newDate) {

                return false;
            }

            // Check time overlap
            try {
                const existing = parseTimeRange(event.date, event.time);
                const incoming = parseTimeRange(newDate, newTime);

                if (!existing || !incoming) {
                    return false;
                }

                // Overlap check: (A starts before B ends) AND (A ends after B starts)
                const hasOverlap = incoming.start < existing.end && incoming.end > existing.start;
                return hasOverlap;
            } catch (err) {
                console.warn("⚠️ Error checking conflict:", err);
                return false;
            }
        });

        // ✅ Show detailed warning if conflicts found
        if (conflictingEvents.length > 0) {
            const conflictDetails = conflictingEvents.map(event =>
                `  • "${event.title}" at ${event.time} (${event.status})`
            ).join('\n');

            alert(
                `⚠️ LOCATION CONFLICT DETECTED\n\n` +
                `The location "${newLocation}" is already booked on ${newDate}.\n\n` +
                `Conflicting events:\n${conflictDetails}\n\n` +
                `Please choose:\n` +
                `  • A different time slot for ${newLocation}\n` +
                `  • A different location\n` +
                `  • A different date`
            );
            return;
        }

        const eventStatus = status || 'Applied';

        const newEvent = {
            banner: selectedBanner,
            title: newTitle,
            description: newDescription,
            date: newDate,
            time: newTime,
            location: newLocation,
            participants: participants,
            status: eventStatus,
            proposalName: selectedProposal?.name || null,
            proposalBase64: selectedProposal?.base64 || null,
            isCollab,
            collabOrgs: selectedOrgs,
            createdBy: userId,
            eligibleCourses: selectedCourses,
        };

        try {
            await addEvent(newEvent);
            await loadEvents();
            setIsModalVisible(false);

            setSelectedBanner(null);
            setNewTitle('');
            setNewDescription('');
            setNewDate('');
            setNewTime('');
            setNewLocation('');
            setNewParticipants('');
            setStatus('');
            setSelectedProposal(null);
            setProposalLink('');

            setIsSuccessModalVisible(true);

            setIsCollab(false);
            setSelectedOrgs([]);
            setSelectedCourses([]);
        } catch (error) {
            console.error('Error adding event:', error);
            alert('Failed to create event. Please try again.');
        }
    };

    const [locationConflictWarning, setLocationConflictWarning] = useState('');

    const getOrganizationTitle = () => {
        switch (selectedOrg) {
            case 'All': return 'All Events';
            case 'CSC': return 'Central Student Council';
            case 'COE': return 'College of Engineering';
            case 'CFAD': return 'College of Fine Arts and Science';
            case 'CBA': return 'College of Business Administration';
            case 'CAS': return 'College of Arts and Science';
            default: return '';
        }
    };

    const filteredEvents = selectedOrg === 'All'
        ? events
        : events.filter(event => event.org === selectedOrg);

    const [suggestedDateTime, setSuggestedDateTime] = useState(null);

    useEffect(() => {
        const fetchSuggestion = async () => {
            // A location is required to start fetching suggestions.
            if (newLocation && newLocation.trim().length > 2) {
                // Pass both location and date to the backend.
                // - If 'newDate' is empty, the backend finds the soonest available day.
                // - If 'newDate' has a value, the backend finds slots for that specific day.
                const suggestion = await getSuggestedDateTime(newLocation, newDate);
                setSuggestedDateTime(suggestion);
            } else {
                // If the location is cleared, also clear the suggestions.
                setSuggestedDateTime(null);
            }
        };

        // Debounce the request to avoid calling Firebase on every keystroke.
        const handler = setTimeout(() => {
            fetchSuggestion();
        }, 500);

        return () => {
            clearTimeout(handler);
        };
    }, [newLocation, newDate]);

    useEffect(() => {
        if (newDate && newTime && newLocation) {
            const parseTimeRange = (dateStr, timeStr) => {
                try {
                    const [startStr, endStr] = timeStr.split('-').map(s => s?.trim());

                    const parseTime = (timeString) => {
                        const cleanTime = timeString.trim();
                        const timeRegex = /(\d{1,2})(?::(\d{2}))?\s*(AM|PM|am|pm)?/i;
                        const match = cleanTime.match(timeRegex);

                        if (!match) return null;

                        let hours = parseInt(match[1], 10);
                        const minutes = match[2] ? parseInt(match[2], 10) : 0;
                        const meridiem = match[3] ? match[3].toUpperCase() : null;

                        if (meridiem === 'PM' && hours !== 12) hours += 12;
                        else if (meridiem === 'AM' && hours === 12) hours = 0;

                        const dateRegex = /(\w+)\s+(\d{1,2}),?\s+(\d{4})/;
                        const dateMatch = dateStr.match(dateRegex);
                        if (!dateMatch) return null;

                        const monthNames = ['january', 'february', 'march', 'april', 'may', 'june',
                            'july', 'august', 'september', 'october', 'november', 'december'];
                        const monthIndex = monthNames.findIndex(m =>
                            m.startsWith(dateMatch[1].toLowerCase().substring(0, 3))
                        );
                        if (monthIndex === -1) return null;

                        const day = parseInt(dateMatch[2], 10);
                        const year = parseInt(dateMatch[3], 10);
                        const date = new Date(year, monthIndex, day, hours, minutes, 0, 0);

                        return isNaN(date.getTime()) ? null : date.getTime();
                    };

                    if (endStr) {
                        return { start: parseTime(startStr), end: parseTime(endStr) };
                    } else {
                        const start = parseTime(startStr);
                        return start ? { start, end: start + 60 * 60 * 1000 } : null;
                    }
                } catch {
                    return null;
                }
            };

            const normalizeLocation = (loc) => loc?.trim().toLowerCase() || '';
            const conflictingEvents = events.filter(event => {
                if (!(event.status === 'Applied' || event.status === 'Approved')) return false;
                if (normalizeLocation(event.location) !== normalizeLocation(newLocation)) return false;
                if (event.date !== newDate) return false;

                try {
                    const existing = parseTimeRange(event.date, event.time);
                    const incoming = parseTimeRange(newDate, newTime);
                    if (!existing || !incoming) return false;
                    return incoming.start < existing.end && incoming.end > existing.start;
                } catch {
                    return false;
                }
            });

            if (conflictingEvents.length > 0) {
                const details = conflictingEvents.map(e => `${e.title} (${e.time})`).join(', ');
                setLocationConflictWarning(`⚠️ Conflict detected with: ${details}`);
            } else {
                setLocationConflictWarning('');
            }
        } else {
            setLocationConflictWarning('');
        }
    }, [newDate, newTime, newLocation, events]);


    // STEP 4 (OPTIONAL): Add this warning display in your modal
    // Place it right after the Event Location TextInput:

    {
        locationConflictWarning ? (
            <View style={styles.warningContainer}>
                <Text style={styles.warningText}>{locationConflictWarning}</Text>
            </View>
        ) : null
    }


    return (
        <SafeAreaView style={styles.safeArea}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.container}
            >
                <Header scrollY={scrollY} />
                <ScrollView
                    onScroll={(event) => {
                        setScrollY(event.nativeEvent.contentOffset.y);
                    }}
                    scrollEventThrottle={16}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}>

                    <TouchableOpacity
                        style={styles.floatingButton}
                        onPress={() => setIsModalVisible(true)}
                    >
                        <Text style={styles.floatingButtonText}>Create Event2</Text>
                    </TouchableOpacity>

                    <View style={styles.titleContainer}>
                        <Text style={styles.titleText}>Your Events</Text>
                        <View style={styles.underline} />
                    </View>

                    {filteredEvents.map((event) => (
                        <EventCardRSO
                            key={event.id}
                            event={{
                                id: event.id,
                                banner: event.banner,
                                seal: event.seal,
                                title: event.title,
                                date: event.date,
                                time: event.time,
                                description: event.description,
                                participants: event.participants,
                                location: event.location,
                                status: event.status,
                                isCollab: event.isCollab || false,
                                adminRemarks: event.adminRemarks || "No Remark",
                            }}
                            onReapply={handleReapply}
                        />
                    ))}

                    <View style={{ flex: 1, backgroundColor: "#fff" }}>
                        <EventCalendar />
                    </View>

                </ScrollView>

                <BottomNavBar />

                {/* Modal */}
                <Modal
                    animationType="slide"
                    transparent={true}
                    visible={isModalVisible}
                    onRequestClose={() => setIsModalVisible(false)}
                >
                    <View style={styles.modalContainer}>
                        <KeyboardAvoidingView
                            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                            style={styles.modalContentWrapper} // Added a wrapper style for layout adjustments
                        >
                            <ScrollView
                                nestedScrollEnabled={true}
                                showsVerticalScrollIndicator={false}
                                onScrollBeginDrag={() => setOpenLocation(false)}
                            >
                                <View style={styles.modalContent}>
                                    <Text style={styles.modalTitle}>Create Event</Text>
                                    <Text style={styles.label}>Event Title</Text>
                                    <TextInput
                                        placeholder="ENtramurals 2025"
                                        placeholderTextColor="#D3D3D3"
                                        style={styles.input}
                                        value={newTitle}
                                        onChangeText={setNewTitle}
                                    />
                                    <Text style={styles.label}>Event Description</Text>
                                    <TextInput
                                        placeholder="An event of..."
                                        placeholderTextColor="#D3D3D3"
                                        style={styles.input}
                                        value={newDescription}
                                        onChangeText={setNewDescription}
                                    />
                                    <Text style={[styles.label, { marginTop: 10 }]}>Event Location</Text>

                                    <View style={{ zIndex: 1001, marginTop: 5 }}>
                                        <DropDownPicker
                                            open={openLocation}
                                            value={newLocation}
                                            items={locations}
                                            setOpen={setOpenLocation}
                                            setValue={setNewLocation}
                                            placeholder="Select event location"
                                            placeholderStyle={{ color: '#D3D3D3' }}
                                            style={{
                                                backgroundColor: '#ffffffff',
                                                borderColor: '#D3D3D3',
                                                borderRadius: 8,
                                            }}
                                            textStyle={{
                                                color: '#000000ff',
                                            }}
                                            dropDownContainerStyle={{
                                                backgroundColor: '#ffffffff',
                                                borderColor: '#D3D3D3',
                                            }}
                                        />
                                    </View>
                                    <View style={styles.dateTimeRow}>
                                        {/* Date Input */}
                                        <View style={styles.dateTimeColumn}>
                                            <Text style={styles.label}>Event Date</Text>
                                            <TextInput
                                                placeholder="April 25, 2025"
                                                placeholderTextColor="#D3D3D3"
                                                style={styles.input}
                                                value={newDate}
                                                onChangeText={setNewDate}
                                            />
                                        </View>

                                        {/* Time Input */}
                                        <View style={styles.dateTimeColumn}>
                                            <Text style={styles.label}>Event Time</Text>
                                            <TextInput
                                                placeholder="8:00 - 10:00 AM"
                                                placeholderTextColor="#D3D3D3"
                                                style={styles.input}
                                                value={newTime}
                                                onChangeText={setNewTime}
                                            />
                                        </View>
                                    </View>

                                    {/* Suggestions Below Inputs */}
                                    {suggestedDateTime?.suggestedTimes?.length > 0 && (
                                        <View style={styles.suggestionContainer}>
                                            <Text style={styles.suggestionLabel}>Suggestions:</Text>
                                            <View style={styles.suggestionGrid}>
                                                {suggestedDateTime.suggestedTimes.map((item, index) => {
                                                    const [date, time] = item.split(" • ");
                                                    return (
                                                        <TouchableOpacity
                                                            key={index}
                                                            style={styles.suggestionButton}
                                                            onPress={() => {
                                                                setNewDate(date.trim());
                                                                setNewTime(time.trim());
                                                            }}
                                                        >
                                                            <Text style={styles.suggestionText}>{date}</Text>
                                                            <Text style={styles.suggestionText}>{time}</Text>
                                                        </TouchableOpacity>
                                                    );
                                                })}
                                            </View>
                                        </View>
                                    )}
                                    {locationConflictWarning ? (
                                        <View style={styles.warningContainer}>
                                            <Text style={styles.warningText}>{locationConflictWarning}</Text>
                                        </View>
                                    ) : null}
                                    <Text style={styles.label}>Event Participants</Text>
                                    <TextInput
                                        placeholder="100"
                                        placeholderTextColor="#D3D3D3"
                                        style={styles.input}
                                        keyboardType="numeric"
                                        value={newParticipants}
                                        onChangeText={setNewParticipants}
                                    />

                                    <Text style={styles.label}>Eligible Courses *</Text>
                                    <Text style={styles.sectionSubtitle}>
                                        Select courses that can join this event
                                    </Text>
                                    <View style={styles.coursesContainer}>
                                        {courses.map((course) => {
                                            if (course.isLabel) {
                                                return (
                                                    <Text key={course.value} style={styles.courseLabel}>
                                                        {course.label}
                                                    </Text>
                                                );
                                            }
                                            
                                            const isSelected = selectedCourses.includes(course.value);
                                            return (
                                                <TouchableOpacity
                                                    key={course.value}
                                                    style={[
                                                        styles.courseButton,
                                                        isSelected && styles.courseButtonActive
                                                    ]}
                                                    onPress={() => toggleCourse(course.value)}
                                                >
                                                    <Text style={[
                                                        styles.courseButtonText,
                                                        isSelected && styles.courseButtonTextActive
                                                    ]}>
                                                        {course.label}
                                                    </Text>
                                                </TouchableOpacity>
                                            );
                                        })}
                                    </View>

                                    <View style={styles.bannerFileRow}>
                                        <View style={styles.uploadSection}>
                                            <Text style={styles.label}>Event Banner</Text>
                                            <TouchableOpacity
                                                style={styles.uploadButton}
                                                onPress={handleSelectBanner}
                                            >
                                                <Text style={styles.buttonText}>
                                                    {selectedBanner ? 'Change Banner' : 'Upload Banner'}
                                                </Text>
                                            </TouchableOpacity>
                                            {selectedBanner && (
                                                <Image
                                                    source={{ uri: selectedBanner }}
                                                    style={styles.bannerPreview}
                                                    resizeMode="cover"
                                                />
                                            )}
                                        </View>

                                        <View style={styles.uploadSection}>
                                            <Text style={styles.label}>Event Proposal</Text>

                                            <TouchableOpacity
                                                style={styles.uploadButton}
                                                onPress={handleSelectProposal}
                                            >
                                                <Text style={styles.buttonText}>
                                                    {selectedProposal ? 'Change Proposal' : 'Upload Proposal'}
                                                </Text>
                                            </TouchableOpacity>

                                            {/* Proposal Preview Card */}
                                            {selectedProposal && (
                                                <View style={styles.proposalPreview}>
                                                    <View style={styles.proposalIconContainer}>
                                                        <Text style={styles.proposalIcon}>📄</Text>
                                                    </View>
                                                    <View style={styles.proposalDetails}>
                                                        <Text style={styles.proposalTitle} numberOfLines={1}>
                                                            {selectedProposal.name}
                                                        </Text>
                                                        <TouchableOpacity
                                                            onPress={() => Linking.openURL(selectedProposal.base64)}
                                                        >
                                                            <Text style={styles.proposalViewText}>View PDF</Text>
                                                        </TouchableOpacity>
                                                    </View>
                                                </View>
                                            )}
                                        </View>

                                    </View>

                                    <Text style={styles.label}>Collaboration Event?</Text>
                                    <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
                                        <Switch value={isCollab} onValueChange={setIsCollab} />
                                        <Text style={{ marginLeft: 8 }}>{isCollab ? "Yes" : "No"}</Text>
                                    </View>

                                    {isCollab && (
                                        <View style={{ marginBottom: 15 }}>
                                            <Text style={styles.label}>Select Partner Organizations</Text>

                                            {/* Dropdown Toggle */}
                                            <TouchableOpacity
                                                style={styles.dropdownToggle}
                                                onPress={() => setIsOrgDropdownOpen(!isOrgDropdownOpen)}
                                            >
                                                <Text style={styles.dropdownText}>
                                                    {selectedOrgs.length > 0
                                                        ? `${selectedOrgs.length} selected`
                                                        : "Choose organizations"}
                                                </Text>
                                                <Text style={styles.dropdownArrow}>
                                                    {isOrgDropdownOpen ? "▲" : "▼"}
                                                </Text>
                                            </TouchableOpacity>

                                            {/* Dropdown List */}
                                            {isOrgDropdownOpen && (
                                                <View style={styles.dropdownList}>
                                                    {organizations.map((org) => {
                                                        const isChecked = selectedOrgs.includes(org.id);
                                                        return (
                                                            <TouchableOpacity
                                                                key={org.id}
                                                                style={styles.dropdownItem}
                                                                onPress={() => {
                                                                    if (isChecked) {
                                                                        setSelectedOrgs(selectedOrgs.filter((o) => o !== org.id));
                                                                    } else {
                                                                        setSelectedOrgs([...selectedOrgs, org.id]);
                                                                    }
                                                                }}
                                                            >
                                                                <View style={styles.checkbox}>
                                                                    {isChecked && <Text style={styles.checkmark}>✓</Text>}
                                                                </View>
                                                                <Text style={styles.orgText}>{org.orgName}</Text>
                                                            </TouchableOpacity>
                                                        );
                                                    })}
                                                </View>
                                            )}
                                        </View>
                                    )}


                                    <View style={styles.modalButtons}>
                                        <TouchableOpacity
                                            style={styles.cancelButtons}
                                            onPress={() => {
                                                setIsModalVisible(false);
                                                setNewDate('');
                                                setNewTime('');
                                                setSelectedBanner(null);
                                                setSelectedProposal(null);
                                                setProposalLink('');
                                                setSelectedCourses([]);
                                            }}
                                        >
                                            <Text style={styles.buttonText}>Cancel</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={styles.addButton}
                                            onPress={isEditMode ? handleUpdateEvent : handleAddEvent}
                                        >
                                            <Text style={styles.buttonText}>{isEditMode ? 'Update Event' : 'Add Event'}</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </ScrollView>
                        </KeyboardAvoidingView>
                    </View>
                </Modal>

                <Modal
                    animationType="fade"
                    transparent={true}
                    visible={isSuccessModalVisible}
                    onRequestClose={() => setIsSuccessModalVisible(false)}
                >
                    <View style={styles.successModalOverlay}>
                        <View style={styles.successModalContent}>
                            <View style={styles.successIconContainer}>
                                <Text style={styles.successIcon}>✓</Text>
                            </View>
                            <Text style={styles.successTitle}>Event Submitted!</Text>
                            <Text style={styles.successMessage}>
                                Your event has been successfully submitted for approval.
                            </Text>
                            <TouchableOpacity
                                style={styles.successButton}
                                onPress={() => setIsSuccessModalVisible(false)}
                            >
                                <Text style={styles.successButtonText}>Done</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>

            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#fff',
    },
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    scrollContent: {
        flexGrow: 1,
        paddingBottom: 80,
        paddingHorizontal: 16,
    },
    titleContainer: {
        marginTop: 15,
        marginHorizontal: 20,
        marginBottom: 15,
    },
    titleText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#E50914',
        textAlign: 'center',
    },
    underline: {
        alignSelf: 'center',
        height: 2,
        backgroundColor: '#E50914',
        width: '100%',
        marginTop: 2,
    },
    floatingButton: {
        alignSelf: 'center',
        marginTop: 10,
        backgroundColor: '#E50914',
        padding: 10,
        borderRadius: 10,
        width: '90%',
        height: 'auto',
        justifyContent: 'center',
        alignItems: 'center',
    },
    dateTimeRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 10,
    },

    dateTimeColumn: {
        flex: 1,
    },

    floatingButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalContent: {
        backgroundColor: 'white',
        marginHorizontal: 20,
        borderRadius: 10,
        padding: 20,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
        textAlign: 'center',
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
        marginBottom: 5,
        marginTop: 5,
        textAlign: 'left',
    },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,
        padding: 10,
        marginVertical: 5,
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 15,
    },

    addButton: {
        backgroundColor: '#4CAF50',

        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 5,
        width: '48%',
        marginTop: 5,
        textAlign: 'center',
    },
    buttonText: {
        color: 'white',
        fontWeight: 'bold',
        textAlign: 'center',
    },

    uploadButton: {
        backgroundColor: '#E50914',
        paddingVertical: 10,

        borderRadius: 5,
        width: '100%',
        marginTop: 5,
        textAlign: 'center',
    },
    bannerPreview: {
        width: '100%',
        height: 150,
        marginTop: 10,
        borderRadius: 8,
    },
    uploadSection: {
        flex: 1,
    },
    bannerFileRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: 10,
    },

    proposalPreview: {
        width: '100%',
        height: 150,
        marginTop: 10,
        borderRadius: 8,
        backgroundColor: '#f8f9fa',
        borderWidth: 1,
        borderColor: '#e0e0e0',
        padding: 10,

        justifyContent: 'center',
        alignItems: 'center',
    },
    proposalIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 25,
        backgroundColor: '#4285f4',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
    },
    proposalIcon: {
        fontSize: 20,
    },
    proposalDetails: {
        width: '100%',
        alignItems: 'center',
    },
    proposalTitle: {
        fontSize: 10,
        fontWeight: '600',
        color: '#333',
        marginBottom: 5,
        textAlign: 'center',
    },
    proposalLinkButton: {
        marginVertical: 5,
        paddingHorizontal: 10,
    },
    proposalLinkText: {
        fontSize: 11,
        color: '#4285f4',
        textDecorationLine: 'underline',
        textAlign: 'center',
    },
    proposalBadge: {
        backgroundColor: '#e8f0fe',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        marginTop: 5,
    },
    proposalBadgeText: {
        fontSize: 10,
        color: '#1967d2',
        fontWeight: '500',
        textAlign: 'center',
    },

    suggestionContainer: {
        marginTop: 5,
    },

    suggestionLabel: {
        fontWeight: '400',
        marginBottom: 6,
        fontStyle: 'italic',
        fontSize: 12,
        color: '#555',
    },

    suggestionGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10, // Use margin for RN versions that don't support gap
    },

    suggestionButton: {
        backgroundColor: '#f5f5f5',
        paddingVertical: 5,
        paddingHorizontal: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ddd',

        width: '48%', // Two per row
    },

    suggestionText: {
        fontSize: 12,
        color: '#333',
        textAlign: 'center',
    },


    uploadSection: {
        flex: 1,
    },

    bannerPreview: {
        width: '100%',
        height: 100,
        marginTop: 8,
        borderRadius: 8,
    },

    proposalText: {
        fontSize: 24,
        color: '#000',
        fontStyle: 'italic',
    },

    proposalModalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 20,
    },
    proposalmodalButton: {
        flex: 1,
        paddingVertical: 10,
        marginHorizontal: 5,
        borderRadius: 5,
        alignItems: 'center',
    },
    cancelButton: {
        backgroundColor: '#E50914',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 5,
        width: '45%',
        marginTop: 5,
        textAlign: 'center',
    },
    cancelButtons: {
        backgroundColor: '#E50914',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 5,
        width: '48%',
        marginTop: 5,
        textAlign: 'center',
    },
    saveButton: {
        backgroundColor: '#4CAF50',

        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 5,
        width: '45%',
        marginTop: 5,
        textAlign: 'center',
    },
    buttonText: {
        color: '#fff',
        fontWeight: 'bold',
        textAlign: 'center',
    },
    warningContainer: {
        backgroundColor: '#fff3cd',
        borderWidth: 1,
        borderColor: '#ffc107',
        borderRadius: 8,
        padding: 12,
        marginTop: 10,
        marginBottom: 10,
    },
    warningText: {
        color: '#856404',
        fontSize: 13,
        lineHeight: 18,
    },

    successModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    successModalContent: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 30,
        alignItems: 'center',
        width: '80%',
        maxWidth: 320,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    successIconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#4CAF50',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    successIcon: {
        fontSize: 50,
        color: '#fff',
        fontWeight: 'bold',
    },
    successTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 10,
        textAlign: 'center',
    },
    successMessage: {
        fontSize: 15,
        color: '#666',
        textAlign: 'center',
        marginBottom: 25,
        lineHeight: 22,
    },
    successButton: {
        backgroundColor: '#4CAF50',
        paddingVertical: 12,
        paddingHorizontal: 40,
        borderRadius: 25,
        minWidth: 120,
    },
    successButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        textAlign: 'center',
    },

    orgOption: {
        padding: 10,
        borderWidth: 1,
        borderColor: "#ccc",
        borderRadius: 8,
        marginVertical: 5,
    },
    orgSelected: {
        backgroundColor: "#007BFF20",
        borderColor: "#007BFF",
    },
    dropdownToggle: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#ccc",
        borderRadius: 8,
        padding: 10,
        marginTop: 5,
    },
    dropdownText: {
        fontSize: 16,
        color: "#333",
    },
    dropdownArrow: {
        fontSize: 14,
        color: "#555",
    },
    dropdownList: {
        marginTop: 5,
        borderWidth: 1,
        borderColor: "#ccc",
        borderRadius: 8,
        backgroundColor: "#fff",
        maxHeight: 200,
    },
    dropdownItem: {
        flexDirection: "row",
        alignItems: "center",
        padding: 10,
        borderBottomWidth: 1,
        borderBottomColor: "#eee",
    },
    checkbox: {
        width: 20,
        height: 20,
        borderWidth: 1,
        borderColor: "#555",
        marginRight: 10,
        alignItems: "center",
        justifyContent: "center",
    },
    checkmark: {
        fontSize: 14,
        color: "#007BFF",
    },
    orgText: {
        fontSize: 16,
        color: "#333",
    },

    sectionSubtitle: {
        fontSize: 12,
        color: '#666',
        marginBottom: 10,
        fontStyle: 'italic',
    },
    coursesContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 15,
    },
    courseLabel: {
        width: '100%',
        fontSize: 13,
        fontWeight: '600',
        color: '#4CAF50',
        marginTop: 8,
        marginBottom: 4,
    },
    courseButton: {
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#ccc',
        backgroundColor: '#fff',
        marginBottom: 8,
    },
    courseButtonActive: {
        backgroundColor: '#4CAF50',
        borderColor: '#4CAF50',
    },
    courseButtonText: {
        fontSize: 13,
        color: '#333',
    },
    courseButtonTextActive: {
        color: '#fff',
        fontWeight: '500',
    },

});
