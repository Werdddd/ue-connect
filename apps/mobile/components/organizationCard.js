import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';

export default function OrganizationCard({ orgName, memberCount, shortdesc, logo, eligibleCourses = [] }) {
    const navigation = useNavigation();
    return (
        <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('OrgProfilePage', {orgName})}>
            <View style={styles.headerRow}>
                {logo ? (
                    <Image
                        source={{ uri: logo }}
                        style={styles.orgcardlogo}
                    />
                ) : (
                    <View style={styles.logoPlaceholder}>
                        <Text style={styles.logoPlaceholderText}>
                            {orgName?.charAt(0)?.toUpperCase() || '?'}
                        </Text>
                    </View>
                )}
                <Text style={styles.orgName}>{orgName}</Text>
            </View>
            <Text style={styles.memberCount}>{memberCount} members</Text>
            <Text style={styles.description}>
                {shortdesc}
            </Text>
            {Array.isArray(eligibleCourses) && eligibleCourses.length > 0 && (
                <View style={styles.courseList}>
                    <Text style={styles.courseLabel}>Eligible Courses:</Text>
                    <View style={styles.courseChips}>
                        {eligibleCourses.map((course) => (
                            <View key={course} style={styles.courseChip}>
                                <Text style={styles.courseChipText}>{course}</Text>
                            </View>
                        ))}
                    </View>
                </View>
            )}
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
    logoPlaceholder: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 10,
        backgroundColor: '#FFE0E0',
        alignItems: 'center',
        justifyContent: 'center',
    },
    logoPlaceholderText: {
        color: '#E50914',
        fontWeight: '700',
        fontSize: 16,
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
    courseList: {
        marginTop: 12,
    },
    courseLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: '#555',
        marginBottom: 6,
    },
    courseChips: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
    },
    courseChip: {
        backgroundColor: '#FFF5F5',
        borderRadius: 12,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderWidth: 1,
        borderColor: '#FFE0E0',
    },
    courseChipText: {
        fontSize: 12,
        color: '#E50914',
        fontWeight: '600',
    },
});
