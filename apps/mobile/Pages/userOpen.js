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
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Header from '../components/header';
import BottomNavBar from '../components/bottomNavBar';
import { auth, firestore } from '../Firebase';
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  getDoc,
  onSnapshot,
  limit,
  startAfter,
  updateDoc,
  arrayUnion,
  arrayRemove,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';
import PostCard from '../components/PostCard';
import { followUser } from '../Backend/follow';
import { unfollowUser } from '../Backend/unfollow';
import { sendNotification } from '../Backend/notifications';

export default function UserProfilePage() {
  const navigation = useNavigation();
  const route = useRoute();
  const { postEmail } = route.params;
  const userEmail = postEmail;

  const [scrollY, setScrollY] = useState(0);
  const [name, setName] = useState({ firstName: '', lastName: '' });
  const [year, setYear] = useState('');
  const [profile, setProfile] = useState('');
  const [course, setCourse] = useState('');
  const [following, setFollowing] = useState(0);
  const [followers, setFollowers] = useState(0);
  const [organization, setOrganization] = useState(0);
  const [member, setMember] = useState(0);
  const [group, setGroup] = useState(false);
  const [userPosts, setUserPosts] = useState([]);
  const [currentUserEmail, setCurrentUserEmail] = useState('');
  const [followed, setFollowed] = useState(false);
  const [userName, setUserName] = useState('');
  const [currentUserProfileImage, setCurrentUserProfileImage] = useState('');

  // pagination
  const [lastDoc, setLastDoc] = useState(null);
  const [fetchingMore, setFetchingMore] = useState(false);

  // comment/like state
  const [selectedPostId, setSelectedPostId] = useState(null);
  const [commentModalVisible, setCommentModalVisible] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [postComments, setPostComments] = useState([]);

  useEffect(() => {
    const fetchUser = async () => {
      const user = auth.currentUser;


      if (user?.email) {
        setCurrentUserEmail(user.email);

        const userRef = doc(firestore, 'Users', user.email);
        const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const userData = userSnap.data();
        setUserName(`${userData.firstName} ${userData.lastName}`);
        setCurrentUserProfileImage(userData.profileImage || 'https://mactaggartfp.com/manage/wp-content/uploads/default-profile.jpg');
      }

      }
    };
    fetchUser();
  }, []);

  useEffect(() => {
    let unsubscribe;

    const subscribeToProfile = () => {
      const userRef = doc(firestore, 'Users', userEmail);

      unsubscribe = onSnapshot(
        userRef,
        (userSnap) => {
          if (userSnap.exists()) {
            const data = userSnap.data();
            setName({ firstName: data.firstName, lastName: data.lastName });
            setYear(data.Year);
            setCourse(data.Course);
            setProfile(data.profileImage);
            setFollowing(data.following?.length || 0);
            setFollowers(data.followers?.length || 0);
            setOrganization(data.orgs?.length || 0);
            setGroup(data.group);
            setFollowed(data.followers?.includes(currentUserEmail));
            if (data.group) {
              (async () => {
                try {
                  const orgsRef = collection(firestore, 'organizations');
                  const q = query(orgsRef, where('email', '==', userEmail));
                  const querySnapshot = await getDocs(q);
                  if (!querySnapshot.empty) {
                    const orgData = querySnapshot.docs[0].data();
                    setMember(orgData.members.length);
                  }
                } catch (err) {
                  console.error('Failed to fetch extra user data:', err);
                }
              })();
            }
          }
        },
        (error) => {
          console.error('Error fetching real-time profile:', error.message);
        }
      );
    };

    if (userEmail && currentUserEmail) {
      subscribeToProfile();
      fetchUserPosts(true); // initial load
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [userEmail, currentUserEmail]);

  const fetchUserPosts = async (initial = false) => {
    if (!userEmail) return;
    try {
      // 🔧 Build query using nested field "user.id" instead of userId
      let q = query(
        collection(firestore, 'newsfeed'),
        where('user.id', '==', userEmail),
        limit(10)
      );

      if (!initial && lastDoc) {
        q = query(
          collection(firestore, 'newsfeed'),
          where('user.id', '==', userEmail),
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

          // ✅ Handle timestamp
          let dateObj = new Date();
          const rawDate = data.timestamp || data.date;
          if (rawDate?.toDate) {
            dateObj = rawDate.toDate();
          } else if (typeof rawDate === 'number' || typeof rawDate === 'string') {
            dateObj = new Date(rawDate);
          }

          // ✅ Normalize images
          const images = (data.images || []).map((img) =>
            img.startsWith('http') ? img : `data:image/jpeg;base64,${img}`
          );

          // ✅ Fetch user info (sharer)
          let userProfile = {
            name: 'Anonymous',
            profileImage:
              'https://mactaggartfp.com/manage/wp-content/uploads/default-profile.jpg',
            role: '',
          };

          const userId = data.user?.id || data.userId;
          if (userId) {
            const userDoc = await getDoc(doc(firestore, 'Users', userId));
            if (userDoc.exists()) {
              const u = userDoc.data();
              userProfile = {
                name: `${u.firstName || ''} ${u.lastName || ''}`.trim() || 'Anonymous',
                profileImage:
                  u.profileImage?.startsWith('http') || u.profileImage?.startsWith('data:')
                    ? u.profileImage
                    : u.profileImage || userProfile.profileImage,
                role: u.role || '',
              };
            } else if (data.user?.name) {
              userProfile = {
                name: data.user.name,
                profileImage: data.user.profileImage || userProfile.profileImage,
                role: data.user.role || '',
              };
            }
          }

          // ✅ Fetch comment count
          const commentsSnap = await getDocs(
            collection(firestore, 'newsfeed', docSnap.id, 'comments')
          );
          const commentCount = commentsSnap.size;

          // ✅ Handle shared post data if this is a shared post
          let sharedPostData = null;
          if (data.isShared && data.sharedPostData) {
            const sp = data.sharedPostData;
            const sharedUserId = sp.user?.id || sp.userId;
            let sharedUserProfile = {
              name: sp.user?.name || sp.userName || 'Unknown',
              profileImage:
                sp.user?.profileImage ||
                'https://mactaggartfp.com/manage/wp-content/uploads/default-profile.jpg',
            };

            // Try to enrich with Users collection
            if (sharedUserId) {
              const sharedUserDoc = await getDoc(doc(firestore, 'Users', sharedUserId));
              if (sharedUserDoc.exists()) {
                const su = sharedUserDoc.data();
                sharedUserProfile = {
                  name: `${su.firstName || ''} ${su.lastName || ''}`.trim() || 'Unknown',
                  profileImage:
                    su.profileImage?.startsWith('http') || su.profileImage?.startsWith('data:')
                      ? su.profileImage
                      : su.profileImage || sharedUserProfile.profileImage,
                };
              }
            }

            sharedPostData = {
              id: sp.id || null,
              text: sp.text || '',
              images: sp.images || [],
              user: sharedUserProfile,
            };
          }

          // ✅ Return enriched post
          return {
            id: docSnap.id,
            text: data.text || '',
            date: dateObj,
            images,
            likedBy: data.likedBy || [],
            commentCount,
            pinned: data.pinned === true,
            isEvent: data.isEvent === true,
            isShared: data.isShared === true,
            sharedPostData,
            user: userProfile,
          };
        })
      );

      // ✅ Merge results
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

  // LIKE
  const toggleLike = async (postId, likedBy) => {
    const postRef = doc(firestore, 'newsfeed', postId);
    const hasLiked = likedBy.includes(currentUserEmail);

    try {
      await updateDoc(postRef, {
        likedBy: hasLiked
          ? arrayRemove(currentUserEmail)
          : arrayUnion(currentUserEmail),
      });

      setUserPosts(prev =>
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

  // COMMENTS
  const fetchComments = async (postId) => {
    try {
      const commentsSnapshot = await getDocs(
        collection(firestore, 'newsfeed', postId, 'comments')
      );

      const commentsData = await Promise.all(
        commentsSnapshot.docs.map(async (docSnapshot) => {
          const comment = docSnapshot.data();
          const email = comment.email;
          let profileImage = null;

          if (email) {
            try {
              const userDocRef = doc(firestore, 'Users', email);
              const userDoc = await getDoc(userDocRef);
              if (userDoc.exists()) {
                profileImage = userDoc.data().profileImage || null;
              }
            } catch (error) {
              console.warn(`Error fetching user data for ${email}:`, error);
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
        userName: userName,
        profileImage: profile || 'https://mactaggartfp.com/manage/wp-content/uploads/default-profile.jpg',
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

  const handleFollow = async () => {
    const res = await followUser(currentUserEmail, userEmail, userName);
    if (res.success) {
      setFollowed(true);
    } else {
      console.error('Follow failed:', res.error);
    }
  };
  const handleUnfollow = async () => {
    const res = await unfollowUser(currentUserEmail, userEmail);
    if (res.success) {
      setFollowed(false);
    } else {
      console.error('Unfollow failed:', res.error);
    }
  };

  const renderHeader = () => (
    <View style={styles.profileContainer}>
      <Image source={{ uri: profile }} style={styles.userProfileImage} />

      <Text style={styles.userName}>
        {name.firstName || name.lastName
          ? `${name.firstName} ${name.lastName}`.trim()
          : 'Unknown'}
      </Text>
      <View style={styles.followDataRow}>
        <Text style={styles.textsNumber1}>{following}</Text>
        <Text style={styles.textsNumber2}>{followers}</Text>
        <Text style={styles.textsNumber3}>{group ? member : organization}</Text>
      </View>
      <View style={styles.followDetailRow}>
        <Text style={styles.texts}>{'Following'}</Text>
        <Text style={styles.texts}>{'Followers'}</Text>
        <Text style={styles.texts}>{group ? 'Members' : 'Organizations'}</Text>
      </View>
      {!group && (
        <View style={styles.infoDetailRow}>
          <Text style={styles.userYear}>{year || ''}</Text>
          <Text style={styles.userCourse}>{course || ''}</Text>
        </View>
      )}
      <View style={styles.followContainer}>
        {followed ? (
          <TouchableOpacity style={styles.followingButton} onPress={handleUnfollow}>
            <Text style={styles.followingButtonText}>Following</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.followButton} onPress={handleFollow}>
            <Text style={styles.followButtonText}>Follow</Text>
          </TouchableOpacity>
        )}
      </View>
      <View style={styles.underline} />
    </View>
  );

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.container}
        >
          <View style={styles.container}>
            <Header scrollY={scrollY} />

            <FlatList
              style={styles.containerPost}
              data={userPosts}
              keyExtractor={(item) => item.id}
              ListHeaderComponent={renderHeader}
              renderItem={({ item }) => (
                <PostCard
                  currentUserProfileImage={currentUserProfileImage}
                  key={item.id}
                  post={item}
                  ss={'superadmin'}
                  ss2={'sheen'}
                  hasText={!!item.text}
                  hasImages={item.images?.length > 0}
                  isLiked={item.likedBy.includes(currentUserEmail)}
                  commentModalVisible={commentModalVisible}
                  shareModalVisible={false}
                  postComments={postComments}
                  commentText={commentText}
                  shareCaption=""
                  setCommentModalVisible={setCommentModalVisible}
                  setShareModalVisible={() => { }}
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
                  setShareCaption={() => { }}
                  toggleLike={toggleLike}
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
    marginBottom: 0,
  },
  userCourse: {
    fontSize: 14,
    textAlign: 'center',
    color: '#777',
    marginBottom: 0,
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
    marginBottom: 0,
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
  },
  followContainer: {
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 8,
  },

  followButton: {
    backgroundColor: '#E50914',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
  },

  followButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  followingButton: {
    backgroundColor: '#fff',
    borderColor: '#E50914',
    borderWidth: 1,
    paddingVertical: 7,
    paddingHorizontal: 18,
    borderRadius: 20,
  },

  followingButtonText: {
    color: '#E50914',
    fontWeight: '600',
  }

});
