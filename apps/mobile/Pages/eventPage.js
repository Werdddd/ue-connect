import React, { useState, useEffect } from 'react';
import {
    View, Text, TouchableOpacity, SafeAreaView,
    KeyboardAvoidingView, Platform, ScrollView, StyleSheet,
    Modal, TextInput
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Header from '../components/header';
import BottomNavBar from '../components/bottomNavBar';
import OrganizationBar from '../components/organizationBar';
import EventCard from '../components/eventCard';
import { fetchEvents, addEvent } from '../Backend/eventPage';
import EventCalendar from "../components/calendar";
import { auth, firestore } from '../Firebase';
import { getDoc, doc } from 'firebase/firestore';

export default function Event() {
    const [selectedOrg, setSelectedOrg] = useState('All');
    const [selectedDepartment, setSelectedDepartment] = useState('All');
    const [scrollY, setScrollY] = useState(0);
    const [events, setEvents] = useState([]);
    const [currentUserProfile, setCurrentUserProfile] = useState(null);
    const [recommendedEvents, setRecommendedEvents] = useState([]);

    const normalizeValue = (value) =>
        typeof value === 'string' ? value.trim().toLowerCase() : '';
    useEffect(() => {
        loadEvents();
    }, []);

    useEffect(() => {
        const loadCurrentUserProfile = async () => {
            try {
                const user = auth.currentUser;
                if (!user?.email) return;
                const userRef = doc(firestore, 'Users', user.email);
                const userSnap = await getDoc(userRef);
                if (userSnap.exists()) {
                    setCurrentUserProfile(userSnap.data());
                }
            } catch (error) {
                console.error('Failed to load user profile for events page:', error);
            }
        };

        loadCurrentUserProfile();
    }, []);

    const loadEvents = async () => {
        try {
            const data = await fetchEvents();

            const visibleEvents = data.filter(event => {
                const status = event.status?.toLowerCase();
                return status === 'approved' || status === 'finished';
            });

            // Sort events: Approved first (active events), then Finished
            const sortedEvents = visibleEvents.sort((a, b) => {
                const statusA = a.status?.toLowerCase();
                const statusB = b.status?.toLowerCase();
                
                if (statusA === 'approved' && statusB === 'finished') return -1;
                if (statusA === 'finished' && statusB === 'approved') return 1;
                return 0;
            });

            setEvents(sortedEvents);
        } catch (error) {
            console.error('Failed to load events:', error);
        }
    };

    useEffect(() => {
        if (!currentUserProfile || events.length === 0) {
            setRecommendedEvents([]);
            return;
        }

        const userCourse = normalizeValue(currentUserProfile.Course || currentUserProfile.course);
        const userDepartment = normalizeValue(currentUserProfile.department || currentUserProfile.Department);
        const userGroup = normalizeValue(currentUserProfile.group);
        const userInterests = Array.isArray(currentUserProfile.interests)
            ? currentUserProfile.interests.map((interest) => normalizeValue(interest)).filter(Boolean)
            : [];

        const scoredEvents = events
            .map((event) => {
                let score = 0;

                const status = normalizeValue(event.status);
                if (status === 'approved') {
                    score += 1;
                } else if (status === 'finished') {
                    score -= 2;
                }

                const eligibleCourses = Array.isArray(event.eligibleCourses) ? event.eligibleCourses : [];
                if (eligibleCourses.length > 0) {
                    const matchesCourse =
                        userCourse &&
                        eligibleCourses.some((course) => normalizeValue(course) === userCourse);
                    if (matchesCourse) {
                        score += 4;
                    } else if (userCourse) {
                        return null;
                    }
                } else {
                    score += 1;
                }

                const eventDepartment = normalizeValue(event.department || event.college || event.faculty);
                if (eventDepartment && userDepartment && eventDepartment === userDepartment) {
                    score += 2;
                }

                const eventGroup = normalizeValue(event.targetGroup || event.group || event.audience);
                if (eventGroup && userGroup && eventGroup === userGroup) {
                    score += 1;
                }

                const tags = Array.isArray(event.tags)
                    ? event.tags.map((tag) => normalizeValue(tag)).filter(Boolean)
                    : [];
                if (tags.length && userInterests.length) {
                    const overlap = tags.filter((tag) => userInterests.includes(tag));
                    score += overlap.length;
                }

                const category = normalizeValue(event.category || event.type || event.eventType);
                if (category && userInterests.includes(category)) {
                    score += 1;
                }

                const popularityScore =
                    typeof event.popularityScore === 'number' ? event.popularityScore : 0;
                score += popularityScore * 0.05;

                return { event, score };
            })
            .filter(Boolean)
            .filter((item) => item.score > 0)
            .sort((a, b) => b.score - a.score)
            .slice(0, 5)
            .map((item) => item.event);

        setRecommendedEvents(scoredEvents);
    }, [events, currentUserProfile]);

    const getOrganizationTitle = () => {
        switch (selectedDepartment) {
            case 'All':
                return 'All Events1';
            case 'CSC':
                return 'Central Student Council';
            case 'COE':
                return 'College of Engineering';
            case 'CAS':
                return 'College of Arts and Sciences';
            case 'CFAD':
                return 'College of Fine Arts and Design';
            case 'CBA':
                return 'College Business Administration';
            default:
                return '';
        }
    };

    const filteredEvents = selectedDepartment === 'All'
        ? events
        : events.filter(event => event.department === selectedDepartment);

    const buildEventCardProps = (event) => {
        // Default eligible courses based on department or organization
        let defaultEligibleCourses = [];
        
        const department = event.department?.toLowerCase();
        const organization = event.organization?.toLowerCase();
        
        if (department === 'coe' || organization?.includes('engineering') || organization?.includes('cs') || organization?.includes('computer')) {
            defaultEligibleCourses = ['BSCS', 'BSIT', 'BSCpE', 'BSEE', 'BSECE'];
        } else if (department === 'cas') {
            defaultEligibleCourses = ['BSCS', 'BSIT', 'BSBio', 'BSPsych'];
        } else if (department === 'cba') {
            defaultEligibleCourses = ['BSBA', 'BSA'];
        } else if (department === 'cfad') {
            defaultEligibleCourses = ['BFA', 'BSID'];
        } else if (department === 'csc') {
            defaultEligibleCourses = ['All Courses'];
        } else {
            defaultEligibleCourses = ['All Courses'];
        }

        return {
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
            eligibleCourses: event.eligibleCourses || defaultEligibleCourses
        };
    };

    const recommendedEventIds = new Set(recommendedEvents.map((event) => event.id));
    const remainingEvents = filteredEvents.filter(event => !recommendedEventIds.has(event.id));

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
                    <OrganizationBar onSelectDepartment={setSelectedDepartment} />

                    <View style={styles.titleContainer}>
                        <Text style={styles.titleText}>{getOrganizationTitle()}</Text>
                        <View style={styles.underline} />
                    </View>

                    {recommendedEvents.length > 0 && (
                        <View style={styles.recommendedSection}>
                            <Text style={styles.recommendedTitle}>Recommended Events For You</Text>
                            {recommendedEvents.map((event) => (
                                <EventCard
                                    key={`recommended-${event.id}`}
                                    event={buildEventCardProps(event)}
                                    onApprove={() => openActionModal(event.id, 'Approved')}
                                    onReject={() => openActionModal(event.id, 'Rejected')}
                                />
                            ))}
                        </View>
                    )}

                    {remainingEvents.map((event) => (
                        <EventCard
                            key={event.id}
                            event={buildEventCardProps(event)}
                            onApprove={() => openActionModal(event.id, 'Approved')}
                            onReject={() => openActionModal(event.id, 'Rejected')}
                        />
                    ))}

                    <View style={{ flex: 1, backgroundColor: "#fff" }}>
                        <EventCalendar />
                    </View>

                </ScrollView>

                <BottomNavBar />
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
    recommendedSection: {
        marginBottom: 20,
    },
    recommendedTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#E50914',
        marginBottom: 10,
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
        marginBottom: 10,
        backgroundColor: '#E50914',
        borderRadius: 50,
        width: 50,
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
    },
    floatingButtonText: {
        color: 'white',
        fontSize: 30,
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
    cancelButton: {
        backgroundColor: '#ccc',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 5,
    },
    addButton: {
        backgroundColor: '#E50914',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 5,
    },
    buttonText: {
        color: 'white',
        fontWeight: 'bold',
    },
});
