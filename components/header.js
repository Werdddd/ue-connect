import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, TextInput } from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native'; // ✅ Use hook for navigation

const Header = ({ scrollY = 0, posts = [], setFilteredPosts = () => {} }) => {
  const navigation = useNavigation(); // ✅ Solves "undefined navigation" error
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchActive, setIsSearchActive] = useState(false);

  const handleSearch = (query) => {
    setSearchQuery(query);
    const filtered = posts.filter(post =>
      post?.title?.toLowerCase().includes(query.toLowerCase()) ||
      post?.content?.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredPosts(filtered);
  };

  return (
    <View style={[styles.header, scrollY > 0 && styles.headerShadow]}>
      <View style={styles.leftSection}>
        <Image
          source={require('../assets/logo.png')}
          style={styles.logo}
        />
        <Text style={styles.title}>UE Connect</Text>
      </View>
      <View style={styles.rightSection}>
        <TouchableOpacity onPress={() => setIsSearchActive(!isSearchActive)}>
          <Feather name="search" size={24} color="black" style={styles.icon} />
        </TouchableOpacity>
        <TouchableOpacity>
          <Ionicons name="notifications-outline" size={24} color="black" style={styles.icon} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('ChatPage')}>
          <Ionicons name="chatbubble-ellipses-outline" size={24} color="black" style={styles.icon} />
        </TouchableOpacity>
      </View>

      {isSearchActive && (
        <TextInput
          style={styles.searchInput}
          placeholder="Search..."
          value={searchQuery}
          onChangeText={handleSearch}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingTop: 10,
    paddingBottom: 5,
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    zIndex: 10,
  },
  headerShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    width: 30,
    height: 30,
    resizeMode: 'contain',
    marginRight: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#E50914',
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginLeft: 20,
  },
  searchInput: {
    position: 'absolute',
    top: 60,
    left: 16,
    right: 16,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#ccc',
    zIndex: 20,
  },
});

export default Header;
