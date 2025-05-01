import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Modal, ScrollView, Button } from 'react-native';
import { Ionicons } from '@expo/vector-icons'; 
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';
import { firestore } from '../Firebase';
import { doc, updateDoc, getDoc, deleteField, collection, where, getDocs, query } from 'firebase/firestore';
export default function EventCardRSO({ event }) {
    const [modalVisible, setModalVisible] = useState(false);
    const [participantsModalVisible, setParticipantsModalVisible] = useState(false);
    const [participants, setParticipants] = useState([]);
    const [approvedCount, setApprovedCount] = useState(0);
    const [appliedCount, setAppliedCount] = useState(0);
  
    const handleOpenEventModal = () => {
      setModalVisible(true);
    };
  
    const handleCloseEventModal = () => {
      setModalVisible(false);
    };
  
    const handleOpenParticipantsModal = () => {
      setParticipantsModalVisible(true);
      fetchParticipants();
    };
  
    const handleCloseParticipantsModal = () => {
      setParticipantsModalVisible(false);
      setModalVisible(true);
    };
  
    const getStatusStyle = (status) => {
        switch (status) {
            case 'Approved':
                return { backgroundColor: 'green' };
            case 'Rejected':
                return { backgroundColor: 'red' };
            case 'Applied':
            default:
                return { backgroundColor: 'orange' };
        }
    };

    const fetchParticipants = async () => {
      try {
        const eventRef = doc(firestore, 'events', event.id);
        const eventDoc = await getDoc(eventRef);
  
        if (eventDoc.exists()) {
          const data = eventDoc.data();
          const participantsList = data.participantsList || {};
  
          const participantsArray = [];
  
          for (const safeEmailKey of Object.keys(participantsList)) {
            const { name, status } = participantsList[safeEmailKey];
  
            // Convert safeEmailKey back to real email
            const email = safeEmailKey.replace(/_/g, '.');
  
            participantsArray.push({
              email,
              name,
              status: status || 'Applied', // Default status to "Applied"
            });
          }
  
          setParticipants(participantsArray);
  
          const applied = participantsArray.filter(p => p.status === 'Applied').length;
          const approved = participantsArray.filter(p => p.status === 'Approved').length;
  
          setAppliedCount(applied);
          setApprovedCount(approved);
        }
      } catch (error) {
        console.error('Error fetching participants:', error);
      }
    };
  
    const handleStatusChange = async (email, action) => {
        try {
          const safeEmailKey = email.replace(/\./g, '_');
          const eventRef = doc(firestore, 'events', event.id);
      
          if (action === 'Rejected') {
            // Remove participant from event
            await updateDoc(eventRef, {
              [`participantsList.${safeEmailKey}`]: deleteField(),
            });
      
            // Update local state
            const updated = participants.filter(p => p.email !== email);
            setParticipants(updated);
            setAppliedCount(prev => Math.max(0, prev - 1));
      
          } else if (action === 'Approved') {
            // Update status to "Approved"
            await updateDoc(eventRef, {
              [`participantsList.${safeEmailKey}.status`]: 'Approved',
            });
      
            // Update local state
            const updated = participants.map(p => {
              if (p.email === email && p.status !== 'Approved') {
                return { ...p, status: 'Approved' };
              }
              return p;
            });
            setParticipants(updated);
            setAppliedCount(prev => Math.max(0, prev - 1));
          }
      
          // Recalculate approved count and update in Firestore
          const updatedDoc = await getDoc(eventRef);
          const updatedList = updatedDoc.data()?.participantsList || {};
          const newApprovedCount = Object.values(updatedList).filter(p => p.status === 'Approved').length;
      
          setApprovedCount(newApprovedCount);
      
          // Update participants (number) field in Firestore
          await updateDoc(eventRef, {
            participants: newApprovedCount,
          });
      
        } catch (error) {
          console.error('Error updating participant status:', error);
        }
      };
      
      
  
    return (
      <View>
        {/* Event Card */}
        <TouchableOpacity style={styles.card} onPress={handleOpenEventModal}>
          {event.banner && (
            <Image
              source={{ uri: event.banner }}
              style={styles.banner}
              resizeMode="cover"
            />
          )}
          <View style={styles.infoContainer}>
            <View style={styles.headerRow}>
              <Image source={event.seal} style={styles.seal} />
              <View style={styles.titleDateContainer}>
                <Text style={styles.title}>{event.title}</Text>
                <Text style={styles.date}>{event.date}</Text>
              </View>
            </View>
            <Text style={styles.description}>{event.description}</Text>
            <Text style={styles.Participants}>Participants: {approvedCount}</Text>
            <View style={styles.buttonRow}>
              <Text style={[styles.status, getStatusStyle(event.status)]}>
                {event.status}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
  
        {/* Modal for Event Details */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={handleCloseEventModal}
        >
          <View style={styles.modalBackground}>
            <View style={styles.modalContainer}>
              <TouchableOpacity style={styles.closeButton} onPress={handleCloseEventModal}>
                <Ionicons name="close" size={30} color="#333" />
              </TouchableOpacity>
  
              <ScrollView contentContainerStyle={styles.modalContent}>
              {event.banner && (
                    <Image
                    source={{ uri: event.banner }}
                    style={styles.banner}
                    resizeMode="cover"
                    />
                )}
                <Text style={styles.modalTitle}>{event.title}</Text>
                <View style={styles.dateTimeContainer}>
                  <Text style={styles.modalDate}>{event.date}</Text>
                  <Text style={styles.modalTime}>{event.time}</Text>
                </View>
                <Text style={styles.modalDescription}>{event.description}</Text>
                <Text style={styles.modalLocation}>Location: {event.location}</Text>
  
                <TouchableOpacity style={styles.viewParticipantsButton} onPress={handleOpenParticipantsModal}>
                  <Text style={styles.viewParticipantsText}>View Participants</Text>
                </TouchableOpacity>
                <Text style={[styles.status, getStatusStyle(event.status)]}>{event.status}</Text>
              </ScrollView>
            </View>
  
            {/* Participants Modal */}
            {participantsModalVisible && (
              <View style={styles.stackedModalOverlay}>
                <View style={styles.modalContainerParticipants}>
                  <TouchableOpacity style={styles.closeButton} onPress={handleCloseParticipantsModal}>
                    <Ionicons name="close" size={30} color="#333" />
                  </TouchableOpacity>
  
                  <ScrollView contentContainerStyle={styles.modalContentParticipants}>
                    <Text style={styles.eventPartiHeader}>Event Participants</Text>
                    <View style={styles.breakdownRow}>
                      <Text style={styles.breakdownText}>Applications: {appliedCount}</Text>
                      <Text style={styles.breakdownText}>Approved: {approvedCount}</Text>
                    </View>
                    <View style={styles.underline} />
  
                    {participants.length === 0 ? (
                      <Text>No participants yet.</Text>
                    ) : (
                      participants.map((participant) => (
                        <View key={participant.email} style={styles.participantRow}>
                          <View style={styles.nameEmailRow}>
                            <Text style={styles.participantName}>{participant.name}</Text>
                            <Text style={styles.participantEmail}>{participant.email}</Text>
                          </View>
                          <View style={styles.iconButtons}>
                            <TouchableOpacity onPress={() => handleStatusChange(participant.email, 'Approved')}>
                              <Ionicons name="checkmark-circle-outline" size={24} color="green" />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => handleStatusChange(participant.email, 'Rejected')}>
                              <Ionicons name="close-circle-outline" size={24} color="red" />
                            </TouchableOpacity>
                          </View>
                        </View>
                      ))
                    )}
                  </ScrollView>
                </View>
              </View>
            )}
          </View>
        </Modal>
      </View>
    );
  }
  

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#fff',
        borderRadius: 10,
        marginBottom: 20,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        marginHorizontal: 20,
        borderWidth: 1,
        borderColor: '#ddd',
    },
    banner: {
        width: '100%',
        height: 150,
    },
    infoContainer: {
        padding: 15,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    seal: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 10,
    },
    titleDateContainer: {
        flex: 1,
    },
    title: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    date: {
        fontSize: 12,
        color: '#999',
    },
    description: {
        fontSize: 14,
       
        marginBottom: 10,
    },
    Participants: {
        fontSize: 14,
        
        marginBottom: 10,
    },
    buttonRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    joinButton: {
        backgroundColor: '#E50914',
        paddingVertical: 8,
        paddingHorizontal: 20,
        borderRadius: 20,
        marginTop: 10,
    },
    joinedButton: {
        backgroundColor: 'orange', // Change button color to yellow when joined
    },
    firstfavoriteButton: {
        marginTop: 15,
    },
    favoriteButton: {
        marginTop: 10,
    },
    joinButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14,
    },
    modalBackground: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContainer: {
        backgroundColor: '#fff',
        borderRadius: 10,
        width: '90%',
        padding: 20,
    },
    modalContent: {
        alignItems: 'flex-start', // Align everything to the left
    },

    modalBackgroundParticipants: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    stackedModalOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
      },
      modalContainerParticipants: {
        backgroundColor: '#fff',
        borderRadius: 10,
        width: '90%',
        maxHeight: '80%',
        padding: 20,
        elevation: 10,
        zIndex: 10,
      },
      
    modalContentParticipants: {
        
    },
    modalBanner: {
        width: '100%',
        height: 200,
        borderRadius: 10,
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#333',
        marginTop: 15,
    },
    dateTimeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 5,
    },
    joinHeartContainer: {
        flexDirection: 'row', // Align items in a row
        justifyContent: 'space-between', // Space out the items with space between
        alignItems: 'center', // Vertically align items
        width: '100%', // Ensure the container takes up the full width
    },
    modalDate: {
        fontSize: 14,
        color: '#999',
        marginRight: 10,
    },
    modalTime: {
        fontSize: 14,
        color: '#999',
    },
    modalDescription: {
        fontSize: 16,
        color: '#666',
        marginVertical: 10,
        textAlign: 'left',
    },
    modalParticipants: {
        fontSize: 14,
        color: '#333',
        marginVertical: 10,
    },
    modalLocation: {
        fontSize: 14,
        color: '#333',
        marginVertical: 10,
    },
    closeButton: {
        position: 'absolute',
        top: 10,
        right: 10,
        backgroundColor: '#fff',
        padding: 5,
        borderRadius: 50,
        zIndex: 10,
    },

    status: {
        color: '#fff',
        fontWeight: 'bold',
        paddingVertical: 10,
        
        borderRadius: 12,
        alignSelf: 'flex-start',
        fontSize: 12,
        marginTop: 5,
        width: '25%',
        fontSize: 14,
        textAlign: 'center',
      },
      viewParticipantsButton:{
        color: '#ff0000',
        marginVertical: 10,
      },
      viewParticipantsText:{
        color: '#ff0000',
        
      },
      eventPartiHeader:{
        textAlign: 'center',
        fontSize: 20,
        justifyContent: 'center',
        fontWeight: 'bold',
      },
      underline: {
        alignSelf: 'center',
        height: 1,
        backgroundColor: '#E50914',
        width: '100%',
        marginTop: 5,
        marginBottom: 5,
    },
    breakdownRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 5,
        paddingHorizontal: 5,
        marginTop: 10,
      },
      
      breakdownText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
      },
      
      participantRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 5,
        borderBottomWidth: 1,
        borderColor: '#ccc',
      },

      nameEmailRow: {
        flexDirection: 'column',
        marginBottom: 8,
      },
      
      participantEmail: {
        flex: 1,
        fontSize: 14,
        color: '#555',
      },
      
      iconButtons: {
        flexDirection: 'row',
        gap: 10,
        paddingLeft: 10,
      },
});
