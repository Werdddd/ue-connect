import React, { useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, View, TextInput, TouchableOpacity, KeyboardAvoidingView, Keyboard, TouchableWithoutFeedback, Platform, ActivityIndicator, } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { loginUser } from '../Backend/login';
import { Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Login() {
  const [studentNumber, setStudentNumber] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    const studentNumberRegex = /^[0-9]{11}$/;
    const ueEmailRegex = /^[a-zA-Z0-9._%+-]+@ue\.edu\.ph$/;

    //Input validation
    // if (!studentNumber.match(studentNumberRegex)) {
    //   Alert.alert('Invalid Input', 'Student number must be exactly 11 digits.');
    //   return;
    // }

    if (!email.match(ueEmailRegex)) {
      Alert.alert('Invalid Input', 'Use a valid UE email address.');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Invalid Input', 'Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);

    const { success, user, error } = await loginUser({ email, password });

    setLoading(false);

    if (success) {
      navigation.navigate('Home');
    } else {
      console.error("Error logging in: ", error);
      Alert.alert(
        'Login Error',
        error.message || 'Something went wrong. Please try again.',
        [{ text: 'I Understand' }]
      );
    }
  };



  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
        >
          {loading && (
            <View style={styles.loadingContainer}>
              <View style={styles.loadingBox}>
                <ActivityIndicator size="large" color="#FE070C" />
                <Text style={{ marginTop: 10 }}>Logging your account...</Text>
              </View>
            </View>
          )}

          <View
            keyboardShouldPersistTaps="handled"
          >
            <Image source={require('../assets/logo.png')} style={styles.logo} />
            <Text style={styles.title}>Login to your Account</Text>

            {/* <TextInput
              style={styles.input}
              placeholder="Student Number"
              value={studentNumber}
              onChangeText={setStudentNumber}
              keyboardType="numeric"
            /> */}
            <Text style={styles.label} >UE Email Address</Text>
            <TextInput
              style={styles.input}
              placeholder="UE Email Address"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <Text style={styles.label} >Password</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Text style={styles.toggleText}>{showPassword ? 'Hide' : 'Show'}</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity onPress={() => console.log('Forgot Password pressed')}>
              <Text style={styles.forgotPassword}>Forgot Password?</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.button} onPress={handleLogin}>
              <Text style={styles.buttonText}>Login</Text>
            </TouchableOpacity>

            <View style={styles.signUpContainer}>
              <Text style={styles.dontHaveAccount}>Don't have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
                <Text style={styles.signUp}>Sign up</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 10,
    backgroundColor: '#fff',
    minHeight: '100%',
  },
  title: {
    fontSize: 20,
    marginBottom: 40,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  input: {
    height: 50,
    borderColor: '#ccc',
    borderWidth: 1,
    paddingHorizontal: 15,
    marginBottom: 20,
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
    marginTop: 20,
    backgroundColor: '#FE070C',
    paddingVertical: 15,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  logo: {
    width: 220,
    height: 220,
    marginBottom: 10,
    alignSelf: 'center',
    marginTop: 70,
  },
  forgotPassword: {
    textAlign: 'right',
    color: '#FE070C',
    fontWeight: 'bold',
    fontSize: 15,
  },
  signUpContainer: {
    marginTop: 10,
    textAlign: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  dontHaveAccount: {
    marginTop: 20,
    color: 'black',
  },
  signUp: {
    marginTop: 20,
    color: '#FE070C',
    fontWeight: 'bold',
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
  label: {
    marginBottom: 5,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 5,
  },
});
