import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { firestore } from '../Firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useNavigation } from '@react-navigation/native';

export default function OrganizationCard({ orgName, memberCount, description, logo }) {
    const navigation = useNavigation();
    return (
        <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('OrgProfilePage', {orgName})}>
            <View style={styles.headerRow}>
                <Image
                    source={logo}
                    style={styles.orgcardlogo}
                />
                <Text style={styles.orgName}>{orgName}</Text>
            </View>
            <Text style={styles.memberCount}>{memberCount} members</Text>
            <Text style={styles.description}>
                {description}
            </Text>
        </TouchableOpacity>
    );
}


const styles = StyleSheet.create({
    card: {
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 15,
        marginVertical: 10,
        marginHorizontal: 20,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    orgcardlogo: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 10,
    },
    orgName: {
        fontSize: 16,
        fontWeight: 'bold',
        flexShrink: 1,
    },
    memberCount: {
        fontSize: 14,
        color: 'gray',
        marginBottom: 4,
    },
    description: {
        fontSize: 14,
        color: '#333',
    },
});
