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
import { fetchEvents, addEvent } from '../Backend/eventPage'; // <-- import backend fetcher

export default function Event() {
    const navigation = useNavigation();
    const [selectedOrg, setSelectedOrg] = useState('All');
    const [scrollY, setScrollY] = useState(0);
    const [events, setEvents] = useState([]);
    const [isModalVisible, setIsModalVisible] = useState(false);

    // Inputs for new event
    const [newTitle, setNewTitle] = useState('');
    const [newDescription, setNewDescription] = useState('');
    const [newDate, setNewDate] = useState('');
    const [newTime, setNewTime] = useState('');
    const [newLocation, setNewLocation] = useState('');
    const [newParticipants, setNewParticipants] = useState('');
    const [organization, setOrganization] = useState('');  // Default organization (this would come from logged-in data)

    useEffect(() => {
        loadEvents();
    }, []);

    const loadEvents = async () => {
        try {
            const data = await fetchEvents();
            setEvents(data);
        } catch (error) {
            console.error('Failed to load events:', error);
        }
    };

    const handleAddEvent = async () => {
        if (!newTitle || !newDescription || !newDate || !newTime || !newLocation || !newParticipants) {
            alert('Please fill out all fields!');
            return;
        }

        // Parsing participants to integer
        const participants = parseInt(newParticipants, 10);
        if (isNaN(participants)) {
            alert('Please enter a valid number for participants!');
            return;
        }

        const newEvent = {
            title: newTitle,
            description: newDescription,
            date: newDate,
            time: newTime,
            location: newLocation,
            participants: participants,
            org: organization,  // From the logged-in organization
        };

        try {
            await addEvent(newEvent);
            await loadEvents(); // refresh events after adding
            setIsModalVisible(false); // close modal
            // Clear inputs
            setNewTitle('');
            setNewDescription('');
            setNewDate('');
            setNewTime('');
            setNewLocation('');
            setNewParticipants('');
        } catch (error) {
            console.error('Error adding event:', error);
        }
    };

    const getOrganizationTitle = () => {
        switch (selectedOrg) {
            case 'All': return 'All Events';
            case 'CSC': return 'Central Student Council';
            case 'GDSC': return 'Google Developer Student Clubs';
            case 'CFAD': return 'College of Fine Arts and Science';
            default: return '';
        }
    };

    const filteredEvents = selectedOrg === 'All'
        ? events
        : events.filter(event => event.org === selectedOrg);

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
                    <OrganizationBar onSelectOrganization={setSelectedOrg} />

                    <View style={styles.titleContainer}>
                        <Text style={styles.titleText}>{getOrganizationTitle()}</Text>
                        <View style={styles.underline} />
                    </View>
                    <TouchableOpacity
                        style={styles.floatingButton}
                        onPress={() => setIsModalVisible(true)}
                    >
                        <Text style={styles.floatingButtonText}>+</Text>
                    </TouchableOpacity>

                    {filteredEvents.map((event) => (
                        <EventCard key={event.id} event={event} />
                    ))}
                    
                </ScrollView>
                
                <BottomNavBar />

                {/* Modal for Adding Event */}
                <Modal
                    animationType="slide"
                    transparent={true}
                    visible={isModalVisible}
                    onRequestClose={() => setIsModalVisible(false)}
                >
                    <View style={styles.modalContainer}>
                        <View style={styles.modalContent}>
                            <Text style={styles.modalTitle}>Add Event</Text>
                            <Text style={styles.label}>Event Title</Text>
                            <TextInput
                                placeholder="ENtramurals 2025"
                                placeholderTextColor="#555" 
                                style={styles.input}
                                value={newTitle}
                                onChangeText={setNewTitle}
                            />
                            <Text style={styles.label}>Event Description</Text>
                            <TextInput
                                placeholder="An event of..."
                                placeholderTextColor="#555" 
                                style={styles.input}
                                value={newDescription}
                                onChangeText={setNewDescription}
                            />
                            <Text style={styles.label}>Event Date</Text>
                            <TextInput
                                placeholder="April 25, 2025"
                                placeholderTextColor="#555" 
                                style={styles.input}
                                value={newDate}
                                onChangeText={setNewDate}
                            />
                            <Text style={styles.label}>Event Time</Text>
                            <TextInput
                                placeholder="8:00 AM - 12:00 PM"
                                placeholderTextColor="#555" 
                                style={styles.input}
                                value={newTime}
                                onChangeText={setNewTime}
                            />
                            <Text style={styles.label}>Event Location</Text>
                            <TextInput
                                placeholder="MPH 2, Engineering Building"
                                placeholderTextColor="#555" 
                                style={styles.input}
                                value={newLocation}
                                onChangeText={setNewLocation}
                            />
                            <Text style={styles.label}>Event Participants</Text>
                            <TextInput
                                placeholder="100"
                                placeholderTextColor="#555" 
                                style={styles.input}
                                keyboardType="numeric"
                                value={newParticipants}
                                onChangeText={setNewParticipants}
                            />

                            <View style={styles.modalButtons}>
                                <TouchableOpacity
                                    style={styles.cancelButton}
                                    onPress={() => setIsModalVisible(false)}
                                >
                                    <Text style={styles.buttonText}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.addButton}
                                    onPress={handleAddEvent}
                                >
                                    <Text style={styles.buttonText}>Add</Text>
                                </TouchableOpacity>
                            </View>
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
        height: 1,
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
