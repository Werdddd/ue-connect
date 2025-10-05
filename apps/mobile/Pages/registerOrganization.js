import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView, TextInput, Alert, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as DocumentPicker from 'expo-document-picker';
import { Ionicons } from '@expo/vector-icons';

export default function RegisterOrganization() {
    const navigation = useNavigation();
    
    // Form state
    const [formData, setFormData] = useState({
        organizationName: '',
        acronym: '',
        department: '',
        description: '',
        email: '',
        contactNumber: '',
        presidentName: '',
        presidentId: '',
    });

    // Document state
    const [documents, setDocuments] = useState({
        constitutionByLaws: null,
        facultyAdviser: null,
        atoApplication: null,
        officersList: null,
        gpoa: null,
        registrationForm: null,
    });

    const departments = ['University Wide','CSC', 'COE', 'CAS', 'CFAD', 'CBA'];

    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const pickDocument = async (documentType) => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
                copyToCacheDirectory: true,
            });

            if (result.type === 'success' || !result.canceled) {
                const file = result.assets ? result.assets[0] : result;
                setDocuments(prev => ({
                    ...prev,
                    [documentType]: {
                        name: file.name,
                        uri: file.uri,
                        size: file.size,
                    }
                }));
                Alert.alert('Success', `${file.name} uploaded successfully!`);
            }
        } catch (error) {
            console.error('Error picking document:', error);
            Alert.alert('Error', 'Failed to upload document');
        }
    };

    const removeDocument = (documentType) => {
        setDocuments(prev => ({
            ...prev,
            [documentType]: null
        }));
    };

    const validateForm = () => {
        // Check required fields
        if (!formData.organizationName || !formData.acronym || !formData.department || 
            !formData.email || !formData.presidentName || !formData.presidentId) {
            Alert.alert('Error', 'Please fill in all required fields');
            return false;
        }

        // Check if all documents are uploaded
        const missingDocs = Object.entries(documents)
            .filter(([key, value]) => !value)
            .map(([key]) => key);

        if (missingDocs.length > 0) {
            Alert.alert('Error', 'Please upload all required documents');
            return false;
        }

        return true;
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;

        Alert.alert(
            'Confirm Submission',
            'Are you sure you want to submit this registration? This cannot be undone.',
            [
                {
                    text: 'Cancel',
                    style: 'cancel'
                },
                {
                    text: 'Submit',
                    onPress: async () => {
                        try {
                            // Here you would implement your actual submission logic
                            // For example: await submitOrganizationRegistration(formData, documents);
                            
                            Alert.alert(
                                'Success!',
                                'Your organization registration has been submitted for review. You will be notified once it has been processed.',
                                [
                                    {
                                        text: 'OK',
                                        onPress: () => navigation.goBack()
                                    }
                                ]
                            );
                        } catch (error) {
                            console.error('Error submitting registration:', error);
                            Alert.alert('Error', 'Failed to submit registration. Please try again.');
                        }
                    }
                }
            ]
        );
    };

    const DocumentUploadCard = ({ title, documentType, document }) => (
        <View style={styles.documentCard}>
            <View style={styles.documentHeader}>
                <Ionicons name="document-text-outline" size={20} color="#E50914" />
                <Text style={styles.documentTitle}>{title}</Text>
                <Text style={styles.requiredBadge}>Required</Text>
            </View>
            
            {document ? (
                <View style={styles.uploadedFile}>
                    <View style={styles.fileInfo}>
                        <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                        <Text style={styles.fileName} numberOfLines={1}>{document.name}</Text>
                    </View>
                    <TouchableOpacity 
                        onPress={() => removeDocument(documentType)}
                        style={styles.removeButton}
                    >
                        <Ionicons name="close-circle" size={24} color="#E50914" />
                    </TouchableOpacity>
                </View>
            ) : (
                <TouchableOpacity 
                    style={styles.uploadButton}
                    onPress={() => pickDocument(documentType)}
                >
                    <Ionicons name="cloud-upload-outline" size={24} color="#E50914" />
                    <Text style={styles.uploadButtonText}>Upload Document</Text>
                    <Text style={styles.uploadHint}>PDF, DOC, DOCX</Text>
                </TouchableOpacity>
            )}
        </View>
    );

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity 
                        onPress={() => navigation.goBack()}
                        style={styles.backButton}
                    >
                        <Ionicons name="arrow-back" size={24} color="#E50914" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Register Organization</Text>
                    <View style={styles.placeholder} />
                </View>

                <ScrollView 
                    style={styles.scrollView}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.scrollContent}
                >
                    {/* Information Section */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Organization Information</Text>
                        
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Organization Name *</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Enter full organization name"
                                value={formData.organizationName}
                                onChangeText={(text) => handleInputChange('organizationName', text)}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Acronym *</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="e.g., ACM, IEEE"
                                value={formData.acronym}
                                onChangeText={(text) => handleInputChange('acronym', text)}
                                autoCapitalize="characters"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Department *</Text>
                            <ScrollView 
                                horizontal 
                                showsHorizontalScrollIndicator={false}
                                style={styles.departmentScroll}
                            >
                                {departments.map((dept) => (
                                    <TouchableOpacity
                                        key={dept}
                                        style={[
                                            styles.departmentChip,
                                            formData.department === dept && styles.departmentChipActive
                                        ]}
                                        onPress={() => handleInputChange('department', dept)}
                                    >
                                        <Text style={[
                                            styles.departmentChipText,
                                            formData.department === dept && styles.departmentChipTextActive
                                        ]}>
                                            {dept}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Description</Text>
                            <TextInput
                                style={[styles.input, styles.textArea]}
                                placeholder="Brief description of your organization"
                                value={formData.description}
                                onChangeText={(text) => handleInputChange('description', text)}
                                multiline
                                numberOfLines={4}
                                textAlignVertical="top"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Email Address *</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="organization@example.com"
                                value={formData.email}
                                onChangeText={(text) => handleInputChange('email', text)}
                                keyboardType="email-address"
                                autoCapitalize="none"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Contact Number</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="+63 XXX XXX XXXX"
                                value={formData.contactNumber}
                                onChangeText={(text) => handleInputChange('contactNumber', text)}
                                keyboardType="phone-pad"
                            />
                        </View>
                    </View>

                    {/* President Information */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>President Information</Text>
                        
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Full Name *</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Enter president's full name"
                                value={formData.presidentName}
                                onChangeText={(text) => handleInputChange('presidentName', text)}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Student ID *</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Enter student ID number"
                                value={formData.presidentId}
                                onChangeText={(text) => handleInputChange('presidentId', text)}
                            />
                        </View>
                    </View>

                    {/* Documents Section */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Required Documents</Text>
                        <Text style={styles.sectionSubtitle}>
                            Upload all required documents (PDF, DOC, or DOCX format)
                        </Text>

                        <DocumentUploadCard 
                            title="Constitution & By-Laws"
                            documentType="constitutionByLaws"
                            document={documents.constitutionByLaws}
                        />

                        <DocumentUploadCard 
                            title="Faculty Adviser Documentation"
                            documentType="facultyAdviser"
                            document={documents.facultyAdviser}
                        />

                        <DocumentUploadCard 
                            title="Application for ATO"
                            documentType="atoApplication"
                            document={documents.atoApplication}
                        />

                        <DocumentUploadCard 
                            title="Officers List"
                            documentType="officersList"
                            document={documents.officersList}
                        />

                        <DocumentUploadCard 
                            title="General Plans of Action (GPOA)"
                            documentType="gpoa"
                            document={documents.gpoa}
                        />

                        <DocumentUploadCard 
                            title="Registration Form"
                            documentType="registrationForm"
                            document={documents.registrationForm}
                        />
                    </View>

                    {/* Submit Button */}
                    <TouchableOpacity 
                        style={styles.submitButton}
                        onPress={handleSubmit}
                    >
                        <Text style={styles.submitButtonText}>Submit Registration</Text>
                    </TouchableOpacity>

                    <View style={styles.bottomPadding} />
                </ScrollView>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#fff',
    },
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    backButton: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    placeholder: {
        width: 32,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 40,
    },
    section: {
        paddingHorizontal: 20,
        paddingTop: 24,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#E50914',
        marginBottom: 8,
    },
    sectionSubtitle: {
        fontSize: 14,
        color: '#666',
        marginBottom: 16,
        lineHeight: 20,
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 15,
        backgroundColor: '#fff',
    },
    textArea: {
        height: 100,
        paddingTop: 12,
    },
    departmentScroll: {
        marginTop: 8,
    },
    departmentChip: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
        backgroundColor: '#f5f5f5',
        marginRight: 10,
        borderWidth: 1,
        borderColor: '#ddd',
    },
    departmentChipActive: {
        backgroundColor: '#E50914',
        borderColor: '#E50914',
    },
    departmentChipText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#666',
    },
    departmentChipTextActive: {
        color: '#fff',
    },
    documentCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#e0e0e0',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    documentHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    documentTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: '#333',
        flex: 1,
        marginLeft: 8,
    },
    requiredBadge: {
        fontSize: 11,
        color: '#E50914',
        backgroundColor: '#FFE0E0',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 4,
        fontWeight: '600',
    },
    uploadButton: {
        backgroundColor: '#FFF5F5',
        borderWidth: 2,
        borderColor: '#FFE0E0',
        borderStyle: 'dashed',
        borderRadius: 8,
        paddingVertical: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    uploadButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#E50914',
        marginTop: 8,
    },
    uploadHint: {
        fontSize: 12,
        color: '#999',
        marginTop: 4,
    },
    uploadedFile: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#F0FFF0',
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#C8E6C9',
    },
    fileInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        marginRight: 12,
    },
    fileName: {
        fontSize: 14,
        color: '#333',
        marginLeft: 8,
        flex: 1,
    },
    removeButton: {
        padding: 4,
    },
    submitButton: {
        backgroundColor: '#E50914',
        marginHorizontal: 20,
        marginTop: 32,
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    bottomPadding: {
        height: 20,
    },
});