import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, SafeAreaView, ScrollView, TouchableWithoutFeedback, Keyboard, KeyboardAvoidingView, Platform, Linking, Alert, TextInput } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Header from '../components/header';
import BottomNavBar from '../components/bottomNavBar';
import { Ionicons, MaterialIcons, Feather, Entypo } from '@expo/vector-icons'; // icon packs
import { firestore, auth } from '../Firebase';
import { doc, getDoc, query, collection, getDocs, where, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { loginUser } from '../Backend/login';

export default function OrgProfilePage() {
    const navigation = useNavigation();
    const [orgData, setOrgData] = useState(null);
    const [scrollY, setScrollY] = useState(0);
    const [isApplied, setIsApplied] = useState(false);
    //re-check values
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [fullDescription, setFullDescription] = useState('');
    const [memberCount, setMemberCount] = useState(0);
    const [location, setLocation] = useState('');
    const [email, setEmail] = useState('');
    const [website, setWebsite] = useState('');
    const [logo, setLogo] = useState(null);

    const route = useRoute();
    const { orgName } = route.params;
    const currentUser = auth.currentUser;
    const userEmail = currentUser.email;

    const [isMember, setIsMember] = useState(false);
    const [isFollower, setFollowing] = useState(false);
    const [isLeader, setLeader] = useState(false);
    const [showRenewalModal, setShowRenewalModal] = useState(false);
    const [renewalMessage, setRenewalMessage] = useState('');
    const [hasRenewalApproval, setHasRenewalApproval] = useState(false);
    const [hasPendingRenewal, setHasPendingRenewal] = useState(false);


    // const orgName = 'ACSS';

    useEffect(() => {

        const fetchOrgData = async () => {
            try {
                const q = query(collection(firestore, 'organizations'), where('orgName', '==', orgName));
                const querySnapshot = await getDocs(q);
                console.log(orgName);
                if (!querySnapshot.empty) {
                    const docSnap = querySnapshot.docs[0];
                    const data = docSnap.data();

                    setName(data.orgName);
                    setDescription(data.shortdesc || "No description");
                    setFullDescription(data.shortdesc || "No description");
                    setMemberCount(Array.isArray(data.members) ? data.members.length : 0);
                    setLocation(data.location);
                    setEmail(data.email);
                    setWebsite(data.websitelink);
                    setLogo(data.logoBase64);
                    if (data.leaders && data.leaders.includes(userEmail)) {
                        setLeader(true);
                      } else {
                        setLeader(false);
                      }
                    //console.log(userEmail);

                    const userDocRef = doc(firestore, "Users", data.email); // Using email as the document ID
                    const userSnap = await getDoc(userDocRef);
                    if (userSnap.exists()) {
                        console.log();
                        
                      } else {
                        console.log("No such user!");
                        return null;
                      }
                    
                } else {
                    console.log('No Registry Found')
                }
            } catch (error) {
                console.error('Error fetching organzation data:', error)
            }
        }

        fetchOrgData();
    }, []);

    useEffect(() => {
        const userCheck = async () => {
            const q = query(collection(firestore, 'organizations'), where('orgName', '==', orgName));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                const orgDoc = querySnapshot.docs[0];
                const data = orgDoc.data();

                const members = data.members || [];
                const applicants = data.applicants || [];

                setIsMember((data.members || []).includes(userEmail));
setIsApplied((data.applicants || []).includes(userEmail));
            }
        };
        userCheck();
    }, [orgName, userEmail]);

    useEffect(() => {
        const followCheck = async () => {
            const q = query(collection(firestore, 'organizations'), where('orgName', '==', orgName));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                const orgDoc = querySnapshot.docs[0];
                const data = orgDoc.data();

                const followers = data.followers || [];
                setFollowing(followers.includes(userEmail)); // <-- Update membership state
            }
        };
        followCheck();
    }, [orgName, userEmail]);

    useEffect(() => {
        const checkRenewalStatus = async () => {
            if (!isMember) {
                setHasRenewalApproval(false);
                setHasPendingRenewal(false);
                return;
            }

            try {
                const userDocRef = doc(firestore, 'Users', userEmail);
                const userSnap = await getDoc(userDocRef);
                
                if (userSnap.exists()) {
                    const userData = userSnap.data();
                    const renewalApprovals = userData.renewalApprovals || {};
                    const renewalRequests = userData.renewalRequests || {};
                    
                    // Check if user has renewal approval for this organization
                    const hasApproval = renewalApprovals[orgName] == true;
                    setHasRenewalApproval(hasApproval);
                    
                    // Check if user has a pending renewal request
                    const hasPending = renewalRequests[orgName] && renewalRequests[orgName].status === 'pending';
                    setHasPendingRenewal(hasPending);
                    
                    console.log(`Renewal Status for ${orgName}:`, { hasApproval, hasPending });
                } else {
                    setHasRenewalApproval(false);
                    setHasPendingRenewal(false);
                }
            } catch (error) {
                console.error('Error checking renewal status:', error);
                setHasRenewalApproval(false);
                setHasPendingRenewal(false);
            }
        };
        
        checkRenewalStatus();
    }, [orgName, userEmail, isMember]);

    const toggleFollow = async (orgName, userEmail) => {
        try {
            const q = query(collection(firestore, 'organizations'), where('orgName', '==', orgName));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                const orgDoc = querySnapshot.docs[0];
                const orgRef = doc(firestore, 'organizations', orgDoc.id);

                const data = orgDoc.data();
                const followers = data.followers || [];
                const userIsFollower = followers.includes(userEmail);

                setFollowing(!userIsFollower);

                await updateDoc(orgRef, {
                    followers: userIsFollower ? arrayRemove(userEmail) : arrayUnion(userEmail),
                });

                console.log(
                    userIsFollower
                        ? `User ${userEmail} unfollowed organization ${orgName}`
                        : `User ${userEmail} followed organization ${orgName}`
                );
            } else {
                console.log('Organization not found');
            }
        } catch (error) {
            console.error('Error updating followers:', error);
        }
    };

    const switchAccount = async () => {
        const { success, user, error } = await loginUser({ email, password: '123456' });         
        if (success) {
            navigation.navigate('Home');
        } else {
            console.error("Error logging in: ", error);
            Alert.alert(
            'Login Error',
            error.message || 'Something went wrong. Please try again.',
            [{ text: 'I Understand' }]
            );
        }
      };

    const addUserToApplication = async (orgName, userEmail) => {
    try {
        // Fetch organization data
        const q = query(collection(firestore, 'organizations'), where('orgName', '==', orgName));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            const orgDoc = querySnapshot.docs[0];
            const orgRef = doc(firestore, 'organizations', orgDoc.id);
            const data = orgDoc.data();
            const applicants = data.applicants || [];
            const userIsApplicant = applicants.includes(userEmail);

            // If user is already an applicant, allow them to cancel
            if (userIsApplicant) {
                await updateDoc(orgRef, {
                    applicants: applicants.filter(email => email !== userEmail),
                });
                setIsApplied(false);
                Alert.alert('Application Cancelled', 'Your application has been withdrawn.');
                return;
            }

            // Check if user's course is eligible
            const canJoin = data.canJoin || [];
            
            // Fetch user's course from Users collection
            const userDocRef = doc(firestore, 'Users', userEmail);
            const userSnap = await getDoc(userDocRef);

            if (!userSnap.exists()) {
                Alert.alert('Error', 'User profile not found. Please complete your profile first.');
                return;
            }

            const userData = userSnap.data();
            const userCourse = userData.Course;

            if (!userCourse) {
                Alert.alert('Profile Incomplete', 'Please add your course to your profile before joining organizations.');
                return;
            }

            // Check if user's course is in the canJoin array
            if (canJoin.length > 0 && !canJoin.includes(userCourse)) {
                Alert.alert(
                    'Not Eligible',
                    `Sorry, this organization is only open to students from: ${canJoin.join(', ')}.\n\nYour course (${userCourse}) is not eligible to join.`,
                    [{ text: 'OK' }]
                );
                return;
            }

            // User is eligible, add to applicants
            await updateDoc(orgRef, {
                applicants: [...applicants, userEmail],
            });
            setIsApplied(true);
            Alert.alert('Application Submitted', 'Your application has been submitted successfully!');
        }
    } catch (error) {
        console.error('Error updating applicants:', error);
        Alert.alert('Error', 'Failed to submit application. Please try again.');
    }
};

