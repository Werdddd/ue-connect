import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  TextInput,
  Button, ScrollView
} from "react-native";
import { firestore } from "../Firebase";
import {
  doc,
  getDocs,
  query,
  collection,
  where,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import Icon from "react-native-vector-icons/MaterialIcons";

export default function UserCard() {

  // Local states inside the component
  const [selectedUser, setSelectedUser] = useState(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);

  const [editFirstName, setEditFirstName] = useState("");
  const [editLastName, setEditLastName] = useState("");
  const [editStudentNumber, setEditStudentNumber] = useState("");
  const [editRole, setEditRole] = useState("");

  const [users, setUsers] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchUsers = async () => {
    try {
      setRefreshing(true);
      const q = query(
        collection(firestore, "Users"),
        where("studentNumber", "!=", null)
      );
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setUsers(data);
      setRefreshing(false);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);


  const handleEdit = (user) => {
    setSelectedUser(user);
    setEditFirstName(user.firstName);
    setEditLastName(user.lastName);
    setEditStudentNumber(user.studentNumber);
    setEditRole(user.role);
    setEditModalVisible(true);
  };

  const openDeleteModal = (user) => {
    setSelectedUser(user);
    setDeleteModalVisible(true);
  };

  const confirmDelete = async () => {
    try {
      await deleteDoc(doc(firestore, "Users", selectedUser.id));
      setDeleteModalVisible(false);
      fetchUsers(); // Refresh list
    } catch (error) {
      console.error("Error deleting user:", error);
    }
  };

  const saveEdit = async () => {
    const studentNumberPattern = /^\d{11}$/;
    const validRoles = ["user", "leader"];

    if (!studentNumberPattern.test(editStudentNumber)) {
      alert("Student Number must be exactly 11 digits.");
      return;
    }

    if (!validRoles.includes(editRole.toLowerCase())) {
      alert("Role must be either 'user' or 'leader'.");
      return;
    }

    try {
      const docRef = doc(firestore, "Users", selectedUser.id);
      await updateDoc(docRef, {
        firstName: editFirstName,
        lastName: editLastName,
        studentNumber: editStudentNumber,
        role: editRole,
      });
      setEditModalVisible(false);
      fetchUsers(); // Refresh list
    } catch (error) {
      console.error("Error updating user:", error);
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardContent}>
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>
            {item.firstName} {item.lastName}
          </Text>
          <Text style={styles.email}>{item.email}</Text>
          <Text style={styles.role}>Role: {item.role}</Text>
          <Text style={styles.studentNumber}>
            Student #: {item.studentNumber}
          </Text>
        </View>
        <View style={styles.iconButtons}>
          <TouchableOpacity onPress={() => handleEdit(item)}>
            <Icon name="edit" size={24} color="#4CAF50" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => openDeleteModal(item)}>
            <Icon
              name="delete"
              size={24}
              color="#F44336"
              style={{ marginTop: 8 }}
            />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <>
     <FlatList
      data={users}
      keyExtractor={(item) => item.id.toString()}
      renderItem={renderItem}
      contentContainerStyle={{ paddingBottom: 20 }}
      ListEmptyComponent={<Text>No users found.</Text>}
    />


      {/* Edit Modal */}
      <Modal visible={editModalVisible} transparent animationType="slide">
  <View style={styles.modalBackground}>
    <View style={styles.modalContainer}>
      <Text style={styles.modalTitle}>Edit User</Text>

      {/* Name Row */}
      <View style={styles.nameRow}>
        <View style={styles.nameContainer}>
          <Text style={styles.label}>First Name</Text>
          <TextInput
            value={editFirstName}
            onChangeText={setEditFirstName}
            placeholder="First Name"
            style={styles.input}
          />
        </View>
        <View style={styles.nameContainer}>
          <Text style={styles.label}>Last Name</Text>
          <TextInput
            value={editLastName}
            onChangeText={setEditLastName}
            placeholder="Last Name"
            style={styles.input}
          />
        </View>
      </View>

      {/* Student Number and Role */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Student Number</Text>
        <TextInput
          value={editStudentNumber}
          onChangeText={setEditStudentNumber}
          placeholder="Student Number"
          style={styles.input}
        />
      </View>
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Role</Text>
        <TextInput
          value={editRole}
          onChangeText={setEditRole}
          placeholder="Role"
          style={styles.input}
        />
      </View>

      {/* Action Buttons */}
      <View style={styles.buttonRow}>
      <TouchableOpacity onPress={saveEdit} style={styles.saveBtn}>
            <Text style={styles.btnText}>Save</Text>
          </TouchableOpacity>
      <TouchableOpacity onPress={() => setEditModalVisible(false)} style={styles.cancelBtn}>
            <Text style={styles.btnText}>Cancel</Text> 
          </TouchableOpacity>
      </View>
    </View>
  </View>
</Modal>

      {/* Delete Modal */}
      <Modal visible={deleteModalVisible} transparent animationType="fade">
        <View style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            <Text style={{textAlign: 'center', marginBottom: 10}}>Are you sure you want to delete this user?</Text>
            <View style={styles.buttonRow}>
            <TouchableOpacity onPress={confirmDelete} style={styles.deleteBtn}>
                  <Text style={styles.btnText}>Delete</Text>
                </TouchableOpacity>
            <TouchableOpacity onPress={() => setDeleteModalVisible(false)} style={styles.cancelBtn}>
                  <Text style={styles.btnText}>Cancel</Text> 
                </TouchableOpacity>
            </View>
            
          </View>
        </View>
      </Modal>
    </>
  );
}
const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    margin: 10,
    padding: 10,
    borderRadius: 8,
    elevation: 2,
  },

  cardContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  iconButtons: {
    justifyContent: "center",
    alignItems: "flex-end",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },

  name: {
    fontSize: 18,
    fontWeight: "bold",
  },
  email: {
    fontSize: 14,
  },
  role: {
    fontSize: 14,
  },
  studentNumber: {
    fontSize: 14,
  },
  modalBackground: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContainer: {
    width: "80%",
    padding: 20,
    backgroundColor: "white",
    borderRadius: 10,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  label: {
    fontSize: 14,
    marginBottom: 5,
    color: "#333",
  },
  nameContainer: {
    flex: 1,
    marginBottom: 1,
    width: "48%",
  },
  inputContainer: {
    
    marginBottom: 1,
  },
  nameRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 5,
    gap: 10,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  saveBtn: {
    backgroundColor: "#4CAF50",
    padding: 10,
    borderRadius: 5,
    width: "48%",
    textAlign: "center",
  },
  deleteBtn: {
    backgroundColor: "#4CAF50",
    padding: 10,
    borderRadius: 5,
    width: "48%",
    textAlign: "center",
  },
  cancelBtn: {
    backgroundColor: "#F44336",
    padding: 10,
    borderRadius: 5,
    width: "48%",
    textAlign: "center",
  },
  btnText: {
    color: "#fff",
    fontWeight: "bold",
    textAlign: "center",
  },
});
