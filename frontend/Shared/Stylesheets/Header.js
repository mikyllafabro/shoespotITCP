import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  TouchableOpacity 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import * as SecureStore from 'expo-secure-store';

const Header = ({ toggleDrawer, navigation }) => {
  // Get current user from Redux store
  const user = useSelector(state => state.auth.user);
  const [userRole, setUserRole] = useState(null);
  
  // Strict comparison to ensure only "admin" role gets access
  const isAdmin = (user && user.role === "admin") || userRole === "admin";

  useEffect(() => {
    // If user role not available in Redux state, try to get it from SecureStore
    const getUserRole = async () => {
      try {
        if (!user || !user.role) {
          const storedRole = await SecureStore.getItemAsync('userRole');
          
          if (storedRole) {
            setUserRole(storedRole);
          } else {
            // If no specific role is stored, try to get complete user data
            const userData = await SecureStore.getItemAsync('user');
            if (userData) {
              const parsedUser = JSON.parse(userData);
              setUserRole(parsedUser.role || 'user');
            }
          }
        } else {
          // Explicitly set the role from Redux state for consistent comparisons
          setUserRole(user.role);
        }
      } catch (error) {
        console.error('Error retrieving user role:', error);
        setUserRole('user'); // Default to user role on error
      }
    };
    
    getUserRole();
    
    // For debugging - log the current user role
    console.log('Header - Current user role:', user?.role || userRole || 'unknown');
    
  }, [user]);

  // Debug logging to help troubleshoot
  useEffect(() => {
    console.log('Header render - isAdmin:', isAdmin);
    console.log('Header render - user role:', user?.role);
    console.log('Header render - userRole state:', userRole);
  }, [isAdmin, user, userRole]);

  const handleCartPress = () => {
    if (navigation) {
      navigation.navigate('Cart');
    }
  };

  return (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        <TouchableOpacity 
          onPress={toggleDrawer}
          style={styles.menuButton}
        >
          <Ionicons name="menu" size={24} color="white" />
        </TouchableOpacity>
        
        <View style={styles.logoContainer}>
          <Image 
            source={require('../../assets/logo.png')} 
            style={styles.logo}
            resizeMode="contain" 
          />
          <Text style={styles.storeName}>ShoeSpot</Text>
        </View>
      </View>
      
      <View style={styles.headerRight}>
        <TouchableOpacity 
          style={styles.cartButton}
          onPress={handleCartPress}
        >
          <Ionicons name="cart-outline" size={24} color="white" />
        </TouchableOpacity>
        
        {/* Only show admin button if role is explicitly "admin" */}
        {isAdmin && (
          <TouchableOpacity 
            style={styles.adminButton}
            onPress={() => navigation.navigate('AdminHome')}
          >
            <Ionicons name="settings-outline" size={24} color="white" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    backgroundColor: '#1a56a4',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuButton: {
    marginRight: 12,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    width: 32,
    height: 32,
  },
  storeName: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cartButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  adminButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  }
});

export default Header;