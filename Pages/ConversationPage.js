import React, { useState, useEffect } from 'react';
import { View, Text, SafeAreaView, ScrollView, TextInput, TouchableOpacity, StyleSheet, Platform, Image } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { firestore, auth } from '../Firebase';
import { collection, query, addDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import BottomNavBar from '../components/bottomNavBar';
import { orderBy, doc, getDoc, updateDoc } from 'firebase/firestore';

export default function ConversationPage() {
  const route = useRoute();
  const navigation = useNavigation();
  const { chatId } = route.params;
  const [currentUserId, setCurrentUserId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [otherUserData, setOtherUserData] = useState(null);
  const scrollViewRef = React.useRef();

  useEffect(() => {
    if (!chatId) return;

    const messagesRef = collection(firestore, `chats/${chatId}/messages`);
    const q = query(messagesRef, orderBy('createdAt'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedMessages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMessages(fetchedMessages);
    });

    return () => unsubscribe();
  }, [chatId]);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      if (user) {
        setCurrentUserId(user.email);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {

    const fetchOtherUserData = async () => {
      if (!chatId || !currentUserId) return;

      try {
        const chatDoc = doc(firestore, `chats/${chatId}`);
        const chatSnapshot = await getDoc(chatDoc);

        if (chatSnapshot.exists()) {
          const chatData = chatSnapshot.data();
          const users = chatData.Users;

          const otherUserId = Object.keys(users).find(userId => userId !== currentUserId);

          const otherUserRef = doc(firestore, 'Users', otherUserId);
          const otherUserSnapshot = await getDoc(otherUserRef);
          console.log('Other user data:', currentUserId);
          console.log('Other user data:', otherUserId);
          if (otherUserSnapshot.exists()) {
            setOtherUserData(otherUserSnapshot.data());
          }
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    fetchOtherUserData();
  }, [chatId, currentUserId]);

  const sendMessage = async () => {
    if (!messageText.trim()) return;

    try {
      await addDoc(collection(firestore, `chats/${chatId}/messages`), {
        senderId: currentUserId,
        text: messageText.trim(),
        createdAt: serverTimestamp(),
      });
      setMessageText('');

      await updateDoc(doc(firestore, 'chats', chatId), {
        lastMessage: {
          text: messageText.trim(),
          senderId: currentUserId,
          createdAt: serverTimestamp(),
        }
      });

    } catch (error) {
      console.error('Error sending message:', error);
    }
  };




  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#E50914" />
        </TouchableOpacity>

        {otherUserData ? (
          <View style={styles.headerUserInfo}>
            <Image
              source={{ uri: otherUserData.profileImage }}
              style={styles.profileImage}
            />
            <Text style={styles.headerText}>
              {otherUserData.firstName} {otherUserData.lastName}
            </Text>
          </View>
        ) : (
          <Text style={styles.headerText}>Loading...</Text>
        )}
      </View>

      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}>
        {messages.map((message) => (
          <View
            key={message.id}
            style={[
              styles.messageBubble,
              message.senderId !== currentUserId ? styles.receivedMessage : styles.sentMessage,
            ]}
          >
            <Text style={[styles.messageText, message.senderId === currentUserId ? { color: '#fff' } : { color: '#000' }]}>
              {message.text}
            </Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={messageText}
          onChangeText={setMessageText}
          placeholder="Type a message..."
          multiline
        />
        <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
          <Text style={styles.sendButtonText}>Send</Text>
        </TouchableOpacity>
      </View>

      <BottomNavBar />
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  container: {
    marginTop: Platform.OS === 'android' ? 40 : 0,
    flex: 1,
    backgroundColor: '#fff',
  },
  messagesContainer: {
    flex: 1,
    padding: 15,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 20,
    marginBottom: 10,
    color: '#fff',
  },
  sentMessage: {
    backgroundColor: '#E50914',
    alignSelf: 'flex-end',
    marginLeft: '20%',
    color: '#fff',
  },
  receivedMessage: {
    backgroundColor: '#f0f0f0',
    alignSelf: 'flex-start',
    marginRight: '20%',
  },
  messageText: {
    fontSize: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    backgroundColor: '#fff',
  },
  input: {
    flex: 1,
    height: 40,
    borderRadius: 20,
    paddingLeft: 15,
    backgroundColor: '#f0f0f0',
    marginRight: 10,
  },
  sendButton: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    backgroundColor: '#E50914',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#fff',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  backButton: {
    marginRight: 10,
  },
  headerUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 80,
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  headerText: {
    color: 'black',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
