import React, { useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, View, TextInput, TouchableOpacity, SafeAreaView, KeyboardAvoidingView, Keyboard, TouchableWithoutFeedback, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { auth } from '../Firebase';
import { signInWithEmailAndPassword } from "firebase/auth";
import { Alert } from 'react-native';

export default function Login() {
  const [studentNumber, setStudentNumber] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigation = useNavigation();  

  const handleLogin = async () => {

    try {

        await createUserWithEmailAndPassword(auth, email, password);
        navigation.navigate('Home');

        } catch (error) {

        console.error("Error writing document: ", error);

        Alert.alert(
                    'Login Error',
                    error, 
                    [
                      { text: 'I Understand' }
                    ]
                  );

        }

  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.container}
        >
          <View
            keyboardShouldPersistTaps="handled"
          >
            <Image source={require('../assets/logo.png')} style={styles.logo} />
            <Text style={styles.title}>Login to your Account</Text>

            <TextInput
              style={styles.input}
              placeholder="Student Number"
              value={studentNumber}
              onChangeText={setStudentNumber}
              keyboardType="numeric"
            />

            <TextInput
              style={styles.input}
              placeholder="UE Email Address"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />

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
        </KeyboardAvoidingView>
      </SafeAreaView>
    </TouchableWithoutFeedback>
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
});
