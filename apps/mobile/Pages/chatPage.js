import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, SafeAreaView, Modal, TextInput, Keyboard, TouchableWithoutFeedback, Pressable, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { collection, getDocs, getDoc, addDoc, serverTimestamp, onSnapshot, query, orderBy, doc, setDoc, where, limit } from 'firebase/firestore';
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
  const [searchTerm, setSearchTerm] = useState('');

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
  const filteredUsers = searchTerm.trim()
    ? Users.filter(user =>
      `${user.firstName} ${user.lastName}`
        .toLowerCase()
        .includes(searchTerm.trim().toLowerCase())
    )
    : Users;
  const getChatBetweenUsers = async (u1Id, u2Id) => {
    try {
      // Query the 'chats' collection for a chat containing both user IDs
      const chatQuery = query(
        collection(firestore, 'chats'), 
        where(`Users.${u1Id}`, '==', true),
        where(`Users.${u2Id}`, '==', true),
        limit(1) // Only need to find one chat
      );
    const querySnapshot = await getDocs(chatQuery);
    if (!querySnapshot.empty) {
      return querySnapshot.docs[0];
    } else {
      return null; // No existing chat found
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

      const chatDoc = await getDoc(chatRef);
      const chatData = chatDoc.data();
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
                  {selectedUserId ? (
                    <>
                      <Text style={styles.label}>Recipient:</Text>
                      <Pressable 
                        style={styles.recipientSelectedDisplay}
                        onPress={() => {
                          setSelectedUserId(''); 
                          setSearchQuery(''); 
                          setMessageText(''); 
                        }}
                      >
                        <Text style={styles.recipientSelectedName}>
                          {Users.find(u => u.id === selectedUserId)?.firstName}{' '}
                          {Users.find(u => u.id === selectedUserId)?.lastName}
                        </Text>
                        <Text style={styles.recipientChangeText}>Change Recipient</Text>
                      </Pressable>
                    </>
                  ) : (
                    <Text style={styles.selectionPrompt}>Select a recipient to start composing your message:</Text>
                  )}
                  {!selectedUserId && (
                    <>
                      <TextInput
                        style={styles.searchInput}
                        placeholder="Search for a user..."
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                      />

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
                            setSearchQuery(''); 
                            Keyboard.dismiss(); 
                          }}
                        >
                          <Image
                            source={{ uri: user.profileImage }}
                            style={styles.profileImage}
                          />
                          <View style={styles.userDetails}>
                            <Text style={styles.name}>{user.firstName} {user.lastName}</Text>
                            <Text style={styles.courseYear}>{user.Course} {user.Year}</Text>
                            <Text style={styles.email}>{user.email}</Text>
                          </View>
                        </TouchableOpacity>
                      ))}
                      </ScrollView>
                    </>
                  )}
                  {selectedUserId && (
                    <>
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
                    </>
                  )}
                  {/* --- END: MESSAGE COMPOSITION PHASE --- */}

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
    fontWeight: '700',
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
    height: 200,
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
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    marginBottom: 10,
    backgroundColor: '#fff',
  },
  searchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 5,
  },

  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
    backgroundColor: '#ddd',
  },

  recipientSelectedDisplay: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E50914',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    backgroundColor: '#ffe6e6', // Light background for selection display
  },
  recipientSelectedName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#E50914',
  },
  recipientChangeText: {
    fontSize: 14,
    color: '#E50914',
    textDecorationLine: 'underline',
  },
  selectionPrompt: {
    fontSize: 16,
    color: '#555',
    textAlign: 'center',
    marginVertical: 10,
  },

  userDetails: {
    flex: 1,
  },

  name: {
    fontSize: 16,
    fontWeight: 'bold',
  },

  courseYear: {
    fontSize: 14,
    color: '#444',
    marginTop: 2,
  },

  email: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
});
