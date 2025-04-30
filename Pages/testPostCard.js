import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, SafeAreaView, ScrollView, TouchableWithoutFeedback, Feedback, Keyboard, KeyboardAvoidingView, Platform} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Header from '../components/header';
import BottomNavBar from '../components/bottomNavBar';
import { Ionicons } from '@expo/vector-icons'; // for the plus icon
import PostCard from '../components/PostCard'; // adjust the path as needed


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
      
      const dummyFunctions = () => {};
      const dummyStateSetter = () => {};
      const dummySharedValue = { value: 0 }; // for reanimated values
      
      const dummyAnimatedStyle = {}; // optional for basic test
      
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

  });
  
