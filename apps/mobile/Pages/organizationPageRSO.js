import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableWithoutFeedback, Keyboard, KeyboardAvoidingView, Platform, TouchableOpacity, Image, Modal, TextInput, Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { collection, query, where, getDocs, doc, updateDoc, arrayRemove, arrayUnion, addDoc, serverTimestamp } from 'firebase/firestore';
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
    const [showRemarkModal, setShowRemarkModal] = useState(false);
    const [showMembershipRenewalModal, setShowMembershipRenewalModal] = useState(false);
    const [showRemoveAllModal, setShowRemoveAllModal] = useState(false);
    const [showRemoveAllConfirmation, setShowRemoveAllConfirmation] = useState(false);
    const [removeAllMessage, setRemoveAllMessage] = useState('Your membership has expired. You have been removed from the organization.');
    const [showHeaderMenu, setShowHeaderMenu] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [positionInput, setPositionInput] = useState('');
    const [remarkInput, setRemarkInput] = useState('');
    const [remarkAction, setRemarkAction] = useState(''); // 'deny', 'remove_member', 'remove_officer'
    const [membershipRenewalMessage, setMembershipRenewalMessage] = useState('');

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

                // Get officer emails for filtering
                const officerEmails = officers.map(officer => officer.email);

                const usersSnapshot = await getDocs(collection(firestore, 'Users'));
                const allUsers = usersSnapshot.docs.map(doc => doc.data());

                // Applicants: only those who are NOT in members AND NOT officers
                const appliedList = allUsers.filter(user => 
                    applicantEmails.includes(user.email) &&
                    !memberEmails.includes(user.email) &&
                    !officerEmails.includes(user.email)
                );

                // Members: only those in members array who are NOT officers
                const memberList = allUsers.filter(user => 
                    memberEmails.includes(user.email) && 
                    !officerEmails.includes(user.email)
                );
                
                // Officers: only those in officers array
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

    const sendNotification = async (userEmail, content, type = 'event') => {
        try {
            await addDoc(collection(firestore, 'notifications'), {
                userId: userEmail,
                content: content,
                type: type,
                read: false,
                timestamp: serverTimestamp()
            });
        } catch (error) {
            console.error('Error sending notification:', error);
        }
    };

    const cleanupDuplicates = async (email, orgRef, orgData) => {
        // Helper function to clean up any duplicates across all arrays
        const applicants = orgData.applicants || [];
        const members = orgData.members || [];
        const officers = orgData.officers || [];
        const officerEmails = officers.map(o => o.email);

        const updates = {};
        
        // Remove from applicants if in members or officers
        if (applicants.includes(email) && (members.includes(email) || officerEmails.includes(email))) {
            updates.applicants = applicants.filter(e => e !== email);
        }

        // Remove from members if in officers
        if (members.includes(email) && officerEmails.includes(email)) {
            updates.members = members.filter(e => e !== email);
        }

        // Apply updates if any
        if (Object.keys(updates).length > 0) {
            await updateDoc(orgRef, updates);
        }
    };

    const handleApprove = async (email) => {
        try {
            const orgQuery = query(collection(firestore, 'organizations'), where('orgName', '==', orgName));
            const orgSnapshot = await getDocs(orgQuery);

            if (!orgSnapshot.empty) {
                const orgRef = orgSnapshot.docs[0].ref;
                const orgData = orgSnapshot.docs[0].data();

                // Check if user is already a member or officer
                const officers = orgData.officers || [];
                const officerEmails = officers.map(o => o.email);
                const members = orgData.members || [];

                if (officerEmails.includes(email)) {
                    Alert.alert('Error', 'This user is already an officer in the organization.');
                    fetchUsers();
                    return;
                }

                if (members.includes(email)) {
                    Alert.alert('Error', 'This user is already a member in the organization.');
                    fetchUsers();
                    return;
                }

                // Remove from applicants and add to members
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

                // Send notification
                await sendNotification(
                    email,
                    `Your application to ${orgName} has been approved! Welcome to the organization.`,
                    'event'
                );

                fetchUsers();
            }
        } catch (error) {
            console.error('Error approving user:', error);
        }
    };

    const handleDeny = (user) => {
        setSelectedUser(user);
        setRemarkInput('');
        setRemarkAction('deny');
        setShowRemarkModal(true);
    };

    const handleRemove = (user) => {
        setSelectedUser(user);
        setRemarkInput('');
        setRemarkAction('remove_member');
        setShowRemarkModal(true);
    };

    const handleRemoveOfficer = (user) => {
        setSelectedUser(user);
        setRemarkInput('');
        setRemarkAction('remove_officer');
        setShowRemarkModal(true);
    };

    const handleConfirmRemark = async () => {
        if (!selectedUser || !remarkInput.trim()) return;

        try {
            const orgQuery = query(collection(firestore, 'organizations'), where('orgName', '==', orgName));
            const orgSnapshot = await getDocs(orgQuery);

            if (!orgSnapshot.empty) {
                const orgRef = orgSnapshot.docs[0].ref;
                const orgData = orgSnapshot.docs[0].data();

                if (remarkAction === 'deny') {
                    await updateDoc(orgRef, {
                        applicants: arrayRemove(selectedUser.email),
                    });

                    await sendNotification(
                        selectedUser.email,
                        `Your application to ${orgName} has been denied. Reason: ${remarkInput.trim()}`,
                        'event'
                    );
                } 
                else if (remarkAction === 'remove_member') {
                    await updateDoc(orgRef, {
                        members: arrayRemove(selectedUser.email),
                    });

                    const userRef = doc(firestore, 'Users', selectedUser.email);
                    try {
                        await updateDoc(userRef, {
                            orgs: arrayRemove(orgName),
                        });
                    } catch (error) {
                        console.error("Error removing orgName from user:", error);
                    }

                    await sendNotification(
                        selectedUser.email,
                        `You have been removed from ${orgName}. Reason: ${remarkInput.trim()}`,
                        'event'
                    );
                }
                else if (remarkAction === 'remove_officer') {
                    const officers = orgData.officers || [];
                    const updatedOfficers = officers.filter(officer => officer.email !== selectedUser.email);

                    await updateDoc(orgRef, {
                        officers: updatedOfficers,
                        members: arrayUnion(selectedUser.email)
                    });

                    await sendNotification(
                        selectedUser.email,
                        `You have been removed from your officer position in ${orgName}. Reason: ${remarkInput.trim()}`,
                        'event'
                    );
                }

                setShowRemarkModal(false);
                setSelectedUser(null);
                setRemarkInput('');
                setRemarkAction('');
                fetchUsers();
            }
        } catch (error) {
            console.error('Error executing action:', error);
        }
    };

    const handleSendMembershipRenewalNotification = async () => {
        if (!membershipRenewalMessage.trim()) {
            Alert.alert('Error', 'Please enter a message for the notification.');
            return;
        }

        try {
            // Send notification to all members
            const allRecipients = [...memberUsers, ...officerUsers];
            
            if (allRecipients.length === 0) {
                Alert.alert('No Members', 'There are no members to send notifications to.');
                return;
            }

            let successCount = 0;
            for (const member of allRecipients) {
                await sendNotification(
                    member.email,
                    membershipRenewalMessage.trim(),
                    'event'
                );
                successCount++;
            }

            Alert.alert('Announcement Sent', `Announcement sent to ${successCount} member(s)!`);
            setShowMembershipRenewalModal(false);
            setMembershipRenewalMessage('');
        } catch (error) {
            console.error('Error sending membership renewal notification:', error);
            Alert.alert('Error', 'Failed to send notification. Please try again.');
        }
    };

    const handleOpenRemoveAllModal = () => {
        if (memberUsers.length === 0) {
            Alert.alert('No Members', 'There are no members to remove.');
            return;
        }
        setShowRemoveAllModal(true);
    };

    const handleProceedRemoveAll = () => {
        if (!removeAllMessage.trim()) {
            Alert.alert('Error', 'Please enter a message for the notification.');
            return;
        }
        setShowRemoveAllModal(false);
        setShowRemoveAllConfirmation(true);
    };

    const handleConfirmRemoveAll = async () => {
        try {
            const orgQuery = query(collection(firestore, 'organizations'), where('orgName', '==', orgName));
            const orgSnapshot = await getDocs(orgQuery);

            if (!orgSnapshot.empty) {
                const orgRef = orgSnapshot.docs[0].ref;

                // Send notification to all members before removal
                let notificationCount = 0;
                for (const member of memberUsers) {
                    await sendNotification(
                        member.email,
                        removeAllMessage.trim(),
                        'event'
                    );
                    notificationCount++;
                }

                // Remove all members from organization
                await updateDoc(orgRef, {
                    members: []
                });

                // Remove organization from each member's orgs array
                for (const member of memberUsers) {
                    try {
                        const userRef = doc(firestore, 'Users', member.email);
                        await updateDoc(userRef, {
                            orgs: arrayRemove(orgName)
                        });
                    } catch (error) {
                        console.error(`Error removing org from user ${member.email}:`, error);
                    }
                }

                Alert.alert('Success', `All ${memberUsers.length} member(s) have been removed and notified.`);
                setShowRemoveAllConfirmation(false);
                setRemoveAllMessage('Your membership has expired. You have been removed from the organization.');
                fetchUsers();
            }
        } catch (error) {
            console.error('Error removing all members:', error);
            Alert.alert('Error', 'Failed to remove members. Please try again.');
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

                // Check if user is already an officer
                if (officers.some(officer => officer.email === selectedUser.email)) {
                    Alert.alert('Error', 'This user is already an officer.');
                    setShowPositionModal(false);
                    return;
                }

                const newOfficer = {
                    email: selectedUser.email,
                    position: positionInput.trim()
                };

                // Add to officers and remove from members
                await updateDoc(orgRef, {
                    officers: [...officers, newOfficer],
                    members: arrayRemove(selectedUser.email)
                });

                await sendNotification(
                    selectedUser.email,
                    `Congratulations! You have been assigned as ${positionInput.trim()} in ${orgName}.`,
                    'event'
                );

                setShowPositionModal(false);
                setSelectedUser(null);
                setPositionInput('');
                fetchUsers();
            }
        } catch (error) {
            console.error('Error assigning officer:', error);
        }
    };

    const getRemarkModalTitle = () => {
        switch (remarkAction) {
            case 'deny':
                return 'Deny Application';
            case 'remove_member':
                return 'Remove Member';
            case 'remove_officer':
                return 'Remove Officer';
            default:
                return 'Provide Reason';
        }
    };

    const getRemarkModalPlaceholder = () => {
        switch (remarkAction) {
            case 'deny':
                return 'Enter reason for denial...';
            case 'remove_member':
                return 'Enter reason for removal...';
            case 'remove_officer':
                return 'Enter reason for removal from officer position...';
            default:
                return 'Enter reason...';
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
                            onPress={() => handleRemove(user)}
                        >
                            <Text style={styles.actionBtnText}>Remove</Text>
                        </TouchableOpacity>
                    </>
                ) : type === 'officer' ? (
                    <TouchableOpacity 
                        style={[styles.actionBtn, styles.removeBtn]} 
                        onPress={() => handleRemoveOfficer(user)}
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
                            onPress={() => handleDeny(user)}
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
                            <View style={styles.orgHeaderTop}>
                                <Text style={styles.orgName}>{orgName}</Text>
                                <TouchableOpacity 
                                    style={styles.hamburgerButton}
                                    onPress={() => setShowHeaderMenu(!showHeaderMenu)}
                                >
                                    <Text style={styles.hamburgerIcon}>☰</Text>
                                </TouchableOpacity>
                            </View>
                            {showHeaderMenu && (
                                <View style={styles.headerMenu}>
                                    <TouchableOpacity 
                                        style={styles.menuItem}
                                        onPress={() => {
                                            setShowMembershipRenewalModal(true);
                                            setShowHeaderMenu(false);
                                        }}
                                    >
                                        <Text style={styles.menuItemText}>Send Announcement</Text>
                                    </TouchableOpacity>
                                    <View style={styles.menuDivider} />
                                    <TouchableOpacity 
                                        style={styles.menuItem}
                                        onPress={() => {
                                            handleOpenRemoveAllModal();
                                            setShowHeaderMenu(false);
                                        }}
                                    >
                                        <Text style={[styles.menuItemText, styles.dangerText]}>Remove All Members</Text>
                                    </TouchableOpacity>
                                </View>
                            )}
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

                {/* Remark Modal */}
                <Modal
                    visible={showRemarkModal}
                    transparent={true}
                    animationType="fade"
                    onRequestClose={() => setShowRemarkModal(false)}
                >
                    <TouchableWithoutFeedback onPress={() => setShowRemarkModal(false)}>
                        <View style={styles.modalOverlay}>
                            <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
                                <View style={styles.modalContent}>
                                    <Text style={styles.modalTitle}>{getRemarkModalTitle()}</Text>
                                    {selectedUser && (
                                        <Text style={styles.modalSubtitle}>
                                            {selectedUser.firstName} {selectedUser.lastName}
                                        </Text>
                                    )}
                                    
                                    <TextInput
                                        style={[styles.positionInput, styles.remarkInput]}
                                        placeholder={getRemarkModalPlaceholder()}
                                        value={remarkInput}
                                        onChangeText={setRemarkInput}
                                        multiline
                                        numberOfLines={4}
                                        textAlignVertical="top"
                                        autoFocus
                                    />

                                    <View style={styles.modalButtons}>
                                        <TouchableOpacity
                                            style={[styles.modalBtn, styles.cancelBtn]}
                                            onPress={() => setShowRemarkModal(false)}
                                        >
                                            <Text style={styles.modalBtnText}>Cancel</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={[styles.modalBtn, styles.confirmBtn, !remarkInput.trim() && styles.disabledBtn]}
                                            onPress={handleConfirmRemark}
                                            disabled={!remarkInput.trim()}
                                        >
                                            <Text style={styles.modalBtnText}>Confirm</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </TouchableWithoutFeedback>
                        </View>
                    </TouchableWithoutFeedback>
                </Modal>

                {/* Membership Renewal Modal */}
                <Modal
                    visible={showMembershipRenewalModal}
                    transparent={true}
                    animationType="fade"
                    onRequestClose={() => setShowMembershipRenewalModal(false)}
                >
                    <TouchableWithoutFeedback onPress={() => setShowMembershipRenewalModal(false)}>
                        <View style={styles.modalOverlay}>
                            <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
                                <View style={styles.modalContent}>
                                    <Text style={styles.modalTitle}>Send Announcement</Text>
                                    <Text style={styles.modalSubtitle}>
                                        Customize your message for {memberUsers.length + officerUsers.length} recipient(s) (Members & Officers)
                                    </Text>
                                    
                                    <TextInput
                                        style={[styles.positionInput, styles.remarkInput]}
                                        placeholder="Enter your renewal message..."
                                        value={membershipRenewalMessage}
                                        onChangeText={setMembershipRenewalMessage}
                                        multiline
                                        numberOfLines={5}
                                        textAlignVertical="top"
                                        autoFocus
                                    />

                                    <View style={styles.modalButtons}>
                                        <TouchableOpacity
                                            style={[styles.modalBtn, styles.cancelBtn]}
                                            onPress={() => setShowMembershipRenewalModal(false)}
                                        >
                                            <Text style={styles.modalBtnText}>Cancel</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={[styles.modalBtn, styles.confirmBtn, !membershipRenewalMessage.trim() && styles.disabledBtn]}
                                            onPress={handleSendMembershipRenewalNotification}
                                            disabled={!membershipRenewalMessage.trim()}
                                        >
                                            <Text style={styles.modalBtnText}>Send</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </TouchableWithoutFeedback>
                        </View>
                    </TouchableWithoutFeedback>
                </Modal>

                {/* Remove All Members Modal */}
                <Modal
                    visible={showRemoveAllModal}
                    transparent={true}
                    animationType="fade"
                    onRequestClose={() => setShowRemoveAllModal(false)}
                >
                    <TouchableWithoutFeedback onPress={() => setShowRemoveAllModal(false)}>
                        <View style={styles.modalOverlay}>
                            <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
                                <View style={styles.modalContent}>
                                    <Text style={styles.modalTitle}>Remove All Members</Text>
                                    <Text style={styles.modalSubtitle}>
                                        You are about to remove {memberUsers.length} member(s). They will be notified with a custom message.
                                    </Text>
                                    
                                    <TextInput
                                        style={[styles.positionInput, styles.remarkInput]}
                                        placeholder="Enter removal notification message..."
                                        value={removeAllMessage}
                                        onChangeText={setRemoveAllMessage}
                                        multiline
                                        numberOfLines={5}
                                        textAlignVertical="top"
                                        autoFocus
                                    />

                                    <View style={styles.modalButtons}>
                                        <TouchableOpacity
                                            style={[styles.modalBtn, styles.cancelBtn]}
                                            onPress={() => setShowRemoveAllModal(false)}
                                        >
                                            <Text style={styles.modalBtnText}>Cancel</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={[styles.modalBtn, styles.confirmBtn, !removeAllMessage.trim() && styles.disabledBtn]}
                                            onPress={handleProceedRemoveAll}
                                            disabled={!removeAllMessage.trim()}
                                        >
                                            <Text style={styles.modalBtnText}>Next</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </TouchableWithoutFeedback>
                        </View>
                    </TouchableWithoutFeedback>
                </Modal>

                {/* Remove All Members Confirmation Modal */}
                <Modal
                    visible={showRemoveAllConfirmation}
                    transparent={true}
                    animationType="fade"
                    onRequestClose={() => setShowRemoveAllConfirmation(false)}
                >
                    <TouchableWithoutFeedback onPress={() => setShowRemoveAllConfirmation(false)}>
                        <View style={styles.modalOverlay}>
                            <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
                                <View style={[styles.modalContent, styles.confirmationModal]}>
                                    <Text style={styles.modalTitle}>Confirm Removal</Text>
                                    <Text style={styles.warningText}>
                                        ⚠️ This action cannot be undone. You are about to permanently remove all {memberUsers.length} member(s) from {orgName}.
                                    </Text>
                                    <Text style={styles.confirmationMessage}>
                                        They will receive the following notification:
                                    </Text>
                                    <View style={styles.messagePreview}>
                                        <Text style={styles.messagePreviewText}>{removeAllMessage}</Text>
                                    </View>

                                    <View style={styles.modalButtons}>
                                        <TouchableOpacity
                                            style={[styles.modalBtn, styles.cancelBtn]}
                                            onPress={() => setShowRemoveAllConfirmation(false)}
                                        >
                                            <Text style={styles.modalBtnText}>Cancel</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={[styles.modalBtn, styles.dangerBtn]}
                                            onPress={handleConfirmRemoveAll}
                                        >
                                            <Text style={styles.modalBtnText}>Remove All Members</Text>
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
        position: 'relative',
    },
    orgHeaderTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    orgName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1a1a1a',
        flex: 1,
    },
    hamburgerButton: {
        backgroundColor: 'transparent',
        paddingHorizontal: 8,
        paddingVertical: 8,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    hamburgerIcon: {
        color: '#666',
        fontSize: 24,
        fontWeight: 'normal',
    },
    headerMenu: {
        position: 'absolute',
        top: 60,
        right: 0,
        backgroundColor: '#fff',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e0e0e0',
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 10,
        zIndex: 1000,
        minWidth: 200,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        gap: 12,
    },
    menuItemIcon: {
        fontSize: 18,
    },
    menuItemText: {
        fontSize: 14,
        color: '#333',
        fontWeight: '500',
    },
    dangerText: {
        color: '#E53935',
    },
    menuDivider: {
        height: 1,
        backgroundColor: '#e0e0e0',
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
    remarkInput: {
        minHeight: 100,
        paddingTop: 12,
    },
    modalButtons: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 16,
    },
    modalBtn: {
        flex: 1,
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 50,
    },
    cancelBtn: {
        backgroundColor: '#ff0000',
    },
    confirmBtn: {
        backgroundColor: '#34A853',
    },
    dangerBtn: {
        backgroundColor: '#E53935',
    },
    disabledBtn: {
        backgroundColor: '#cccccc',
        opacity: 0.6,
    },
    modalBtnText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#fff',
        textAlign: 'center',
    },
    confirmationModal: {
        maxHeight: '80%',
    },
    warningText: {
        fontSize: 16,
        color: '#E53935',
        fontWeight: '600',
        marginBottom: 12,
        lineHeight: 22,
    },
    confirmationMessage: {
        fontSize: 14,
        color: '#666',
        marginBottom: 8,
        fontWeight: '500',
    },
    messagePreview: {
        backgroundColor: '#f5f5f5',
        borderRadius: 8,
        padding: 12,
        marginBottom: 16,
        borderLeftWidth: 4,
        borderLeftColor: '#E53935',
    },
    messagePreviewText: {
        fontSize: 13,
        color: '#333',
        lineHeight: 18,
    },
});