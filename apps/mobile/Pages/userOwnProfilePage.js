import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  SafeAreaView,
  TouchableWithoutFeedback,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  FlatList,
  Modal, 
  Dimensions 
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Header from '../components/header';
import BottomNavBar from '../components/bottomNavBar';
import { getOwnUserProfile } from '../Backend/userOwnProfile';
import { updateProfileImage, loadProfileImage } from '../Backend/changeProfile';
import { sendNotification } from '../Backend/notifications';
import { auth, firestore } from '../Firebase';
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  getDoc,
  deleteDoc,
  limit,
  startAfter,
  updateDoc,
  arrayUnion,
  arrayRemove,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';
import PostCard from '../components/PostCard';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

export default function UserOwnProfilePage() {
  const [showOptions, setShowOptions] = useState(null);
  const [scrollY, setScrollY] = useState(0);
  const [name, setName] = useState({ firstName: '', lastName: '' });
  const [year, setYear] = useState('');
  const [profile, setProfile] = useState('');
  const [course, setCourse] = useState('');
  const [following, setFollowing] = useState(0);
  const [followers, setFollowers] = useState(0);
  const [organization, setOrganization] = useState(0);
  const [group, setGroup] = useState(false);
  const userEmail = auth.currentUser?.email;

  const [userPosts, setUserPosts] = useState([]);
  const [lastDoc, setLastDoc] = useState(null);
  const [fetchingMore, setFetchingMore] = useState(false);

  const [selectedImageUri, setSelectedImageUri] = useState('');

  const [isImageViewerVisible, setIsImageViewerVisible] = useState(false);
  const [modalImages, setModalImages] = useState([]); 
  const [initialImageUri, setInitialImageUri] = useState('');

  const [selectedPostId, setSelectedPostId] = useState(null);
  const [commentModalVisible, setCommentModalVisible] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [postComments, setPostComments] = useState([]);

  const navigation = useNavigation();
  const handleToggleOptions = (postId) => {
    setShowOptions(showOptions === postId ? null : postId);
  };
  const handleDeletePost = async (postId) => {
    try {
      await deleteDoc(doc(firestore, 'newsfeed', postId));
      setUserPosts((prevPosts) => prevPosts.filter((p) => p.id !== postId));
    } catch (error) {
      console.error('Error deleting post:', error);
    }
  };

  const openImage = (images, uri) => {
    setModalImages(images); 
    setInitialImageUri(uri); 
    setIsImageViewerVisible(true);
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await getOwnUserProfile();
        setName({ firstName: data.firstName, lastName: data.lastName });
        setYear(data.Year);
        setCourse(data.Course);
        setProfile(data.profileImage);
        setFollowing(data.following.length);
        setFollowers(data.followers.length);
        setOrganization(data.orgs.length);
        setGroup(data.group);
      } catch (error) {
        console.error('Error fetching profile:', error.message);
      }
    };

    fetchProfile();
    if (userEmail) {
      loadProfileImage(userEmail, setProfile);
      fetchUserPosts(true);
    }
  }, [userEmail]);
  const fetchUserPosts = async (initial = false) => {
    if (!userEmail) return;
    try {
      let q = query(
        collection(firestore, 'newsfeed'),
        where('userId', '==', userEmail),
        limit(10)
      );
      if (!initial && lastDoc) {
        q = query(
          collection(firestore, 'newsfeed'),
          where('userId', '==', userEmail),
          startAfter(lastDoc),
          limit(10)
        );
      }

      const snap = await getDocs(q);
      const lastVisible = snap.docs[snap.docs.length - 1] || null;
      setLastDoc(lastVisible);
      const enriched = await Promise.all(
        snap.docs.map(async (docSnap) => {
          const data = docSnap.data();
          const dateObj = data.date?.toDate
            ? data.date.toDate()
            : new Date(data.date || Date.now());
          const images = (data.images || []).map((img) =>
            img.startsWith('http')
              ? img
              : `data:image/jpeg;base64,${img}`
          );

          let userProfile = {
            name: 'Anonymous',
            profileImage:
              'https://mactaggartfp.com/manage/wp-content/uploads/default-profile.jpg',
            role: ''
          };
          if (data.userId) {
            const userDoc = await getDoc(doc(firestore, 'Users', data.userId));
            if (userDoc.exists()) {
              const u = userDoc.data();
              userProfile = {
                name: `${u.firstName || ''} ${u.lastName || ''}`.trim() || 'Anonymous',
                profileImage: u.profileImage?.startsWith('http')
                  ? u.profileImage
                  : u.profileImage || userProfile.profileImage,
                role: u.role || ''
              };
            }
          }

          const commentsSnap = await getDocs(
            collection(firestore, 'newsfeed', docSnap.id, 'comments')
          );
          const commentCount = commentsSnap.size;

          return {
            id: docSnap.id,
            text: data.text || '',
            date: dateObj,
            images,
            likedBy: data.likedBy || [],
            commentCount,
            user: userProfile
          };
        })
      );

      if (initial) {
        setUserPosts(enriched.reverse());
      } else {
        setUserPosts((prev) => [...prev, ...enriched.reverse()]);
      }
    } catch (err) {
      console.error('Error fetching user posts:', err);
    } finally {
      setFetchingMore(false);
    }
  };
  // === LIKE system ===
  const toggleLike = async (postId, likedBy) => {
    const postRef = doc(firestore, 'newsfeed', postId);
    const hasLiked = likedBy.includes(userEmail);

    try {
      await updateDoc(postRef, {
        likedBy: hasLiked
          ? arrayRemove(userEmail)
          : arrayUnion(userEmail),
      });
      // update UI instantly
      setUserPosts(prev =>
        prev.map(p =>
          p.id === postId
            ? {
                ...p,
                likedBy: hasLiked
                  ? p.likedBy.filter(email => email !== userEmail)
                  : [...p.likedBy, userEmail],
              }
            : p
        )
      );
      if (!hasLiked) {
        const postSnap = await getDoc(postRef);
        const postData = postSnap.data();
        const postOwner = postData.userId;

        if (postOwner && postOwner !== userEmail) {
          await sendNotification({
            userId: postOwner,
            type: 'like',
            content: `${name.firstName} ${name.lastName} liked your post.`,
          });
        }
      }
    } catch (e) {
      console.error('Error updating like or sending notification:', e);
    }
  };

  // === COMMENT system ===
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
              const userDoc = await getDoc(userDocRef);

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
        userName: `${name.firstName} ${name.lastName}`,
        profileImage: profile || 'https://mactaggartfp.com/manage/wp-content/uploads/default-profile.jpg',
        timestamp: serverTimestamp(),
        email: userEmail,
      };
      await addDoc(collection(firestore, 'newsfeed', selectedPostId, 'comments'), commentData);
      setCommentText('');

      const postRef = doc(firestore, 'newsfeed', selectedPostId);
      const postSnap = await getDoc(postRef);
      if (postSnap.exists()) {
        const postData = postSnap.data();
        const postOwner = postData.userId;
        if (postOwner && postOwner !== userEmail) {
          await sendNotification({
            userId: postOwner,
            type: 'comment',
            content: `${name.firstName} ${name.lastName} commented on your post.`,
          });
        }
      }

      fetchComments(selectedPostId);
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };
  const renderHeader = () => (
    <View style={styles.profileContainer}>
      <TouchableOpacity onPress={() => updateProfileImage(userEmail, setProfile)}>
        <Image source={{ uri: profile }} style={styles.userProfileImage} />
      </TouchableOpacity>
      <Text style={styles.userName}>
        {name.firstName || name.lastName
          ? `${name.firstName} ${name.lastName}`.trim()
          : 'Unknown'}
      </Text>
      <View style={styles.followDataRow}>
        <Text style={styles.textsNumber1}>{following}</Text>
        <Text style={styles.textsNumber2}>{followers}</Text>
        <Text style={styles.textsNumber3}>{organization}</Text>
      </View>
      <View style={styles.followDetailRow}>
        <Text style={styles.texts}>{'Following'}</Text>
        <Text style={styles.texts}>{'Followers'}</Text>
        <Text style={styles.texts}>{'Organizations'}</Text>
      </View>
      {!group && (
        <View style={styles.infoDetailRow}>
          <Text style={styles.userYear}>{year || 'Your Year'}</Text>
          <Text style={styles.userCourse}>{course || 'Your Course'}</Text>
        </View>
      )}
      <View style={styles.underline} />
    </View>
  );
  return (
    <TouchableWithoutFeedback
      onPress={() => {
        Keyboard.dismiss();
        setShowOptions(null);
      }}
    >
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.container}
        >
          <View style={styles.container}>
            <Header scrollY={scrollY} />

            {/* Transparent backdrop that closes the menu */}
            {showOptions && (
              <TouchableOpacity
                style={StyleSheet.absoluteFillObject}
                activeOpacity={1}
                onPress={() => setShowOptions(null)}
              />
            )}

            <FlatList
              style={styles.containerPost}
              data={userPosts}
              keyExtractor={(item) => item.id}
              ListHeaderComponent={renderHeader}
              renderItem={({ item }) => (
                <PostCard
                  key={item.id}
                  post={item}
                  ss={'superadmin'}
                  ss2={'sheen'}
                  ss3={'admin'}
                  hasText={!!item.text}
                  hasImages={item.images?.length > 0}
                  isLiked={item.likedBy.includes(userEmail)}
                  commentModalVisible={commentModalVisible}
                  shareModalVisible={false}
                  postComments={postComments}
                  commentText={commentText}
                  shareCaption=""
                  setCommentModalVisible={setCommentModalVisible}
                  setShareModalVisible={() => {}}
                  setSelectedPostId={setSelectedPostId}
                  fetchComments={fetchComments}
                  handleCommentBackdropPress={() => setCommentModalVisible(false)}
                  handleCommentGesture={() => setCommentModalVisible(false)}
                  commentBackdropAnimatedStyle={{}}
                  commentAnimatedStyle={{}}
                  commentTranslateY={{ value: 0 }}
                  commentBackdropOpacity={{ value: 1 }}
                  setCommentText={setCommentText}
                  handleAddComment={handleAddComment}
                  setShareCaption={() => {}}
                  toggleLike={toggleLike}
                  onDeletePost={() => handleDeletePost(item.id)}
                  onOptionsPress={() => handleToggleOptions(item.id)}
                  showOptions={showOptions}
                  openImage={openImage}
                />
              )}
              onEndReached={() => {
                if (!fetchingMore && lastDoc) {
                  setFetchingMore(true);
                  fetchUserPosts(false);
                }
              }}
              onEndReachedThreshold={0.5}
              showsVerticalScrollIndicator={false}
            />

            <BottomNavBar />
          </View>
        </KeyboardAvoidingView>

        <Modal
            visible={isImageViewerVisible}
            transparent={true}
            onRequestClose={() => setIsImageViewerVisible(false)}
            animationType="fade"
        >
          {modalImages.length > 0 && (
            <View style={modalStyles.modalContainer}>
                
                <FlatList
                    key={modalImages.join('')} 
                    data={modalImages}
                    keyExtractor={(item) => item}
                    horizontal 
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    initialScrollIndex={
                      modalImages.findIndex(uri => uri === initialImageUri) || 0
                    }
                    getItemLayout={(data, index) => (
                      {length: width, offset: width * index, index}
                    )}
                    
                    renderItem={({ item: uri }) => (
                        <View style={modalStyles.imageWrapper}>
                            <Image
                                source={{ uri }}
                                style={modalStyles.fullImage}
                                resizeMode="contain" 
                            />
                        </View>
                    )}
                />

                <SafeAreaView style={modalStyles.closeButtonContainer}>
                    <TouchableOpacity
                        style={modalStyles.closeButton}
                        onPress={() => setIsImageViewerVisible(false)}
                    >
                        <Ionicons 
                            name="close-circle" 
                            size={40} 
                            color="#AAAAAA" 
                        />
                    </TouchableOpacity>
                </SafeAreaView>
                
            </View>
          )}
        </Modal>

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
    containerPost: {
        flex: 1,
        padding: 15,
        backgroundColor: '#fff',
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: 20,
        paddingBottom: 80,
    },
    profileContainer: {
        alignItems: 'center',
        marginTop: 20,
    },
    userProfileImage: {
        width: 100,
        height: 100,
        borderRadius: 50,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: '#ccc',
    },
    userName: {
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 5,
    },
    userYear: {
        fontSize: 14,
        textAlign: 'center',
        color: '#777',
        marginBottom: 7,
    },
    userCourse: {
        fontSize: 14,
        textAlign: 'center',
        color: '#777',
        marginBottom: 7,
    },
    texts: {
        fontSize: 14,
        textAlign: 'center',
        color: '#777',
        marginBottom: 8,
        // borderColor: '#000',
        // borderStyle: 'solid',
        // borderWidth: 1,
        width: '30%',
    },
    textsNumber1: {
        fontSize: 14,
        textAlign: 'center',
        color: '#000',
        marginBottom: -14,
        fontWeight: 800,
        // borderColor: '#000',
        // borderStyle: 'solid',
        // borderWidth: 1,
        width: '20%',
        marginLeft: -10,
        //marginLeft: 0
    },
    textsNumber2: {
        fontSize: 14,
        textAlign: 'center',
        color: '#000',
        marginBottom: -14,
        fontWeight: 800,
        // borderColor: '#000',
        // borderStyle: 'solid',
        // borderWidth: 1,
        width: '20%',
        marginLeft: -2,
        //width: '10%',
        //marginLeft: 0
    },
    textsNumber3: {
        fontSize: 14,
        textAlign: 'center',
        color: '#000',
        marginBottom: -14,
        fontWeight: 800,
        // borderColor: '#000',
        // borderStyle: 'solid',
        // borderWidth: 1,
        width: '20%',
        marginLeft: 0,
        marginRight: -12,
        //width: '10%',
        //marginLeft: 0
    },
    underline: {
        alignSelf: 'center',
        height: 1,
        backgroundColor: '#555',
        width: '100%',
        marginTop: 2,
    },
    infoDetailRow: {
        flexDirection: 'row',
        alignItems: 'top',
        marginTop: 0,
        justifyContent: 'space-between',
        width: '50%',
    },
    followDetailRow: {
        flexDirection: 'row',
        alignItems: 'top',
        marginTop: 10,
        justifyContent: 'space-between',
        width: '90%',
    },
    followDataRow: {
        flexDirection: 'row',
        alignItems: 'top',
        marginTop: 10,
        justifyContent: 'space-between',
        width: '70%',
    }

});

const modalStyles = StyleSheet.create({
    modalContainer: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.99)',
    },
    imageWrapper: {
        width: width, 
        height: height,   
    },
    fullImage: {
        width: '100%',
        height: '100%',
    },
    closeButtonContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 10, 
    },
    closeButton: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 40 : 20, 
        right: 20,
        zIndex: 10,
        padding: 10,
        backgroundColor: 'black', 
        borderRadius: 20,
    }
});