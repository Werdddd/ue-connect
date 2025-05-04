import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons'; 
import { FontAwesome } from '@expo/vector-icons'; 
import { useNavigation, useRoute } from '@react-navigation/native';
import { auth, firestore } from '../Firebase';  // Firebase imports
import { getDoc, doc } from 'firebase/firestore';  // Firestore functions

const BottomNavBar = () => {
  const [userProfileImage, setUserProfileImage] = useState(null);
  const [role, setRole] = useState('');
  const navigation = useNavigation();
  const route = useRoute();

  useEffect(() => {
    const fetchProfileImage = async () => {
      const userEmail = auth.currentUser?.email;
      if (userEmail) {
        try {
          // Retrieve the user's profile from Firestore based on their email
          const userDocRef = doc(firestore, 'Users', userEmail);
          const userDocSnap = await getDoc(userDocRef);
          
          if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            // Set the profile image from Firestore
            setUserProfileImage(userData.profileImage || null); // Default to null if no image is set
            setRole(userData.role);
          } else {
            console.log('No user document found');
          }
        } catch (error) {
          console.error('Error fetching profile image:', error);
        }
      }
    };

    fetchProfileImage();
  }, []);

  const isActive = (screenName) => route.name === screenName;

  return (
    <View style={styles.navbar}>
      {/* Home */}
      <TouchableOpacity onPress={() => navigation.navigate('Home')}>
        <Ionicons
          name={isActive('Home') ? 'home' : 'home-outline'}
          size={28}
          color={isActive('Home') ? '#E50914' : '#555'}
        />
      </TouchableOpacity>

      {/* Organization */}
      <TouchableOpacity
        onPress={() => {
            if (role === 'admin') {
            navigation.navigate('OrganizationPageRSO');
            } else if (role === 'superadmin') {
            navigation.navigate('OrganizationPageSAO');
            } else {
            navigation.navigate('OrganizationPage');
            }
        }}
        >
        <Ionicons
          name={isActive('OrganizationPage') ? 'people' : 'people-outline'}
          size={28}
          color={isActive('OrganizationPage') ? '#E50914' : '#555'}
        />
      </TouchableOpacity>

      {/* Event */}
      <TouchableOpacity onPress={() => navigation.navigate('Events')}>
        <Ionicons
          name={isActive('Events') ? 'calendar' : 'calendar-outline'}
          size={28}
          color={isActive('Events') ? '#E50914' : '#555'}
        />
      </TouchableOpacity>

      {/* Settings / Profile */}
      <TouchableOpacity onPress={() => navigation.navigate('UserOwnProfilePage')}>
        {userProfileImage ? (
          <Image 
            source={{ uri: userProfileImage }} 
            style={[
              styles.profileImage, 
              isActive('UserOwnProfilePage') && { borderColor: '#E50914', borderWidth: 2 }
            ]}
          />
        ) : (
          <FontAwesome 
            name={isActive('UserOwnProfilePage') ? 'user-circle' : 'user-circle-o'}
            size={40}
            color={isActive('UserOwnProfilePage') ? '#E50914' : '#555'}
            style={styles.profileIcon}
          />
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  navbar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    height: 70,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  profileImage: {
    width: 30,       // 👈 increase or decrease as needed
    height: 30,
    borderRadius: 25,
    marginRight: 10,
  },
  
  profileIcon: {
    fontSize: 30,    // 👈 matches the profileImage size
    marginRight: 10,
  },
});

export default BottomNavBar;
