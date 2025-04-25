import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, SafeAreaView, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Header from '../components/header';
import BottomNavBar from '../components/bottomNavBar';
import { Ionicons } from '@expo/vector-icons'; // for the plus icon

export default function Home() {
  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Header />

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* New "What's on your mind" Section */}
          <View style={styles.postContainer}>
            <Image
              source={require('../assets/logo.png')} // Replace with user's profile if available
              style={styles.profileImage}
            />
            <View style={styles.postInputContainer}>
              <Text style={styles.placeholderText}>What's on your mind?</Text>
            </View>
            <TouchableOpacity>
              <Ionicons name="add-circle-outline" size={28} color="#333" />
            </TouchableOpacity>
          </View>

          {/* Other contents can go below if you want */}
        </ScrollView>

        <BottomNavBar />
      </View>
    </SafeAreaView>
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
  postContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 10,
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#E50914', // red border
    marginRight: 10,
  },
  postInputContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  placeholderText: {
    color: '#777',
    fontSize: 16,
  },
});
