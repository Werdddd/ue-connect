import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Modal, FlatList } from 'react-native';
import { firestore, auth } from '../Firebase';
import { doc, getDoc, query, collection, getDocs, where, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { useNavigation } from '@react-navigation/native';


export default function UserCard() {
    const [users, setUsers] = useState([]);
  
    useEffect(() => {
      const fetchUsers = async () => {
        try {
            const q = query(collection(firestore, 'Users'), where('studentNumber', '!=', null));
          const querySnapshot = await getDocs(q);
          const data = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setUsers(data);
        } catch (error) {
          console.error('Error fetching users:', error);
        }
      };
  
      fetchUsers();
    }, []);
  
    const renderItem = ({ item }) => (
      <View style={styles.card}>
        <Text style={styles.name}>{item.firstName} {item.lastName}</Text>
        <Text style={styles.email}>{item.email}</Text>
        <Text style={styles.role}>Role: {item.role}</Text>
        <Text style={styles.studentNumber}>Student #: {item.studentNumber}</Text>
      </View>
    );
  
    return (
      <FlatList
        data={users}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
      />
    );
  }
  
  const styles = StyleSheet.create({
    card: {
      padding: 16,
      marginVertical: 8,
      backgroundColor: '#fff',
      borderRadius: 10,
      elevation: 2,
    },
    name: {
      fontSize: 18,
      fontWeight: 'bold',
    },
    email: {
      color: 'gray',
    },
    role: {
      marginTop: 4,
    },
    studentNumber: {
      marginTop: 2,
    },
  });
