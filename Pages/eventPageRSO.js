import React, { useState, useEffect } from 'react';
import {
    View, Text, TouchableOpacity, SafeAreaView,
    KeyboardAvoidingView, Platform, ScrollView, StyleSheet,
    Modal, TextInput, Image, Linking
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Header from '../components/header';
import BottomNavBar from '../components/bottomNavBar';
import OrganizationBar from '../components/organizationBar';
import EventCardRSO from '../components/eventCardRSO';
import { fetchEvents, addEvent } from '../Backend/eventPageRSO'; 
import { getSuggestedDateTime } from '../Backend/eventPageRSO';
import { launchImageLibrary } from 'react-native-image-picker';
// import DocumentPicker from 'react-native-document-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';

export default function EventPageRSO() {
    const navigation = useNavigation();
    const [selectedOrg, setSelectedOrg] = useState('All');
    const [scrollY, setScrollY] = useState(0);
    const [events, setEvents] = useState([]);
    const [isModalVisible, setIsModalVisible] = useState(false);

    const [newTitle, setNewTitle] = useState('');
    const [newDescription, setNewDescription] = useState('');
    const [newDate, setNewDate] = useState('');
    const [newTime, setNewTime] = useState('');
    const [newLocation, setNewLocation] = useState('');
    const [newParticipants, setNewParticipants] = useState('');
    const [organization, setOrganization] = useState('');  
    const [status, setStatus] = useState('');
    const [selectedBanner, setSelectedBanner] = useState(null);
    const [selectedProposal, setSelectedProposal] = useState(null);

    const [isProposalModalVisible, setIsProposalModalVisible] = useState(false);
    const [proposalLink, setProposalLink] = useState('');

    useEffect(() => {
        loadEvents();
    }, []);

    const loadEvents = async () => {
        try {
            const data = await fetchEvents();
            setEvents(data);
        } catch (error) {
            console.error('Failed to load events:', error);
        }
    };

    async function getBase64(uri) {
        const base64 = await FileSystem.readAsStringAsync(uri, {
            encoding: FileSystem.EncodingType.Base64,
        });
        return base64;
    }

    async function compressImage(uri) {
        const compressed = await ImageManipulator.manipulateAsync(
            uri,
            [{ resize: { width: 100 } }],
            { compress: 0.3, format: ImageManipulator.SaveFormat.JPEG }
        );
        return compressed.uri;
    }

    const handleSelectBanner = async () => {
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (!permissionResult.granted) {
            alert("Permission to access media library is required!");
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 1,
        });

        if (!result.canceled) {
            try {
                const uri = result.assets[0].uri;

                // For Compressing Image(Di kaya pag malaki)
                const compressed = await ImageManipulator.manipulateAsync(
                    uri,
                    [{ resize: { width: 800 } }],
                    { compress: 0.5, format: ImageManipulator.SaveFormat.JPEG }
                );

                // Convert to base64
                const base64 = await FileSystem.readAsStringAsync(compressed.uri, {
                    encoding: FileSystem.EncodingType.Base64,
                });

                const dataUri = `data:image/jpeg;base64,${base64}`;
                setSelectedBanner(dataUri);

            } catch (error) {
                console.error("Error processing image:", error);
            }
        }
    };

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
    

    

    const handleAddEvent = async () => {
        if (!newTitle || !newDescription || !newDate || !newTime || !newLocation || !newParticipants || !selectedBanner) {
            alert('Please fill out all fields!');
            return;
        }

        const participants = parseInt(newParticipants, 10);
        if (isNaN(participants)) {
            alert('Please enter a valid number for participants!');
            return;
        }

        const eventStatus = status || 'Applied'; 

        const newEvent = {
            banner: selectedBanner,
            title: newTitle,
            description: newDescription,
            date: newDate,
            time: newTime,
            location: newLocation,
            participants: participants,
            org: organization,  
            status: eventStatus, 
            proposalLink: selectedProposal?.uri || null,
            proposalName: selectedProposal?.name || null,
        };

        try {
            await addEvent(newEvent);
            await loadEvents();
            setIsModalVisible(false);
            setSelectedBanner(null);
            setNewTitle('');
            setNewDescription('');
            setNewDate('');
            setNewTime('');
            setNewLocation('');
            setNewParticipants('');
            setStatus('');
            setSelectedProposal(null); // Clear selected proposal
        } catch (error) {
            console.error('Error adding event:', error);
        }
    };


    const getOrganizationTitle = () => {
        switch (selectedOrg) {
            case 'All': return 'All Events';
            case 'CSC': return 'Central Student Council';
            case 'COE': return 'College of Engineering';
            case 'CFAD': return 'College of Fine Arts and Science';
            case 'CBA': return 'College of Business Administration';
            case 'CAS': return 'College of Arts and Science';
            default: return '';
        }
    };

    const filteredEvents = selectedOrg === 'All'
        ? events
        : events.filter(event => event.org === selectedOrg);

    const [suggestedDateTime, setSuggestedDateTime] = useState(null);

        useEffect(() => {
            const fetchSuggestion = async () => {
              const suggestion = await getSuggestedDateTime();
              setSuggestedDateTime(suggestion);
            };
          
            fetchSuggestion();
          }, []);
          
        
    

    return (
        <SafeAreaView style={styles.safeArea}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.container}
            >
                <Header scrollY={scrollY} />
                <ScrollView
                    onScroll={(event) => {
                        setScrollY(event.nativeEvent.contentOffset.y);
                    }}
                    scrollEventThrottle={16}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}>

                    <TouchableOpacity
                        style={styles.floatingButton}
                        onPress={() => setIsModalVisible(true)}
                    >
                        <Text style={styles.floatingButtonText}>Create Event</Text>
                    </TouchableOpacity>

                    <View style={styles.titleContainer}>
                        <Text style={styles.titleText}>Your Events</Text>
                        <View style={styles.underline} />
                    </View>

                    {filteredEvents.map((event) => (
                        <EventCardRSO
                            key={event.id}
                            event={{
                                id: event.id,
                                banner: event.banner,
                                seal: event.seal,
                                title: event.title,
                                date: event.date,
                                time: event.time,
                                description: event.description,
                                participants: event.participants,
                                location: event.location,
                                status: event.status
                                
                            }}
                        />
                    ))}

                </ScrollView>

                <BottomNavBar />

                {/* Modal */}
                <Modal
                    animationType="slide"
                    transparent={true}
                    visible={isModalVisible}
                    onRequestClose={() => setIsModalVisible(false)}
                >
                    <View style={styles.modalContainer}>
                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                        style={styles.modalContentWrapper} // Added a wrapper style for layout adjustments
                    >
                         <ScrollView
                            
                            keyboardShouldPersistTaps="handled" // To ensure tapping outside input still dismisses keyboard
                        >
                        <View style={styles.modalContent}>
                            <Text style={styles.modalTitle}>Create Event</Text>
                            <Text style={styles.label}>Event Title</Text>
                            <TextInput
                                placeholder="ENtramurals 2025"
                                placeholderTextColor="#D3D3D3"
                                style={styles.input}
                                value={newTitle}
                                onChangeText={setNewTitle}
                            />
                            <Text style={styles.label}>Event Description</Text>
                            <TextInput
                                placeholder="An event of..."
                                placeholderTextColor="#D3D3D3"
                                style={styles.input}
                                value={newDescription}
                                onChangeText={setNewDescription}
                            />
                            
                            <View style={styles.dateTimeRow}>
                                {/* Date Input */}
                                <View style={styles.dateTimeColumn}>
                                    <Text style={styles.label}>Event Date</Text>
                                    <TextInput
                                    placeholder="April 25, 2025"
                                    placeholderTextColor="#D3D3D3"
                                    style={styles.input}
                                    value={newDate}
                                    onChangeText={setNewDate}
                                    />
                                </View>

                                {/* Time Input */}
                                <View style={styles.dateTimeColumn}>
                                    <Text style={styles.label}>Event Time</Text>
                                    <TextInput
                                    placeholder="8:00 AM - 12:00 PM"
                                    placeholderTextColor="#D3D3D3"
                                    style={styles.input}
                                    value={newTime}
                                    onChangeText={setNewTime}
                                    />
                                </View>
                                </View>

                                {/* Suggestions Below Inputs */}
                                {suggestedDateTime?.suggestedTimes?.length > 0 && (
                                <View style={styles.suggestionContainer}>
                                    <Text style={styles.suggestionLabel}>Suggestions:</Text>
                                    <View style={styles.suggestionGrid}>
                                    {suggestedDateTime.suggestedTimes.map((item, index) => {
                                        const [date, time] = item.split(" • ");
                                        return (
                                        <TouchableOpacity
                                            key={index}
                                            style={styles.suggestionButton}
                                            onPress={() => {
                                            setNewDate(date.trim());
                                            setNewTime(time.trim());
                                            }}
                                        >
                                            <Text style={styles.suggestionText}>{date}</Text>
                                            <Text style={styles.suggestionText}>{time}</Text>
                                        </TouchableOpacity>
                                        );
                                    })}
                                    </View>
                                </View>
                                )}





                        <Text style={[styles.label, { marginTop: 10 }]}>Event Location</Text>

                            <TextInput
                                placeholder="MPH 2, Engineering Building"
                                placeholderTextColor="#D3D3D3"
                                style={styles.input}
                                value={newLocation}
                                onChangeText={setNewLocation}
                            />
                            <Text style={styles.label}>Event Participants</Text>
                            <TextInput
                                placeholder="100"
                                placeholderTextColor="#D3D3D3"
                                style={styles.input}
                                keyboardType="numeric"
                                value={newParticipants}
                                onChangeText={setNewParticipants}
                            />
                            <View style={styles.bannerFileRow}>
                                <View style={styles.uploadSection}>
                                    <Text style={styles.label}>Event Banner</Text>
                                    <TouchableOpacity
                                        style={styles.uploadButton}
                                        onPress={handleSelectBanner}
                                    >
                                        <Text style={styles.buttonText}>
                                            {selectedBanner ? 'Change Banner' : 'Upload Banner'}
                                        </Text>
                                    </TouchableOpacity>
                                    {selectedBanner && (
                                        <Image
                                            source={{ uri: selectedBanner }}
                                            style={styles.bannerPreview}
                                            resizeMode="cover"
                                        />
                                    )}
                                </View>

                                <View style={styles.uploadSection}>
                                    <Text style={styles.label}>Event Proposal</Text>
                                   
                                    

                                    

                                    <TouchableOpacity
                                        style={styles.uploadButton}
                                        onPress={handleSelectProposal} // Opens the modal to add/edit proposal link
                                        >
                                        <Text style={styles.buttonText}>
                                            {selectedProposal ? 'Change Proposal' : 'Upload Proposal'}
                                        </Text>
                                    </TouchableOpacity>



                                </View>
                                {/* Modal for Proposal Link Input */}
                                <Modal
                                    animationType="slide"
                                    transparent={true}
                                    visible={isProposalModalVisible}
                                    onRequestClose={() => setIsProposalModalVisible(false)} // Close the modal
                                >
                                    <View style={styles.modalContainer}>
                                    <View style={styles.modalContent}>
                                        <Text style={styles.modalTitle}>Enter Proposal Link</Text>

                                        

                                        <TextInput
                                        placeholder="Enter Google Drive link"
                                        placeholderTextColor="#D3D3D3"
                                        style={styles.input}
                                        value={proposalLink}
                                        onChangeText={setProposalLink}
                                        />


                                        {proposalLink && (
                                        <View style={styles.previewContainer}>
                                            <Text style={styles.previewTitle}>Preview Link:</Text>
                                            <TouchableOpacity onPress={() => Linking.openURL(proposalLink)}>
                                            <Text style={styles.previewLink}>{proposalLink}</Text>
                                            </TouchableOpacity>
                                        </View>
                                        )}

                                        <View style={styles.proposalModalButtons}>
                                        <TouchableOpacity
                                            style={[styles.proposalmodalButton, styles.cancelButton]}
                                            onPress={() => {
                                                setIsProposalModalVisible(false);
                                                setProposalLink('null');
                                                 // or '' depending on how preview is handled
                                              }}
                                              
                                              
                                        >
                                            <Text style={styles.buttonText}>Cancel</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={[styles.proposalmodalButton, styles.saveButton]}
                                            onPress={handleSaveProposalLink}
                                        >
                                            <Text style={styles.buttonText}>Save</Text>
                                        </TouchableOpacity>
                                        </View>

                                    </View>
                                    </View>
                                </Modal>

                            </View>

                            <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={styles.cancelButtons}
                                onPress={() => {
                                    setIsModalVisible(false);
                                    // Clear the date and time inputs as well
                                    setNewDate('');
                                    setNewTime('');
                                    
                                }}
                            >
                                <Text style={styles.buttonText}>Cancel</Text>
                            </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.addButton}
                                    onPress={handleAddEvent}
                                >
                                    <Text style={styles.buttonText}>Add</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                        </ScrollView>
                        </KeyboardAvoidingView>
                    </View>
                </Modal>
            </KeyboardAvoidingView>
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
    scrollContent: {
        flexGrow: 1,
        paddingBottom: 80,
    },
    titleContainer: {
        marginTop: 15,
        marginHorizontal: 20,
        marginBottom: 15,
    },
    titleText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#E50914',
        textAlign: 'center',
    },
    underline: {
        alignSelf: 'center',
        height: 1,
        backgroundColor: '#E50914',
        width: '100%',
        marginTop: 2,
    },
    floatingButton: {
        alignSelf: 'center',
        marginTop: 10,
        backgroundColor: '#E50914',
        padding: 10,
        borderRadius: 10,
        width: '90%',
        height: 'auto',
        justifyContent: 'center',
        alignItems: 'center',
    },
    dateTimeRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 10, 
    },

    dateTimeColumn: {
        flex: 1,
    },

    floatingButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalContent: {
        backgroundColor: 'white',
        marginHorizontal: 20,
        borderRadius: 10,
        padding: 20,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
        textAlign: 'center',
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
        marginBottom: 5,
        marginTop: 5,
        textAlign: 'left',
    },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,
        padding: 10,
        marginVertical: 5,
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 15,
    },
    
    addButton: {
        backgroundColor: '#4CAF50',
      
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 5,
        width: '48%',
        marginTop: 5,
        textAlign: 'center',
    },
    buttonText: {
        color: 'white',
        fontWeight: 'bold',
        textAlign: 'center',
    },

    uploadButton: {
        backgroundColor: '#E50914',
        paddingVertical: 10,
       
        borderRadius: 5,
        width: '100%',
        marginTop: 5,
        textAlign: 'center',
    },
    bannerPreview: {
        width: '100%',
        height: 150,
        marginTop: 10,
        borderRadius: 8,
    },
    uploadSection: {
        flex: 1,
    },
    bannerFileRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: 10,
    },
    suggestionContainer: {
        marginTop: 5,
      },
      
      suggestionLabel: {
        fontWeight: '400',
        marginBottom: 6,
        fontStyle: 'italic',
        fontSize: 12,
        color: '#555',
      },
      
      suggestionGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10, // Use margin for RN versions that don't support gap
      },
      
      suggestionButton: {
        backgroundColor: '#f5f5f5',
        paddingVertical: 5,
        paddingHorizontal: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ddd',
        
        width: '48%', // Two per row
      },
      
      suggestionText: {
        fontSize: 12,
        color: '#333',
        textAlign: 'center',
      },
      

    uploadSection: {
        flex: 1,
    },

    bannerPreview: {
        width: '100%',
        height: 100,
        marginTop: 8,
        borderRadius: 8,
    },

    proposalText: {
        fontSize: 24,
        color: '#000',
        fontStyle: 'italic',
    },

    proposalModalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 20,
      },
      proposalmodalButton: {
        flex: 1,
        paddingVertical: 10,
        marginHorizontal: 5,
        borderRadius: 5,
        alignItems: 'center',
      },
      cancelButton: {
        backgroundColor: '#E50914',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 5,
        width: '45%',
        marginTop: 5,
        textAlign: 'center',
      },
      cancelButtons: {
        backgroundColor: '#E50914',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 5,
        width: '48%',
        marginTop: 5,
        textAlign: 'center',
      },
      saveButton: {
        backgroundColor: '#4CAF50',
      
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 5,
        width: '45%',
        marginTop: 5,
        textAlign: 'center',
      },
      buttonText: {
        color: '#fff',
        fontWeight: 'bold',
        textAlign: 'center',
      },
      
});
