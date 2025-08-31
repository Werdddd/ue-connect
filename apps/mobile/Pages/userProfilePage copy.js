import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, SafeAreaView, ScrollView, TouchableWithoutFeedback, Keyboard, KeyboardAvoidingView, Platform, Linking } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Header from '../components/header';
import BottomNavBar from '../components/bottomNavBar';
import { Ionicons, MaterialIcons, Feather, Entypo } from '@expo/vector-icons'; // icon packs

export default function UserProfilePage() {
    const navigation = useNavigation();
    const [scrollY, setScrollY] = useState(0);
    
    const [name, setName] = useState('');
    const [year, setYear] = useState('');
    const [course, setCourse] = useState('');

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
