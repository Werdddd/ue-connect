import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableWithoutFeedback, Keyboard, KeyboardAvoidingView, Platform, TouchableOpacity, Image, Modal, TextInput } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { collection, query, where, getDocs, doc, updateDoc, arrayRemove, arrayUnion } from 'firebase/firestore';
import { firestore } from '../Firebase';
import Header from '../components/header';
import BottomNavBar from '../components/bottomNavBar';

export default function OrganizationPageRSO() {
    const navigation = useNavigation();
    const route = useRoute();
    const { org } = route.params;
    const orgName = org;

    const [appliedUsers, setAppliedUsers] = useState([]);
    const [memberUsers, setMemberUsers] = useState([]);
    const [officerUsers, setOfficerUsers] = useState([]);
    const [showPositionModal, setShowPositionModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [positionInput, setPositionInput] = useState('');

    useEffect(() => {
        fetchUsers();
    }, [orgName]);

    const fetchUsers = async () => {
        try {
            const orgQuery = query(collection(firestore, 'organizations'), where('orgName', '==', orgName));
            const orgSnapshot = await getDocs(orgQuery);

            if (!orgSnapshot.empty) {
                const orgData = orgSnapshot.docs[0].data();
                const applicantEmails = orgData.applicants || [];
                const memberEmails = orgData.members || [];
                const officers = orgData.officers || [];

                const usersSnapshot = await getDocs(collection(firestore, 'Users'));
                const allUsers = usersSnapshot.docs.map(doc => doc.data());

                const appliedList = allUsers.filter(user => applicantEmails.includes(user.email));
                const memberList = allUsers.filter(user => 
                    memberEmails.includes(user.email) && 
                    !officers.some(officer => officer.email === user.email)
                );
                
                const officerList = officers.map(officer => {
                    const userData = allUsers.find(user => user.email === officer.email);
                    return userData ? { ...userData, position: officer.position } : null;
                }).filter(officer => officer !== null);

                setAppliedUsers(appliedList);
                setMemberUsers(memberList);
                setOfficerUsers(officerList);
            }
        } catch (error) {
            console.error('Error fetching users:', error);
        }
    };

    const handleApprove = async (email) => {
        try {
            const orgQuery = query(collection(firestore, 'organizations'), where('orgName', '==', orgName));
            const orgSnapshot = await getDocs(orgQuery);

            if (!orgSnapshot.empty) {
                const orgRef = orgSnapshot.docs[0].ref;

                await updateDoc(orgRef, {
                    applicants: arrayRemove(email),
                    members: arrayUnion(email),
                });

                const userRef = doc(firestore, 'Users', email);

                try {
                    await updateDoc(userRef, {
                        orgs: arrayUnion(orgName)
                    });
                } catch (error) {
                    console.error("Error adding orgName to user:", error);
                }

                fetchUsers();
            }
        } catch (error) {
            console.error('Error approving user:', error);
        }
    };

    const handleDeny = async (email) => {
        try {
            const orgQuery = query(collection(firestore, 'organizations'), where('orgName', '==', orgName));
            const orgSnapshot = await getDocs(orgQuery);

            if (!orgSnapshot.empty) {
                const orgRef = orgSnapshot.docs[0].ref;

                await updateDoc(orgRef, {
                    applicants: arrayRemove(email),
                });

                fetchUsers();
            }
        } catch (error) {
            console.error('Error denying user:', error);
        }
    };

    const handleRemove = async (email) => {
        try {
            const orgQuery = query(collection(firestore, 'organizations'), where('orgName', '==', orgName));
            const orgSnapshot = await getDocs(orgQuery);

            if (!orgSnapshot.empty) {
                const orgRef = orgSnapshot.docs[0].ref;

                await updateDoc(orgRef, {
                    members: arrayRemove(email),
                });

                const userRef = doc(firestore, 'Users', email);
               
                try {
                    await updateDoc(userRef, {
                        orgs: arrayRemove(orgName),
                    });
                } catch (error) {
                    console.error("Error removing orgName from user:", error);
                }

                fetchUsers();
            }
        } catch (error) {
            console.error('Error removing user:', error);
        }
    };

    const handleAssignOfficer = (user) => {
        setSelectedUser(user);
        setPositionInput('');
        setShowPositionModal(true);
    };

    const handleConfirmAssignOfficer = async () => {
        if (!positionInput.trim() || !selectedUser) return;

        try {
            const orgQuery = query(collection(firestore, 'organizations'), where('orgName', '==', orgName));
            const orgSnapshot = await getDocs(orgQuery);

            if (!orgSnapshot.empty) {
                const orgRef = orgSnapshot.docs[0].ref;
                const orgData = orgSnapshot.docs[0].data();
                const officers = orgData.officers || [];

                // Add to officers array
                const newOfficer = {
                    email: selectedUser.email,
                    position: positionInput.trim()
                };

                await updateDoc(orgRef, {
                    officers: [...officers, newOfficer],
                    members: arrayRemove(selectedUser.email)
                });

                setShowPositionModal(false);
                setSelectedUser(null);
                setPositionInput('');
                fetchUsers();
            }
        } catch (error) {
            console.error('Error assigning officer:', error);
        }
    };

    const handleRemoveOfficer = async (email) => {
        try {
            const orgQuery = query(collection(firestore, 'organizations'), where('orgName', '==', orgName));
            const orgSnapshot = await getDocs(orgQuery);

            if (!orgSnapshot.empty) {
                const orgRef = orgSnapshot.docs[0].ref;
                const orgData = orgSnapshot.docs[0].data();
                const officers = orgData.officers || [];

                // Remove from officers and add back to members
                const updatedOfficers = officers.filter(officer => officer.email !== email);

                await updateDoc(orgRef, {
                    officers: updatedOfficers,
                    members: arrayUnion(email)
                });

                fetchUsers();
            }
        } catch (error) {
            console.error('Error removing officer:', error);
        }
    };

    const UserCard = ({ user, type }) => (
        <View style={styles.userCard}>
            <View style={styles.cardHeader}>
                <View style={styles.profileSection}>
                    <Image 
                        source={user.profileImage ? { uri: user.profileImage } : require('../assets/default_profile.png')}
                        style={styles.profileImage}
                    />
                    <View style={styles.nameSection}>
                        <Text style={styles.userName}>{user.firstName} {user.lastName}</Text>
                        <Text style={styles.userEmail}>{user.email}</Text>
                        {type === 'officer' && user.position && (
                            <View style={styles.positionBadge}>
                                <Text style={styles.positionText}>{user.position}</Text>
                            </View>
                        )}
                    </View>
                </View>
                {type === 'applicant' && (
                    <View style={styles.pendingBadge}>
                        <Text style={styles.pendingText}>Pending</Text>
                    </View>
                )}
            </View>

            <View style={styles.divider} />

            <View style={styles.infoGrid}>
                <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Student No.</Text>
                    <Text style={styles.infoValue}>{user.studentNumber}</Text>
                </View>
                <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Course</Text>
                    <Text style={styles.infoValue}>{user.Course}</Text>
                </View>
                <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Year Level</Text>
                    <Text style={styles.infoValue}>{user.Year}</Text>
                </View>
            </View>

            <View style={styles.actionButtons}>
                {type === 'member' ? (
                    <>
                        <TouchableOpacity 
                            style={[styles.actionBtn, styles.assignBtn]} 
                            onPress={() => handleAssignOfficer(user)}
                        >
                            <Text style={styles.actionBtnText}>Assign as Officer</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                            style={[styles.actionBtn, styles.removeBtn]} 
                            onPress={() => handleRemove(user.email)}
                        >
                            <Text style={styles.actionBtnText}>Remove</Text>
                        </TouchableOpacity>
                    </>
                ) : type === 'officer' ? (
                    <TouchableOpacity 
                        style={[styles.actionBtn, styles.removeBtn]} 
                        onPress={() => handleRemoveOfficer(user.email)}
                    >
                        <Text style={styles.actionBtnText}>Remove from Officers</Text>
                    </TouchableOpacity>
                ) : (
                    <>
                        <TouchableOpacity 
                            style={[styles.actionBtn, styles.approveBtn]} 
                            onPress={() => handleApprove(user.email)}
                        >
                            <Text style={styles.actionBtnText}>✓ Approve</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                            style={[styles.actionBtn, styles.denyBtn]} 
                            onPress={() => handleDeny(user.email)}
                        >
                            <Text style={styles.actionBtnText}>✕ Deny</Text>
                        </TouchableOpacity>
                    </>
                )}
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.safeArea}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
                <View style={styles.container}>
                    <Header />
                    <ScrollView 
                        style={styles.scrollView}
                        contentContainerStyle={styles.scrollContent} 
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                    >
                        {/* Organization Header */}
                        <View style={styles.orgHeader}>
                            <Text style={styles.orgName}>{orgName}</Text>
                            <View style={styles.statsContainer}>
                                <View style={styles.statBox}>
                                    <Text style={styles.statNumber}>{officerUsers.length}</Text>
                                    <Text style={styles.statLabel}>Officers</Text>
                                </View>
                                <View style={styles.statBox}>
                                    <Text style={styles.statNumber}>{memberUsers.length}</Text>
                                    <Text style={styles.statLabel}>Members</Text>
                                </View>
                                <View style={styles.statBox}>
                                    <Text style={styles.statNumber}>{appliedUsers.length}</Text>
                                    <Text style={styles.statLabel}>Pending</Text>
                                </View>
                            </View>
                        </View>

                        {/* Applicants Section */}
                        {appliedUsers.length > 0 && (
                            <View style={styles.section}>
                                <View style={styles.sectionHeader}>
                                    <Text style={styles.sectionTitle}>Pending Applications</Text>
                                    <View style={styles.countBadge}>
                                        <Text style={styles.countText}>{appliedUsers.length}</Text>
                                    </View>
                                </View>
                                {appliedUsers.map((user, index) => (
                                    <UserCard key={index} user={user} type="applicant" />
                                ))}
                            </View>
                        )}

                        {/* Officers Section */}
                        <View style={styles.section}>
                            <View style={styles.sectionHeader}>
                                <Text style={styles.sectionTitle}>Officers</Text>
                                <View style={[styles.countBadge, styles.officerBadge]}>
                                    <Text style={styles.countText}>{officerUsers.length}</Text>
                                </View>
                            </View>
                            {officerUsers.length > 0 ? (
                                officerUsers.map((user, index) => (
                                    <UserCard key={index} user={user} type="officer" />
                                ))
                            ) : (
                                <View style={styles.emptyState}>
                                    <Text style={styles.emptyText}>No officers assigned yet</Text>
                                </View>
                            )}
                        </View>

                        {/* Members Section */}
                        <View style={styles.section}>
                            <View style={styles.sectionHeader}>
                                <Text style={styles.sectionTitle}>Members</Text>
                                <View style={styles.countBadge}>
                                    <Text style={styles.countText}>{memberUsers.length}</Text>
                                </View>
                            </View>
                            {memberUsers.length > 0 ? (
                                memberUsers.map((user, index) => (
                                    <UserCard key={index} user={user} type="member" />
                                ))
                            ) : (
                                <View style={styles.emptyState}>
                                    <Text style={styles.emptyText}>No members yet</Text>
                                </View>
                            )}
                        </View>
                    </ScrollView>
                    <BottomNavBar />
                </View>

                {/* Position Assignment Modal */}
                <Modal
                    visible={showPositionModal}
                    transparent={true}
                    animationType="fade"
                    onRequestClose={() => setShowPositionModal(false)}
                >
                    <TouchableWithoutFeedback onPress={() => setShowPositionModal(false)}>
                        <View style={styles.modalOverlay}>
                            <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
                                <View style={styles.modalContent}>
                                    <Text style={styles.modalTitle}>Assign Officer Position</Text>
                                    {selectedUser && (
                                        <Text style={styles.modalSubtitle}>
                                            {selectedUser.firstName} {selectedUser.lastName}
                                        </Text>
                                    )}
                                    
                                    <TextInput
                                        style={styles.positionInput}
                                        placeholder="Enter position (e.g., President, Vice President)"
                                        value={positionInput}
                                        onChangeText={setPositionInput}
                                        autoFocus
                                    />

                                    <View style={styles.modalButtons}>
                                        <TouchableOpacity
                                            style={[styles.modalBtn, styles.cancelBtn]}
                                            onPress={() => setShowPositionModal(false)}
                                        >
                                            <Text style={styles.modalBtnText}>Cancel</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={[styles.modalBtn, styles.confirmBtn]}
                                            onPress={handleConfirmAssignOfficer}
                                        >
                                            <Text style={styles.modalBtnText}>Confirm</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </TouchableWithoutFeedback>
                        </View>
                    </TouchableWithoutFeedback>
                </Modal>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#ffffff',
    },
    container: {
        flex: 1,
        backgroundColor: '#ffffff',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 16,
        paddingBottom: 100,
    },
    orgHeader: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        marginTop: 16,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#e0e0e0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 3,
    },
    orgName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1a1a1a',
        marginBottom: 16,
    },
    statsContainer: {
        flexDirection: 'row',
        gap: 12,
    },
    statBox: {
        flex: 1,
        backgroundColor: '#f8f9fa',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
    },
    statNumber: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#1E88E5',
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 13,
        color: '#666',
        fontWeight: '600',
    },
    section: {
        marginBottom: 24,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1a1a1a',
    },
    countBadge: {
        backgroundColor: '#1E88E5',
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 4,
        minWidth: 28,
        alignItems: 'center',
    },
    officerBadge: {
        backgroundColor: '#1E88E5',
    },
    countText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
    },
    userCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#e0e0e0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 3,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    profileSection: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    profileImage: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#e0e0e0',
        marginRight: 12,
    },
    nameSection: {
        flex: 1,
    },
    userName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1a1a1a',
        marginBottom: 4,
    },
    userEmail: {
        fontSize: 13,
        color: '#666',
        marginBottom: 4,
    },
    positionBadge: {
        backgroundColor: '#E8EAF6',
        borderRadius: 6,
        paddingHorizontal: 8,
        paddingVertical: 3,
        alignSelf: 'flex-start',
        marginTop: 4,
    },
    positionText: {
        color: '#1E88E5',
        fontSize: 12,
        fontWeight: '700',
    },
    pendingBadge: {
        backgroundColor: '#FFF3E0',
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 4,
    },
    pendingText: {
        color: '#F57C00',
        fontSize: 12,
        fontWeight: '600',
    },
    divider: {
        height: 1,
        backgroundColor: '#e0e0e0',
        marginVertical: 12,
    },
    infoGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 16,
    },
    infoItem: {
        flex: 1,
        minWidth: '45%',
        backgroundColor: '#f8f9fa',
        borderRadius: 10,
        padding: 12,
    },
    infoLabel: {
        fontSize: 12,
        color: '#666',
        marginBottom: 4,
        fontWeight: '600',
    },
    infoValue: {
        fontSize: 15,
        color: '#1a1a1a',
        fontWeight: '700',
    },
    actionButtons: {
        flexDirection: 'row',
        gap: 8,
    },
    actionBtn: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    approveBtn: {
        backgroundColor: '#4CAF50',
    },
    denyBtn: {
        backgroundColor: '#F44336',
    },
    removeBtn: {
        backgroundColor: '#F44336',
    },
    assignBtn: {
        backgroundColor: '#34A853',
    },
    actionBtnText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: 'bold',
    },
    emptyState: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 40,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    emptyText: {
        fontSize: 16,
        color: '#999',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 24,
        width: '85%',
        maxWidth: 400,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1a1a1a',
        marginBottom: 8,
        textAlign: 'center',
    },
    modalSubtitle: {
        fontSize: 16,
        color: '#666',
        marginBottom: 20,
        textAlign: 'center',
    },
    positionInput: {
        borderWidth: 1,
        borderColor: '#e0e0e0',
        borderRadius: 12,
        padding: 12,
        fontSize: 16,
        marginBottom: 20,
        backgroundColor: '#f8f9fa',
    },
    modalButtons: {
        flexDirection: 'row',
        gap: 12,
    },
    modalBtn: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
    },
    cancelBtn: {
        backgroundColor: '#e0e0e0',
    },
    confirmBtn: {
        backgroundColor: '#34A853',
    },
    modalBtnText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#fff',
    },
});