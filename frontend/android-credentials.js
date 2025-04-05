// Android package and certificate information for Google Sign-In

// Package name as registered in Google Cloud Console and Firebase
export const PACKAGE_NAME = 'com.bosstmakulit.shoespotITCP';

// SHA-1 certificate hash in two formats
// Without colons (as used in some API calls)
export const CERTIFICATE_HASH = 'c9f8ec1fb38f4d5b9d47810b5d82caf13452ea35';

// With colons (as displayed in keytool and Firebase console)
export const CERTIFICATE_HASH_WITH_COLONS = 'c9:f8:ec:1f:b3:8f:4d:5b:9d:47:81:0b:5d:82:ca:f1:34:52:ea:35';

// Function to verify and log credentials
export const verifyCredentials = () => {
  console.log(`
=== ANDROID CREDENTIALS VERIFICATION ===
Package Name: ${PACKAGE_NAME}
SHA-1 Certificate Hash: ${CERTIFICATE_HASH_WITH_COLONS}

Make sure these match the values in:
1. Firebase Console > Project Settings > Your Apps > Android
2. google-services.json file
3. Google Cloud Console > APIs & Services > Credentials
  `);
};

// Compare with Firebase configuration
export const compareWithFirebaseConfig = (googleServicesJson) => {
  try {
    const clientInfo = googleServicesJson.client[0];
    const packageName = clientInfo.client_info.android_client_info.package_name;
    
    // Find the SHA-1 certificate hash from the oauth_client entry with client_type 1
    const oauthClient = clientInfo.oauth_client.find(
      client => client.client_type === 1 && client.android_info
    );
    
    const certificateHash = oauthClient?.android_info?.certificate_hash || '';
    
    console.log(`
    === FIREBASE CONFIG COMPARISON ===
    Package Name Match: ${packageName === PACKAGE_NAME ? '✓ YES' : '✗ NO'}
      App: ${PACKAGE_NAME}
      Firebase: ${packageName}
    
    SHA-1 Certificate Match: ${certificateHash.toLowerCase() === CERTIFICATE_HASH.toLowerCase() ? '✓ YES' : '✗ NO'}
      App: ${CERTIFICATE_HASH}
      Firebase: ${certificateHash}
    `);
    
    return {
      packageNameMatches: packageName === PACKAGE_NAME,
      certificateMatches: certificateHash.toLowerCase() === CERTIFICATE_HASH.toLowerCase()
    };
  } catch (error) {
    console.error('Error comparing with Firebase config:', error);
    return { error: error.message };
  }
};
