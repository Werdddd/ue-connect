import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView, Modal, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Header from '../components/header';
import BottomNavBar from '../components/bottomNavBar';
import OrganizationBar from '../components/organizationBar';
import OrganizationCard from '../components/organizationCard';
import { addOrganization, getOrganizations } from '../Backend/organizationHandler'; 
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
    const [isModalVisible, setModalVisible] = useState(false);
    const [newOrg, setNewOrg] = useState({
        org: '',
        orgName: '',
        memberCount: '',
        description: '',
    });
    const [organizations, setOrganizations] = useState([]);

    const [selectedOrg, setSelectedOrg] = useState('All');

    const handleAddOrganization = async () => {
        try {
            const newOrgData = {
                org: newOrg.org,
                orgName: newOrg.orgName,
                memberCount: parseInt(newOrg.memberCount),
                description: newOrg.description,
                logo: require('../assets/cscLogo.png'),
            };

            await addOrganization(newOrgData);

            setOrganizations(prevOrgs => [
                ...prevOrgs,
                { id: prevOrgs.length + 1, ...newOrgData }
            ]);

            setNewOrg({ org: '', orgName: '', memberCount: '', description: '' });
            setModalVisible(false);

        } catch (error) {
            console.error('Error adding organization:', error);
        }
    };

    const getOrganizationTitle = () => {
        switch (selectedOrg) {
            case 'All':
                return 'All Organizations';
            case 'CSC':
                return 'Central Student Council';
            case 'GDSC':
                return 'Google Developer Student Clubs';
            case 'CFAD':
                return 'College of Fine Arts and Design';
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
                    showsVerticalScrollIndicator={false}
                >
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

                    <TouchableOpacity
                        style={styles.plusButton}
                        onPress={() => setModalVisible(true)}
                    >
                        <Text style={styles.plusText}>＋</Text>
                    </TouchableOpacity>

                    <Modal
                        animationType="slide"
                        transparent={true}
                        visible={isModalVisible}
                        onRequestClose={() => setModalVisible(false)}
                    >
                        <View style={styles.modalBackground}>
                            <View style={styles.modalContainer}>
                                <Text style={styles.modalTitle}>Add New Organization</Text>

                                <TextInput
                                    placeholder="Org Short Name (e.g. CSC)"
                                    style={styles.input}
                                    value={newOrg.org}
                                    onChangeText={(text) => setNewOrg({ ...newOrg, org: text })}
                                />
                                <TextInput
                                    placeholder="Full Organization Name"
                                    style={styles.input}
                                    value={newOrg.orgName}
                                    onChangeText={(text) => setNewOrg({ ...newOrg, orgName: text })}
                                />
                                <TextInput
                                    placeholder="Member Count"
                                    style={styles.input}
                                    keyboardType="numeric"
                                    value={newOrg.memberCount}
                                    onChangeText={(text) => setNewOrg({ ...newOrg, memberCount: text })}
                                />
                                <TextInput
                                    placeholder="Description"
                                    style={[styles.input, { height: 80 }]}
                                    multiline
                                    value={newOrg.description}
                                    onChangeText={(text) => setNewOrg({ ...newOrg, description: text })}
                                />

                                <TouchableOpacity style={styles.addButton} onPress={handleAddOrganization}>
                                    <Text style={styles.addButtonText}>Add Organization</Text>
                                </TouchableOpacity>

                                <TouchableOpacity style={styles.cancelButton} onPress={() => setModalVisible(false)}>
                                    <Text style={styles.cancelButtonText}>Cancel</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </Modal>
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
    plusButton: {
        alignSelf: 'center',
        marginVertical: 20,
        backgroundColor: '#E50914',
        borderRadius: 50,
        width: 50,
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
    },
    plusText: {
        color: 'white',
        fontSize: 30,
    },
    modalBackground: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContainer: {
        width: '85%',
        backgroundColor: 'white',
        borderRadius: 10,
        padding: 20,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
        textAlign: 'center',
    },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,
        padding: 10,
        marginVertical: 5,
    },
    addButton: {
        backgroundColor: '#E50914',
        padding: 12,
        borderRadius: 5,
        marginTop: 10,
    },
    addButtonText: {
        color: 'white',
        textAlign: 'center',
        fontWeight: 'bold',
    },
    cancelButton: {
        padding: 10,
        marginTop: 10,
    },
    cancelButtonText: {
        textAlign: 'center',
        color: '#E50914',
    },
});
