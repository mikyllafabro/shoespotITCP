import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Alert,
  Image, 
  ActivityIndicator,
} from 'react-native';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
// import { useAuth } from '../../Context/Actions/AuthContext';
import { logout } from '../../Context/Actions/Auth.actions';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import axios from 'axios';
import baseUrl from '../../assets/common/baseUrl';

const Sidebar = ({ closeSidebar }) => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  // const { signOut } = useAuth();
  const { user, isAuthenticated } = useSelector(state => state.auth || { user: null, isAuthenticated: false });

  // State for profile image
  const [userImage, setProfileImage] = useState(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [imageError, setImageError] = useState(false);

  const navigateTo = (screen) => {
    // Close sidebar first
    if (closeSidebar) {
      closeSidebar();
    }
    
    try {
      navigation.navigate(screen);
    } catch (error) {
      console.error(`Navigation error to ${screen}:`, error);
      Alert.alert("Navigation Error", `Could not navigate to ${screen}`);
    }
  };
  
  const handleLogout = () => {
    // Close sidebar
    if (closeSidebar) {
      closeSidebar();
    }
    
    // Show confirmation dialog
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Logout", 
          style: "destructive",
          onPress: async () => {
            try {
              await SecureStore.deleteItemAsync('jwt');
              await SecureStore.deleteItemAsync('user');


              // Clear auth header if using axios
              if (global.axios) {
                delete global.axios.defaults.headers.common['Authorization'];
              }
              
              console.log("Dispatching logout action");
              // Dispatch logout action to Redux
              dispatch(logout());
              
              // Use CommonActions to reset to Welcome screen
              // Fix: Check which screen name is actually registered in your navigator
              navigation.dispatch(
                CommonActions.reset({
                  index: 0,
                  routes: [{ name: 'Welcome' }], // Changed from 'WelcomeScreen' to 'Welcome'
                })
              );
            } catch (error) {
              console.error('Logout error:', error);
              
              // Even if there's an error with the signOut function,
              // try to navigate the user away
              try {
                // Try a simple navigation if reset fails
                navigation.navigate('Welcome');
              } catch (navError) {
                Alert.alert('Error', 'Failed to logout and navigate');
              }
            }
          }
        }
      ]
    );
  };

  // If the user clicks "Sign In" when not authenticated
  const handleAuth = () => {
    if (!isAuthenticated) {
      closeSidebar && closeSidebar();
      
      // Navigate to Login instead of trying to log out
      navigation.navigate('Login');
    } else {
      // Handle logout for authenticated users
      handleLogout();
    }
  };

  // Fetch user profile image
  useEffect(() => {
    const fetchUserImage = async () => {
      if (!user?._id) return;
      
      setImageLoading(true);
      setImageError(false);
      
      try {
        // Get JWT token for authentication
        const token = await SecureStore.getItemAsync('jwt');
        
        if (!token) {
          console.log('No token available to fetch user image');
          setImageError(true);
          setImageLoading(false);
          return;
        }
        
        // Set up headers with authorization token
        const config = {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        };
        
        // Use the user's ID to get their profile data including image
        // Using the '/users' route as specified
        console.log(`Fetching user image from: ${baseUrl}/me`);
        const response = await axios.get(`${baseUrl}/me`, {
          headers: {
              Authorization: `Bearer ${token}`, // Ensure token is sent for authentication
          },
        });
        
        console.log('User image response:', response.data);
        
        if (response.data && response.data.image) {
          // If user has an image URL in their data
          setProfileImage(response.data.image);
        } else if (response.data && response.data.userImage) {
          // Alternative field name
          setProfileImage(response.data.userImage);
        } else if (user.userImage) {
          // Fallback to what might be in Redux state already
          setProfileImage(user.userImage);
        } else {
          // If no image is found, clear the image
          setProfileImage(null);
        }
      } catch (error) {
        console.log('Error fetching user image:', error);
        setImageError(true);
        
        // Try to use any image URL that might be in the user object from Redux
        if (user.userImage) {
          setProfileImage(user.userImage);
        } else if (user.image) {
          setProfileImage(user.image);
        } else {
          setProfileImage(null);
        }
      } finally {
        setImageLoading(false);
      }
    };
    
    if (isAuthenticated && user) {
      fetchUserImage();
    } else {
      // Clear profile image when not authenticated
      setProfileImage(null);
    }
  }, [user, isAuthenticated]);

  return (
    <View style={styles.container}>
      {/* User Profile Section */}
      <View style={styles.userSection}>
        {/* FIX: Changed userImageContainer to profileImageContainer to match styles */}
        <View style={styles.userImageContainer}>
          {isAuthenticated && imageLoading ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : userImage ? (
            <Image 
              source={{ uri: userImage }} 
              style={styles.userImage}
              onError={() => {
                console.log("Image failed to load:", userImage);
                setImageError(true);
                setProfileImage(null);
              }}
            />
          ) : (
            <Text style={styles.profileInitial}>
              {user?.name ? user.name[0].toUpperCase() : '?'}
            </Text>
          )}
        </View>
        <Text style={styles.userName}>{user?.name || 'Guest User'}</Text>
        <Text style={styles.userEmail}>{user?.email || 'Sign in to access account'}</Text>
      </View>
      
      {/* Navigation Menu */}
      <ScrollView style={styles.menuContainer}>
        <TouchableOpacity style={styles.menuItem} onPress={() => navigateTo('Home')}>
          <Ionicons name="home-outline" size={24} color="#1a56a4" />
          <Text style={styles.menuText}>Home</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.menuItem} onPress={() => navigateTo('Profile')}>
          <Ionicons name="person-outline" size={24} color="#1a56a4" />
          <Text style={styles.menuText}>Profile</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.menuItem} onPress={() => navigateTo('Orders')}>
          <Ionicons name="receipt-outline" size={24} color="#1a56a4" />
          <Text style={styles.menuText}>My Orders</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.menuItem} onPress={() => navigateTo('Wishlist')}>
          <Ionicons name="heart-outline" size={24} color="#1a56a4" />
          <Text style={styles.menuText}>Wishlist</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.menuItem} onPress={() => navigateTo('Transactions')}>
          <Ionicons name="card-outline" size={24} color="#1a56a4" />
          <Text style={styles.menuText}>Transactions</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.menuItem} onPress={() => navigateTo('Notifications')}>
          <Ionicons name="notifications-outline" size={24} color="#1a56a4" />
          <Text style={styles.menuText}>Notifications</Text>
        </TouchableOpacity>
        
        <View style={styles.divider} />
        
        <TouchableOpacity style={styles.menuItem} onPress={() => navigateTo('Settings')}>
          <Ionicons name="settings-outline" size={24} color="#1a56a4" />
          <Text style={styles.menuText}>Settings</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.menuItem} onPress={() => navigateTo('Help')}>
          <Ionicons name="help-circle-outline" size={24} color="#1a56a4" />
          <Text style={styles.menuText}>Help & Support</Text>
        </TouchableOpacity>

        {/* Use handleAuth to determine whether to show login or logout */}
        <TouchableOpacity style={[styles.menuItem, styles.logoutButton]} onPress={handleAuth}>
          <Ionicons 
            name={isAuthenticated ? "log-out-outline" : "log-in-outline"} 
            size={24} 
            color={isAuthenticated ? "#e53935" : "#1a56a4"} 
          />
          <Text style={[
            styles.menuText, 
            isAuthenticated ? styles.logoutText : null
          ]}>
            {isAuthenticated ? "Logout" : "Sign In"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
      
      <View style={styles.versionContainer}>
        <Text style={styles.versionText}>ShoeSpot v1.0.0</Text>
      </View>
    </View>
  );
};

// Styles remain unchanged
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  userSection: {
    padding: 16,
    backgroundColor: '#1a56a4',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 50 : 24,
    paddingBottom: 20,
  },
  userImageContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  userImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  profileInitial: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#1a56a4',
  },
  userName: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  userEmail: {
    color: '#d9e6ff',
    fontSize: 14,
    marginTop: 4,
  },
  menuContainer: {
    flex: 1,
    padding: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 4,
  },
  menuText: {
    fontSize: 16,
    marginLeft: 20,
    color: '#333',
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 12,
  },
  logoutButton: {
    marginTop: 16,
  },
  logoutText: {
    color: '#e53935',
  },
  versionContainer: {
    padding: 16,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#eeeeee',
  },
  versionText: {
    fontSize: 12,
    color: '#999',
  }
});

export default Sidebar;