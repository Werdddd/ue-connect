import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Modal, FlatList, TextInput, Button } from 'react-native';
import { firestore, auth } from '../Firebase';
import { doc, getDoc, query, collection, getDocs, where, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { useNavigation } from '@react-navigation/native';
import { ScrollView } from 'react-native';
import { Pressable } from 'react-native';

// Custom hook to manage user data
const useUsers = () => {
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
  
    return users;
  };
  
  // Custom hook for modal management
    const useFirstModal = () => {
        const [firstModalVisible, setfirstModalVisible] = useState(false);
        const [newName, setNewName] = useState('');
        const [pathName, setPathName] = useState('');
  
        const openModal = (name) => {
            setNewName(name);
            setPathName(name); // Set the pathName to the current name
            setfirstModalVisible(true);
        };
  
        const closeModal = () => {
            setfirstModalVisible(false);
        };
  
    const saveFirstName = async () => {
        console.log(pathName);
        console.log(newName);
        try{
            const q = query(collection(firestore, 'Users'), where('firstName', '==', pathName));
            const querySnapshot = await getDocs(q);
            if (!querySnapshot.empty) {
                // Assuming there's only one document with the given firstName
                querySnapshot.forEach(async (docSnapshot) => {
                  const docRef = doc(firestore, 'Users', docSnapshot.id); // Get document reference by ID
          
                  // Now update the firstName in Firestore
                  await updateDoc(docRef, {
                    firstName: newName, // Update the firstName field to the new value
                  });
          
                  console.log(`Updated firstName for user with ID: ${docSnapshot.id}`);
                    });
                } else {
                    console.log("No user found with that first name.");
                }
            }catch (error) {
                console.error("Error updating first name:", error);
            }
            closeModal(); // Close the modal after saving
        };
  
        return {
        firstModalVisible,
        newName,
        pathName,
        openModal,
        closeModal,
        saveFirstName,
        setNewName,
        };
    };

    const useLastModal = () => {
        const [lastModalVisible, setlastModalVisible] = useState(false);
        const [newLastName, setLastName] = useState('');
        const [pathLastName, setPathName] = useState('');
  
        const openLastModal = (last) => {
            setLastName(last);
            setPathName(last); // Set the pathName to the current name
            setlastModalVisible(true);
        };
  
        const closeLastModal = () => {
            setlastModalVisible(false);
        };
  
    const saveLastName = async () => {
        console.log(pathLastName);
        console.log(newLastName);
        try{
            const q = query(collection(firestore, 'Users'), where('lastName', '==', pathLastName));
            const querySnapshot = await getDocs(q);
            if (!querySnapshot.empty) {
                // Assuming there's only one document with the given firstName
                querySnapshot.forEach(async (docSnapshot) => {
                  const docRef = doc(firestore, 'Users', docSnapshot.id); // Get document reference by ID
          
                  // Now update the firstName in Firestore
                  await updateDoc(docRef, {
                    lastName: newLastName, // Update the firstName field to the new value
                  });
          
                  console.log(`Updated lastName for user with ID: ${docSnapshot.id}`);
                    });
                } else {
                    console.log("No user found with that last name.");
                }
            }catch (error) {
                console.error("Error updating last name:", error);
            }
            closeLastModal(); // Close the modal after saving
        };
  
        return {
            lastModalVisible,
            newLastName,
            pathLastName,
            openLastModal,
            closeLastModal,
            saveLastName,
            setLastName,
        };
    };
  
  export default function UserCard() {
    const users = useUsers();  // Get users

    const {
      firstModalVisible,
      newName,
      openModal,
      closeModal,
      saveFirstName,
      setNewName,
    } = useFirstModal();  // Modal state management

    const {
        lastModalVisible,
        newLastName,
        openLastModal,
        closeLastModal,
        saveLastName,
        setLastName,
      } = useLastModal(); 
  
    const renderItem = ({ item }) => (
      <Pressable>
        <View style={styles.card}>
          <View style={{ flexDirection: 'row' }}>
            <TouchableOpacity onPress={() => openModal(item.firstName)}>
              <Text style={styles.name}>{item.firstName}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => openLastModal(item.lastName)}>
              <Text style={styles.name}>{item.lastName}</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.email}>{item.email}</Text>
          <TouchableOpacity>
            <Text style={styles.role}>Role: {item.role}</Text>
          </TouchableOpacity>
          <TouchableOpacity>
            <Text style={styles.studentNumber}>Student #: {item.studentNumber}</Text>
          </TouchableOpacity>
        </View>
      </Pressable>
    );
  
    return (
      <>
        <FlatList
          data={users}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          keyboardShouldPersistTaps="handled"
        />
  
        {/* Modal for editing the first name */}
        <Modal
          visible={firstModalVisible}
          transparent={true}
          animationType="slide"
          onRequestClose={closeModal}
        >
          <View style={styles.modalBackground}>
            <View style={styles.modalContainer}>
              <Text style={styles.modalTitle}>Edit First Name</Text>
              <TextInput
                style={styles.input}
                value={newName}
                onChangeText={setNewName}
              />
              <Button title="Save" onPress={saveFirstName} />
              <Button title="Cancel" onPress={closeModal} />
            </View>
          </View>
        </Modal>

        <Modal
          visible={lastModalVisible}
          transparent={true}
          animationType="slide"
          onRequestClose={closeLastModal}
        >
          <View style={styles.modalBackground}>
            <View style={styles.modalContainer}>
              <Text style={styles.modalTitle}>Edit Last Name</Text>
              <TextInput
                style={styles.input}
                value={newLastName}
                onChangeText={setLastName}
              />
              <Button title="Save" onPress={saveLastName} />
              <Button title="Cancel" onPress={closeLastModal} />
            </View>
          </View>
        </Modal>
      </>
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
  modalBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    width: '80%',
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
});
