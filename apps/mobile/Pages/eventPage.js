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

export default function Event() {
    const [selectedOrg, setSelectedOrg] = useState('All');
    const [scrollY, setScrollY] = useState(0);
    const [events, setEvents] = useState([]);
    useEffect(() => {
        loadEvents();
    }, []);

    const loadEvents = async () => {
        try {
            const data = await fetchEvents();
    
            const visibleEvents = data.filter(event => {
                const status = event.status?.toLowerCase();
                return status === 'approved' || status === 'finished';
            });
    
            setEvents(visibleEvents);
        } catch (error) {
            console.error('Failed to load events:', error);
        }
    };
    
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


                    {filteredEvents.map((event) => (
                        <EventCard
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
                                status: event.status
                            }}
                            onApprove={() => openActionModal(event.id, 'Approved')}
                            onReject={() => openActionModal(event.id, 'Rejected')}
                        />
                    ))}

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
