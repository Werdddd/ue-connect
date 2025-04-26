import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function HorizontalBar() {
    return (
        <View style={styles.horizontalBar}>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.horizontalContent}
            >
                <TouchableOpacity style={styles.column}>
                    <Text style={styles.columnText}>All</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.column}>
                    <Image source={require('../assets/cscLogo.png')} style={styles.orglogo} />
                </TouchableOpacity>

                <TouchableOpacity style={styles.column}>
                    <Image source={require('../assets/cscLogo.png')} style={styles.orglogo} />
                </TouchableOpacity>

                <TouchableOpacity style={styles.column}>
                    <Image source={require('../assets/cscLogo.png')} style={styles.orglogo} />
                </TouchableOpacity>

                <TouchableOpacity style={styles.column}>
                    <Image source={require('../assets/cscLogo.png')} style={styles.orglogo} />
                </TouchableOpacity>

                <TouchableOpacity style={styles.column}>
                    <Image source={require('../assets/cscLogo.png')} style={styles.orglogo} />
                </TouchableOpacity>
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
