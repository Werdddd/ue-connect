import React, { useState } from 'react';
import {
    View, Text, TouchableOpacity, Keyboard,
    SafeAreaView, KeyboardAvoidingView, Platform, ScrollView, StyleSheet
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Header from '../components/header';
import BottomNavBar from '../components/bottomNavBar';
import OrganizationBar from '../components/organizationBar';
import EventCard from '../components/eventCard'; // <-- import EventCard

export default function Event() {
    const navigation = useNavigation();
    const [selectedOrg, setSelectedOrg] = useState('All');
    const [scrollY, setScrollY] = useState(0);
    const getOrganizationTitle = () => {
        switch (selectedOrg) {
            case 'All':
                return 'All Events';
            case 'CSC':
                return 'Central Student Council';
            case 'GDSC':
                return 'Google Developer Student Clubs';
            case 'CFAD':
                return 'College of Fine Arts and Science';
            default:
                return '';
        }
    };

    const events = [
        {
            id: '1',
            org: 'CSC',
            banner: require('../assets/enTramurals.png'), // your actual banner
            seal: require('../assets/cscLogo.png'),
            title: 'ENtramurals 2025',
            date: 'February 14-15, 2025',
            time: '8:00 AM - 5:00 PM',
            location: 'UE Caloocan Campus',
            participants: '170 Students',
            description: 'The annual Intramurals of the College of Engineering with both Physical Sports and E-Sports.',
        },
        {
            id: '2',
            org: 'GDSC',
            banner: require('../assets/enTramurals.png'),
            seal: require('../assets/cscLogo.png'),
            title: 'Leadership Summit',
            date: 'March 3, 2025',
            description: 'A gathering of student leaders to foster leadership and camaraderie.',
        },
        // Add more events if needed
    ];

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

                        {/* Render Event Cards */}
                        {filteredEvents.map((event) => (
                            <EventCard key={event.id} event={event} />
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
        height: 1,
        backgroundColor: '#E50914',
        width: '100%',
        marginTop: 2,
    },
});
