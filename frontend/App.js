import 'react-native-gesture-handler';
import React, { useEffect, useRef } from "react";
import { Provider } from "react-redux";
import store from "./Context/Store/store";
import { AuthProvider } from "./Context/Actions/AuthContext";
import AppNavigator from "./Navigators/AppNavigator";
import { setupMockBackend } from './services/MockBackend';
import { checkAndSyncUser } from './services/BackendSync';
import { initializeFirestore } from './firebaseConfig';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export default function App() {
  const navigationRef = useRef(null);

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
    
    // Register for push notifications
    setupNotifications();

    // Update notification tap handler
    const subscription = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data;
      console.log('Notification tapped with data:', data);

      if (navigationRef.current) {
        // Always navigate to NotificationDetails regardless of data.screen
        navigationRef.current.navigate('NotificationDetails', {
          notification: {
            title: response.notification.request.content.title,
            body: response.notification.request.content.body,
            data: data,
            created_at: new Date().toISOString()
          }
        });
      } else {
        console.error('Navigation ref is not available');
      }
    });

    return () => {
      if (subscription) {
        subscription.remove();
      }
    };
  }, []);

  const setupNotifications = async () => {
    try {
      // Request permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('Failed to get notification permissions');
        return;
      }

      // Set up Android channel
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'Default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
      }

      console.log('Notifications configured successfully');
    } catch (error) {
      console.error('Error setting up notifications:', error);
    }
  };

  return (
    <Provider store={store}>
      <AuthProvider>
        <AppNavigator ref={navigationRef} />
      </AuthProvider>
    </Provider>
  );
}