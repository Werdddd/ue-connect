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
import Animated, { useSharedValue, useAnimatedStyle, withSpring, runOnJS } from 'react-native-reanimated';
import { PanGestureHandler } from 'react-native-gesture-handler';
import * as ImagePicker from 'expo-image-picker';


export default function Home() {
  const navigation = useNavigation();
  const [userProfileImage, setUserProfileImage] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [postText, setPostText] = useState('');

  const [selectedImages, setSelectedImages] = useState([]);
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      alert('Permission to access gallery is required!');
      return;
    }
  
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true, // only works on web, for mobile use looping
      quality: 1,
    });
  
    if (!result.canceled) {
      // `result.assets` is an array of selected images
      const uris = result.assets.map((asset) => asset.uri);
      setSelectedImages([...selectedImages, ...uris]);
    }
  };
  
  const [isDiscardConfirmVisible, setIsDiscardConfirmVisible] = useState(false);

  const discardPost = () => {
    setPostText('');
    setSelectedImages([]);
    setIsModalVisible(false);
    setIsDiscardConfirmVisible(false);
    translateY.value = 0;
  };
  
  const keepEditing = () => {
    setIsDiscardConfirmVisible(false);
  };
  
  const translateY = useSharedValue(0);

  const closeModal = () => {
    if (postText.trim().length > 0 || selectedImages.length > 0) {
      setIsDiscardConfirmVisible(true);
    } else {
      setIsModalVisible(false);
      translateY.value = 0;
    }
  };
  

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const handleGesture = (event) => {
    if (event.nativeEvent.translationY > 100) {
      runOnJS(closeModal)();
    } else {
      translateY.value = withSpring(0);
    }
  };

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

        {isModalVisible && (
          <View style={StyleSheet.absoluteFill}>
            <TouchableOpacity style={styles.modalBackground} activeOpacity={1} onPress={closeModal} />
            
            <PanGestureHandler onEnded={handleGesture} onGestureEvent={(event) => {
              translateY.value = event.nativeEvent.translationY;
            }}>
              <Animated.View style={[styles.modalContent, animatedStyle]}>
              <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
              >
                <ScrollView
                  contentContainerStyle={{ flexGrow: 1 }}
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={false}
                >

                  
                  {/* Header */}
                  <View style={styles.modalHeader}>
                    <TouchableOpacity onPress={closeModal}>
                      <Ionicons name="close" size={24} color="#333" />
                    </TouchableOpacity>
                    <Text style={styles.modalTitle}>Create Post</Text>
                    <TouchableOpacity style={styles.postTextButton}>
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

                  <View style={styles.postContentContainer}>
                  {(postText.length > 0 || selectedImages.length > 0) ? (
                    <>
                      {postText.length > 0 && (
                        <TextInput
                          placeholder="What's on your mind?"
                          placeholderTextColor="#777"
                          multiline
                          value={postText}
                          onChangeText={setPostText}
                          style={styles.textOnly}
                        />
                      )}
                      {selectedImages.length > 0 && (
                        <View
                          style={[
                            styles.imageGrid,
                            { justifyContent: 'flex-start' }
                          ]}
                        >
                          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 10 }}>
                          {selectedImages.map((uri, index) => (
                            <View key={index} style={{ position: 'relative', marginRight: 10, marginBottom: 10 }}>
                              <Image
                                source={{ uri }}
                                style={{
                                  width: 80,
                                  height: 80,
                                  borderRadius: 10,
                                }}
                              />
                              <TouchableOpacity
                                onPress={() => {
                                  const updatedImages = selectedImages.filter((_, i) => i !== index);
                                  setSelectedImages(updatedImages);
                                }}
                                style={{
                                  position: 'absolute',
                                  top: -5,
                                  right: -5,
                                  backgroundColor: '#fff',
                                  borderRadius: 10,
                                  padding: 2,
                                  elevation: 3,
                                }}
                              >
                                <Ionicons name="close" size={16} color="#333" />
                              </TouchableOpacity>
                            </View>
                          ))}
                        </View>

                        </View>
                      )}
                    </>
                  ) : (
                    <TextInput
                      placeholder="What's on your mind?"
                      placeholderTextColor="#777"
                      multiline
                      value={postText}
                      onChangeText={setPostText}
                      style={styles.placeholderInput}
                    />
                  )}
                </View>



                  {/* Options */}
                  <View style={styles.optionsGrid}>
                      <TouchableOpacity style={styles.optionButton} onPress={pickImage}>
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
                </ScrollView>
              </KeyboardAvoidingView>
            </Animated.View>

            

          </PanGestureHandler>
          <Modal
              visible={isDiscardConfirmVisible}
              transparent
              animationType="fade"
            >
              <View style={styles.discardModalOverlay}>
                <View style={styles.discardModalBox}>
                  <Text style={styles.discardTitle}>Discard Post?</Text>
                  <Text style={styles.discardMessage}>You have unsaved changes. Are you sure you want to discard?</Text>

                  <View style={styles.discardButtons}>
                    <TouchableOpacity onPress={discardPost} style={styles.discardButton}>
                      <Text style={{ color: '#fff' }}>Discard</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={keepEditing} style={styles.keepButton}>
                      <Text style={{ color: '#333' }}>Keep Editing</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </Modal>
        </View>
      )}
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

  postContentContainer: {
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    minHeight: '60%',
    marginBottom: 20,
  },
  textOnly: {
    fontSize: 16,
    marginBottom: 10,
  },
  placeholderInput: {
    fontSize: 16,
    color: '#777',
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  imageItem: {
    borderRadius: 10,
  },
  singleImage: {
    width: '100%',
    height: 250,
    resizeMode: 'cover',
  },
  multipleImage: {
    width: 100,
    height: 100,
    resizeMode: 'cover',
    marginRight: 10,
    marginBottom: 10,
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
    height: '80%',
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
    minHeight: 390,
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
  
  discardModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  discardModalBox: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '80%',
    alignItems: 'center',
  },
  discardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  discardMessage: {
    fontSize: 14,
    color: '#555',
    textAlign: 'center',
    marginBottom: 20,
  },
  discardButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  discardButton: {
    flex: 1,
    backgroundColor: '#d11a2a',
    padding: 10,
    borderRadius: 8,
    marginRight: 10,
    alignItems: 'center',
  },
  keepButton: {
    flex: 1,
    backgroundColor: '#eee',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  
  
});
