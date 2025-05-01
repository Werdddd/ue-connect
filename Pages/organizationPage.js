import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView, Modal, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Header from '../components/header';
import BottomNavBar from '../components/bottomNavBar';
import OrganizationBar from '../components/organizationBar';
import OrganizationCard from '../components/organizationCard';
import { addOrganization, getOrganizations } from '../Backend/organizationHandler';
import { useEffect } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'react-native';
import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';

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
        department: '',
        orgName: '',
        memberCount: '',
        members: '',
        shortdesc: '',
        logoUri: '',
        logoBase64: '',
        fulldesc: '',
        followers: '',
        location: '',
        email: '',
        websitelink: '',
    });
    const [organizations, setOrganizations] = useState([]);

    const [selectedDepartment, setSelectedDepartment] = useState('All');

    async function getBase64(uri) {
        const base64 = await FileSystem.readAsStringAsync(uri, {
            encoding: FileSystem.EncodingType.Base64,
        });
        return base64;
    }

    async function compressImage(uri) {
        const compressed = await ImageManipulator.manipulateAsync(
            uri,
            [{ resize: { width: 100 } }],
            { compress: 0.3, format: ImageManipulator.SaveFormat.JPEG }
        );
        return compressed.uri;
    }

    async function pickImage() {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 1,
        });

        if (!result.canceled) {
            const asset = result.assets[0];
            const base64 = await processImage(asset.uri);
            setNewOrg(prev => ({
                ...prev,
                logoUri: asset.uri,
                logoBase64: `data:image/jpeg;base64,${base64}`,
            }));
        }
    }

    async function processImage(uri) {
        const compressedUri = await compressImage(uri);
        const base64 = await getBase64(compressedUri);
        return base64;
    }

    const handleAddOrganization = async () => {
        try {
            const newOrgData = {
                department: newOrg.department,
                orgName: newOrg.orgName,
                memberCount: parseInt(0),
                shortdesc: newOrg.shortdesc,
                logoUri: newOrg.logoUri,
                logoBase64: newOrg.logoBase64,
                fulldesc: newOrg.fulldesc,
                location: newOrg.location,
                email: newOrg.email,
                websitelink: newOrg.websitelink,
                members: '',
                followers: ''
            };

            await addOrganization(newOrgData);

            setOrganizations(prevOrgs => [
                ...prevOrgs,
                { id: prevOrgs.length + 1, ...newOrgData }
            ]);

            setNewOrg({ department: '', orgName: '', memberCount: '', shortdesc: '', logoUri: '', logoBase64: '', fulldesc: '', location: '', email: '', websitelink: '' , members: '', followers: ''});
            setModalVisible(false);

        } catch (error) {
            console.error('Error adding organization:', error);
        }
    };


    const getOrganizationTitle = () => {
        switch (selectedDepartment) {
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
                                    logo={org.logoBase64}
                                />
                            );
                        })}
                    
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
                                    placeholder="Organization Department (e.g. CSC)"
                                    style={styles.input}
                                    value={newOrg.department}
                                    onChangeText={(text) => setNewOrg({ ...newOrg, department: text })}
                                />
                                <TextInput
                                    placeholder="Full Organization Name"
                                    style={styles.input}
                                    value={newOrg.orgName}
                                    onChangeText={(text) => setNewOrg({ ...newOrg, orgName: text })}
                                />

                                <TextInput
                                    placeholder="Short Description"
                                    style={[styles.input, { height: 40 }]}
                                    multiline
                                    value={newOrg.shortdesc}
                                    onChangeText={(text) => setNewOrg({ ...newOrg, shortdesc: text })}
                                />

                                <TextInput
                                    placeholder="Full Description"
                                    style={[styles.input, { height: 80 }]}
                                    multiline
                                    value={newOrg.fulldesc}
                                    onChangeText={(text) => setNewOrg({ ...newOrg, fulldesc: text })}
                                />

                                <TextInput
                                    placeholder="Location (e.g. 2nd Floor, Main Building)"
                                    style={[styles.input, { height: 40 }]}
                                    multiline
                                    value={newOrg.location}
                                    onChangeText={(text) => setNewOrg({ ...newOrg, location: text })}
                                />
                                
                                <TextInput
                                    placeholder="Email"
                                    style={[styles.input, { height: 40 }]}
                                    multiline
                                    value={newOrg.email}
                                    onChangeText={(text) => setNewOrg({ ...newOrg, email: text })}
                                />

                                <TextInput
                                    placeholder="Website (Optional)"
                                    style={[styles.input, { height: 40 }]}
                                    multiline
                                    value={newOrg.websitelink}
                                    onChangeText={(text) => setNewOrg({ ...newOrg, websitelink: text })}
                                />

                                <TouchableOpacity style={styles.pickImageButton} onPress={pickImage}>
                                    <Text style={styles.pickImageButtonText}>Pick Logo</Text>
                                </TouchableOpacity>
                                {(newOrg.logoUri || newOrg.logoBase64) && (
                                    <Image
                                        source={{ uri: newOrg.logoBase64 || newOrg.logoUri }}
                                        style={{ width: 50, height: 50, marginVertical: 10, alignSelf: 'center' }}
                                        resizeMode="contain"
                                    />
                                )}
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