const handleSubmitRenewalRequest = async () => {
    if (!renewalMessage.trim()) {
        Alert.alert('Error', 'Please enter a message for your renewal request.');
        return;
    }

    try {
        const userDocRef = doc(firestore, 'Users', userEmail);
        const userSnap = await getDoc(userDocRef);

        if (!userSnap.exists()) {
            Alert.alert('Error', 'User profile not found.');
            return;
        }

        const userData = userSnap.data();
        const renewalRequests = userData.renewalRequests || {};

        // Add renewal request for this organization
        renewalRequests[orgName] = {
            status: 'pending',
            message: renewalMessage.trim(),
            requestedAt: new Date().toISOString(),
        };

        await updateDoc(userDocRef, {
            renewalRequests: renewalRequests,
        });

        setShowRenewalModal(false);
        setRenewalMessage('');
        Alert.alert('Success', 'Your renewal request has been submitted! The organization will review it shortly.');
    } catch (error) {
        console.error('Error submitting renewal request:', error);
        Alert.alert('Error', 'Failed to submit renewal request. Please try again.');
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
                        <Header scrollY={scrollY} />
                        <ScrollView
                            onScroll={(event) => {
                                setScrollY(event.nativeEvent.contentOffset.y);
                            }}
                            scrollEventThrottle={16}
                            contentContainerStyle={styles.scrollContent}
                            showsVerticalScrollIndicator={false}>
                            {/* Org Profile Content */}
                            <View style={styles.profileContainer}>
                                <Image
                                    source={{ uri: logo }}
                                    style={styles.logo}
                                />
                                <Text style={styles.orgName}>{name}</Text>
                                <Text style={styles.shortDescription}>{description}</Text>

                                <View style={styles.buttonRow}>
                                <TouchableOpacity
                                    style={styles.joinButton}
                                    onPress={() => addUserToApplication(orgName, userEmail, currentUser.displayName)}
                                    disabled={isMember}>
                                    <Text style={styles.joinButtonText}>
                                        {isMember ? 'Joined' : isApplied ? 'Applied' : 'Join'}
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.messageButton}>
                                    <Text style={styles.messageButtonText}>Message</Text>
                                </TouchableOpacity>
                            </View>
                            {isMember && !hasRenewalApproval && !hasPendingRenewal && (
                                <TouchableOpacity 
                                    style={styles.subtleRenewalButton}
                                    onPress={() => setShowRenewalModal(true)}
                                >
                                    <Text style={styles.subtleRenewalButtonText}>Renew Membership</Text>
                                </TouchableOpacity>
                            )}
                            {isMember && hasPendingRenewal && (
                                <View style={styles.subtleRenewalButton}>
                                    <Text style={styles.pendingRenewalText}>⏳ Renewal Pending</Text>
                                </View>
                            )}
                            {isLeader && (
                            <View style={styles.switchContainer}>
                                <TouchableOpacity style={styles.switchAccountButton} onPress={switchAccount}>
                                <Ionicons name="swap-horizontal" size={20} color="#ff0000" style={{ marginRight: 8 }} />
                                <Text style={styles.switchAccountText}>Switch Account</Text>
                                </TouchableOpacity>
                            </View>
                            )}
                                <View style={styles.underline} />
                                <View style={styles.section}>
                                    <Text style={styles.sectionTitle}>Organization Details</Text>

                                    <View style={styles.infoDetailRow}>
                                        <Ionicons name="information-circle-outline" size={20} color="#555" />
                                        <Text style={styles.detailText}>{description}</Text>
                                    </View>

                                    <View style={styles.detailRow}>
                                        <Ionicons name="people-outline" size={20} color="#555" />
                                        <Text style={styles.detailText}>{memberCount} members</Text>
                                    </View>

                                    <View style={styles.detailRow}>
                                        <Ionicons name="location-outline" size={20} color="#555" />
                                        <Text style={styles.detailText}>{location}</Text>
                                    </View>

                                    <View style={styles.detailRow}>
                                        <Ionicons name="mail-outline" size={20} color="#555" />
                                        <Text style={styles.detailLink} onPress={() => Linking.openURL(`mailto:${email}`)}>
                                            {email}
                                        </Text>
                                    </View>

                                    {/* <View style={styles.detailRow}>
                                        <Feather name="link" size={20} color="#555" />
                                        <Text style={styles.detailLink} onPress={() => Linking.openURL(website)}>
                                            {website}
                                        </Text>
                                    </View> */}
                                </View>
                                <View style={styles.underline} />
                            </View>
                        </ScrollView>
                        <BottomNavBar />
                    </View>

                    {/* Renewal Request Modal */}
                    {showRenewalModal && (
                        <TouchableWithoutFeedback onPress={() => setShowRenewalModal(false)}>
                            <View style={styles.modalOverlay}>
                                <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
                                    <View style={styles.modalContent}>
                                        <Text style={styles.modalTitle}>Renew Membership</Text>
                                        <Text style={styles.modalSubtitle}>
                                            Submit a renewal request to {name}
                                        </Text>
                                        
                                        <TextInput
                                            style={[styles.renewalInput, styles.renewalTextArea]}
                                            placeholder="Why do you want to renew your membership? (Optional)"
                                            value={renewalMessage}
                                            onChangeText={setRenewalMessage}
                                            multiline
                                            numberOfLines={5}
                                            textAlignVertical="top"
                                        />

                                        <View style={styles.renewalModalButtons}>
                                            <TouchableOpacity
                                                style={[styles.renewalModalBtn, styles.renewalCancelBtn]}
                                                onPress={() => {
                                                    setShowRenewalModal(false);
                                                    setRenewalMessage('');
                                                }}
                                            >
                                                <Text style={styles.renewalModalBtnText}>Cancel</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                style={[styles.renewalModalBtn, styles.renewalSubmitBtn]}
                                                onPress={handleSubmitRenewalRequest}
                                            >
                                                <Text style={styles.renewalModalBtnText}>Submit Request</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                </TouchableWithoutFeedback>
                            </View>
                        </TouchableWithoutFeedback>
                    )}
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
        paddingHorizontal: 20,
        paddingBottom: 80,
    },
    profileContainer: {
        alignItems: 'center',
        marginTop: 20,
    },
    logo: {
        width: 100,
        height: 100,
        borderRadius: 50,
        marginBottom: 15,
    },
    orgName: {
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 5,
    },
    shortDescription: {
        fontSize: 14,
        textAlign: 'center',
        color: '#777',
        marginBottom: 20,
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        width: '100%',
        marginBottom: 10,
    },
    followButton: {
        backgroundColor: '#E0E0E0',
        paddingVertical: 8,
        paddingHorizontal: 20,
        borderRadius: 8,
    },
    followButtonText: {
        color: '#000',
        fontWeight: 'bold',
    },
    messageButton: {
        backgroundColor: '#E0E0E0',
        paddingVertical: 8,
        paddingHorizontal: 15,
        borderRadius: 8,
        width: '48%',
        textAlign: 'center',
    },
    messageButtonText: {
        color: '#000',
        fontWeight: 'bold',
        textAlign: 'center',
        fontSize: 14,
    },
    joinButton: {
        backgroundColor: '#d32f2f',
        paddingVertical: 8,
        paddingHorizontal: 15,
        borderRadius: 8,
        width: '48%',
        textAlign: 'center',
    },
    joinButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        textAlign: 'center',
        fontSize: 14,
    },
    section: {
        width: '100%',
        borderRadius: 10,
        padding: 15,

    },
    sectionTitle: {
        fontWeight: 'bold',
        fontSize: 16,
        marginBottom: 10,

    },
    fullDescription: {
        fontSize: 14,
        color: '#555',
        marginBottom: 20,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    infoDetailRow: {
        flexDirection: 'row',
        alignItems: 'top',
        marginBottom: 10,
    },
    detailText: {
        marginLeft: 8,
        fontSize: 14,
        color: '#555',
    },
    detailLink: {
        marginLeft: 8,
        fontSize: 14,
        color: '#1e88e5',
        textDecorationLine: 'underline',
    },
    underline: {
        alignSelf: 'center',
        height: 1,
        backgroundColor: '#555',
        width: '100%',
        marginTop: 2,
    },
    switchContainer: {
       
        justifyContent: 'center',
        alignItems: 'center',
        
        marginBottom: 10,
      },
    
      switchAccountButton: {
        backgroundColor: '#fff',
        paddingVertical: 8,
        paddingHorizontal: 15,
        flexDirection: 'row',
        width: '100%',
        borderRadius: 8,
        borderWidth: 1,           // <-- Corrected here
        borderColor: 'red',
      },
      switchAccountText: {
        color: '#ff0000',
        fontSize: 16,
        fontWeight: 'bold',
        fontSize: 14,
      },
    subtleRenewalButton: {
        paddingVertical: 12,
        paddingHorizontal: 16,
        marginTop: 12,
        alignItems: 'center',
        borderRadius: 8,
        backgroundColor: 'transparent',
    },
    subtleRenewalButtonText: {
        color: '#1E88E5',
        fontWeight: '500',
        textAlign: 'center',
        fontSize: 14,
    },
    pendingRenewalText: {
        color: '#FF9800',
        fontWeight: '500',
        textAlign: 'center',
        fontSize: 14,
    },
    modalOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
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
    renewalInput: {
        borderWidth: 1,
        borderColor: '#e0e0e0',
        borderRadius: 12,
        padding: 12,
        fontSize: 16,
        marginBottom: 20,
        backgroundColor: '#f8f9fa',
    },
    renewalTextArea: {
        minHeight: 100,
        paddingTop: 12,
    },
    renewalModalButtons: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 16,
    },
    renewalModalBtn: {
        flex: 1,
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 50,
    },
    renewalCancelBtn: {
        backgroundColor: '#ff0000',
    },
    renewalSubmitBtn: {
        backgroundColor: '#34A853',
    },
    renewalModalBtnText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#fff',
        textAlign: 'center',
    },
});
