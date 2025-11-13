import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { updateEventsWithEligibleCourses, quickUpdateCurrentEvents } from '../Backend/updateEventsWithEligibleCourses';

export default function UpdateEventsTest() {
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateResult, setUpdateResult] = useState(null);

  const handleQuickUpdate = async () => {
    setIsUpdating(true);
    setUpdateResult(null);
    
    try {
      const result = await quickUpdateCurrentEvents();
      setUpdateResult(result);
      
      if (result.success) {
        Alert.alert('Success!', 'All events have been updated with eligible courses. Go back to the events page to see the changes.');
      } else {
        Alert.alert('Error', result.error || 'Failed to update events');
      }
    } catch (error) {
      console.error('Update error:', error);
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleFullUpdate = async () => {
    setIsUpdating(true);
    setUpdateResult(null);
    
    try {
      const result = await updateEventsWithEligibleCourses();
      setUpdateResult(result);
      
      if (result.success) {
        Alert.alert('Success!', 'All events have been updated with eligible courses based on their departments.');
      } else {
        Alert.alert('Error', result.error || 'Failed to update events');
      }
    } catch (error) {
      console.error('Update error:', error);
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Update Events with Eligible Courses</Text>
        
        <Text style={styles.description}>
          Your events currently don't have eligible courses data. Use one of the buttons below to add this data:
        </Text>

        <TouchableOpacity 
          style={[styles.button, styles.quickButton]} 
          onPress={handleQuickUpdate}
          disabled={isUpdating}
        >
          <Text style={styles.buttonText}>
            {isUpdating ? 'Updating...' : 'Quick Update (CS Events)'}
          </Text>
        </TouchableOpacity>
        
        <Text style={styles.buttonDescription}>
          Updates your current CS events with courses: BSCS, BSIT, BSCpE, BSEE, BSECE
        </Text>

        <TouchableOpacity 
          style={[styles.button, styles.fullButton]} 
          onPress={handleFullUpdate}
          disabled={isUpdating}
        >
          <Text style={styles.buttonText}>
            {isUpdating ? 'Updating...' : 'Smart Update (All Events)'}
          </Text>
        </TouchableOpacity>
        
        <Text style={styles.buttonDescription}>
          Automatically assigns eligible courses based on department/organization
        </Text>

        {updateResult && (
          <View style={[styles.result, updateResult.success ? styles.success : styles.error]}>
            <Text style={styles.resultText}>
              {updateResult.success ? '✅ Update Successful!' : '❌ Update Failed'}
            </Text>
            {updateResult.error && (
              <Text style={styles.errorText}>{updateResult.error}</Text>
            )}
          </View>
        )}

        <View style={styles.instructions}>
          <Text style={styles.instructionsTitle}>Instructions:</Text>
          <Text style={styles.instructionsText}>
            1. Choose one of the update options above{'\n'}
            2. Wait for the update to complete{'\n'}
            3. Go back to your Events page{'\n'}
            4. You should now see "Eligible Courses" displayed on event cards
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#E50914',
    textAlign: 'center',
    marginBottom: 20,
  },
  description: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 22,
  },
  button: {
    backgroundColor: '#E50914',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  quickButton: {
    backgroundColor: '#4CAF50',
  },
  fullButton: {
    backgroundColor: '#2196F3',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  buttonDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    fontStyle: 'italic',
  },
  result: {
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
  },
  success: {
    backgroundColor: '#E6F9ED',
    borderColor: '#4CAF50',
    borderWidth: 1,
  },
  error: {
    backgroundColor: '#FFE6E6',
    borderColor: '#E50914',
    borderWidth: 1,
  },
  resultText: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  errorText: {
    fontSize: 14,
    color: '#E50914',
    textAlign: 'center',
    marginTop: 5,
  },
  instructions: {
    marginTop: 30,
    padding: 15,
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
  },
  instructionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  instructionsText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});
