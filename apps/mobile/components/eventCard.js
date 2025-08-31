import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { applyToEvent, removeApplicationFromEvent } from '../Backend/eventPage';
import { getAuth } from 'firebase/auth';
import { getDoc, doc, setDoc } from 'firebase/firestore';
import { firestore } from '../Firebase'; 

export default function EventCard({ event }) {
    const [modalVisible, setModalVisible] = useState(false);
    const [joined, setJoined] = useState(false);
    const [favorited, setFavorited] = useState(false);
    const [approvedCount, setApprovedCount] = useState(0);
    const [applicationStatus, setApplicationStatus] = useState(null); // 'applied' | 'approved' | null

    const auth = getAuth();
    const user = auth.currentUser;

    const [userRating, setUserRating] = useState(0);
    const [hasRated, setHasRated] = useState(false);

    const submitRating = async (ratingValue) => {
        if (!user) return;
        const userKey = user.email.replace(/\./g, '_');
        const eventRatingRef = doc(firestore, 'eventRatings', event.id);
      
        try {
          const docSnap = await getDoc(eventRatingRef);
          let existingData = {};
      
          if (docSnap.exists()) {
            existingData = docSnap.data();
          }
      
          const updatedRatings = {
            ...existingData.ratings,
            [userKey]: {
              rating: ratingValue,
              
            }
          };
      
          await setDoc(eventRatingRef, { ratings: updatedRatings });
      
          setUserRating(ratingValue);
          setHasRated(true);
          alert('Rating submitted!');
        } catch (error) {
          console.error('Failed to submit rating:', error);
          alert('Rating failed.');
        }
      };

    // Check if user is applied to the event when component mounts
    useEffect(() => {
        const checkIfJoined = async () => {
            if (!user) return;
    
            const useremail = user.email;
            const safeEmailKey = useremail.replace(/\./g, '_');
    
            try {
                const eventRef = doc(firestore, 'events', event.id);
                const eventDoc = await getDoc(eventRef);
    
                if (eventDoc.exists()) {
                    const eventData = eventDoc.data();
                    const participants = eventData?.participants || 0;
                    setApprovedCount(participants);

                    // Check if user is in participantsList (if still needed for join status)
                    const participantsList = eventData?.participantsList || {};
                    const isUserApplied = participantsList.hasOwnProperty(safeEmailKey);
                    setJoined(isUserApplied);

                    if (isUserApplied) {
                        const userStatus = participantsList[safeEmailKey]?.status || 'applied';
                        setApplicationStatus(userStatus);
                    }



                }
            } catch (error) {
                console.error("Error checking participation:", error.message);
            }

            const ratingDocRef = doc(firestore, 'eventRatings', event.id);
            const ratingSnap = await getDoc(ratingDocRef);
            if (ratingSnap.exists()) {
            const ratings = ratingSnap.data().ratings || {};
            const userKey = useremail.replace(/\./g, '_');
            if (ratings[userKey]) {
                setUserRating(ratings[userKey].rating);
                setHasRated(true);
            }
            }

        };
    
        checkIfJoined();
    }, [user, event.id]);
    
    

    const handleOpenModal = () => {
        setModalVisible(true);
    };

    const handleCloseModal = () => {
        setModalVisible(false);
    };

    const handleJoinToggle = async () => {
        if (!user) {
            alert('You must be logged in to join an event.');
            return;
        }

        const useremail = user.email;

        try {
            if (!joined) {
                await applyToEvent(event.id, useremail);
            } else {
                await removeApplicationFromEvent(event.id, useremail);
            }
            setJoined(!joined);
        } catch (error) {
            console.error("Error updating participation:", error.message);
            alert("Failed to update participation.");
        }
    };

    const handleFavoriteToggle = () => {
        setFavorited((prevFavorited) => !prevFavorited);
    };

    return (
        <View>
            {/* Event Card */}
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
                    {/* {event.seal && (
                        <Image
                            source={{ uri: event.seal }}
                            style={styles.seal}
                            resizeMode="cover"
                        />
                    )} */}
                        <Image source={event.seal} style={styles.seal} />
                        <View style={styles.titleDateContainer}>
                            <Text style={styles.title}>{event.title}</Text>
                            <Text style={styles.date}>{event.date}</Text>
                        </View>
                    </View>
                    <Text style={styles.description}>{event.description}</Text>
                    <Text style={styles.parti}>
                        Participants: {approvedCount}
                    </Text>
                    

                    <View style={styles.buttonRow}>
                    <TouchableOpacity
                        style={[
                        styles.joinButton,
                        joined && styles.joinedButton,
                        applicationStatus === 'Approved' && styles.approvedButton,
                        event.status === 'Finished' && styles.finishedButton
                        ]}
                        onPress={handleJoinToggle}
                        disabled={applicationStatus === 'Approved' || event.status === 'Finished'}
                    >
                        <Text
                        style={[
                            styles.joinButtonText,
                            event.status === 'Finished' && styles.finishedButtonText
                        ]}
                        >
                        {event.status === 'Finished'
                            ? 'Event Finished'
                            : applicationStatus === 'Approved'
                            ? 'Approved'
                            : joined
                            ? 'Applied'
                            : 'Join Now'}
                        </Text>
                    </TouchableOpacity>


                        <TouchableOpacity onPress={handleFavoriteToggle}>
                            <Ionicons
                                name={favorited ? 'heart' : 'heart-outline'}
                                size={24}
                                color={favorited ? '#E50914' : '#E50914'}
                                style={styles.firstfavoriteButton}
                            />
                        </TouchableOpacity>
                    </View>

                    {event.status === 'Finished' && (
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10 }}>
                            <Text style={{ fontWeight: '400', color:'#666', marginRight: 8 }}>Rate this Event:</Text>
                            {[1, 2, 3, 4, 5].map((star) => (
                            <TouchableOpacity
                                key={star}
                                onPress={() => submitRating(star)}
                                disabled={hasRated}
                            >
                                <Ionicons
                                name={star <= userRating ? 'star' : 'star-outline'}
                                size={28}
                                color="#FFD700"
                                />
                            </TouchableOpacity>
                            ))}
                        </View>
                        )}

                </View>
            </TouchableOpacity>

            {/* Modal for Event Details */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={handleCloseModal}
            >
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
                            <Text style={styles.modalParticipants}>
                                Participants: {approvedCount}
                            </Text>

                            <Text style={styles.modalLocation}>Location: {event.location}</Text>
                            <View style={styles.joinHeartContainer}>
                            <TouchableOpacity
                        style={[
                        styles.joinButton,
                        joined && styles.joinedButton,
                        applicationStatus === 'Approved' && styles.approvedButton,
                        event.status === 'Finished' && styles.finishedButton
                        ]}
                        onPress={handleJoinToggle}
                        disabled={applicationStatus === 'Approved' || event.status === 'Finished'}
                    >
                        <Text
                        style={[
                            styles.joinButtonText,
                            event.status === 'Finished' && styles.finishedButtonText
                        ]}
                        >
                        {event.status === 'Finished'
                            ? 'Event Finished'
                            : applicationStatus === 'Approved'
                            ? 'Approved'
                            : joined
                            ? 'Applied'
                            : 'Join Now'}
                        </Text>
                    </TouchableOpacity>

                                <TouchableOpacity onPress={handleFavoriteToggle} style={styles.favoriteButton}>
                                    <Ionicons
                                        name={favorited ? 'heart' : 'heart-outline'}
                                        size={30}
                                        color={favorited ? '#E50914' : '#E50914'}
                                    />
                                </TouchableOpacity>
                            </View>
                            {event.status === 'Finished' && (
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 15 }}>
                            <Text style={{ fontWeight: 'bold', marginRight: 8 }}>Rate this Event:</Text>
                            {[1, 2, 3, 4, 5].map((star) => (
                            <TouchableOpacity
                                key={star}
                                onPress={() => submitRating(star)}
                                disabled={hasRated}
                            >
                                <Ionicons
                                name={star <= userRating ? 'star' : 'star-outline'}
                                size={28}
                                color="#FFD700"
                                />
                            </TouchableOpacity>
                            ))}
                        </View>
                        )}
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
        border: 1,
        borderColor: '#ddd',
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
    parti: {
        fontSize: 14,
        color: '#666',
        
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
        borderRadius: 5,
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
    approvedButton: {
        backgroundColor: 'green',
        borderColor: 'darkgreen',
    },
    finishedButton: {
        backgroundColor: 'gray', // Light gray
        
      },
      
});
