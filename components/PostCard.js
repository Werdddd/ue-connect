import React from 'react';
import {
  View,
  Text,
  Image,
  Modal,
  ScrollView,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform, StyleSheet,
  Pressable,
} from 'react-native';
import Animated, { useSharedValue } from 'react-native-reanimated';
import { PanGestureHandler } from 'react-native-gesture-handler';
import { FontAwesome, Entypo, Ionicons } from '@expo/vector-icons';

const PostCard = ({
  post,
  ss,
  hasText,
  hasImages,
  isLiked,
  commentModalVisible,
  shareModalVisible,
  postComments,
  commentText,
  shareCaption,
  setCommentModalVisible,
  setShareModalVisible,
  setSelectedPostId,
  fetchComments,
  handleCommentBackdropPress,
  handleCommentGesture,
  commentBackdropAnimatedStyle,
  commentAnimatedStyle,
  commentTranslateY,
  commentBackdropOpacity,
  setCommentText,
  handleAddComment,
  setShareCaption,
  toggleLike,
  handleToggleOptions,
  handleDeletePost,
  showOptions,
  onOptionsPress,
  onDeletePost,
  setShowOptions,

}) => {
  return (
    <Pressable>
      <View key={post.id} style={styles.postCard}>
        {/* Post Header */}
        <View style={styles.postHeader}>
          <View style={styles.postUserInfo}>
            {post.user.profileImage ? (
              <Image
                source={{ uri: post.user.profileImage }}
                style={styles.profileImagePost}
                resizeMode="cover"
              />
            ) : (
              <FontAwesome name="user-circle-o" size={35} color="#999" />
            )}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 10 }}>
              <Text style={styles.postUserName}>{post.user.name}</Text>
              {post.user.role === ss && (
                <Image
                  source={require('../assets/switch2.png')}
                  style={{ width: 16, height: 16, marginLeft: 5 }}
                />
              )}
            </View>
          </View>
          <TouchableOpacity
            onPress={() => onOptionsPress(post.id)}
            style={{ padding: 5 }}
          >
            <Entypo name="dots-three-vertical" size={18} color="black" />
          </TouchableOpacity>

          {showOptions === post.id &&(
            <View style={styles.optionsMenu}>
              <TouchableOpacity
                onPress={() => onDeletePost(post.id)}
                style={styles.optionButton}
              >
                <Text style={styles.optionText}>Delete Post</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Post Content */}
        <View style={styles.postBody}>
          {hasText && <Text style={styles.postTextContent}>{post.text}</Text>}
          {hasImages && (
            <View style={styles.postImagesContainer}>
              {post.images.filter(uri => uri).map((uri, idx) => (
                <Image key={idx} source={{ uri }} style={styles.postImage} />
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
              setSelectedPostId(post.id);
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

        {/* Comment Modal */}
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
                  commentBackdropOpacity.value = 1 - event.nativeEvent.translationY / 300;
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

        {/* Share Modal */}
        <Modal
          visible={shareModalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShareModalVisible(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.shareModalContent}>
              <View style={styles.shareHeader}>
                <Image source={{ uri: 'user_profile_url' }} style={styles.shareProfilePic} />
                <Text style={styles.shareUsername}>Username</Text>
              </View>

              <TextInput
                style={styles.shareCaptionInput}
                placeholder="Write a caption..."
                multiline
                value={shareCaption}
                onChangeText={setShareCaption}
              />

              <TouchableOpacity style={styles.shareButton} onPress={() => { /* share logic */ }}>
                <Text style={styles.shareButtonText}>Share Now</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </Pressable>
  );
};

export default PostCard;


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
    width: 35,       // 👈 increase or decrease as needed
    height: 35,
    borderRadius: 25,
    marginRight: 1,
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
  postUserName: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  postDate: {
    fontSize: 12,
    color: '#777',
  },
  optionsMenu: {
    position: 'absolute', 
    top: 0,                
    right: 0,              
    backgroundColor: '#fff', 
    borderRadius: 5,       
    elevation: 5,          
    shadowColor: '#000',  
    shadowOpacity: 0.3,    
    shadowRadius: 4,       
    paddingVertical: 0,  
    paddingHorizontal: 0,         
  },
  optionButton: {
    paddingVertical: 10,  
    paddingHorizontal: 15, 
    borderBottomWidth: 1, 
    borderBottomColor: '#ccc',
  },
  optionText: {
    fontSize: 16,         
    color: '#333',      
  },
  optionsButton: {
    padding: 5,          
    backgroundColor: 'transparent',
  },
});
