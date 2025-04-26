import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function OrganizationBar({ onSelectOrganization }) {
    const [selectedOrg, setSelectedOrg] = useState('All'); 

    const handleSelect = (orgName) => {
        setSelectedOrg(orgName);
        if (onSelectOrganization) {
            onSelectOrganization(orgName); 
        }
    };

    return (
        <View style={styles.horizontalBar}>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.horizontalContent}
            >
                <TouchableOpacity 
                    style={[styles.column, selectedOrg === 'All' && styles.selectedColumn]} 
                    onPress={() => handleSelect('All')}
                >
                    <Text style={styles.columnText}>All</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                    style={[styles.column, selectedOrg === 'CSC' && styles.selectedColumn]} 
                    onPress={() => handleSelect('CSC')}
                >
                    <Image source={require('../assets/cscLogo.png')} style={styles.orglogo} />
                </TouchableOpacity>

                <TouchableOpacity 
                    style={[styles.column, selectedOrg === 'GDSC' && styles.selectedColumn]} 
                    onPress={() => handleSelect('GDSC')}
                >
                    <Image source={require('../assets/cscLogo.png')} style={styles.orglogo} />
                </TouchableOpacity>
                
                <TouchableOpacity 
                    style={[styles.column, selectedOrg === 'CFAD' && styles.selectedColumn]} 
                    onPress={() => handleSelect('CFAD')}
                >
                    <Image source={require('../assets/cscLogo.png')} style={styles.orglogo} />
                </TouchableOpacity>






                {/* Add Org logos here, Orgname must be unique para di mag error*/}
                {/* After mag add dito, go to organizationPage, then add org sa function, follow format*/}
            </ScrollView>

            <LinearGradient
                colors={['rgba(0,0,0,0.15)', 'transparent']}
                style={styles.bottomShadow}
                pointerEvents="none"
            />
        </View>
    );
}

const styles = StyleSheet.create({
    horizontalBar: {
        marginTop: 5,
        backgroundColor: '#fff',
        zIndex: 2,
        paddingBottom: 10,
    },
    horizontalContent: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
    },
    column: {
        width: 60,
        height: 50,
        borderRadius: 10,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
        elevation: 2,
    },
    selectedColumn: {
        borderBottomWidth: 3,
        borderBottomColor: '#E50914', 
    },
    columnText: {
        fontWeight: 'bold',
        fontSize: 14,
        color: '#E50914',
    },
    orglogo: {
        width: 40,
        height: 40,
        resizeMode: 'contain',
    },
    bottomShadow: {
        position: 'absolute',
        bottom: -1,
        left: 0,
        right: 0,
        height: 8,
        zIndex: 1,
    },
});
