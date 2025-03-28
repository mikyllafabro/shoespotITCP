import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Alert,
  Image
} from 'react-native';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { useAuth } from '../../Context/Actions/AuthContext'; // Fix this import path
import { Ionicons } from '@expo/vector-icons';

const Sidebar = ({ closeSidebar }) => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { signOut } = useAuth();
  const { user, isAuthenticated } = useSelector(state => state.auth || { user: null, isAuthenticated: false });

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
                // Perform logout through auth context
                if (signOut) {
                  await signOut();
                }
                
                // Use CommonActions to ensure this works across navigators
                navigation.dispatch(
                  CommonActions.reset({
                    index: 0,
                    routes: [{ name: 'WelcomeScreen' }],
                  })
                );
              } catch (error) {
                console.error('Logout error:', error);
                
                // Even if there's an error with the signOut function,
                // try to navigate the user away
                try {
                  navigation.navigate('Login');
                } catch (navError) {
                  Alert.alert('Error', 'Failed to logout and navigate');
                }
              }
            }
          }
        ]
      );
    };

  return (
    <View style={styles.container}>
      {/* User Profile Section */}
      <View style={styles.userSection}>
        <View style={styles.profileImageContainer}>
          <Text style={styles.profileInitial}>
            {user?.fullname ? user.fullname[0].toUpperCase() : '?'}
          </Text>
        </View>
        <Text style={styles.userName}>{user?.fullname || 'Guest User'}</Text>
        <Text style={styles.userEmail}>{user?.email || 'Sign in to access account'}</Text>
      </View>
      
      {/* Navigation Menu */}
      <ScrollView style={styles.menuContainer}>
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

        {/* Replace with proper logout button */}
        <TouchableOpacity style={[styles.menuItem, styles.logoutButton]} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={24} color="#e53935" />
          <Text style={[styles.menuText, styles.logoutText]}>
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
  profileImageContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
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