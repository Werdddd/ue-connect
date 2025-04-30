import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, SafeAreaView, ScrollView, TouchableWithoutFeedback, Keyboard, KeyboardAvoidingView, Platform, Linking } from 'react-native';
import { firestore } from '../Firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useNavigation } from '@react-navigation/native';
import Header from '../components/header';
import BottomNavBar from '../components/bottomNavBar';
import UserCard from '../components/userCard';

export default function AdminPage() {
    const navigation = useNavigation();
    const [scrollY, setScrollY] = useState(0);

    const [name, setName] = useState('');
    const [year, setYear] = useState('');
    const [course, setCourse] = useState('');

    // useEffect(() => {
    //     // Simulate fetching data
    //     const fetchData = async () => {
    //         const data = {
    //             name: 'John Doe',
    //             year: '3rd Year',
    //             course: 'Computer Science',
    //         };
    //         setUserData(data);
    //     };
    //     fetchData();
    // }, []);

    // re-check function
    // useEffect(() => {
    //     const fetchUserData = async () => {
    //         try {
    //             const docRef = doc(firestore, 'users', 'userId'); // Use the correct document ID for the user
    //             const docSnap = await getDoc(docRef);
    //             if (docSnap.exists()) {
    //                 const data = docSnap.data();
    //                 setName(data.name);
    //                 setYear(data.year);
    //                 setCourse(data.course);
    //             } else {
    //                 console.log('No such document!');
    //             }
    //         } catch (error) {
    //             console.error('Error fetching user data:', error);
    //         }
    //     };
    //     fetchUserData();
    // }, []);

    return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <SafeAreaView style={styles.safeArea}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.container}
                >
                    <View style={styles.container}>
                        <Header scrollY={scrollY} />
                        <View
                            style={styles.flexcont}
                            onScroll={(event) => {
                                setScrollY(event.nativeEvent.contentOffset.y);
                            }}
                            scrollEventThrottle={16}
                            contentContainerStyle={styles.scrollContent}
                            showsVerticalScrollIndicator={false}>
                            {/* User Profile Content */}
                            <View style={styles.profileContainer}>
                                {/* Add a placeholder image or use user's actual image */}
                                <Image source={{ uri: 'https://www.example.com/user-profile-pic.jpg' }} style={styles.userProfileImage} />
                                <Text style={styles.userName}>{name || 'Your Name'}</Text>
                                <View style={styles.infoDetailRow}>
                                    <Text style={styles.userYear}>{year || 'Your Year'}</Text>
                                    <Text style={styles.userCourse}>{course || 'Your Course'}</Text>
                                </View>

                                <View style={styles.buttonRow}>
                                    <TouchableOpacity style={styles.followButton}>
                                        <Text style={styles.followButtonText}>Follow</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={styles.messageButton}>
                                        <Text style={styles.messageButtonText}>Message</Text>
                                    </TouchableOpacity>
                                </View>
                                <View style={styles.underline} />
                            </View>
                            
                            <View style={styles.userCardContainer}>
                                <UserCard />
                            </View>
                        </View>
                    </View>
                    <BottomNavBar />
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
    userCardContainer: {
        width: '100%',
        height: '56%',
    },

    userProfileImage: {
        width: 100,
        height: 100,
        borderRadius: 50,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: '#ccc',
    },
    userName: {
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 5,
    },
    userYear: {
        fontSize: 14,
        textAlign: 'center',
        color: '#777',
        marginBottom: 5,
    },
    userCourse: {
        fontSize: 14,
        textAlign: 'center',
        color: '#777',
        marginBottom: 20,
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        width: '100%',
        marginBottom: 25,
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
        paddingHorizontal: 20,
        borderRadius: 8,
    },
    messageButtonText: {
        color: '#000',
        fontWeight: 'bold',
    },
    underline: {
        alignSelf: 'center',
        height: 1,
        backgroundColor: '#555',
        width: '100%',
        marginTop: 2,
    },
    infoDetailRow: {
        flexDirection: 'row',
        alignItems: 'top',
        marginTop: 10,

        justifyContent: 'space-between',
        width: '50%',
    },
});
