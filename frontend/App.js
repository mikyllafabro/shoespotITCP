import 'react-native-gesture-handler';
import React, { useEffect } from "react";
import { Provider } from "react-redux";
import store from "./Context/Store/store"; // Import only this store
import { AuthProvider } from "./Context/Actions/AuthContext";
import AppNavigator from "./Navigators/AppNavigator";
import { setupMockBackend } from './services/MockBackend';
import { checkAndSyncUser } from './services/BackendSync';
import { initializeFirestore } from './firebaseConfig';

export default function App() {
  useEffect(() => {
    // Initialize Firebase and Firestore
    initializeFirestore().then(result => {
      console.log('Firestore initialization:', result ? 'successful' : 'failed');
    });
    
    // Setup mock backend for missing endpoints
    setupMockBackend();
    
    // Check for users that need synchronization
    checkAndSyncUser().then(result => {
      if (result.success) {
        console.log('User synchronized with backend');
      }
    });
    
    // ... rest of your initialization code
  }, []);

  return (
    <Provider store={store}>
      <AuthProvider>
        <AppNavigator />
      </AuthProvider>
    </Provider>
  );
}