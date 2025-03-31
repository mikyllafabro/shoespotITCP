import { View, Text, StyleSheet, TextInput, TouchableOpacity, Image, KeyboardAvoidingView, Platform, ActivityIndicator, Alert } from 'react-native';
import React, { useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import jwtDecode from 'jwt-decode';
import { useNavigation } from '@react-navigation/native';
import { useDispatch } from 'react-redux';
import axios from 'axios';
import baseUrl from '../assets/common/baseUrl';
import { login, setCurrentUser } from '../Context/Actions/Auth.actions';

const Login = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  

  useEffect(() => {
    const checkExistingToken = async () => {
      try {
        const token = await SecureStore.getItemAsync('jwt');
        const userData = await SecureStore.getItemAsync('user');
        
        if (token && userData) {
          const user = JSON.parse(userData);
          console.log('Found existing token and user data');
          
          // Update Redux state with cached credentials
          dispatch(login(user));
          dispatch(setCurrentUser({
            user: user,
            token: token,
            isAuthenticated: true
          }));
        }
      } catch (error) {
        console.error('Error checking stored credentials:', error);
      }
    };
    
    checkExistingToken();
  }, [dispatch]);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please enter both email and password");
      return;
    }

    setLoading(true);

    try {
      const endpoint = `${baseUrl}/auth/login`;
      console.log(`Sending login request to: ${endpoint}`);

      const response = await axios.post(endpoint, {
        email: email,
        password: password,
      });

      const data = response.data;
      console.log('Login response:', data);

      if (!data || !data.token || !data.user) {
        throw new Error('Invalid response from server');
      }

      // Store user data with consistent key
      await SecureStore.setItemAsync('jwt', data.token);
      await SecureStore.setItemAsync('user', JSON.stringify({
        id: data.user.id || data.user._id,
        email: data.user.email,
        name: data.user.name,
        role: data.user.role,
        firebaseUid: data.user.firebaseUid,
        status: data.user.status,
        userImage: data.user.userImage
      }));
      
      // Set Authorization header
      axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
      
      // Dispatch login with complete user data
      const userData = {
        user: data.user,
        token: data.token
      };
      
      dispatch(login(userData));
      dispatch(setCurrentUser(userData));
      
      navigation.reset({
        index: 0,
        routes: [{ name: 'Home' }],
      });
      
    } catch (error) {
      console.error('Login error:', error);
      let errorMessage = 'Login failed';
      
      if (error.response) {
        errorMessage = error.response.data?.message || `Server error: ${error.response.status}`;
        console.log('Error response data:', error.response.data);
      } else if (error.request) {
        errorMessage = 'No response from server. Please check your connection.';
      } else {
        errorMessage = error.message;
      }
      
      Alert.alert("Login Failed", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === "android" ? "padding" : null}
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
          testID="email-input"
        />
        
        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          testID="password-input"
        />
        
        <TouchableOpacity 
          style={styles.loginButton} 
          onPress={handleLogin}
          disabled={loading}
          testID="login-button"
        >
          {loading ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
          <Text style={styles.loginButtonText}>Login</Text>
          )}
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