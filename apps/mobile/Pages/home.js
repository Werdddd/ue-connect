import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Image,
  SafeAreaView, ScrollView, Modal, TextInput, KeyboardAvoidingView,
  Platform, TouchableWithoutFeedback, ActivityIndicator,
  Dimensions
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons, FontAwesome, MaterialIcons, Entypo } from '@expo/vector-icons';
import Header from '../components/header';
import BottomNavBar from '../components/bottomNavBar';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, runOnJS, withSequence, withTiming } from 'react-native-reanimated';
import { PanGestureHandler } from 'react-native-gesture-handler';
import * as ImagePicker from 'expo-image-picker';

import { getDoc, doc, collection, getDocs, updateDoc, arrayUnion, arrayRemove, addDoc, serverTimestamp, query, orderBy } from "firebase/firestore";
import { firestore, auth } from '../Firebase';
import { savePost } from '../Backend/uploadPost';
import { sendNotification } from '../Backend/notifications';
import EventCard from '../components/eventCard';
import { fetchEvents, addEvent } from '../Backend/eventPage';

import { calculateCosineSimilarity, buildInteractionMatrix, generateItemBasedRecommendations } from '../Backend/recommendation';

const { width: screenWidth } = Dimensions.get('window');

export default function Home() {
  const navigation = useNavigation();
  const [userProfileImage, setUserProfileImage] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [postText, setPostText] = useState('');
  const [selectedImages, setSelectedImages] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [newsfeedPosts, setNewsfeedPosts] = useState([]);
  const [userName, setusername] = useState('');
  const [selectedPostId, setSelectedPostId] = useState(null);
  const [scrollY, setScrollY] = useState(0);
  const [commentModalVisible, setCommentModalVisible] = useState(false);
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [shareCaption, setShareCaption] = useState('');
  const [role, setRole] = useState('');
  const [group, setGroup] = useState(false);
  const [isEventPost, setIsEventPost] = useState(false);
  const [currentUserEmail, setCurrentUserEmail] = useState('');
  const [postComments, setPostComments] = useState([]);
  const [comments, setComments] = useState([]);
  const [filterEventOnly, setFilterEventOnly] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const ss = "superadmin";
  const ss2 = "sheen";
  const [currentUserInfo, setCurrentUserInfo] = useState({
    firstName: '',
    lastName: '',
    profileImage: null,
  });

  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [galleryImages, setGalleryImages] = useState([]);
  const [initialIndex, setInitialIndex] = useState(0);
  const scrollRef = useRef(null);

  const [allUsers, setAllUsers] = useState([]);
  const [recommendedPosts, setRecommendedPosts] = useState([]);

  const openImage = (allUris, tappedUri) => {
    setGalleryImages(allUris);
    const initialIndex = allUris.findIndex(uri => uri === tappedUri);
    setInitialIndex(initialIndex);
    setImageModalVisible(true);
  };

  const [didInitialScroll, setDidInitialScroll] = useState(false);
  const closeModalImage = () => {
    setImageModalVisible(false);
    setGalleryImages([]);
    setInitialIndex(0);
    setDidInitialScroll(false);
  };

  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const toggleSearch = () => {
    setIsSearchVisible(!isSearchVisible);
  };

  const [filteredPosts, setFilteredPosts] = useState([]);

  const PAGE_SIZE = 10;
  const [visiblePosts, setVisiblePosts] = useState([]);
  const [page, setPage] = useState(1);

  const runRecommendationEngine = (targetUserEmail, posts, users) => {
    if (!targetUserEmail || posts.length === 0 || users.length === 0) {
      setRecommendedPosts([]);
      return;
    }

    const likedPostIds = posts
      .filter(post => (post.likedBy || []).includes(targetUserEmail))
      .map(post => post.id);

    const selfAuthoredPostIds = posts
      .filter(post => post.userId === targetUserEmail)
      .map(post => post.id);

    const interactionMatrix = buildInteractionMatrix(posts, users);
    const recommendedPostIds = generateItemBasedRecommendations(
      interactionMatrix,
      targetUserEmail,
      likedPostIds,
      selfAuthoredPostIds
    );

    const recommendations = posts
      .filter(post => recommendedPostIds.includes(post.id))
      .sort((a, b) => recommendedPostIds.indexOf(a.id) - recommendedPostIds.indexOf(b.id));

    setRecommendedPosts(recommendations);

    console.log(`Generated ${recommendations.length} recommendations.`);
  };

  useEffect(() => {
    if (commentModalVisible && selectedPostId) {
      fetchComments(selectedPostId);
    }

    const user = auth.currentUser;
    if (user?.email) {
      setCurrentUserEmail(user.email);
    }

    const getUserData = async () => {
      if (!user?.email) return;
      try {
        const userDoc = await getDoc(doc(firestore, "Users", user.email));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setusername(`${userData.firstName} ${userData.lastName}`);
          if (userData?.profileImage) {
            const isBase64 = !userData.profileImage.startsWith('http');
            const imageSource = isBase64
              ? `${userData.profileImage}`
              : userData.profileImage;

            setUserProfileImage(imageSource);
          }
          setRole(userData.role);
          setGroup(userData.group);
        }
      } catch (err) {
        console.warn('Error fetching user data in getUserData:', err);
      }
    };
    getUserData();

    const fetchNewsfeedAndUsers = async () => {
      setLoading(true);
      const email = auth.currentUser?.email;
      if (!email) {
        setLoading(false);
        return;
      }
      try {
        const usersSnapshot = await getDocs(collection(firestore, 'Users'));
        const fetchedUsers = usersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setAllUsers(fetchedUsers);
        const snapshot = await getDocs(query(collection(firestore, 'newsfeed'), orderBy('timestamp', 'desc')));
        const fetchedPosts = await Promise.all(
          snapshot.docs.map(async (docSnap) => {
            const d = docSnap.data();
            const rawDate = d.date || d.timestamp;
            const dateObj = rawDate?.toDate
              ? rawDate.toDate()
              : new Date(rawDate || Date.now());
            const images = (d.images || []).map((img) =>
              img.startsWith('http') ? img : `data:image/jpeg;base64,${img}`

            );

            const commentsSnapshot = await
              getDocs(
                collection(firestore, 'newsfeed', docSnap.id, 'comments')
              );
            const commentCount = commentsSnapshot.size;
            let profileImage =
              'https://mactaggartfp.com/manage/wp-content/uploads/default-profile.jpg';
            let userName = d.userName || 'Anonymous';

            let role = '';
            if (d.userId) {
              try {
                const userData = fetchedUsers.find(u => u.id === d.userId);
                if (userData) {
                  userName =
                    userData.firstName && userData.lastName
                      ?
                      `${userData.firstName} ${userData.lastName}`
                      : userData.firstName ||
                      'Anonymous';

                  profileImage = userData.profileImage || profileImage;
                  role = userData.role || '';
                }
              } catch (err) {
                console.warn(`Failed to get user data for ${d.userId}`, err);
              }
            }

            return {
              id: docSnap.id,
              text: d.text ||
                '',
              date: dateObj,
              images,
              userId: d.userId, // This is the email
              user: {
                name: userName,

                profileImage,

                role,
              },
              likedBy: d.likedBy ||
                [], // This is an array of emails
              commentCount,
              pinned: d.pinned === true,
              isEvent: d.isEvent === true,
            };
          })
        );

        const events = await fetchEvents();
        const eventPosts = events.map(event => {
          // Prefer Firestore createdAt timestamp
          let eventDate = null;
          if (event.createdAt && typeof event.createdAt.toDate === 'function') {
            eventDate = event.createdAt.toDate();
          } else if (event.date) {
            eventDate = new Date(event.date);
          }

          return {
            id: event.id,
            text: event.description || event.title || '',
            date: eventDate, // Use normalized date
            images: event.images || [],
            userId: event.organizerId || '',
            user: {
              name: event.organizerName || 'Event',
              profileImage: event.organizerImage || 'default_event_image_url',
              role: 'event',

            },
            likedBy: [],
            commentCount: 0,
            pinned: false,
            isEvent: true,
            eventData: event,
          };
        });
        const allPosts = [...fetchedPosts, ...eventPosts];

        if (fetchedUsers.length > 0) {
          runRecommendationEngine(email, allPosts, fetchedUsers);
        }

        const sortedPosts = allPosts.sort((a, b) => {
          const aTime = a.date instanceof Date && !isNaN(a.date) ? a.date.getTime() : null;
          const bTime = b.date instanceof Date && !isNaN(b.date) ? b.date.getTime() : null;

          if (aTime && bTime) return bTime - aTime;
          if (aTime && !bTime) return -1;
          if (!aTime && bTime) return 1;
          return 0;
        });

        setNewsfeedPosts(sortedPosts);
        setFilteredPosts(sortedPosts);

      } catch (e) {
        console.error('Error fetching newsfeed or users:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchNewsfeedAndUsers();
  }, [commentModalVisible, selectedPostId]);

  useEffect(() => {
    const fetchUserInfo = async () => {
      if (!shareModalVisible) return;

      const user = auth.currentUser;
      if (!user?.email) return;

      const userDocRef = doc(firestore, 'Users', user.email);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const data = userDoc.data();
        setCurrentUserInfo({
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          profileImage: data.profileImage ? `${data.profileImage}` : null,
        });
      }
    };

    fetchUserInfo();
  }, [shareModalVisible]);

  useEffect(() => {
    if (newsfeedPosts.length > 0) {
      const nonRecommendedPosts = newsfeedPosts.filter(
        post => !recommendedPosts.some(rec => rec.id === post.id)
      );
      const initialFeed = [
        ...recommendedPosts,
        ...nonRecommendedPosts
      ];
      setVisiblePosts(initialFeed.slice(0, PAGE_SIZE));
    }
  }, [newsfeedPosts, recommendedPosts]);

  const loadMorePosts = () => {
    if (loadingMore) return;
    setLoadingMore(true);
    const nextPage = page + 1;
    const start = (nextPage - 1) * PAGE_SIZE;
    const end = nextPage * PAGE_SIZE;
    const combinedFeed = [
      ...recommendedPosts,
      ...newsfeedPosts.filter(post => !recommendedPosts.some(rec => rec.id === post.id))
    ];

    if (start < combinedFeed.length) {
      setVisiblePosts(prev => {
        const nextPosts = combinedFeed.slice(start, end);
        const filtered = nextPosts.filter(
          np => !prev.some(p => p.id === np.id)
        );
        return [...prev, ...filtered];
      });
      setPage(nextPage);
    }
    setLoadingMore(false);
  };

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
      const commentsData = await Promise.all(
        commentsSnapshot.docs.map(async (docSnapshot) => {
          const comment = docSnapshot.data();
          const userEmail = comment.email;

          let profileImage = null;

          if (userEmail) {
            try {
              const userDocRef = doc(firestore, 'Users', userEmail);
              const userDoc = await
                getDoc(userDocRef);

              if (userDoc.exists()) {
                profileImage = userDoc.data().profileImage || null;
              }
            } catch (error) {
              console.warn(`Error fetching user data for ${userEmail}:`, error);
            }
          }


          return {
            id: docSnapshot.id,
            ...comment,
            profileImage,
          };
        })
      );
      setComments(commentsData);
      setPostComments(commentsData);

    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };
  const handleAddComment = async () => {
    if (commentText.trim() === '') return;
    try {
      const commentData = {
        text: commentText,
        userName: userName,
        profileImage: userProfileImage ||
          'https://mactaggartfp.com/manage/wp-content/uploads/default-profile.jpg',
        timestamp: serverTimestamp(),
        email: currentUserEmail,
      };
      await addDoc(collection(firestore, 'newsfeed', selectedPostId, 'comments'), commentData);

      setCommentText('');

      const postRef = doc(firestore, 'newsfeed', selectedPostId);
      const postSnap = await getDoc(postRef);
      if (postSnap.exists()) {
        const postData = postSnap.data();
        const postOwner = postData.userId;
        if (postOwner && postOwner !== currentUserEmail) {
          await sendNotification({
            userId: postOwner,
            type: 'comment',
            content: `${userName} commented on your post.`,
          });
        }
      }

      fetchComments(selectedPostId);
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
      setVisiblePosts(prev =>
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
      if (!hasLiked) {
        const postSnap = await getDoc(postRef);
        const postData = postSnap.data();
        const postOwner = postData.userId;

        if (postOwner && postOwner !== currentUserEmail) {
          await sendNotification({
            userId: postOwner,
            type: 'like',
            content: `${userName} liked your post.`,
          });
        }
      }
    } catch (e) {
      console.error('Error updating like or sending notification:', e);
    }
  };


  const handleSearch = (query) => {
    setSearchQuery(query);
    if (query === '') {
      setFilteredPosts(newsfeedPosts);
    } else {
      const filtered = newsfeedPosts.filter(post =>
        (post.user?.name || '').toLowerCase().includes(query.toLowerCase()) ||
        (post.text || '').toLowerCase().includes(query.toLowerCase())
      );
      setFilteredPosts(filtered);
    }
  };

  const handleSharePost = async () => {
    if (!selectedPostId) return; // the post the user wants to share
    const user = auth.currentUser;
    if (!user) return;

    const userEmail = user.email;
    if (!userEmail) return;

    const userDocRef = doc(firestore, "Users", userEmail);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) return;

    const userData = userDoc.data();
    const { firstName, lastName, profileImage, role } = userData;

    const newSharedPost = {
      user: {
        id: userEmail,
        name: `${firstName} ${lastName}`,
        profileImage: profileImage || 'https://mactaggartfp.com/manage/wp-content/uploads/default-profile.jpg',
        role,
      },
      text: shareCaption || '',                    // the text the user adds in share modal
      images: [],                                  // shared posts usually don’t add new images
      date: new Date(),
      isEvent: false,
      comments: [],
      likedBy: [],
      sharedPostId: selectedPostId,               // reference to original post
      sharedPostData: newsfeedPosts.find(p => p.id === selectedPostId), // optional for fast rendering
    };

    // Save to Firestore
    const postId = await savePost(newSharedPost.user, newSharedPost.text, newSharedPost.images, false, {
      sharedPostId: newSharedPost.sharedPostId,
      sharedPostData: newSharedPost.sharedPostData
    });

    setNewsfeedPosts(prev => [{ ...newSharedPost, id: postId }, ...prev]);
    setVisiblePosts(prev => [{ ...newSharedPost, id: postId }, ...prev]);
    setShareModalVisible(false);
    setShareCaption('');
  };

  const handlePost = async () => {
    if (postText.trim() === '' && selectedImages.length === 0) return;
    const user = auth.currentUser;

    if (!user) {
      console.log("No user is logged in");
      return;
    }

    const userEmail = user.email;

    if (!userEmail) {
      console.log("No email found for the user");
      return;
    }

    const userDocRef = doc(firestore, "Users", userEmail);
    try {
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const { firstName, lastName, profileImage, role } = userData;

        const userProfileImage = profileImage || 'https://mactaggartfp.com/manage/wp-content/uploads/default-profile.jpg';

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
            role,
          },
          text: postText,

          images: selectedImages,
          date: postDate,
          isEvent: isEventPost,
          comments: [],
          likedBy: [],
        };
        setLoading(true);
        const postId = await savePost(newPost.user, postText, selectedImages, isEventPost);
        setNewsfeedPosts(prev => [{ ...newPost, id: postId }, ...prev]);
        setVisiblePosts(prev => [{ ...newPost, id: postId }, ...prev]);
        discardPost();

      } else {
        console.log("No such user found in Firestore");
      }
    } catch (error) {
      console.error("Error getting user document:", error);
    }
  };

  const renderPost = (post) => {

    const isRecommended = recommendedPosts.some(recPost => recPost.id === post.id);

    if (post.eventData) {
      return (
        <EventCard
          key={post.id}
          event={post.eventData}
        />
      );
    }

    const formattedDate = post.date.toLocaleString();
    const hasText = post.text.trim().length > 0;
    const hasImages = post.images.length > 0;
    const isLiked = (post.likedBy || []).includes(currentUserEmail);
    const isSingleImage = post.images.length === 1;

    return (
      <View
        key={post.id}
        post={post}
        style={[
          styles.postCard,
          post.isEvent && styles.eventPostCard
        ]}
      >
        {post.isEvent && (
          <Text style={styles.eventBadge}>Event</Text>
        )}

        {isRecommended && (
          <View style={styles.recommendationBadge}>
            <Ionicons name="sparkles" size={14} color="#FFD700" />
            <Text style={styles.recommendationText}>Recommended</Text>
          </View>
        )}

        <View style={styles.postHeader}>
          <View style={styles.postUserInfo}>
            <TouchableOpacity
              onPress={() => {
                if (currentUserEmail !== post.userId) {
                  navigation.navigate('UserOpen', {

                    postId: post.id,
                    postEmail: post.userId,
                  });
                } else {
                  navigation.navigate('UserOwnProfilePage');

                }
              }}
            >
              {post.user.profileImage ? (
                <Image
                  source={{ uri: post.user.profileImage }}

                  style={styles.profileImagePost}
                  resizeMode="cover"
                />
              ) : (
                <FontAwesome name="user-circle-o" size={35} color="#999" />
              )}
            </TouchableOpacity>

            <View style={{ flexDirection: 'column', marginLeft: 10 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={styles.postUserName}>{post.user.name}</Text>

                {(post.user.role === ss ||
                  post.user.role === ss2) && (
                    <Image
                      source={require('../assets/switch2.png')}
                      style={{ width: 16, height: 16, marginLeft: 5 }}
                    />

                  )}
              </View>
              <Text style={styles.postDate}>
                {new Date(post.date).toLocaleString()}
              </Text>

            </View>
          </View>
          {post.pinned && (
            <Image
              source={require('../assets/pin.png')}
              style={styles.pinIcon}
            />
          )}

          <TouchableOpacity>
            <Entypo name="dots-three-horizontal" size={20} color="#333" />
          </TouchableOpacity>
        </View>

        <View style={styles.postBody}>
          {hasText && <Text style={styles.postTextContent}>{post.text}</Text>}

          {/* {isShared && (
            <View style={styles.sharedPostWrapper}>
              <Text style={styles.sharedBadge}>
                Shared from {post.sharedPostData.userName}
              </Text>
              {renderPost(post.sharedPostData)}
            </View>
          )} */}
          
          {hasImages && (
            <View style={styles.postImagesContainer}>
              {post.images.slice(0, 3).map((uri, idx) => (
                <TouchableOpacity
                  key={`${post.id}-img-${idx}`}
                  onPress={() => openImage(post.images, uri)}
                  style={isSingleImage ? styles.postImageWrapperSingle : styles.postImageWrapperMultiple}
                >
                  <Image
                    source={{ uri }}
                    style={isSingleImage ? styles.postImageSingle : styles.postImageThumbnail}
                  />
                  {post.images.length > 3 && idx === 2 && (
                    <View style={styles.moreImagesOverlay}>
                      <Text style={styles.moreImagesText}>
                        +{post.images.length - 2}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}

            </View>
          )}

        </View>

        <View style={styles.postActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => toggleLike(post.id, post.likedBy)}
          >
            <Ionicons

              name={isLiked ? 'heart' : 'heart-outline'}
              size={20}
              color={isLiked ?
                'red' : '#555'}
            />
            <Text style={styles.actionText}>
              {(post.likedBy || []).length} Like{(post.likedBy || []).length !== 1 ?
                's' : ''}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => {
              setSelectedPostId(post.id);
              setCommentModalVisible(true);
              fetchComments(post.id);
            }}
          >
            <Ionicons name="chatbubble-outline" size={20} color="#555" />
            <Text style={styles.actionText}>
              {(post.commentCount || 0)} Comment{(post.commentCount || 0) !== 1 ?
                's' : ''}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => {
              setSelectedPostId(post.id);
              setShareModalVisible(true);
            }}
          >
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
                    style={{
                      flex: 1
                    }}
                    behavior={Platform.OS === 'ios' ?
                      'padding' : 'height'}
                    keyboardVerticalOffset={Platform.OS === 'ios' ?
                      390 : 0}
                  >
                    <ScrollView
                      contentContainerStyle={{ flexGrow: 1 }}
                      keyboardShouldPersistTaps="handled"

                      showsVerticalScrollIndicator={false}
                    >


                      <Text style={styles.commentsTitle}>Comments</Text>
                      <ScrollView>

                        {postComments.map((comment) => (
                          <View key={comment.id} style={styles.commentCard}>
                            <TouchableOpacity
                              onPress={() => {
                                if (currentUserEmail !== comment.email) {

                                  navigation.navigate('UserOpen', {
                                    postId: comment.id,
                                    postEmail: comment.email,
                                  });
                                } else {

                                  navigation.navigate('UserOwnProfilePage');
                                }
                              }}
                            >
                              {comment.profileImage ?
                                (
                                  <Image
                                    source={{ uri: comment.profileImage }}
                                    style={styles.profileImagePost}
                                  />

                                ) : (
                                  <FontAwesome name="user-circle-o" size={38} color="#999" />
                                )}
                            </TouchableOpacity>
                            <View>

                              <Text style={styles.commentUserName}>
                                {comment.userName ||
                                  'Anonymous'}
                              </Text>
                              <Text style={styles.userComment}>{comment.text}</Text>
                            </View>
                          </View>
                        ))}

                      </ScrollView>
                      <View style={styles.commentInputRow}>
                        {userProfileImage ?
                          (
                            <Image source={{ uri: userProfileImage }} style={styles.profileImagePost} />
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
          <TouchableWithoutFeedback onPress={() => setShareModalVisible(false)}>
            <View style={styles.modalContainer} />
          </TouchableWithoutFeedback>

          <View style={styles.shareModalContent}>
            {/* Header with close button */}
            <View style={styles.shareModalHeader}>
              <Text style={styles.shareModalTitle}>Share Post</Text>
              <TouchableOpacity
                onPress={() => setShareModalVisible(false)}
                style={styles.closebtn}
              >
                <FontAwesome name="times" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            {/* Divider */}
            <View style={styles.divider} />

            {/* User info section */}
            <View style={styles.shareHeader}>
              {currentUserInfo.profileImage ? (
                <Image
                  source={{ uri: currentUserInfo.profileImage }}
                  style={styles.shareProfilePic}
                />
              ) : (
                <View style={styles.placeholderProfilePic}>
                  <FontAwesome name="user" size={24} color="#fff" />
                </View>
              )}
              <View style={styles.userInfoContainer}>
                <Text style={styles.shareUsername}>
                  {currentUserInfo.firstName} {currentUserInfo.lastName}
                </Text>
                <Text style={styles.shareSubtext}>Sharing to your timeline</Text>
              </View>
            </View>

            {/* Caption input with character count */}
            <View style={styles.captionContainer}>
              <TextInput
                style={styles.shareCaptionInput}
                placeholder="What's on your mind?"
                placeholderTextColor="#999"
                multiline
                maxLength={500}
                value={shareCaption}
                onChangeText={setShareCaption}
                textAlignVertical="top"
              />
              <Text style={styles.characterCount}>
                {shareCaption.length}/500
              </Text>
            </View>

            {/* Action buttons */}
            <View style={styles.shareActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setShareModalVisible(false);
                  setShareCaption(''); // Clear caption on cancel
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.shareButton,
                  !shareCaption.trim() && styles.shareButtonDisabled
                ]}
                onPress={() => {
                  if (shareCaption.trim()) {
                    handleSharePost();
                    setShareModalVisible(false);
                    setShareCaption(''); // Clear after sharing
                  }
                }}
                disabled={!shareCaption.trim()}
              >
                <FontAwesome
                  name="send"
                  size={16}
                  color="#fff"
                  style={styles.shareIcon}
                />
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
          </View>
        </View>
      )}
      <View style={styles.container}>
        <Header
          posts={filteredPosts}
          setFilteredPosts={setFilteredPosts}
          scrollY={scrollY}
        />
        <ScrollView
          onScroll={(event) => {
            const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
            setScrollY(contentOffset.y);

            const paddingToBottom = 20;
            if (
              layoutMeasurement.height + contentOffset.y >=
              contentSize.height -
              paddingToBottom
            ) {
              loadMorePosts();
            }
          }}
          scrollEventThrottle={16}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
          <View style={styles.postContainer}>
            {userProfileImage ?
              (
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

          {/* <View style={{ flexDirection: 'row', justifyContent: 'center', marginVertical: 10 }}>
            <TouchableOpacity
              style={[
                styles.filterButton,
                filterEventOnly && styles.filterButtonActive,
              ]}
              onPress={() => {
                const newFilter = !filterEventOnly;
                setFilterEventOnly(newFilter);

                if (newFilter) {
                  const eventPosts = newsfeedPosts.filter((post) => post.isEvent);
                  setVisiblePosts(eventPosts.slice(0, PAGE_SIZE));
                } else {
                  setVisiblePosts(newsfeedPosts.slice(0, PAGE_SIZE));
                }
              }}
            >
              <Ionicons
                name={filterEventOnly ? 'checkmark-circle' : 'ellipse-outline'}
                size={18}
                color={filterEventOnly ? '#E50914' : '#777'}
                style={{ marginRight: 5 }}
              />
              <Text style={{ color: filterEventOnly ? '#E50914' : '#777' }}>
                {filterEventOnly ? 'Showing Event Posts' : 'Show Event Posts Only'}
              </Text>
            </TouchableOpacity>
          </View> */}

          {recommendedPosts.length > 0 && (
            <View style={styles.recommendationHeader}>
              <Ionicons name="bulb-outline" size={20} color="#1E90FF" />
              <Text style={styles.recommendationHeaderText}>Personalized Recommendations</Text>
            </View>
          )}

          {visiblePosts.map((post) => renderPost(post))}
        </ScrollView>

        <BottomNavBar />

        {/* NEW/FIXED SWIPING IMAGE MODAL: Moved here from renderPost */}
        {imageModalVisible && (
          <Modal
            visible={imageModalVisible}
            animationType="fade"
            transparent={true}
            onRequestClose={closeModalImage}
          >
            <View style={styles.fullScreenModalContainer}>
              <TouchableOpacity style={styles.modalCloseButton} onPress={closeModalImage}>
                <Ionicons name="close" size={30} color="#fff" />
              </TouchableOpacity>

              <ScrollView
                ref={scrollRef}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                style={styles.fullScreenImageScroll}
                contentContainerStyle={{ alignItems: 'center' }}
                onLayout={() => {
                  if (initialIndex > 0 && !didInitialScroll) {
                    scrollRef.current.scrollTo({
                      x: initialIndex * screenWidth,
                      y: 0,
                      animated: false
                    });
                    setDidInitialScroll(true);
                  }
                }}
              >
                {galleryImages.map((uri, index) => (
                  <Image
                    key={index}
                    source={{ uri }}
                    style={{ width: screenWidth, height: '100%' }}
                    resizeMode="contain"
                  />
                ))}
              </ScrollView>
            </View>
          </Modal>
        )}

        {isModalVisible && (
          <View style={StyleSheet.absoluteFill}>
            <TouchableOpacity style={styles.modalBackground} activeOpacity={1} onPress={closeModal} />

            <PanGestureHandler onEnded={handleGesture} onGestureEvent={(event) => {

              translateY.value = event.nativeEvent.translationY;
            }}>
              <Animated.View style={[styles.modalContent, animatedStyle]}>
                <KeyboardAvoidingView
                  style={{ flex: 1 }}
                  behavior={Platform.OS === 'ios' ?
                    'padding' : 'height'}
                  keyboardVerticalOffset={Platform.OS === 'ios' ?
                    60 : 0}
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
                      {userProfileImage ?
                        (
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

                    {group && (
                      <TouchableOpacity
                        style={[
                          styles.eventPostButton,
                          isEventPost && styles.eventPostButtonActive,
                        ]}
                        onPress={() => setIsEventPost(!isEventPost)}
                      >
                        <Ionicons
                          name={isEventPost ? "checkmark-circle" : "ellipse-outline"}
                          size={20}
                          color={isEventPost ? "#E50914" : "#777"}
                          style={{ marginRight: 8 }}
                        />
                        <Text style={{ color: isEventPost ? "#E50914" : "#777", fontSize: 16 }}>
                          Event Post
                        </Text>
                      </TouchableOpacity>
                    )}

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
                        <Ionicons name="document-text-outline" size={24}
                          color="#34a853" />
                        <Text style={styles.optionText}>Document</Text>
                      </TouchableOpacity>

                      <TouchableOpacity style={styles.optionButton}>
                        <MaterialIcons
                          name="poll" size={24} color="#fb8c00" />
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
                  <Text style={styles.discardMessage}>You have unsaved changes.
                    Are you sure you want to discard?</Text>
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
    backgroundColor: '#ffffff',
  },
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingBottom: 80,
  },
  postContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    marginBottom: 12,
  },
  profileImage: {
    width: 35,
    height: 35,
    borderRadius: 17.5,
    marginRight: 10,
  },
  profileImagePost: {
    width: 38,
    height: 38,
    borderRadius: 19,
    marginRight: 0,
  },

  profileIcon: {
    fontSize: 35,
    marginRight: 10,
  },
  postInputContainer: {
    flex: 1,
    justifyContent: 'center',

  },

  postContentContainer: {
    borderColor: '#e0e0e0',
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    minHeight: '60%',
    marginBottom: 20,
    backgroundColor: '#fafafa',
  },

  textOnly: {
    fontSize: 16,
    marginBottom: 10,
  },
  placeholderInput: {
    fontSize: 16,
    color: '#333',
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  imageItem: {
    borderRadius: 10,
  },

  placeholderText: {
    color: '#888',
    fontSize: 15,
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
  eventPostCard: {
    borderColor: '#E50914',

    // Add more event-specific styles here
  },
  eventBadge: {
    position: 'absolute',
    top: 25,
    right: 50,
    backgroundColor: '#E50914',
    color: '#fff',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    fontWeight: 'bold',
    fontSize: 12,
    zIndex: 10,
  },
  postCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  postUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  postUserName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 0,
    paddingBottom: 0,
  },
  postDate: {
    fontSize: 11,
    color: '#888',
    marginTop: 2,
    paddingTop: 0,
  },
  postBody: {
    marginTop: 8,
  },
  postTextContent: {
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
    marginBottom: 12,
  },

  postImagesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginVertical: 8,
    marginHorizontal: -2,
    borderRadius: 8,
    overflow: 'hidden',
  },

  postImageWrapperSingle: {
    width: '100%',
    marginBottom: 5,
  },

  postImageWrapperMultiple: {
    width: '33.33%',
    padding: 2,
  },

  postImageSingle: {
    width: '100%',
    height: 400,
    borderRadius: 8,
    resizeMode: 'cover',
  },

  postImageThumbnail: {
    width: '100%',
    height: 200,
    borderRadius: 6,
    resizeMode: 'cover',
  },

  moreImagesOverlay: {
    position: 'absolute',
    top: 2,
    left: 2,
    right: 2,
    bottom: 2,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 6,
  },

  moreImagesText: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
  },

  postActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionText: {
    color: '#555',
    fontSize: 14,
    fontWeight: '500',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
  },

  modalContainer: {
    flex: 1,
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
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 10,
  },
  shareModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 15,
  },
  shareModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
  },
  closebtn: {
    padding: 5,
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginBottom: 15,
  },
  shareHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 15,
    marginLeft: 5,
  },
  shareProfilePic: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    marginLeft: 15,
  },
  placeholderProfilePic: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userInfoContainer: {
    flex: 1,
  },
  shareUsername: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  shareSubtext: {
    fontSize: 13,
    color: '#666',
  },
  captionContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  shareCaptionInput: {
    fontSize: 15,
    color: '#333',
    minHeight: 100,
    maxHeight: 200,
    padding: 15,
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginBottom: 8,
  },
  characterCount: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
  },
  shareActions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 10,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  shareButton: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  shareButtonDisabled: {
    backgroundColor: '#ccc',
    shadowOpacity: 0,
  },
  shareButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  shareIcon: {
    marginRight: 8,
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
    marginLeft: 20,
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
    fontWeight:
      'bold',
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
  postUserName: {
    fontWeight: 'bold',
    fontSize: 14,

  },
  pinIcon: {
    position: 'absolute',
    top: -28,
    right: -28,
    width: 33,
    height: 33,
    zIndex: 10,
  },

  fullScreenModalContainer: {
    flex: 1,
    backgroundColor: '#000000f8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 20,
    right: 20,
    zIndex: 10,
    padding: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
  },
  fullScreenImageScroll: {
    flex: 1,
    width: screenWidth,
  },
  imageGalleryIndicator: {
    position: 'absolute',
    bottom: 50,
    paddingHorizontal: 15,
    paddingVertical: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 20,
  },
  imageGalleryIndicatorText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  eventPostButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
  },
  eventPostButtonActive: {
    borderColor: '#E50914',
    backgroundColor: '#e8f5e9',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  filterButtonActive: {
    borderColor: '#E50914',
  },
  recommendationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#F0F8FF',
    borderRadius: 8,
    marginVertical: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#1E90FF',
  },
  recommendationHeaderText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#1E90FF',
  },
  recommendationBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFACD',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
    zIndex: 10,
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  recommendationText: {
    marginLeft: 4,
    fontSize: 11,
    fontWeight: 'bold',
    color: '#CC9900',
  },
});