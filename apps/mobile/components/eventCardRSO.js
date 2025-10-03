import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons'; 
import { firestore } from '../Firebase';
import { doc, updateDoc, getDoc, deleteField, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { fetchOrganizations } from '../Backend/eventPageRSO';

export default function EventCardRSO({ event }) {
  const [modalVisible, setModalVisible] = useState(false);
  const [participantsModalVisible, setParticipantsModalVisible] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [approvedCount, setApprovedCount] = useState(0);
  const [appliedCount, setAppliedCount] = useState(0);
  const [eventStatus, setEventStatus] = useState(event.status);
  const [collabOrgs, setCollabOrgs] = useState([]);
  const [eventOrg, setEventOrg] = useState(null);

  useEffect(() => {
    loadEventOrganization();
    if (event.isCollab && event.collabOrgIds) {
      loadCollabOrganizations();
    }
  }, [event.isCollab, event.collabOrgIds]);

  const loadEventOrganization = async () => {
    try {
      if (event.organizationId) {
        const allOrgs = await fetchOrganizations();
        const org = allOrgs.find(o => o.id === event.organizationId);
        setEventOrg(org);
      }
    } catch (error) {
      console.error('Error loading event organization:', error);
    }
  };

  const loadCollabOrganizations = async () => {
    try {
      const allOrgs = await fetchOrganizations();
      const filteredOrgs = allOrgs.filter(org => 
        event.collabOrgIds?.includes(org.id)
      );
      setCollabOrgs(filteredOrgs);
    } catch (error) {
      console.error('Error loading collab organizations:', error);
    }
  };

  const markEventAsFinished = async () => {
    try {
      const eventRef = doc(firestore, 'events', event.id);
      await updateDoc(eventRef, { status: 'Finished' });
      setEventStatus('Finished');
      alert('Event marked as Finished.');
    } catch (error) {
      console.error('Error updating event status:', error);
    }
  };

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
        return { backgroundColor: '#4CAF50' };
      case 'Rejected':
        return { backgroundColor: '#F44336' };
      case 'Finished':
        return { backgroundColor: '#757575' };
      case 'Applied':
      default:
        return { backgroundColor: '#FF9800' };
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
          const email = safeEmailKey.replace(/_/g, '.');
          participantsArray.push({
            email,
            name,
            status: status || 'Applied',
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
        await updateDoc(eventRef, {
          [`participantsList.${safeEmailKey}`]: deleteField(),
        });

        const updated = participants.filter(p => p.email !== email);
        setParticipants(updated);
        setAppliedCount(prev => Math.max(0, prev - 1));

      } else if (action === 'Approved') {
        await updateDoc(eventRef, {
          [`participantsList.${safeEmailKey}.status`]: 'Approved',
        });

        const updated = participants.map(p => {
          if (p.email === email && p.status !== 'Approved') {
            return { ...p, status: 'Approved' };
          }
          return p;
        });
        setParticipants(updated);
        setAppliedCount(prev => Math.max(0, prev - 1));

        await addDoc(collection(firestore, 'notifications'), {
          userId: email,
          type: 'event',
          content: `Your request to join the event "${event.title}" has been approved.`,
          timestamp: serverTimestamp(),
          read: false
        });
      }

      const updatedDoc = await getDoc(eventRef);
      const updatedList = updatedDoc.data()?.participantsList || {};
      const newApprovedCount = Object.values(updatedList).filter(p => p.status === 'Approved').length;

      setApprovedCount(newApprovedCount);

      await updateDoc(eventRef, {
        participants: newApprovedCount,
      });

    } catch (error) {
      console.error('Error updating participant status:', error);
    }
  };

  const CollabBadge = ({ showLogos = false }) => (
    <View style={styles.collabBadgeContainer}>
      <View style={styles.collabTag}>
        <Ionicons name="people" size={14} color="#fff" style={styles.collabIcon} />
        <Text style={styles.collabText}>COLLABORATION</Text>
      </View>
      {showLogos && collabOrgs.length > 0 && (
        <View style={styles.orgLogosContainer}>
          {collabOrgs.map((org) => (
            <View key={org.id} style={styles.orgLogoWrapper}>
              {org.logoUri || org.logoBase64 ? (
                <Image 
                  source={{ uri: org.logoUri || org.logoBase64 }} 
                  style={styles.orgLogo} 
                  resizeMode="contain"
                />
              ) : (
                <View style={styles.orgLogoPlaceholder}>
                  <Text style={styles.orgLogoText}>
                    {org.name?.charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
              <Text style={styles.orgName} numberOfLines={1}>
                {org.name}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );

  return (
    <View>
      <TouchableOpacity style={styles.card} onPress={handleOpenEventModal}>
        {event.isCollab && (
          <View style={styles.collabTagAboveBanner}>
            <CollabBadge />
          </View>
        )}
        {event.banner && (
          <Image source={{ uri: event.banner }} style={styles.banner} resizeMode="cover" />
        )}
        <View style={styles.infoContainer}>
          <View style={styles.headerRow}>
            {eventOrg?.logoUri || eventOrg?.logoBase64 ? (
              <Image 
                source={{ uri: eventOrg.logoUri || eventOrg.logoBase64 }} 
                style={styles.seal} 
                resizeMode="cover"
              />
            ) : (
              <View style={styles.sealPlaceholder}>
                <Ionicons name="business" size={24} color="#999" />
              </View>
            )}
            <View style={styles.titleDateContainer}>
              <Text style={styles.title} numberOfLines={2}>{event.title}</Text>
              <Text style={styles.date}>{event.date}</Text>
            </View>
          </View>
          <Text style={styles.description} numberOfLines={3}>{event.description}</Text>
          <View style={styles.bottomRow}>
            <View style={styles.participantsContainer}>
              <Ionicons name="people-outline" size={16} color="#666" />
              <Text style={styles.Participants}>{approvedCount} Participants</Text>
            </View>
            <Text style={[styles.status, getStatusStyle(eventStatus)]}>{eventStatus}</Text>
          </View>
        </View>
      </TouchableOpacity>

      {/* Modal for Event Details */}
      <Modal animationType="slide" transparent={true} visible={modalVisible} onRequestClose={handleCloseEventModal}>
        <View style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            <TouchableOpacity style={styles.closeButton} onPress={handleCloseEventModal}>
              <Ionicons name="close" size={28} color="#333" />
            </TouchableOpacity>

            <ScrollView contentContainerStyle={styles.modalContent} showsVerticalScrollIndicator={false}>
              {event.isCollab && (
                <View style={styles.modalCollabSection}>
                  <CollabBadge showLogos={true} />
                </View>
              )}
              {event.banner && (
                <Image source={{ uri: event.banner }} style={styles.modalBanner} resizeMode="cover" />
              )}
              <Text style={styles.modalTitle}>{event.title}</Text>
              <View style={styles.dateTimeContainer}>
                <View style={styles.dateTimeItem}>
                  <Ionicons name="calendar-outline" size={18} color="#666" />
                  <Text style={styles.modalDate}>{event.date}</Text>
                </View>
                <View style={styles.dateTimeItem}>
                  <Ionicons name="time-outline" size={18} color="#666" />
                  <Text style={styles.modalTime}>{event.time}</Text>
                </View>
              </View>
              <View style={styles.locationContainer}>
                <Ionicons name="location-outline" size={18} color="#666" />
                <Text style={styles.modalLocation}>{event.location}</Text>
              </View>
              <Text style={styles.modalDescription}>{event.description}</Text>

              <TouchableOpacity style={styles.viewParticipantsButton} onPress={handleOpenParticipantsModal}>
                <Ionicons name="people" size={20} color="#fff" />
                <Text style={styles.viewParticipantsText}>View Participants ({approvedCount})</Text>
              </TouchableOpacity>

              <View style={styles.statusContainer}>
                <Text style={styles.statusLabel}>Event Status:</Text>
                <Text style={[styles.statusBadge, getStatusStyle(eventStatus)]}>{eventStatus}</Text>
              </View>

              {eventStatus === 'Approved' && (
                <TouchableOpacity
                  style={styles.markFinishedButton}
                  onPress={markEventAsFinished}
                >
                  <Ionicons name="checkmark-circle-outline" size={20} color="#F44336" />
                  <Text style={styles.markFinishedText}>Mark as Finished</Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          </View>

          {/* Participants Modal */}
          {participantsModalVisible && (
            <View style={styles.stackedModalOverlay}>
              <View style={styles.modalContainerParticipants}>
                <TouchableOpacity style={styles.closeButton} onPress={handleCloseParticipantsModal}>
                  <Ionicons name="close" size={28} color="#333" />
                </TouchableOpacity>

                <ScrollView contentContainerStyle={styles.modalContentParticipants} showsVerticalScrollIndicator={false}>
                  <Text style={styles.eventPartiHeader}>Event Participants</Text>
                  <View style={styles.breakdownRow}>
                    <View style={styles.statBox}>
                      <Text style={styles.statNumber}>{appliedCount}</Text>
                      <Text style={styles.statLabel}>Pending</Text>
                    </View>
                    <View style={styles.statBox}>
                      <Text style={styles.statNumber}>{approvedCount}</Text>
                      <Text style={styles.statLabel}>Approved</Text>
                    </View>
                  </View>
                  <View style={styles.underline} />

                  {participants.length === 0 ? (
                    <View style={styles.emptyState}>
                      <Ionicons name="people-outline" size={48} color="#ccc" />
                      <Text style={styles.emptyText}>No participants yet</Text>
                    </View>
                  ) : (
                    participants.map((participant) => (
                      <View key={participant.email} style={styles.participantRow}>
                        <View style={styles.participantInfo}>
                          <View style={styles.avatarCircle}>
                            <Text style={styles.avatarText}>
                              {participant.name?.charAt(0).toUpperCase()}
                            </Text>
                          </View>
                          <View style={styles.nameEmailRow}>
                            <Text style={styles.participantName}>{participant.name}</Text>
                            <Text style={styles.participantEmail}>{participant.email}</Text>
                          </View>
                        </View>
                        <View style={styles.iconButtons}>
                          <TouchableOpacity 
                            style={styles.actionButton}
                            onPress={() => handleStatusChange(participant.email, 'Approved')}
                          >
                            <Ionicons name="checkmark-circle" size={28} color="#4CAF50" />
                          </TouchableOpacity>
                          <TouchableOpacity 
                            style={styles.actionButton}
                            onPress={() => handleStatusChange(participant.email, 'Rejected')}
                          >
                            <Ionicons name="close-circle" size={28} color="#F44336" />
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
    borderRadius: 16,
    marginBottom: 16,
    marginHorizontal: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  collabTagAboveBanner: {
    position: 'absolute',
    top: 12,
    left: 12,
    zIndex: 10,
  },
  collabBadgeContainer: {
    gap: 8,
  },
  collabTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(123, 31, 162, 0.95)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
  },
  collabIcon: {
    marginRight: 2,
  },
  collabText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  orgLogosContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    padding: 10,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  orgLogoWrapper: {
    alignItems: 'center',
    width: 60,
  },
  orgLogo: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  orgLogoPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#7B1FA2',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#f0f0f0',
  },
  orgLogoText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  orgName: {
    fontSize: 10,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  banner: {
    width: '100%',
    height: 180,
    backgroundColor: '#f0f0f0',
    marginTop: 0,
  },
  infoContainer: {
    padding: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  seal: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
    borderWidth: 2,
    borderColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  sealPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
    borderWidth: 2,
    borderColor: '#f0f0f0',
    backgroundColor: '#f8f8f8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleDateContainer: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  date: {
    fontSize: 13,
    color: '#666',
  },
  description: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  participantsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  Participants: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  status: {
    color: '#fff',
    fontWeight: 'bold',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
    fontSize: 12,
    textAlign: 'center',
    overflow: 'hidden',
  },
  modalBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 20,
    width: '90%',
    maxHeight: '85%',
    overflow: 'hidden',
    elevation: 10,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: '#fff',
    padding: 8,
    borderRadius: 25,
    zIndex: 10,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  modalContent: {
    padding: 20,
    paddingTop: 16,
  },
  modalCollabSection: {
    marginBottom: 16,
  },
  modalBanner: {
    width: '100%',
    height: 220,
    borderRadius: 12,
    marginBottom: 16,
    backgroundColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    lineHeight: 32,
  },
  dateTimeContainer: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 12,
  },
  dateTimeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  modalDate: {
    fontSize: 15,
    color: '#666',
  },
  modalTime: {
    fontSize: 15,
    color: '#666',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
  },
  modalLocation: {
    fontSize: 15,
    color: '#666',
    flex: 1,
  },
  modalDescription: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
    marginBottom: 20,
  },
  viewParticipantsButton: {
    backgroundColor: '#2196F3',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 12,
    marginBottom: 16,
    gap: 8,
    elevation: 2,
  },
  viewParticipantsText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  statusLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  statusBadge: {
    color: '#fff',
    fontWeight: 'bold',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
    fontSize: 13,
    overflow: 'hidden',
  },
  markFinishedButton: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#F44336',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 12,
    gap: 8,
  },
  markFinishedText: {
    color: '#F44336',
    fontSize: 16,
    fontWeight: 'bold',
  },
  stackedModalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  modalContainerParticipants: {
    backgroundColor: '#fff',
    borderRadius: 20,
    width: '90%',
    maxHeight: '80%',
    overflow: 'hidden',
    elevation: 10,
  },
  modalContentParticipants: {
    padding: 20,
    paddingTop: 50,
  },
  eventPartiHeader: {
    textAlign: 'center',
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  statBox: {
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    minWidth: 100,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2196F3',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
  },
  underline: {
    height: 2,
    backgroundColor: '#2196F3',
    width: '100%',
    marginBottom: 16,
    borderRadius: 1,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 12,
  },
  participantRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderColor: '#f0f0f0',
  },
  participantInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  nameEmailRow: {
    flex: 1,
  },
  participantName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  participantEmail: {
    fontSize: 13,
    color: '#666',
  },
  iconButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    padding: 4,
  },
});