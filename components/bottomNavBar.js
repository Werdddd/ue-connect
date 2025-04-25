import React, { useState } from 'react'; 
import { View, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons'; // icons
import { FontAwesome } from '@expo/vector-icons'; 

const BottomNavBar = () => {
    const [userProfileImage, setUserProfileImage] = useState(null);
  return (
    <View style={styles.navbar}>
      <TouchableOpacity>
        <Ionicons name="home" size={28} color="#E50914" />
      </TouchableOpacity>
      <TouchableOpacity>
        <Feather name="users" size={28} color="black" />
      </TouchableOpacity>
      <TouchableOpacity>
        <Ionicons name="calendar-outline" size={28} color="black" />
      </TouchableOpacity>
      <TouchableOpacity>
      {userProfileImage ? (
              <Image source={{ uri: userProfileImage }} style={styles.profileImage} />
            ) : (
              <FontAwesome name="user-circle-o" size={40} color="#999" style={styles.profileIcon} />
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
