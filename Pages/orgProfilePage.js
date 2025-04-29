import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, SafeAreaView, ScrollView, TouchableWithoutFeedback, Keyboard, KeyboardAvoidingView, Platform, Linking } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Header from '../components/header';
import BottomNavBar from '../components/bottomNavBar';
import { Ionicons, MaterialIcons, Feather, Entypo } from '@expo/vector-icons'; // icon packs
import { firestore, auth } from '../Firebase';
import { doc, getDoc, query, collection, getDocs, where, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';

export default function OrgProfilePage() {
    const navigation = useNavigation();
    const [orgData, setOrgData] = useState(null);
    const [scrollY, setScrollY] = useState(0);

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


    // const orgName = 'ACSS';

    useEffect (() => {

        const fetchOrgData = async () =>{
            try{
                const q = query(collection(firestore, 'organizations'), where('orgName', '==', orgName));
                const querySnapshot = await getDocs(q);
                console.log(orgName);
                if(!querySnapshot.empty){
                    const docSnap = querySnapshot.docs[0];
                    const data = docSnap.data();

                    setName(data.orgName);
                    setDescription(data.shortdesc);
                    setFullDescription(data.fulldesc);
                    setMemberCount(Array.isArray(data.members) ? data.members.length : 0);
                    setLocation(data.location);
                    setEmail(data.email);
                    setWebsite(data.websitelink);
                    setLogo(data.logoBase64);
                    console.log('data fetched');
                    console.log(userEmail);
                }else{
                    console.log('No Registry Found')
                }
            }catch(error){
                console.error('Error fetching organzation data:', error)
            }
        }

        fetchOrgData();
    }, []);

    useEffect(() => {
        const userCheck = async() =>{
            const q = query(collection(firestore, 'organizations'), where('orgName', '==', orgName));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
            const orgDoc = querySnapshot.docs[0];
            const data = orgDoc.data();

            const members = data.members || [];
            setIsMember(members.includes(userEmail)); // <-- Update membership state
            }
        };
        userCheck();
    }, [orgName, userEmail]);

    const addUserToMembers = async (orgName, userEmail) => {
        try {
          const q = query(collection(firestore, 'organizations'), where('orgName', '==', orgName));
          const querySnapshot = await getDocs(q);
      
          if (!querySnapshot.empty) {
            const orgDoc = querySnapshot.docs[0];
            const orgRef = doc(firestore, 'organizations', orgDoc.id);
      
            const data = orgDoc.data();
            const members = data.members || [];
            const userIsMember = members.includes(userEmail);

            setIsMember(!userIsMember);

            await updateDoc(orgRef, {
              members: userIsMember ? arrayRemove(userEmail) : arrayUnion(userEmail),
            });
      
            console.log(
              userIsMember
                ? `User ${userEmail} removed from organization ${orgName}`
                : `User ${userEmail} added to organization ${orgName}`
            );
          } else {
            console.log('Organization not found');
          }
        } catch (error) {
          console.error('Error updating members:', error);
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
                                    <TouchableOpacity style={styles.followButton}>
                                        <Text style={styles.followButtonText}>Follow</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={styles.messageButton}>
                                        <Text style={styles.messageButtonText}>Message</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={styles.joinButton} onPress={() => addUserToMembers(orgName, userEmail)}>
                                        <Text style={styles.joinButtonText}>{isMember ? 'Leave': 'Join'}</Text>
                                    </TouchableOpacity>
                                </View>
                                <View style={styles.underline} />
                                <View style={styles.section}>
                                    <Text style={styles.sectionTitle}>Organization Details</Text>
                                    
                                    <View style={styles.infoDetailRow}>
                                        <Ionicons name="information-circle-outline" size={20} color="#555" />
                                        <Text style={styles.detailText}>{fullDescription}</Text>
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

                                    <View style={styles.detailRow}>
                                        <Feather name="link" size={20} color="#555" />
                                        <Text style={styles.detailLink} onPress={() => Linking.openURL(website)}>
                                            {website}
                                        </Text>
                                    </View>
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
    joinButton: {
        backgroundColor: '#d32f2f',
        paddingVertical: 8,
        paddingHorizontal: 20,
        borderRadius: 8,
    },
    joinButtonText: {
        color: '#fff',
        fontWeight: 'bold',
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
});
