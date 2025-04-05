import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import baseUrl from '../assets/common/baseUrl';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';

/**
 * Synchronizes a user between Firestore and MongoDB
 */
export const syncUserWithBackend = async (userData) => {
  if (!userData || !userData.email) {
    console.error('Cannot sync user without email');
    return { success: false };
  }
  
  console.log('Starting user sync between Firestore and MongoDB:', userData.email);
  
  try {
    // First, try the dedicated sync endpoint
    try {
      console.log('Attempting to sync via dedicated endpoint');
      const syncResponse = await axios.post(`${baseUrl}/auth/sync-user`, {
        email: userData.email,
        name: userData.name || userData.displayName || 'Google User',
        photo: userData.photo || userData.photoURL,
        uid: userData.uid || userData.id,
        googleId: userData.googleId,
        firebaseUid: userData.uid
      });
      
      if (syncResponse.data?.user) {
        console.log('User synced successfully via dedicated endpoint');
        // Store the token and user data
        await SecureStore.setItemAsync('jwt', syncResponse.data.token);
        await SecureStore.setItemAsync('user', JSON.stringify(syncResponse.data.user));
        await SecureStore.setItemAsync('needsSync', 'false');
        
        return {
          success: true,
          user: syncResponse.data.user,
          token: syncResponse.data.token
        };
      }
    } catch (syncError) {
      console.log('Dedicated sync failed, falling back to other methods:', syncError.message);
    }
    
    // If the sync endpoint fails, continue with the original strategy
    // Step 1: Try to find or create user in MongoDB
    let backendUser = null;
    let token = null;
    
    // Try login first
    try {
      const loginResponse = await axios.post(`${baseUrl}/auth/login`, {
        email: userData.email,
        googleAuth: true,
        googleData: {
          email: userData.email,
          name: userData.name || userData.displayName || 'Google User',
          photo: userData.photo || userData.photoURL,
          id: userData.googleId || userData.uid
        }
      });
      
      if (loginResponse.data?.user) {
        backendUser = loginResponse.data.user;
        token = loginResponse.data.token;
        console.log('User found in MongoDB via login');
      }
    } catch (loginError) {
      console.log('User not found in MongoDB, trying registration...');
      
      // Try register
      try {
        const registerResponse = await axios.post(`${baseUrl}/auth/register`, {
          email: userData.email,
          name: userData.name || userData.displayName || 'Google User',
          password: `AutoGen_${Math.random().toString(36).substring(2)}`, // Random secure password
          googleAuth: true,
          googleData: {
            email: userData.email,
            name: userData.name || userData.displayName || 'Google User',
            photo: userData.photo || userData.photoURL,
            id: userData.googleId || userData.uid
          }
        });
        
        if (registerResponse.data?.user) {
          backendUser = registerResponse.data.user;
          token = registerResponse.data.token;
          console.log('User created in MongoDB via registration');
        }
      } catch (registerError) {
        console.error('Failed to create user in MongoDB:', registerError);
        
        // Last attempt - try direct user creation
        try {
          const createResponse = await axios.post(`${baseUrl}/users`, {
            email: userData.email,
            name: userData.name || userData.displayName || 'Google User',
            firebaseUid: userData.uid,
            googleId: userData.googleId || userData.uid,
            photo: userData.photo || userData.photoURL
          });
          
          if (createResponse.data?.user) {
            backendUser = createResponse.data.user;
            console.log('User created in MongoDB via direct creation');
            
            // Now try to get a token via login
            try {
              const loginAfterCreateResponse = await axios.post(`${baseUrl}/auth/login`, {
                email: userData.email,
                googleAuth: true
              });
              
              if (loginAfterCreateResponse.data?.token) {
                token = loginAfterCreateResponse.data.token;
              }
            } catch (loginAfterCreateError) {
              console.log('Could not get token after user creation');
            }
          }
        } catch (createError) {
          console.error('All MongoDB user creation methods failed:', createError);
        }
      }
    }
    
    // Step 2: Update Firestore with MongoDB user ID if available
    if (backendUser && backendUser.id) {
      const uid = userData.uid || userData.id || `google_${userData.email.replace(/[.@]/g, '_')}`;
      const userRef = doc(db, "users", uid);
      
      try {
        // Check if user exists in Firestore
        const docSnap = await getDoc(userRef);
        
        if (docSnap.exists()) {
          // Update existing user with MongoDB ID
          await setDoc(userRef, {
            mongoDbId: backendUser.id,
            updatedAt: new Date().toISOString(),
            lastSync: new Date().toISOString()
          }, { merge: true });
        } else {
          // Create new user with MongoDB ID
          await setDoc(userRef, {
            email: userData.email,
            displayName: userData.name || userData.displayName || 'Google User',
            photoURL: userData.photo || userData.photoURL,
            uid: uid,
            mongoDbId: backendUser.id,
            provider: 'google',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            lastSync: new Date().toISOString()
          });
        }
        
        console.log('Firestore updated with MongoDB ID');
        
        // Update local storage with synchronized data
        if (token) {
          await SecureStore.setItemAsync('jwt', token);
          
          // Combine data from both sources
          const combinedUser = {
            ...backendUser,
            firebaseUid: uid,
            photo: userData.photo || userData.photoURL || backendUser.photo
          };
          
          await SecureStore.setItemAsync('user', JSON.stringify(combinedUser));
          await SecureStore.setItemAsync('needsSync', 'false');
          
          return {
            success: true,
            user: combinedUser,
            token
          };
        }
      } catch (firestoreError) {
        console.error('Failed to update Firestore:', firestoreError);
      }
    }
    
    return {
      success: !!backendUser,
      user: backendUser,
      token
    };
  } catch (error) {
    console.error('User sync failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Directly sync Google user with MongoDB
 * This specifically calls the googleLogin endpoint
 */
export const syncGoogleUserWithMongoDB = async (firebaseUser, idToken) => {
  if (!firebaseUser || !firebaseUser.email) {
    console.error('Cannot sync Google user without email');
    return { success: false };
  }
  
  console.log('Syncing Google user directly with MongoDB:', firebaseUser.email);
  
  try {
    // Prepare user data for the backend
    const userData = {
      email: firebaseUser.email,
      name: firebaseUser.displayName || 'Google User',
      photo: firebaseUser.photoURL,
      uid: firebaseUser.uid,
      googleId: firebaseUser.providerData?.[0]?.uid
    };
    
    // Try the optimized direct endpoint first
    try {
      console.log('Calling specific Google login endpoint...');
      const response = await axios.post(`${baseUrl}/auth/google-login`, {
        idToken,
        user: userData
      });
      
      if (response.data?.token && response.data?.user) {
        console.log('Successfully synced Google user with MongoDB');
        
        // Store the token and user data
        await SecureStore.setItemAsync('jwt', response.data.token);
        
        // Combine with Firebase data
        const combinedUser = {
          ...response.data.user,
          firebaseUid: firebaseUser.uid,
          photo: firebaseUser.photoURL || response.data.user.userImage
        };
        
        await SecureStore.setItemAsync('user', JSON.stringify(combinedUser));
        await SecureStore.setItemAsync('needsSync', 'false');
        
        // Also update Firestore with MongoDB ID
        try {
          const userRef = doc(db, "users", firebaseUser.uid);
          await setDoc(userRef, {
            mongoDbId: response.data.user.id,
            updatedAt: new Date().toISOString(),
            lastSync: new Date().toISOString()
          }, { merge: true });
          console.log('Updated Firestore with MongoDB ID');
        } catch (firestoreError) {
          console.error('Error updating Firestore with MongoDB ID:', firestoreError);
        }
        
        return {
          success: true,
          user: combinedUser,
          token: response.data.token
        };
      }
    } catch (directError) {
      console.error('Direct Google login failed, trying sync endpoint:', directError.message);
    }
    
    // Fall back to the sync-user endpoint if direct method fails
    try {
      const syncResponse = await axios.post(`${baseUrl}/auth/sync-user`, {
        email: firebaseUser.email,
        name: firebaseUser.displayName || 'Google User',
        photo: firebaseUser.photoURL,
        uid: firebaseUser.uid,
        googleId: firebaseUser.providerData?.[0]?.uid
      });
      
      if (syncResponse.data?.token && syncResponse.data?.user) {
        console.log('Successfully synced Google user via sync endpoint');
        
        // Store the token and user data
        await SecureStore.setItemAsync('jwt', syncResponse.data.token);
        
        // Combine with Firebase data
        const combinedUser = {
          ...syncResponse.data.user,
          firebaseUid: firebaseUser.uid,
          photo: firebaseUser.photoURL || syncResponse.data.user.userImage
        };
        
        await SecureStore.setItemAsync('user', JSON.stringify(combinedUser));
        await SecureStore.setItemAsync('needsSync', 'false');
        
        // Also update Firestore with MongoDB ID
        try {
          const userRef = doc(db, "users", firebaseUser.uid);
          await setDoc(userRef, {
            mongoDbId: syncResponse.data.user.id,
            updatedAt: new Date().toISOString(),
            lastSync: new Date().toISOString()
          }, { merge: true });
        } catch (firestoreError) {
          console.error('Error updating Firestore with MongoDB ID:', firestoreError);
        }
        
        return {
          success: true,
          user: combinedUser,
          token: syncResponse.data.token
        };
      }
    } catch (syncError) {
      console.error('Sync endpoint failed:', syncError.message);
    }
    
    console.error('All MongoDB sync methods failed');
    
    // Store for later sync
    await SecureStore.setItemAsync('needsSync', 'true');
    await SecureStore.setItemAsync('localUser', JSON.stringify({
      email: firebaseUser.email,
      name: firebaseUser.displayName || 'Google User',
      photo: firebaseUser.photoURL,
      uid: firebaseUser.uid,
      googleId: firebaseUser.providerData?.[0]?.uid
    }));
    
    return {
      success: false,
      error: 'All sync methods failed'
    };
  } catch (error) {
    console.error('Error syncing Google user with MongoDB:', error);
    
    // Store for later sync
    await SecureStore.setItemAsync('needsSync', 'true');
    await SecureStore.setItemAsync('localUser', JSON.stringify({
      email: firebaseUser.email,
      name: firebaseUser.displayName || 'Google User',
      photo: firebaseUser.photoURL,
      uid: firebaseUser.uid,
      googleId: firebaseUser.providerData?.[0]?.uid
    }));
    
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Check if user needs to be synced
 */
export const checkAndSyncUser = async () => {
  try {
    const needsSync = await SecureStore.getItemAsync('needsSync');
    
    if (needsSync === 'true') {
      const localUserJson = await SecureStore.getItemAsync('localUser');
      
      if (localUserJson) {
        const localUser = JSON.parse(localUserJson);
        
        // Try to sync the user
        const syncResult = await syncUserWithBackend(localUser);
        
        if (syncResult.success) {
          console.log('Auto-sync successful!');
          return syncResult;
        }
      }
    }
    
    return { success: false, message: 'No sync needed' };
  } catch (error) {
    console.error('Sync check failed:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Force sync user data from Firestore to MongoDB
 */
export const forceSyncUserWithBackend = async (firebaseUser) => {
  if (!firebaseUser) {
    console.error('No Firebase user to sync');
    return { success: false };
  }
  
  // Mark that we need sync
  await SecureStore.setItemAsync('needsSync', 'true');
  
  // Store the user we want to sync
  await SecureStore.setItemAsync('localUser', JSON.stringify({
    email: firebaseUser.email,
    name: firebaseUser.displayName || 'Google User',
    photo: firebaseUser.photoURL,
    uid: firebaseUser.uid,
    googleId: firebaseUser.providerData?.[0]?.uid
  }));
  
  // Immediately attempt sync
  return await syncUserWithBackend({
    email: firebaseUser.email,
    name: firebaseUser.displayName || 'Google User',
    photo: firebaseUser.photoURL,
    uid: firebaseUser.uid,
    googleId: firebaseUser.providerData?.[0]?.uid
  });
};
