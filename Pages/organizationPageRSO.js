import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableWithoutFeedback, Keyboard, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { collection, query, where, getDocs, doc, updateDoc, arrayRemove, arrayUnion } from 'firebase/firestore';
import { firestore } from '../Firebase';
import Header from '../components/header';
import BottomNavBar from '../components/bottomNavBar';

export default function OrganizationPageRSO() {
    const navigation = useNavigation();
    const route = useRoute();
    const orgName = "Deepspace";

    const [appliedUsers, setAppliedUsers] = useState([]);
    const [memberUsers, setMemberUsers] = useState([]);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const orgQuery = query(collection(firestore, 'organizations'), where('orgName', '==', orgName));
                const orgSnapshot = await getDocs(orgQuery);

                if (!orgSnapshot.empty) {
                    const orgData = orgSnapshot.docs[0].data();
                    const appliedEmails = orgData.applied || [];
                    const memberEmails = orgData.members || [];

                    const usersSnapshot = await getDocs(collection(firestore, 'Users'));
                    const allUsers = usersSnapshot.docs.map(doc => doc.data());

                    const appliedList = allUsers.filter(user => appliedEmails.includes(user.email));
                    const memberList = allUsers.filter(user => memberEmails.includes(user.email));

                    setAppliedUsers(appliedList);
                    setMemberUsers(memberList);
                }
            } catch (error) {
                console.error('Error fetching users:', error);
            }
        };

        fetchUsers();
    }, [orgName]);

    const handleApprove = async (email) => {
        try {
            const orgQuery = query(collection(firestore, 'organizations'), where('orgName', '==', orgName));
            const orgSnapshot = await getDocs(orgQuery);

            if (!orgSnapshot.empty) {
                const orgRef = orgSnapshot.docs[0].ref;

                await updateDoc(orgRef, {
                    applied: arrayRemove(email),
                    members: arrayUnion(email),
                });

                setAppliedUsers(prev => prev.filter(user => user.email !== email));
                setMemberUsers(prev => [...prev, appliedUsers.find(user => user.email === email)]);
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
                    applied: arrayRemove(email),
                });

                setAppliedUsers(prev => prev.filter(user => user.email !== email));
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

                setMemberUsers(prev => prev.filter(user => user.email !== email));
            }
        } catch (error) {
            console.error('Error denying user:', error);
        }
    };

    return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <SafeAreaView style={styles.safeArea}>
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
                    <View style={styles.container}>
                        <Header />
                        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                            <Text style={styles.sectionTitle}>Members</Text>
                            {memberUsers.map((user, index) => (
                                <View key={index} style={styles.userCard}>
                                <Text style={styles.userText}>Email: {user.email}</Text>
                                <Text style={styles.userText}>Name: {user.firstName} {user.lastName}</Text>
                                <Text style={styles.userText}>Student No.: {user.studentNumber}</Text>
                                <Text style={styles.userText}>Course: {user.course}</Text>
                                <Text style={styles.userText}>Year: {user.year}</Text>

                                <View style={styles.buttonRow}>
                                    <TouchableOpacity style={styles.denyBtn} onPress={() => handleRemove(user.email)}>
                                        <Text style={styles.buttonText}>Remove</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                            ))}

                            <Text style={styles.sectionTitle}>Applied</Text>
                            {appliedUsers.map((user, index) => (
                                <View key={index} style={styles.userCard}>
                                    <Text style={styles.userText}>Email: {user.email}</Text>
                                    <Text style={styles.userText}>Name: {user.firstName} {user.lastName}</Text>
                                    <Text style={styles.userText}>Student No.: {user.studentNumber}</Text>
                                    <Text style={styles.userText}>Course: {user.course}</Text>
                                    <Text style={styles.userText}>Year: {user.year}</Text>

                                    <View style={styles.buttonRow}>
                                        <TouchableOpacity style={styles.approveBtn} onPress={() => handleApprove(user.email)}>
                                            <Text style={styles.buttonText}>Approve</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity style={styles.denyBtn} onPress={() => handleDeny(user.email)}>
                                            <Text style={styles.buttonText}>Deny</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            ))}
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
        paddingHorizontal: 20,
        paddingBottom: 80,
    },
    sectionTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        marginVertical: 10,
        color: '#333',
    },
    userCard: {
        backgroundColor: '#f0f0f0',
        padding: 15,
        borderRadius: 10,
        marginBottom: 10,
    },
    userText: {
        fontSize: 14,
        color: '#555',
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 10,
    },
    approveBtn: {
        backgroundColor: '#4CAF50',
        paddingVertical: 8,
        paddingHorizontal: 15,
        borderRadius: 8,
    },
    denyBtn: {
        backgroundColor: '#F44336',
        paddingVertical: 8,
        paddingHorizontal: 15,
        borderRadius: 8,
    },
    buttonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
});
