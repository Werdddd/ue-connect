import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Modal, ScrollView,TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons'; 

export default function EventCardSAO({ event, onApprove, onReject }) {
    const [modalVisible, setModalVisible] = useState(false);
    const [showRemarkInput, setShowRemarkInput] = useState(false);
    const [remark, setRemark] = useState('');
    const [selectedProposal, setSelectedProposal] = useState(null);
    const [proposalLink, setProposalLink] = useState('');

    const handleSelectProposal = () => {
        if (selectedProposal) {
          setProposalLink(selectedProposal.uri); // edit existing
        } else {
          setProposalLink(''); // new proposal
        }
        setIsProposalModalVisible(true);
      };
      
    
    //   const handleProposalLinkInput = (text) => {
    //     setProposalLink(text); // Update the proposal link
    //   };
    
      const handleSaveProposalLink = () => {
        setSelectedProposal({ uri: proposalLink, name: 'Proposal Document' }); // Save the proposal link
        setIsProposalModalVisible(false); // Close modal after saving
      };


    const handleProposalLinkInput = (link) => {
        setSelectedProposal({
            name: "Google Drive Proposal Link",
            uri: link,
        });
    };

    const handleOpenModal = () => {
        setModalVisible(true);
    };

    const handleCloseModal = () => {
        setModalVisible(false);
    };

    const handleApprove = () => {
        onApprove(event.id); 
        handleCloseModal();
    };

    const handleReject = () => {
        onReject(event.id);
        handleCloseModal();
    };

    const confirmReject = () => {
        onReject(event.id, remark);
        handleCloseModal();
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case 'Approved': return { backgroundColor: 'green' };
            case 'Rejected': return { backgroundColor: 'red' };
            case 'Applied': 
            default: return { backgroundColor: 'orange' };
        }
    };

    useEffect(() => {
        if (event?.proposalLink) {
          setProposalLink(event.proposalLink);
        }
      }, [event]);
      
    return (
        <View>
        <TouchableOpacity style={styles.card} onPress={handleOpenModal}>
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
                <Text style={[styles.status, getStatusStyle(event.status)]}>{event.status}</Text>
            </View>
        </TouchableOpacity>

        <Modal animationType="slide" transparent={true} visible={modalVisible} onRequestClose={handleCloseModal}>
            <View style={styles.modalBackground}>
                <View style={styles.modalContainer}>
                    <TouchableOpacity style={styles.closeButton} onPress={handleCloseModal}>
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
                        <Text style={styles.modalParticipants}>Participants: {event.participants}</Text>
                        <Text style={styles.modalLocation}>Location: {event.location}</Text>
                        <View style={styles.previewContainer}>
                        <Text style={styles.previewTitle}>Preview Link:</Text>
                            <TouchableOpacity
                                onPress={() => {
                                if (proposalLink) {
                                    Linking.openURL(proposalLink);
                                } else {
                                    alert('No proposal link provided.');
                                }
                                }}
                            >
                                <Text style={styles.previewLink}>
                                {proposalLink || 'No proposal link provided.'}
                                </Text>
                            </TouchableOpacity>
                        </View>

                        <Text style={[styles.status, getStatusStyle(event.status)]}>{event.status}</Text>

                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 15, width: '100%' }}>
                            <TouchableOpacity style={[styles.actionButton, { backgroundColor: 'green' }]} onPress={handleApprove}>
                                <Text style={styles.buttonText}>Approve</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.actionButton, { backgroundColor: 'red' }]} onPress={handleReject}>
                                <Text style={styles.buttonText}>Reject</Text>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                </View>
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
        color: '#666',
        marginBottom: 15,
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
        backgroundColor: 'orange',
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
        alignItems: 'flex-start',
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
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
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
        marginVertical: 5,
    },
    modalLocation: {
        fontSize: 14,
        color: '#333',
        marginVertical: 5,
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
        paddingVertical: 8,
        borderRadius: 12,
        alignSelf: 'flex-start',
        fontSize: 12,
        marginTop: 5,
        width: '25%',
        fontSize: 14,
        textAlign: 'center',
      },
      actionButton: {
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 8,
        width: '48%',
    },
    buttonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14,
        textAlign: 'center',
    },
});
