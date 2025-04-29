import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, SafeAreaView, Modal, TextInput } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { collection, getDocs, addDoc, serverTimestamp, onSnapshot, query, orderBy, doc, setDoc, where } from 'firebase/firestore';
import { auth, firestore } from '../Firebase';
import { formatDistanceToNow } from 'date-fns';
import BottomNavBar from '../components/bottomNavBar';
import Header from '../components/header';
import { useNavigation } from '@react-navigation/native'; // Import useNavigation hook

export default function ChatPage() {
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [messageText, setMessageText] = useState('');
  const [users, setUsers] = useState([]);
  const [chats, setChats] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);
  const navigation = useNavigation(); // Hook to handle navigation

  // Fetch users
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

  // Get current user
  useEffect(() => {
    const user = auth.currentUser;
    if (user) {
      setCurrentUserId(user.uid);
    }
  }, []);

  // Listen to chats
  useEffect(() => {
    if (!currentUserId) return;

    const q = query(collection(firestore, 'chats'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const filteredChats = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(chat => chat.users && chat.users[currentUserId]);

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
      // Check if a chat already exists between the two users
      const existingChat = await getChatBetweenUsers(currentUserId, selectedUserId);
      
      if (existingChat) {
        // If chat exists, add the new message to the chat
        await sendMessage(existingChat.id);
      } else {
        // If chat doesn't exist, create a new chat and send the message
        const newChat = await createNewChat(selectedUserId);
        await sendMessage(newChat.id);
      }

      toggleModal();
    } catch (error) {
      console.error('Error starting conversation:', error);
    }
  };

  const getChatBetweenUsers = async (user1, user2) => {
    const q = query(collection(firestore, 'chats'), where('users', '==', { [user1]: true, [user2]: true }));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      return querySnapshot.docs[0];
    }
    return null;
  };

  const createNewChat = async (selectedUserId) => {
    const chatRef = collection(firestore, 'chats');
    const newChat = await addDoc(chatRef, {
      users: {
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
    await addDoc(collection(firestore, `chats/${chatId}/messages`), {
      senderId: currentUserId,
      text: messageText.trim(),
      createdAt: serverTimestamp(),
    });

    // Update the lastMessage field in the chat document
    const chatRef = doc(firestore, 'chats', chatId);
    await setDoc(chatRef, {
      lastMessage: {
        text: messageText.trim(),
        senderId: currentUserId,
        createdAt: serverTimestamp(),
      },
    }, { merge: true });
  };

  const getOtherUserInfo = (chat) => {
    const otherId = Object.keys(chat.users).find(uid => uid !== currentUserId);
    return users.find(u => u.id === otherId);
  };

  // Navigate to the ConversationPage when a chat card is pressed
  const handleCardPress = (chatId) => {
    navigation.navigate('ConversationPage', { chatId });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.headerContainer}>
          <Text style={styles.headerText}>Your Messages</Text>
          <TouchableOpacity style={styles.newConversationButton} onPress={toggleModal}>
            <Text style={styles.newConversationText}>+</Text>
          </TouchableOpacity>
        </View>

        {/* Chat Cards */}
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

      {/* Modal */}
      <Modal
        visible={shareModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={toggleModal}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Start a New Conversation</Text>

            <Text style={styles.label}>Select Recipient:</Text>
            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={selectedUserId}
                onValueChange={(itemValue) => setSelectedUserId(itemValue)}
              >
                <Picker.Item label="Select a user..." value="" />
                {users
                  .filter(u => u.id !== currentUserId)
                  .map(user => (
                    <Picker.Item
                      key={user.id}
                      label={`${user.firstName} ${user.lastName}`}
                      value={user.id}
                    />
                  ))}
              </Picker>
            </View>

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
      </Modal>
    </SafeAreaView>
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
    fontSize: 24,  // Increased size for "Your Messages"
    fontWeight: 'bold',
  },
  newConversationButton: {
    padding: 10,
    backgroundColor: '#E50914',
    borderRadius: 50,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  newConversationText: {
    color: '#fff',
    fontSize: 30,  // Adjusted to center the "+" sign
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
});
