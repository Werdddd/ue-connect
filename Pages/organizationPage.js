import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, SafeAreaView, ScrollView, TouchableWithoutFeedback, Keyboard, KeyboardAvoidingView, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Header from '../components/header';
import BottomNavBar from '../components/bottomNavBar';
import OrganizationBar from '../components/organizationBar';
import OrganizationCard from '../components/organizationCard';

export default function OrganizationPage() {
    const navigation = useNavigation();
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
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <SafeAreaView style={styles.safeArea}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.container}
                >
                    <View style={styles.container}>
                        <Header />

                        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                            <OrganizationBar onSelectOrganization={setSelectedOrg} />

                            <View style={styles.titleContainer}>
                                <Text style={styles.titleText}>{getOrganizationTitle()}</Text>
                                <View style={styles.underline} />
                            </View>

                            <OrganizationCard />
                        </ScrollView>

                        <BottomNavBar />
                    </View>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </TouchableWithoutFeedback>
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
        marginTop: 10,
        marginHorizontal: 20,
        marginBottom: 10,
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
        width: '80%',
        marginTop: 2,
    },
});
