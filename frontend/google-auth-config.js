// Configuration for Google Sign-In for Android

export const GOOGLE_SIGNIN_CONFIG = {
  // Web client ID (client_type: 3)
  webClientId: '494847191014-orrubiee294s4oqerkbn5fdtp4ce0tjg.apps.googleusercontent.com',
  // Using basic scopes
  scopes: ['email', 'profile'],
  // Turn off offline access which can cause issues
  offlineAccess: false,
  // Add iOS URL scheme with the correct format - must start with com.googleusercontent.apps
  iosClientId: '494847191014-orrubiee294s4oqerkbn5fdtp4ce0tjg.apps.googleusercontent.com', // Use web client ID if you don't have a separate iOS client ID
  iosUrlScheme: 'com.googleusercontent.apps.494847191014-orrubiee294s4oqerkbn5fdtp4ce0tjg'
};

export const debugGoogleSignIn = () => {
  console.log(`
=== GOOGLE SIGN-IN CONFIGURATION ===
webClientId: ${GOOGLE_SIGNIN_CONFIG.webClientId}
scopes: ${GOOGLE_SIGNIN_CONFIG.scopes.join(', ')}
offlineAccess: ${GOOGLE_SIGNIN_CONFIG.offlineAccess}

Make sure this matches the web_client configuration in google-services.json
`);
};