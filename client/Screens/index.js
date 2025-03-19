import { View, Text, StyleSheet, Image, TouchableOpacity, StatusBar, Dimensions } from 'react-native';
import React from 'react';
import { useNavigation } from '@react-navigation/native';

const WelcomeScreen = () => {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0a2d5a" />
      
      {/* Background Design Elements */}
      <View style={styles.topCircle} />
      <View style={styles.bottomCircle} />
      
      {/* Logo and Brand */}
      <View style={styles.brandContainer}>
        <Image
          source={require('../assets/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.brandName}>ShoeSpot</Text>
        <Text style={styles.tagline}>Step into your Style</Text>
      </View>
      
      {/* Welcome Message */}
      <View style={styles.welcomeContainer}>
        <Text style={styles.welcomeTitle}>Find Your Perfect Fit</Text>
        <Text style={styles.welcomeText}>
          Discover the latest trends in footwear, from casual comfort to professional elegance.
          All your favorite brands in one spot.
        </Text>
      </View>
      
      {/* Auth Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={styles.loginButton}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.loginButtonText}>Login</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.signupButton}
          onPress={() => navigation.navigate('SignUp')}
        >
          <Text style={styles.signupButtonText}>Sign Up</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.guestButton}
          onPress={() => navigation.navigate('Home')}
        >
          <Text style={styles.guestButtonText}>Continue as Guest</Text>
        </TouchableOpacity>
      </View>
      
      {/* Version Info */}
      <Text style={styles.versionText}>©2025 ShoeSpot. All rights reserved.</Text>
    </View>
  );
};

export default WelcomeScreen;

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f6ff',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 60,
    paddingHorizontal: 24,
    overflow: 'hidden',
  },
  topCircle: {
    position: 'absolute',
    width: width * 1.5,
    height: width * 1.5,
    borderRadius: width * 0.75,
    backgroundColor: '#1a56a4',
    top: -width * 1.2,
    opacity: 0.8,
  },
  bottomCircle: {
    position: 'absolute',
    width: width * 1,
    height: width * 1,
    borderRadius: width * 0.5,
    backgroundColor: '#3678de',
    bottom: -width * 0.5,
    right: -width * 0.3,
    opacity: 0.3,
  },
  brandContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 16,
  },
  brandName: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#1a56a4',
    letterSpacing: 1,
  },
  tagline: {
    fontSize: 18,
    color: '#3678de',
    marginTop: 8,
    fontStyle: 'italic',
  },
  welcomeContainer: {
    alignItems: 'center',
    marginVertical: 20,
    paddingHorizontal: 20,
  },
  welcomeTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#0a2d5a',
    marginBottom: 12,
    textAlign: 'center',
  },
  welcomeText: {
    fontSize: 16,
    color: '#555',
    textAlign: 'center',
    lineHeight: 24,
  },
  buttonContainer: {
    width: '100%',
    marginBottom: 20,
  },
  loginButton: {
    backgroundColor: '#1a56a4',
    paddingVertical: 15,
    borderRadius: 30,
    width: '100%',
    alignItems: 'center',
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  loginButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  signupButton: {
    backgroundColor: '#d9e6ff',
    paddingVertical: 15,
    borderRadius: 30,
    width: '100%',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#1a56a4',
  },
  signupButtonText: {
    color: '#1a56a4',
    fontSize: 18,
    fontWeight: 'bold',
  },
  guestButton: {
    paddingVertical: 10,
  },
  guestButtonText: {
    color: '#3678de',
    fontSize: 16,
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
  versionText: {
    fontSize: 12,
    color: '#888',
    position: 'absolute',
    bottom: 20,
  },
});