import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Image,
  SafeAreaView, ScrollView, Modal, TextInput, KeyboardAvoidingView,
  Platform
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons, FontAwesome, MaterialIcons } from '@expo/vector-icons';
import Header from '../components/header';
import BottomNavBar from '../components/bottomNavBar';

export default function Home() {
  const navigation = useNavigation();
  const [userProfileImage, setUserProfileImage] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [postText, setPostText] = useState('');

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Header />

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.postContainer}>
            {userProfileImage ? (
              <Image source={{ uri: userProfileImage }} style={styles.profileImage} />
            ) : (
              <FontAwesome name="user-circle-o" size={50} color="#999" style={styles.profileIcon} />
            )}

            <TouchableOpacity
              style={styles.postInputContainer}
              onPress={() => setIsModalVisible(true)}
            >
              <Text style={styles.placeholderText}>What's on your mind?</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setIsModalVisible(true)}>
              <Ionicons name="add-circle-outline" size={30} color="#333" />
            </TouchableOpacity>
          </View>
        </ScrollView>

        <BottomNavBar />

        {/* 🔽 Modal Bottom Sheet */}
        <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent={true}
        >
        <KeyboardAvoidingView
            style={styles.modalBackground}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <View style={styles.modalContent}>
            {/* Header Row */}
            <View style={styles.modalHeader}>
                <TouchableOpacity onPress={() => setIsModalVisible(false)}>
                <Ionicons name="close" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.modalTitle}>Create Post</Text>
                <TouchableOpacity style={styles.postTextButton} onPress={() => {/* handle post */}}>
                <Text style={styles.postText}>Post</Text>
                </TouchableOpacity>
            </View>

            {/* Profile Row */}
            <View style={styles.profileRow}>
                {userProfileImage ? (
                <Image source={{ uri: userProfileImage }} style={styles.profileImagePost} />
                ) : (
                <FontAwesome name="user-circle-o" size={30} color="#999" />
                )}
                <Text style={styles.userName}>Andrew Robles</Text>
            </View>

            {/* Text Input */}
            <TextInput
                placeholder="What's on your mind?"
                placeholderTextColor="#777"
                multiline
                value={postText}
                onChangeText={setPostText}
                style={styles.textInput}
            />


            {/* Options */}
            <View style={styles.optionsGrid}>
                <TouchableOpacity style={styles.optionButton}>
                    <MaterialIcons name="photo-library" size={24} color="#2e89ff" />
                    <Text style={styles.optionText}>Photo/Video</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.optionButton}>
                    <MaterialIcons name="event" size={24} color="#f28b20" />
                    <Text style={styles.optionText}>Create Event</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.optionButton}>
                    <Ionicons name="gift-outline" size={24} color="#e1306c" />
                    <Text style={styles.optionText}>Occasion</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.optionButton}>
                    <Ionicons name="document-text-outline" size={24} color="#34a853" />
                    <Text style={styles.optionText}>Document</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.optionButton}>
                    <MaterialIcons name="poll" size={24} color="#fb8c00" />
                    <Text style={styles.optionText}>Create Poll</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.optionButton}>
                    <MaterialIcons name="add-link" size={24} color="#6c63ff" />
                    <Text style={styles.optionText}>Add Link</Text>
                </TouchableOpacity>
            </View>


            </View>
        </KeyboardAvoidingView>
        </Modal>

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
    width: 30,       // 👈 increase or decrease as needed
    height: 30,
    borderRadius: 25,
    marginRight: 10,
  },
  profileImagePost: {
    width: 20,       // 👈 increase or decrease as needed
    height: 20,
    borderRadius: 25,
    marginRight: 10,
  },
  
  profileIcon: {
    fontSize: 30,    // 👈 matches the profileImage size
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
  modalBackground: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    height: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    flex: 1,
  },
  postTextButton: {
    backgroundColor: '#E50914',
    padding: 8,
    borderRadius: 5,
    fontSize: 16,
  },
  postText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  userName: {
    marginLeft: 10,
    fontSize: 16,
    fontWeight: 'bold',
  },
  textInput: {
    flex: 1,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 10,
    padding: 15,
    textAlignVertical: 'top',
    marginBottom: 20,
    minHeight: 100,
    fontSize: 16,
  },
  
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 20,
  },
  optionButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '30%',
    marginBottom: 20,
  },
  
  optionText: {
    marginTop: 5,
    textAlign: 'center',
    fontSize: 12,
    color: '#333',
  },
  
  
  
});
