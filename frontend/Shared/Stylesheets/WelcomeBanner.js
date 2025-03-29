import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSelector } from 'react-redux';
export const getAuthState = (state) => state.auth || { user: null, isAuthenticated: false };

const WelcomeBanner = () => {
    const { user, isAuthenticated } = useSelector(state => state.auth || { user: null, isAuthenticated: false });
    // Add debug logging to see what's in the Redux store
    console.log("Auth state in WelcomeBanner:", { user, isAuthenticated });
    
  if (!isAuthenticated) return null;
  
  return (
    <View style={styles.welcomeContainer}>
      <Text style={styles.welcomeText}>Welcome back, {user?.fullname || 'Shopper'}!</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  welcomeContainer: {
    backgroundColor: '#e0eaff',
    padding: 10,
    paddingHorizontal: 16,
  },
  welcomeText: {
    fontSize: 14,
    color: '#1a56a4',
  }
});

export default WelcomeBanner;