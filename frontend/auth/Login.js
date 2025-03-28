import { View, Text, StyleSheet, TextInput, TouchableOpacity, Image, KeyboardAvoidingView, Platform, ActivityIndicator, Alert } from 'react-native';
import React, { useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import jwtDecode from 'jwt-decode';
import { useNavigation } from '@react-navigation/native';
import { useDispatch } from 'react-redux';
import baseUrl from '../assets/common/baseUrl';
import { login } from '../Context/Actions/Auth.actions';

const Login = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please enter both email and password");
      return;
    }

    setLoading(true);

    try {
      console.log(`Sending login request to: ${baseUrl}/auth/login`);

      const response = await fetch(`${baseUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          email: email,
          password: password,
        }),
      });

      // Better error handling - similar to your SignUp.js
    const contentType = response.headers.get("content-type");
    console.log(`Login response status: ${response.status}, Content-Type: ${contentType}`);
    
    // Get response as text first
    const responseText = await response.text();
    
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (error) {
      console.error('Response is not valid JSON:', responseText.substring(0, 200));
      throw new Error(`Server returned invalid JSON. Status: ${response.status}`);
    }
      
      if (!response.ok) {
        throw new Error(data.message || 'Invalid credentials');
      }

      console.log('Login successful, saving token and user data');

      // Store JWT token in SecureStore
    if (data.token) {
      await SecureStore.setItemAsync('jwt', data.token);
      console.log('JWT token stored in SecureStore');
    }
    
    // Store Firebase token if available
    if (data.firebaseToken) {
      await SecureStore.setItemAsync('firebaseToken', data.firebaseToken);
      console.log('Firebase token stored in SecureStore');
    }
      // Dispatch login action to Redux
      dispatch(login(data.user));


      // Navigate to home screen
      navigation.navigate('Home');
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert("Login Failed", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === "android" ? "padding" : "height"}
    >
      <View style={styles.logoContainer}>
        <Image
          source={require('../assets/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.title}>Welcome Back</Text>
      </View>
      
      <View style={styles.formContainer}>
        <TextInput
          style={styles.input}
          placeholder="Email Address"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        
        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        
        <TouchableOpacity style={styles.forgotPassword}>
          <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
          <Text style={styles.loginButtonText}>Login</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.footer}>
        <Text style={styles.footerText}>Don't have an account? </Text>
        <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
          <Text style={styles.signupText}>Sign Up</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f6ff',
    padding: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 40,
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a56a4',
  },
  formContainer: {
    marginBottom: 30,
  },
  input: {
    backgroundColor: 'white',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 10,
    marginBottom: 15,
    fontSize: 16,
    borderColor: '#d9e6ff',
    borderWidth: 1,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 20,
  },
  forgotPasswordText: {
    color: '#3678de',
    fontSize: 14,
  },
  loginButton: {
    backgroundColor: '#1a56a4',
    padding: 15,
    borderRadius: 30,
    alignItems: 'center',
  },
  loginButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  footerText: {
    color: '#555',
    fontSize: 16,
  },
  signupText: {
    color: '#1a56a4',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default Login;