import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, TextInput } from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons'; // Make sure you install expo/vector-icons

const Header = ({ scrollY, posts, setFilteredPosts }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchActive, setIsSearchActive] = useState(false);

  // Handle the search logic
  const handleSearch = (query) => {
    setSearchQuery(query);
    const filtered = posts.filter(post =>
      post.title.toLowerCase().includes(query.toLowerCase()) ||
      post.content.toLowerCase().includes(query.toLowerCase())
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
        <TouchableOpacity>
          <Feather name="menu" size={24} color="black" style={styles.icon} />
        </TouchableOpacity>
      </View>

      {/* Conditional rendering of the search bar */}
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
    height: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    paddingTop: 10,
    paddingBottom: 10,
    zIndex: 10,
  },
  headerShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5, // for Android
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
    color: '#E50914', // UE red color
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
    top: 40,
    left: 16,
    right: 16,
    paddingHorizontal: 10,
    paddingVertical: 8,
    
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#ccc',
  },
});

export default Header;
