import { Alert, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as SecureStore from 'expo-secure-store';
import axios from 'axios';
import { baseUrl } from '../assets/common/baseUrl';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Add this function to replace getOrderById from Redux
const fetchOrderDetails = async (orderId) => {
  try {
    const token = await SecureStore.getItemAsync('jwt');
    const response = await axios.get(`${baseUrl}/orders/${orderId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching order details:', error);
    return null;
  }
};

export const sendOrderStatusNotification = async (order, newStatus) => {
  try {
    console.log('Sending notification for order:', order);

    // Get current user data
    const userData = await SecureStore.getItemAsync('userData');
    const currentUser = userData ? JSON.parse(userData) : null;
    
    // Ensure we have a valid userId, using multiple fallbacks
    const userId = order.userId || 
                  order.user || 
                  (currentUser && (currentUser.id || currentUser._id || currentUser.userId)) ||
                  'anonymous';  // Fallback value
    
    console.log('Using userId for notification:', userId);

    const title = 'Order Status Updated';
    const body = `Order #${order.orderNumber || order.id.slice(-6)} is now ${newStatus.toUpperCase()}`;

    // Prepare notification data
    const notificationData = {
      type: 'ORDER_STATUS_UPDATE',
      orderId: order.id,
      status: newStatus,
      screen: 'NotificationDetails', // Changed from NotificationScreen
      orderNumber: order.orderNumber || order.id.slice(-6),
      products: order.products,
      customer: order.customer,
      orderDate: order.date || order.createdAt,
      paymentMethod: order.paymentMethod,
      userId: userId
    };

    // Save to local DB if we have a valid userId
    if (userId !== 'anonymous') {
      await saveNotification(userId, title, body, notificationData);
    }

    // Always send push notification
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: notificationData,
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
        badge: true
      },
      trigger: null,
    });

    console.log('Notification sent successfully');
  } catch (error) {
    console.error('Error sending notification:', error);
    // Don't throw error to prevent blocking order status update
    console.log('Continuing despite notification error');
  }
};

// Helper function for basic notifications
const sendBasicNotification = async (userId, title, body, orderId, status) => {
  await saveNotification(userId, title, body, {
    type: 'ORDER_STATUS_UPDATE',
    orderId: orderId,
    status: status,
    screen: 'NotificationDetails'
  });

  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data: {
        screen: 'NotificationDetails',
        orderId: orderId,
        type: 'ORDER_STATUS_UPDATE',
        status: status
      },
    },
    trigger: null,
  });
};

export const sendProductDiscountNotification = async (product) => {
  try {
    console.log('Starting product discount notification for:', product);

    // Send immediate push notification regardless of user state
    const title = `${product.name} is on ${product.discount}% discount!`;
    const body = `Now only ₱${product.discountedPrice} - Save ₱${(product.price - product.discountedPrice).toFixed(2)}!`;
    
    const notificationData = {
      type: 'PRODUCT_DISCOUNT',
      productId: product._id,
      productName: product.name,
      image: product.images?.[0]?.url || null,
      discount: product.discount,
      price: product.price,
      discountedPrice: product.discountedPrice,
        screen: 'ProductDetails',
      screen: 'NotificationDetails'
    };

    // Always schedule the push notification first
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: notificationData,
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
        badge: 1,
      },
      trigger: null, // Send immediately
    });
    
    console.log('Push notification scheduled');

    // Then try to save to local DB if we have user data
    try {
      const userData = await SecureStore.getItemAsync('userData');
      const user = userData ? JSON.parse(userData) : null;

      if (user?.firebaseUid) {
        await saveNotification(
          user.firebaseUid,
          title,
          body,
          notificationData,
          'PRODUCT_DISCOUNT'
        );
        console.log('Notification saved to local DB');
      }
    } catch (dbError) {
      console.error('Error saving to local DB:', dbError);
      // Continue even if local save fails
    }

    return true;
  } catch (error) {
    console.error('Error in sendProductDiscountNotification:', error);
    throw error;
  }
};

// Helper function to get all users
const getAllUsers = async () => {
  try {
    const token = await SecureStore.getItemAsync('jwt');
    const currentUserData = await SecureStore.getItemAsync('userData');
    const currentUser = currentUserData ? JSON.parse(currentUserData) : null;

    console.log('Current user:', currentUser);

    if (!currentUser || !currentUser.firebaseUid) {
      console.log('No valid current user found');
      return [];
    }

    const response = await axios.get(`${baseUrl}/auth/users`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    // If we can't get other users, at least notify the current user
    if (!response.data.users || response.data.users.length === 0) {
      console.log('No users found in response, using current user');
      return [currentUser];
    }

    // Include current user in notifications
    const allUsers = response.data.users.map(user => ({
      ...user,
      firebaseUid: user.firebaseUid || user.uid || null
    }));

    // Add current user if not already included
    if (!allUsers.some(user => user.firebaseUid === currentUser.firebaseUid)) {
      allUsers.push(currentUser);
    }

    const validUsers = allUsers.filter(user => user.firebaseUid);
    console.log(`Found ${validUsers.length} users with valid firebaseUid`);

    return validUsers;
  } catch (error) {
    console.error('Error fetching users:', error);
    // Fallback to current user
    const currentUserData = await SecureStore.getItemAsync('userData');
    const currentUser = currentUserData ? JSON.parse(currentUserData) : null;
    return currentUser?.firebaseUid ? [currentUser] : [];
  }
};