import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Image,
    SafeAreaView,
    ScrollView,
    TouchableWithoutFeedback,
    Keyboard,
    KeyboardAvoidingView,
    Platform, TouchableOpacity,
    Pressable,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Header from '../components/header';
import BottomNavBar from '../components/bottomNavBar';
import { auth, firestore } from '../Firebase'; // your auth config
import { collection, getDocs, query, where, doc, getDoc, onSnapshot} from 'firebase/firestore';
import { useRoute } from '@react-navigation/native';
import PostCard from '../components/PostCard';
import { followUser } from '../Backend/follow'; 
import { unfollowUser } from '../Backend/unfollow'; 


export default function UserOwnProfilePage() {
    const navigation = useNavigation();
    const [scrollY, setScrollY] = useState(0);

    const [name, setName] = useState({ firstName: '', lastName: '' });
    const [year, setYear] = useState('');
    const [profile, setProfile] = useState('');
    const [course, setCourse] = useState('');
    const [following, setFollowing] = useState(0);
    const [followers, setFollowers] = useState(0);
    const [organization, setOrganization] = useState(0);
    const [group, setGroup] = useState(false);
    const [userPosts, setUserPosts] = useState([]);
    const route = useRoute();
    const { postEmail } = route.params;
    const userEmail = postEmail;
    const [currentUserEmail, setCurrentUserEmail] = useState('')
    const [followed, setFollowed] = useState(false);

    useEffect(() => {
        const user = auth.currentUser;
        if (user?.email) {
          setCurrentUserEmail(user.email);
        }
      }, []);
      

    useEffect(() => {
    let unsubscribe;
    
    const subscribeToProfile = () => {
        const userRef = doc(firestore, 'Users', userEmail);
    
        unsubscribe = onSnapshot(userRef, (userSnap) => {
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
        } else {
            console.log('No such user document!');
        }
        }, (error) => {
        console.error('Error fetching real-time profile:', error.message);
        });
    };
    
    if (userEmail && currentUserEmail) {
        subscribeToProfile();
        fetchUserPosts(); // Still OK to run once here
    }
    
    return () => {
        if (unsubscribe) unsubscribe();
    };
    }, [userEmail, currentUserEmail]);

    const fetchUserPosts = async () => {
        if (!userEmail) return;

        try {
            // 1) Query only this user's posts
            const q = query(
                collection(firestore, 'newsfeed'),
                where('userId', '==', userEmail)
            );
            const snap = await getDocs(q);

            // 2) For each post, fetch its author record from Users
            const enriched = await Promise.all(
                snap.docs.map(async (docSnap) => {
                    const data = docSnap.data();

                    // Convert Firestore Timestamp → JS Date
                    const dateObj = data.date?.toDate
                        ? data.date.toDate()
                        : new Date(data.date || Date.now());

                    // Normalize images
                    const images = (data.images || []).map(img =>
                        img.startsWith('http')
                            ? img
                            : `data:image/jpeg;base64,${img}`
                    );

                    // Fetch user profile
                    let userProfile = {
                        name: 'Anonymous',
                        profileImage: 'https://mactaggartfp.com/manage/wp-content/uploads/default-profile.jpg',
                        role: ''
                    };
                    if (data.userId) {
                        const userDoc = await getDoc(doc(firestore, 'Users', data.userId));
                        if (userDoc.exists()) {
                            const u = userDoc.data();

                            console.log("test");
                            userProfile = {
                                name: `${u.firstName || ''} ${u.lastName || ''}`.trim() || 'Anonymous',
                                profileImage: u.profileImage
                                    ? u.profileImage.startsWith('http')
                                        ? u.profileImage
                                        : `${u.profileImage}`
                                    : userProfile.profileImage,
                                role: u.role || ''
                            };
                        }
                    }

                    // Count comments
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

            // 3) Reverse if you want newest first
            setUserPosts(enriched.reverse());
        } catch (err) {
            console.error('Error fetching user posts:', err);
        }
    };

    const handleFollow = async () => {
        const res = await followUser(currentUserEmail, userEmail);
        if (res.success) {
            setFollowed(true);
            fetchProfile();
        } else {
            console.error('Follow failed:', res.error);
        }
    };
    const handleUnfollow = async () => {
        const res = await unfollowUser(currentUserEmail, userEmail);
        if (res.success) {
          setFollowed(false);
          fetchProfile();
        } else {
          console.error('Unfollow failed:', res.error);
        }
      };
      


    const dummyFunctions = () => { };
    const dummyStateSetter = () => { };
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
                        <Header scrollY={scrollY} />
                        <TouchableWithoutFeedback>
                            <ScrollView
                                keyboardShouldPersistTaps="handled"
                                onScroll={(event) => {
                                    setScrollY(event.nativeEvent.contentOffset.y);
                                }}
                                scrollEventThrottle={16}
                                contentContainerStyle={styles.scrollContent}
                                showsVerticalScrollIndicator={false}
                            >
                                <View style={styles.profileContainer}>
                                    <Image
                                        source={{ uri: profile }}
                                        style={styles.userProfileImage}
                                    />

                                    <Text style={styles.userName}>
                                        {name.firstName && name.lastName
                                            ? `${name.firstName} ${name.lastName}`
                                            : 'Your Name'}
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

                                {userPosts.map((post) => (
                                    <PostCard
                                        key={post.id}
                                        post={post}
                                        ss={"dd"}
                                        hasText={!!post.text}
                                        hasImages={post.images?.length > 0}
                                        isLiked={post.likedBy.includes(userEmail)}
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
                                        //onDeletePost={() => handleDeletePost(post.id)}
                                        //onOptionsPress={handleToggleOptions}
                                        //showOptions={showOptions}
                                    />
                                ))}

                            </ScrollView>
                        </TouchableWithoutFeedback>
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
