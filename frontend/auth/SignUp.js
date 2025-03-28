import { View, Text, StyleSheet, TextInput, TouchableOpacity, Image, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Alert } from 'react-native';
import React, { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { useDispatch } from 'react-redux';
import * as ImagePicker from 'expo-image-picker';
import baseUrl from '../assets/common/baseUrl';
import { registerSuccess } from '../Context/Actions/Auth.actions';

const SignUp = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [loading, setLoading] = useState(false); // Add loading state
  const [userImage, setUserImage] = useState(null);

  const showImageSourceOptions = () => {
    Alert.alert(
      "Select Profile Picture",
      "Choose an image source",
      [
        { 
          text: "Take Photo", 
          onPress: takePicture 
        },
        { 
          text: "Choose from Gallery", 
          onPress: pickImage 
        },
        { 
          text: "Cancel", 
          style: "cancel" 
        }
      ]
    );
  };

  // Function to pick image from gallery
  const pickImage = async () => {
    try {
      // Request permission
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'We need camera roll permissions to upload a profile picture.');
        return;
      }
      
      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });
      
      if (!result.canceled) {
        setUserImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to select image');
    }
  };

  // Function to take picture with camera
  const takePicture = async () => {
    try {
      // Request camera permission
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'We need camera permissions to take a profile picture.');
        return;
      }
      
      // Launch camera
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });
      
      if (!result.canceled) {
        setUserImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error taking picture:', error);
      Alert.alert('Error', 'Failed to take picture');
    }
  };

  const handleSignUp = async () => {
    // Basic form validation
    if (!name || !email || !password || !confirmPassword) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }
    
    if (password !== confirmPassword) {
      setPasswordError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      let cloudinaryUrl = null;
      let cloudinaryId = null;

      if (userImage) {
        // Create form data for image upload
        const formData = new FormData();
        formData.append('image', {
          uri: userImage,
          type: 'image/jpeg',  // Adjust based on your image type
          name: 'profile.jpg'
        });

      console.log("Uploading image to Cloudinary...");

      const uploadResponse = await fetch(`${baseUrl}/auth/upload-avatar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'multipart/form-data',
          'Accept': 'application/json'
        },
        body: formData
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload profile image');
      }

      const uploadResult = await uploadResponse.json();
      cloudinaryUrl = uploadResult.secure_url;
      cloudinaryId = uploadResult.public_id;
      
      console.log("Image uploaded successfully:", cloudinaryUrl);
    }
      console.log(`Sending request to: ${baseUrl}/auth/signup`);

      const response = await fetch(`${baseUrl}/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          name: name,
          email: email,
          password: password,
          userImage: cloudinaryUrl,
          cloudinary_id: cloudinaryId,
        }),
      });

      // Before parsing JSON, check the content type of the response
      const contentType = response.headers.get("content-type");
      
      // For debugging - log the response status and content type
      console.log(`Response status: ${response.status}, Content-Type: ${contentType}`);
      
      // Get response as text first to handle potential non-JSON responses
      const responseText = await response.text();

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (error) {
        console.error('Response is not valid JSON:', responseText.substring(0, 200));
        throw new Error(`Server returned invalid JSON. Status: ${response.status}`);
      }

      if (!response.ok) {
        throw new Error(data.message || 'Something went wrong');
      }

      // Dispatch to Redux store on successful registration
      dispatch(registerSuccess(data.user));
      
      // Registration successful
      Alert.alert(
        "Success", 
        "Account created successfully!",
        [{ text: "Login Now", onPress: () => navigation.navigate('Login') }]
      );
    } catch (error) {
      console.error('Registration error:', error);
      Alert.alert("Registration Failed", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === "android" ? "padding" : null}
      keyboardVerticalOffset={Platform.OS === "android" ? 64 : 0}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.logoContainer}>
          <Image
            source={require('../assets/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.title}>Create Account</Text>
        </View>

        {/* Updated profile image picker */}
        <View style={styles.profileImageContainer}>
          <TouchableOpacity onPress={showImageSourceOptions} style={styles.imagePickerButton}>
            {userImage ? (
              <Image source={{ uri: userImage }} style={styles.profileImage} />
            ) : (
              <View style={styles.placeholderContainer}>
                <Text style={styles.placeholderText}>Add Photo</Text>
              </View>
            )}
          </TouchableOpacity>
          <Text style={styles.imageHelpText}>Tap to take or select profile picture</Text>
        </View>
        
        <View style={styles.formContainer}>
          <TextInput
            style={styles.input}
            placeholder="Full Name"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
          />
          
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
            onChangeText={(text) => {
              setPassword(text);
              setPasswordError('');
            }}
            secureTextEntry
          />
          
          <TextInput
            style={[styles.input, passwordError ? styles.inputError : null]}
            placeholder="Confirm Password"
            value={confirmPassword}
            onChangeText={(text) => {
              setConfirmPassword(text);
              setPasswordError('');
            }}
            secureTextEntry
          />
          
          {passwordError ? (
            <Text style={styles.errorText}>{passwordError}</Text>
          ) : null}
          
          <TouchableOpacity 
            style={styles.signupButton} 
            onPress={handleSignUp}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.signupButtonText}>Create Account</Text>
            )}
          </TouchableOpacity>
        </View>
        
        <View style={styles.termsContainer}>
          <Text style={styles.termsText}>
            By signing up, you agree to our{' '}
            <Text style={styles.termsLink}>Terms of Service</Text> and{' '}
            <Text style={styles.termsLink}>Privacy Policy</Text>
          </Text>
        </View>
        
        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.loginText}>Login</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
    marginTop: 20,
    marginBottom: 30,
  },
  logo: {
    width: 70,
    height: 70,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a56a4',
  },
  profileImageContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  imagePickerButton: {
    width: 100,
    height: 100,
    borderRadius: 50,
    overflow: 'hidden',
    backgroundColor: '#e0eaff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  placeholderContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: '#1a56a4',
    fontSize: 14,
    fontWeight: '500',
  },
  imageHelpText: {
    color: '#666',
    fontSize: 12,
  },
  formContainer: {
    marginBottom: 20,
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
  inputError: {
    borderColor: '#ff3b30',
  },
  errorText: {
    color: '#ff3b30',
    fontSize: 14,
    marginBottom: 15,
    marginTop: -10,
    paddingHorizontal: 5,
  },
  signupButton: {
    backgroundColor: '#1a56a4',
    padding: 15,
    borderRadius: 30,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  signupButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18,
  },
  termsContainer: {
    marginVertical: 20,
  },
  termsText: {
    color: '#555',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  termsLink: {
    color: '#3678de',
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10,
    marginBottom: 30,
  },
  footerText: {
    color: '#555',
    fontSize: 16,
  },
  loginText: {
    color: '#1a56a4',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default SignUp;