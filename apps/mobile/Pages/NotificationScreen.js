import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { collection, query, where, onSnapshot, orderBy, writeBatch, doc } from 'firebase/firestore';
import { auth, firestore } from '../Firebase';
import Header from '../components/header';
import { Card } from 'react-native-paper';
import { MaterialIcons, FontAwesome5, Ionicons } from '@expo/vector-icons';
import BottomNavBar from '../components/bottomNavBar';

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
    const iconConfig = {
      like: { component: FontAwesome5, name: "heart", color: "#FF3B30", bgColor: "#FFE5E5" },
      message: { component: Ionicons, name: "chatbubble", color: "#007AFF", bgColor: "#E5F1FF" },
      event: { component: MaterialIcons, name: "event", color: "#FF9500", bgColor: "#FFF0E5" },
      comment: { component: FontAwesome5, name: "comment", color: "#5856D6", bgColor: "#EEEEFC" },
      follow: { component: FontAwesome5, name: "user-plus", color: "#34C759", bgColor: "#E5F8EA" },
      default: { component: Ionicons, name: "notifications", color: "#8E8E93", bgColor: "#F2F2F7" }
    };

    const config = iconConfig[type] || iconConfig.default;
    const IconComponent = config.component;

    return (
      <View style={[styles.iconWrapper, { backgroundColor: config.bgColor }]}>
        <IconComponent name={config.name} size={22} color={config.color} />
      </View>
    );
  };

  const markAllAsRead = async () => {
    const user = auth.currentUser;
    if (!user) return;

    const unreadNotifications = notifications.filter(notif => !notif.read);
    if (unreadNotifications.length === 0) return;

    const batch = writeBatch(firestore);
    unreadNotifications.forEach(notif => {
      const notifRef = doc(firestore, 'notifications', notif.id);
      batch.update(notifRef, { read: true });
    });

    await batch.commit();
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp?.toDate) return '';
    
    const date = timestamp.toDate();
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity activeOpacity={0.7}>
      <Card style={[styles.notificationCard, !item.read && styles.unreadCard]}>
        <Card.Content style={styles.cardContent}>
          {getIcon(item.type)}
          <View style={styles.textContainer}>
            <Text style={styles.notificationText}>{item.content}</Text>
            <View style={styles.bottomRow}>
              <Text style={styles.timestamp}>{formatTimestamp(item.timestamp)}</Text>
              {!item.read && <View style={styles.unreadDot} />}
            </View>
          </View>
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Header />
        <View style={styles.headerSection}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>Notifications</Text>
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadCount}</Text>
              </View>
            )}
          </View>
          {unreadCount > 0 && (
            <TouchableOpacity 
              onPress={markAllAsRead} 
              style={styles.markAllButton}
              activeOpacity={0.7}
            >
              <Ionicons name="checkmark-done" size={16} color="#007AFF" />
              <Text style={styles.markAllText}>Mark all as read</Text>
            </TouchableOpacity>
          )}
        </View>
        
        {notifications.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="notifications-off-outline" size={64} color="#C7C7CC" />
            <Text style={styles.emptyTitle}>No notifications yet</Text>
            <Text style={styles.emptySubtitle}>
              When you get notifications, they'll show up here
            </Text>
          </View>
        ) : (
          <FlatList
            data={notifications}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}
        <BottomNavBar />
      </View>
    </SafeAreaView>
  );
};

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
    paddingTop: 1,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000',
    letterSpacing: 0.3,
  },
  badge: {
    backgroundColor: '#FF3B30',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 10,
    minWidth: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  markAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#E5F1FF',
    borderRadius: 16,
  },
  markAllText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
    marginLeft: 4,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 20,
  },
  notificationCard: {
    marginBottom: 12,
    borderRadius: 16,
    backgroundColor: '#fff',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  unreadCard: {
    backgroundColor: '#FAFCFF',
    borderColor: '#D0E7FF',
    borderWidth: 1.5,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
  },
  iconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
    paddingTop: 2,
  },
  notificationText: {
    fontSize: 15,
    color: '#000',
    lineHeight: 20,
    marginBottom: 6,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timestamp: {
    fontSize: 13,
    color: '#8E8E93',
    fontWeight: '400',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#007AFF',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingBottom: 100,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 21,
  },
});

export default NotificationScreen;