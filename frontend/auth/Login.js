import { View, Text, StyleSheet, TextInput, TouchableOpacity, Image, KeyboardAvoidingView, Platform, ActivityIndicator, Alert } from 'react-native';
import React, { useState, useEffect } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import * as SecureStore from 'expo-secure-store';
import { useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios';
import baseUrl from '../assets/common/baseUrl';
import { login, setCurrentUser } from '../Context/Actions/Auth.actions';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import 'expo-dev-client';
import { GOOGLE_SIGNIN_CONFIG, debugGoogleSignIn } from '../google-auth-config';
// Import Firebase items from firebaseConfig correctly
import { auth, googleProvider, signInWithGoogleCredential, saveUserToFirestore, db, saveGoogleUserToFirestore } from '../firebaseConfig';
import { selectAuthState } from '../Context/Selectors/Auth.selectors';
import { verifyCredentials } from '../android-credentials';
import { PACKAGE_NAME, CERTIFICATE_HASH, CERTIFICATE_HASH_WITH_COLONS } from '../android-credentials';
// Import Firestore functions directly since there's an issue with GoogleAuthProvider
import { doc, setDoc } from 'firebase/firestore';

const Login = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { isAuthenticated, user } = useSelector(selectAuthState);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  

  useEffect(() => {
    // Verify and log credentials to help debugging
    verifyCredentials();
    
    // First check if there's an existing configuration
    const checkGoogleConfig = async () => {
      try {
        // Check if already configured to avoid duplicate configs
        await GoogleSignin.signOut().catch(() => {});
        const isSignedIn = await GoogleSignin.isSignedIn();
        console.log('Initial sign-in state:', isSignedIn);
      } catch (error) {
        console.log('Initial check error:', error);
      }
      
      // Now configure Google Sign-In
      GoogleSignin.configure(GOOGLE_SIGNIN_CONFIG);
      
      // Log the configuration
      debugGoogleSignIn();
      
      // Additional debugging info
      console.log('App Package Name:', PACKAGE_NAME);
      console.log('SHA-1 Certificate:', CERTIFICATE_HASH_WITH_COLONS);
      
      // Check existing authentication token
      checkExistingToken();
    };
    
    checkGoogleConfig();
  }, []);

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

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please enter both email and password");
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(`${baseUrl}/auth/login`, {
        email,
        password,
      });

      const { data } = response;
      
      if (!data?.token || !data?.user) {
        throw new Error('Invalid response from server');
      }

      // Store complete user data including role
      await SecureStore.setItemAsync('jwt', data.token);
      await SecureStore.setItemAsync('user', JSON.stringify({
        id: data.user.id || data.user._id,
        email: data.user.email,
        name: data.user.name,
        role: data.user.role, // Explicitly store the role
        firebaseUid: data.user.firebaseUid,
        status: data.user.status,
        userImage: data.user.userImage
      }));
      
      // Also store role separately for easier access
      await SecureStore.setItemAsync('userRole', data.user.role || 'user');
      
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

  const onGoogleButtonPress = async () => {
    if (loading) return;
    setLoading(true);

    try {
      console.log('1. Checking Play Services...');
      await GoogleSignin.hasPlayServices({
        showPlayServicesUpdateDialog: true
      });
      console.log('Play Services check passed');

      console.log('2. Signing out from any previous session...');
      await GoogleSignin.signOut().catch(() => {
        console.log('No previous session to clear');
      });

      console.log('3. Starting Google Sign-In...');
      try {
        const response = await GoogleSignin.signIn();
        console.log('4. Raw sign-in response:', JSON.stringify(response, null, 2));
        
        // Extract user data from response
        let userData = null;
        let idToken = null;
        
        if (response.data && response.data.user) {
          // New format with data property
          userData = response.data.user;
          idToken = response.data.idToken;
        } else if (response.user) {
          // Old format with direct user property
          userData = response.user;
          idToken = response.idToken;
        } else {
          console.error('Unexpected response format:', response);
          throw new Error('Unrecognized response format from Google Sign-In');
        }
        
        console.log('5. Extracted user data:', userData.email);
        
        // First, save to Firebase/Firestore
        try {
          const uid = userData.id || `google_${userData.email.replace(/[.@]/g, '_')}`;
          console.log('6. Using Firebase UID:', uid);
          
          try {
            const userRef = doc(db, "users", uid);
            await setDoc(userRef, {
              email: userData.email,
              displayName: userData.name || userData.givenName || 'Google User',
              photoURL: userData.photo || null,
              uid: uid,
              provider: 'google',
              lastLogin: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              createdAt: new Date().toISOString()
            }, { merge: true });
            console.log('7. Successfully saved to Firestore ✅');
          } catch (firestoreError) {
            console.error('Non-critical Firestore error:', firestoreError);
          }
          
          // Now directly call the backend to save the user in MongoDB
          console.log('8. Directly calling /auth/google-login endpoint...');
          try {
            const googleLoginResponse = await axios.post(`${baseUrl}/auth/google-login`, {
              user: {
                email: userData.email,
                name: userData.name || userData.givenName || 'Google User',
                photo: userData.photo || null,
                googleId: userData.id,
                uid: uid
              }
            });
            
            if (googleLoginResponse.data?.user && googleLoginResponse.data?.token) {
              console.log('9. Successfully saved to MongoDB and got token ✅');
              await processSuccessfulLogin(googleLoginResponse.data, userData, uid);
              return;
            }
          } catch (mongodbError) {
            console.error('MongoDB save error:', mongodbError);
            
            // Try sync-user endpoint as another approach
            try {
              console.log('10. Trying sync-user endpoint...');
              const syncResponse = await axios.post(`${baseUrl}/auth/sync-user`, {
                email: userData.email,
                name: userData.name || userData.givenName || 'Google User',
                photo: userData.photo,
                uid: uid,
                googleId: userData.id
              });
              
              if (syncResponse.data?.user && syncResponse.data?.token) {
                console.log('11. Sync successful ✅');
                await processSuccessfulLogin(syncResponse.data, userData, uid);
                return;
              }
            } catch (syncError) {
              console.error('Sync error:', syncError);
              
              // Fall back to register endpoint as last resort
              try {
                console.log('12. Trying register endpoint...');
                const registerResponse = await axios.post(`${baseUrl}/auth/signup`, {
                  email: userData.email,
                  name: userData.name || userData.givenName || 'Google User',
                  password: `Google_${Math.random().toString(36).substring(7)}`,
                  googleAuth: true,
                  firebaseUid: uid,
                  googleId: userData.id,
                  photo: userData.photo
                });
                
                if (registerResponse.data?.user) {
                  console.log('13. Registration successful ✅');
                  await processSuccessfulLogin(registerResponse.data, userData, uid);
                  return;
                }
              } catch (registerError) {
                console.error('Registration error:', registerError);
                createLocalSession(userData);
              }
            }
          }
        } catch (error) {
          console.error('Authentication error:', error);
          createLocalSession(userData);
        }
      } catch (signInError) {
        console.error('Google Sign-In error:', signInError);
        Alert.alert(
          'Sign-In Error',
          'We encountered an issue with Google Sign-In. Please try again later or use email login.'
        );
      }
    } catch (error) {
      console.error('Google Sign-In Error:', {
        code: error.code,
        message: error.message,
        stack: error.stack
      });
      
      let errorMessage = 'Failed to sign in with Google';
      
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        errorMessage = 'You cancelled the sign in';
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        errorMessage = 'Google Play Services are not available on this device';
      } else if (error.code === statusCodes.DEVELOPER_ERROR || error.code === '10') {
        errorMessage = 'Google Sign-In configuration error';
        // Log detailed debug information
        console.error(`
          DEVELOPER_ERROR detected. Please verify:
          1. Package name in Firebase: ${PACKAGE_NAME}
          2. SHA-1 in Firebase: ${CERTIFICATE_HASH_WITH_COLONS}
          3. Google Sign-In is enabled in Firebase Console > Authentication
          4. The google-services.json is up to date and in the correct location
          5. WebClientId is correct: ${GOOGLE_SIGNIN_CONFIG.webClientId}
        `);
      }
      
      Alert.alert('Sign-In Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };
  
  // Helper function to create a local session
  const createLocalSession = async (userData) => {
    Alert.alert(
      'Authentication Issue',
      'We were able to verify your Google account, but couldn\'t connect to our servers. Would you like to continue with limited functionality?',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Continue',
          onPress: async () => {
            const localUser = {
              id: userData.id || `google_${userData.email.replace(/[.@]/g, '_')}`,
              email: userData.email,
              name: userData.name || userData.givenName || 'Google User',
              photo: userData.photo,
              role: 'user',
              isLocalOnly: true
            };
            
            await SecureStore.setItemAsync('localUser', JSON.stringify(localUser));
            
            dispatch(login({
              user: localUser,
              isLocalOnly: true
            }));
            
            // Also store a flag that we need to sync this user when connection is restored
            await SecureStore.setItemAsync('needsSync', 'true');
            
            navigation.reset({
              index: 0,
              routes: [{ name: 'Home' }],
            });
          }
        }
      ]
    );
  };

  // Helper function to process successful login
  const processSuccessfulLogin = async (serverData, userData, firebaseUid = null) => {
    // Save credentials to secure storage
    await SecureStore.setItemAsync('jwt', serverData.token);
    
    // Create combined user object with both MongoDB and Firebase data
    const combinedUser = {
      id: serverData.user.id,
      email: userData.email,
      name: userData.name || userData.givenName || 'Google User',
      photo: userData.photo,
      role: serverData.user.role || 'user',
      firebaseUid: firebaseUid || userData.id,
      googleId: userData.id
    };
    
    // Save the combined user object
    await SecureStore.setItemAsync('user', JSON.stringify(combinedUser));
    
    // Also store role separately for easier access
    await SecureStore.setItemAsync('userRole', serverData.user.role || 'user');
    
    // Set default auth header for future requests
    axios.defaults.headers.common['Authorization'] = `Bearer ${serverData.token}`;
    
    // Update Redux state
    dispatch(login({
      user: combinedUser,
      token: serverData.token
    }));
    
    // Navigate to home screen
    navigation.reset({
      index: 0,
      routes: [{ name: 'Home' }],
    });
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
      <View style={styles.orContainer}>
        <View style={styles.divider} />
        <Text style={styles.orText}>Or</Text>
        <View style={styles.divider} />
      </View>
      <TouchableOpacity 
        style={styles.googleButton}
        onPress={onGoogleButtonPress}
        disabled={loading}
      >
        <Image 
          source={require('../assets/logo.png')} 
          style={styles.googleIcon} 
        />
        <Text style={styles.googleButtonText}>Sign in with Google</Text>
      </TouchableOpacity>
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
  orContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  orText: {
    marginHorizontal: 10,
    color: '#666',
  },
  googleButton: {
    flexDirection: 'row',
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  googleIcon: {
    width: 24,
    height: 24,
    marginRight: 10,
  },
  googleButtonText: {
    color: '#666',
    fontWeight: 'bold',
    fontSize: 16,
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