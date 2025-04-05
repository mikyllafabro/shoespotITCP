import { Platform } from 'react-native';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { PACKAGE_NAME, CERTIFICATE_HASH, CERTIFICATE_HASH_WITH_COLONS } from '../android-credentials';
import { GOOGLE_SIGNIN_CONFIG } from '../google-auth-config';

export const debugGoogleSignInConfig = async () => {
  console.log(`
=== GOOGLE SIGN-IN CONFIGURATION CHECKER ===
Platform: ${Platform.OS} ${Platform.Version}
Package Name: ${PACKAGE_NAME}
SHA-1 Certificate (no colons): ${CERTIFICATE_HASH}
SHA-1 Certificate (with colons): ${CERTIFICATE_HASH_WITH_COLONS}

WebClientId: ${GOOGLE_SIGNIN_CONFIG.webClientId}
Scopes: ${GOOGLE_SIGNIN_CONFIG.scopes.join(', ')}
OfflineAccess: ${GOOGLE_SIGNIN_CONFIG.offlineAccess}

COMMON ISSUES TO CHECK:
1. Make sure the SHA-1 and package name are registered in Firebase Console
2. Verify Google Sign-In is enabled in Firebase Console > Authentication
3. Check that google-services.json is up to date and in the right location
4. Ensure the webClientId matches the client_id with client_type: 3 in google-services.json
5. Make sure the app is properly registered in Google Cloud Console
`);

  try {
    const isPlayServicesAvailable = await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    console.log(`Play Services available: ${isPlayServicesAvailable}`);
    
    const isSignedIn = await GoogleSignin.isSignedIn();
    console.log(`User is already signed in: ${isSignedIn}`);
    
    console.log('Google Sign-In configuration is valid ✓');
  } catch (error) {
    console.error('Google Play Services check failed:', {
      code: error.code,
      message: error.message
    });
  }
};

export const checkGoogleServicesJson = (googleServicesJson) => {
  try {
    // Verify the google-services.json structure
    const clientInfo = googleServicesJson.client[0];
    const packageName = clientInfo.client_info.android_client_info.package_name;
    const webClientId = clientInfo.oauth_client.find(client => client.client_type === 3)?.client_id;
    const androidClientId = clientInfo.oauth_client.find(client => 
      client.client_type === 1 && client.android_info?.package_name === packageName
    )?.client_id;
    
    const certificateHash = clientInfo.oauth_client.find(client => 
      client.client_type === 1 && client.android_info?.package_name === packageName
    )?.android_info?.certificate_hash;
    
    console.log(`
=== GOOGLE SERVICES JSON CHECK ===
Package Name Match: ${packageName === PACKAGE_NAME ? '✓' : '✗'}
Certificate Hash Match: ${certificateHash === CERTIFICATE_HASH ? '✓' : '✗'}
Web Client ID Match: ${webClientId === GOOGLE_SIGNIN_CONFIG.webClientId ? '✓' : '✗'}
Android Client ID Present: ${androidClientId ? '✓' : '✗'}
    `);
    
    return {
      packageNameMatch: packageName === PACKAGE_NAME,
      certificateHashMatch: certificateHash === CERTIFICATE_HASH,
      webClientIdMatch: webClientId === GOOGLE_SIGNIN_CONFIG.webClientId,
      hasAndroidClientId: !!androidClientId
    };
  } catch (error) {
    console.error('Error checking google-services.json:', error);
    return {
      error: error.message
    };
  }
};

// Add a new function to test Google Sign-In configuration
export const testGoogleSignIn = async () => {
  try {
    console.log('Testing Google Sign-In configuration...');
    
    // Step 1: Check if Play Services are available
    const hasPlayServices = await GoogleSignin.hasPlayServices({
      showPlayServicesUpdateDialog: true
    });
    console.log('Play Services available:', hasPlayServices);
    
    // Step 2: Sign out any existing sessions
    await GoogleSignin.signOut().catch(() => console.log('No active session'));
    
    // Step 3: Check if signed in (should be false after signOut)
    const isSignedIn = await GoogleSignin.isSignedIn();
    console.log('Is signed in after signOut:', isSignedIn);
    
    // Step 4: Get current user info (should throw error if no user)
    try {
      const currentUser = await GoogleSignin.getCurrentUser();
      console.log('Current user after signOut (should be null):', currentUser);
    } catch (error) {
      console.log('No current user (expected):', error.message);
    }
    
    console.log('Configuration test completed');
    
    return {
      success: true,
      hasPlayServices,
      isSignedIn
    };
  } catch (error) {
    console.error('Test failed:', error);
    return {
      success: false,
      error: {
        code: error.code,
        message: error.message
      }
    };
  }
};

// Add a new function to test Google Sign-In response structure
export const testGoogleSignInResponse = async () => {
  try {
    console.log('Testing Google Sign-In response...');
    
    // Sign out first to ensure a clean slate
    await GoogleSignin.signOut().catch(() => {});
    
    // Start the sign-in flow
    const userInfo = await GoogleSignin.signIn();
    
    // Log the entire response structure to help debug
    console.log('===== GOOGLE SIGN-IN RESPONSE STRUCTURE =====');
    console.log('Full user info object:', JSON.stringify(userInfo, null, 2));
    console.log('');
    console.log('User object exists:', !!userInfo.user);
    if (userInfo.user) {
      console.log('User email exists:', !!userInfo.user.email);
      console.log('User name exists:', !!userInfo.user.name);
      console.log('User ID exists:', !!userInfo.user.id);
      
      // Log all properties of the user object
      console.log('All user properties:');
      Object.keys(userInfo.user).forEach(key => {
        console.log(`- ${key}: ${typeof userInfo.user[key]} = ${JSON.stringify(userInfo.user[key])}`);
      });
    }
    console.log('ID token exists:', !!userInfo.idToken);
    console.log('ID token length:', userInfo.idToken?.length);
    console.log('===========================================');
    
    return {
      success: true,
      userInfo
    };
  } catch (error) {
    console.error('Test failed:', error);
    return {
      success: false,
      error: {
        code: error.code,
        message: error.message
      }
    };
  }
};

// Add a function to debug the Google Services JSON file placement
export const findGoogleServicesJson = () => {
  // This will help users understand where the file should be placed
  console.log(`
=== GOOGLE SERVICES JSON LOCATIONS ===
For Expo projects using expo-dev-client:
- Should be at: android/app/google-services.json

For React Native bare projects:
- Should be at: android/app/google-services.json

Common issues:
1. File not copied to the correct location
2. File is outdated (doesn't match Firebase console)
3. File permissions are incorrect
  `);
};
