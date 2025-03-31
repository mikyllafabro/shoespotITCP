import React, { createContext, useContext, useReducer, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { jwtDecode } from 'jwt-decode';
import { useDispatch } from 'react-redux';
import { login, logout } from '../Actions/Auth.actions';
import baseUrl from '../../assets/common/baseUrl';

// Create context
export const AuthContext = createContext();

// Initial state
const initialState = {
  isLoading: true,
  token: null,
};

// Reducer for local context state
function authReducer(state, action) {
  switch (action.type) {
    case 'RESTORE_TOKEN':
      return {
        ...state,
        token: action.token,
        isLoading: false,
      };
    case 'SIGN_IN':
      return {
        ...state,
        token: action.token,
        isLoading: false,
      };
    case 'SIGN_OUT':
      return {
        ...state,
        token: null,
        isLoading: false,
      };
    default:
      return state;
  }
}

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const reduxDispatch = useDispatch();

  // Load token on app start
  useEffect(() => {
    const bootstrapAsync = async () => {
      let userToken = null;

      try {
        // Get token from secure storage
        userToken = await SecureStore.getItemAsync('jwt_token');

        if (userToken) {
          // Validate token (check expiration)
          const decoded = jwtDecode(userToken);
          const currentTime = Date.now() / 1000;
          
          if (decoded.exp < currentTime) {
            // Token expired, remove it
            await SecureStore.deleteItemAsync('jwt_token');
            userToken = null;
          } else {
            // Token valid, fetch user data
            const response = await fetch(`${baseUrl}/profile`, {
              headers: {
                Authorization: `Bearer ${userToken}`,
              },
            });
            
            if (response.ok) {
              const userData = await response.json();
              // Update Redux store with user data
              reduxDispatch(login({
                user: userData,
                token: userToken
              }));
            } else {
              // If API call fails, token might be invalid
              await SecureStore.deleteItemAsync('jwt_token');
              userToken = null;
            }
          }
        }
      } catch (e) {
        console.log('Failed to restore authentication state:', e);
        // If token restoration fails, ensure we clean up
        await SecureStore.deleteItemAsync('jwt_token');
        userToken = null;
      }

      // Update local context state
      dispatch({ type: 'RESTORE_TOKEN', token: userToken });
    };

    bootstrapAsync();
  }, []);

  // Auth operations
  const authContext = {
    token: state.token,
    isLoading: state.isLoading,
    
    signIn: async (data) => {
      try {
        const userData = {
          user: data.user,
          token: data.token
        };
        
        // Store complete user data
        await SecureStore.setItemAsync('jwt_token', data.token);
        await SecureStore.setItemAsync('user_data', JSON.stringify(data.user));
        
        // Update local context
        dispatch({ type: 'SIGN_IN', token: data.token });
        
        // Update Redux store with complete user data
        reduxDispatch(login(userData));
        
        return { success: true };
      } catch (error) {
        console.error('Error during sign in:', error);
        return { success: false, error: error.message };
      }
    },
    
    signOut: async () => {
      try {
        // Clear token from secure storage
        await SecureStore.deleteItemAsync('jwt_token');
        // Update local context
        dispatch({ type: 'SIGN_OUT' });
        // Update Redux store
        reduxDispatch(logout());
        return { success: true };
      } catch (error) {
        console.error('Error during sign out:', error);
        return { success: false, error: error.message };
      }
    },
    
    // Helper to get the current token
    getToken: async () => {
      try {
        const token = await SecureStore.getItemAsync('jwt_token');
        const userData = await SecureStore.getItemAsync('user_data');
        
        if (!token || !userData) {
          return { token: null, user: null };
        }

        return {
          token,
          user: JSON.parse(userData)
        };
      } catch (e) {
        console.error('Failed to get token or user data', e);
        return { token: null, user: null };
      }
    }
  };

  return (
    <AuthContext.Provider value={authContext}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook for easier usage
export const useAuth = () => useContext(AuthContext);