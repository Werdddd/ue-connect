import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, SafeAreaView, ScrollView, TouchableWithoutFeedback, Keyboard, KeyboardAvoidingView, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Header from '../components/header';
import BottomNavBar from '../components/bottomNavBar';
import OrganizationBar from '../components/organizationBar';
import OrganizationCard from '../components/organizationCard';

export default function OrganizationPage() {
    const navigation = useNavigation();
    const [scrollY, setScrollY] = useState(0);
    const organizations = [
        {
            id: 1,
            org: 'GDSC',
            orgName: 'Google Developer Student Clubs',
            memberCount: 230,
            description: 'A student-led technology organization and a proud member of a global community',
            logo: require('../assets/cscLogo.png'),
        },
        {
            id: 2,
            org: 'CSC',
            orgName: 'Central Student Council',
            memberCount: 120,
            description: 'The highest student governing body promoting student welfare.',
            logo: require('../assets/cscLogo.png'),
        },
        {
            id: 3,
            org: 'CFAD',
            orgName: 'College of Fine Arts and Design',
            memberCount: 95,
            description: 'An organization for students passionate about arts and design.',
            logo: require('../assets/cscLogo.png'),
        },
        {
            id: 4,
            org: 'CFAD',
            orgName: 'College of Fine Arts and Design',
            memberCount: 95,
            description: 'An organization for students passionate about arts and design.',
            logo: require('../assets/cscLogo.png'),
        },
        {
            id: 5,
            org: 'CFAD',
            orgName: 'College of Fine Arts and Design',
            memberCount: 95,
            description: 'An organization for students passionate about arts and design.',
            logo: require('../assets/cscLogo.png'),
        },
    ];


    const [selectedOrg, setSelectedOrg] = useState('All');

    const getOrganizationTitle = () => {
        switch (selectedOrg) {
            case 'All':
                return 'All Organizations';
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

                        {organizations
                            .filter(org => selectedOrg === 'All' || org.org === selectedOrg)
                            .map(org => (
                                <OrganizationCard
                                    key={org.id}
                                    orgName={org.orgName}
                                    memberCount={org.memberCount}
                                    description={org.description}
                                    logo={org.logo}
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
