// ChatCard.js
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const ChatCard = ({ conversation }) => {
  const navigation = useNavigation();
  
  const openConversation = () => {
    navigation.navigate('ConversationPage', { chatId: conversation.chatId });
  };

  return (
    <TouchableOpacity style={styles.card} onPress={openConversation}>
      <Text style={styles.userName}>{conversation.users.join(', ')}</Text>
      <Text style={styles.lastMessage}>{conversation.lastMessage}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#f1f1f1',
    padding: 15,
    marginBottom: 10,
    borderRadius: 8,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  lastMessage: {
    fontSize: 14,
    color: '#555',
  },
});

export default ChatCard;
