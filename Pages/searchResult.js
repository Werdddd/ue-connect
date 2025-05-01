import React, { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
  ScrollView, TouchableWithoutFeedback, Keyboard, KeyboardAvoidingView, Platform,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { auth, firestore } from '../Firebase'; // Adjust the import based on your Firebase setup

import Header from '../components/header';
import BottomNavBar from '../components/bottomNavBar';
import PostCard from '../components/PostCard';

export default function SearchResult({ route }) {
  const { searchText } = route.params || {};
  const navigation = useNavigation();

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSearchResults = async () => {
      try {
        const postsRef = collection(firestore, 'posts');
        const q = query(postsRef, where('text', '>=', searchText), where('text', '<=', searchText + '\uf8ff'));

        const snapshot = await getDocs(q);
        const postList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setPosts(postList);
      } catch (error) {
        console.error('Error fetching search results:', error);
      } finally {
        setLoading(false);
      }
    };

    if (searchText) {
      fetchSearchResults();
    }
  }, [searchText]);

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.container}
        >
          <View style={styles.container}>
            <Header />
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
              <Text style={styles.searchLabel}>Search Results for: "{searchText}"</Text>

              {loading ? (
                <ActivityIndicator size="large" color="#999" />
              ) : posts.length === 0 ? (
                <Text style={styles.noResults}>No posts found.</Text>
              ) : (
                posts.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))
              )}
            </ScrollView>
            <BottomNavBar />
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </TouchableWithoutFeedback>
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
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 80,
  },
  searchLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  noResults: {
    textAlign: 'center',
    color: '#888',
    marginTop: 20,
  },
});
