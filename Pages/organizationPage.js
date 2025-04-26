import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, SafeAreaView, ScrollView, TouchableWithoutFeedback, Feedback, Keyboard, KeyboardAvoidingView, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Header from '../components/header';
import BottomNavBar from '../components/bottomNavBar';
import { LinearGradient } from 'expo-linear-gradient';

export default function OrganizationPage() {
    const navigation = useNavigation();

    return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <SafeAreaView style={styles.safeArea}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.container}
                >
                    <View style={styles.container}>
                        <Header />
                        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                            <View style={styles.horizontalBar}>
                                <ScrollView
                                    horizontal
                                    showsHorizontalScrollIndicator={false}
                                    contentContainerStyle={styles.horizontalContent}
                                >
                                    <TouchableOpacity style={styles.column}>
                                        <Text style={styles.columnText}>All</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity style={styles.column}>
                                        <Image source={require('../assets/cscLogo.png')} style={styles.logo} />
                                    </TouchableOpacity>

                                    <TouchableOpacity style={styles.column}>
                                        <Image source={require('../assets/cscLogo.png')} style={styles.logo} />
                                    </TouchableOpacity>

                                    <TouchableOpacity style={styles.column}>
                                        <Image source={require('../assets/cscLogo.png')} style={styles.logo} />
                                    </TouchableOpacity>

                                    <TouchableOpacity style={styles.column}>
                                        <Image source={require('../assets/cscLogo.png')} style={styles.logo} />
                                    </TouchableOpacity>

                                    <TouchableOpacity style={styles.column}>
                                        <Image source={require('../assets/cscLogo.png')} style={styles.logo} />
                                    </TouchableOpacity>

                                </ScrollView>

                                <LinearGradient
                                    colors={['rgba(0,0,0,0.15)', 'transparent']}
                                    style={styles.bottomShadow}
                                    pointerEvents="none"
                                />
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
    },
    horizontalBar: {
        marginTop: 5,
        backgroundColor: '#fff',
        zIndex: 2,
        paddingBottom: 10,
    },
    horizontalContent: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
    },
    column: {
        width: 60,
        height: 50,
        borderRadius: 10,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
        elevation: 2,
    },

    columnText: {
        fontWeight: 'bold',
        fontSize: 14,
        color: '#E50914', // UE red color 
    },
    logo: {
        width: 40,
        height: 40,
        resizeMode: 'contain',
    },
    bottomShadow: {
        position: 'absolute',
        bottom: -1,
        left: 0,
        right: 0,
        height: 8,
        zIndex: 1,
    },




});
