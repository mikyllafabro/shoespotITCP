import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import axios from 'axios';
import { baseUrl } from '../assets/common/baseUrl';
import * as SecureStore from 'expo-secure-store';

// Configure default notification handling
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export const registerForPushNotificationsAsync = async () => {
  let token = null;

  try {
    if (!Device.isDevice) {
      console.log('[Push] Must use physical device for Push Notifications');
      return null;
    }

    // Set up Android channel
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    // Check permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    console.log('[Push] Existing permission status:', existingStatus);
    
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
      console.log('[Push] New permission status:', status);
    }

    if (finalStatus !== 'granted') {
      console.log('[Push] Permission denied');
      return null;
    }

    // Get Expo token
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: Constants.expoConfig?.extra?.eas?.projectId,
    });

    const originalToken = tokenData.data;
    console.log('[Push] Original token:', originalToken);

    // Format token (remove ExponentPushToken[] wrapper)
    const formattedToken = originalToken.replace('ExponentPushToken[', '').replace(']', '');
    console.log('[Push] Formatted token:', formattedToken);

    return formattedToken;

  } catch (error) {
    console.error('[Push] Error getting push token:', error);
    return null;
  }
};

export const updatePushToken = async (token) => {
  try {
    const authToken = await SecureStore.getItemAsync('jwt');
    if (!authToken) {
      console.log('[Push] No auth token found');
      return false;
    }

    const response = await axios.post(
      `${baseUrl}/auth/update-fcm-token`,
      {
        fcmToken: token,
        deviceType: Platform.OS,
        tokenType: 'expo'
      },
      {
        headers: { 'Authorization': `Bearer ${authToken}` }
      }
    );

    console.log('[Push] Token updated on server');
    return response.status === 200;
  } catch (error) {
    console.error('[Push] Error updating token:', error);
    return false;
  }
};

export const removePushToken = async () => {
  try {
    const authToken = await SecureStore.getItemAsync('jwt');
    if (!authToken) return false;

    await axios.delete(
      `${baseUrl}/auth/remove-fcm-token`,
      {
        headers: { 'Authorization': `Bearer ${authToken}` }
      }
    );
    return true;
  } catch (error) {
    console.error('[Push] Error removing token:', error);
    return false;
  }
};
