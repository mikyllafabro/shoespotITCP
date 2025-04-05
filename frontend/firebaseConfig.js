// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  signInWithCredential,
  GoogleAuthProvider as FirebaseGoogleAuthProvider 
} from "firebase/auth";
import { getAnalytics } from "firebase/analytics";
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDfEHYQgeBfXQav9lomth0KS6QHyngyq0E",
  authDomain: "shoespotdb.firebaseapp.com",
  databaseURL: "https://shoespotdb-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "shoespotdb",
  storageBucket: "shoespotdb.firebasestorage.app",
  messagingSenderId: "494847191014",
  appId: "1:494847191014:web:e32b01f3be62109fbad827",
  measurementId: "G-BD4PT94KCN"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new FirebaseGoogleAuthProvider();
const analytics = getAnalytics(app);

// Initialize Firestore with explicit database initialization
const db = getFirestore(app);

// Create a function to initialize Firestore
export const initializeFirestore = async () => {
  try {
    console.log("Attempting to initialize Firestore with new permissions...");
    // Create a test document to ensure the database is created
    const settingsRef = doc(db, "settings", "app_info");
    
    // Try to fetch the document first
    try {
      const docSnap = await getDoc(settingsRef);
      
      if (!docSnap.exists()) {
        // Document doesn't exist, create it
        await setDoc(settingsRef, {
          appName: "ShoeSpot",
          version: "1.0.0",
          initializedAt: new Date().toISOString(),
          lastAccessed: new Date().toISOString()
        });
        console.log("✅ Firestore initialized with settings document - permissions working!");
      } else {
        // Update the existing document
        await setDoc(settingsRef, {
          lastAccessed: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }, { merge: true });
        console.log("✅ Firestore permissions confirmed - updated existing document");
      }
      
      return true;
    } catch (error) {
      console.error("Error accessing Firestore document:", error);
      return false;
    }
  } catch (error) {
    console.error("Error initializing Firestore:", error);
    return false;
  }
};

// Configure the Google provider with the correct scopes
googleProvider.addScope('profile');
googleProvider.addScope('email');

// Add the client ID for iOS
googleProvider.setCustomParameters({
  'client_id': '494847191014-orrubiee294s4oqerkbn5fdtp4ce0tjg.apps.googleusercontent.com'
});

// Add helper function for Google Sign-In
export const signInWithGoogleCredential = async (idToken) => {
  try {
    console.log('=== Firebase Auth Debug ===');
    console.log('1. Creating credential with token, length:', idToken?.length);
    
    // Make sure we're using the correct format for the credential
    const credential = FirebaseGoogleAuthProvider.credential(idToken);
    console.log('2. Credential created successfully');
    
    console.log('3. Attempting Firebase sign in');
    const result = await signInWithCredential(auth, credential);
    console.log('4. Firebase sign in successful:', {
      email: result.user.email,
      uid: result.user.uid,
      providerId: result.providerId
    });
    
    // Get fresh ID token that will have the correct audience
    const firebaseToken = await result.user.getIdToken(true);
    console.log('5. Generated fresh Firebase ID token with correct audience');
    
    return result;
  } catch (error) {
    console.error('=== Firebase Auth Error ===');
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    console.error('Error details:', {
      name: error.name,
      stack: error.stack,
      credential: error?.credential,
      email: error?.email,
      phoneNumber: error?.phoneNumber,
      tenantId: error?.tenantId
    });
    console.error('Full error:', JSON.stringify(error, null, 2));
    console.error('=========================');
    throw error;
  }
};

// Add function to save user to Firestore with better error handling
export const saveUserToFirestore = async (userData) => {
  try {
    console.log('Saving user to Firestore:', userData);
    
    if (!userData.uid) {
      console.error('Cannot save to Firestore: missing user ID');
      return false;
    }
    
    // Don't require current user - this was causing the "No authenticated Firebase user found" error
    // Just use the direct document reference approach
    
    // Reference to user document
    const userRef = doc(db, "users", userData.uid);
    
    // Check if user already exists
    try {
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        // Update existing user
        await setDoc(userRef, {
          email: userData.email,
          displayName: userData.displayName || '',
          photoURL: userData.photoURL || '',
          lastLogin: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }, { merge: true });
        console.log('Updated existing user in Firestore');
      } else {
        // Create new user
        await setDoc(userRef, {
          email: userData.email,
          displayName: userData.displayName || '',
          photoURL: userData.photoURL || '',
          uid: userData.uid,
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString(),
          role: 'user',
          status: 'active'
        });
        console.log('Created new user in Firestore');
      }
    } catch (docError) {
      console.error('Error working with Firestore document:', docError);
      // Try simpler approach - direct write with merge
      await setDoc(userRef, {
        email: userData.email,
        displayName: userData.displayName || '',
        photoURL: userData.photoURL || '',
        uid: userData.uid,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      console.log('Saved user with simplified approach');
    }
    
    return true;
  } catch (error) {
    console.error('Error saving user to Firestore:', error);
    
    // Provide troubleshooting information
    console.error(`
      Firestore Error Troubleshooting:
      1. Check your Firebase console for security rules
      2. Verify your app has the correct permissions
      3. Make sure Firestore is enabled in your Firebase project
      4. The error was: ${error.message}
    `);
    
    return false;
  }
};

// Simplified Google user save function - eliminates dependency on auth.currentUser
export const saveGoogleUserToFirestore = async (uid, userData) => {
  try {
    if (!uid || !userData?.email) {
      console.error('Missing required data for Firestore save');
      return false;
    }
    
    console.log(`Saving Google user to Firestore: ${userData.email} (${uid})`);
    
    // Direct approach to save document
    const userRef = doc(db, "users", uid);
    
    // Prepare data with defaults in case fields are missing
    const data = {
      email: userData.email,
      displayName: userData.name || userData.givenName || 'Google User',
      photoURL: userData.photo || null,
      uid: uid,
      provider: 'google',
      lastLogin: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString()
    };
    
    // Check if user already exists
    try {
      const docSnap = await getDoc(userRef);
      
      if (docSnap.exists()) {
        // Only update certain fields if user exists
        await setDoc(userRef, {
          lastLogin: data.lastLogin,
          updatedAt: data.updatedAt,
          // Update photo if available
          ...(userData.photo ? { photoURL: userData.photo } : {})
        }, { merge: true });
        console.log('Updated existing user in Firestore');
      } else {
        // Create new user with full data
        await setDoc(userRef, data);
        console.log('Created new user in Firestore');
      }
      
      return true;
    } catch (error) {
      console.error('Error checking if user exists:', error);
      // Try direct write as fallback
      await setDoc(userRef, data, { merge: true });
      console.log('Saved user data using fallback method');
      return true;
    }
  } catch (error) {
    console.error('Error saving Google user to Firestore:', error);
    return false;
  }
};

// Get user from Firestore
export const getUserFromFirestore = async (uid) => {
  try {
    const userRef = doc(db, "users", uid);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      return userDoc.data();
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error getting user from Firestore:', error);
    return null;
  }
};

// Function to get current user's Firebase ID token
export const getCurrentUserIdToken = async () => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('No authenticated user');
    }
    
    // Force refresh to ensure token is valid and has correct claims
    return await currentUser.getIdToken(true);
  } catch (error) {
    console.error('Error getting ID token:', error);
    throw error;
  }
};

export { auth, googleProvider, db, FirebaseGoogleAuthProvider };
export default app;