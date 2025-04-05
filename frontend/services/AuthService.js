import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import baseUrl from '../assets/common/baseUrl';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { syncUserWithBackend, syncGoogleUserWithMongoDB } from './BackendSync';

/**
 * Save user data to Firestore with error handling
 */
export const saveUserToFirestore = async (userData) => {
  if (!userData.email) {
    console.error('Cannot save user without email');
    return false;
  }
  
  try {
    // Create a userId from email if not provided
    const userId = userData.id || userData.uid || `google_${userData.email.replace(/[.@]/g, '_')}`;
    
    // Reference to user document
    const userRef = doc(db, "users", userId);
    
    const userDataToSave = {
      email: userData.email,
      displayName: userData.name || userData.displayName || 'Google User',
      photoURL: userData.photo || userData.photoURL || null,
      uid: userId,
      provider: userData.provider || 'google',
      lastLogin: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Try to check if document exists first
    try {
      const docSnap = await getDoc(userRef);
      
      // If exists, just update
      if (docSnap.exists()) {
        await setDoc(userRef, {
          ...userDataToSave,
          updatedAt: new Date().toISOString(),
          lastLogin: new Date().toISOString()
        }, { merge: true });
      } else {
        // Otherwise create new
        await setDoc(userRef, {
          ...userDataToSave,
          createdAt: new Date().toISOString(),
          role: 'user',
          status: 'active'
        });
      }
      
      // After saving to Firestore, also sync with MongoDB backend
      try {
        await syncUserWithBackend({
          email: userData.email,
          name: userData.name || userData.displayName || 'Google User',
          photo: userData.photo || userData.photoURL,
          uid: userId,
          googleId: userData.googleId || userData.id
        });
      } catch (syncError) {
        console.error('Error syncing with MongoDB after Firestore save:', syncError);
        // Mark that we need sync later
        await SecureStore.setItemAsync('needsSync', 'true');
        await SecureStore.setItemAsync('localUser', JSON.stringify({
          email: userData.email,
          name: userData.name || userData.displayName || 'Google User',
          photo: userData.photo || userData.photoURL,
          uid: userId,
          googleId: userData.googleId || userData.id
        }));
      }
      
      return true;
    } catch (docError) {
      // If we can't check doc, just try to write with merge
      await setDoc(userRef, {
        ...userDataToSave,
        createdAt: new Date().toISOString()
      }, { merge: true });
      
      // Also attempt to sync with MongoDB
      try {
        await syncUserWithBackend({
          email: userData.email,
          name: userData.name || userData.displayName || 'Google User',
          photo: userData.photo || userData.photoURL,
          uid: userId,
          googleId: userData.googleId || userData.id
        });
      } catch (syncError) {
        console.error('Error syncing with MongoDB after Firestore fallback save:', syncError);
        // Mark that we need sync later
        await SecureStore.setItemAsync('needsSync', 'true');
        await SecureStore.setItemAsync('localUser', JSON.stringify({
          email: userData.email,
          name: userData.name || userData.displayName || 'Google User',
          photo: userData.photo || userData.photoURL,
          uid: userId,
          googleId: userData.googleId || userData.id
        }));
      }
      
      return true;
    }
  } catch (error) {
    console.error('Error saving to Firestore:', error);
    return false;
  }
};

/**
 * Explicitly sync Google authenticated user with MongoDB
 */
export const syncGoogleAuthWithMongoDB = async (firebaseUser, idToken) => {
  if (!firebaseUser || !firebaseUser.email) {
    console.error('Cannot sync Google auth without user data');
    return false;
  }
  
  try {
    console.log('Starting Google auth sync with MongoDB');
    
    // Use the direct MongoDB sync function
    const syncResult = await syncGoogleUserWithMongoDB(firebaseUser, idToken);
    
    if (syncResult.success) {
      console.log('Google auth successfully synced with MongoDB');
      return true;
    } else {
      console.error('Google auth sync failed:', syncResult.error);
      
      // If direct sync failed, try the regular sync as fallback
      const fallbackResult = await syncUserWithBackend({
        email: firebaseUser.email,
        name: firebaseUser.displayName || 'Google User',
        photo: firebaseUser.photoURL,
        uid: firebaseUser.uid,
        googleId: firebaseUser.providerData?.[0]?.uid
      });
      
      return fallbackResult.success;
    }
  } catch (error) {
    console.error('Error in Google auth sync:', error);
    return false;
  }
};

/**
 * Attempt to authenticate with backend using various methods
 */
export const authenticateWithBackend = async (userData, idToken = null) => {
  try {
    // Try with idToken if available
    if (idToken) {
      try {
        const response = await axios.post(`${baseUrl}/auth/google-login`, {
          idToken,
          user: {
            email: userData.email,
            name: userData.name || userData.displayName,
            photo: userData.photo || userData.photoURL
          }
        });
        
        if (response.data?.token && response.data?.user) {
          return {
            success: true,
            data: response.data
          };
        }
      } catch (tokenError) {
        console.error('Token authentication failed:', tokenError);
      }
    }
    
    // Try with direct user data
    try {
      const response = await axios.post(`${baseUrl}/auth/google-direct`, {
        user: {
          email: userData.email,
          name: userData.name || userData.displayName,
          photo: userData.photo || userData.photoURL,
          googleId: userData.id
        }
      });
      
      if (response.data?.token && response.data?.user) {
        return {
          success: true,
          data: response.data
        };
      }
    } catch (directError) {
      console.error('Direct authentication failed:', directError);
    }
    
    // Try with email lookup
    try {
      const response = await axios.post(`${baseUrl}/auth/email-lookup`, {
        email: userData.email,
        name: userData.name || userData.displayName
      });
      
      if (response.data?.token && response.data?.user) {
        return {
          success: true,
          data: response.data
        };
      }
    } catch (emailError) {
      console.error('Email lookup failed:', emailError);
    }
    
    // All attempts failed
    return {
      success: false,
      error: 'All authentication methods failed'
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Save auth data to secure storage
 */
export const saveAuthData = async (serverData, userData) => {
  try {
    // Save token
    await SecureStore.setItemAsync('jwt', serverData.token);
    
    // Save user data
    const userToSave = {
      id: serverData.user.id,
      email: userData.email,
      name: userData.name || userData.displayName || 'Google User',
      photo: userData.photo || userData.photoURL,
      role: serverData.user.role || 'user',
      firebaseUid: userData.uid || userData.id
    };
    
    await SecureStore.setItemAsync('user', JSON.stringify(userToSave));
    return true;
  } catch (error) {
    console.error('Error saving auth data:', error);
    return false;
  }
};
