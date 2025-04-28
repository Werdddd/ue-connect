import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons'; // For the heart icon

export default function EventCard({ event }) {
    return (
        <View style={styles.card}>
            {/* Top Banner Image */}
            <Image source={event.banner} style={styles.banner} />

            {/* Info Section */}
            <View style={styles.infoContainer}>
                {/* Small Seal + Title + Date */}
                <View style={styles.headerRow}>
                    <Image source={event.seal} style={styles.seal} />
                    <View style={styles.titleDateContainer}>
                        <Text style={styles.title}>{event.title}</Text>
                        <Text style={styles.date}>{event.date}</Text>
                    </View>
                </View>

                {/* Description */}
                <Text style={styles.description}>{event.description}</Text>

                {/* Bottom Buttons */}
                <View style={styles.buttonRow}>
                    <TouchableOpacity style={styles.joinButton}>
                        <Text style={styles.joinButtonText}>Join Now</Text>
                    </TouchableOpacity>
                    <TouchableOpacity>
                        <Ionicons name="heart-outline" size={24} color="#E50914" />
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#fff',
        borderRadius: 10,
        marginBottom: 20,
        // overflow: 'hidden',
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
    },
    joinButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14,
    },
});
