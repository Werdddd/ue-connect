import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView, TextInput, Alert, Platform, ActivityIndicator, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { registerOrganization } from '../Backend/organizationHandler';

export default function RegisterOrganization() {
    const navigation = useNavigation();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [logo, setLogo] = useState(null);
    const [selectedCourses, setSelectedCourses] = useState([]);
    // Form state
    const [formData, setFormData] = useState({
        organizationName: '',
        acronym: '',
        department: '',
        description: '',
        location: '',
      
        contactNumber: '',
        presidentName: '',
        presidentId: '',
        adviserName: '',
    });

    // Document state
    const [documents, setDocuments] = useState({
        constitutionByLaws: null,
        // facultyAdviser: null,
        atoApplication: null,
        officersList: null,
        gpoa: null,
        registrationForm: null,
    });

    const departments = ['University Wide','CSC', 'COE', 'CAS', 'CFAD', 'CBA'];

    const courses = [
        { label: 'College of Engineering', value: 'label-engineering', isLabel: true },
        { label: 'BSCE', value: 'BSCE' },
        { label: 'BSCpE', value: 'BSCpE' },
        { label: 'BSEE', value: 'BSEE' },
        { label: 'BSECE', value: 'BSECE' },
        { label: 'BSME', value: 'BSME' },
        { label: 'BSCS', value: 'BSCS' },
        { label: 'BSIT', value: 'BSIT' },
        { label: 'BSDS', value: 'BSDS' },
        { label: 'College of Fine Arts, Architecture and Design', value: 'label-cfad', isLabel: true },
        { label: 'BMA', value: 'BMA' },
        { label: 'BSID', value: 'BSID' },
        { label: 'BFA', value: 'BFA' },
        { label: 'BS Architecture', value: 'BS Architecture' },
        { label: 'Business Administration', value: 'label-ba', isLabel: true },
        { label: 'BS Accountancy', value: 'BS Accountancy' },
        { label: 'BSMA', value: 'BSMA' },
        { label: 'BSBA', value: 'BSBA' },
        { label: 'College of Arts and Sciences', value: 'label-cas', isLabel: true },
        { label: 'BSC', value: 'BSC' },
        { label: 'BSP', value: 'BSP' },
        { label: 'BSHM', value: 'BSHM' },
        { label: 'BSTM', value: 'BSTM' },
    ];

    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const toggleCourse = (courseValue) => {
        setSelectedCourses(prev => {
            if (prev.includes(courseValue)) {
                return prev.filter(c => c !== courseValue);
            } else {
                return [...prev, courseValue];
            }
        });
    };

    const pickDocument = async (documentType) => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: [
                    'application/pdf',
                    'application/msword',
                    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
                ],
                copyToCacheDirectory: true,
            });

            if (result.type === 'success' || !result.canceled) {
                const file = result.assets ? result.assets[0] : result;

                // Firestore per-field limit ~1MB (1048487 bytes)
                // Base64 inflates ~33%, so we limit raw file size to ~750KB
                const firestoreSafeLimit = 750 * 1024; 

                if (file.size > firestoreSafeLimit) {
                    Alert.alert(
                        '⚠️ File Too Large',
                        `The selected file "${file.name}" is ${(file.size / (1024 * 1024)).toFixed(2)} MB, which is too large to store.\n\nPlease upload a smaller file (<750KB).`,
                        [
                            {
                                text: 'Re-upload',
                                onPress: () => pickDocument(documentType),
                                style: 'destructive',
                            },
                            { text: 'Cancel', style: 'cancel' },
                        ]
                    );
                    return;
                }

                setDocuments(prev => ({
                    ...prev,
                    [documentType]: {
                        name: file.name,
                        uri: file.uri,
                        size: file.size,
                        mimeType: file.mimeType || 'application/pdf',
                    }
                }));

                Alert.alert('✅ Success', `${file.name} uploaded successfully!`);
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
        if (!formData.organizationName || !formData.acronym || !formData.department
          || !formData.presidentName || !formData.presidentId || !formData.adviserName) {
            Alert.alert('Error', 'Please fill in all required fields');
            return false;
        }

        // Check if at least one course is selected
        if (selectedCourses.length === 0) {
            Alert.alert('Error', 'Please select at least one course that can join your organization');
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

    const pickLogo = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images, // ✅ FIXED
                allowsEditing: true,
                aspect: [1, 1], // square crop
                quality: 0.7,
            });

            if (!result.canceled) {
                const file = result.assets[0];

                // File size limit (5MB for logos)
                const maxSize = 5 * 1024 * 1024;
                if (file.fileSize && file.fileSize > maxSize) {
                    Alert.alert(
                        '⚠️ Logo Too Large',
                        `The selected image "${file.fileName || "logo"}" is ${(file.fileSize / (1024 * 1024)).toFixed(2)} MB, which exceeds the 5MB limit.\n\nPlease upload a smaller image.`,
                        [
                            { text: 'Re-upload', onPress: () => pickLogo(), style: 'destructive' },
                            { text: 'Cancel', style: 'cancel' },
                        ]
                    );
                    return;
                }

                setLogo({
                    uri: file.uri,
                    name: file.fileName || "org-logo.jpg",
                    type: file.type || "image/jpeg",
                    size: file.fileSize || 0,
                });

                Alert.alert('✅ Success', 'Organization logo uploaded successfully!');
            }
        } catch (error) {
            console.error("Error picking logo:", error);
            Alert.alert("Error", "Failed to upload logo");
        }
    };


    const handleSubmit = async () => {
        if (!validateForm()) return;

        // // Validate ue.edu.ph email
        // if (!formData.email.toLowerCase().endsWith('@ue.edu.ph')) {
        //     throw new Error('Email must end with @ue.edu.ph');
        // }


        if (!logo) {
            Alert.alert("Error", "Please upload your organization logo");
            return;
        }

        Alert.alert(
            'Confirm Submission',
            'Are you sure you want to submit this registration? This cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Submit',
                    onPress: async () => {
                        setIsSubmitting(true);
                        try {
                            console.log('Starting registration process...');

                            // Send logo + formData + documents + canJoin
                            const result = await registerOrganization(formData, documents, logo, selectedCourses);

                            console.log('Registration successful:', result.id);

                            Alert.alert(
                                'Success!',
                                'Your organization registration has been submitted for review.',
                                [{ text: 'OK', onPress: () => navigation.goBack() }]
                            );
                        } catch (error) {
                            console.error('Error submitting registration:', error);
                            Alert.alert('Error', 'Failed to submit registration. Please try again.');
                        } finally {
                            setIsSubmitting(false);
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

                        {/* <View style={styles.inputGroup}>
                            <Text style={styles.label}>Email Address *</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="organization@ue.edu.ph"
                                value={formData.email}
                                onChangeText={(text) => handleInputChange('email', text)}
                                keyboardType="email-address"
                                autoCapitalize="none"
                            />
                            {formData.email && !formData.email.toLowerCase().endsWith('@ue.edu.ph') && (
                                <Text style={{ color: 'red', marginTop: 4 }}>
                                    Email must end with @ue.edu.ph
                                </Text>
                            )}

                        </View> */}

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

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Location</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Location of your organization within the campus"
                                value={formData.location}
                                onChangeText={(text) => handleInputChange('location', text)}
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

                    {/* Adviser Information */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Adviser Information</Text>
                        
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Full Name *</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Enter adviser's full name"
                                value={formData.adviserName}
                                onChangeText={(text) => handleInputChange('adviserName', text)}
                            />
                        </View>
                    </View>

                    {/* Eligible Courses Section */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Eligible Courses *</Text>
                        <Text style={styles.sectionSubtitle}>
                            Select at least one course that can join your organization
                        </Text>
                        
                        <View style={styles.coursesContainer}>
                            {courses.map((course) => {
                                if (course.isLabel) {
                                    return (
                                        <Text key={course.value} style={styles.courseLabel}>
                                            {course.label}
                                        </Text>
                                    );
                                }
                                
                                const isSelected = selectedCourses.includes(course.value);
                                return (
                                    <TouchableOpacity
                                        key={course.value}
                                        style={[
                                            styles.courseButton,
                                            isSelected && styles.courseButtonActive
                                        ]}
                                        onPress={() => toggleCourse(course.value)}
                                    >
                                        <Text style={[
                                            styles.courseButtonText,
                                            isSelected && styles.courseButtonTextActive
                                        ]}>
                                            {course.label}
                                        </Text>
                                        {isSelected && (
                                            <Ionicons name="checkmark-circle" size={18} color="#fff" style={styles.checkIcon} />
                                        )}
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                        
                        {selectedCourses.length > 0 && (
                            <Text style={styles.selectedCount}>
                                {selectedCourses.length} course{selectedCourses.length > 1 ? 's' : ''} selected
                            </Text>
                        )}
                    </View>

                    {/* Logo Upload Section */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Organization Logo</Text>
                        <Text style={styles.sectionSubtitle}>
                            Upload your organization logo (JPG or PNG, max 5MB)
                        </Text>

                        {logo ? (
                            <View style={styles.logoPreviewContainer}>
                                <Image source={{ uri: logo.uri }} style={styles.logoPreview} />
                                <TouchableOpacity 
                                    style={styles.removeLogoButton} 
                                    onPress={() => setLogo(null)}
                                >
                                    <Ionicons name="close-circle" size={28} color="#E50914" />
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <TouchableOpacity style={styles.uploadButton} onPress={pickLogo}>
                                <Ionicons name="image-outline" size={28} color="#E50914" />
                                <Text style={styles.uploadButtonText}>Upload Logo</Text>
                                <Text style={styles.uploadHint}>JPG, PNG</Text>
                            </TouchableOpacity>
                        )}
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

                        {/* <DocumentUploadCard 
                            title="Faculty Adviser Documentation"
                            documentType="facultyAdviser"
                            document={documents.facultyAdviser}
                        /> */}

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
                        style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
                        onPress={handleSubmit}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (
                            <View style={styles.submitButtonContent}>
                                <ActivityIndicator color="#fff" size="small" />
                                <Text style={[styles.submitButtonText, styles.submittingText]}>
                                    Submitting...
                                </Text>
                            </View>
                        ) : (
                            <Text style={styles.submitButtonText}>Submit Registration</Text>
                        )}
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
    submitButtonDisabled: {
        backgroundColor: '#999',
        opacity: 0.7,
    },
    submitButtonContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    submittingText: {
        marginLeft: 10,
    },
    bottomPadding: {
        height: 20,
    },
    logoPreviewContainer: {
        position: 'relative',
        alignItems: 'center',
        marginTop: 10,
    },
    logoPreview: {
        width: 120,
        height: 120,
        borderRadius: 60,
        borderWidth: 2,
        borderColor: '#ddd',
    },
    removeLogoButton: {
        position: 'absolute',
        top: -10,
        right: -10,
        backgroundColor: '#fff',
        borderRadius: 15,
    },
    coursesContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    courseLabel: {
        width: '100%',
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginTop: 12,
        marginBottom: 8,
    },
    courseButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        backgroundColor: '#f5f5f5',
        borderWidth: 1,
        borderColor: '#ddd',
        marginRight: 8,
        marginBottom: 8,
    },
    courseButtonActive: {
        backgroundColor: '#E50914',
        borderColor: '#E50914',
    },
    courseButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#666',
    },
    courseButtonTextActive: {
        color: '#fff',
    },
    checkIcon: {
        marginLeft: 6,
    },
    selectedCount: {
        fontSize: 14,
        color: '#4CAF50',
        fontWeight: '600',
        marginTop: 8,
    },
});