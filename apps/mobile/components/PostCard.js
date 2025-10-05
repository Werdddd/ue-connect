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
  FlatList,
  Dimensions
} from 'react-native';
import Animated, { useSharedValue } from 'react-native-reanimated';
import { PanGestureHandler } from 'react-native-gesture-handler';
import { FontAwesome, Entypo, Ionicons } from '@expo/vector-icons';

const PostCard = ({
  currentUserProfileImage,
  post,
  ss,
  ss2,
  ss3,
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
  openImage

}) => {

  const images = post.images?.filter(uri => uri) || [];
  const isSingleImage = images.length === 1;

  return (
    <Pressable>
      <View key={post.id} style={styles.postCard}>
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
            <View style={{ flexDirection: 'column', marginLeft: 10 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={styles.postUserName}>{post.user.name}</Text>
                {(post.user.role === ss ||
                  post.user.role === ss2 ||
                  post.user.role === ss3) && (
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
          <TouchableOpacity
            onPress={() => onOptionsPress(post.id)}
            style={{ padding: 5 }}
          >
            <Entypo name="dots-three-vertical" size={18} color="black" />
          </TouchableOpacity>

          {showOptions === post.id && (
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
        <View style={styles.postBody}>
          {hasText && <Text style={styles.postTextContent}>{post.text}</Text>}
          {post.isShared && post.sharedPostData && (
            <View style={styles.sharedPostWrapper}>
              {/* Original post card */}
              <View style={styles.originalPostCard}>
                {/* Original author header */}
                <View style={styles.originalAuthorHeader}>
                  {post.sharedPostData.user?.profileImage ? (
                    <Image
                      source={{ uri: post.sharedPostData.user.profileImage }}
                      style={styles.originalAuthorAvatar}
                    />
                  ) : (
                    <View style={styles.originalAuthorAvatarPlaceholder}>
                      <FontAwesome name="user" size={14} color="#999" />
                    </View>
                  )}
                  <View style={styles.originalAuthorInfo}>
                    <Text style={styles.originalAuthorName}>
                      {post.sharedPostData.user?.name ||
                        post.sharedPostData.userName ||
                        'Unknown User'}
                    </Text>
                    <Text style={styles.originalPostTime}>
                      {post.sharedPostData.timestamp
                        ? new Date(post.sharedPostData.timestamp).toLocaleString()
                        : 'Original post'}
                    </Text>
                  </View>
                </View>

                {/* Original post text */}
                {post.sharedPostData.text ? (
                  <Text style={styles.originalPostText} numberOfLines={4}>
                    {post.sharedPostData.text}
                  </Text>
                ) : null}

                {/* Original post image */}
                {Array.isArray(post.sharedPostData.images) &&
                  post.sharedPostData.images.length > 0 && (
                    <View style={styles.originalImageWrapper}>
                      <Image
                        source={{
                          uri: post.sharedPostData.images[0].startsWith('data:')
                            ? post.sharedPostData.images[0]
                            : `data:image/jpeg;base64,${post.sharedPostData.images[0]}`,
                        }}
                        style={styles.originalPostImage}
                        resizeMode="cover"
                      />
                      {post.sharedPostData.images.length > 1 && (
                        <View style={styles.imageCountBadge}>
                          <FontAwesome name="image" size={10} color="#fff" />
                          <Text style={styles.imageCountText}>
                            {post.sharedPostData.images.length}
                          </Text>
                        </View>
                      )}
                    </View>
                  )}
              </View>
            </View>
          )}
          {hasImages && (
            <View style={styles.postImagesContainer}>
              {images.slice(0, 3).map((uri, idx) => { // MODIFICATION 1: Limit to a maximum of 3 images

                const isThirdImage = idx === 2;
                const hasMoreImages = images.length > 3 && isThirdImage; // Check if it's the 3rd image AND there are more than 3 total
                const imagesRemaining = images.length - 2; // Calculate the remaining images

                return (
                  <TouchableOpacity
                    key={idx}
                    onPress={() => openImage(images, uri)}
                    style={isSingleImage ? styles.postImageWrapperSingle : styles.postImageWrapperMultiple}
                  >
                    <Image
                      source={{ uri }}
                      style={isSingleImage ? styles.postImageSingle : styles.postImageThumbnail}
                      resizeMode="cover"
                    />
                    {hasMoreImages && (
                      <View style={styles.moreImagesOverlay}>
                        <Text style={styles.moreImagesText}>
                          +{imagesRemaining}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                )
              })}
            </View>
          )}
        </View>

        <View style={styles.postActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => toggleLike(post.id, post.likedBy)}
          >
            <Ionicons
              name={isLiked ?
                'heart' : 'heart-outline'}
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
          <KeyboardAvoidingView
            style={{
              flex: 1
            }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
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
                                {comment.userName ||
                                  'Anonymous'}
                              </Text>
                              <Text style={styles.userComment}>{comment.text}</Text>
                            </View>
                          </View>
                        ))}
                      </ScrollView>

                      <View style={styles.commentInputRow}>
                        {currentUserProfileImage ? (
                          <Image source={{ uri: currentUserProfileImage }} style={styles.profileImagePost} />
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
                  </Animated.View>
                </PanGestureHandler>
              </Animated.View>
            </TouchableWithoutFeedback>
          </KeyboardAvoidingView>
        </Modal>

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

              <TouchableOpacity style={styles.shareButton} onPress={() => { }}>
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
    color: '#1a1a1a',
    lineHeight: 22,
    marginBottom: 12,
    letterSpacing: -0.1,
  },
  postImagesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
    marginHorizontal: -3,
    borderRadius: 12,
    overflow: 'hidden',
  },
  postImageWrapperSingle: {
    width: '100%',
    marginBottom: 0,
  },
  postImageWrapperDouble: {
    width: '50%',
    padding: 3,
  },
  postImageWrapperMultiple: {
    width: '50%',
    padding: 3,
  },
  postImageSingle: {
    width: '100%',
    height: 380,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
  },
  postImageThumbnail: {
    width: '100%',
    height: 180,
    borderRadius: 10,
    backgroundColor: '#f0f0f0',
  },
  moreImagesOverlay: {
    position: 'absolute',
    top: 3,
    left: 3,
    right: 3,
    bottom: 3,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
  },
  moreImagesText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
    marginTop: 6,
    letterSpacing: -0.5,
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
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '60%',
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  sharedPostWrapper: {
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    marginTop: 2,
  },
  sharedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  sharedIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#ffe8e8ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  sharedBadge: {
    fontSize: 13,
    color: '#666',
    flex: 1,
  },
  sharedUsername: {
    fontWeight: '600',
    color: '#E50914',
  },
  originalPostCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e8eaed',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  originalAuthorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  originalAuthorAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 10,
    backgroundColor: '#f0f0f0',
  },
  originalAuthorAvatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 10,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  originalAuthorInfo: {
    flex: 1,
  },
  originalAuthorName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  originalPostTime: {
    fontSize: 12,
    color: '#999',
  },
  originalPostText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    marginBottom: 10,
  },
  originalImageWrapper: {
    position: 'relative',
    borderRadius: 10,
    overflow: 'hidden',
  },
  originalPostImage: {
    width: '100%',
    height: 280,
    backgroundColor: '#f0f0f0',
  },
  imageCountBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  imageCountText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },


  commentCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 7,
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
  },

  commentInput: {
    flex: 1,
    backgroundColor: '#f0f0f0',

    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginHorizontal: 10,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  shareModalContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 30,
    maxHeight: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 15,
  },
  shareModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
  },
  shareModalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1a1a1a',
    letterSpacing: -0.3,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shareHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
    paddingVertical: 12,
    backgroundColor: '#fafafa',
    marginHorizontal: 16,
    borderRadius: 12,
  },
  shareProfilePic: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
    borderWidth: 2,
    borderColor: '#fff',
  },
  placeholderProfilePic: {
    width: 48,
    height: 48,
    borderRadius: 24,
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
    color: '#1a1a1a',
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  shareSubtextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  globeIcon: {
    marginRight: 6,
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
    fontSize: 16,
    color: '#1a1a1a',
    minHeight: 120,
    maxHeight: 220,
    padding: 16,
    backgroundColor: '#fafafa',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#e8e8e8',
    lineHeight: 22,
  },
  inputFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'end',
    marginTop: 10,
    paddingHorizontal: 4,
  },
  emojiButton: {
    padding: 4,
  },
  characterCount: {
    fontSize: 13,
    color: '#999',
    fontWeight: '500',
    textAlign: 'right',
    justifyContent: 'flex-end',
  },
  characterCountWarning: {
    color: '#ff9500',
  },
  shareActions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    letterSpacing: -0.2,
  },
  shareButton: {
    flex: 1.2,
    flexDirection: 'row',
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  shareButtonDisabled: {
    backgroundColor: '#d0d0d0',
    shadowOpacity: 0,
  },
  shareButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: -0.2,
  },
  shareIcon: {
    marginRight: 8,
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
    backgroundColor: '#FFE5E9',
    borderRadius: 8,
    marginVertical: 10,
    borderColor: '#E50914',
    borderWidth: 1,
  },
  recommendationHeaderText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#E50914',
  },
  recommendationBadge: {
    position: 'absolute',
    top: 20,
    right: 15,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFE5E9',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
    zIndex: 10,
    borderWidth: 1,
    borderColor: '#E50914',
  },
  recommendationText: {
    marginLeft: 4,
    fontSize: 11,
    fontWeight: 'bold',
    color: '#E50914',
  },
});