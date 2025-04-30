import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  ScrollView,
  Platform,
  SafeAreaView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { signUpUser } from '../Backend/signup';
import { Alert } from 'react-native';
import { Picker } from '@react-native-picker/picker';


export default function SignUp() {
  const navigation = useNavigation();
  const [year, setYear] = useState('');
  const [course, setCourse] = useState('');

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [studentNumber, setStudentNumber] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const nameRegex = /^[A-Za-z\s]+$/;
  const studentNumberRegex = /^[0-9]{11}$/;
  const ueEmailRegex = /^[a-zA-Z0-9._%+-]+@ue\.edu\.ph$/;


  const handleSignUp = async () => {
    if (!firstName.match(nameRegex)) {
      Alert.alert('Invalid Input', 'First name should contain only letters.');
      return;
    }

    if (!year) {
      Alert.alert('Invalid Input', 'Please select your year.');
      return;
    }

    if (!course) {
      Alert.alert('Invalid Input', 'Please select your course.');
      return;
    }

    if (!lastName.match(nameRegex)) {
      Alert.alert('Invalid Input', 'Last name should contain only letters.');
      return;
    }

    if (!studentNumber.match(studentNumberRegex)) {
      Alert.alert('Invalid Input', 'Student number must be exactly 11 digits.');
      return;
    }

    if (!email.match(ueEmailRegex)) {
      Alert.alert('Invalid Input', 'Use a valid UE email address.');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Invalid Input', 'Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Invalid Input', "Passwords don't match.");
      return;
    }

    setLoading(true);
    try {
      const result = await signUpUser({ firstName, lastName, studentNumber, email, password });

      if (result.success) {
        navigation.navigate('Login');
      } else {
        Alert.alert('SignUp Error', result.error);
      }
    } catch (error) {
      Alert.alert('SignUp Error', 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }

  };



  return (
    <ScrollView>
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        {loading && (
          <View style={styles.loadingContainer}>
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color="#FE070C" />
              <Text style={{ marginTop: 10 }}>Creating your account...</Text>
            </View>
          </View>
        )}

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.container}
        >
          <View
            keyboardShouldPersistTaps="handled"
          >
            <Image
              source={require('../assets/logo.png')}
              style={styles.logo}
            />

            <Text style={styles.title}>Create Your Account</Text>


            <View style={styles.tagRow}>
              <View style={styles.tagRowflex}>
                <Text style={styles.label} >First Name</Text>
              </View>
              <View style={styles.tagRowflex}>
                <Text style={styles.label}>Last Name</Text>
              </View>
            </View>
            <View style={styles.nameRow}>

              <TextInput
                style={[styles.input, styles.nameInput]}
                placeholder="Enter First Name"
                value={firstName}
                onChangeText={setFirstName}
              />
              <TextInput
                style={[styles.input, styles.nameInput, styles.lastNameInput]}
                placeholder="Enter Last Name"
                value={lastName}
                onChangeText={setLastName}
              />
            </View>

            <Text style={styles.label} >Student Number</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter Student Number"
              value={studentNumber}
              onChangeText={setStudentNumber}
              keyboardType="numeric"
            />
            <Text style={styles.label} >UE Email Address</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your UE Email Address"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Text style={styles.label} >Password</Text>
            <View style={styles.passwordContainer}>
              
              <TextInput
                style={styles.passwordInput}
                placeholder="Enter your Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Text style={styles.toggleText}>
                  {showPassword ? 'Hide' : 'Show'}
                </Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.label} >Confirm Password</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Confirm Password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
              />
              <TouchableOpacity
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                <Text style={styles.toggleText}>
                  {showConfirmPassword ? 'Hide' : 'Show'}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.row}>
              <View style={styles.pickerWrapper}>
                <Text style={styles.label}>Year</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={year}
                    onValueChange={(itemValue) => setYear(itemValue)}
                    style={styles.picker}
                  >
                    <Picker.Item label="Select Year" value="" />
                    <Picker.Item label="1st Year" value="1st Year" />
                    <Picker.Item label="2nd Year" value="2nd Year" />
                    <Picker.Item label="3rd Year" value="3rd Year" />
                    <Picker.Item label="4th Year" value="4th Year" />
                  </Picker>
                </View>
              </View>

              <View style={styles.pickerWrapper}>
                <Text style={styles.label}>Course</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={course}
                    onValueChange={(itemValue) => setCourse(itemValue)}
                    style={styles.picker}
                  >
                    <Picker.Item label="Select Course" value="" />
                    <Picker.Item label="--- College of Engineering ---" value="label-engineering" enabled={false} />
                    <Picker.Item label="BSCE" value="BSCE" />
                    <Picker.Item label="BSCpE" value="BSCpE" />
                    <Picker.Item label="BSEE" value="BSEE" />
                    <Picker.Item label="BSECE" value="BSECE" />
                    <Picker.Item label="BSME" value="BSME" />
                    <Picker.Item label="BSCS" value="BSCS" />
                    <Picker.Item label="BSIT" value="BSIT" />
                    <Picker.Item label="BSDS" value="BSDS" />
                    <Picker.Item label="--- College of Fine Arts, Architecture and Design ---" value="label-cfad" enabled={false} />
                    <Picker.Item label="BMA" value="BMA" />
                    <Picker.Item label="BSID" value="BSID" />
                    <Picker.Item label="BFA" value="BFA" />
                    <Picker.Item label="BS Architecture" value="BS Architecture" />
                    <Picker.Item label="--- Business Administration ---" value="label-ba" enabled={false} />
                    <Picker.Item label="BS Accountancy" value="BS Accountancy" />
                    <Picker.Item label="BSMA" value="BSMA" />
                    <Picker.Item label="BSBA" value="BSBA" />
                    <Picker.Item label="--- College of Arts and Sciences ---" value="label-cas" enabled={false} />
                    <Picker.Item label="BSC" value="BSC" />
                    <Picker.Item label="BSP" value="BSP" />
                    <Picker.Item label="BSHM" value="BSHM" />
                    <Picker.Item label="BSTM" value="BSTM" />
                  </Picker>
                </View>
              </View>
            </View>
            <TouchableOpacity style={styles.button} onPress={handleSignUp}>
              <Text style={styles.buttonText}>Sign Up</Text>
            </TouchableOpacity>

            <View style={styles.signInContainer}>
              <Text style={styles.alreadyHaveAccount}>
                Already have an account?{' '}
              </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={styles.signIn}>Log in</Text>
              </TouchableOpacity>
            </View>
          </View>

        </KeyboardAvoidingView>
      </View>
    </TouchableWithoutFeedback>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 10,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 20,
    marginBottom: 10,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  input: {
    height: 50,
    borderColor: '#ccc',
    borderWidth: 1,
    paddingHorizontal: 15,
    marginBottom: 10,
    borderRadius: 8,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 20,
    paddingHorizontal: 15,
  },
  passwordInput: {
    flex: 1,
    height: 50,
  },
  toggleText: {
    color: '#007AFF',
    fontWeight: 'bold',
    marginLeft: 10,
  },
  button: {
    backgroundColor: '#FE070C',
    paddingVertical: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  logo: {
    marginTop: 70,
    width: 220,
    height: 220,
    alignSelf: 'center',
  },
  signInContainer: {
    textAlign: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 70,
  },
  alreadyHaveAccount: {
    color: 'black',
  },
  signIn: {
    color: '#FE070C',
    fontWeight: 'bold', 
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  tagRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  tagRowflex: {
    flex: 1,
    margin: 0,
    padding: 0,
  },
  nameInput: {
    flex: 1,
  },
  lastNameInput: {
    marginLeft: 10,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  loadingBox: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
    gap: 10,
  },
  pickerWrapper: {
    flex: 1,
  },
  label: {
    marginBottom: 5,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 5,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
    width: '100%',
    paddingVertical: 0,
  },

});
