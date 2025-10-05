import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView, Modal, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Header from '../components/header';
import BottomNavBar from '../components/bottomNavBar';
import OrganizationBar from '../components/organizationBar';
import OrganizationCard from '../components/organizationCard';
import { getOrganizations } from '../Backend/organizationHandler';
import { useEffect } from 'react';


export default function OrganizationPage() {
    useEffect(() => {
        const fetchOrganizations = async () => {
            try {
                const orgs = await getOrganizations();
                setOrganizations(orgs);
            } catch (error) {
                console.error('Error fetching organizations:', error);
            }
        };

        fetchOrganizations();
    }, []);

    const navigation = useNavigation();
    const [scrollY, setScrollY] = useState(0);
    const [organizations, setOrganizations] = useState([]);
    const [selectedDepartment, setSelectedDepartment] = useState('All');
    const [showRequirementsModal, setShowRequirementsModal] = useState(false);

    const getOrganizationTitle = () => {
        switch (selectedDepartment) {
            case 'All':
                return 'All Organizations';
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

    const requirements = [
        {
            title: "Minimum Members",
            description: "At least 15 active student members"
        },
        {
            title: "Constitution & By-Laws",
            description: "A complete organizational constitution and by-laws document"
        },
        {
            title: "Faculty Adviser",
            description: "Must have at least one faculty adviser from the university"
        },
        {
            title: "Mission & Vision",
            description: "Clear mission and vision statements aligned with university values"
        },
        {
            title: "Officers List",
            description: "Complete list of officers with their respective positions and student IDs"
        },
        {
            title: "Activity Plan",
            description: "Proposed activity plan for the academic year"
        },
        {
            title: "Registration Form",
            description: "Completed official student organization registration form"
        }
    ];

    const handleRegisterNavigation = () => {
        setShowRequirementsModal(false);
        navigation.navigate('RegisterOrganization');
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
                    showsVerticalScrollIndicator={false}
                >
                    <OrganizationBar onSelectDepartment={setSelectedDepartment} />
                    
                    <View style={styles.titleContainer}>
                        <Text style={styles.titleText}>{getOrganizationTitle()}</Text>
                        <View style={styles.underline} />
                    </View>

                    {organizations
                        .filter(org => selectedDepartment === 'All' || org.department === selectedDepartment)
                        .map(org => {
                            return (
                                <OrganizationCard
                                    key={org.id}
                                    orgName={org.orgName}
                                    memberCount={org.members.length}
                                    shortdesc={org.shortdesc}
                                    logo={org.logoBase64 || null}
                                />
                            );
                        })}

                    {/* Registration Section */}
                    <View style={styles.registerSection}>
                        <View style={styles.registerCard}>
                            <Text style={styles.registerTitle}>Start Your Own Organization</Text>
                            <Text style={styles.registerSubtitle}>
                                Have an idea for a new student organization?
                            </Text>
                            <TouchableOpacity 
                                style={styles.requirementsButton}
                                onPress={() => setShowRequirementsModal(true)}
                            >
                                <Text style={styles.requirementsButtonText}>
                                    View Registration Requirements
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>

                {/* Requirements Modal */}
                <Modal
                    visible={showRequirementsModal}
                    transparent={true}
                    animationType="fade"
                    onRequestClose={() => setShowRequirementsModal(false)}
                >
                    <View style={styles.modalBackground}>
                        <View style={styles.modalContainer}>
                            <ScrollView 
                                showsVerticalScrollIndicator={false}
                                style={styles.modalScroll}
                            >
                                <Text style={styles.modalTitle}>
                                    Organization Registration Requirements
                                </Text>
                                <Text style={styles.modalSubtitle}>
                                    Please ensure you meet all the following requirements before proceeding:
                                </Text>

                                {requirements.map((req, index) => (
                                    <View key={index} style={styles.requirementItem}>
                                        <View style={styles.requirementNumber}>
                                            <Text style={styles.requirementNumberText}>{index + 1}</Text>
                                        </View>
                                        <View style={styles.requirementContent}>
                                            <Text style={styles.requirementTitle}>{req.title}</Text>
                                            <Text style={styles.requirementDescription}>{req.description}</Text>
                                        </View>
                                    </View>
                                ))}

                                <View style={styles.noteContainer}>
                                    <Text style={styles.noteText}>
                                        Note: The registration process may take 2-4 weeks for review and approval.
                                    </Text>
                                </View>

                                <TouchableOpacity 
                                    style={styles.registerButton}
                                    onPress={handleRegisterNavigation}
                                >
                                    <Text style={styles.registerButtonText}>Proceed to Register</Text>
                                </TouchableOpacity>

                                <TouchableOpacity 
                                    style={styles.cancelButton}
                                    onPress={() => setShowRequirementsModal(false)}
                                >
                                    <Text style={styles.cancelButtonText}>Cancel</Text>
                                </TouchableOpacity>
                            </ScrollView>
                        </View>
                    </View>
                </Modal>

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
        paddingBottom: 20,
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
    // Registration Section Styles
    registerSection: {
        marginTop: 30,
        marginHorizontal: 20,
        marginBottom: 20,
    },
    registerCard: {
        backgroundColor: '#FFF5F5',
        borderRadius: 12,
        padding: 24,
        borderWidth: 1,
        borderColor: '#FFE0E0',
        alignItems: 'center',
    },
    registerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#E50914',
        marginBottom: 8,
        textAlign: 'center',
    },
    registerSubtitle: {
        fontSize: 14,
        color: '#666',
        marginBottom: 20,
        textAlign: 'center',
    },
    requirementsButton: {
        backgroundColor: '#E50914',
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderRadius: 8,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    requirementsButtonText: {
        color: 'white',
        fontSize: 15,
        fontWeight: '600',
    },
    // Modal Styles
    modalBackground: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContainer: {
        width: '90%',
        maxHeight: '85%',
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 20,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    modalScroll: {
        flexGrow: 1,
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 8,
        textAlign: 'center',
        color: '#E50914',
    },
    modalSubtitle: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        marginBottom: 20,
        lineHeight: 20,
    },
    requirementItem: {
        flexDirection: 'row',
        marginBottom: 20,
        alignItems: 'flex-start',
    },
    requirementNumber: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#E50914',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    requirementNumberText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 14,
    },
    requirementContent: {
        flex: 1,
        paddingTop: 2,
    },
    requirementTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: '#333',
        marginBottom: 4,
    },
    requirementDescription: {
        fontSize: 13,
        color: '#666',
        lineHeight: 18,
    },
    noteContainer: {
        backgroundColor: '#FFF9E6',
        borderLeftWidth: 4,
        borderLeftColor: '#FFB800',
        padding: 12,
        borderRadius: 6,
        marginTop: 10,
        marginBottom: 20,
    },
    noteText: {
        fontSize: 13,
        color: '#8B6E00',
        lineHeight: 18,
    },
    registerButton: {
        backgroundColor: '#E50914',
        padding: 16,
        borderRadius: 8,
        marginBottom: 12,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    registerButtonText: {
        color: 'white',
        textAlign: 'center',
        fontWeight: 'bold',
        fontSize: 16,
    },
    cancelButton: {
        padding: 12,
        marginBottom: 10,
    },
    cancelButtonText: {
        textAlign: 'center',
        color: '#E50914',
        fontSize: 15,
        fontWeight: '600',
    },
});