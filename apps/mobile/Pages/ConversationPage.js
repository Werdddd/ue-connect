import React, { useState, useEffect } from 'react';
import { View, Text, SafeAreaView, ScrollView, TextInput, TouchableOpacity, StyleSheet, Platform, Image, KeyboardAvoidingView } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { firestore, auth } from '../Firebase';
import { collection, query, addDoc, serverTimestamp, onSnapshot, orderBy, doc, getDoc, updateDoc } from 'firebase/firestore';

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

    const tempMessage = messageText.trim();
    setMessageText('');

    try {
      await addDoc(collection(firestore, `chats/${chatId}/messages`), {
        senderId: currentUserId,
        text: tempMessage,
        createdAt: serverTimestamp(),
      });

      await updateDoc(doc(firestore, 'chats', chatId), {
        lastMessage: {
          text: tempMessage,
          senderId: currentUserId,
          createdAt: serverTimestamp(),
        }
      });

    } catch (error) {
      console.error('Error sending message:', error);
      setMessageText(tempMessage);
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp?.toDate) return '';
    
    const date = timestamp.toDate();
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    const displayMinutes = minutes < 10 ? `0${minutes}` : minutes;
    
    return `${displayHours}:${displayMinutes} ${ampm}`;
  };

  const shouldShowTimestamp = (currentMessage, previousMessage) => {
    if (!previousMessage) return true;
    
    const currentTime = currentMessage.createdAt?.toDate?.();
    const previousTime = previousMessage.createdAt?.toDate?.();
    
    if (!currentTime || !previousTime) return false;
    
    const timeDiff = Math.abs(currentTime - previousTime) / 1000 / 60; // minutes
    return timeDiff > 5;
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => navigation.goBack()} 
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={28} color="#E50914" />
          </TouchableOpacity>

          {otherUserData ? (
            <View style={styles.headerUserInfo}>
              {otherUserData.profileImage ? (
                <Image
                  source={{ uri: otherUserData.profileImage }}
                  style={styles.profileImage}
                />
              ) : (
                <View style={[styles.profileImage, styles.profileImagePlaceholder]}>
                  <Text style={styles.profileImageText}>
                    {otherUserData.firstName?.[0]}{otherUserData.lastName?.[0]}
                  </Text>
                </View>
              )}
              <View style={styles.headerTextContainer}>
                <Text style={styles.headerName}>
                  {otherUserData.firstName} {otherUserData.lastName}
                </Text>
                <Text style={styles.headerStatus}>Active now</Text>
              </View>
            </View>
          ) : (
            <View style={styles.headerUserInfo}>
              <View style={[styles.profileImage, styles.profileImagePlaceholder]} />
              <Text style={styles.headerName}>Loading...</Text>
            </View>
          )}

          <TouchableOpacity style={styles.moreButton}>
            <Ionicons name="ellipsis-horizontal" size={24} color="#8E8E93" />
          </TouchableOpacity>
        </View>

        {/* Messages */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        >
          {messages.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconContainer}>
                <Ionicons name="chatbubbles-outline" size={64} color="#C7C7CC" />
              </View>
              <Text style={styles.emptyTitle}>No messages yet</Text>
              <Text style={styles.emptySubtitle}>
                Start the conversation with {otherUserData?.firstName}
              </Text>
            </View>
          ) : (
            messages.map((message, index) => {
              const isSent = message.senderId === currentUserId;
              const showTimestamp = shouldShowTimestamp(message, messages[index - 1]);
              const isConsecutive = 
                index > 0 && 
                messages[index - 1].senderId === message.senderId &&
                !shouldShowTimestamp(message, messages[index - 1]);

              return (
                <View key={message.id}>
                  {showTimestamp && (
                    <View style={styles.timestampContainer}>
                      <Text style={styles.timestampText}>
                        {formatTime(message.createdAt)}
                      </Text>
                    </View>
                  )}
                  <View
                    style={[
                      styles.messageWrapper,
                      isSent ? styles.sentWrapper : styles.receivedWrapper,
                    ]}
                  >
                    {!isSent && !isConsecutive && (
                      <View style={styles.messageAvatar}>
                        {otherUserData?.profileImage ? (
                          <Image
                            source={{ uri: otherUserData.profileImage }}
                            style={styles.messageAvatarImage}
                          />
                        ) : (
                          <View style={[styles.messageAvatarImage, styles.messageAvatarPlaceholder]}>
                            <Text style={styles.messageAvatarText}>
                              {otherUserData?.firstName?.[0]}
                            </Text>
                          </View>
                        )}
                      </View>
                    )}
                    <View
                      style={[
                        styles.messageBubble,
                        isSent ? styles.sentMessage : styles.receivedMessage,
                        isConsecutive && (isSent ? styles.sentConsecutive : styles.receivedConsecutive),
                        !isSent && isConsecutive && { marginLeft: 40 }
                      ]}
                    >
                      <Text style={[
                        styles.messageText,
                        isSent ? styles.sentText : styles.receivedText
                      ]}>
                        {message.text}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>

        {/* Input */}
        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <TouchableOpacity style={styles.attachButton}>
              <Ionicons name="add-circle" size={28} color="#E50914" />
            </TouchableOpacity>
            <TextInput
              style={styles.input}
              value={messageText}
              onChangeText={setMessageText}
              placeholder="Message..."
              placeholderTextColor="#C7C7CC"
              multiline
              maxHeight={100}
            />
            {messageText.trim() ? (
              <TouchableOpacity 
                style={styles.sendButton} 
                onPress={sendMessage}
                activeOpacity={0.7}
              >
                <Ionicons name="send" size={20} color="#fff" />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.voiceButton}>
                <Ionicons name="mic" size={24} color="#E50914" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
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
    backgroundColor: '#F8F8F8',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  backButton: {
    marginRight: 8,
    padding: 4,
  },
  headerUserInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  profileImagePlaceholder: {
    backgroundColor: '#E50914',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileImageText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  headerTextContainer: {
    flex: 1,
  },
  headerName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
  },
  headerStatus: {
    fontSize: 13,
    color: '#34C759',
    marginTop: 2,
  },
  moreButton: {
    padding: 4,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexGrow: 1,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
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
  },
  timestampContainer: {
    alignItems: 'center',
    marginVertical: 16,
  },
  timestampText: {
    fontSize: 12,
    color: '#8E8E93',
    backgroundColor: '#E5E5EA',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: 'hidden',
  },
  messageWrapper: {
    flexDirection: 'row',
    marginBottom: 4,
    alignItems: 'flex-end',
  },
  sentWrapper: {
    justifyContent: 'flex-end',
  },
  receivedWrapper: {
    justifyContent: 'flex-start',
  },
  messageAvatar: {
    width: 32,
    height: 32,
    marginRight: 8,
  },
  messageAvatarImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  messageAvatarPlaceholder: {
    backgroundColor: '#E50914',
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageAvatarText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  messageBubble: {
    maxWidth: '75%',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  sentMessage: {
    backgroundColor: '#E50914',
    borderBottomRightRadius: 4,
  },
  receivedMessage: {
    backgroundColor: '#E5E5EA',
    borderBottomLeftRadius: 4,
  },
  sentConsecutive: {
    borderBottomRightRadius: 20,
    marginTop: 2,
  },
  receivedConsecutive: {
    borderBottomLeftRadius: 20,
    marginTop: 2,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  sentText: {
    color: '#fff',
  },
  receivedText: {
    color: '#000',
  },
  inputContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#F2F2F7',
    borderRadius: 24,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  attachButton: {
    padding: 6,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#000',
    paddingHorizontal: 8,
    paddingVertical: 8,
    maxHeight: 100,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E50914',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  voiceButton: {
    padding: 6,
  },
});