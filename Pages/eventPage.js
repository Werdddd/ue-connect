import React, { useState, useEffect } from 'react';
import {
    View, Text, TouchableOpacity, Keyboard,
    SafeAreaView, KeyboardAvoidingView, Platform, ScrollView, StyleSheet
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Header from '../components/header';
import BottomNavBar from '../components/bottomNavBar';
import OrganizationBar from '../components/organizationBar';
import EventCard from '../components/eventCard';
import { fetchEvents } from '../Backend/eventPage'; // <-- import backend fetcher

export default function Event() {
    const navigation = useNavigation();
    const [selectedOrg, setSelectedOrg] = useState('All');
    const [scrollY, setScrollY] = useState(0);
    const [events, setEvents] = useState([]);

    useEffect(() => {
        const loadEvents = async () => {
            try {
                const data = await fetchEvents();
                setEvents(data);
            } catch (error) {
                console.error('Failed to load events:', error);
            }
        };
        loadEvents();
    }, []);

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

                    {filteredEvents.map((event) => (
                        <EventCard key={event.id} event={event} />
                    ))}
                </ScrollView>
                <BottomNavBar />
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

// (Your styles remain the same)


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
});
