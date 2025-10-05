import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, SafeAreaView, Modal, TextInput, Keyboard, TouchableWithoutFeedback, Pressable, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { collection, getDocs, addDoc, serverTimestamp, onSnapshot, query, orderBy, doc, setDoc, where, limit, getDoc } from 'firebase/firestore';
import { auth, firestore } from '../Firebase';
import { formatDistanceToNow } from 'date-fns';
import BottomNavBar from '../components/bottomNavBar';
import Header from '../components/header';
import { useNavigation } from '@react-navigation/native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';

export default function ChatPage() {
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [messageText, setMessageText] = useState('');
  const [Users, setUsers] = useState([]);
  const [chats, setChats] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [connections, setConnections] = useState([]);
  const navigation = useNavigation();

  useEffect(() => {
    const fetchUsers = async () => {
      const snapshot = await getDocs(collection(firestore, 'Users'));
      const fetchedUsers = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setUsers(fetchedUsers);
    };
    fetchUsers();
  }, []);

  useEffect(() => {
    if (!currentUserId) return;

    const fetchConnections = async () => {
      try {
        const userDoc = await getDoc(doc(firestore, 'Users', currentUserId));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const connectionIds = userData.connections || [];
          
          const connectedUsers = Users.filter(user => 
            connectionIds.includes(user.id)
          );
          setConnections(connectedUsers);
        }
      } catch (error) {
        console.error('Error fetching connections:', error);
      }
    };

    if (Users.length > 0) {
      fetchConnections();
    }
  }, [currentUserId, Users]);

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged(user => {
      if (user) {
        setCurrentUserId(user.email);
      }
    });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!currentUserId) return;

    const q = query(collection(firestore, 'chats'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const filteredChats = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(chat => chat.Users && chat.Users[currentUserId]);

      setChats(filteredChats);
    });

    return () => unsubscribe();
  }, [currentUserId]);

  const toggleModal = () => {
    setShareModalVisible(!shareModalVisible);
    setSelectedUserId('');
    setMessageText('');
    setSearchQuery('');
  };

  const getChatBetweenUsers = async (u1Id, u2Id) => {
    try {
      const chatQuery = query(
        collection(firestore, 'chats'), 
        where(`Users.${u1Id}`, '==', true),
        where(`Users.${u2Id}`, '==', true),
        limit(1)
      );
      const querySnapshot = await getDocs(chatQuery);
      if (!querySnapshot.empty) {
        return querySnapshot.docs[0];
      } else {
        return null;
      }
    } catch (error) {
      console.error('Error fetching chat:', error);
      return null;
    }
  };

  const handleStartConversation = async () => {
    if (!selectedUserId || !messageText.trim() || !currentUserId) return;
    try {
      const existingChatDoc = await getChatBetweenUsers(currentUserId, selectedUserId);

      let chatId;
      if (existingChatDoc) {
        chatId = existingChatDoc.id;
      } else {
        const newChatRef = await createNewChat(selectedUserId);
        chatId = newChatRef.id;
      }
      await sendMessage(chatId);
      toggleModal();
    } catch (error) {
      console.error('Error starting conversation:', error);
    }
  };

  const createNewChat = async (selectedUserId) => {
    const chatRef = collection(firestore, 'chats');
    const newChat = await addDoc(chatRef, {
      Users: {
        [currentUserId]: true,
        [selectedUserId]: true,
      },
      createdAt: serverTimestamp(),
      lastMessage: {
        text: messageText.trim(),
        senderId: currentUserId,
        createdAt: serverTimestamp(),
      }
    });
    
    return newChat;
  };

  const sendMessage = async (chatId) => {
    try {
      await addDoc(collection(firestore, `chats/${chatId}/messages`), {
        senderId: currentUserId,
        text: messageText.trim(),
        createdAt: serverTimestamp(),
      });

      const chatRef = doc(firestore, 'chats', chatId);
      await setDoc(chatRef, {
        lastMessage: {
          text: messageText.trim(),
          senderId: currentUserId,
          createdAt: serverTimestamp(),
        },
      }, { merge: true });
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const getOtherUserInfo = (chat) => {
    const otherId = Object.keys(chat.Users).find(id => id !== currentUserId);
    return Users.find(u => u.id === otherId);
  };

  const handleCardPress = (chatId) => {
    navigation.navigate('ConversationPage', { chatId });
  };

  const filteredUsers = Users.filter(user =>
    user.id !== currentUserId &&
    (`${user.firstName} ${user.lastName}`)
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Header />
        
        <View style={styles.headerSection}>
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.headerTitle}>Messages</Text>
              <Text style={styles.headerSubtitle}>
                {chats.length} {chats.length === 1 ? 'conversation' : 'conversations'}
              </Text>
            </View>
            <TouchableOpacity 
              style={styles.newChatButton} 
              onPress={toggleModal}
              activeOpacity={0.7}
            >
              <Ionicons name="create-outline" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          style={styles.chatList}
          contentContainerStyle={styles.chatListContent}
          showsVerticalScrollIndicator={false}
        >
          {chats.length > 0 ? (
            chats.map(chat => {
              const otherUser = getOtherUserInfo(chat);
              const isCurrentUserSender = chat.lastMessage?.senderId === currentUserId;
              
              return (
                <TouchableOpacity 
                  key={chat.id} 
                  style={styles.chatCard} 
                  onPress={() => handleCardPress(chat.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.avatarContainer}>
                    {otherUser?.profileImage ? (
                      <Image
                        source={{ uri: otherUser.profileImage }}
                        style={styles.avatar}
                      />
                    ) : (
                      <View style={[styles.avatar, styles.avatarPlaceholder]}>
                        <Text style={styles.avatarText}>
                          {otherUser?.firstName?.[0]}{otherUser?.lastName?.[0]}
                        </Text>
                      </View>
                    )}
                    <View style={styles.onlineIndicator} />
                  </View>

                  <View style={styles.chatContent}>
                    <View style={styles.chatHeader}>
                      <Text style={styles.chatName} numberOfLines={1}>
                        {otherUser ? `${otherUser.firstName} ${otherUser.lastName}` : 'Unknown User'}
                      </Text>
                      <Text style={styles.timestamp}>
                        {chat.lastMessage?.createdAt?.toDate
                          ? formatDistanceToNow(chat.lastMessage.createdAt.toDate(), { addSuffix: true })
                          : ''}
                      </Text>
                    </View>
                    <View style={styles.messageRow}>
                      <Text style={styles.chatMessage} numberOfLines={1}>
                        {isCurrentUserSender && 'You: '}
                        {chat.lastMessage?.text || 'No messages yet'}
                      </Text>
                      <Ionicons name="chevron-forward" size={18} color="#C7C7CC" />
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })
          ) : (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconContainer}>
                <Ionicons name="chatbubbles-outline" size={64} color="#C7C7CC" />
              </View>
              <Text style={styles.emptyTitle}>No messages yet</Text>
              <Text style={styles.emptySubtitle}>
                Start a conversation by tapping the compose button above
              </Text>
            </View>
          )}
        </ScrollView>

        <BottomNavBar />

        <Modal
          visible={shareModalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={toggleModal}
        >
          <View style={styles.modalOverlay}>
            <KeyboardAvoidingView
      style={{ justifyContent: 'flex-end', flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
              <View style={[styles.modalContent, { maxHeight: '85%' }]}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>New Message</Text>
                  <TouchableOpacity 
                    onPress={toggleModal}
                    style={styles.closeModalButton}
                  >
                    <Ionicons name="close" size={28} color="#8E8E93" />
                  </TouchableOpacity>
                </View>

                <View style={[styles.modalBody, { flex: 0 }]}>
                  {!selectedUserId ? (
                    <>
                      <View style={styles.searchContainer}>
                        <Ionicons name="search" size={20} color="#8E8E93" style={styles.searchIcon} />
                        <TextInput
                          style={styles.searchInput}
                          placeholder="Search for a user..."
                          value={searchQuery}
                          onChangeText={setSearchQuery}
                          placeholderTextColor="#C7C7CC"
                        />
                        {searchQuery.length > 0 && (
                          <TouchableOpacity onPress={() => setSearchQuery('')}>
                            <Ionicons name="close-circle" size={20} color="#C7C7CC" />
                          </TouchableOpacity>
                        )}
                      </View>

                     <ScrollView 
                style={{ maxHeight: 320 }} // <-- Ensure scroll area is visible
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                        {!searchQuery && connections.length > 0 && (
                          <>
                            <Text style={styles.sectionTitle}>Your Connections</Text>
                            {connections.map(user => (
                              <TouchableOpacity
                                key={user.id}
                                style={styles.userItem}
                                onPress={() => {
                                  setSelectedUserId(user.id);
                                  Keyboard.dismiss();
                                }}
                                activeOpacity={0.7}
                              >
                                {user.profileImage ? (
                                  <Image
                                    source={{ uri: user.profileImage }}
                                    style={styles.userAvatar}
                                  />
                                ) : (
                                  <View style={[styles.userAvatar, styles.userAvatarPlaceholder]}>
                                    <Text style={styles.userAvatarText}>
                                      {user.firstName?.[0]}{user.lastName?.[0]}
                                    </Text>
                                  </View>
                                )}
                                <View style={styles.userInfo}>
                                  <Text style={styles.userName}>
                                    {user.firstName} {user.lastName}
                                  </Text>
                                  <Text style={styles.userMeta}>
                                    {user.Course} • {user.Year}
                                  </Text>
                                </View>
                                <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
                              </TouchableOpacity>
                            ))}
                            
                            <Text style={[styles.sectionTitle, { marginTop: 24 }]}>All Users</Text>
                          </>
                        )}

                        {filteredUsers.length > 0 ? (
                          filteredUsers.map(user => (
                            <TouchableOpacity
                              key={user.id}
                              style={styles.userItem}
                              onPress={() => {
                                setSelectedUserId(user.id);
                                setSearchQuery('');
                                Keyboard.dismiss();
                              }}
                              activeOpacity={0.7}
                            >
                              {user.profileImage ? (
                                <Image
                                  source={{ uri: user.profileImage }}
                                  style={styles.userAvatar}
                                />
                              ) : (
                                <View style={[styles.userAvatar, styles.userAvatarPlaceholder]}>
                                  <Text style={styles.userAvatarText}>
                                    {user.firstName?.[0]}{user.lastName?.[0]}
                                  </Text>
                                </View>
                              )}
                              <View style={styles.userInfo}>
                                <Text style={styles.userName}>
                                  {user.firstName} {user.lastName}
                                </Text>
                                <Text style={styles.userMeta}>
                                  {user.Course} • {user.Year}
                                </Text>
                              </View>
                              <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
                            </TouchableOpacity>
                          ))
                        ) : (
                          searchQuery && (
                            <View style={styles.noResults}>
                              <Ionicons name="search-outline" size={48} color="#C7C7CC" />
                              <Text style={styles.noResultsText}>No users found</Text>
                            </View>
                          )
                        )}
                      </ScrollView>
                    </>
                  ) : (
                    <>
                      <View style={styles.selectedUserContainer}>
                        <Text style={styles.toLabel}>To:</Text>
                        <View style={styles.selectedUserBadge}>
                          <Text style={styles.selectedUserName}>
                            {Users.find(u => u.id === selectedUserId)?.firstName}{' '}
                            {Users.find(u => u.id === selectedUserId)?.lastName}
                          </Text>
                          <TouchableOpacity 
                            onPress={() => {
                              setSelectedUserId('');
                              setMessageText('');
                            }}
                            style={styles.removeUserButton}
                          >
                            <Ionicons name="close-circle" size={20} color="#8E8E93" />
                          </TouchableOpacity>
                        </View>
                      </View>

                      <ScrollView
                        style={{ maxHeight: 220 }}
                        contentContainerStyle={{ flexGrow: 1 }}
                        keyboardShouldPersistTaps="handled"
                      >
                        <View style={[styles.messageContainer, { minHeight: 100, maxHeight: 180 }]}>
                          <TextInput
                            style={styles.messageInput}
                            value={messageText}
                            onChangeText={setMessageText}
                            placeholder="Type your message..."
                            placeholderTextColor="#C7C7CC"
                            multiline
                            autoFocus
                          />
                        </View>
                      </ScrollView>

                      <TouchableOpacity
                        style={[
                          styles.sendButton,
                          (!messageText.trim()) && styles.sendButtonDisabled
                        ]}
                        onPress={handleStartConversation}
                        disabled={!messageText.trim()}
                        activeOpacity={0.7}
                      >
                        <Ionicons 
                          name="send" 
                          size={20} 
                          color="#fff" 
                          style={{ marginRight: 8 }} 
                        />
                        <Text style={styles.sendButtonText}>Send Message</Text>
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              </View>
            </KeyboardAvoidingView>
          </View>
        </Modal>
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
  headerSection: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000',
    letterSpacing: 0.3,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 2,
  },
  newChatButton: {
    backgroundColor: '#007AFF',
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  chatList: {
    flex: 1,
    backgroundColor: '#F8F8F8',
  },
  chatListContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 20,
  },
  chatCard: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#E5E5EA',
  },
  avatarPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
  },
  avatarText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#34C759',
    borderWidth: 2,
    borderColor: '#fff',
  },
  chatContent: {
    flex: 1,
    justifyContent: 'center',
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  chatName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
    flex: 1,
  },
  timestamp: {
    fontSize: 13,
    color: '#8E8E93',
    marginLeft: 8,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  chatMessage: {
    fontSize: 15,
    color: '#8E8E93',
    flex: 1,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 21,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalKeyboardView: {
    flex: 1,
    justifyContent: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 24,
    maxHeight: '85%',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
  },
  closeModalButton: {
    padding: 4,
  },
  modalBody: {
    flex: 1,
    padding: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#000',
  },
  userList: {
    flex: 1,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E8E93',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginTop: 8,
    paddingHorizontal: 4,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    marginBottom: 8,
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E5E5EA',
    marginRight: 12,
  },
  userAvatarPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
  },
  userAvatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 2,
  },
  userMeta: {
    fontSize: 14,
    color: '#8E8E93',
  },
  noResults: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  noResultsText: {
    fontSize: 16,
    color: '#8E8E93',
    marginTop: 12,
  },
  selectedUserContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  toLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8E8E93',
    marginRight: 12,
  },
  selectedUserBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E5F1FF',
    paddingVertical: 8,
    paddingLeft: 16,
    paddingRight: 12,
    borderRadius: 20,
  },
  selectedUserName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#007AFF',
    marginRight: 8,
  },
  removeUserButton: {
    padding: 2,
  },
  messageContainer: {
    flex: 1,
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  messageInput: {
    fontSize: 16,
    color: '#000',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  sendButton: {
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  sendButtonDisabled: {
    backgroundColor: '#C7C7CC',
    shadowOpacity: 0,
    elevation: 0,
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
});