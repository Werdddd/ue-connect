import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { collection, query, where, onSnapshot, orderBy, writeBatch, doc } from 'firebase/firestore';
import { auth, firestore } from '../Firebase';
import Header from '../components/header';
import { Card } from 'react-native-paper';
import { MaterialIcons, FontAwesome5, Ionicons } from '@expo/vector-icons';

const NotificationScreen = () => {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const user = auth.currentUser;
    console.log('Current user email:', user?.email);
    if (!user) return;

    const q = query(
      collection(firestore, 'notifications'),
      where('userId', '==', user.email),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedNotifications = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));


      setNotifications(fetchedNotifications);
    });

    return () => unsubscribe();
  }, []);

  const getIcon = (type) => {
    switch (type) {
      case 'like':
        return <FontAwesome5 name="heart" size={20} color="red" />;
      case 'message':
        return <Ionicons name="chatbubble" size={20} color="red" />;
      case 'event':
        return <MaterialIcons name="event" size={20} color="#red" />;
      case 'comment':
        return <FontAwesome5 name="comment" size={20} color="red" />;
      case 'follow':
        return <FontAwesome5 name="user-plus" size={20} color="red" />;        
      default:
        return <Ionicons name="notifications" size={20} color="#aaa" />;
    }
  };

  const markAllAsRead = async () => {
    const user = auth.currentUser;
    if (!user) return;

    const batch = writeBatch(firestore);
    notifications.forEach(notif => {
      const notifRef = doc(firestore, 'notifications', notif.id);
      batch.update(notifRef, { read: true });
    });

    await batch.commit();
  };

  const renderItem = ({ item }) => (
    <Card style={[styles.notificationCard, !item.read && styles.unreadCard]}>
      <Card.Content style={styles.cardContent}>
        <View style={styles.iconContainer}>{getIcon(item.type)}</View>
        <View style={styles.textContainer}>
          <Text style={styles.notificationText}>{item.content}</Text>
          <Text style={styles.timestamp}>
            {new Date(item.timestamp?.toDate?.()).toLocaleString()}
          </Text>
        </View>
      </Card.Content>
    </Card>
  );

  return (
    <View style={styles.container}>
      <Header />
      <View style={styles.titleRow}>
        <Text style={styles.title}>Notifications</Text>
        <TouchableOpacity onPress={markAllAsRead}>
          <Text style={styles.markAll}>Mark all as read</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 40,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  markAll: {
    fontSize: 14,
    color: '#007AFF',
  },
  listContent: {
    paddingHorizontal: 20,
  },
  notificationCard: {
    marginBottom: 10,
    borderRadius: 10,
    backgroundColor: '#f9f9f9',
    elevation: 2,
  },
  unreadCard: {
    backgroundColor: '#e6f7ff',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconContainer: {
    marginRight: 10,
    marginTop: 3,
  },
  textContainer: {
    flex: 1,
  },
  notificationText: {
    fontSize: 16,
  },
  timestamp: {
    fontSize: 12,
    color: '#999',
    marginTop: 5,
    textAlign: 'right',
  },
});

export default NotificationScreen;
