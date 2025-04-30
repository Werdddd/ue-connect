import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Image,
  SafeAreaView, ScrollView, Modal, TextInput, KeyboardAvoidingView,
  Platform, TouchableWithoutFeedback, ActivityIndicator
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons, FontAwesome, MaterialIcons, Entypo } from '@expo/vector-icons';
import Header from '../components/header';
import BottomNavBar from '../components/bottomNavBar';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, runOnJS } from 'react-native-reanimated';
import { PanGestureHandler } from 'react-native-gesture-handler';
import * as ImagePicker from 'expo-image-picker';

import { getDoc, doc, collection, getDocs, updateDoc, arrayUnion, arrayRemove, addDoc, serverTimestamp, query, orderBy} from "firebase/firestore";
import { auth, firestore } from '../Firebase';
import { savePost } from '../Backend/uploadPost';

export default function Home() {
  const navigation = useNavigation();
  const [userProfileImage, setUserProfileImage] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [postText, setPostText] = useState('');
  const [selectedImages, setSelectedImages] = useState([]);
  const [searchQuery, setSearchQuery] = useState(''); // New state for search query
 const [loading, setLoading] = useState(false);
  const [newsfeedPosts, setNewsfeedPosts] = useState([]);
  const [userName, setusername] = useState('');
  const userComment = 'This is a sample comment.'; 
  const [selectedPostId, setSelectedPostId] = useState(null);
  const [scrollY, setScrollY] = useState(0);
  const [liked, setLiked] = useState(false);
  const [commentModalVisible, setCommentModalVisible] = useState(false);
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [shareCaption, setShareCaption] = useState('');
  const [currentUserEmail, setCurrentUserEmail] = useState('');
  const [postComments, setPostComments] = useState([]);
  const [commentCount, setCommentCount] = useState(0);
  const [comments, setComments] = useState([]);


  const toggleSearch = () => {
    setIsSearchVisible(!isSearchVisible);
  };

  // Function to filter posts based on search text
  const [filteredPosts, setFilteredPosts] = useState(newsfeedPosts);

  useEffect(() => {
    if (commentModalVisible && selectedPostId) {
      fetchComments(selectedPostId);
    }

    const user = auth.currentUser;
    if (user?.email) {
    setCurrentUserEmail(user.email);
    }

    const getUserData = async () => {
    const userDoc = await getDoc(doc(firestore, "Users", user.email));
    if (userDoc.exists()) {
        const userData = userDoc.data();
        setusername(`${userData.firstName} ${userData.lastName}`);
    }
    };
    getUserData();

    const fetchNewsfeed = async () => {
      try {
        const snapshot = await getDocs(collection(firestore, 'newsfeed'));
    
        // Use async callback in map
        const fetched = await Promise.all(
          snapshot.docs.map(async (doc) => {
            const d = doc.data();
    
            // Date handling
            const rawDate = d.date || d.timestamp;
            const dateObj = rawDate?.toDate
              ? rawDate.toDate()
              : new Date(rawDate || Date.now());
    
            // Normalize post images
            const images = (d.images || []).map(img =>
              img.startsWith('http')
                ? img
                : `data:image/jpeg;base64,${img}`
            );
    
            // Normalize profile image
            const rawProfileImage = d.profileImage || '';
            const profileImage = rawProfileImage.startsWith('http')
              ? rawProfileImage
              : rawProfileImage.length > 0
                ? `data:image/jpeg;base64,${rawProfileImage}`
                : '';
    
            // 🔥 Get comment count for this post
            const commentsSnapshot = await getDocs(
              collection(firestore, 'newsfeed', doc.id, 'comments')
            );
            const commentCount = commentsSnapshot.size;
    
            return {
              id: doc.id,
              text: d.text || '',
              date: dateObj,
              images,
              user: {
                name: d.userName || '',
                profileImage,
              },
              likedBy: d.likedBy || [],
              commentCount, // 👈 added here
            };
          })
        );
    
        setNewsfeedPosts(fetched.reverse());
      } catch (e) {
        console.error('Error fetching newsfeed:', e);
      }
    };
    

    fetchNewsfeed();
  }, [commentModalVisible, selectedPostId]);



  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      alert('Permission to access gallery is required!');
      return;
    }
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsMultipleSelection: true,
      quality: 1,
    });
    if (!result.canceled) {
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
    setLoading(false);
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

  const fetchComments = async (postId) => {
    try {
      const commentsSnapshot = await getDocs(
        collection(firestore, 'newsfeed', postId, 'comments')
      );
      const fetchedComments = commentsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
  
      console.log('Fetched comments:', fetchedComments);  // Log to check if comments are correct
  
      setComments(fetchedComments);  // Update state with fetched comments
      setPostComments(fetchedComments);
  
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };
  
  
  

  const handleAddComment = async () => {
    if (commentText.trim() === '') return;
  
    try {
      const userProfileImage = 'https://cdn-icons-png.flaticon.com/512/8762/8762984.png';
      const commentData = {
        text: commentText,
        userName: userName, // fetched from Firestore earlier
        profileImage: userProfileImage || '', // optional
        timestamp: serverTimestamp(),
      };
  
      // Add comment to Firestore
      await addDoc(collection(firestore, 'newsfeed', selectedPostId, 'comments'), commentData);
  
      // Reset the comment input field
      setCommentText('');
  
      // Immediately re-fetch the comments for the selected post to update the UI
      fetchComments(selectedPostId); // Custom function to fetch comments
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };
  

  const commentModalOpacity = useSharedValue(1);

  const commentModalAnimatedBackground = useAnimatedStyle(() => ({
    backgroundColor: `rgba(0,0,0,${commentModalOpacity.value})`
  }));

  const commentBackdropOpacity = useSharedValue(1);

 
  const commentBackdropAnimatedStyle = useAnimatedStyle(() => ({
    opacity: commentBackdropOpacity.value,
  }));

  const handleCommentGesture = (event) => {
    if (event.nativeEvent.translationY > 100) {
      runOnJS(() => {
        setCommentModalVisible(false);
        commentTranslateY.value = 0;
        commentBackdropOpacity.value = 1;
        setSelectedPostId(null);
      })();
    } else {
      commentTranslateY.value = withSpring(0);
    }
  };

  const handleCommentBackdropPress = () => {
    setCommentModalVisible(false);
    commentTranslateY.value = 0;
    commentBackdropOpacity.value = 1;
    setSelectedPostId(null);
    setPostComments([]);
  };

  const commentTranslateY = useSharedValue(0);

  const commentAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: commentTranslateY.value }],
  }));
  
  const [likedPosts, setLikedPosts] = useState({});

  const toggleLike = async (postId, likedBy) => {
    const postRef = doc(firestore, 'newsfeed', postId);
    const hasLiked = likedBy.includes(currentUserEmail);
  
    try {
      await updateDoc(postRef, {
        likedBy: hasLiked
          ? arrayRemove(currentUserEmail)
          : arrayUnion(currentUserEmail),
      });
  
      // Optimistically update UI
      setNewsfeedPosts(prev =>
        prev.map(p =>
          p.id === postId
            ? {
                ...p,
                likedBy: hasLiked
                  ? p.likedBy.filter(email => email !== currentUserEmail)
                  : [...p.likedBy, currentUserEmail],
              }
            : p
        )
      );
      
    } catch (e) {
      console.error('Error updating like:', e);
    }
  };  
  
  const handleSearch = (query) => {
    setSearchQuery(query);
  
    // Check if the query is empty, and display all posts if true
    if (query === '') {
      setFilteredPosts(posts); // Show all posts if search is cleared
    } else {
      // Filter posts based on title and content
      const filtered = posts.filter(post =>
        post.title.toLowerCase().includes(query.toLowerCase()) ||
        post.content.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredPosts(filtered);
    }
  };
  
  const handlePost = async () => {
    if (postText.trim() === '' && selectedImages.length === 0) return;
  
    // Get the current authenticated user
    const user = auth.currentUser;
  
    if (!user) {
      console.log("No user is logged in");
      return;
    }
    
    // Use the user's email as the document ID
    const userEmail = user.email;
  
    if (!userEmail) {
      console.log("No email found for the user");
      return;
    }
  
    // Query the Firestore collection using the email as the document ID
    const userDocRef = doc(firestore, "Users", userEmail);
    try {
      const userDoc = await getDoc(userDocRef);
  
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const { firstName, lastName, profileImage } = userData;
  
        // If no profile image is found, use a default image
        const userProfileImage = profileImage || 'https://cdn-icons-png.flaticon.com/512/8762/8762984.png';
  
        // Get current date (ensure it's a valid Date object)
        const postDate = new Date();
        if (!(postDate instanceof Date) || isNaN(postDate)) {
          console.error("Invalid Date object.");
          return;
        }
  
        const newPost = {
          user: {
            id: userEmail,
            name: `${firstName} ${lastName}`,
            profileImage: userProfileImage,
          },
          text: postText,
          images: selectedImages,
          date: postDate, // Add date here
          comments: [], // Initialize empty comments array
          likedBy: [],
        };
        setLoading(true);
        const postId = await savePost(newPost.user, postText, selectedImages);
        //const postId = 2202;
        console.log(newPost);
        setNewsfeedPosts([{ ...newPost, id: postId }, ...newsfeedPosts]);
        discardPost(
          
        );
        
      } else {
        console.log("No such user found in Firestore");
      }
    } catch (error) {
      console.error("Error getting user document:", error);
    }
  };

  const renderPost = (post) => {
    const formattedDate = post.date.toLocaleString();
    const hasText = post.text.trim().length > 0;
    const hasImages = post.images.length > 0;
    const isLiked = (post.likedBy || []).includes(currentUserEmail);


    
    return (
      <View key={post.id} style={styles.postCard}>
        {/* Post Header */}
        <View style={styles.postHeader}>
          <View style={styles.postUserInfo}>
            {post.user.profileImage ? (
              <Image source={{ uri: post.user.profileImage }} style={styles.profileImagePost} />
            ) : (
              <FontAwesome name="user-circle-o" size={35} color="#999" />
            )}
            <View style={{ marginLeft: 10 }}>
              <Text style={styles.postUserName}>{post.user.name}</Text>
              <Text style={styles.postDate}>{formattedDate}</Text>
            </View>
          </View>
          <TouchableOpacity>
            <Entypo name="dots-three-horizontal" size={20} color="#333" />
          </TouchableOpacity>
        </View>

        {/* Post Content */}
        <View style={styles.postBody}>
          {hasText && <Text style={styles.postTextContent}>{post.text}</Text>}
          {hasImages && (
            <View style={styles.postImagesContainer}>
              {post.images.map((uri, idx) => (
                <Image
                  key={idx}
                  source={{ uri }}
                  style={styles.postImage}
                />
              ))}
            </View>
          )}
        </View>

        {/* Post Actions */}
            <View style={styles.postActions}>
            <TouchableOpacity
                style={styles.actionButton}
                onPress={() => toggleLike(post.id, post.likedBy)}
            >
                <Ionicons
                name={isLiked ? 'heart' : 'heart-outline'}
                size={20}
                color={isLiked ? 'red' : '#555'}
                />
                <Text style={styles.actionText}>
                {(post.likedBy || []).length} Like{(post.likedBy || []).length !== 1 ? 's' : ''}
                </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => {
                setSelectedPostId(post.id); // set selected post
                setCommentModalVisible(true);
                fetchComments(post.id); 
              }}
            >
              <Ionicons name="chatbubble-outline" size={20} color="#555" />
              <Text style={styles.actionText}>
                {(post.commentCount || 0)} Comment{(post.commentCount || 0) !== 1 ? 's' : ''}
              </Text>
            </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={() => setShareModalVisible(true)}>
            <Ionicons name="share-social-outline" size={20} color="#555" />
            <Text style={styles.actionText}>Share</Text>
          </TouchableOpacity>
        </View>

        <Modal
          visible={commentModalVisible}
          animationType="none"
          transparent={true}
          onRequestClose={handleCommentBackdropPress}
        >
          <TouchableWithoutFeedback onPress={handleCommentBackdropPress}>
            <Animated.View style={[styles.modalContainer, commentBackdropAnimatedStyle]}>
              <PanGestureHandler
                onGestureEvent={(event) => {
                  commentTranslateY.value = event.nativeEvent.translationY;
                  commentBackdropOpacity.value = 1 - (event.nativeEvent.translationY / 300);
                }}
                onEnded={handleCommentGesture}
              >
                <Animated.View style={[styles.commentModalContent, commentAnimatedStyle]}>
                  <KeyboardAvoidingView
                        style={{ flex: 1 }}
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                        keyboardVerticalOffset={Platform.OS === 'ios' ? 390 : 0}
                      >
                      <ScrollView
                        contentContainerStyle={{ flexGrow: 1 }}
                        keyboardShouldPersistTaps="handled"
                        showsVerticalScrollIndicator={false}
                      >

                        
            <Text style={styles.commentsTitle}>Comments</Text>
            {/* Comment List */}
            <ScrollView>
              {postComments.map((comment) => (
                <View key={comment.id} style={styles.commentCard}>
                  {comment.profileImage ? (
                      <Image
                        source={{ uri: comment.profileImage }}
                        style={styles.profileImagePost}
                      />
                    ) : (
                      <FontAwesome name="user-circle-o" size={38} color="#999" />
                  )}
                    <View>
                    <Text style={styles.commentUserName}>
                      {comment.userName || 'Anonymous'}
                    </Text>
                      <Text style={styles.userComment}>{comment.text}</Text>
                    </View>
                  </View>
                ))}
              </ScrollView>

              {/* Input at Bottom */}
              <View style={styles.commentInputRow}>
              {post.user.profileImage ? (
                <Image source={{ uri: post.user.profileImage }} style={styles.profileImagePost} />
              ) : (
                <FontAwesome name="user-circle-o" size={35} color="#999" />
              )}
                <TextInput
                  style={styles.commentInput}
                  placeholder="Add a comment..."
                  value={commentText}
                  onChangeText={setCommentText}
                />
                <TouchableOpacity onPress={handleAddComment}>
                  <Ionicons name="send" size={24} color="#ff0000" />
                </TouchableOpacity>

              </View>
            
            </ScrollView>
            </KeyboardAvoidingView>
            </Animated.View>
            </PanGestureHandler>
            
          </Animated.View>
          
        </TouchableWithoutFeedback>

              
    </Modal>

        <Modal
          visible={shareModalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShareModalVisible(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.shareModalContent}>
              {/* User Info */}
              <View style={styles.shareHeader}>
                <Image source={{ uri: 'user_profile_url' }} style={styles.shareProfilePic} />
                <Text style={styles.shareUsername}>Username</Text>
              </View>

              {/* Caption Input */}
              <TextInput
                style={styles.shareCaptionInput}
                placeholder="Write a caption..."
                multiline
                value={shareCaption}
                onChangeText={setShareCaption}
              />

              {/* Share Now Button */}
              <TouchableOpacity style={styles.shareButton} onPress={() => {/* share post */}}>
                <Text style={styles.shareButtonText}>Share Now</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>


      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {loading && (
                      <View style={styles.loadingContainer}>
                        <View style={styles.loadingBox}>
                          <ActivityIndicator size="large" color="#FE070C" />
                          {/* <Text style={{ marginTop: 10 }}>Logging your account...</Text> */}
                        </View>
                      </View>
                    )}
      <View style={styles.container}>
      <Header
        posts={filteredPosts} // Send filtered posts as props
        setFilteredPosts={setFilteredPosts} // Send setter function as props
        scrollY={scrollY}
      />

        <ScrollView
          onScroll={(event) => {
          setScrollY(event.nativeEvent.contentOffset.y);
          }}
          scrollEventThrottle={16}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
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

          {/* Render Newsfeed */}
          {newsfeedPosts.map((post) => renderPost(post))}
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
                    <View style={styles.modalHeader}>
                      <TouchableOpacity onPress={closeModal}>
                        <Ionicons name="close" size={24} color="#333" />
                      </TouchableOpacity>
                      <Text style={styles.modalTitle}>Create Post</Text>
                      <TouchableOpacity style={styles.postTextButton} onPress={handlePost}>
                        <Text style={styles.postText}>Post</Text>
                      </TouchableOpacity>
                    </View>

                    <View style={styles.profileRow}>
                      {userProfileImage ? (
                        <Image source={{ uri: userProfileImage }} style={styles.profileImagePost} />
                      ) : (
                        <FontAwesome name="user-circle-o" size={30} color="#999" />
                      )}
                      <Text style={styles.userName}>{userName}</Text>
                    </View>

                    <View style={styles.postContentContainer}>
                      <TextInput
                        placeholder="What's on your mind?"
                        placeholderTextColor="#777"
                        multiline
                        value={postText}
                        onChangeText={setPostText}
                        style={styles.placeholderInput}
                      />

                      {selectedImages.length > 0 && (
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 10 }}>
                          {selectedImages.map((uri, index) => (
                            <View key={index} style={{ position: 'relative', marginRight: 10, marginBottom: 10 }}>
                              <Image
                                source={{ uri }}
                                style={{ width: 80, height: 80, borderRadius: 10 }}
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
    // shadowColor: '#000',
    // shadowOffset: { width: 0, height: 1 },
    // shadowOpacity: 0.1,
    // shadowRadius: 2,
    // elevation: 2,
    borderBottomColor: '#ccc',
    borderBottomWidth: 1,
    marginBottom: 15,
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
  postCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    
    marginBottom: 15,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  postUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  postUserName: {
    
    fontSize: 16,
    fontWeight: 'bold',
  },
  postDate: {
    fontSize: 12,
    color: '#888',
  },
  postBody: {
    marginTop: 5,
  },
  postTextContent: {
    fontSize: 16,
    color: '#333',
    marginBottom: 10,
  },
  postImagesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
  },
  postImage: {
    width: 100,
    height: 100,
    borderRadius: 10,
    marginRight: 5,
    marginBottom: 5,
  },
  postActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 10,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  actionText: {
    color: '#555',
    fontSize: 14,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
  },
  
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  
  commentModalContent: {
    height: '60%',
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    
  },
  
  commentCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  
  commentsTitle: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 13,
    paddingBottom: 10,
    borderBottomColor: '#555',
    borderBottomWidth: 1,
  },
  
  commentUserName: {
    marginLeft: 10,
    fontSize: 16,
    fontWeight: '600',
  },
  userComment: {
    fontSize: 14,
    color: '#000',
    marginLeft: 10,
    marginTop: 2,
    fontWeight: '400',
  },
  
  commentInputRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderColor: "#eee",
    backgroundColor: "#fff",
    marginBottom: 10,
  },
  
  commentInput: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginHorizontal: 10,
  },
  
  shareModalContent: {
    height: '50%',
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 15,
  },
  
  shareHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  
  shareProfilePic: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  
  shareUsername: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  
  shareCaptionInput: {
    flex: 1,
    minHeight: 100,
    textAlignVertical: 'top',
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    padding: 10,
    marginBottom: 20,
  },
  
  shareButton: {
    backgroundColor: '#007bff',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  
  shareButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  loadingBox: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
});
