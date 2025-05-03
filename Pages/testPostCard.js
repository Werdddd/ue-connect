import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, SafeAreaView, ScrollView, TouchableWithoutFeedback, Feedback, Keyboard, KeyboardAvoidingView, Platform} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Header from '../components/header';
import BottomNavBar from '../components/bottomNavBar';
import { Ionicons } from '@expo/vector-icons'; // for the plus icon
import PostCard from '../components/PostCard'; // adjust the path as needed
import { useState } from 'react';
import { Modal } from 'react-native';

export default function TestPostCard() {
    const navigation = useNavigation();
    const mockPost = {
        id: '1',
        user: {
          name: 'John Doe',
          profileImage: '', // leave empty to show fallback icon
          role: 'admin',
        },
        text: 'This is a sample post!',
        images: ['https://via.placeholder.com/150'],
        likedBy: ['user1', 'user2'],
        commentCount: 2,
      };
          const [name, setName] = useState({ firstName: '', lastName: '' });
      const dummyFunctions = () => {};
      const dummyStateSetter = () => {};
      const dummySharedValue = { value: 0 }; // for reanimated values
      
      const dummyAnimatedStyle = {}; // optional for basic test
      const [modalVisible, setModalVisible] = useState(false);
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
                        <PostCard
                            post={mockPost}
                            ss="admin"
                            hasText={true}
                            hasImages={true}
                            isLiked={true}
                            commentModalVisible={false}
                            shareModalVisible={false}
                            postComments={[]}
                            commentText=""
                            shareCaption=""
                            setCommentModalVisible={dummyStateSetter}
                            setShareModalVisible={dummyStateSetter}
                            setSelectedPostId={dummyStateSetter}
                            fetchComments={dummyFunctions}
                            handleCommentBackdropPress={dummyFunctions}
                            handleCommentGesture={dummyFunctions}
                            commentBackdropAnimatedStyle={dummyAnimatedStyle}
                            commentAnimatedStyle={dummyAnimatedStyle}
                            commentTranslateY={dummySharedValue}
                            commentBackdropOpacity={dummySharedValue}
                            setCommentText={dummyStateSetter}
                            handleAddComment={dummyFunctions}
                            setShareCaption={dummyStateSetter}
                            toggleLike={dummyFunctions}
                            />


                        <TouchableOpacity style={styles.switchAccountButton} onPress={() => setModalVisible(true)}>
                        <Ionicons name="swap-horizontal" size={20} color="#fff" style={{ marginRight: 8 }} />
                        <Text style={styles.switchAccountText}>Switch Account</Text>
                        </TouchableOpacity>

                        <Modal visible={modalVisible} animationType="slide" transparent>
  <View style={styles.modalOverlay}>
    <View style={styles.modalContainer}>
      <ScrollView contentContainerStyle={styles.modalScroll}>
        {/* User Profile at Top */}
        <TouchableOpacity style={styles.profileCard} onPress={() => {
          console.log('Switched to user profile');
          setModalVisible(false);
        }}>
          <Ionicons name="person-circle" size={40} color="#ff0000" />

          
          <Text style={styles.userName}>
                                              {name.firstName || name.lastName
                                              ? `${name.firstName} ${name.lastName}`.trim()
                                              : 'Unknown'}
                                              </Text>
        </TouchableOpacity>

        {/* List of Orgs */}
        {['ACSS', 'GDSC', 'ENSC'].map((org, index) => (
          <TouchableOpacity
            key={index}
            style={styles.orgCard}
            onPress={() => {
              console.log(`Switched to ${org}`);
              setModalVisible(false);
            }}
          >
            <Ionicons name="people-circle" size={32} color="#ff0000" />
            <Text style={styles.orgName}>{org}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisible(false)}>
        <Ionicons name="close-circle" size={28} color="gray" />
      </TouchableOpacity>
    </View>
  </View>
</Modal>


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
    switchAccountButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FF0000',
        paddingVertical: 12,
        borderRadius: 10,
        marginTop: 20,
        marginHorizontal: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 5,
      },
      switchAccountText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
      },
      modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
      },
      modalContainer: {
        width: '90%',
        backgroundColor: '#fff',
        borderRadius: 15,
        padding: 20,
        maxHeight: '70%',
      },
      modalScroll: {
        paddingVertical: 10,
      },
      profileCard: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 3,
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderColor: '#ddd',
      },
      userName: {
        fontSize: 18,
        marginLeft: 10,
        fontWeight: '600',
        color: '#333',
      },
      orgCard: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 5,
        borderBottomWidth: 1,
        borderColor: '#eee',
      },
      orgName: {
        fontSize: 16,
        marginLeft: 10,
        color: '#555',
      },
      closeButton: {
        position: 'absolute',
        top: 10,
        right: 10,
      },
      
  });
  
