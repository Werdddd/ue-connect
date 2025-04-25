import React from 'react';
import { View, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons'; // icons

const BottomNavBar = () => {
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
        <Image
          source={require('../assets/logo.png')} // replace with your profile picture path
          style={styles.profilePic}
        />
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
  profilePic: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
});

export default BottomNavBar;
