import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, SafeAreaView, Modal, TextInput, Keyboard, TouchableWithoutFeedback, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { collection, getDocs, getDoc, addDoc, serverTimestamp, onSnapshot, query, orderBy, doc, setDoc, where, } from 'firebase/firestore';
import { auth, firestore } from '../Firebase';
import { formatDistanceToNow } from 'date-fns';
import BottomNavBar from '../components/bottomNavBar';
import Header from '../components/header';
import { useNavigation } from '@react-navigation/native';

export default function ChatPage() {
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [messageText, setMessageText] = useState('');
  const [Users, setUsers] = useState([]);
  const [chats, setChats] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);
  const navigation = useNavigation();
  const [messages, setMessages] = useState([]);

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
    const user = auth.currentUser;
    if (user) {
      setCurrentUserId(user.email);
    }
  }, []);

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
  };

  const handleStartConversation = async () => {
    if (!selectedUserId || !messageText.trim() || !currentUserId) return;

    try {
      const existingChat = await getChatBetweenUsers(currentUserId, selectedUserId);

      if (existingChat) {
        await sendMessage(existingChat.id);
      } else {
        const newChat = await createNewChat(selectedUserId);
        await sendMessage(newChat.id);
      }

      toggleModal();
    } catch (error) {
      console.error('Error starting conversation:', error);
    }
  };

  // console.log("Fetching chats for: ", currentUserId, selectedUserId);
  // console.log("All chats in state:", chats);
  const getChatBetweenUsers = async () => {
    try {
      if (!currentUserId || !selectedUserId) return;

      const chatQuery = query(
        collection(firestore, 'chatRooms'),
        where(`Users.${currentUserId}`, '==', true),
        where(`Users.${selectedUserId}`, '==', true)
      );

      const querySnapshot = await getDocs(chatQuery);

      if (!querySnapshot.empty) {
        const chatRoom = querySnapshot.docs[0].data();
        setMessages(chatRoom.messages || []);
      } else {
        console.log('No chat found between users');
        setMessages([]);
      }
    } catch (error) {
      console.error('Error fetching chat:', error);
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

      const chatDoc = await getDoc(chatRef);
      const chatData = chatDoc.data();
      if (chatData && chatData.Users) {
        const recipientId = Object.keys(chatData.Users).find(id => id !== currentUserId);

        if (recipientId) {
          await sendNotification({
            userId: recipientId,
            type: 'message',
            content: `You have a new message from ${currentUserId}`,
          });
        }
      }
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

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <SafeAreaView style={styles.safeArea}>
          <View style={{ flex: 1 }}>
            <Header />
            <ScrollView
              contentContainerStyle={{ flexGrow: 1, paddingBottom: 80, paddingHorizontal: 20 }}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.headerContainer}>
                <Text style={styles.headerText}>Your Messages</Text>
                <TouchableOpacity style={styles.newConversationButton} onPress={toggleModal}>
                  <Text style={styles.newConversationText}>+</Text>
                </TouchableOpacity>
              </View>

              {chats.length > 0 ? (
                chats.map(chat => {
                  const otherUser = getOtherUserInfo(chat);
                  return (
                    <TouchableOpacity key={chat.id} style={styles.chatCard} onPress={() => handleCardPress(chat.id)}>
                      <Text style={styles.chatName}>
                        {otherUser ? `${otherUser.firstName} ${otherUser.lastName}` : 'Unknown User'}
                      </Text>
                      <Text style={styles.chatMessage} numberOfLines={1}>
                        {chat.lastMessage?.text || 'No messages yet'}
                      </Text>
                      <Text style={styles.timestamp}>
                        {chat.lastMessage?.createdAt?.toDate
                          ? formatDistanceToNow(chat.lastMessage.createdAt.toDate(), { addSuffix: true })
                          : ''}
                      </Text>
                    </TouchableOpacity>
                  );
                })
              ) : (
                <Text>No conversations found</Text>
              )}
            </ScrollView>

            <BottomNavBar />
          </View>

          {/* Modal */}
          <Modal
            visible={shareModalVisible}
            animationType="slide"
            transparent={true}
            onRequestClose={toggleModal}
          >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <View style={styles.modalContainer}>
                <View style={styles.modalContent}>
                  <Text style={styles.modalTitle}>Start a New Conversation</Text>

                  <Text style={styles.label}>Select Recipient:</Text>
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Search for a user..."
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                  />

                  {searchQuery.length > 0 && (
                    <ScrollView style={styles.searchResults}>
                      {Users.filter(user =>
                        user.id !== currentUserId &&
                        (`${user.firstName} ${user.lastName}`)
                          .toLowerCase()
                          .includes(searchQuery.toLowerCase())
                      ).map(user => (
                        <TouchableOpacity
                          key={user.id}
                          style={styles.searchItem}
                          onPress={() => {
                            setSelectedUserId(user.id);
                            setSearchQuery(`${user.firstName} ${user.lastName}`);
                          }}
                        >
                          <Text>{user.firstName} {user.lastName}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  )}


                  <Text style={styles.label}>Message:</Text>
                  <TextInput
                    style={styles.textInput}
                    value={messageText}
                    onChangeText={setMessageText}
                    placeholder="Type your message..."
                    multiline
                  />

                  <TouchableOpacity
                    style={styles.sendButton}
                    onPress={handleStartConversation}
                    disabled={!selectedUserId || !messageText.trim()}
                  >
                    <Text style={styles.sendButtonText}>Send Message</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.closeButton} onPress={toggleModal}>
                    <Text style={styles.closeButtonText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </Modal>
        </SafeAreaView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 80,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  newConversationButton: {
    backgroundColor: '#E50914',
    borderRadius: 50,
    width: 40,
    height: 40,
    alignItems: 'center',
  },
  newConversationText: {
    color: '#fff',
    fontSize: 30,
    fontWeight: 'bold',
  },
  chatCard: {
    backgroundColor: '#f0f0f0',
    padding: 15,
    marginTop: 15,
    borderRadius: 10,
  },
  chatName: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  chatMessage: {
    fontSize: 14,
    color: '#555',
    marginTop: 5,
  },
  timestamp: {
    fontSize: 12,
    color: '#999',
    marginTop: 5,
    textAlign: 'right',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    height: '70%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  label: {
    fontSize: 16,
    marginTop: 20,
    marginBottom: 10,
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    overflow: 'hidden',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    minHeight: 100,
  },
  sendButton: {
    backgroundColor: '#E50914',
    padding: 15,
    borderRadius: 10,
    marginTop: 10,
  },
  sendButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  closeButton: {
    marginTop: 20,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#E50914',
    fontWeight: 'bold',
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  searchResults: {
    maxHeight: 150,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    marginBottom: 10,
    backgroundColor: '#fff',
  },
  
  searchItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
});
