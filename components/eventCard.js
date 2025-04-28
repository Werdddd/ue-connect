import React, { useState } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons'; // For the heart icon

export default function EventCard({ event }) {
    const [modalVisible, setModalVisible] = useState(false);
    const [joined, setJoined] = useState(false); // State to track if the user has joined
    const [favorited, setFavorited] = useState(false); // State to track if the event is favorited

    const handleOpenModal = () => {
        setModalVisible(true);
    };

    const handleCloseModal = () => {
        setModalVisible(false);
    };

    const handleJoinToggle = () => {
        setJoined((prevJoined) => !prevJoined); // Toggle the join state
    };

    const handleFavoriteToggle = () => {
        setFavorited((prevFavorited) => !prevFavorited); // Toggle the favorite state
    };

    return (
        <View>
            {/* Event Card */}
            <TouchableOpacity style={styles.card} onPress={handleOpenModal}>
                <Image source={event.banner} style={styles.banner} />
                <View style={styles.infoContainer}>
                    <View style={styles.headerRow}>
                        <Image source={event.seal} style={styles.seal} />
                        <View style={styles.titleDateContainer}>
                            <Text style={styles.title}>{event.title}</Text>
                            <Text style={styles.date}>{event.date}</Text>
                        </View>
                    </View>
                    <Text style={styles.description}>{event.description}</Text>
                    <View style={styles.buttonRow}>
                        <TouchableOpacity
                            style={[styles.joinButton, joined && styles.joinedButton]}
                            onPress={handleJoinToggle}
                        >
                            <Text style={styles.joinButtonText}>
                                {joined ? 'Joined' : 'Join Now'}
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
                            {/* Event Banner */}
                            <Image source={event.banner} style={styles.modalBanner} />
                            <Text style={styles.modalTitle}>{event.title}</Text>

                            <View style={styles.dateTimeContainer}>
                                <Text style={styles.modalDate}>{event.date}</Text>
                                <Text style={styles.modalTime}>{event.time}</Text>
                            </View>

                            <Text style={styles.modalDescription}>{event.description}</Text>
                            <Text style={styles.modalParticipants}>
                                Participants: {event.participants}
                            </Text>
                            <Text style={styles.modalLocation}>Location: {event.location}</Text>
                            <View style={styles.joinHeartContainer}>
                            <TouchableOpacity
                                style={[styles.joinButton, joined && styles.joinedButton]}
                                onPress={handleJoinToggle}
                            >
                                <Text style={styles.joinButtonText}>
                                    {joined ? 'Joined' : 'Join Now'}
                                </Text>
                            </TouchableOpacity>

                            {/* Favorite Button */}
                            <TouchableOpacity onPress={handleFavoriteToggle} style={styles.favoriteButton}>
                                <Ionicons
                                    name={favorited ? 'heart' : 'heart-outline'}
                                    size={30}
                                    color={favorited ? '#E50914' : '#E50914'}
                                />
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
});
