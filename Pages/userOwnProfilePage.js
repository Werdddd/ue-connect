import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Image,
    SafeAreaView,
    ScrollView,
    TouchableWithoutFeedback,
    Keyboard,
    KeyboardAvoidingView,
    Platform, TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Header from '../components/header';
import BottomNavBar from '../components/bottomNavBar';
import { getOwnUserProfile } from '../Backend/userOwnProfile';
import { updateProfileImage, loadProfileImage } from '../Backend/changeProfile';
import { auth } from '../Firebase'; // your auth config

export default function UserOwnProfilePage() {
    const navigation = useNavigation();
    const [scrollY, setScrollY] = useState(0);

    const [name, setName] = useState({ firstName: '', lastName: '' });
    const [year, setYear] = useState('');
    const [profile, setProfile] = useState('');
    const [course, setCourse] = useState('');
    const userEmail = auth.currentUser?.email;

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const data = await getOwnUserProfile();
                setName({ firstName: data.firstName, lastName: data.lastName });
                setYear(data.Year);
                setCourse(data.Course);
                setProfile(data.profileImage);
            } catch (error) {
                console.error("Error fetching profile:", error.message);
            }
        };

        fetchProfile();

        if (userEmail) {
            loadProfileImage(userEmail, setProfile);
        }
    }, [userEmail]);

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
                            showsVerticalScrollIndicator={false}
                        >
                            <View style={styles.profileContainer}>
                            <TouchableOpacity onPress={() => updateProfileImage(userEmail, setProfile)}>
                                <Image
                                    source={{ uri: profile }}
                                    style={styles.userProfileImage}
                                />
                            </TouchableOpacity>

                                <Text style={styles.userName}>
                                    {name.firstName && name.lastName
                                        ? `${name.firstName} ${name.lastName}`
                                        : 'Your Name'}
                                </Text>
                                <View style={styles.infoDetailRow}>
                                    <Text style={styles.userYear}>{year || 'Your Year'}</Text>
                                    <Text style={styles.userCourse}>{course || 'Your Course'}</Text>
                                </View>
                                <View style={styles.underline} />
                            </View>
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
    profileContainer: {
        alignItems: 'center',
        marginTop: 20,
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
